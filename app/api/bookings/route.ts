import {validateRoomGuests,roomLabel,isElysiumRoom} from '../../../lib/elysium-rooms.mjs';
import {startVerification} from '../../../lib/portal-verifications';
import {isElysiumSlot} from '../../../lib/event-slots.mjs';
import {createHmac} from 'node:crypto';
import {NextResponse} from 'next/server';
import {serverDb} from '../../../lib/server-db';
import {validateBooking} from '../../../lib/validation.mjs';
export async function POST(req:Request){
 const origin=req.headers.get('origin');let sameOrigin=false;try{const source=new URL(origin||'');sameOrigin=source.host===req.headers.get('host')&&['http:','https:'].includes(source.protocol)&&(!(process.env.VERCEL||process.env.NETLIFY||process.env.HOSTING_PROVIDER)||source.protocol==='https:');}catch{}if(!sameOrigin)return NextResponse.json({error:'Permintaan tidak dibenarkan.'},{status:403});
 if(!req.headers.get('content-type')?.includes('application/json'))return NextResponse.json({error:'Format tidak sah.'},{status:415});
 let raw;try{const reader=req.body?.getReader();if(!reader)throw Error();let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return NextResponse.json({error:'Borang terlalu besar.'},{status:413});}chunks.push(value);}raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return NextResponse.json({error:'Borang tidak sah.'},{status:400});}
 let clean;try{if(raw.website)throw Error('Permintaan tidak sah.');clean=validateBooking(raw);}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Borang tidak sah.'},{status:400});}
 try{const db=serverDb();const {data:venue,error:venueError}=await db.from('venues').select('id,kind,name').eq('id',clean.venue_id).eq('active',true).single();if(venueError||!venue)return NextResponse.json({error:'Venue tidak tersedia.'},{status:400});
 try{validateRoomGuests(venue.name,clean.pax);}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}if(isElysiumRoom(venue.name)&&raw.details?.preferred_hall&&roomLabel(raw.details.preferred_hall)!==roomLabel(venue.name))return NextResponse.json({error:'Sila semak ruang pilihan.'},{status:400});
 if(venue.name==='Elysium Hall'&&clean.event_type!=='Buffet Ramadan — Pertanyaan'&&!isElysiumSlot(clean.start_time,clean.end_time))return NextResponse.json({error:'Sila pilih salah satu slot masa Elysium Hall yang disediakan.'},{status:400});
 if(venue.kind==='stay'&&(clean.end_date<=clean.event_date||clean.start_time!=='15:00'||clean.end_time!=='12:00'))return NextResponse.json({error:'Sila pilih tarikh masuk dan keluar yang sah.'},{status:400});
 if(venue.kind!=='stay'&&clean.end_date!==clean.event_date)return NextResponse.json({error:'Tempahan acara perlu pada hari yang sama.'},{status:400});
 const provider=process.env.HOSTING_PROVIDER||(process.env.VERCEL?'vercel':process.env.NETLIFY?'netlify':'local');const ip=provider==='netlify'?req.headers.get('x-nf-client-connection-ip')?.trim():provider==='vercel'?req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim():undefined;if(provider!=='local'&&!ip)throw Error('Missing trusted client address');const key=createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY!).update((ip||'local')+new Date().toISOString().slice(0,10)).digest('hex');const challenge=await startVerification(req,clean.email,'booking',{...clean,rate_key:key},null);return NextResponse.json({...challenge,message:'Sahkan e-mel untuk meneruskan permohonan.'},{status:202});
 }catch(e){if(e instanceof Response)return e;return NextResponse.json({error:'Sistem belum tersedia. Sila cuba semula kemudian.'},{status:503});}
}