import {NextResponse} from 'next/server';
import {adminDb,apiError,requireOrigin,limit,networkKey} from '../../../../lib/portal-api';
import {processOneEmail} from '../../../../lib/email-worker';
export async function POST(req:Request){try{
 requireOrigin(req);const db=await adminDb(req);
 await limit('corporate-test:'+networkKey(req),3,3600);
 const {data:job,error}=await db.from('email_outbox').insert({kind:'test'}).select('id').single();
 if(error||!job)throw Error('TEST_QUEUE_FAILED');
 return NextResponse.json(await processOneEmail(job.id),{headers:{'Cache-Control':'no-store'}});
}catch(e){return apiError(e)}}
