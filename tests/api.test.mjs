import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createApi} from '../backend/api.mjs';
const plans=JSON.parse(readFileSync(new URL('../commerce/plans.json',import.meta.url)));
const api=createApi({plans,authenticate:async h=>h.authorization==='test-token'?{subject:'subject-a'}:null,repository:{accountBySubject:async s=>s==='subject-a'?{id:'a'}:null,subscriptionByAccount:async()=>({plan:'student',status:'active',expiresAt:Date.now()+100000}),listPractitioners:async()=>[{verificationStatus:'pending'},{verificationStatus:'verified',displayName:'Test',registrationAuthority:'Board',privateEmail:'secret'}]}});
const get=(path,headers={})=>api({method:'GET',path,headers});
test('public pricing never activates checkout',async()=>assert.equal((await get('/api/plans')).body.checkoutEnabled,false));
test('private account requires identity',async()=>assert.equal((await get('/api/me')).status,401));
test('trusted subscription controls features',async()=>{const r=await get('/api/entitlements',{authorization:'test-token',plan:'pro'});assert.equal(r.status,200);assert.ok(r.body.features.includes('academy'));assert.ok(!r.body.features.includes('clinical_tools'));});
test('directory filters and minimizes',async()=>assert.deepEqual((await get('/api/practitioners')).body,[{displayName:'Test',registrationAuthority:'Board'}]));
test('unknown route',async()=>assert.equal((await get('/api/missing')).status,404));
