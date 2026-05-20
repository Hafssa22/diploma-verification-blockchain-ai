import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from utils.preprocess import extract_features

# =========================
# Charger dataset
# =========================

df = pd.read_csv("dataset/diplomas_dataset.csv")

# =========================
# Transformer en features
# =========================

features_list = []

for _, row in df.iterrows():

    diploma = {
        "diploma_id": row["diploma_id"],
        "universite": row["universite"],
        "filiere": row["filiere"],
        "hash": row["hash"]
    }

    features = extract_features(diploma)

    features_list.append(features)

# =========================
# DataFrame ML
# =========================

X = pd.DataFrame(features_list)

y = df["label"]

# =========================
# Split train/test
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# =========================
# Modèle IA
# =========================

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Entraînement
model.fit(X_train, y_train)

# =========================
# Prédictions
# =========================

y_pred = model.predict(X_test)

# =========================
# Evaluation
# =========================

accuracy = accuracy_score(y_test, y_pred)

print("\nAccuracy :", accuracy)

print("\nClassification Report :\n")

print(classification_report(y_test, y_pred))

# =========================
# Sauvegarde modèle
# =========================

joblib.dump(model, "model/model.pkl")

print("\nModel saved successfully!")