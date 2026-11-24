import {canAccess} from '../commerce/entitlements.mjs';
import {publicPractitioner} from './authorization.mjs';
// Framework-neutral API handler. Adapters must authenticate and query trusted storage.
export function createApi({authenticate,repository,plans}){
 if(typeof authenticate!=='function'||!repository||!plans)throw new TypeError('Trusted adapters required');
 const reply=(status,body)=>({status,headers:{'content-type':'application/json','cache-control':'no-store'},body});
 return async function handle({method,path,headers={}}){
  try{
   if(method!=='GET')return reply(405,{error:'Method not allowed'});
   if(path==='/api/plans')return reply(200,{...plans,checkoutEnabled:false});
   if(path==='/api/practitioners'){const profiles=await repository.listPractitioners();return reply(200,profiles.map(publicPractitioner).filter(Boolean));}
   if(path!=='/api/me'&&path!=='/api/entitlements')return reply(404,{error:'Not found'});
   const identity=await authenticate(headers);
   if(!identity?.subject)return reply(401,{error:'Authentication required'});
   const account=await repository.accountBySubject(identity.subject);
   if(!account?.id)return reply(403,{error:'Account not provisioned'});
   const subscription=await repository.subscriptionByAccount(account.id);
   if(path==='/api/me')return reply(200,{id:account.id,plan:subscription?.plan||'free',status:subscription?.status||'free'});
   const features=[...new Set(plans.plans.flatMap(p=>p.features))].filter(f=>canAccess(f,subscription,plans));
   return reply(200,{features});
  }catch{return reply(500,{error:'Request failed'});}
 };
}
