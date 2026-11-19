'use client';

import {useEffect,useState} from 'react';
import {publicDb} from '../../../lib/supabase';

export default function StaffSignatures(){
 const [token,setToken]=useState(''),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{void publicDb().auth.getSession().then(({data})=>setToken(data.session?.access_token||''));},[]);
 async function upload(person:'nabella'|'farhana',file?:File){if(!file)return;setBusy(person);setMessage('');try{const form=new FormData();form.append('person',person);form.append('file',file);const r=await fetch('/api/admin/quote-signature',{method:'POST',headers:{authorization:'Bearer '+token},body:form}),data=await r.json();if(!r.ok)throw Error(data.error||'Muat naik tandatangan gagal.');setMessage(person==='nabella'?'Tandatangan Nabella disimpan.':'Tandatangan Farhana disimpan. Muat semula portal untuk melihat kedua-duanya.');}catch(e){setMessage((e as Error).message);}finally{setBusy('');}}
 return <details style={{margin:'12px 0',padding:'12px 16px',border:'1px solid #cbd8d4',borderRadius:8,background:'#f7faf9'}}><summary style={{fontWeight:700,cursor:'pointer'}}>Tandatangan Confirmation</summary><p style={{margin:'8px 0'}}>Muat naik imej PNG rasmi untuk dipaparkan di atas nama staf dalam semua Confirmation.</p><div style={{display:'flex',gap:18,flexWrap:'wrap'}}><label>Siti Nabella Abdullah<input aria-label="Tandatangan Siti Nabella Abdullah" type="file" accept="image/png,.png" disabled={!token||!!busy} onChange={e=>{const f=e.currentTarget.files?.[0];e.currentTarget.value='';void upload('nabella',f);}}/></label><label>Farhana Adila Mohamad Yunus<input aria-label="Tandatangan Farhana Adila Mohamad Yunus" type="file" accept="image/png,.png" disabled={!token||!!busy} onChange={e=>{const f=e.currentTarget.files?.[0];e.currentTarget.value='';void upload('farhana',f);}}/></label></div>{busy&&<p role="status">Sedang menyimpan tandatangan…</p>}{message&&<p role="status">{message}</p>}</details>;
}
