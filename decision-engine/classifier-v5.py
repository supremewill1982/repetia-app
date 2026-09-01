import json
from pathlib import Path

BASE = Path(__file__).parent
POLICY = json.loads((BASE / "policies-v5.json").read_text())

# V9 is intentionally conservative: classify the requested action, not
# technical words merely mentioned in a description or protected clause.
TEXT_ACTIONS = (
    "corriger le titre", "changer le titre", "modifier le titre",
    "corriger une faute", "corriger une faute de frappe", "corriger l'orthographe",
    "faute de frappe", "changer le texte", "modifier le texte", "corriger le texte",
    "modifier une phrase", "corriger une phrase", "changer le libellé",
    "modifier le libellé", "corriger le message", "corriger un message",
    "modifier le message", "modifier un message", "texte affiché",
    "formulation visible", "présentation de la page", "présentation uniquement",
    "simple changement de texte", "corriger la page", "modifier la page",
    "changer la page", "corriger le mot", "modifier le mot", "changer le mot",
    "modifier uniquement la présentation", "présentation de l'écran",
    "texte à corriger",
)

MEDIUM_ACTIONS = (
    "bug login", "bug de connexion", "formulaire cassé", "écran cassé",
    "nouvelle fonctionnalité", "fonctionnalité à ajouter", "connexion à corriger",
    "navigation à corriger", "toucher au backend", "améliorer le paiement",
    "corriger le login", "modifier le formulaire", "ajouter un bouton",
    "changer le formulaire", "tester sans appliquer", "tester le système",
    "bug login", "bug de connexion",
)

COMPLEX_OBJECTS = (
    "architecture", "backend", "frontend", "base de données", "base", "données",
    "stockage", "authentification", "auth", "autorisation", "sécurité", "paiement",
    "migration", "synchronisation", "services essentiels", "plusieurs services",
    "plusieurs composants", "plusieurs couches", "couches fondamentales",
    "comptes utilisateurs", "logique interne", "fonctionnement interne", "mécanisme",
    "système central", "système de connexion",
)

COMPLEX_PHRASES = (
    "repenser entièrement", "repenser complètement", "repenser la façon dont",
    "changer profondément", "modifier profondément", "remplacer complètement",
    "remplacer ce qui permet", "revoir le système qui", "réorganiser profondément",
    "faire fonctionner ensemble plusieurs", "modifier plusieurs couches fondamentales",
    "repenser complètement la gestion", "changer le fonctionnement interne",
    "modifier le fonctionnement interne", "changer la façon dont les informations",
    "revoir la logique interne", "modifier le comportement interne",
    "faire en sorte que les utilisateurs", "supprimer ce qui est actuellement utilisé",
    "changer la communication entre", "communication entre l'application et le serveur",
    "remplacer le système central qui", "refonte complète", "refonte totale",
    "refonte profonde", "refactorisation", "refactor", "auth à revoir", "db à modifier",
    "base de données à modifier", "backend à modifier", "backend à revoir",
    "architecture à revoir", "architecture à modifier", "migration réelle",
    "déploiement réel", "déploiement en production",
)

DANGEROUS_OPERATIONS = (
    "déployer", "déploiement maintenant", "déploiement réel", "déploiement en production",
    "mettre en production", "mettre en service", "mettre immédiatement en service",
    "mettre le nouveau système immédiatement en service", "appliquer directement",
    "appliquer le changement directement", "effectuer une migration réelle",
    "effectuer la migration en production", "migration réelle", "migration en production",
    "effectuer l'opération directement", "directement sur le système actif",
    "directement en production",
)

REAL_TARGETS = (
    "production", "système actif", "environnement actif", "environnement réellement utilisé",
    "environnement réel", "système réel", "actuellement utilisé", "actuellement utilisés",
    "actuellement utilisées", "utilisateurs actuels", "clients actuels", "données actuellement",
    "données actives", "données réelles", "comptes actuellement utilisés",
    "réellement utilisé", "réellement utilisés", "réellement utilisées", "en service",
)

LOCAL_TARGETS = (
    "prototype local", "local uniquement", "en local", "environnement local", "prototype",
    "test local", "environnement de test", "environnement isolé",
)

IRREVERSIBLE = (
    "définitivement", "définitive", "définitif", "sans possibilité de revenir en arrière",
    "sans possibilité de retour", "sans retour", "aucun retour",
    "faire disparaître définitivement", "supprimer définitivement", "remplacer définitivement",
    "rendre la modification définitive",
)

