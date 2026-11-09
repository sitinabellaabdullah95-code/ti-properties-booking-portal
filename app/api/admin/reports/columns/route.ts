import {NextResponse} from 'next/server';
import {adminDb,apiError,readJson,requireOrigin} from '../../../../../lib/portal-api';
import {isReportId,reportHeaders} from '../../../../../lib/booking-report';

export async function POST(req:Request) {
 try {
  requireOrigin(req);
  const db = await adminDb(req);
  const input = await readJson(req,2000);
  if (isReportId(input?.id) && typeof input.hidden === 'boolean') {
   const {data,error} = await db.from('booking_report_extra_columns').update({report_hidden:input.hidden}).eq('id',input.id).select('id').maybeSingle();
   if (error) throw error;
   if (!data) return NextResponse.json({error:'Lajur tidak dijumpai.'},{status:404});
  } else {
   const label = typeof input?.label === 'string' ? input.label.trim().replace(/\s+/g,' ') : '';
   if (!label || label.length > 60 || reportHeaders.some(h=>h.toLowerCase()===label.toLowerCase()))
    return NextResponse.json({error:'Gunakan nama lajur baharu yang sah.'},{status:400});
   const {error} = await db.from('booking_report_extra_columns').insert({label});
   if (error?.code === '23505') return NextResponse.json({error:'Lajur ini sudah ada. Pulihkan daripada senarai jika tersembunyi.'},{status:409});
   if (error) throw error;
  }
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'private, no-store'}});
 } catch (e) { return apiError(e); }
}
