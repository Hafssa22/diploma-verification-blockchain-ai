import pandas as pd
import random
import hashlib
from faker import Faker

fake = Faker()

universites = ["UM5", "EMI", "ENSIAS", "ESI", "ENSA"]
filieres = ["Informatique", "Data Science", "Cybersecurity", "AI", "Blockchain"]
mentions = ["Passable", "Assez Bien", "Bien", "Tres Bien"]


def generate_hash(text):
    return hashlib.sha256(text.encode()).hexdigest()


def generate_valid_diploma():
    universite = random.choice(universites)
    year = random.choice([2023, 2024, 2025, 2026])
    diploma_id = f"{universite}-{year}-ZX-{random.randint(10000,99999)}"

    nom = fake.name()
    filiere = random.choice(filieres)
    mention = random.choice(mentions)

    raw_data = diploma_id + nom + universite + filiere
    diploma_hash = generate_hash(raw_data)

    return {
        "diploma_id": diploma_id,
        "nom": nom,
        "universite": universite,
        "filiere": filiere,
        "mention": mention,
        "hash": diploma_hash,
        "label": 1
    }


def generate_fake_diploma():
    fraud_type = random.choice([
        "bad_format",
        "missing_secret",
        "wrong_hash",
        "wrong_university",
        "wrong_field",
        "wrong_year",
        "almost_valid"
    ])

    universite = random.choice(universites)
    year = random.choice([2023, 2024, 2025, 2026])
    nom = fake.name()
    filiere = random.choice(filieres)
    mention = random.choice(mentions)

    diploma_id = f"{universite}-{year}-ZX-{random.randint(10000,99999)}"
    diploma_hash = generate_hash(diploma_id + nom + universite + filiere)

    if fraud_type == "bad_format":
        diploma_id = f"{universite}{year}ZX{random.randint(10000,99999)}"

    elif fraud_type == "missing_secret":
        diploma_id = f"{universite}-{year}-XX-{random.randint(10000,99999)}"

    elif fraud_type == "wrong_hash":
        diploma_hash = generate_hash("fake_data" + str(random.randint(1000, 9999)))

    elif fraud_type == "wrong_university":
        universite = random.choice(["UM6", "UNKNOWN", "FAKEUNI"])

    elif fraud_type == "wrong_field":
        filiere = random.choice(["Fake AI", "Hacking", "Unknown Field"])

    elif fraud_type == "wrong_year":
        year = random.choice([2010, 2035, 2040])
        diploma_id = f"{universite}-{year}-ZX-{random.randint(10000,99999)}"

    elif fraud_type == "almost_valid":
        # Très difficile à détecter : tout semble correct sauf hash incohérent
        diploma_id = f"{universite}-{year}-ZX-{random.randint(10000,99999)}"
        diploma_hash = generate_hash("slightly_modified_data")

    return {
        "diploma_id": diploma_id,
        "nom": nom,
        "universite": universite,
        "filiere": filiere,
        "mention": mention,
        "hash": diploma_hash,
        "label": 0
    }


valid_diplomas = [generate_valid_diploma() for _ in range(200)]
fake_diplomas = [generate_fake_diploma() for _ in range(120)]

all_data = valid_diplomas + fake_diplomas
random.shuffle(all_data)

df = pd.DataFrame(all_data)

df.to_csv("dataset/diplomas_dataset.csv", index=False)

print("Dataset generated successfully!")
print(df["label"].value_counts())
print(df.head())