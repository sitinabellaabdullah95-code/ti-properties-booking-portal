import {adminDb,apiError} from '../../../../lib/portal-api';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const db=await adminDb(req),{data,error}=await db.storage.from('digital-documents').download('nabella-email-signature.bin');if(error||!data||data.size>2000000)throw Error('SIGNATURE_UNAVAILABLE');return new Response(await data.arrayBuffer(),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){return apiError(e);}}

