const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const STORAGE_SUBDIR = 'snap-sos';

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  if (!req) return '';
  return `${req.protocol}://${req.get('host')}`;
}

async function storeImageFile(file, req) {
  if (!file || !file.buffer) {
    throw new Error('Missing image file buffer');
  }

  const extension = path.extname(file.originalname || '') || '.jpg';
  const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const relativeDir = path.join('public', STORAGE_SUBDIR);
  const absoluteDir = path.join(process.cwd(), relativeDir);
  await fs.mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, fileName);
  await fs.writeFile(absolutePath, file.buffer);

  const publicUrl = `${getPublicBaseUrl(req)}/${STORAGE_SUBDIR}/${fileName}`;
  return {
    provider: 'local',
    key: `${STORAGE_SUBDIR}/${fileName}`,
    publicUrl,
  };
}

module.exports = {
  storeImageFile,
};
