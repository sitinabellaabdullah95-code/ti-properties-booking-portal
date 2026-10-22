import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CORPORATE_BOOKING_EMAIL,corporateBookingEmail} from '../lib/corporate-email.mjs';
test('corporate notification has booking essentials and an admin-only link without OTP or private customer notes',()=>{
 assert.equal(CORPORATE_BOOKING_EMAIL,'corporateinnovationstrategy@tiproperties.my');
 const b={public_reference:'TIP/DB/QUO/26/187',customer_name:'UJIAN',organisation:'UJIAN',email:'test@example.com',phone:'000000000',event_type:'Meeting',event_date:'2026-12-30',end_date:'2026-12-30',start_time:'08:00:00',end_time:'14:00:00',pax:10,venues:{name:'Elysium Hall'},notes:'PRIVATE_BILLING_ALLERGIES',token:'PRIVATE_TOKEN',code:'123456'};
 const m=corporateBookingEmail(b);
 for(const value of [b.public_reference,b.customer_name,b.email,b.phone,'Elysium Hall','08:00','14:00'])assert.ok(m.text.includes(value));
 assert.ok(m.subject.includes(b.public_reference));
 assert.ok(m.text.includes('/admin/quotes'));
 for(const value of [b.notes,b.token,b.code])assert.ok(!m.text.includes(value));
 assert.ok(m.text.includes('belum mengesahkan tempahan'));
});
