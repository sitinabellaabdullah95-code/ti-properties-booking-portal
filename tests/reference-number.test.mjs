import {test} from 'node:test';
import assert from 'node:assert/strict';
import {receiptEmail,quotationEmail} from '../lib/customer-emails.mjs';
import {confirmationEmail} from '../lib/confirmation-email.mjs';
test('customer emails use the allocated reference while keeping private tracking links unchanged',()=>{
 const b={id:'f2734bd1-5c88-4131-acae-ba3f3e73585d',public_reference:'TIP/DB/QUO/26/180',customer_name:'TEST',status:'confirmed',event_date:'2026-12-30',end_date:'2026-12-30',start_time:'08:00',end_time:'14:00',event_type:'Meeting',pax:2};
 const url='https://example.test/tempahan/'+b.id+'?t=private-token';
 const receipt=receiptEmail(b,url),confirmation=confirmationEmail(b),quote=quotationEmail(b,{message:''},url);
 for(const mail of [receipt,confirmation,quote]){
  assert.ok(mail.subject.includes(b.public_reference));
  assert.ok(mail.text.includes('Rujukan: '+b.public_reference));
  assert.ok(mail.text.includes('Reference: '+b.public_reference));
  assert.ok(!mail.subject.includes(b.id));
 }
 assert.ok(receipt.text.includes(url));
 assert.ok(quote.text.includes(url));
});
