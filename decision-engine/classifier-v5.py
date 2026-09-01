import json
from pathlib import Path
import re

BASE = Path(__file__).parent
POLICY = json.loads((BASE / "policies-v5.json").read_text())

TEXT=("corriger le titre","changer le titre","modifier le titre","corriger une faute","corriger une faute de frappe","corriger l'orthographe","faute de frappe","changer le texte","modifier le texte","corriger le texte","modifier une phrase","corriger une phrase","changer le libellé","modifier le libellé","corriger le message","corriger un message","modifier le message","modifier un message","texte affiché","formulation visible","présentation de la page","présentation uniquement","simple changement de texte","corriger la page","modifier la page","changer la page","corriger le mot","modifier le mot","changer le mot","modifier uniquement la présentation","présentation de l'écran","texte à corriger")
MEDIUM=("bug login","bug de connexion","formulaire cassé","écran cassé","nouvelle fonctionnalité","fonctionnalité","connexion à corriger","navigation à corriger","toucher au backend","améliorer le paiement","corriger le login","modifier le formulaire","ajouter un bouton","changer le formulaire","tester sans appliquer","tester le système")
OBJECTS=("architecture","backend","frontend","base de données","base","db","données","stockage","authentification","auth","autorisation","sécurité","paiement","migration","synchronisation","services essentiels","plusieurs services","plusieurs composants","plusieurs couches","couches fondamentales","comptes utilisateurs","logique interne","fonctionnement interne","mécanisme","système central","système de connexion")
COMPLEX=("repenser entièrement","repenser complètement","repenser la façon dont","changer profondément","modifier profondément","remplacer complètement","remplacer ce qui permet","revoir le système qui","réorganiser profondément","faire fonctionner ensemble plusieurs","modifier plusieurs couches fondamentales","repenser complètement la gestion","changer le fonctionnement interne","modifier le fonctionnement interne","changer la façon dont les informations","revoir la logique interne","modifier le comportement interne","faire en sorte que les utilisateurs","supprimer ce qui est actuellement utilisé","changer la communication entre","communication entre l'application et le serveur","remplacer le système central qui","refonte complète","refonte totale","refonte profonde","refactorisation","refactor","auth à revoir","db à modifier","base de données à modifier","backend à modifier","backend à revoir","architecture à revoir","architecture à modifier","migration réelle","déploiement réel","déploiement en production")
DANGEROUS=("déployer","déploiement maintenant","déploiement réel","déploiement en production","mettre en production","mettre en service","mettre immédiatement","mettre le nouveau système immédiatement en service","appliquer directement","appliquer le changement directement","effectuer une migration réelle","effectuer la migration en production","migration réelle","migration en production","effectuer l'opération directement","directement sur le système actif","directement en production","exécuter réellement","l'exécuter réellement","lancer immédiatement")
REAL=("production","prod","système actif","environnement actif","environnement réellement utilisé","environnement réel","système réel","actuellement utilisé","actuellement utilisés","actuellement utilisées","utilisateurs actuels","clients actuels","données actuellement","données actives","données réelles","comptes actuellement utilisés","réellement utilisé","réellement utilisés","réellement utilisées","en service")
IRREVERSIBLE=("définitivement","définitive","définitif","sans possibilité de revenir en arrière","sans possibilité de retour","sans retour","aucun retour","faire disparaître définitivement","supprimer définitivement","remplacer définitivement","rendre la modification définitive")
UNCERTAIN=("inconnu","inconnue","incertain","incertaine","aléatoire","manière aléatoire","ne savons pas","personne ne sait","reste indéterminée","reste à déterminer","cause reste","cause inconnue","origine du dysfonctionnement","comportement n'est pas reproductible","pas reproductible","disparaît parfois","certaines circonstances inconnues","identifier la cause","impossible à reproduire")
DESCRIPTIVE=("documentation","documenter","documente","décrire","décrite","décrit","décrive","expliquée","expliqué","expliquer","mentionnée","mentionné","mentionner","citée","cité","citer","abordée","abordé","aborder","présentée","présenté","présentées","apparaît dans","capture d'écran","exemple pédagogique","comme exemple","dans le rapport","dans le guide","dans le manuel","étape par étape")
NEGATION=("sans ","ne pas ","ne rien ","ne surtout pas ","surtout ne pas ","aucun ","aucune ","pas de ","jamais ","aucun changement réel","aucune modification réelle")

