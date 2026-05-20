#!/usr/bin/env python3
"""FastAPI inference service for the Snap SOS Keras model."""

from __future__ import annotations

import io
import time
from pathlib import Path

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel

CLASS_NAMES = ["earthquake", "fire", "flood", "landslide", "normal", "smoke"]
MODEL_VERSION = "disaster_cnn_model_v1"
IMAGE_SIZE = (224, 224)
MODEL_PATH = Path(__file__).resolve().parent / "disaster_cnn_model_v1.h5"


class PredictionResponse(BaseModel):
    predictedClass: str
    classProbabilities: dict[str, float]
    topClassProbability: float
    modelVersion: str
    inferenceLatencyMs: float


app = FastAPI(title="Snap SOS Inference Service", version="1.0.0")
model = tf.keras.models.load_model(MODEL_PATH)


def preprocess_image(contents: bytes) -> np.ndarray:
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=400, detail=f"Invalid image file: {exc}") from exc

    image = image.resize(IMAGE_SIZE)
    array = np.asarray(image, dtype=np.float32) / 255.0
    array = np.expand_dims(array, axis=0)
    return array


def ensure_probabilities(raw_prediction: np.ndarray) -> np.ndarray:
    values = np.squeeze(raw_prediction)
    total = float(np.sum(values))
    if np.all(values >= 0) and 0.99 <= total <= 1.01:
        return values

    return tf.nn.softmax(values).numpy()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "modelVersion": MODEL_VERSION}


@app.post("/predict", response_model=PredictionResponse)
async def predict(image: UploadFile = File(...)) -> PredictionResponse:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    batch = preprocess_image(contents)

    start = time.perf_counter()
    raw_prediction = model.predict(batch, verbose=0)
    latency_ms = (time.perf_counter() - start) * 1000

    probabilities = ensure_probabilities(raw_prediction)
    top_index = int(np.argmax(probabilities))
    probability_map = {
        class_name: round(float(probabilities[index]), 6)
        for index, class_name in enumerate(CLASS_NAMES)
    }

    return PredictionResponse(
        predictedClass=CLASS_NAMES[top_index],
        classProbabilities=probability_map,
        topClassProbability=round(float(probabilities[top_index]), 6),
        modelVersion=MODEL_VERSION,
        inferenceLatencyMs=round(latency_ms, 2),
    )
