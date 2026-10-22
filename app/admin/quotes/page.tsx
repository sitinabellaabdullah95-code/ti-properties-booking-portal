'use client';
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
export default function Quotes() { const {locale}=useLanguage();
    const [rows, setRows] = useState<Booking[]>([]), [quotes, setQuotes] = useState<Quote[]>([]), [ready, setReady] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState('');
    async function load() { const db = publicDb(), { data: { user } } = await db.auth.getUser(); if (!user)
        throw Error('Sila log masuk admin dahulu.'); const { data: admin } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(); if (!admin)
        throw Error('Akaun ini tiada akses admin.'); const [b, q] = await Promise.all([db.from('bookings').select('id,public_reference,customer_name,email,phone,organisation,event_type,event_date,pax,notes,status,venues(name)').order('created_at', { ascending: false }), db.from('booking_quotes').select('id,booking_id,created_at,opened_at,archived,storage_path,message').order('created_at', { ascending: false })]); if (b.error || q.error)
        throw Error('Rekod belum dapat dimuatkan.'); setRows((b.data || []) as unknown as Booking[]); setQuotes(q.data || []); setReady(true); }
    useEffect(() => { load().catch(e => setError(e.message)); }, []);
    async function send(e: React.FormEvent<HTMLFormElement>, b: Booking) { e.preventDefault(); if (!window.confirm(translateCurrent('Hantar pautan sebutharga PDF ini kepada ') + b.email + '?'))
        return; const form = e.currentTarget, fd = new FormData(form), file = fd.get('file') as File; setError(''); setMessage(''); if (!file || file.type !== 'application/pdf' || file.size > 8388608) {
        setError('Pilih PDF maksimum 8 MB.');
        return;
    } setBusy(b.id); try {
        const db = publicDb(), path = crypto.randomUUID() + '.pdf';
        const { error } = await db.storage.from('portal-quotes').upload(path, file, { contentType: 'application/pdf', upsert: false });
        if (error)
            throw Error('PDF tidak dapat dimuat naik.');
        const { data: { session } } = await db.auth.getSession();
        const r = await fetch('/api/admin/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session?.access_token }, body: JSON.stringify({ booking_id: b.id, storage_path: path, message: String(fd.get('message') || '') }) });
        const result = await r.json();
        if (!r.ok)
            throw Error(result.error);
        setMessage(result.delivery === 'accepted' ? 'Gmail menerima e-mel sebutharga untuk penghantaran.' : 'Sebutharga disimpan. Semak status di menu Notifikasi e-mel.');
        form.reset();
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
    return <AdminShell title="Permintaan sebutharga"><main><p className="eyebrow"><T>{"SEBUTHARGA ACARA & PENGINAPAN"}</T></p><h1><T>{"Sebutharga pelanggan"}</T></h1><p className="muted"><T>{"Semak butiran permohonan, muat naik PDF dan hantar pautan peribadi melalui e-mel. Pelanggan perlu kod e-mel untuk membuka dokumen."}</T></p><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T><T>{message && <p className="panel success-text" role="status"><T>{message}</T></p>}</T><T>{ready && !rows.length && <p><T>{"Belum ada permohonan."}</T></p>}</T><div className="quote-list"><T>{rows.map(b => <article className="panel quote-request" key={b.id}><div className="quote-request-heading"><div className="date-tile"><strong><T>{b.event_date.slice(8)}</T></strong><small><T>{b.event_date.slice(0, 7)}</T></small></div><div><small><T>{b.venues?.name}</T><T>{" \u00B7 "}</T><T>{b.pax}</T><T>{" tetamu"}</T></small><h2><T>{b.event_type}</T></h2><p>{b.customer_name}<T>{" \u00B7 "}</T>{b.organisation}</p></div><span className={'status-chip status-' + b.status}><T>{b.status}</T></span></div><div className="quote-contact"><span>{b.email}</span><span>{b.phone}</span><small><T>{"Rujukan: "}</T><T>{b.public_reference}</T></small></div><T>{b.notes && <details><summary><T>{"Butiran acara & keperluan pelanggan"}</T></summary><div className="booking-brief">{b.notes}</div></details>}</T><T>{quotes.filter(q => q.booking_id === b.id).map(q => <div className="quote-version" key={q.id}><div><strong><T>{"PDF sebutharga \u00B7 "}</T><T>{new Date(q.created_at).toLocaleDateString(locale, { timeZone: 'Asia/Kuala_Lumpur' })}</T></strong><p><T>{q.archived ? 'Diarkibkan — pautan pelanggan ditutup' : q.opened_at ? 'Pelanggan telah membuka PDF' : 'Belum dibuka pelanggan'}</T></p></div><div className="approval-actions"><button disabled={!!busy} onClick={() => void preview(q)}><T>{"Pratonton PDF"}</T></button><button disabled={!!busy} onClick={() => void archive(q)}><T>{q.archived ? 'Buka semula' : 'Arkibkan pautan'}</T></button></div></div>)}</T><T>{!['cancelled', 'rejected'].includes(b.status) && <details className="send-quote"><summary><T>{"\uFF0B Hantar "}</T><T>{quotes.some(q => q.booking_id === b.id) ? 'versi baharu' : 'sebutharga PDF'}</T></summary><form onSubmit={e => void send(e, b)}><label htmlFor={'pdf-' + b.id}><T>{"Dokumen PDF \u00B7 maksimum 8 MB"}</T></label><p className="muted"><T>{"Gunakan nombor rujukan ini pada PDF sebelum memuat naik: "}</T><strong>{b.public_reference}</strong></p><input id={'pdf-' + b.id} name="file" type="file" accept="application/pdf" required/><label htmlFor={'message-' + b.id}><T>{"Mesej kepada pelanggan"}</T></label><textarea id={'message-' + b.id} name="message" rows={4} maxLength={4000} defaultValue={locale==='en'?'Ref no: '+b.public_reference+' — Thank you for your request for '+b.event_type+' on '+b.event_date+'. Please find our quotation for your review. Contact TI Properties if you have any questions.':'Ref no: '+b.public_reference+' — Terima kasih atas permintaan anda untuk '+b.event_type+' pada '+b.event_date+'. Bersama ini kami sediakan sebutharga untuk semakan anda. Sila hubungi pasukan TI Properties jika ada sebarang pertanyaan.'}/><p className="muted"><T>{"Hantar kepada "}</T>{b.email}<T>{". Tindakan ini tidak mengubah status kelulusan atau mengesahkan bayaran."}</T></p><button disabled={!!busy}><T>{busy === b.id ? 'Menghantar…' : '✉ Hantar sebutharga melalui e-mel'}</T></button></form></details>}</T><div className="quote-followup"><a href={'https://wa.me/' + b.phone.replace(/[^0-9]/g, '').replace(/^0/, '60') + '?text=' + encodeURIComponent('Salam ' + b.customer_name + ', kami daripada TI Properties ingin membuat susulan permohonan ' + b.event_type + ' pada ' + b.event_date + '.')} target="_blank" rel="noopener noreferrer"><T>{"WhatsApp pelanggan \u2197"}</T></a></div></article>)}</T></div></main></AdminShell>;
}
