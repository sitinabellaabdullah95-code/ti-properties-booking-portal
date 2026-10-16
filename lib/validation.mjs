import {formatElysiumDetails} from './elysium-details.mjs';
export function validateBooking(data, today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Borang tidak sah.');
  const text=(key,min,max)=>{const value=data[key]; if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw Error('Sila semak medan '+key+'.'); return value.trim();};
  const date=(key)=>{const value=text(key,10,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Error('Tarikh tidak sah.');return value;};
  const venue_id=text('venue_id',36,36);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(venue_id))throw Error('Venue tidak sah.');
  const customer_name=text('customer_name',2,150),email=text('email',3,200).toLowerCase(),phone=text('phone',7,30),event_type=text('event_type',2,100);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^\+?[\d ()-]{7,30}$/.test(phone))throw Error('E-mel atau telefon tidak sah.');
  const event_date=date('event_date'),end_date=date('end_date');
  if(event_date<today||end_date<event_date||Date.parse(end_date)-Date.parse(event_date)>366*86400000)throw Error('Sila semak tempoh tempahan.');
  const start_time=text('start_time',5,5),end_time=text('end_time',5,5);
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end_time)||(event_date===end_date&&start_time>=end_time))throw Error('Masa tidak sah.');
  const pax=Number(data.pax);if(!Number.isInteger(pax)||pax<1||pax>10000)throw Error('Bilangan tetamu tidak sah.');
  if(data.consent!==true&&data.consent!=='on')throw Error('Persetujuan penggunaan maklumat diperlukan.');
  const setup=data.setup||'';if(typeof setup!=='string'||(setup&&!['Round Table','Classroom','Theater','U Shape','I–U–I Setup'].includes(setup)))throw Error('Susun atur tidak sah.');
  const notes=text('notes',0,2000);const details=formatElysiumDetails(data.details,pax,event_date,today);
  return {venue_id,customer_name,email,phone,event_type,event_date,end_date,start_time,end_time,pax,organisation:text('organisation',0,150),notes:(setup?'[Susun atur: '+setup+']\n':'')+notes+(details?'\n\n'+details:'')};
}
