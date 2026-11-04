import{runPromotions}from'../../lib/client-marketing-store';
export default async function(){try{return new Response(JSON.stringify(await runPromotions()),{status:200});}catch{return new Response('Promotion dispatch requires review',{status:503});}}
export const config={schedule:'*/15 * * * *'};
