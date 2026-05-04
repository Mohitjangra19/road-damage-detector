from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import os
import cv2

app = Flask(__name__)

# 🔥 ADD THIS
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'

UPLOAD_FOLDER = "static/uploads"
OUTPUT_FOLDER = "static/outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Load model
model = YOLO("../model/models/best.pt")


@app.route("/")
def home():
    return "Backend Running"


@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"})

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Run YOLO
    results = model.predict(source=file_path, conf=0.3)

    detections = []

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])

            # bounding box coordinates
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