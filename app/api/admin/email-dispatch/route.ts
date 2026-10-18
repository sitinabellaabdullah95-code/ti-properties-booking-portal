import {NextResponse} from 'next/server';
import {processOneEmail} from '../../../../lib/email-worker';
import {serverDb} from '../../../../lib/server-db';
export const runtime='nodejs';
export async function POST(req:Request){
 const source=req.headers.get('origin');try{if(!source||new URL(source).host!==req.headers.get('host'))throw Error()}catch{return NextResponse.json({error:'Permintaan tidak dibenarkan.'},{status:403})}
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return NextResponse.json({error:'Sila log masuk admin.'},{status:401});
 try{const db=serverDb();const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return NextResponse.json({error:'Sesi tamat. Sila log masuk semula.'},{status:401});const {data:admin}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();if(!admin)return NextResponse.json({error:'Akses admin diperlukan.'},{status:403});
 const result=await processOneEmail();return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Semakan belum tersedia. Sila cuba semula.'},{status:503})}
}