def has_any(text,terms): return any(t in text for t in terms)
def _clauses(text): return [c.strip() for c in re.split(r"\s*(?:,|;|\bmais\b|\bpuis\b|\bet\b)\s*",text) if c.strip()]
def _negated(clause): return has_any(clause,NEGATION)
def _active(text,terms): return any(has_any(c,terms) and not _negated(c) for c in _clauses(text))
def _action(text): return _active(text,("modifier","modifie","modifiez","changer","change","changez","corriger","corrige","corrigez","réparer","repenser","revoir","réorganiser","remplacer","effectuer","appliquer","déployer","supprimer","détruire","ajouter","refaire","refondre","reconfigurer","transformer","adapter","migrer","connecter","rendre","toucher","améliorer","tester","préparer","analyser","étudier","simuler","diagnostiquer","résoudre","construire","examiner","vérifier","exécuter","lancer"))

def classify(task:str):
    text=task.lower().strip(); clauses=_clauses(text); compound=len(clauses)>1; uncertain=has_any(text,UNCERTAIN)
    negated=has_any(text,("sans ","ne pas ","ne rien ","aucune ","aucun ")); medium=has_any(text,MEDIUM); semantic=has_any(text,COMPLEX); dangerous=_active(text,DANGEROUS); technical=_active(text,OBJECTS); irreversible=has_any(text,IRREVERSIBLE) and _action(text)
    descriptive=has_any(text,DESCRIPTIVE) and not _action(text)
    if descriptive: level,debate,human="simple",False,False
    else:
        independent_positive=any(_action(c) and not _negated(c) for c in clauses)
        protected=negated and not independent_positive
        active_real=_active(text,REAL)
        destructive=has_any(text,("supprimer","détruire","faire disparaître")) and _action(text)
        local_complex_test=(has_any(text,("tester une ","tester le ","tester ","construire")) and has_any(text,OBJECTS) and has_any(text,("sans déployer","sans la déployer","sans l'appliquer","sans appliquer")))
        # Explicit protection can downgrade only the protected operation, not an independently requested technical action.
        if compound and (dangerous or irreversible or (technical and destructive)): level="complex"
        elif active_real and _action(text): level="complex"
        elif local_complex_test: level="complex"
        elif protected and not medium: level="simple"
        elif semantic or dangerous or irreversible: level="complex"
        elif medium: level="medium"
        elif technical: level="medium" if has_any(text,("toucher au backend","améliorer le paiement")) else "complex"
        elif uncertain: level="medium"
        elif has_any(text,TEXT): level="medium" if compound else "simple"
        else: level="medium" if compound else "simple"
        if compound and not dangerous and not irreversible and has_any(text,("ne pas ","ne rien ","ne surtout pas ","sans ")) and not local_complex_test and not semantic:
            level="medium" if medium else "simple"
        if compound and (semantic or dangerous or irreversible or local_complex_test or (has_any(text,("supprimer","données","comptes")) and _action(text))): level="complex"
        debate=level=="complex" or uncertain; human=False
        if dangerous or irreversible: human,debate=True,True
        if active_real and _action(text) and not protected: human,debate=True,True
        if active_real and destructive: level,debate,human="complex",True,True
        if compound and destructive and active_real: level,debate,human="complex",True,True
        # A compound destructive data/account change is human-gated even without an explicit production marker.
        if compound and destructive and has_any(text,("données","comptes")): level,debate,human="complex",True,True
        if local_complex_test and not active_real: human,debate=False,True
        if compound and dangerous: level,debate,human="complex",True,True
        # Explicitly harmless compound wording must not inherit a generic medium score.
        if has_any(text,("aucun changement réel","aucune modification réelle")) and not active_real and not dangerous and not irreversible: level,debate,human="simple",False,False
        # A compound technical task involving a DB/data change is complex but is not automatically human-gated unless live/destructive.
        if compound and technical and not active_real and not destructive and not dangerous and not irreversible: level="complex"
    difficulty={"simple":1,"medium":4,"complex":8}[level]
    risk=10 if human else (7 if debate else (4 if level=="medium" else 1))
    agents=["coder"] if level=="simple" and risk<POLICY["thresholds"]["review_risk"] else ["coder","reviewer"]
    return {"difficulty":difficulty,"risk":risk,"level":level,"agents":agents,"debate":debate,"arbitration":False,"human":human,"uncertainty":uncertain}
