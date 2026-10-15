import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!key||!anonKey)throw Error('Configure database credentials securely before integration tests.');
const root=createClient(url,key,{auth:{persistSession:false}}),anon=createClient(url,anonKey,{auth:{persistSession:false}});const run=randomUUID();let venueId;const ids=[];
try{
const v=await root.from('venues').insert({name:'TEST-'+run,location:'TEST',kind:'event'}).select('id').single();if(v.error)throw v.error;venueId=v.data.id;
const u=await root.from('units').insert({venue_id:venueId,name:'TEST'}).select('id').single();if(u.error)throw u.error;
const base={venue_id:venueId,unit_id:u.data.id,customer_name:'Automated test',email:'test@example.com',phone:'0123456789',event_type:'TEST',event_date:'2099-01-01',end_date:'2099-01-01',start_time:'09:00',end_time:'10:00',pax:1,status:'confirmed'};
const results=await Promise.all([root.from('bookings').insert(base),root.from('bookings').insert(base)]);assert.equal(results.filter(r=>!r.error).length,1);assert.equal(results.find(r=>r.error)?.error.code,'23P01');
const adjacent=await root.from('bookings').insert({...base,start_time:'10:00',end_time:'11:00'});assert.equal(adjacent.error,null);
const read=await anon.from('bookings').select('id');assert.ok(read.error||read.data?.length===0);
const insert=await anon.from('bookings').insert({...base,status:'pending'});assert.ok(insert.error);
const rpc=await anon.rpc('submit_enquiry',{payload:{}});assert.ok(rpc.error);
for(const admin of [false,true]){
const password=randomUUID()+randomUUID();const email='test-'+randomUUID()+'@example.com';const created=await root.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw created.error;const id=created.data.user.id;ids.push(id);
if(admin){const grant=await root.from('admin_users').insert({user_id:id});if(grant.error)throw grant.error;}
const session=createClient(url,anonKey,{auth:{persistSession:false}});const login=await session.auth.signInWithPassword({email,password});if(login.error)throw login.error;
const view=await session.from('bookings').select('id').eq('venue_id',venueId);if(view.error)throw view.error;assert.equal(view.data.length,admin?2:0);
if(!admin){const grant=await session.from('admin_users').insert({user_id:id});assert.ok(grant.error);const change=await session.from('bookings').update({status:'cancelled'}).eq('venue_id',venueId).select('id');assert.ok(change.error||change.data.length===0);}
if(admin){const edit=await session.from('bookings').update({customer_name:'Not permitted'}).eq('venue_id',venueId);assert.ok(edit.error);}
await session.auth.signOut();}
console.log('PASS: concurrent overlap, adjacent slots, anonymous access, role escalation, admin column restriction.');
}finally{
if(venueId){const records=await root.from('bookings').select('id').eq('venue_id',venueId);const bookingIds=(records.data||[]).map(r=>r.id);if(bookingIds.length)await root.from('booking_audit').delete().in('booking_id',bookingIds);await root.from('bookings').delete().eq('venue_id',venueId);await root.from('units').delete().eq('venue_id',venueId);await root.from('venues').delete().eq('id',venueId);}
for(const id of ids)await root.auth.admin.deleteUser(id);
}
