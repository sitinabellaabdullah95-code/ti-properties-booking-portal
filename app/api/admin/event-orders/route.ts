import {canPrepareDigital,canApproveDigital} from '../../../../lib/digital-permissions.mjs';
import {NextResponse} from 'next/server';
import {digitalIdentity} from '../../../../lib/digital-store';
import {requireOrigin,readJson,apiError} from '../../../../lib/portal-api';
import {eventOrderTransition,eventOrderApprovalMessage} from '../../../../lib/event-order-approval.mjs';
import {notifyDigitalApproval,notifyApprovedEventOrder,notifyOperationEventOrder} from '../../../../lib/digital-approval-email';
import {validateEventOrder,syncInternalBreakdownFromBilling} from '../../../../lib/event-order.mjs';
import {eventOrderCombinedPdf} from '../../../../lib/event-order-pdf-runtime';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
async function files(db:any,search?:string){const bucket=db.storage.from('digital-documents'),all:any[]=[];for(let offset=0;offset<10000;offset+=1000){const {data,error}=await bucket.list('event-orders',{limit:1000,offset,search,sortBy:{column:'name',order:'asc'}});if(error)throw error;all.push(...data.filter((f:any)=>/^[a-f0-9-]{36}--\d{6}\.json$/.test(f.name)));if(data.length<1000)return all;}throw Error('Had rekod dicapai.');}
export async function GET(req:Request){try{const {db,me}=await digitalIdentity(req),u=new URL(req.url);if(u.searchParams.get('sources')==='1'){const [b,q]=await Promise.all([db.from('bookings').select('id,public_reference,customer_name,email,phone,organisation,event_type,event_date,end_date,start_time,end_time,pax,notes,status,venues!inner(name,location)').in('venues.location',['KT Drawbridge','Kuala Terengganu Drawbridge']).not('status','in','(cancelled,rejected)').order('created_at',{ascending:false}).limit(500),db.from('digital_quotations').select('id,ref,customer,event_date,event_type,payload,status,revision,updated_at').order('updated_at',{ascending:false}).limit(500)]);if(b.error||q.error)throw Error('Sumber tidak tersedia.');return NextResponse.json({sources:[...(b.data||[]).map(r=>({...r,kind:'booking'})),...(q.data||[]).map(r=>({...r,kind:r.payload?.documentType==='confirmation'?'confirmation':'quotation'}))]},{headers});}const all=await files(db),latest=new Map<string,any>();for(const f of all)latest.set(f.name.slice(0,36),f);const records=[];for(const f of latest.values()){const {data,error}=await db.storage.from('digital-documents').download('event-orders/'+f.name);if(error||!data)throw Error('Rekod tidak dapat dibaca.');const order=JSON.parse(await data.text());records.push(syncInternalBreakdownFromBilling(order,order.charges,order.internalBreakdown));}return NextResponse.json({canEdit:canPrepareDigital(me.role),canReview:canApproveDigital(me.role),records:records.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))},{headers});}catch(e){return apiError(e);}}
async function latestOrder(db:any,id:string){const found=(await files(db,id+'--')).sort((a:any,b:any)=>b.name.localeCompare(a.name))[0];if(!found)return null;const {data,error}=await db.storage.from('digital-documents').download('event-orders/'+found.name);if(error||!data)throw Error('Rekod tidak dapat dibaca.');return JSON.parse(await data.text());}
async function persist(db:any,saved:any){const key='event-orders/'+saved.id+'--'+String(saved.revision).padStart(6,'0')+'.json';const {error}=await db.storage.from('digital-documents').upload(key,Buffer.from(JSON.stringify(saved)),{contentType:'application/octet-stream',upsert:false});if(error){if(String(error.statusCode)==='409'||/already exists/i.test(error.message))throw NextResponse.json({error:'Versi bertindih. Muat semula rekod.'},{status:409});throw error;}}
export async function POST(req:Request){try{requireOrigin(req);const {db,me}=await digitalIdentity(req),raw=await readJson(req,180000),action=raw.action||'save';if(action!=='save'){
 if(!/^[a-f0-9-]{36}$/.test(raw.id||''))return NextResponse.json({error:'ID tidak sah.'},{status:400});const current=await latestOrder(db,raw.id);if(!current)return NextResponse.json({error:'Rekod tidak dijumpai.'},{status:404});if(current.revision!==raw.revision)return NextResponse.json({error:'Versi telah berubah. Buka semula rekod terkini.'},{status:409});
 if(action==='email-operation'){
  if(!canPrepareDigital(me.role)&&!canApproveDigital(me.role))return NextResponse.json({error:'Akses admin diperlukan.'},{status:403});
  if(current.reviewStatus!=='approved')return NextResponse.json({error:'E-mel kepada Operation hanya tersedia selepas kelulusan Farhana.'},{status:409});
  const auditPath='event-order-notices/'+current.id+'--operation.json';
  const prior=await db.storage.from('digital-documents').download(auditPath);
  if(prior.data){try{const state=JSON.parse(await prior.data.text());if(state.state==='accepted')return NextResponse.json({...current,notification:'already_sent'},{headers});}catch{}}
  const approvedPdf=await eventOrderCombinedPdf(db,current);
  const notification=await notifyOperationEventOrder(current,approvedPdf);
  const audit={id:current.id,revision:current.revision,state:notification,at:new Date().toISOString(),action,to:['fatin@tiproperties.my','farah@tiproperties.my'],pdfAttachmentIncluded:true,portalLinkIncluded:false};
  await db.storage.from('digital-documents').upload(auditPath,Buffer.from(JSON.stringify(audit)),{contentType:'application/octet-stream',upsert:true});
  return NextResponse.json({...current,notification},{headers});
 }
 let next;try{next=eventOrderTransition(current,action,me.role,raw.comment||'');}catch(e:any){return NextResponse.json({error:e.message},{status:e.status||400});}const saved={...next,revision:current.revision+1,updatedAt:new Date().toISOString(),updatedBy:me.email};await persist(db,saved);let notification='not_requested';if(action==='submit')notification=await notifyDigitalApproval(saved,eventOrderApprovalMessage(saved));
 if(action==='approve')notification=await notifyApprovedEventOrder(saved);
 if(action==='submit'||action==='approve'){
  const audit={id:saved.id,revision:saved.revision,state:notification,at:new Date().toISOString(),action,to:action==='approve'?'nabella@tiproperties.my':'farhana@tiproperties.my',cc:null};
  const {error}=await db.storage.from('digital-documents').upload('event-order-notices/'+saved.id+'--'+saved.revision+'.json',Buffer.from(JSON.stringify(audit)),{contentType:'application/octet-stream',upsert:false});
  if(error&&notification==='not_requested')notification='audit_unavailable';
 }
 return NextResponse.json({...saved,notification},{headers});
 }
 if(!canPrepareDigital(me.role))return NextResponse.json({error:'Hanya penyedia boleh mengubah Event Order.'},{status:403});let input;try{input=validateEventOrder(raw);}catch(e){if(e instanceof Response)throw e;return NextResponse.json({error:(e as Error).message},{status:400});}const id=input.id||crypto.randomUUID(),current=await latestOrder(db,id),revision=current?.revision||0;if(revision!==input.revision)return NextResponse.json({error:'Rekod telah dikemas kini. Buka semula rekod terkini sebelum menyimpan.'},{status:409});if(current?.reviewStatus==='pending')return NextResponse.json({error:'Dokumen menunggu kelulusan dikunci. Tunggu Puan Hana memulangkan pindaan.'},{status:409});const saved={...input,id,revision:revision+1,reviewStatus:'draft',reviewHistory:current?.reviewHistory||[],approvedBy:null,approvedAt:null,reviewComment:'',updatedAt:new Date().toISOString(),updatedBy:me.email};await persist(db,saved);return NextResponse.json(saved,{headers});}catch(e){return apiError(e);}}
