import {ELYSIUM_ROOM_NAMES} from '../../../../../lib/elysium-rooms.mjs';
import {NextResponse} from 'next/server';
import {adminDb,apiError,readJson,requireOrigin} from '../../../../../lib/portal-api';
import {isReportId,parseExtraValues,parseReportCells} from '../../../../../lib/booking-report';

const invalid = () => NextResponse.json({error:'Sila semak tarikh, nama acara, bilangan tetamu dan nilai RM.'},{status:400});
const missing = () => NextResponse.json({error:'Rekod tidak dijumpai.'},{status:404});
const headers = {'Cache-Control':'private, no-store'};

export async function POST(req:Request) {
 try {
  requireOrigin(req);
  const db = await adminDb(req);
  const raw = await readJson(req,64000);
  if (!raw || !isReportId(raw.id) || !['booking','history','manual'].includes(raw.source)) return invalid();
  const hidden = typeof raw.hidden === 'boolean';
  const create = raw.create === true;
  if (create && (raw.source !== 'manual' || hidden)) return invalid();
  let updates:Record<string,unknown>;
  if (hidden) {
   updates = {report_hidden:raw.hidden};
  } else {
   try {
    const {cells} = parseReportCells(raw);
    if (raw.source === 'manual' && !cells[10]) return invalid();
    updates = {[raw.source === 'manual' ? 'cells' : 'cells_override']:cells};
    if (raw.extra !== undefined) updates.extra_values = parseExtraValues(raw.extra);
   } catch { return invalid(); }
  }

  if (raw.source === 'booking') {
   const {data,error} = await db.from('bookings').select('id,venues!inner(name)')
    .eq('id',raw.id).in('venues.name',ELYSIUM_ROOM_NAMES).maybeSingle();
   if (error) throw error;
   if (!data) return missing();
   const result = await db.from('booking_report_details').upsert({booking_id:raw.id,...updates,updated_at:new Date().toISOString()},{onConflict:'booking_id',defaultToNull:false});
   if (result.error) throw result.error;
  } else {
   const table = raw.source === 'manual' ? 'booking_report_manual' : 'booking_report_archive';
   if (create) {
    const result = await db.from(table).upsert({id:raw.id,...updates},{onConflict:'id',ignoreDuplicates:true});
    if (result.error) throw result.error;
   } else {
    if (raw.source === 'history') updates.amount_updated_at = new Date().toISOString();
    const {data,error} = await db.from(table).update(updates).eq('id',raw.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return missing();
   }
  }
  return NextResponse.json({ok:true},{headers});
 } catch (e) { return apiError(e); }
}
