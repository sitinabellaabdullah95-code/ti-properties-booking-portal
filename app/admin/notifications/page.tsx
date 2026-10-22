'use client';
import {T, LocalizedAttributes, useLanguage} from "../../../components/Language";
import AdminShell from '../../../components/AdminShell';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Brand from '../../../components/Brand';
import { publicDb } from '../../../lib/supabase';
type Job = {
    bookings: {public_reference:string}|null;
    id: string;
    booking_id: string | null;
    kind: string;
    state: string;
    created_at: string;
    error_code: string | null;
};
const labels: Record<string, string> = { queued: 'Menunggu penghantaran', processing: 'Sedang diproses', accepted: 'Diterima Gmail untuk penghantaran', failed: 'Gagal — perlu semakan', review: 'Keputusan tidak pasti — semak Gmail sebelum hantar semula', skipped: 'Tidak dihantar (tempahan tidak lagi disahkan)' };
export default function Notifications() { const {locale}=useLanguage();
    const [busy, setBusy] = useState(false), [allowed, setAllowed] = useState(false), [enabled, setEnabled] = useState(false), [rows, setRows] = useState<Job[]>([]), [message, setMessage] = useState(''), [error, setError] = useState('');
    async function load() { try {
        const db = publicDb();
        const { data: { user } } = await db.auth.getUser();
        if (!user)
            return;
        const { data: a } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
        if (!a)
            return;
        setAllowed(true);
        const [s, j] = await Promise.all([db.from('notification_settings').select('email_enabled').eq('id', true).single(), db.from('email_outbox').select('id,booking_id,kind,state,created_at,error_code,bookings(public_reference)').order('created_at', { ascending: false }).limit(100)]);
        if (s.error || j.error)
            throw Error();
        setEnabled(s.data.email_enabled);
        setRows((j.data || []).map(job=>({...job,bookings:(Array.isArray(job.bookings)?job.bookings[0]:job.bookings)||null})));
    }
    catch {
        setError('Rekod notifikasi belum dapat dimuatkan.');
    } }
    useEffect(() => { void load(); }, []);
    async function request(path: string) { setBusy(true); setMessage(''); setError(''); try {
        const { data: { session } } = await publicDb().auth.getSession();
        if (!session)
            throw Error('Sila log masuk admin dahulu.');
        const r = await fetch(path, { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token } });
        const b = await r.json();
        if (!r.ok)
            throw Error(b.error);
        setMessage(b.message || (b.state === 'accepted' ? 'Gmail menerima mesej untuk penghantaran. Sila semak inbox dan folder Spam.' : b.state === 'idle' ? 'Tiada mesej menunggu.' : labels[b.state] || 'Semak rekod penghantaran.'));
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Semakan gagal.');
    }
    finally {
        setBusy(false);
    } }
    return <AdminShell title="Notifikasi e-mel"><main><p className="eyebrow"><T>{"TETAPAN NOTIFIKASI"}</T></p><h1><T>{"Sambungan pengesahan tempahan"}</T></h1><T>{!allowed && <p><T>{"Sila log masuk menggunakan akaun admin untuk melihat rekod penghantaran."}</T></p>}</T><section className="panel"><h2><T>{"E-mel Gmail"}</T></h2><p><T>{"Pengirim: tipgroupmarketing@gmail.com"}</T></p><p><T>{"Semakan sambungan tidak menghantar mesej. Proses penghantaran hanya mengambil satu mesej yang sudah menunggu dalam sistem."}</T></p><div className="approval-actions"><button disabled={busy} onClick={() => void request('/api/admin/email-check')}><T>{"Semak sambungan Gmail"}</T></button><T>{allowed && <button disabled={busy} onClick={() => void request('/api/admin/email-dispatch')}><T>{"Proses mesej menunggu"}</T></button>}</T></div><T>{busy && <p role="status"><T>{"Sedang diproses\u2026"}</T></p>}</T><T>{message && <p role="status"><T>{message}</T></p>}</T><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T></section><section className="panel"><h2><T>{"Status pengaktifan"}</T></h2><p><T>{enabled ? 'E-mel pengesahan automatik aktif untuk kelulusan baharu selepas pengaktifan.' : 'E-mel automatik belum diaktifkan; ujian penghantaran perlu disahkan dahulu.'}</T></p><p><T>{"WhatsApp automatik belum aktif. Sambungan Meta masih perlu dilengkapkan."}</T></p><p><T>{"Kelulusan baharu diproses serta-merta apabila boleh, dengan semakan mesej menunggu setiap 5 minit. Status \u201CDiterima Gmail\u201D bukan pengesahan mesej sudah dibaca atau masuk inbox."}</T></p></section><T>{allowed && <section><h2><T>{"Rekod penghantaran"}</T></h2><p className="muted"><T>{"Mesej dengan keputusan tidak pasti tidak dihantar semula secara automatik bagi mengelakkan pendua. Hubungi pentadbir untuk semakan."}</T></p><div className="panel"><table><thead><tr><th><T>{"Rujukan"}</T></th><th><T>{"Jenis"}</T></th><th><T>{"Status"}</T></th></tr></thead><tbody><T>{rows.map(j => <tr key={j.id}><td><T>{j.bookings?.public_reference || (j.kind === 'test' ? 'UJIAN SISTEM' : 'PENGESAHAN / SEBUTHARGA')}</T><br /><small><T>{new Date(j.created_at).toLocaleString(locale, { timeZone: 'Asia/Kuala_Lumpur' })}</T></small></td><td><T>{j.kind === 'test' ? 'Ujian ke e-mel syarikat' : j.kind === 'otp' ? 'Kod pengesahan e-mel' : j.kind === 'quote' ? 'Pautan sebutharga PDF' : j.kind === 'receipt' ? 'Penerimaan permohonan' : 'Pengesahan tempahan'}</T></td><td><T>{labels[j.state] || j.state}</T><T>{j.error_code && <><br /><small><T>{j.error_code}</T></small></>}</T></td></tr>)}</T></tbody></table><T>{!rows.length && <p><T>{"Tiada mesej dalam rekod."}</T></p>}</T></div></section>}</T></main></AdminShell>;
}
