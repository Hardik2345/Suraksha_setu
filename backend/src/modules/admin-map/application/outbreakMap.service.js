const SOS = require('../../../../models/SOS');
const { DISASTER_TYPES } = require('../../../../models/SOS');

const ACTIVE_STATUSES = ['pending', 'acknowledged', 'in-progress'];
const VALID_STATUSES = [...ACTIVE_STATUSES, 'resolved'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const VALID_SOURCES = ['manual', 'snap'];
const MAX_LIMIT = 2000;
const DEFAULT_LIMIT = 1000;

function parseDate(value, fallback, field) {
  if (!value) return { value: fallback };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { error: `${field} must be a valid ISO date` };
  }

  return { value: parsed };
}

function parseLimit(value) {
  if (value === undefined) return DEFAULT_LIMIT;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return DEFAULT_LIMIT;

  return Math.min(parsed, MAX_LIMIT);
}

function parseBounds(bounds) {
  if (!bounds) return { value: null };

  const parts = String(bounds).split(',').map((value) => Number.parseFloat(value));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
    return { error: 'bounds must be provided as "west,south,east,north"' };
  }

  const [west, south, east, north] = parts;
  if (west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north) {
    return { error: 'bounds must contain valid west,south,east,north coordinates' };
  }

  return {
    value: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ]],
        },
      },
    },
  };
}

function buildQuery(filters) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const fromResult = parseDate(filters.from, defaultFrom, 'from');
  if (fromResult.error) return { error: fromResult.error };

  const toResult = parseDate(filters.to, now, 'to');
  if (toResult.error) return { error: toResult.error };

  if (fromResult.value > toResult.value) {
    return { error: 'from must be before to' };
  }

  const type = filters.type || 'all';
  if (type !== 'all' && !DISASTER_TYPES.includes(type)) {
    return { error: 'type must be a valid disaster type' };
  }

  const severity = filters.severity;
  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return { error: 'severity must be one of low, medium, high, critical' };
  }

  const source = filters.source;
  if (source && !VALID_SOURCES.includes(source)) {
    return { error: 'source must be either manual or snap' };
  }

  const status = filters.status || 'active';
  if (status !== 'active' && !VALID_STATUSES.includes(status)) {
    return { error: 'status must be active, pending, acknowledged, in-progress, or resolved' };
  }

  const boundsResult = parseBounds(filters.bounds);
  if (boundsResult.error) return { error: boundsResult.error };

  const query = {
    createdAt: { $gte: fromResult.value, $lte: toResult.value },
  };

  if (status === 'active') {
    query.status = { $in: ACTIVE_STATUSES };
  } else {
    query.status = status;
  }

  if (type === 'all') {
    query.type = { $ne: 'normal' };
  } else {
    query.type = type;
  }

  if (severity) query.severity = severity;
  if (source) query.source = source;
  if (boundsResult.value) query.location = boundsResult.value;

  return {
    query,
    normalizedFilters: {
      from: fromResult.value,
      to: toResult.value,
      status,
      type,
    },
    limit: parseLimit(filters.limit),
  };
}

function summarizeBy(items, key) {
  const counts = new Map();
  items.forEach((item) => {
    const value = item[key];
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([value, count]) => ({ [key]: value, count }));
}

function serializeReporter(user) {
  if (!user || typeof user === 'string') return undefined;

  return {
    name: user.name,
    phone: user.phone,
    email: user.email,
  };
}

function serializeIncident(sos) {
  return {
    id: sos._id.toString(),
    type: sos.type,
    severity: sos.severity,
    status: sos.status,
    source: sos.source || 'manual',
    coordinates: sos.location.coordinates,
    address: sos.location.address,
    city: sos.location.city,
    state: sos.location.state,
    description: sos.description,
    createdAt: sos.createdAt.toISOString(),
    confidenceScore: sos.confidenceScore,
    reporter: serializeReporter(sos.userId),
  };
}

async function getOutbreakMap(filters = {}) {
  const built = buildQuery(filters);
  if (built.error) {
    return {
      status: 400,
      body: { success: false, message: built.error },
    };
  }

  const reports = await SOS.find(built.query)
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(built.limit)
    .lean();

  const latest = reports[0];
  const incidents = reports
    .filter((report) => Array.isArray(report.location?.coordinates) && report.location.coordinates.length === 2)
    .map(serializeIncident);

  return {
    status: 200,
    body: {
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        filters: {
          from: built.normalizedFilters.from.toISOString(),
          to: built.normalizedFilters.to.toISOString(),
          status: built.normalizedFilters.status,
          type: built.normalizedFilters.type,
        },
        stats: {
          total: incidents.length,
          byType: summarizeBy(incidents, 'type'),
          bySeverity: summarizeBy(incidents, 'severity'),
          latestReportAt: latest && latest.createdAt ? latest.createdAt.toISOString() : undefined,
        },
        incidents,
      },
    },
  };
}

module.exports = {
  getOutbreakMap,
};
