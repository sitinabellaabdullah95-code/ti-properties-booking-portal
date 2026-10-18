import {NextResponse} from 'next/server';
import nodemailer from 'nodemailer';
import {serverDb} from '../../../../lib/server-db';
export const runtime='nodejs';
export async function POST(req:Request){
 const source=req.headers.get('origin');try{if(!source||new URL(source).host!==req.headers.get('host'))throw Error()}catch{return NextResponse.json({error:'Permintaan tidak dibenarkan.'},{status:403})}
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return NextResponse.json({error:'Sila log masuk admin.'},{status:401});
 try{const db=serverDb();const {data:{user},error}=await db.auth.getUser(token);if(error||!user)return NextResponse.json({error:'Sesi tamat. Sila log masuk semula.'},{status:401});const {data:admin}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();if(!admin)return NextResponse.json({error:'Akses admin diperlukan.'},{status:403});
 const pass=(process.env.GMAIL_APP_PASSWORD||'').replace(/\s/g,'');if(!pass)return NextResponse.json({error:'Nilai GMAIL_APP_PASSWORD belum tersedia dalam Production. Simpan kunci dan deploy semula.'},{status:503});
 if(!/^[a-zA-Z]{16}$/.test(pass))return NextResponse.json({error:'Nilai tersimpan bukan format App password Google yang dijangka. Gunakan 16 aksara yang Google jana, bukan nama aplikasi, password akaun atau mesej chat.'},{status:422});
 const mail=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:'tipgroupmarketing@gmail.com',pass},connectionTimeout:8000,greetingTimeout:8000,socketTimeout:10000,logger:false,debug:false});
 try{await mail.verify();return NextResponse.json({message:'Sambungan Gmail berjaya disahkan. Tiada e-mel dihantar dalam semakan ini.'},{headers:{'Cache-Control':'no-store'}})}catch(e){const code=(e as {code?:string}).code;return NextResponse.json({error:code==='EAUTH'?'Google menolak kunci aplikasi. Semak App password untuk akaun tipgroupmarketing@gmail.com.':'Sambungan Gmail belum berjaya. Cuba semula atau semak sambungan penghantaran.'},{status:502})}finally{mail.close()}
 }catch{return NextResponse.json({error:'Semakan belum tersedia. Sila cuba semula.'},{status:503})}
}
