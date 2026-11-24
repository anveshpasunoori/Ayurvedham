import test from 'node:test';import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';import {verifyRazorpaySignature} from '../backend/payment-events.mjs';
const raw=Buffer.from('{"event":"subscription.charged"}'),secret='test-only-secret';const sig=createHmac('sha256',secret).update(raw).digest('hex');
test('valid signature',()=>assert.equal(verifyRazorpaySignature(raw,sig,secret),true));
test('tampered body',()=>assert.equal(verifyRazorpaySignature(Buffer.from('{}'),sig,secret),false));
test('invalid inputs',()=>{for(const s of [null,'','abc'])assert.equal(verifyRazorpaySignature(raw,s,secret),false);assert.equal(verifyRazorpaySignature(raw,sig,''),false)});
