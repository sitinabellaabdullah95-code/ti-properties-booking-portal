import {NextResponse} from 'next/server';
import {serverDb} from '../../../../lib/server-db';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/i.test(id))return new NextResponse(null,{status:404});
 try{const db=serverDb();const {data:item,error}=await db.from('media_assets').select('storage_path,mime_type').eq('id',id).eq('published',true).eq('destination','drawbridge').maybeSingle();if(error||!item)return new NextResponse(null,{status:404});
 const {data,error:downloadError}=await db.storage.from('portal-media').download(item.storage_path);if(downloadError||!data||data.size>8388608)throw Error();
 return new NextResponse(await data.arrayBuffer(),{headers:{'Content-Type':item.mime_type,'Content-Disposition':item.mime_type==='application/pdf'?'attachment; filename="menu.pdf"':'inline','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }catch{return new NextResponse(null,{status:503})}
}