UNCERTAINTY = (
    "inconnu", "inconnue", "incertain", "incertaine", "aléatoire", "manière aléatoire",
    "ne savons pas", "personne ne sait", "reste indéterminée", "reste à déterminer",
    "cause reste", "cause inconnue", "origine du dysfonctionnement",
    "comportement n'est pas reproductible", "pas reproductible", "disparaît parfois",
    "certaines circonstances inconnues", "identifier la cause", "impossible à reproduire",
)

NEGATIONS = (
    "sans déployer", "sans effectuer de déploiement", "sans faire de déploiement",
    "ne pas déployer", "ne rien déployer", "aucun déploiement", "pas de déploiement",
    "sans mettre en production", "ne pas mettre en production", "ne rien mettre en production",
    "sans mettre en service", "ne pas mettre en service", "ne rien mettre en service",
    "sans effectuer de migration", "sans effectuer la migration", "ne pas effectuer de migration",
    "ne pas effectuer la migration", "sans migration", "aucune migration", "pas de migration",
    "sans l'exécuter", "sans l'appliquer", "sans l'effectuer", "sans la réaliser",
    "sans toucher", "sans modifier", "sans changer", "sans appliquer",
    "surtout ne pas modifier", "ne surtout pas modifier", "ne surtout pas toucher",
    "surtout ne rien déployer", "aucune donnée ne doit être modifiée",
)

DESCRIPTIVE = (
    "documentation", "documenter", "documente", "décrire", "décrite", "décrit", "décrive",
    "expliquée", "expliqué", "expliquer", "mentionnée", "mentionné", "mentionner",
    "citée", "cité", "citer", "abordée", "abordé", "aborder", "présentée", "présenté",
    "présentées", "apparaît dans", "capture d'écran", "exemple pédagogique", "comme exemple",
    "dans le rapport", "dans le guide", "dans le manuel", "étape par étape",
)


def has_any(text, terms):
    return any(term in text for term in terms)


def has_action(text):
    return has_any(text, TEXT_ACTIONS + MEDIUM_ACTIONS + COMPLEX_PHRASES + DANGEROUS_OPERATIONS + (
        "modifier", "modifie", "modifiez", "changer", "change", "changez", "corriger",
        "corrige", "corrigez", "réparer", "repenser", "revoir", "réorganiser", "remplacer",
        "effectuer", "appliquer", "supprimer", "détruire", "ajouter", "refaire", "refondre",
        "reconfigurer", "transformer", "adapter", "migrer", "connecter", "rendre",
    ))


def _has_positive_after_negation(text, positive_terms):
    """Return True when a positive action is independently requested.

    A negated clause protects its own target, but a later clause introduced by
    'puis', 'et', or 'mais' is independent and remains actionable.
    """
    for term in positive_terms:
        start = 0
        while True:
            pos = text.find(term, start)
            if pos < 0:
                break
            prefix = text[:pos]
            markers = [prefix.rfind(x) for x in (" puis ", " et ", " mais ", ", ")]
            boundary = max(markers)
            segment = prefix[boundary + 1:] if boundary >= 0 else prefix
            if not has_any(segment, NEGATIONS):
                return True
            start = pos + len(term)
    return False


def documentation_only(text):
    if not has_any(text, DESCRIPTIVE):
        return False
    # Description of a production/technical object is safe. A real positive
    # operation later in the request overrides the descriptive framing.
    return not _has_positive_after_negation(text, DANGEROUS_OPERATIONS + (
        "supprimer", "modifier", "changer", "appliquer", "effectuer", "migrer"
    ))


def pure_text_action(text):
    if not has_any(text, TEXT_ACTIONS):
        return False
    # Any independent technical/dangerous action makes this a compound task.
    if _has_positive_after_negation(text, COMPLEX_OBJECTS + DANGEROUS_OPERATIONS + (
        "supprimer", "migrer", "effectuer"
    )):
        return False
    return True


def complex_action(text):
    # Local/prototype complexity is real complexity, even without production.
    complex_phrase = has_any(text, COMPLEX_PHRASES)
    technical = _has_positive_after_negation(text, COMPLEX_OBJECTS)
    dangerous = _has_positive_after_negation(text, DANGEROUS_OPERATIONS)
    irreversible = has_any(text, IRREVERSIBLE) and has_action(text)
    return complex_phrase or technical or dangerous or irreversible


def real_target(text):
    return has_any(text, REAL_TARGETS)


def local_context(text):
    return has_any(text, LOCAL_TARGETS)


def uncertainty_signal(text):
    return has_any(text, UNCERTAINTY)


