import {processOneEmail} from '../../lib/email-worker';
export default async function(){try{const result=await processOneEmail();return new Response(JSON.stringify({state:result.state}),{status:200})}catch{return new Response('Email queue unavailable',{status:503})}}
export const config={schedule:'*/5 * * * *'};
