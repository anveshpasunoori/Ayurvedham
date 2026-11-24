import test from 'node:test';
import assert from 'node:assert/strict';
import {ownsAccount,institutionAccess,publicPractitioner} from '../backend/authorization.mjs';
const actor={accountId:'a'};
const memberships=[{accountId:'a',institutionId:'one',role:'student'}];
test('account ownership',()=>{assert.equal(ownsAccount(actor,'a'),true);assert.equal(ownsAccount(actor,'b'),false);assert.equal(ownsAccount(null,'a'),false)});
test('tenant isolation',()=>{assert.equal(institutionAccess(actor,'one',memberships,['student']),true);assert.equal(institutionAccess(actor,'two',memberships,['student']),false);assert.equal(institutionAccess(actor,'one',memberships,['admin']),false)});
test('directory verification and data minimization',()=>{assert.equal(publicPractitioner({verificationStatus:'pending'}),null);assert.deepEqual(publicPractitioner({verificationStatus:'verified',displayName:'Example',registrationAuthority:'Board',privateEmail:'hidden'}),{displayName:'Example',registrationAuthority:'Board'})});
