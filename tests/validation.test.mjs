import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBooking} from '../lib/validation.mjs';
const valid={venue_id:'11111111-1111-1111-1111-111111111111',customer_name:'Ali Ahmad',email:'ali@example.com',phone:'0123456789',event_type:'Meeting',event_date:'2027-01-20',end_date:'2027-01-20',start_time:'09:00',end_time:'10:00',pax:'10',organisation:'',notes:'',consent:true};
test('valid enquiry only returns allowed fields',()=>{const r=validateBooking({...valid,status:'confirmed',unit_id:'x'},'2026-10-15');assert.equal(r.pax,10);assert.equal(r.status,undefined);assert.equal(r.unit_id,undefined)});
test('reject malformed inputs',()=>{for(const change of [{pax:1.5},{pax:'NaN'},{event_date:'2027-02-30'},{start_time:'25:00'},{end_time:'08:00'},{consent:false},{venue_id:'sql injection'},{email:[]},{customer_name:{}},{event_date:'2020-01-01'},{notes:'a'.repeat(2001)}])assert.throws(()=>validateBooking({...valid,...change},'2026-10-15'));});
test('accept multi-night stay',()=>assert.equal(validateBooking({...valid,end_date:'2027-01-22',start_time:'15:00',end_time:'12:00'},'2026-10-15').end_date,'2027-01-22'));
