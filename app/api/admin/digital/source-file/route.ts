import {NextResponse} from 'next/server';
import {digitalIdentity} from '../../../../../lib/digital-store';
import {canPrepareDigital} from '../../../../../lib/digital-permissions.mjs';
import {requireOrigin} from '../../../../../lib/portal-api';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const bucketPath=(id:string)=>`quotation-originals/${id}`;
const validId=(id:string)=>/^[a-f0-9-]{36}$/.test(id);
const fail=(message:string,status=400)=>NextResponse.json({error:message},{status,headers:{'Cache-Control':'private, no-store'}});

export async function GET(req:Request){
 try{
  const {db,me}=await digitalIdentity(req),u=new URL(req.url),id=u.searchParams.get('quotation')||'';
  if(!canPrepareDigital(me.role))return fail('Akses penyedia diperlukan.',403);
  if(!validId(id))return fail('Rekod tidak sah.');
  const {data:row,error}=await db.from('digital_quotations').select('id,payload').eq('id',id).maybeSingle();
  if(error)throw error;
  if(!row)return fail('Rekod tidak ditemui.',404);
  if(row.payload?.documentType!=='confirmation')return NextResponse.json({applicable:false},{headers:{'Cache-Control':'private, no-store'}});
  const metaKey=bucketPath(id)+'.json',fileKey=bucketPath(id)+'.docx';
  const {data:metaFile,error:metaError}=await db.storage.from('digital-documents').download(metaKey);
  if(metaError||!metaFile)return NextResponse.json({applicable:true,attached:false},{headers:{'Cache-Control':'private, no-store'}});
  const meta=JSON.parse(await metaFile.text());
  if(u.searchParams.get('download')==='1'){
   const {data,error:fileError}=await db.storage.from('digital-documents').download(fileKey);
   if(fileError||!data)return fail('Fail Confirmation asal belum tersedia.',404);
   return new Response(await data.arrayBuffer(),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(meta.name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  return NextResponse.json({applicable:true,attached:true,name:meta.name,size:meta.size},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){if(e instanceof Response)return NextResponse.json({error:await e.text()},{status:e.status});return fail('Fail Confirmation asal belum dapat dibaca.',503);}
}

export async function POST(req:Request){
 try{
  requireOrigin(req);
  const {db,me}=await digitalIdentity(req);
  if(!canPrepareDigital(me.role))return fail('Akses penyedia diperlukan.',403);
  const form=await req.formData(),id=String(form.get('quotation')||''),file=form.get('file');
  if(!validId(id)||!(file instanceof File))return fail('Pilih fail Confirmation DOCX.');
  if(!file.name.toLowerCase().endsWith('.docx')||file.size<8||file.size>25000000)return fail('Fail mesti DOCX asal, maksimum 25 MB.');
  const {data:row,error}=await db.from('digital_quotations').select('id,status,payload').eq('id',id).maybeSingle();
  if(error)throw error;
  if(!row||row.payload?.documentType!=='confirmation')return fail('Confirmation tidak ditemui.',404);
  if(!['draft','returned'].includes(row.status))return fail('Lampiran hanya boleh ditambah pada draf Confirmation.',409);
  const root=bucketPath(id),{data:existing}=await db.storage.from('digital-documents').download(root+'.json');
  if(existing)return fail('Fail asal sudah dilampirkan. Muat turun dahulu untuk semakan.',409);
  const bytes=Buffer.from(await file.arrayBuffer());
  if(bytes[0]!==0x50||bytes[1]!==0x4b)return fail('Fail DOCX tidak sah.');
  const {error:uploadError}=await db.storage.from('digital-documents').upload(root+'.docx',bytes,{contentType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',upsert:false});
  if(uploadError)throw uploadError;
  const meta={name:file.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_'),size:file.size,attachedAt:new Date().toISOString(),attachedBy:me.email};
  const {error:metaError}=await db.storage.from('digital-documents').upload(root+'.json',Buffer.from(JSON.stringify(meta)),{contentType:'application/json',upsert:false});
  if(metaError)throw metaError;
  return NextResponse.json({applicable:true,attached:true,name:meta.name,size:meta.size},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){if(e instanceof Response)return NextResponse.json({error:await e.text()},{status:e.status});return fail('Fail Confirmation asal belum dapat disimpan.',503);}
}
