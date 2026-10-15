import {createHmac} from 'node:crypto';
import {NextResponse} from 'next/server';
import {serverDb} from '../../../lib/server-db';
import {validateBooking} from '../../../lib/validation.mjs';
export async function POST(req:Request){
 const origin=req.headers.get('origin');let sameOrigin=false;try{const source=new URL(origin||'');sameOrigin=source.host===req.headers.get('host')&&['http:','https:'].includes(source.protocol)&&(!process.env.VERCEL||source.protocol==='https:');}catch{}if(!sameOrigin)return NextResponse.json({error:'Permintaan tidak dibenarkan.'},{status:403});
 if(!req.headers.get('content-type')?.includes('application/json'))return NextResponse.json({error:'Format tidak sah.'},{status:415});
 let raw;try{const reader=req.body?.getReader();if(!reader)throw Error();let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return NextResponse.json({error:'Borang terlalu besar.'},{status:413});}chunks.push(value);}raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return NextResponse.json({error:'Borang tidak sah.'},{status:400});}
 let clean;try{if(raw.website)throw Error('Permintaan tidak sah.');clean=validateBooking(raw);}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Borang tidak sah.'},{status:400});}
 try{const db=serverDb();const {data:venue,error:venueError}=await db.from('venues').select('id,kind').eq('id',clean.venue_id).eq('active',true).single();if(venueError||!venue)return NextResponse.json({error:'Venue tidak tersedia.'},{status:400});
 if(venue.kind==='stay'&&(clean.end_date<=clean.event_date||clean.start_time!=='15:00'||clean.end_time!=='12:00'))return NextResponse.json({error:'Sila pilih tarikh masuk dan keluar yang sah.'},{status:400});
 if(venue.kind!=='stay'&&clean.end_date!==clean.event_date)return NextResponse.json({error:'Tempahan acara perlu pada hari yang sama.'},{status:400});
 const ip=req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();if(process.env.VERCEL&&!ip)throw Error('Missing trusted client address');const key=createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY!).update((ip||'local')+new Date().toISOString().slice(0,10)).digest('hex');const {data,error}=await db.rpc('submit_enquiry',{payload:{...clean,rate_key:key}});if(error){if(error.message.includes('RATE_LIMIT'))return NextResponse.json({error:'Terlalu banyak permohonan. Cuba semula kemudian.'},{status:429});throw error;}
 return NextResponse.json({message:'Permohonan diterima untuk semakan admin. Belum disahkan.',reference:data},{status:201});
 }catch{return NextResponse.json({error:'Sistem belum tersedia. Sila cuba semula kemudian.'},{status:503});}
}