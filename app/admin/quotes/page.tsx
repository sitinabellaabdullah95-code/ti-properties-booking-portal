'use client';
import QuoteEmailSignature from '../../../components/QuoteEmailSignature';
import {guestQuotationDraft} from '../../../lib/guest-quotation-message.mjs';
import Link from 'next/link';
import {roomLabel} from '../../../lib/elysium-rooms.mjs';
import {T, LocalizedAttributes, useLanguage, translateCurrent} from "../../../components/Language";
import { useEffect, useState } from 'react';
import AdminShell from '../../../components/AdminShell';
import { publicDb } from '../../../lib/supabase';
type Booking = {
    public_reference: string;
    id: string;
    customer_name: string;
    email: string;
    phone: string;
    organisation: string;
    event_type: string;
    event_date: string;
    pax: number;
    notes: string;
    status: string;
    venues: {
        name: string;
    } | null;
};
type Quote = {
    id: string;
    booking_id: string;
    created_at: string;
    opened_at: string | null;
    archived: boolean;
    storage_path: string;
    message: string;
};
type ApprovedDigitalQuote = {id:string;reference:string;title:string;customer:string;eventDate:string;eventType:string;revision:number};
export default function Quotes() { const {locale}=useLanguage();
    const [rows, setRows] = useState<Booking[]>([]), [quotes, setQuotes] = useState<Quote[]>([]), [approvedDocs,setApprovedDocs]=useState<Record<string,ApprovedDigitalQuote[]>>({}), [approvedLoading,setApprovedLoading]=useState<Record<string,boolean>>({}), [selectedDigital,setSelectedDigital]=useState<Record<string,string>>({}), [ready, setReady] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState('');
    async function load() { const db = publicDb(), { data: { user } } = await db.auth.getUser(); if (!user)
        throw Error('Sila log masuk admin dahulu.'); const { data: admin } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(); if (!admin)
        throw Error('Akaun ini tiada akses admin.'); const [b, q] = await Promise.all([db.from('bookings').select('id,public_reference,customer_name,email,phone,organisation,event_type,event_date,pax,notes,status,venues!inner(name,location)').in('venues.location',['KT Drawbridge','Kuala Terengganu Drawbridge']).order('created_at', { ascending: false }), db.from('booking_quotes').select('id,booking_id,created_at,opened_at,archived,storage_path,message').order('created_at', { ascending: false })]); if (b.error || q.error)
        throw Error('Rekod belum dapat dimuatkan.'); setRows((b.data || []) as unknown as Booking[]); setQuotes(q.data || []); setReady(true); }
    useEffect(() => { load().catch(e => setError(e.message)); }, []);
    async function loadApproved(b:Booking){if(approvedDocs[b.id]||approvedLoading[b.id])return;setApprovedLoading(v=>({...v,[b.id]:true}));try{const db=publicDb(),{data:{session}}=await db.auth.getSession(),r=await fetch('/api/admin/quotes?booking_id='+encodeURIComponent(b.id),{headers:{Authorization:'Bearer '+(session?.access_token||'')},cache:'no-store'}),result=await r.json();if(!r.ok)throw Error(result.error||'Quotation diluluskan tidak dapat dimuatkan.');const documents=(result.documents||[]) as ApprovedDigitalQuote[];setApprovedDocs(v=>({...v,[b.id]:documents}));if(documents.length===1)setSelectedDigital(v=>({...v,[b.id]:documents[0].id}));}catch(e){setError(e instanceof Error?e.message:'Quotation diluluskan tidak dapat dimuatkan.');}finally{setApprovedLoading(v=>({...v,[b.id]:false}));}}
    async function send(e: React.FormEvent<HTMLFormElement>, b: Booking) { e.preventDefault(); if (!window.confirm(translateCurrent('Hantar pautan sebutharga PDF ini kepada ') + b.email + '?'))
        return; const form = e.currentTarget, fd = new FormData(form), file = fd.get('file') as File; setError(''); setMessage(''); if (!file || file.type !== 'application/pdf' || file.size > 8388608) {
        if(!String(fd.get('digital_quotation_id')||'')){setError('Pilih quotation yang diluluskan atau PDF maksimum 8 MB.');
        return;
    }} setBusy(b.id); try {
        const db = publicDb(), digitalQuotationId=String(fd.get('digital_quotation_id')||'');let path='';
        if(!digitalQuotationId){path=crypto.randomUUID()+'.pdf';const { error } = await db.storage.from('portal-quotes').upload(path, file, { contentType: 'application/pdf', upsert: false });if (error)throw Error('PDF tidak dapat dimuat naik.');}
        const { data: { session } } = await db.auth.getSession();
        const r = await fetch('/api/admin/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session?.access_token }, body: JSON.stringify({ booking_id: b.id, ...(digitalQuotationId?{digital_quotation_id:digitalQuotationId}:{storage_path:path}), message: String(fd.get('message') || '') }) });
        const result = await r.json();
        if (!r.ok)
            throw Error(result.error);
        setMessage(result.delivery === 'accepted' ? 'Gmail menerima e-mel sebutharga untuk penghantaran.' : 'Sebutharga disimpan. Semak status di menu Notifikasi e-mel.');
        form.reset();
        setSelectedDigital(v=>({...v,[b.id]:''}));
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Penghantaran gagal.');
    }
    finally {
        setBusy('');
    } }
    async function archive(q: Quote) { setBusy(q.id); setError(''); try {
        const { data, error } = await publicDb().from('booking_quotes').update({ archived: !q.archived }).eq('id', q.id).eq('archived', q.archived).select('id');
        if (error || !data?.length)
            throw Error('Kemas kini gagal.');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Kemas kini gagal');
    }
    finally {
        setBusy('');
    } }
    async function preview(q: Quote) { const { data, error } = await publicDb().storage.from('portal-quotes').createSignedUrl(q.storage_path, 60); if (error || !data) {
        setError('Pratonton tidak tersedia.');
        return;
    } window.open(data.signedUrl, '_blank', 'noopener,noreferrer'); }
    return <AdminShell title="Permintaan sebutharga"><main><p className="eyebrow"><T>{"SEBUTHARGA KUALA TERENGGANU DRAWBRIDGE"}</T></p><h1><T>{"Sebutharga pelanggan"}</T></h1><p className="muted"><T>{"Pilih quotation yang telah diluluskan dalam portal dan hantar pautan PDF kepada pelanggan melalui e-mel."}</T></p><div className="ops-panel" style={{marginBottom:24}}><h2><T>Quotation Digital</T></h2><p><T>Sediakan quotation dan confirmation, pakej tambahan serta folder majlis di dalam portal admin ini.</T></p><Link className="btn" href="/admin/quotation-digital"><T>Buka Quotation Digital</T> →</Link></div><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T><T>{message && <p className="panel success-text" role="status"><T>{message}</T></p>}</T><T>{ready && !rows.length && <p><T>{"Belum ada permohonan."}</T></p>}</T><div className="quote-list"><T>{rows.map(b => <article className="panel quote-request" key={b.id}><div className="quote-request-heading"><div className="date-tile"><strong><T>{b.event_date.slice(8)}</T></strong><small><T>{b.event_date.slice(0, 7)}</T></small></div><div><small><T>{roomLabel(b.venues?.name||'')}</T><T>{" \u00B7 "}</T><T>{b.pax}</T><T>{" tetamu"}</T></small><h2><T>{b.event_type}</T></h2><p>{b.customer_name}<T>{" \u00B7 "}</T>{b.organisation}</p></div><span className={'status-chip status-' + b.status}><T>{b.status}</T></span></div><div className="quote-contact"><span>{b.email}</span><span>{b.phone}</span><small><T>{"Rujukan: "}</T><T>{b.public_reference}</T></small></div><T>{b.notes && <details><summary><T>{"Butiran acara & keperluan pelanggan"}</T></summary><div className="booking-brief">{b.notes}</div></details>}</T><T>{quotes.filter(q => q.booking_id === b.id).map(q => <div className="quote-version" key={q.id}><div><strong><T>{"PDF sebutharga \u00B7 "}</T><T>{new Date(q.created_at).toLocaleDateString(locale, { timeZone: 'Asia/Kuala_Lumpur' })}</T></strong><p><T>{q.archived ? 'Diarkibkan — pautan pelanggan ditutup' : q.opened_at ? 'Pelanggan telah membuka PDF' : 'Belum dibuka pelanggan'}</T></p></div><div className="approval-actions"><button disabled={!!busy} onClick={() => void preview(q)}><T>{"Pratonton PDF"}</T></button><button disabled={!!busy} onClick={() => void archive(q)}><T>{q.archived ? 'Buka semula' : 'Arkibkan pautan'}</T></button></div></div>)}</T><T>{!['cancelled', 'rejected'].includes(b.status) && <details className="send-quote" onToggle={e=>{if(e.currentTarget.open)void loadApproved(b)}}><summary><T>{"\uFF0B Hantar "}</T><T>{quotes.some(q => q.booking_id === b.id) ? 'versi baharu' : 'sebutharga PDF'}</T></summary><form onSubmit={e => void send(e, b)}><p className="muted"><T>{"Semak nombor rujukan quotation: "}</T><strong>{b.public_reference}</strong></p><label htmlFor={'approved-quote-' + b.id}><T>Quotation yang telah diluluskan</T></label><select id={'approved-quote-' + b.id} name="digital_quotation_id" value={selectedDigital[b.id]||''} onChange={e=>setSelectedDigital(v=>({...v,[b.id]:e.target.value}))}><option value=""><T>Pilih quotation diluluskan</T></option>{(approvedDocs[b.id]||[]).map(doc=><option key={doc.id} value={doc.id}>{doc.title} · {doc.reference} · v{doc.revision}</option>)}</select>{approvedLoading[b.id]&&<p className="muted"><T>Mencari quotation yang diluluskan…</T></p>}{approvedDocs[b.id]?.length===0&&!approvedLoading[b.id]&&<p className="muted"><T>Tiada quotation diluluskan dengan nombor rujukan ini.</T></p>}<details><summary><T>Muat naik PDF lain dari komputer</T></summary><label htmlFor={'pdf-' + b.id}>Dokumen PDF · maksimum 8 MB</label><input id={'pdf-' + b.id} name="file" type="file" accept="application/pdf"/></details><label htmlFor={'message-' + b.id}><T>{"Mesej kepada pelanggan"}</T></label><textarea id={'message-' + b.id} name="message" rows={18} maxLength={4000} defaultValue={guestQuotationDraft(b)}/><QuoteEmailSignature/><p className="muted"><T>Signature e-mel Bella akan disertakan secara automatik. [Direct PDF Link] diganti dengan pautan terus PDF selepas penghantaran.</T></p><p className="muted"><T>{"Hantar kepada "}</T>{b.email} · CC: farhana@tiproperties.my<T>{". Tindakan ini tidak mengubah status kelulusan atau mengesahkan bayaran."}</T></p><button disabled={!!busy}><T>{busy === b.id ? 'Menghantar…' : '✉ Hantar sebutharga melalui e-mel'}</T></button></form></details>}</T><div className="quote-followup"><a href={'https://wa.me/' + b.phone.replace(/[^0-9]/g, '').replace(/^0/, '60') + '?text=' + encodeURIComponent('Salam ' + b.customer_name + ', kami daripada TI Properties ingin membuat susulan permohonan ' + b.event_type + ' pada ' + b.event_date + '.')} target="_blank" rel="noopener noreferrer"><T>{"WhatsApp pelanggan \u2197"}</T></a></div></article>)}</T></div></main></AdminShell>;
}
