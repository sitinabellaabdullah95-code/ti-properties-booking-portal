import {guestQuotationEmail} from './guest-quotation-message.mjs';
export function verificationEmail(v,code){
 const action=v.purpose==='quote'?'membuka sebut harga PDF':'menghantar permohonan tempahan';
 const actionEn=v.purpose==='quote'?'open your quotation PDF':'submit your booking request';
 return {subject:'Kod pengesahan / Verification code — TI Properties',text:`Kod pengesahan anda / Your verification code: ${code}\n\nBAHASA MELAYU\nKod ini sah selama 10 minit untuk ${action}. Jangan kongsi kod ini. Jika anda tidak meminta kod, abaikan e-mel ini.\n\nENGLISH\nThis code is valid for 10 minutes to ${actionEn}. Do not share this code. If you did not request it, ignore this email.\n\nTI Properties Sdn. Bhd.`};
}
export function receiptEmail(b,url){const ref=b.public_reference||b.id;return {subject:'Permohonan diterima / Request received — TI Properties '+ref,text:`Salam / Hello ${b.customer_name},\n\nBAHASA MELAYU\nPermohonan anda telah diterima untuk semakan admin. Tempahan BELUM disahkan.\nRujukan: ${ref}\nTarikh pilihan: ${b.event_date}\nSemak status permohonan anda:\n${url}\nSimpan pautan ini untuk kegunaan anda sahaja. Untuk pertanyaan hubungi 016-843 4470.\n\nENGLISH\nYour request has been received for admin review. Your booking is NOT yet confirmed.\nReference: ${ref}\nPreferred date: ${b.event_date}\nCheck your request status:\n${url}\nKeep this link private. For enquiries, contact 016-843 4470.\n\nTI Properties Sdn. Bhd.`}}
export function quotationEmail(b,q,url){return guestQuotationEmail(b,q,url);}

