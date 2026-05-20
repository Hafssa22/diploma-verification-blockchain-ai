from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

from utils.preprocess import extract_features

app = Flask(__name__)
CORS(app)

model = joblib.load("model/model.pkl")


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Fraud Detection Service is running"
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    features = extract_features(data)
    X = pd.DataFrame([features])

    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0]

    confidence = round(max(probability) * 100, 2)

    anomaly_score = sum(1 for value in features.values() if value == 0)

    if prediction == 1 and anomaly_score == 0:
        status = "VALID"
        message = "Diplôme authentique"

    elif prediction == 1 and anomaly_score <= 2:
        status = "SUSPICIOUS"
        message = "Diplôme probablement valide mais certaines incohérences existent"

    else:
        status = "FAKE"
        message = "Diplôme frauduleux ou fortement suspect"

    return jsonify({
        "status": status,
        "confidence": confidence,
        "anomaly_score": anomaly_score,
        "message": message,
        "features": features
    })
if __name__ == "__main__":
    app.run(debug=True, port=5001)