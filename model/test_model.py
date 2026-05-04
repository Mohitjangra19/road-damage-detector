from ultralytics import YOLO
import os

# Load trained model
model = YOLO("models/best.pt")

# Test image path  
 # keep test image inside model/data/
image_path = "data/RDD_SPLIT/test/images/China_Drone_000008.jpg"  # for linux/macOS

# Run prediction
results = model.predict(
    source=image_path,
    save=True,
    conf=0.25
)

print("✅ Detection complete!")
print("Check output inside runs/detect/predict/")