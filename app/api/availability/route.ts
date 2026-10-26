import {NextRequest,NextResponse} from 'next/server';
import {serverDb} from '../../../lib/server-db';
export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams,venue=q.get('venue'),from=q.get('from'),to=q.get('to');
 if(!venue||!/^[0-9a-f-]{36}$/i.test(venue)||!from||!to||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||to<=from||Date.parse(to)-Date.parse(from)>42*86400000)return NextResponse.json({error:'Julat kalendar tidak sah.'},{status:400});
 try{const db=serverDb();const {data:v,error:ve}=await db.from('venues').select('id,kind').eq('id',venue).eq('location','Kuala Terengganu Drawbridge').eq('active',true).maybeSingle();if(ve)throw ve;if(!v)return NextResponse.json({error:'Ruang tidak ditemui.'},{status:404});
 const [u,b]=await Promise.all([db.from('units').select('id').eq('venue_id',venue).eq('active',true),db.from('bookings').select('event_date,end_date,start_time,end_time,unit_id').eq('venue_id',venue).in('status',['confirmed','completed']).lt('event_date',to).gte('end_date',from).limit(2001)]);
 if(u.error||b.error||(b.data?.length||0)>2000)throw Error();
 // Only anonymous occupancy periods leave the server; no customer data or record identifiers.
 return NextResponse.json({capacity:u.data?.length||0,periods:(b.data||[]).map(x=>({start:x.event_date+'T'+x.start_time,end:x.end_date+'T'+x.end_time}))},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Kalendar tidak dapat dimuatkan. Sila cuba semula.'},{status:503})}
}
