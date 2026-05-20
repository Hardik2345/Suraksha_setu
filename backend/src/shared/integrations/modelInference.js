const MODEL_SERVICE_URL = process.env.SNAP_SOS_MODEL_SERVICE_URL || 'http://127.0.0.1:8001/predict';

class ModelInferenceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'ModelInferenceError';
    this.status = status;
  }
}

async function predictDisasterImage(file) {
  if (!file || !file.buffer) {
    throw new ModelInferenceError('Image file is required for inference', 400);
  }

  const formData = new FormData();
  const mimeType = file.mimetype || 'application/octet-stream';
  formData.append('image', new Blob([file.buffer], { type: mimeType }), file.originalname || 'upload.jpg');

  let response;
  try {
    response = await fetch(MODEL_SERVICE_URL, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    throw new ModelInferenceError(`Model service request failed: ${error.message}`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ModelInferenceError(`Model service error ${response.status}: ${text || 'Unknown error'}`);
  }

  const payload = await response.json();
  if (!payload.predictedClass || !payload.classProbabilities || typeof payload.topClassProbability !== 'number') {
    throw new ModelInferenceError('Model service response was missing required fields');
  }

  return payload;
}

module.exports = {
  ModelInferenceError,
  predictDisasterImage,
};
