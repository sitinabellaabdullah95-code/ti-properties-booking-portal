import test from 'node:test';import assert from 'node:assert/strict';
import {translateText} from '../lib/language-core.mjs';
import {verificationEmail,receiptEmail,quotationEmail} from '../lib/customer-emails.mjs';
test('public, admin and customer labels support both source languages',()=>{
 assert.equal(translateText('Sewaan Dewan','en'),'Hall Rental');
 assert.equal(translateText('Event Type *','ms'),'Jenis acara *');
 assert.equal(translateText('Contact Person *','en'),'Contact Person *');
 assert.equal(translateText('Kelulusan tempahan','en'),'Booking approvals');
 assert.equal(translateText('Dibatalkan','en'),'Cancelled');
 assert.equal(translateText('  Hantar kepada ','en'),'  Send to ');
});
test('translation preserves unknown customer input, references, prices and numeric values',()=>{
 for(const value of ['Acme Holdings - Annual Dinner','f2734bd1-5c88-4131-acae-ba3f3e73585d','08:00|14:00','RM2,700.00 nett','constructor','__proto__',12,null])assert.equal(translateText(value,'en'),value);
 assert.equal(translateText('2 bilik tidur','en'),'2 bedrooms');
 assert.equal(translateText('7 unit','en'),'7 units');
});
test('bilingual customer emails preserve code, private link and unconfirmed booking distinction',()=>{
 const otp=verificationEmail({purpose:'booking'},'123456');assert.match(otp.text,/10 minutes/);assert.match(otp.text,/10 minit/);assert.match(otp.text,/123456/);
 const b={id:'TEST-REF',customer_name:'Test customer',event_date:'2026-12-30'};
 const receipt=receiptEmail(b,'https://example.test/private');assert.match(receipt.text,/BELUM disahkan/);assert.match(receipt.text,/NOT yet confirmed/);assert.match(receipt.text,/https:\/\/example.test\/private/);
 const quote=quotationEmail(b,{message:'Original message'},'https://example.test/quote');assert.match(quote.text,/Original message/);assert.match(quote.text,/does not confirm a booking/);assert.match(quote.text,/tidak mengesahkan tempahan/);
});
