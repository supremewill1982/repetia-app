import json
from pathlib import Path

BASE = Path(__file__).parent

POLICY = json.loads(
    (BASE / "policies-v4.json").read_text()
)

W = POLICY["weights"]


def classify(task: str):
    text = task.lower()

    signals = {
        "scope": 0,
        "components": 0,
        "security": 0,
        "data": 0,
        "production": 0,
        "irreversible": 0,
        "user_impact": 0,
        "uncertainty": 0,
        "testing": 0
    }

    # Portée
    if any(x in text for x in [
        "plusieurs fichiers",
        "plusieurs écrans",
        "architecture",
        "système complet"
    ]):
        signals["scope"] = 1

    # Composants
    if any(x in text for x in [
        "plusieurs composants",
        "plusieurs services",
        "backend et frontend",
        "base de données et application"
    ]):
        signals["components"] = 1

    # Sécurité
    if any(x in text for x in [
        "sécurité",
        "authentification",
        "autorisation",
        "mot de passe",
        "token",
        "données sensibles"
    ]):
        signals["security"] = 1

    # Données
    if any(x in text for x in [
        "données",
        "base de données",
        "stockage",
        "migration",
        "supabase",
        "firebase"
    ]):
        signals["data"] = 1

    # Production
    if any(x in text for x in [
        "production",
        "déploiement",
        "mise en production"
    ]):
        signals["production"] = 1

    # Irréversibilité
    if any(x in text for x in [
        "suppression",
        "destruction",
        "destructive",
        "irréversible",
        "migration destructive"
    ]):
        signals["irreversible"] = 1

    # Impact utilisateur
    if any(x in text for x in [
        "tous les utilisateurs",
        "utilisateurs",
        "élèves",
        "parents",
        "répétiteurs",
        "connexion"
    ]):
        signals["user_impact"] = 1

    # Incertitude
    if any(x in text for x in [
        "inconnu",
        "incertain",
        "inconnue",
        "difficile à reproduire",
        "sans test"
    ]):
        signals["uncertainty"] = 1

    # Besoin explicite de tests
    if any(x in text for x in [
        "test",
        "tests",
        "validation"
    ]):
        signals["testing"] = 1

    score = sum(
        signals[name] * W[name]
        for name in signals
    )

    # Difficulté minimale pour certains domaines
    if signals["security"] or signals["production"]:
        score = max(score, 7)

    score = min(score, 10)

    if score <= POLICY["thresholds"]["simple_max"]:
        level = "simple"
    elif score <= POLICY["thresholds"]["medium_max"]:
        level = "medium"
    else:
        level = "complex"

    risk = 1

    if signals["security"]:
        risk = max(risk, 7)

    if signals["data"]:
        risk = max(risk, 6)

    if signals["production"]:
        risk = max(risk, 10)

    if signals["irreversible"]:
        risk = max(risk, 10)

    if signals["security"] and signals["data"]:
        risk = max(risk, 9)

    if level == "simple" and risk < 5:
        agents = ["coder"]
    else:
        agents = ["coder", "reviewer"]

    debate = (
        level == "complex"
        or risk >= POLICY["thresholds"]["debate_risk"]
    )

    human = risk >= POLICY["thresholds"]["human_risk"]

    return {
        "difficulty": score,
        "risk": risk,
        "level": level,
        "agents": agents,
        "debate": debate,
        "arbitration": False,
        "human": human,
        "signals": signals
    }
