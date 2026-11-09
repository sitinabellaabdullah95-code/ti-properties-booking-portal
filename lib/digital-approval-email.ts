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
