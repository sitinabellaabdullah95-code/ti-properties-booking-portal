'use client';

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import AdminShell from '../../../components/AdminShell';
import {publicDb} from '../../../lib/supabase';
import {useLanguage} from '../../../components/Language';
import SourceFile from './source-file';
import StaffSignatures from './staff-signatures';

export default function DigitalEditor({documentType='quotation',embedded=false,initialQuotationId=''}:{documentType?:'quotation'|'confirmation';embedded?:boolean;initialQuotationId?:string}){
 const {language}=useLanguage(),tx=(a:string,b:string)=>language==='en'?b:a;
 const isConfirmation=documentType==='confirmation';
 const frame=useRef<HTMLIFrameElement>(null);
 const confirmationPackageDefaultsApplied=useRef(false);
 const [ready,setReady]=useState(false),[editorHtml,setEditorHtml]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[sending,setSending]=useState(false),[quotationId,setQuotationId]=useState(''),[editorModeReady,setEditorModeReady]=useState(false),[confirmationFormats,setConfirmationFormats]=useState<Array<{value:string;label:string}>>([]),[selectedFormat,setSelectedFormat]=useState('');
 async function resend(){if(sending)return;setSending(true);setNotice('Menghantar notifikasi…');try{const id=embedded?initialQuotationId:(initialQuotationId||new URLSearchParams(location.search).get('quotation'));const r=await fetch('/api/admin/digital/quotations/'+encodeURIComponent(id||'')+'/notify',{method:'POST'});const d=await r.json();setNotice(d.message||d.error||'Sila semak sejarah.');}catch{setNotice('Keputusan penghantaran belum diketahui. Semak sejarah sebelum cuba lagi.');}finally{setSending(false);}}
 function setEditorType(attempt=0){
  const doc=frame.current?.contentDocument;
  if(isConfirmation&&doc?.body){const walker=doc.createTreeWalker(doc.body,4);while(walker.nextNode()){const node=walker.currentNode;if(node.nodeValue?.includes('QUOTATION DIGITAL'))node.nodeValue=node.nodeValue.replace('QUOTATION DIGITAL','CONFIRMATION');}}
  if(embedded&&isConfirmation)doc?.querySelectorAll('#homeTab,#editorTab,#confirmationTab,#folderTab').forEach(tab=>(tab as HTMLButtonElement).hidden=true);
  const hasExistingRecord=embedded?!!initialQuotationId:!!(initialQuotationId||new URLSearchParams(location.search).has('quotation'));
  const selector=doc?.querySelector<HTMLSelectElement>('#documentType');
  if(!selector){
   const tab=hasExistingRecord?null:doc?.querySelector<HTMLButtonElement>(isConfirmation?'#confirmationTab':'#editorTab');
   if(tab&&!tab.dataset.parentEditorReady){tab.dataset.parentEditorReady='true';tab.addEventListener('click',()=>window.setTimeout(()=>setEditorType(0),0),{once:true});}
   if(!hasExistingRecord)setEditorModeReady(true);
   if(attempt<40)window.setTimeout(()=>setEditorType(attempt+1),100);
   return false;
  }
  if(!hasExistingRecord&&attempt<5){if(selector.value!==documentType){selector.value=documentType;selector.dispatchEvent(new Event('change',{bubbles:true}));}window.setTimeout(()=>setEditorType(attempt+1),200);return false;}
  if(!hasExistingRecord&&selector.value!==documentType){selector.value=documentType;selector.dispatchEvent(new Event('change',{bubbles:true}));}
  if(!hasExistingRecord)selector.disabled=true;
  if(isConfirmation){
   const packageChecks=doc?.querySelectorAll<HTMLInputElement>('#packageOptions [data-package-group]');if(!hasExistingRecord&&!confirmationPackageDefaultsApplied.current&&packageChecks?.length){packageChecks.forEach(input=>{if(input.checked){input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));}});confirmationPackageDefaultsApplied.current=true;}
   const template=doc?.querySelector<HTMLSelectElement>('#template');
   if(template){const options=Array.from(template.options).filter(option=>!option.disabled&&option.value&&option.textContent?.trim());setConfirmationFormats(options.map(option=>({value:option.value,label:option.textContent!.trim()})));setSelectedFormat(template.value);template.addEventListener('change',()=>setSelectedFormat(template.value));if(!hasExistingRecord){const label=template.closest('label');if(label)label.hidden=true;}}
  }
  setEditorModeReady(true);
  return true;
 }
 function chooseConfirmationFormat(value:string){const template=frame.current?.contentDocument?.querySelector<HTMLSelectElement>('#template');if(!template)return;template.value=value;template.dispatchEvent(new Event('change',{bubbles:true}));setSelectedFormat(value);}
 useEffect(()=>{
  const initial=embedded?initialQuotationId:(initialQuotationId||new URLSearchParams(location.search).get('quotation')||'');
  if(/^[a-f0-9-]{36}$/.test(initial))setQuotationId(initial);
  const onMessage=(e:MessageEvent)=>{
   if(e.origin===location.origin&&e.source===frame.current?.contentWindow&&e.data?.type==='tip-digital-navigation'){
    const id=e.data.quotation;
    if(id===null||typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id)){history.replaceState(history.state,'','/admin/'+(isConfirmation?'confirmation':'quotation')+'-digital'+(id?'?quotation='+encodeURIComponent(id):''));setQuotationId(id||'');}
    return;
   }
   if(e.origin!==location.origin||e.source!==frame.current?.contentWindow||e.data?.type!=='tip-digital-download'||!(e.data.data instanceof Blob)||e.data.data.size>15000000)return;
   const url=URL.createObjectURL(e.data.data),a=document.createElement('a');a.href=url;a.download=String(e.data.name||'document').replace(/[\\/:*?"<>|]/g,'-');a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  };
  window.addEventListener('message',onMessage);return()=>window.removeEventListener('message',onMessage);
 },[isConfirmation]);
 useEffect(()=>{
  let alive=true,checkedEventReturn=false,editorLoaded=false;
  async function connect(){try{
   const {data:{session}}=await publicDb().auth.getSession();
   if(!session){location.assign('/admin/login?next='+(isConfirmation?'confirmation-digital':'quotation-digital'));return;}
   const r=await fetch('/api/admin/digital/session',{method:'POST',headers:{authorization:'Bearer '+session.access_token},cache:'no-store'});
   if(!r.ok)throw Error((await r.json()).error||'Akses tidak tersedia.');
   if(!checkedEventReturn){checkedEventReturn=true;try{const raw=localStorage.getItem('tip-event-order-return');if(raw){const target=JSON.parse(raw);localStorage.removeItem('tip-event-order-return');if(target.email===session.user.email?.toLowerCase()&&Date.now()-target.at<3600000&&Date.now()>=target.at&&(!target.id||/^[a-f0-9-]{36}$/.test(target.id))){location.replace('/admin/event-orders'+(target.id?'?order='+encodeURIComponent(target.id):''));return;}}}catch{}}
   if(!editorLoaded){const id=embedded?initialQuotationId:(initialQuotationId||new URLSearchParams(location.search).get('quotation')),query=new URLSearchParams();if(id)query.set('quotation',id);query.set('type',documentType);const editor=await fetch('/api/admin/digital/editor?'+query.toString(),{headers:{authorization:'Bearer '+session.access_token},cache:'no-store'});if(!editor.ok)throw Error('Editor belum dapat dimuatkan.');const html=await editor.text();if(alive){setEditorHtml(html);editorLoaded=true;}}
   if(alive){setReady(true);setError('');}
  }catch(e){if(alive)setError((e as Error).message);}}
  void connect();const timer=setInterval(connect,60000);
  const {data:{subscription}}=publicDb().auth.onAuthStateChange((_event,session)=>{if(!session){setReady(false);void fetch('/api/admin/digital/session',{method:'DELETE',keepalive:true});location.assign('/admin/login');}});
  return()=>{alive=false;clearInterval(timer);subscription.unsubscribe();};
 },[documentType,isConfirmation,initialQuotationId]);
 const page=<main style={{padding:embedded?'0':'18px',maxWidth:'none'}}>
  {!embedded&&<h1 style={{fontSize:24,margin:'0 0 12px'}}>{isConfirmation?'Confirmation':'Quotation'}</h1>}
  {!embedded&&<nav aria-label="Dokumen digital" style={{display:'flex',gap:18,borderBottom:'1px solid #dce3ec',paddingBottom:10,marginBottom:12}}><Link aria-current={!isConfirmation?'page':undefined} href="/admin/quotation-digital">Quotation</Link><Link aria-current={isConfirmation?'page':undefined} href="/admin/confirmation-digital">Confirmation</Link><Link href="/admin/event-orders">Event Order / Internal</Link></nav>}
  {isConfirmation&&<section aria-label="Format Confirmation" style={{display:'grid',gridTemplateColumns:'minmax(220px,360px) 1fr',alignItems:'end',gap:'8px 16px',padding:'14px 16px',margin:'0 0 12px',border:'1px solid #cbd8d4',borderRadius:8,background:'#f7faf9'}}><label style={{display:'grid',gap:6,fontWeight:600}}>Pilih format Confirmation<select value={selectedFormat} onChange={e=>chooseConfirmationFormat(e.target.value)} disabled={!editorModeReady||!confirmationFormats.length} style={{padding:10,border:'1px solid #cbd8d4',borderRadius:6,background:'#fff'}}><option value="">Pilih jenis majlis…</option>{confirmationFormats.map(format=><option key={format.value} value={format.value}>{format.label}</option>)}</select></label><p style={{margin:0,color:'#51676a',fontSize:14}}>Butiran majlis, kadar, menu dan pakej boleh diedit. Menu boleh terus ditampal; billing tambahan boleh ditambah bila perlu.</p></section>}
  {!embedded&&<p><Link href="/admin/dokumen-pelanggan">{tx('Dokumen pelanggan — Confirmation bertandatangan, e-Invois & bayaran','Customer documents — signed Confirmation, e-Invoice & payment')}</Link></p>}
  {ready&&quotationId&&<SourceFile quotation={quotationId}/>}
  {ready&&quotationId&&<StaffSignatures/>}
  {ready&&quotationId&&<button disabled={sending} onClick={resend}>Hantar semula e-mel kelulusan</button>}
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert" className="error">{error}</p>}
  {!ready&&!error&&<p role="status">{tx('Menyambungkan sesi admin…','Connecting admin session…')}</p>}
  {ready&&<iframe ref={frame} title={isConfirmation?'Confirmation Digital Drawbridge':'Quotation Digital Drawbridge'} srcDoc={editorHtml} onLoad={()=>setEditorType()} style={{width:'100%',height:'calc(100vh - 220px)',minHeight:650,border:'1px solid #dce3ec',borderRadius:8,background:'white',visibility:isConfirmation||editorModeReady?'visible':'hidden'}}/>}
 </main>;
 return embedded?page:<AdminShell title={isConfirmation?'Confirmation':'Quotation'}>{page}</AdminShell>;
}
