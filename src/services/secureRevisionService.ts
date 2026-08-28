import {generateSecureAI}from'./secureAIService';
function json<T>(text:string,fallback:T):T{try{const cleaned=text.replace(/```json\s*/gi,'').replace(/```/g,'').trim();const match=cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);return match?JSON.parse(match[0]):fallback}catch{return fallback}}
export async function extraireTexteCours(imageBase64:string,matiere:string,mimeType='image/jpeg'){const content=await generateSecureAI({messages:[{role:'user',content:`Analyse ce support de cours de ${matiere}. Extrais uniquement le contenu pédagogique utile pour créer des questions. Si c'est une image, lis les éléments visibles. Si c'est un PDF, exploite son contenu. N'invente aucune information absente ou illisible. Réponds en français.`}],imageBase64,mimeType,temperature:.2,max_tokens:2200});return content}
export async function genererQuestionsCours(contenu:string,matiere:string){const raw=await generateSecureAI({messages:[{role:'user',content:`À partir de ce contenu de ${matiere}, crée exactement 8 questions de révision adaptées à un élève du secondaire, uniquement si le contenu permet de les vérifier. Ne fabrique aucune notion, donnée ou réponse absente du contenu. Chaque question doit avoir une réponse attendue et des critères de correction précis. Retourne uniquement JSON sous la forme {"questions":[{"texte":"...","reponseAttendue":"...","criteresCorrection":"..."}]}. CONTENU:\n${contenu}`}],temperature:.2,max_tokens:1800});const data=json<{questions:any[]}>(raw,{questions:[]});return Array.isArray(data.questions)?data.questions:[]}
export async function evaluerReponseRevision(question:string,reponse:string,essai:number,matiere:string,contenuCours?:string,reponseAttendue?:string,criteresCorrection?:string){const raw=await generateSecureAI({messages:[{role:'user',content:`Tu es un correcteur pédagogique strict. Évalue UNIQUEMENT par rapport au cours de référence, à la réponse attendue et aux critères fournis. Tu ne dois jamais compléter une réponse par des connaissances externes.

BARÈME OBLIGATOIRE :
- 2 points : réponse correcte et suffisamment complète ; tous les éléments indispensables des critères sont présents et compatibles avec le cours.
- 1 point : réponse partiellement correcte ; au moins un élément essentiel est correct mais il manque ou reste une partie insuffisante.
- 0 point : réponse fausse, contradictoire avec le cours, hors sujet, ou ne contenant aucun élément indispensable.

En cas de doute entre deux notes, choisis la note la plus basse. Une formulation différente de la réponse attendue est acceptable uniquement si son sens est démontré par le cours. Ne valide jamais une réponse simplement parce qu'elle paraît plausible.

Matière: ${matiere}
Question: ${question}
Réponse de l'élève: ${reponse}
Réponse attendue: ${reponseAttendue||'non fournie'}
Critères obligatoires: ${criteresCorrection||'non fournis'}
Cours de référence: ${contenuCours||'non fourni'}
Essai: ${essai}

Retourne UNIQUEMENT JSON valide : {"note":0,"feedback":"explication courte fondée sur le cours"}.`}],temperature:.0,max_tokens:500});const data=json<{note:number;feedback:string}>(raw,{note:0,feedback:'Impossible d’analyser la réponse.'});return{note:Math.max(0,Math.min(2,Number(data.note)||0)),feedback:data.feedback||'Analyse terminée.'}}