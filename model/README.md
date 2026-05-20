# Model Evaluation

This directory now contains a minimal evaluator for the Keras model at `disaster_cnn_model_v1.h5`.

## FastAPI inference service

The backend integration expects a Python service that exposes `POST /predict`.

Start it from this directory with:

```bash
uvicorn inference_service:app --host 0.0.0.0 --port 8001 --reload
```

Available endpoints:

- `GET /health`
- `POST /predict` with multipart field `image`

The service is hard-coded to the production preprocessing path:

- resize to `224x224`
- convert to RGB array
- divide by `255.0`
- batch dimension

Class order:

```text
earthquake, fire, flood, landslide, normal, smoke
```

## Single-image inference

If you only want to verify that the model loads and predicts on one image, use:

```bash
python predict_image.py --image /absolute/path/to/test_image.jpg
```

If you know the output class order, pass it explicitly:

```bash
python predict_image.py \
  --image /absolute/path/to/test_image.jpg \
  --class-names flood,fire,earthquake,landslide,cyclone,urban-fire
```

Optional flags:

```bash
python predict_image.py \
  --image /absolute/path/to/test_image.jpg \
  --image-size 224 224 \
  --top-k 6 \
  --output-json prediction.json
```

It prints:

- predicted class
- top-k predictions
- raw per-class probabilities

If the model outputs logits instead of probabilities, the script applies `softmax` automatically.

## Expected dataset layout

Use a folder-organized evaluation dataset:

```text
your_eval_dataset/
  class_1/
    image_001.jpg
    image_002.jpg
  class_2/
    image_101.jpg
  class_3/
    ...
```

Folder names become class labels unless you pass `--class-names`.

## Recommended Python version

Use Python `3.10`, `3.11`, or `3.12`.

Your current local `python3` is `3.14`, which TensorFlow usually does not support yet. Create a separate virtual environment with a supported Python version before installing dependencies.

## Setup

```bash
cd model
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python evaluate_model.py --data /absolute/path/to/eval_dataset
```

Optional flags:

```bash
python evaluate_model.py \
  --data /absolute/path/to/eval_dataset \
  --image-size 224 224 \
  --batch-size 32 \
  --class-names flood,fire,earthquake,landslide,cyclone,urban-fire \
  --output-json evaluation_report.json
```

## What it reports

- aggregate loss and accuracy
- per-class accuracy
- confusion matrix

This is enough to validate whether the model is usable before designing the inference API.
