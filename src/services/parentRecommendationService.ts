import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';
export type ParentRecommendation={kind:string;title:string;text:string;icon?:string};
export async function getParentRecommendations(stats:Record<string,unknown>):Promise<ParentRecommendation[]>{
  try{
    const functions=getFunctions(app,'us-central1');
    const call=httpsCallable<{stats:Record<string,unknown>},{recommendations:ParentRecommendation[]}>(functions,'generateParentRecommendations');
    const result=await call({stats});
    return Array.isArray(result.data?.recommendations)?result.data.recommendations.slice(0,4):[];
  }catch(error){console.warn('[RÉPETIA] recommandations IA indisponibles:',error);return[];}
}
