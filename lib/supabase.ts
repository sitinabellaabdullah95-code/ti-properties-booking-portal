import {createClient, type SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|undefined;
export function publicDb(){if(client)return client;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)throw Error('Portal belum dikonfigurasi.');client=createClient(url,key);return client;}