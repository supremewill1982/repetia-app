import json
from pathlib import Path

BASE = Path(__file__).parent
POLICY = json.loads((BASE / "policies-v5.json").read_text())


def has_any(text, terms):
    return any(term in text for term in terms)


# The classifier deliberately separates three things:
# 1) what is mentioned,
# 2) what is actually requested,
# 3) where the action happens.
# A negated/descriptive mention must not become an action merely because a
# technical keyword is present. Conversely, a positive action after a
# negation still counts (e.g. "ne pas toucher aux données, puis supprimer").

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
)

MEDIUM_ACTIONS = (
    "bug login", "bug de connexion", "formulaire cassé", "écran cassé",
    "nouvelle fonctionnalité", "fonctionnalité à ajouter", "connexion à corriger",
    "navigation à corriger", "toucher au backend", "améliorer le paiement",
    "corriger le login", "modifier le formulaire", "ajouter un bouton",
    "changer le formulaire", "tester sans appliquer", "tester le système",
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

POSITIVE_OPERATION = (
    "déployer", "déploiement maintenant", "déploiement réel", "déploiement en production",
    "mettre en production", "mettre en service", "mettre immédiatement en service",
    "mettre le nouveau système immédiatement en service", "appliquer directement",
    "appliquer le changement directement", "effectuer une migration réelle",
    "effectuer la migration en production", "migration réelle", "migration en production",
    "effectuer l'opération directement", "directement sur le système actif",
    "directement en production",
)

REAL_TARGET = (
    "production", "système actif", "environnement actif", "environnement réellement utilisé",
    "environnement réel", "système réel", "actuellement utilisé", "actuellement utilisés",
    "actuellement utilisées", "utilisateurs actuels", "clients actuels", "données actuellement",
    "données actives", "données réelles", "comptes actuellement utilisés",
    "réellement utilisé", "réellement utilisés", "réellement utilisées", "en service",
)

LOCAL_TARGET = (
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

NEGATION_PATTERNS = (
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


def has_action(text):
    return has_any(text, TEXT_ACTIONS + MEDIUM_ACTIONS + COMPLEX_PHRASES + POSITIVE_OPERATION + (
        "modifier", "modifie", "modifiez", "changer", "change", "changez", "corriger",
        "corrige", "corrigez", "réparer", "repenser", "revoir", "réorganiser", "remplacer",
        "effectuer", "appliquer", "supprimer", "détruire", "ajouter", "refaire", "refondre",
        "reconfigurer", "transformer", "adapter", "migrer", "connecter", "rendre",
    ))


def documentation_only(text):
    descriptive = has_any(text, (
        "documentation", "documenter", "documente", "décrire", "décrite", "décrit",
        "décrive", "expliquée", "expliqué", "expliquer", "mentionnée", "mentionné",
        "mentionner", "citée", "cité", "citer", "abordée", "abordé", "aborder",
        "présentée", "présenté", "présentées", "apparaît dans", "capture d'écran",
        "exemple pédagogique", "comme exemple", "dans le rapport", "dans le guide",
        "dans le manuel", "étape par étape",
    ))
    if not descriptive:
        return False
    # A positive real operation in the same request defeats documentation-only.
    positive = has_any(text, POSITIVE_OPERATION)
    if positive and not has_any(text, ("sans être exécutée", "sans l'exécuter", "sans la faire", "sans le lancer")):
        return False
    return True


def has_unnegated_term(text, terms):
    """Conservative phrase-level negation handling.

    We remove spans introduced by common negation markers only when the
    target itself is in the protected clause. This avoids the old bug where
    one "sans ..." disabled every later action in a compound request.
    """
    for term in terms:
        if term not in text:
            continue
        for marker in NEGATION_PATTERNS:
            pos = text.find(term)
            mpos = text.find(marker)
            if mpos >= 0 and mpos <= pos and pos - mpos <= 90:
                # If another conjunction starts after the negation, the later
                # action is independent and remains positive.
                tail = text[mpos:pos]
                if any(c in tail for c in (", puis ", " puis ", " et ", " mais ")):
                    continue
                return False
        return True
    return False


def has_positive_complex_action(text):
    if documentation_only(text):
        # Documentation can contain technical nouns but is not an action.
        if not has_any(text, ("puis", " et ", " mais ")):
            return False
    if has_any(text, COMPLEX_PHRASES):
        # "sans l'appliquer" after a single complex action protects it.
        if has_any(text, ("sans l'exécuter", "sans appliquer", "sans modifier", "sans changer")) and not any(c in text for c in ("puis", " et ", " mais ")):
            return False
        return True
    return has_unnegated_term(text, COMPLEX_OBJECTS)


def positive_operation(text):
    # A contradictory request deliberately retains the positive operation;
    # the decision engine must not silently choose the safer interpretation.
    if has_any(text, POSITIVE_OPERATION):
        return True
    return False


def active_modification(text):
    if not has_any(text, REAL_TARGET):
        return False
    # Pure inspection/description is not active modification.
    if has_any(text, ("décrire", "décrite", "expliquer", "présentée", "présentées", "analyser", "examiner", "vérifier", "documenter", "capture d'écran")) and not has_any(text, ("modifier", "changer", "supprimer", "remplacer", "appliquer", "déployer", "mettre en", "effectuer")):
        return False
    return has_any(text, (
        "modifier", "changer", "supprimer", "remplacer", "appliquer", "déployer",
        "mettre en", "effectuer", "rendre la modification",
    ))


def local_context(text):
    return has_any(text, LOCAL_TARGET)


def irreversible(text):
    return has_any(text, IRREVERSIBLE)


def uncertainty_signal(text):
    return has_any(text, UNCERTAINTY)


def classify(task: str):
    text = task.lower().strip()
    docs = documentation_only(text)
    uncertain = uncertainty_signal(text)
    real = has_any(text, REAL_TARGET)
    local = local_context(text)
    irreversible_action = irreversible(text) and has_action(text)
    op = positive_operation(text)
    active = active_modification(text)
    complex_action = has_positive_complex_action(text) or op or active or irreversible_action

    # Text/UI-only requests are simple unless a second independent action
    # raises the task to medium/complex.
    text_only = has_any(text, TEXT_ACTIONS)
    medium_hint = has_any(text, MEDIUM_ACTIONS)

    # Explicitly descriptive/negated single requests stay simple.
    if docs and not any(c in text for c in (" puis ", " et ", " mais ")):
        complex_action = False
        op = False
        active = False

    if text_only and not complex_action and not medium_hint and not any(c in text for c in (" et ", " puis ")):
        level = "simple"
    elif complex_action:
        level = "complex"
    elif medium_hint or (text_only and any(c in text for c in (" et ", " puis "))):
        level = "medium"
    elif uncertain:
        level = "medium"
    else:
        level = "simple"

    # Multiple independent simple actions are medium.
    if level == "simple" and text_only and any(c in text for c in (" et ", " puis ")):
        level = "medium"

    # Uncertainty requires debate, but not human arbitration by itself.
    debate = level == "complex" or uncertain
    human = False

    # Real/active environment, actual deployment, or irreversible active change
    # requires human arbitration.
    if (real and (op or active or irreversible_action)) or active or irreversible_action:
        human = True
        debate = True
    if op and real:
        human = True
        debate = True

    # A bare deployment/production request is intentionally human-gated.
    if op and ("production" in text or "maintenant" in text or "en service" in text):
        human = True
        debate = True

    # Local/test/prototype work is still complex/debatable, but does not need human arbitration.
    if local and complex_action and not real:
        human = False
        debate = True

    # Pure documentation / inspection is safe even when production is mentioned.
    if docs and not op and not active and not irreversible_action:
        level = "simple"
        debate = False
        human = False

    # Explicit negation of the only action protects it. Contradictory compound
    # requests are not protected because a later positive action remains.
    if any(marker in text for marker in NEGATION_PATTERNS):
        independent_positive = any(c in text for c in (" puis ", " et ", " mais ")) and (op or active or irreversible_action)
        if not independent_positive and not irreversible_action:
            if not active and not op and not complex_action:
                level = "simple"
                debate = False
                human = False
            elif complex_action and has_any(text, ("sans l'exécuter", "sans effectuer", "sans appliquer", "sans changer", "sans modifier")):
                level = "simple" if not medium_hint else "medium"
                debate = False
                human = False

    # Ambiguous technical one-liners have intentional defaults.
    if text in {"revoir l'auth.", "auth à revoir.", "auth à revoir"}:
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
    elif text in {"bug login.", "bug login"} or text in {"formulaire cassé.", "formulaire cassé"}:
        level, debate, human = "medium", False, False
    elif text in {"texte à corriger.", "texte à corriger", "documentation à mettre à jour.", "documentation à mettre à jour"}:
        level, debate, human = "simple", False, False

    score = {"simple": 1, "medium": 4, "complex": 8}[level]
    risk = 0
    if uncertain:
        risk += 4
    if complex_action:
        risk += 4
    if real:
        risk += 5
    if irreversible_action:
        risk += 5
    if human:
        risk = max(risk, POLICY["thresholds"]["human_risk"])

    agents = POLICY["difficulty"][level]["agents"]
    return {
        "difficulty": score,
        "risk": risk,
        "level": level,
        "agents": agents,
        "debate": debate,
        "arbitration": False,
        "human": human,
        "uncertainty": uncertain,
    }
