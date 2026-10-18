import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export const SITE_URL='https://ti-properties-booking-portal.netlify.app';
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function secret(){if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('UNCONFIGURED');return process.env.SUPABASE_SERVICE_ROLE_KEY}
export const randomToken=()=>randomBytes(32).toString('base64url');
export const linkToken=(purpose,id)=>createHmac('sha256',secret()).update(purpose+':'+id).digest('hex');
export function validLink(purpose,id,token){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return false;return timingSafeEqual(Buffer.from(linkToken(purpose,id),'hex'),Buffer.from(token,'hex'))}
export const verificationCode=id=>String(createHmac('sha256',secret()).update('otp:'+id).digest().readUInt32BE(0)%1000000).padStart(6,'0');
export const codeDigest=(id,code)=>createHmac('sha256',secret()).update('verify:'+id+':'+code).digest('hex');
export const bookingUrl=id=>SITE_URL+'/tempahan/'+id+'?t='+linkToken('booking',id);
export const quoteUrl=id=>SITE_URL+'/sebut-harga/'+id+'?t='+linkToken('quote',id);
export const isUuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
