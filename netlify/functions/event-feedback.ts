import {processFeedbackInvitations} from '../../lib/feedback-scheduler';
export default async function(){try{return new Response(JSON.stringify(await processFeedbackInvitations()),{status:200});}catch{return new Response('Feedback dispatch requires review',{status:503});}}
// 02:00 UTC = 10:00 AM Malaysia. Scheduled functions run on published production deploys.
export const config={schedule:'0 2 * * *'};
