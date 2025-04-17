import os
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2
from PIL import Image
from dotenv import load_dotenv
from backend.obj_detec import OBBModule

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Table Detection API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the object detection model
model_path = os.getenv("MODEL_PATH", "/home/nnpy/projects/icoffee/bench-marking-tool/backend/dynamic_quantized_21.onnx")
detector = OBBModule(model_path=model_path)

# Request body for prediction
class PredictRequest(BaseModel):
    image: str  # base64-encoded PNG/JPEG image

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        # Decode base64 image to OpenCV format
        img_data = base64.b64decode(request.image)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        # Run detection
        result = detector.detect_bbox(pil_img)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
