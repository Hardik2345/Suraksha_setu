const crypto = require('crypto');
const exifr = require('exifr');

async function extractImageMetadata(file) {
  if (!file?.buffer) {
    return {
      imageHash: null,
      exifLocation: null,
      exifCapturedAt: null,
      metadataStatus: 'missing-file',
    };
  }

  const imageHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

  let exif = null;
  try {
    exif = await exifr.parse(file.buffer, {
      gps: true,
      tiff: true,
      exif: true,
      ifd0: false,
      xmp: false,
      icc: false,
      iptc: false,
    });
  } catch (_error) {
    return {
      imageHash,
      exifLocation: null,
      exifCapturedAt: null,
      metadataStatus: 'malformed-exif',
    };
  }

  const latitude = exif?.latitude;
  const longitude = exif?.longitude;
  const exifLocation = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      }
    : null;

  const dateCandidate = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate || null;
  const exifCapturedAt = dateCandidate ? new Date(dateCandidate) : null;

  let metadataStatus = 'missing-exif';
  if (exifLocation && exifCapturedAt) metadataStatus = 'gps-and-time-present';
  else if (exifLocation) metadataStatus = 'gps-present';
  else if (exifCapturedAt) metadataStatus = 'time-present';

  return {
    imageHash,
    exifLocation,
    exifCapturedAt: exifCapturedAt && !Number.isNaN(exifCapturedAt.getTime()) ? exifCapturedAt : null,
    metadataStatus,
  };
}

module.exports = {
  extractImageMetadata,
};
