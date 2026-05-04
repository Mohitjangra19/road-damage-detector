from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import os

app = Flask(__name__)

# CORS
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'

# Folders
UPLOAD_FOLDER = "static/uploads"
OUTPUT_FOLDER = "static/outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# 🔥 SAFE MODEL LOAD (Render-friendly)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

model = YOLO(MODEL_PATH)


@app.route("/")
def home():
    return "Backend Running"


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"})

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"})

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # YOLO prediction
    results = model.predict(
        source=file_path,
        conf=0.3,
        save=False, 
        device="cpu",
        verbose=False  
    )

    detections = []

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])

            x1, y1, x2, y2 = box.xyxy[0]

            detections.append({
                "class": model.names[cls_id],
                "confidence": round(conf, 2),
                "x": float(x1),
                "y": float(y1),
                "width": float(x2 - x1),
                "height": float(y2 - y1)
            })

    return jsonify({
        "message": "Detection done",
        "detections": detections
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))