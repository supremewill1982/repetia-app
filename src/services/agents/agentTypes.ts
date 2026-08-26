import { generateSecureAI } from '../secureAIService';
export type AgentType='tuteur'|'evaluateur'|'moderateur'|'coach';
export interface AgentContext{userId:string;userRole:'eleve'|'parent'|'repetiteur'|'etablissement'|'admin';matiere?:string;niveau?:string;historique?:Array<{role:string;content:string}>}
export interface AgentResponse{reponse:string;coursManquant?:boolean;coursExiste?:boolean;propositionAjout?:string;score?:number}
export const utiliserOpenRouter=async(params:{messages:Array<{role:string;content:string}>;model?:string;temperature?:number;max_tokens?:number;imageBase64?:string;mimeType?:string}):Promise<{choices:Array<{message:{content:string}}>}>=>{const content=await generateSecureAI(params);return{choices:[{message:{content}}]}};
