import nodemailer from 'nodemailer';
import JSZip from 'jszip';
import {serverDb} from './server-db';
import {digitalApprovalMessage} from './digital-approval-message.mjs';

let approvalSignature:Promise<Buffer>|undefined;
export async function loadApprovalSignature(){
 if(!approvalSignature)approvalSignature=(async()=>{
  const {data,error}=await serverDb().storage.from('digital-documents').download('digital-editor-master-nov2026-v4.zip');
  if(error||!data)throw Error('SIGNATURE_UNAVAILABLE');
  const zip=await JSZip.loadAsync(await data.arrayBuffer());
  const file=zip.file('originals.json');
  if(!file)throw Error('SIGNATURE_UNAVAILABLE');
  const templates=JSON.parse(await file.async('string'));
  const signature=templates.find((t:any)=>t.documentType==='confirmation')?.pdf?.signatures?.find((s:any)=>s.side==='left')?.url;
  if(typeof signature!=='string'||!signature.startsWith('data:image/png;base64,'))throw Error('SIGNATURE_INVALID');
  return Buffer.from(signature.split(',')[1],'base64');
 })().catch(e=>{approvalSignature=undefined;throw e;});
 return approvalSignature;
}

export async function notifyDigitalApproval(row:any,message?:{subject:string;text:string}){
 const pass=(process.env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');
 if(!/^[a-zA-Z]{16}$/.test(pass))return 'unconfigured';
 const mail=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:'tipgroupmarketing@gmail.com',pass},connectionTimeout:6000,greetingTimeout:6000,socketTimeout:10000,logger:false,debug:false});
 try{
  const template=digitalApprovalMessage(row);
  const confirmation='html' in template;
  const attachments=confirmation?[{filename:'Siti-Nabella-Signature.png',content:await loadApprovalSignature(),contentType:'image/png',cid:'nabella-approval-signature',contentDisposition:'inline' as const}]:[];
  const result=await mail.sendMail({
   from:{name:'TI Properties',address:'tipgroupmarketing@gmail.com'},
   to:'farhana@tiproperties.my',replyTo:'tipgroupmarketing@gmail.com',
   ...(confirmation?template:message||template),attachments,
   disableFileAccess:true,disableUrlAccess:true,
   messageId:`<digital-approval-${row.id}-v${row.revision}@ti-properties-booking-portal.netlify.app>`
  });
  return result.accepted?.some((x:any)=>String(x).toLowerCase()==='farhana@tiproperties.my')?'accepted':'failed';
 }catch(e){return (e as {code?:string}).code==='EAUTH'?'failed':'review';}finally{mail.close();}
}

export async function notifyApprovedEventOrder(row:any){
 const pass=(process.env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');
 if(!/^[a-zA-Z]{16}$/.test(pass))return 'unconfigured';
 const mail=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:'tipgroupmarketing@gmail.com',pass},connectionTimeout:6000,greetingTimeout:6000,socketTimeout:10000,logger:false,debug:false});
 const clean=(v:any)=>String(v||'—').replace(/[\r\n]+/g,' ').slice(0,250),f=row.fields||{};
 const url='https://ti-properties-booking-portal.netlify.app/admin/event-orders?order='+encodeURIComponent(row.id);
 try{
  const result=await mail.sendMail({
   from:{name:'TI Properties',address:'tipgroupmarketing@gmail.com'},
   to:'fatin@tiproperties.my',
   cc:'corporateinnovationstrategy@tiproperties.my',
   replyTo:'tipgroupmarketing@gmail.com',
   subject:'Approved Event Order & Internal — '+clean(f.ref),
   text:['Dear Fatin,','','Farhana has approved the Event Order and Internal document. The approved record is available in the portal for review and printing as a two-page document.','','Reference No.: '+clean(f.ref),'Department / Organisation: '+clean(f.company),'Organiser: '+clean(f.organiser),'Event Type: '+clean(f.eventType),'Event Date: '+clean(f.eventDate)+(f.endDate&&f.endDate!==f.eventDate?' — '+clean(f.endDate):''),'Venue: '+clean(f.venue),'','Open approved Event Order & Internal: '+url,'','Please sign in with your authorised portal account to view the record.','','Thank you,','TI Properties Sdn Bhd'].join('\n'),
   disableFileAccess:true,disableUrlAccess:true,
   messageId:`<approved-event-order-${row.id}-v${row.revision}@ti-properties-booking-portal.netlify.app>`
  });
  return result.accepted?.some((x:any)=>String(x).toLowerCase()==='fatin@tiproperties.my')?'accepted':'failed';
 }catch(e){return (e as {code?:string}).code==='EAUTH'?'failed':'review';}finally{mail.close();}
}

