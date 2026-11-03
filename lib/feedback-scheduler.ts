import {createClient} from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import {feedbackDue,feedbackEmail,malaysiaDate} from './feedback.mjs';
import {conflict,feedbackWrite,feedbackRead,feedbackLink} from './feedback-store';
export async function processFeedbackInvitations(){
 const pass=(process.env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');if(!/^[a-zA-Z]{16}$/.test(pass)||!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return {state:'unconfigured'};
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const setting=await db.from('notification_settings').select('email_enabled').eq('id',true).single();if(setting.error)throw Error('SETTINGS_UNAVAILABLE');if(!setting.data.email_enabled)return {state:'disabled'};
 const now=new Date(),today=malaysiaDate(now);let checked=0,sent=0;const started=Date.now();
 for(let offset=0;offset<10000;offset+=250){const {data,error}=await db.from('bookings').select('id,public_reference,status,customer_name,organisation,email,event_type,event_date,end_date,venues!inner(name,location)').eq('status','confirmed').or('end_date.gte.2026-11-03,and(end_date.is.null,event_date.gte.2026-11-03)').lt('event_date',today).in('venues.location',['KT Drawbridge','Kuala Terengganu Drawbridge']).order('id').range(offset,offset+249);if(error)throw Error('BOOKINGS_UNAVAILABLE');
 for(const b of data||[]){if(Date.now()-started>20000)return {state:'partial',checked,sent};if(!feedbackDue(b,now)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))continue;checked++;if(await feedbackRead(db,'feedback-invites',b.id))continue;
 const venue=Array.isArray(b.venues)?b.venues[0]?.name:(b.venues as any)?.name;const invite={id:b.id,reference:b.public_reference,customer:b.customer_name,organisation:b.organisation,eventType:b.event_type,eventDate:b.event_date,endDate:b.end_date||b.event_date,venue,createdAt:now.toISOString()};const claim=await feedbackWrite(db,'feedback-invites',b.id,invite);if(claim.error){if(conflict(claim.error))continue;throw Error('INVITATION_CLAIM_FAILED');}
 // Recheck the booking after claiming. Never retry an ambiguous SMTP result automatically.
 const current=await db.from('bookings').select('status,email,event_date,end_date').eq('id',b.id).single();let result:any={state:'skipped',at:new Date().toISOString()};
 if(!current.error&&feedbackDue({...b,...current.data},new Date())&&current.data.email===b.email&&current.data.end_date===b.end_date&&current.data.event_date===b.event_date){const mail=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:'tipgroupmarketing@gmail.com',pass},connectionTimeout:4000,greetingTimeout:4000,socketTimeout:6000,logger:false,debug:false});try{const message=feedbackEmail(b,feedbackLink(invite));const smtp=await mail.sendMail({from:{name:'Kuala Terengganu Drawbridge',address:'tipgroupmarketing@gmail.com'},to:b.email,replyTo:'tipgroupmarketing@gmail.com',subject:message.subject,text:message.text,messageId:'<feedback-'+b.id+'@ti-properties-booking-portal.netlify.app>',disableFileAccess:true,disableUrlAccess:true});result={state:smtp.accepted?.length?'accepted':'failed',at:new Date().toISOString()};if(result.state==='accepted')sent++;}catch{result={state:'review',at:new Date().toISOString()};}finally{mail.close();}}
 const audit=await feedbackWrite(db,'feedback-delivery',b.id,result);if(audit.error)throw Error('DELIVERY_AUDIT_FAILED');}
 if((data||[]).length<250)break;
 }return {state:'complete',checked,sent};
}
