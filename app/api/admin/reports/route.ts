import {NextResponse} from 'next/server';
import {adminDb,apiError,readJson,requireOrigin} from '../../../../lib/portal-api';
import {reportData} from '../../../../lib/report-data';
import {parseReportDetails} from '../../../../lib/booking-report';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const {rows,updated_at}=await reportData(req);return NextResponse.json({rows,updated_at},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return apiError(e);}}
export async function POST(req:Request){try{requireOrigin(req);const db=await adminDb(req);let d;try{d=parseReportDetails(await readJson(req));}catch{return NextResponse.json({error:'Sila semak nilai dan ruangan laporan.'},{status:400});}const {data:b,error:be}=await db.from('bookings').select('id,venues!inner(name)').eq('id',d.booking_id).eq('venues.name','Elysium Hall').maybeSingle();if(be)throw be;if(!b)return NextResponse.json({error:'Tempahan tidak dijumpai.'},{status:404});const {error}=await db.from('booking_report_details').upsert({...d,updated_at:new Date().toISOString()});if(error)throw error;return NextResponse.json({ok:true});}catch(e){return apiError(e);}}
