from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pickle
import numpy as np
import os

app = FastAPI()

# Mount static folder
if not os.path.exists("static"):
    os.makedirs("static")
if not os.path.exists("templates"):
    os.makedirs("templates")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Load Models
try:
    with open("model (4).pkl", "rb") as f:
        model = pickle.load(f)
    with open("scaler (7).pkl", "rb") as f:
        scaler = pickle.load(f)
    with open("encoder (7).pkl", "rb") as f:
        encoder = pickle.load(f)
except Exception as e:
    print(f"Error loading models: {e}")

class PredictionRequest(BaseModel):
    Country: str
    ISO: str
    Region: str
    Currency: str
    Before_War_Price: float
    Unit: str
    Trend: str
    Before_War_USD: float
    Mar7_USD: float
    Oil_Import_Dep: str

def get_hash(val: str) -> float:
    try:
        return float(val)
    except ValueError:
        return float(sum(ord(c) for c in val) % 100)

@app.post("/predict")
async def predict(req: PredictionRequest):
    try:
        try:
            oil_import_dep_encoded = float(encoder.transform([req.Oil_Import_Dep])[0])
        except ValueError:
            oil_import_dep_encoded = float(encoder.transform([encoder.classes_[0]])[0])

        features = [
            get_hash(req.Country),
            get_hash(req.ISO),
            get_hash(req.Region),
            get_hash(req.Currency),
            float(req.Before_War_Price),
            get_hash(req.Unit),
            get_hash(req.Trend),
            float(req.Before_War_USD),
            float(req.Mar7_USD),
            oil_import_dep_encoded
        ]

        features_array = np.array(features).reshape(1, -1)
        scaled_features = scaler.transform(features_array)
        prediction = model.predict(scaled_features)
        
        return {"predicted_price": float(prediction[0])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def serve_index():
    return FileResponse("templates/index.html")

@app.get("/dashboard.html")
async def serve_dashboard():
    return FileResponse("templates/dashboard.html")

@app.get("/analysis.html")
async def serve_analysis():
    return FileResponse("templates/analysis.html")
