export const DETAIL_FIELDS=[
 ['designation','Designation / Department',180],['billing_address','Billing Address',500],['event_name','Event Name',180],['setup_access','Required Setup Access Time',5],['preferred_hall','Preferred Hall',80],['vip_guests','Number of VIP Guests (Included in Total)',6],
 ['budget','Budget per Person (RM)',12],['meal_type','Meal Type',80],['service_style','Service Style',80],['preferred_menu','Preferred Menu',500],['meal_time','Meal Service Time',5],['dietary','Dietary Requirements / Food Allergies',500],
 ['vip_table','VIP Table Requirements',300],['stage','Stage / Rostrum Requirements',300],['sound','Microphone / Sound System Requirements',300],['projector','Projector / Screen Requirements',300],['registration','Registration Table Requirements',300],['decoration','Decoration Requirements',500],['equipment','Additional Equipment / Setup Requirements',500],
 ['quotation_to','Quotation to Be Addressed To',200],['quotation_by','Quotation Required By',10],['payment_method','Payment Method',80],['po_lou','Purchase Order (PO) / Letter of Undertaking (LOU), if Applicable',300],['billing_instructions','Special Billing Instructions',500]
];
export function formatElysiumDetails(details,pax,eventDate,today){
 if(details===undefined)return '';if(!details||typeof details!=='object'||Array.isArray(details))throw Error('Butiran Elysium tidak sah.');
 const allowed=new Set(DETAIL_FIELDS.map(x=>x[0]));for(const key of Object.keys(details))if(!allowed.has(key))throw Error('Medan tambahan tidak sah.');
 const clean={};for(const [key,label,max] of DETAIL_FIELDS){let v=details[key]??'';if(typeof v!=='string'||v.length>max)throw Error('Sila semak '+label+'.');clean[key]=v.trim();}
 if(!clean.event_name)throw Error('Event Name diperlukan.');
 if(clean.preferred_hall&&clean.preferred_hall!=='Elysium Hall')throw Error('Preferred Hall tidak sah.');
 if(clean.vip_guests&&!/^\d+$/.test(clean.vip_guests))throw Error('Bilangan VIP tidak sah.');if(Number(clean.vip_guests)>pax)throw Error('Bilangan VIP mesti termasuk dalam jumlah tetamu.');
 if(clean.budget&&(!/^\d+(\.\d{1,2})?$/.test(clean.budget)||Number(clean.budget)>100000))throw Error('Budget per Person tidak sah.');
 for(const key of ['setup_access','meal_time'])if(clean[key]&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(clean[key]))throw Error('Masa tambahan tidak sah.');
 if(clean.quotation_by&&(!/^\d{4}-\d{2}-\d{2}$/.test(clean.quotation_by)||!Number.isFinite(Date.parse(clean.quotation_by))||new Date(clean.quotation_by).toISOString().slice(0,10)!==clean.quotation_by||clean.quotation_by<today||clean.quotation_by>eventDate))throw Error('Quotation Required By perlu antara hari ini dan tarikh acara.');
 if(clean.service_style&&!['Buffet','Dome Set','Plated','To discuss'].includes(clean.service_style))throw Error('Service Style tidak sah.');
 if(clean.meal_type&&clean.meal_type.split(', ').some(v=>!['Breakfast','Lunch','Hi-Tea','Dinner'].includes(v)))throw Error('Meal Type tidak sah.');
 const text=DETAIL_FIELDS.filter(([k])=>clean[k]).map(([k,label])=>label+': '+clean[k]).join('\n');if(text.length>6500)throw Error('Butiran terlalu panjang. Sila ringkaskan keperluan anda.');
 return '[ELYSIUM HALL BOOKING DETAILS]\n'+text;
}
