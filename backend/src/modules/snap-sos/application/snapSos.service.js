const SOS = require('../../../../models/SOS');
const IncidentCluster = require('../../../../models/IncidentCluster');
const SnapSOSAnalysis = require('../../../../models/SnapSOSAnalysis');
const { reverseGeocodeCoordinates } = require('../../../shared/integrations/googleGeocoding');
const { predictDisasterImage } = require('../../../shared/integrations/modelInference');
const { fetchWeatherContext } = require('../../../shared/integrations/weather');
const { extractImageMetadata } = require('../../../shared/integrations/imageMetadata');
const { storeImageFile } = require('../../../shared/storage/objectStorage');

const CLUSTER_RADIUS_METERS = 2000;
const CLUSTER_WINDOW_MS = 90 * 60 * 1000;
const DUPLICATE_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

function clampScore(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function distanceInMeters(firstCoordinates, secondCoordinates) {
  if (!Array.isArray(firstCoordinates) || !Array.isArray(secondCoordinates)) return null;

  const [lng1, lat1] = firstCoordinates.map(Number);
  const [lng2, lat2] = secondCoordinates.map(Number);
  if ([lng1, lat1, lng2, lat2].some((value) => Number.isNaN(value))) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function normalizeLocation(location) {
  let parsedLocation = location;
  if (typeof parsedLocation === 'string') {
    try {
      parsedLocation = JSON.parse(parsedLocation);
    } catch (_error) {
      return null;
    }
  }

  if (!parsedLocation || parsedLocation.type !== 'Point' || !Array.isArray(parsedLocation.coordinates) || parsedLocation.coordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = parsedLocation.coordinates.map(Number);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;

  return {
    type: 'Point',
    coordinates: [lng, lat],
    address: parsedLocation.address,
    city: parsedLocation.city,
    state: parsedLocation.state,
    pincode: parsedLocation.pincode,
  };
}

async function enrichLocation(location) {
  const normalized = normalizeLocation(location);
  if (!normalized) return null;

  if (normalized.address || normalized.city || normalized.state || normalized.pincode) {
    return normalized;
  }

  try {
    const [lng, lat] = normalized.coordinates;
    const geocoded = await reverseGeocodeCoordinates({ lat, lng });
    if (geocoded) {
      return { ...normalized, ...geocoded };
    }
  } catch (_error) {
    // Best-effort enrichment only.
  }

  return normalized;
}

function computeWeatherScore(predictedClass, weatherContext) {
  const precipitation = Number(weatherContext?.precipitationMm || 0);
  const wind = Number(weatherContext?.windSpeedKph || 0);
  const temperature = Number(weatherContext?.temperatureC || 0);

  switch (predictedClass) {
    case 'flood':
      return clampScore(0.3 + Math.min(0.7, precipitation / 15));
    case 'landslide':
      return clampScore(0.25 + Math.min(0.75, precipitation / 18));
    case 'fire':
      return clampScore(0.25 + Math.min(0.35, Math.max(temperature - 28, 0) / 18) + Math.min(0.4, wind / 45));
    case 'smoke':
      return clampScore(0.2 + Math.min(0.3, Math.max(temperature - 26, 0) / 20) + Math.min(0.3, wind / 50));
    case 'earthquake':
      return 0.5;
    case 'normal':
      return 0.15;
    default:
      return 0.5;
  }
}

function computeQualityScore(file, location) {
  let score = 0;
  if (file?.buffer?.length) score += 0.45;
  if (file?.mimetype?.startsWith('image/')) score += 0.15;
  if (file?.size && file.size >= 50 * 1024) score += 0.15;
  if (location?.coordinates?.length === 2) score += 0.25;
  return clampScore(score);
}

async function findRecentDuplicate(imageHash) {
  if (!imageHash) return null;
  const createdAfter = new Date(Date.now() - DUPLICATE_LOOKBACK_MS);

  const [recentAnalysis, recentSOS] = await Promise.all([
    SnapSOSAnalysis.findOne({ imageHash, createdAt: { $gte: createdAfter } }).sort({ createdAt: -1 }),
    SOS.findOne({ imageHash, createdAt: { $gte: createdAfter } }).sort({ createdAt: -1 }),
  ]);

  if (!recentAnalysis) return recentSOS;
  if (!recentSOS) return recentAnalysis;

  return recentAnalysis.createdAt > recentSOS.createdAt ? recentAnalysis : recentSOS;
}

async function computeUserTrust(userId) {
  const createdAfter = new Date(Date.now() - 60 * 60 * 1000);
  const recentAnalysisCount = await SnapSOSAnalysis.countDocuments({ userId, createdAt: { $gte: createdAfter } });
  if (recentAnalysisCount >= 5) return 0.2;
  if (recentAnalysisCount >= 3) return 0.35;
  if (recentAnalysisCount >= 2) return 0.55;
  return 0.8;
}

function computeExifLocationMatch(clientLocation, exifLocation) {
  if (!exifLocation?.coordinates || !clientLocation?.coordinates) {
    return { score: 0.5, mismatchMeters: null, flags: [], metadataStatus: 'missing-exif-location' };
  }

  const mismatchMeters = distanceInMeters(clientLocation.coordinates, exifLocation.coordinates);
  if (mismatchMeters === null) {
    return { score: 0.5, mismatchMeters: null, flags: ['exif-location-invalid'], metadataStatus: 'missing-exif-location' };
  }

  if (mismatchMeters <= 100) {
    return { score: 1, mismatchMeters, flags: [], metadataStatus: 'location-match-strong' };
  }
  if (mismatchMeters <= 500) {
    return { score: 0.85, mismatchMeters, flags: [], metadataStatus: 'location-match-good' };
  }
  if (mismatchMeters <= 2000) {
    return { score: 0.6, mismatchMeters, flags: [], metadataStatus: 'location-match-weak' };
  }
  if (mismatchMeters <= 10000) {
    return { score: 0.25, mismatchMeters, flags: ['gps-mismatch'], metadataStatus: 'gps-mismatch' };
  }

  return { score: 0.05, mismatchMeters, flags: ['gps-mismatch', 'gps-mismatch-severe'], metadataStatus: 'gps-mismatch-severe' };
}

function computeExifTimestampFreshness(exifCapturedAt) {
  if (!exifCapturedAt) {
    return { score: 0.5, flags: [], metadataStatus: 'missing-exif-time' };
  }

  const ageMs = Date.now() - exifCapturedAt.getTime();
  if (ageMs < 0) {
    return { score: 0.25, flags: ['future-timestamp'], metadataStatus: 'future-timestamp' };
  }
  if (ageMs <= 30 * 60 * 1000) {
    return { score: 1, flags: [], metadataStatus: 'timestamp-fresh' };
  }
  if (ageMs <= 6 * 60 * 60 * 1000) {
    return { score: 0.8, flags: [], metadataStatus: 'timestamp-recent' };
  }
  if (ageMs <= 24 * 60 * 60 * 1000) {
    return { score: 0.55, flags: ['stale-image'], metadataStatus: 'timestamp-stale' };
  }
  if (ageMs <= 7 * 24 * 60 * 60 * 1000) {
    return { score: 0.2, flags: ['stale-image', 'stale-image-severe'], metadataStatus: 'timestamp-old' };
  }

  return { score: 0.05, flags: ['stale-image', 'stale-image-severe'], metadataStatus: 'timestamp-very-old' };
}

function computeDuplicateImageScore(duplicateRecord, userId) {
  if (!duplicateRecord) {
    return { score: 1, flags: [], isDuplicate: false };
  }

  const sameUser = duplicateRecord.userId && String(duplicateRecord.userId) === String(userId);
  return {
    score: sameUser ? 0.05 : 0.15,
    flags: sameUser ? ['duplicate-image', 'duplicate-same-user'] : ['duplicate-image'],
    isDuplicate: true,
  };
}

async function findMatchingCluster(canonicalClass, coordinates) {
  const windowStart = new Date(Date.now() - CLUSTER_WINDOW_MS);
  return IncidentCluster.findOne({
    canonicalClass,
    lastReportAt: { $gte: windowStart },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: CLUSTER_RADIUS_METERS,
      },
    },
  }).sort({ lastReportAt: -1 });
}

function computeCrowdScore(cluster, userId, duplicateInfo) {
  if (!cluster) return 0;
  if (duplicateInfo?.isDuplicate) return 0;

  const uniqueReporterIds = (cluster.uniqueReporterIds || []).map((id) => String(id));
  const isExistingReporter = uniqueReporterIds.includes(String(userId));
  const uniqueCount = cluster.uniqueReporterCount || uniqueReporterIds.length || 0;
  const reportCount = cluster.reportCount || 0;
  const effectiveCount = uniqueCount + (isExistingReporter ? 0 : 1) + Math.min(reportCount * 0.15, 1.5);
  return clampScore(1 - Math.exp(-0.45 * effectiveCount));
}

function computeTrustScore({ userTrust, exifLocationMatch, exifTimestampFreshness, duplicateImageScore }) {
  const trust = clampScore(
    0.35 * userTrust +
    0.25 * exifLocationMatch +
    0.20 * exifTimestampFreshness +
    0.20 * duplicateImageScore
  );

  return {
    userTrust: Number(userTrust.toFixed(4)),
    exifLocationMatch: Number(exifLocationMatch.toFixed(4)),
    exifTimestampFreshness: Number(exifTimestampFreshness.toFixed(4)),
    duplicateImageScore: Number(duplicateImageScore.toFixed(4)),
    overall: Number(trust.toFixed(4)),
  };
}

function computeConfidenceCap({ predictedClass, crowdScore, duplicateInfo, locationMatchInfo, timestampInfo }) {
  let cap = 0.9;

  if (predictedClass === 'normal') cap = Math.min(cap, 0.35);
  if (duplicateInfo?.isDuplicate) cap = Math.min(cap, 0.3);
  if ((locationMatchInfo?.mismatchMeters || 0) > 10000) cap = Math.min(cap, 0.4);
  else if ((locationMatchInfo?.mismatchMeters || 0) > 2000) cap = Math.min(cap, 0.4);
  if (timestampInfo?.metadataStatus === 'timestamp-old' || timestampInfo?.metadataStatus === 'timestamp-very-old') {
    cap = Math.min(cap, 0.55);
  }
  if (crowdScore < 0.2) cap = Math.min(cap, 0.65);

  return Number(cap.toFixed(4));
}

function computeConfidenceBreakdown({ predictedClass, topClassProbability, weatherScore, crowdScore, qualityScore, trustScore, confidenceCap }) {
  const visualEvidence = predictedClass === 'normal'
    ? clampScore(Math.min(topClassProbability, 0.35))
    : clampScore(topClassProbability);

  const rawOverall = clampScore(
    0.35 * visualEvidence +
    0.15 * weatherScore +
    0.25 * crowdScore +
    0.10 * qualityScore +
    0.15 * trustScore
  );

  const overall = Math.min(rawOverall, confidenceCap);

  return {
    model: Number(visualEvidence.toFixed(4)),
    weather: Number(weatherScore.toFixed(4)),
    crowd: Number(crowdScore.toFixed(4)),
    quality: Number(qualityScore.toFixed(4)),
    trust: Number(trustScore.toFixed(4)),
    rawOverall: Number(rawOverall.toFixed(4)),
    overall: Number(overall.toFixed(4)),
    confidenceCap: Number(confidenceCap.toFixed(4)),
  };
}

function getSuggestedReviewStatus(predictedClass, confidenceScore) {
  if (predictedClass === 'normal' || confidenceScore < 0.45) return 'normal-review';
  return 'snap-analyzed';
}

async function analyzeSnapSOS(user, payload, file, req) {
  const normalizedLocation = await enrichLocation(payload.location);
  if (!normalizedLocation) {
    return { status: 400, body: { message: 'A valid GeoJSON location is required' } };
  }

  if (!file) {
    return { status: 400, body: { message: 'Image upload is required' } };
  }

  const storedImage = await storeImageFile(file, req);
  const metadata = await extractImageMetadata(file);
  const prediction = await predictDisasterImage(file);
  const [lng, lat] = normalizedLocation.coordinates;
  const weatherContext = await fetchWeatherContext({ lat, lng });
  const duplicateRecord = await findRecentDuplicate(metadata.imageHash);
  const existingCluster = await findMatchingCluster(prediction.predictedClass, normalizedLocation.coordinates);
  const qualityScore = computeQualityScore(file, normalizedLocation);
  const weatherScore = computeWeatherScore(prediction.predictedClass, weatherContext);
  const userTrust = await computeUserTrust(user._id);
  const locationMatchInfo = computeExifLocationMatch(normalizedLocation, metadata.exifLocation);
  const timestampInfo = computeExifTimestampFreshness(metadata.exifCapturedAt);
  const duplicateInfo = computeDuplicateImageScore(duplicateRecord, user._id);
  const trustBreakdown = computeTrustScore({
    userTrust,
    exifLocationMatch: locationMatchInfo.score,
    exifTimestampFreshness: timestampInfo.score,
    duplicateImageScore: duplicateInfo.score,
  });
  const crowdScore = computeCrowdScore(existingCluster, user._id, duplicateInfo);
  const confidenceCap = computeConfidenceCap({
    predictedClass: prediction.predictedClass,
    crowdScore,
    duplicateInfo,
    locationMatchInfo,
    timestampInfo,
  });
  const breakdown = computeConfidenceBreakdown({
    predictedClass: prediction.predictedClass,
    topClassProbability: prediction.topClassProbability,
    weatherScore,
    crowdScore,
    qualityScore,
    trustScore: trustBreakdown.overall,
    confidenceCap,
  });
  const suspicionFlags = Array.from(new Set([
    ...locationMatchInfo.flags,
    ...timestampInfo.flags,
    ...duplicateInfo.flags,
  ]));
  const metadataStatus = [
    metadata.metadataStatus,
    locationMatchInfo.metadataStatus,
    timestampInfo.metadataStatus,
  ].filter(Boolean).join('|');

  const analysis = await SnapSOSAnalysis.create({
    userId: user._id,
    imageUrl: storedImage.publicUrl,
    clientLocation: normalizedLocation,
    location: normalizedLocation,
    predictedClass: prediction.predictedClass,
    classProbabilities: prediction.classProbabilities,
    topClassProbability: prediction.topClassProbability,
    modelVersion: prediction.modelVersion || 'disaster_cnn_model_v1',
    weatherContext,
    confidenceScore: breakdown.overall,
    confidenceBreakdown: {
      model: breakdown.model,
      weather: breakdown.weather,
      crowd: breakdown.crowd,
      quality: breakdown.quality,
      trust: breakdown.trust,
    },
    qualityScore,
    trustScore: trustBreakdown.overall,
    trustBreakdown: {
      userTrust: trustBreakdown.userTrust,
      exifLocationMatch: trustBreakdown.exifLocationMatch,
      exifTimestampFreshness: trustBreakdown.exifTimestampFreshness,
      duplicateImageScore: trustBreakdown.duplicateImageScore,
    },
    confidenceCap,
    metadataStatus,
    exifLocation: metadata.exifLocation || undefined,
    exifCapturedAt: metadata.exifCapturedAt || undefined,
    imageHash: metadata.imageHash,
    locationMismatchMeters: locationMatchInfo.mismatchMeters,
    suspicionFlags,
    suggestedType: prediction.predictedClass,
    clusterPreview: existingCluster ? {
      clusterId: existingCluster._id,
      reportCount: existingCluster.reportCount,
      uniqueReporterCount: existingCluster.uniqueReporterCount,
      aggregateConfidence: existingCluster.aggregateConfidence,
    } : undefined,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  return {
    status: 200,
    body: {
      success: true,
      data: {
        analysisId: analysis._id,
        imageUrl: analysis.imageUrl,
        predictedClass: analysis.predictedClass,
        classProbabilities: Object.fromEntries(analysis.classProbabilities),
        topClassProbability: analysis.topClassProbability,
        modelVersion: analysis.modelVersion,
        weatherContext: analysis.weatherContext,
        confidenceScore: analysis.confidenceScore,
        confidenceBreakdown: analysis.confidenceBreakdown,
        trustScore: analysis.trustScore,
        trustBreakdown: analysis.trustBreakdown,
        confidenceCap: analysis.confidenceCap,
        suspicionFlags: analysis.suspicionFlags || [],
        metadataStatus: analysis.metadataStatus,
        suggestedType: analysis.suggestedType,
        reviewStatus: getSuggestedReviewStatus(analysis.predictedClass, analysis.confidenceScore),
        clusterPreview: analysis.clusterPreview || null,
        location: analysis.location,
      },
    },
  };
}

function inferSeverity(type, confidenceScore, suspicionFlags = []) {
  if (suspicionFlags.length > 0 && confidenceScore < 0.55) return 'low';
  if (type === 'earthquake' || confidenceScore >= 0.85) return 'critical';
  if (type === 'fire' || type === 'flood' || type === 'landslide' || type === 'smoke' || confidenceScore >= 0.7) {
    return 'high';
  }
  if (confidenceScore >= 0.45) return 'medium';
  return 'low';
}

async function createOrUpdateCluster({ analysis, sos, selectedType, confidenceScore }) {
  let cluster = await findMatchingCluster(selectedType, analysis.location.coordinates);

  if (!cluster) {
    cluster = await IncidentCluster.create({
      canonicalClass: selectedType,
      location: {
        type: 'Point',
        coordinates: analysis.location.coordinates,
      },
      windowStart: new Date(Date.now() - CLUSTER_WINDOW_MS),
      windowEnd: new Date(Date.now() + CLUSTER_WINDOW_MS),
      reportCount: 0,
      uniqueReporterCount: 0,
      aggregateConfidence: 0,
      linkedSOSIds: [],
      uniqueReporterIds: [],
      lastReportAt: new Date(),
    });
  }

  const userId = String(sos.userId);
  const uniqueReporterIds = (cluster.uniqueReporterIds || []).map((id) => String(id));
  const linkedSOSIds = new Set((cluster.linkedSOSIds || []).map((id) => String(id)));
  linkedSOSIds.add(String(sos._id));

  if (!uniqueReporterIds.includes(userId)) {
    cluster.uniqueReporterIds.push(sos.userId);
  }

  cluster.linkedSOSIds = Array.from(linkedSOSIds);
  cluster.reportCount = cluster.linkedSOSIds.length;
  cluster.uniqueReporterCount = cluster.uniqueReporterIds.length;
  cluster.lastReportAt = new Date();

  const existingWeight = Math.max(cluster.reportCount - 1, 0);
  const confidenceContribution = (sos.suspicionFlags?.length || 0) > 0 ? Math.min(confidenceScore, 0.45) : confidenceScore;
  const weightedConfidence = ((cluster.aggregateConfidence || 0) * existingWeight) + confidenceContribution;
  cluster.aggregateConfidence = Number((weightedConfidence / Math.max(cluster.reportCount, 1)).toFixed(4));

  await cluster.save();
  return cluster;
}

async function confirmSnapSOS(user, payload) {
  const { analysisId, type, description, contactNumber } = payload;
  if (!analysisId) {
    return { status: 400, body: { message: 'analysisId is required' } };
  }

  const analysis = await SnapSOSAnalysis.findById(analysisId);
  if (!analysis || String(analysis.userId) !== String(user._id)) {
    return { status: 404, body: { message: 'Snap SOS analysis not found' } };
  }

  if (analysis.expiresAt < new Date()) {
    return { status: 410, body: { message: 'Snap SOS analysis has expired. Please analyze the image again.' } };
  }

  const selectedType = type || analysis.suggestedType;
  const hasSuspicionFlags = Array.isArray(analysis.suspicionFlags) && analysis.suspicionFlags.length > 0;
  const reviewStatus = selectedType === 'normal' || hasSuspicionFlags ? 'normal-review' : 'snap-confirmed';
  const severity = inferSeverity(selectedType, analysis.confidenceScore, analysis.suspicionFlags);

  const sos = await SOS.create({
    userId: user._id,
    type: selectedType,
    userConfirmedType: selectedType,
    severity,
    description: description || `Snap SOS reported as ${selectedType}`,
    location: analysis.location,
    contactNumber: contactNumber || user.phone,
    source: 'snap',
    imageUrl: analysis.imageUrl,
    clientLocation: analysis.clientLocation,
    modelPrediction: analysis.predictedClass,
    modelProbabilities: analysis.classProbabilities,
    modelTopScore: analysis.topClassProbability,
    modelVersion: analysis.modelVersion,
    weatherContext: analysis.weatherContext,
    confidenceScore: analysis.confidenceScore,
    confidenceBreakdown: analysis.confidenceBreakdown,
    trustScore: analysis.trustScore,
    trustBreakdown: analysis.trustBreakdown,
    confidenceCap: analysis.confidenceCap,
    metadataStatus: analysis.metadataStatus,
    exifLocation: analysis.exifLocation,
    exifCapturedAt: analysis.exifCapturedAt,
    imageHash: analysis.imageHash,
    locationMismatchMeters: analysis.locationMismatchMeters,
    suspicionFlags: analysis.suspicionFlags,
    reviewStatus,
  });

  const cluster = await createOrUpdateCluster({
    analysis,
    sos,
    selectedType,
    confidenceScore: analysis.confidenceScore,
  });

  sos.clusterId = cluster._id;
  await sos.save();

  await SnapSOSAnalysis.findByIdAndDelete(analysisId);

  return {
    status: 201,
    body: {
      success: true,
      data: sos,
      cluster: {
        _id: cluster._id,
        canonicalClass: cluster.canonicalClass,
        reportCount: cluster.reportCount,
        uniqueReporterCount: cluster.uniqueReporterCount,
        aggregateConfidence: cluster.aggregateConfidence,
      },
    },
  };
}

module.exports = {
  analyzeSnapSOS,
  confirmSnapSOS,
};
