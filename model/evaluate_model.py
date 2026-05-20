#!/usr/bin/env python3
"""Minimal evaluator for a Keras `.h5` image classification model.

Expected dataset layout:

dataset/
  class_a/
    img1.jpg
    img2.jpg
  class_b/
    img3.jpg
    ...

The script loads the model, builds a dataset from the directory structure,
evaluates aggregate accuracy/loss, and prints a simple confusion matrix.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a disaster classifier `.h5` model.")
    parser.add_argument(
        "--model",
        default="disaster_cnn_model_v1.h5",
        help="Path to the `.h5` Keras model. Defaults to the model in this directory.",
    )
    parser.add_argument(
        "--data",
        required=True,
        help="Path to a directory-organized evaluation dataset.",
    )
    parser.add_argument(
        "--image-size",
        type=int,
        nargs=2,
        metavar=("HEIGHT", "WIDTH"),
        default=None,
        help="Override input image size if the model shape is dynamic or unclear.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size for evaluation. Default: 32.",
    )
    parser.add_argument(
        "--class-names",
        default=None,
        help="Optional comma-separated class names. If omitted, names come from folder names.",
    )
    parser.add_argument(
        "--output-json",
        default=None,
        help="Optional path to write the evaluation report as JSON.",
    )
    return parser.parse_args()


def resolve_paths(args: argparse.Namespace) -> tuple[Path, Path]:
    script_dir = Path(__file__).resolve().parent
    model_path = Path(args.model)
    if not model_path.is_absolute():
        model_path = (script_dir / model_path).resolve()

    data_path = Path(args.data).expanduser().resolve()
    return model_path, data_path


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
        raise ValueError(
            "Model input shape is dynamic. Pass --image-size HEIGHT WIDTH explicitly."
        )

    return int(height), int(width)


def build_dataset(
    data_path: Path,
    image_size: tuple[int, int],
    batch_size: int,
    class_names: list[str] | None,
) -> tf.data.Dataset:
    dataset = tf.keras.utils.image_dataset_from_directory(
        data_path,
        labels="inferred",
        label_mode="int",
        batch_size=batch_size,
        image_size=image_size,
        shuffle=False,
        class_names=class_names,
    )
    return dataset.prefetch(buffer_size=tf.data.AUTOTUNE)


def ensure_model_ready(model: tf.keras.Model) -> None:
    if model.loss:
        return

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )


def evaluate_model(model: tf.keras.Model, dataset: tf.data.Dataset) -> dict:
    metrics = model.evaluate(dataset, verbose=1, return_dict=True)

    probabilities = model.predict(dataset, verbose=1)
    predicted_labels = np.argmax(probabilities, axis=1)

    true_labels = np.concatenate([labels.numpy() for _, labels in dataset], axis=0)
    return {
        "metrics": {key: float(value) for key, value in metrics.items()},
        "true_labels": true_labels,
        "predicted_labels": predicted_labels,
        "probabilities": probabilities,
    }


def compute_confusion_matrix(
    true_labels: np.ndarray,
    predicted_labels: np.ndarray,
    num_classes: int,
) -> np.ndarray:
    matrix = np.zeros((num_classes, num_classes), dtype=int)
    for truth, pred in zip(true_labels, predicted_labels, strict=False):
        matrix[int(truth), int(pred)] += 1
    return matrix


def summarize_by_class(confusion: np.ndarray, class_names: list[str]) -> list[dict]:
    rows = []
    for index, class_name in enumerate(class_names):
        total = int(confusion[index].sum())
        correct = int(confusion[index, index])
        accuracy = (correct / total) if total else 0.0
        rows.append(
            {
                "class_name": class_name,
                "samples": total,
                "correct": correct,
                "accuracy": round(accuracy, 4),
            }
        )
    return rows


def print_report(
    model_path: Path,
    data_path: Path,
    class_names: list[str],
    metrics: dict,
    confusion: np.ndarray,
    per_class: list[dict],
) -> None:
    print("\nModel evaluation complete\n")
    print(f"Model: {model_path}")
    print(f"Dataset: {data_path}")
    print(f"Classes: {', '.join(class_names)}")
    print("\nAggregate metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value:.4f}")

    print("\nPer-class accuracy:")
    for row in per_class:
        print(
            f"  {row['class_name']}: accuracy={row['accuracy']:.4f} "
            f"({row['correct']}/{row['samples']})"
        )

    print("\nConfusion matrix (rows=true, cols=pred):")
    header = " " * 16 + " ".join(f"{name[:12]:>12}" for name in class_names)
    print(header)
    for class_name, values in zip(class_names, confusion, strict=False):
        row_values = " ".join(f"{value:>12}" for value in values)
        print(f"{class_name[:14]:>14}  {row_values}")


def main() -> int:
    args = parse_args()
    model_path, data_path = resolve_paths(args)

    if not model_path.exists():
        print(f"Model file not found: {model_path}", file=sys.stderr)
        return 1

    if not data_path.exists():
        print(f"Dataset directory not found: {data_path}", file=sys.stderr)
        return 1

    model = tf.keras.models.load_model(model_path)
    image_size = infer_image_size(model, tuple(args.image_size) if args.image_size else None)

    class_names = None
    if args.class_names:
        class_names = [name.strip() for name in args.class_names.split(",") if name.strip()]

    dataset = build_dataset(
        data_path=data_path,
        image_size=image_size,
        batch_size=args.batch_size,
        class_names=class_names,
    )

    ensure_model_ready(model)
    results = evaluate_model(model, dataset)

    resolved_class_names = list(dataset.class_names)
    confusion = compute_confusion_matrix(
        true_labels=results["true_labels"],
        predicted_labels=results["predicted_labels"],
        num_classes=len(resolved_class_names),
    )
    per_class = summarize_by_class(confusion, resolved_class_names)

    print_report(
        model_path=model_path,
        data_path=data_path,
        class_names=resolved_class_names,
        metrics=results["metrics"],
        confusion=confusion,
        per_class=per_class,
    )

    if args.output_json:
        payload = {
            "model_path": str(model_path),
            "data_path": str(data_path),
            "image_size": list(image_size),
            "class_names": resolved_class_names,
            "metrics": results["metrics"],
            "per_class": per_class,
            "confusion_matrix": confusion.tolist(),
        }
        output_path = Path(args.output_json).expanduser().resolve()
        output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"\nSaved JSON report to {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
