import re

def classify_task(description: str):
    text = description.lower()

    # Indices de complexité
    complex_terms = [
        "architecture", "migration", "refactorisation",
        "refactor", "base de données", "production",
        "sécurité", "authentification", "paiement",
        "api", "supabase", "firebase", "synchronisation",
        "plusieurs fichiers", "performance"
    ]

    medium_terms = [
        "bug", "corriger", "fonctionnalité", "écran",
        "connexion", "navigation", "formulaire", "test"
    ]

    risk_terms = {
        "production": 10,
        "suppression": 10,
        "destruction": 10,
        "migration": 8,
        "paiement": 8,
        "mot de passe": 8,
        "authentification": 7,
        "sécurité": 7,
        "données sensibles": 9,
        "base de données": 7,
        "api": 5
    }

    difficulty = 1

    for term in medium_terms:
        if term in text:
            difficulty += 1

    for term in complex_terms:
        if term in text:
            difficulty += 2

    # Bonus de complexité selon la longueur / portée
    if "plusieurs" in text:
        difficulty += 2

    if len(text) > 250:
        difficulty += 1

    difficulty = min(difficulty, 10)

    risk = 1

    for term, value in risk_terms.items():
        if term in text:
            risk = max(risk, value)

    if difficulty <= 3:
        level = "simple"
        agents = ["coder"]
    elif difficulty <= 6:
        level = "medium"
        agents = ["coder", "reviewer"]
    else:
        level = "complex"
        agents = ["coder", "reviewer"]

    debate = (
        level == "complex"
        or risk >= 7
    )

    human = risk >= 10

    return {
        "difficulty": difficulty,
        "risk": risk,
        "level": level,
        "agents": agents,
        "debate": debate,
        "arbitration": False,
        "human": human
    }