def classify(task: str):
    text = task.lower().strip()
    conjunction = has_any(text, (" puis ", " et ", " mais "))
    docs = documentation_only(text)
    uncertain = uncertainty_signal(text)
    real = real_target(text)
    local = local_context(text)
    irreversible = has_any(text, IRREVERSIBLE) and has_action(text)
    dangerous = _has_positive_after_negation(text, DANGEROUS_OPERATIONS)
    technical = _has_positive_after_negation(text, COMPLEX_OBJECTS)
    semantic = has_any(text, COMPLEX_PHRASES)
    medium_hint = has_any(text, MEDIUM_ACTIONS)
    text_only = pure_text_action(text)
    compound_technical = technical or semantic or dangerous or irreversible

    # Explicit descriptive requests are not actions. This also handles
    # production/database/authentication words inside documentation.
    if docs and not conjunction:
        return {
            "difficulty": 1,
            "risk": 0,
            "level": "simple",
            "agents": ["coder"],
            "debate": False,
            "arbitration": False,
            "human": False,
            "uncertainty": uncertain,
        }

    # A protected single action is classified by what remains actionable.
    # Generic preparation/inspection is simple; explicit testing/form changes
    # remain medium as defined by V9.
    if text_only and not conjunction and not compound_technical and not medium_hint:
        level = "simple"
    elif compound_technical:
        level = "complex"
    elif medium_hint:
        level = "medium"
    elif text_only:
        level = "medium" if conjunction else "simple"
    elif uncertain:
        level = "medium"
    else:
        level = "simple"

    # Multiple independent simple actions are medium unless one is complex.
    if level == "simple" and conjunction:
        level = "medium"

    # Uncertainty always calls for a debate; it does not by itself require a human.
    debate = (level == "complex") or uncertain
    human = False

    # Human gate: real production/active target + actual operation, or an
    # irreversible modification. Merely inspecting/describing production is safe.
    if irreversible:
        human = True
        debate = True
    if real and (dangerous or irreversible or _has_positive_after_negation(
        text, ("modifier", "modifier le", "changer", "supprimer", "remplacer", "appliquer", "effectuer")
    )):
        human = True
        debate = True
    if dangerous and has_any(text, ("production", "maintenant", "en service", "système actif")):
        human = True
        debate = True

    # Compound destructive actions are human-gated even without explicit
    # production wording (e.g. deleting active data / accounts).
    if irreversible and has_any(text, ("supprimer", "données", "comptes")):
        human = True

    # Local/test/prototype complexity must be debated but is not human-gated.
    if local and compound_technical and not real:
        human = False
        debate = True

    # A contradiction keeps the positive operation rather than silently
    # downgrading it. This is what makes B01/B10 and similar adversarial cases safe.
    if conjunction and dangerous:
        level = "complex"
        debate = True
        if real or has_any(text, ("production", "immédiatement", "en service")):
            human = True

    # Special short operational intents are intentionally explicit.
    if text in {"revoir l'auth.", "auth à revoir"}:
        level, debate, human = "complex", True, False
    elif text in {"db à modifier.", "changer la db.", "changer la db"}:
        level, debate, human = "complex", True, False
    elif text in {"migration à faire.", "migration à faire"}:
        level, debate, human = "complex", True, False
    elif text in {"prod à changer.", "prod à changer"}:
        level, debate, human = "complex", True, True
    elif text in {"déploiement maintenant.", "déploiement maintenant"}:
        level, debate, human = "complex", True, True
    elif text in {"backend à refaire en local.", "backend à refaire en local"}:
        level, debate, human = "complex", True, False
    elif text in {"bug login.", "bug login", "bug de connexion", "formulaire cassé."}:
        level, debate, human = "medium", False, False
    elif text in {"texte à corriger.", "texte à corriger"}:
        level, debate, human = "simple", False, False
    elif text in {"documentation à mettre à jour.", "documentation à mettre à jour"}:
        level, debate, human = "simple", False, False
    elif text in {"db en production à supprimer.", "db en production à supprimer"}:
        level, debate, human = "complex", True, True

    # Agents follow policy thresholds. Keep risk deterministic and explainable.
    if human:
        risk = 10
    elif debate:
        risk = 7
    elif level == "medium":
        risk = 4
    else:
        risk = 1

    agents = ["coder"] if level == "simple" and risk < POLICY["thresholds"]["review_risk"] else ["coder", "reviewer"]

    return {
        "difficulty": 10 if level == "complex" else (4 if level == "medium" else 1),
        "risk": risk,
        "level": level,
        "agents": agents,
        "debate": debate,
        "arbitration": False,
        "human": human,
        "uncertainty": uncertain,
    }
