#!/usr/bin/env python3
"""Run single-image inference against a Keras `.h5` classifier."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run single-image inference for a Keras `.h5` model.")
    parser.add_argument(
        "--image",
        required=True,
        help="Path to the image file to classify.",
    )
    parser.add_argument(
        "--model",
        default="disaster_cnn_model_v1.h5",
        help="Path to the `.h5` Keras model. Defaults to the model in this directory.",
    )
    parser.add_argument(
        "--image-size",
        type=int,
        nargs=2,
        metavar=("HEIGHT", "WIDTH"),
        default=None,
        help="Override input image size if the model shape is dynamic or needs manual control.",
    )
    parser.add_argument(
        "--class-names",
        default=None,
        help="Comma-separated class names in output order. Example: flood,fire,earthquake,...",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=3,
        help="How many top predictions to print. Default: 3.",
    )
    parser.add_argument(
        "--output-json",
        default=None,
        help="Optional path to save the prediction output as JSON.",
    )
    return parser.parse_args()


def resolve_model_path(model_arg: str) -> Path:
    script_dir = Path(__file__).resolve().parent
    model_path = Path(model_arg)
    if not model_path.is_absolute():
        model_path = (script_dir / model_path).resolve()
    return model_path


def infer_image_size(model: tf.keras.Model, override: tuple[int, int] | None) -> tuple[int, int]:
    if override:
        return int(override[0]), int(override[1])

    input_shape = model.input_shape
    if isinstance(input_shape, list):
        input_shape = input_shape[0]

    if len(input_shape) != 4:
        raise ValueError(f"Expected 4D image input shape, got {input_shape!r}")

    height, width = input_shape[1], input_shape[2]
    if height is None or width is None:
        raise ValueError("Model input shape is dynamic. Pass --image-size HEIGHT WIDTH explicitly.")

    return int(height), int(width)


def load_and_prepare_image(image_path: Path, image_size: tuple[int, int]) -> np.ndarray:
    image = tf.keras.utils.load_img(image_path, target_size=image_size)
    array = tf.keras.utils.img_to_array(image)
    array = array / 255.0
    array = np.expand_dims(array, axis=0)
    return array


def ensure_probabilities(prediction: np.ndarray) -> np.ndarray:
    values = np.squeeze(prediction)
    if values.ndim != 1:
        raise ValueError(f"Expected model output to resolve to a 1D vector, got shape {values.shape!r}")

    total = float(np.sum(values))
    if np.all(values >= 0) and 0.99 <= total <= 1.01:
        return values

    return tf.nn.softmax(values).numpy()


def default_class_names(num_classes: int) -> list[str]:
    return [f"class_{index}" for index in range(num_classes)]


def main() -> int:
    args = parse_args()
    image_path = Path(args.image).expanduser().resolve()
    model_path = resolve_model_path(args.model)

    if not image_path.exists():
        print(f"Image file not found: {image_path}", file=sys.stderr)
        return 1

    if not model_path.exists():
        print(f"Model file not found: {model_path}", file=sys.stderr)
        return 1

    model = tf.keras.models.load_model(model_path)
    image_size = infer_image_size(model, tuple(args.image_size) if args.image_size else None)
    image_batch = load_and_prepare_image(image_path, image_size)

    raw_prediction = model.predict(image_batch, verbose=0)
    probabilities = ensure_probabilities(raw_prediction)

    if args.class_names:
        class_names = [name.strip() for name in args.class_names.split(",") if name.strip()]
        if len(class_names) != len(probabilities):
            print(
                f"Class name count ({len(class_names)}) does not match model output size ({len(probabilities)}).",
                file=sys.stderr,
            )
            return 1
    else:
        class_names = default_class_names(len(probabilities))

    top_k = max(1, min(args.top_k, len(probabilities)))
    top_indices = np.argsort(probabilities)[::-1][:top_k]

    predictions = [
        {
            "rank": rank + 1,
            "class_index": int(index),
            "class_name": class_names[int(index)],
            "probability": float(probabilities[int(index)]),
        }
        for rank, index in enumerate(top_indices)
    ]

    result = {
        "image_path": str(image_path),
        "model_path": str(model_path),
        "image_size": list(image_size),
        "predicted_class_index": predictions[0]["class_index"],
        "predicted_class_name": predictions[0]["class_name"],
        "predicted_probability": predictions[0]["probability"],
        "top_predictions": predictions,
        "raw_probabilities": [
            {
                "class_index": index,
                "class_name": class_names[index],
                "probability": float(probability),
            }
            for index, probability in enumerate(probabilities)
        ],
    }

    print("\nSingle-image inference complete\n")
    print(f"Image: {image_path}")
    print(f"Model: {model_path}")
    print(f"Input size: {image_size[0]}x{image_size[1]}")
    print(f"Predicted class: {result['predicted_class_name']} (index {result['predicted_class_index']})")
    print(f"Predicted probability: {result['predicted_probability']:.4f}")
    print("\nTop predictions:")
    for item in predictions:
        print(
            f"  {item['rank']}. {item['class_name']} "
            f"(index {item['class_index']}): {item['probability']:.4f}"
        )

    if args.output_json:
        output_path = Path(args.output_json).expanduser().resolve()
        output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
        print(f"\nSaved JSON output to {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
