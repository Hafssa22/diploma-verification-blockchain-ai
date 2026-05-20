import re

VALID_UNIVERSITIES = ["UM5", "EMI", "ENSIAS", "ESI", "ENSA"]
VALID_FIELDS = ["Informatique", "Data Science", "Cybersecurity", "AI", "Blockchain"]

def extract_features(diploma):
    diploma_id = diploma.get("diploma_id", "")
    universite = diploma.get("universite", "")
    filiere = diploma.get("filiere", "")
    diploma_hash = diploma.get("hash", "")

    features = {
        "has_valid_prefix": int(any(diploma_id.startswith(u + "-") for u in VALID_UNIVERSITIES)),
        "has_secret_sign": int("ZX" in diploma_id),
        "has_valid_length": int(12 <= len(diploma_id) <= 20),
        "has_valid_university": int(universite in VALID_UNIVERSITIES),
        "has_valid_field": int(filiere in VALID_FIELDS),
        "has_valid_hash": int(bool(re.fullmatch(r"[a-f0-9]{64}", diploma_hash))),
        "has_valid_year": int("2026" in diploma_id)
    }

    return features

if __name__ == "__main__":

    diploma = {
        "diploma_id": "UM5-2026-ZX-12345",
        "universite": "UM5",
        "filiere": "AI",
        "hash": "a" * 64
    }

    print(extract_features(diploma))