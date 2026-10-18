import {NextResponse} from 'next/server';
import {serverDb} from '../../../lib/server-db';
export const dynamic='force-dynamic';
export async function GET(){try{const {data,error}=await serverDb().from('media_assets').select('id,title,category,destination,mime_type').eq('published',true).order('created_at',{ascending:false}).limit(300);if(error)throw error;return NextResponse.json({items:data},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Galeri tambahan belum dapat dimuatkan.'},{status:503})}}