export async function notifyOperationEventOrder(row:any,approvedPdf:Buffer){
 const pass=(process.env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');
 if(!/^[a-zA-Z]{16}$/.test(pass))return 'unconfigured';
 const mail=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:'tipgroupmarketing@gmail.com',pass},connectionTimeout:6000,greetingTimeout:6000,socketTimeout:10000,logger:false,debug:false});
 const clean=(v:any)=>String(v||'—').replace(/[\r\n]+/g,' ').slice(0,250),escapeHtml=(v:any)=>String(v||'—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const f=row.fields||{},subject='Event Order & Internal — '+clean(f.ref)+' — '+clean(f.eventDate),filename='TIP-DB-'+String(f.ref||row.id).replace(/[^a-zA-Z0-9-]/g,'-')+'-Event-Order-and-Internal.pdf';
 const details='<p><b>Reference No.:</b> '+escapeHtml(clean(f.ref))+'<br><b>Department / Company:</b> '+escapeHtml(clean(f.company))+'<br><b>Event:</b> '+escapeHtml(clean(f.eventType))+'<br><b>Date &amp; Time:</b> '+escapeHtml(clean(f.eventDate)+' '+clean(f.time))+'<br><b>Venue:</b> '+escapeHtml(clean(f.venue))+'<br><b>Number of Guests:</b> '+escapeHtml(clean(f.pax))+'</p>';
 const text=['Dear Operation Team,','','Please find the Event Order and Internal attached as a PDF for your reference and coordination.','','Reference No.: '+clean(f.ref),'Department / Company: '+clean(f.company),'Event: '+clean(f.eventType),'Date & Time: '+clean(f.eventDate)+' '+clean(f.time),'Venue: '+clean(f.venue),'Number of Guests: '+clean(f.pax),'','Kindly refer to the attached PDF for the event arrangements. Please contact us if you need any clarification.','','Thank you and regards,','Siti Nabella Abdullah','Executive, Sales','TI Properties Sdn Bhd'].join('\n');
 const html='<p>Dear Operation Team,</p><p>Please find the Event Order and Internal attached as a PDF for your reference and coordination.</p>'+details+'<p>Please use the attached approved PDF for operational preparation. Kindly contact us if any clarification is required.</p><p>Thank you and regards,<br><b>Siti Nabella Abdullah</b><br>Executive, Sales<br>TI Properties Sdn Bhd</p>';
 try{
  const result=await mail.sendMail({from:{name:'TI Properties',address:'tipgroupmarketing@gmail.com'},to:['fatin@tiproperties.my','farah@tiproperties.my'],cc:'corporateinnovationstrategy@tiproperties.my',replyTo:'tipgroupmarketing@gmail.com',subject,text,html,attachments:[{filename,content:approvedPdf,contentType:'application/pdf'}],disableFileAccess:true,disableUrlAccess:true,messageId:`<operation-event-order-${row.id}-v${row.revision}@ti-properties-booking-portal.netlify.app>`});
  return ['fatin@tiproperties.my','farah@tiproperties.my','corporateinnovationstrategy@tiproperties.my'].every(address=>result.accepted?.some((x:any)=>String(x).toLowerCase()===address))?'accepted':'failed';
 }catch(e){return (e as {code?:string}).code==='EAUTH'?'failed':'review';}finally{mail.close();}
}
