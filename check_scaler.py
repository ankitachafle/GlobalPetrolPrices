import pickle
import numpy as np

with open("scaler (7).pkl", "rb") as f:
    scaler = pickle.load(f)
with open("encoder (7).pkl", "rb") as f:
    encoder = pickle.load(f)

print("Scaler means:", scaler.mean_)
print("Scaler scale:", scaler.scale_)
print("Encoder classes:", encoder.classes_)
