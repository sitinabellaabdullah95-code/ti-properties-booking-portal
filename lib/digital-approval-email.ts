import nodemailer from 'nodemailer';
import {digitalApprovalMessage} from './digital-approval-message.mjs';
export async function notifyDigitalApproval(row:any){
 const pass=(process.env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');if(!/^[a-zA-Z]{16}$/.test(pass))return 'unconfigured';
 const mail=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:'tipgroupmarketing@gmail.com',pass},connectionTimeout:6000,greetingTimeout:6000,socketTimeout:10000,logger:false,debug:false});
 try{const result=await mail.sendMail({from:{name:'TI Properties',address:'tipgroupmarketing@gmail.com'},to:'farhana@tiproperties.my',replyTo:'tipgroupmarketing@gmail.com',...digitalApprovalMessage(row),disableFileAccess:true,disableUrlAccess:true,messageId:`<digital-approval-${row.id}-v${row.revision}@ti-properties-booking-portal.netlify.app>`});return result.accepted?.some((x:any)=>String(x).toLowerCase()==='farhana@tiproperties.my')?'accepted':'failed';}catch(e){return (e as {code?:string}).code==='EAUTH'?'failed':'review';}finally{mail.close();}
}

