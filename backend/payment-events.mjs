import {createHmac,timingSafeEqual} from 'node:crypto';
export function verifyRazorpaySignature(raw,signature,secret){
 if(!Buffer.isBuffer(raw)||typeof secret!=='string'||!secret||typeof signature!=='string'||!/^[a-f0-9]{64}$/i.test(signature))return false;
 const expected=createHmac('sha256',secret).update(raw).digest();
 return timingSafeEqual(expected,Buffer.from(signature,'hex'));
}
// Only signature verification; persist event IDs transactionally before applying billing changes.
