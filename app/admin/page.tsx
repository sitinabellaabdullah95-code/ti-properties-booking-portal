'use client';
import {T, LocalizedAttributes} from "../../components/Language";
import AdminShell from '../../components/AdminShell';
import Brand from '../../components/Brand';
import Calendar from '../../components/Calendar';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { publicDb } from '../../lib/supabase';
type Booking = {
    email_verified_at: string | null;
    id: string;
    venue_id: string;
    unit_id: string | null;
    customer_name: string;
    email: string;
    phone: string;
    organisation: string;
    event_type: string;
    event_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    pax: number;
    notes: string;
    status: string;
    venues: {
        name: string;
    } | null;
};
const STATUS_LABELS: Record<string, string> = { pending: 'Menunggu semakan', quoted: 'Sebutharga', awaiting_payment: 'Menunggu bayaran', confirmed: 'Disahkan', completed: 'Selesai', rejected: 'Tidak diluluskan', cancelled: 'Dibatalkan' };
type Unit = {
    id: string;
    venue_id: string;
    name: string;
};
const statuses = ['pending', 'quoted', 'awaiting_payment', 'confirmed', 'completed', 'rejected', 'cancelled'];
export default function Admin() {
    const router = useRouter(), [rows, setRows] = useState<Booking[]>([]), [units, setUnits] = useState<Unit[]>([]), [error, setError] = useState(''), [ready, setReady] = useState(false), [allowed, setAllowed] = useState(false), [busy, setBusy] = useState(''), [filter, setFilter] = useState('all'), [calendarVenue, setCalendarVenue] = useState(''), [calendarDate, setCalendarDate] = useState('');
    async function load() { try {
        const db = publicDb();
        const { data: { user } } = await db.auth.getUser();
        if (!user) {
            router.replace('/admin/login');
            return;
        }
        const { data: admin, error: authError } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
        if (authError || !admin) {
            setError('Akaun ini tiada akses admin.');
            return;
        }
        setAllowed(true);
        const [b, u] = await Promise.all([db.from('bookings').select('email_verified_at,id,venue_id,unit_id,customer_name,email,phone,organisation,event_type,event_date,end_date,start_time,end_time,pax,notes,status,venues(name)').order('event_date', { ascending: true }), db.from('units').select('id,venue_id,name').eq('active', true).order('name')]);
        if (b.error || u.error)
            throw Error();
        setRows((b.data || []) as unknown as Booking[]);
        setUnits(u.data || []);
    }
    catch {
        setError('Dashboard tidak dapat dimuatkan. Sila cuba semula.');
    }
    finally {
        setReady(true);
    } }
    useEffect(() => { void load(); }, []);
    async function update(b: Booking, patch: {
        status?: string;
        unit_id?: string;
    }) { setError(''); setBusy(b.id); try {
        const { data, error } = await publicDb().from('bookings').update(patch).eq('id', b.id).eq('status', b.status).select('id');
        if (error) {
            if (error.code === '23P01')
                throw Error('Unit / ruang sudah ditempah pada tempoh ini. Pilih unit atau tarikh lain.');
            if (error.code === '23514')
                throw Error('Pilih unit sebelum mengesahkan tempahan.');
            throw Error('Kemas kini gagal. Sila semak akses dan cuba semula.');
        }
        if (!data?.length)
            throw Error('Rekod telah berubah. Muat semula sebelum mencuba lagi.');
        if (patch.status === 'confirmed') {
            const { data: { session } } = await publicDb().auth.getSession();
            if (session) {
                try {
                    await fetch('/api/admin/email-dispatch', { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token } });
                }
                catch { }
            }
        }
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Kemas kini gagal.');
    }
    finally {
        setBusy('');
    } }
    return <AdminShell><main id="overview"><p className="eyebrow"><T>{"PAPAN UTAMA"}</T></p><section className="admin-welcome"><div><small><T>{"SELAMAT DATANG KE PORTAL PENGURUSAN"}</T></small><h1><T>{"Urus ruang. Lancarkan acara."}</T></h1><p><T>{"Semak permohonan, sediakan sebutharga dan luluskan tempahan."}</T></p></div><Link className="btn" href="/venues"><T>{"\uFF0B Tempah ruang"}</T></Link></section><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T><T>{!ready ? <p><T>{"Memuatkan\u2026"}</T></p> : allowed ? <><div className="grid"><T>{[['Tempahan hari ini', rows.filter(b => b.status === 'confirmed' && b.event_date <= new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date()) && b.end_date >= new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())).length], ['Jumlah permohonan', rows.length], ['Menunggu semakan', rows.filter(x => x.status === 'pending').length], ['Disahkan', rows.filter(x => x.status === 'confirmed').length]].map(([k, v]) => <div className="card" key={k}><p><T>{k}</T></p><h2><T>{v}</T></h2></div>)}</T></div><div className="section-heading"><div><p className="eyebrow"><T>{"PERMOHONAN PELANGGAN"}</T></p><h2 id="approvals"><T>{"Kelulusan tempahan"}</T></h2></div><Link className="text-link" href="/admin/quotes"><T>{"Urus sebutharga \u2192"}</T></Link></div><label htmlFor="filter"><T>{"Tapis status"}</T></label><select id="filter" value={filter} onChange={e => setFilter(e.target.value)}><option value="all"><T>{"Semua"}</T></option><T>{statuses.map(s => <option key={s} value={s}><T>{STATUS_LABELS[s] || s}</T></option>)}</T></select><p className="muted"><T>{"Tetapkan unit dahulu untuk penginapan. Sistem menyekat pertindihan apabila tempahan disahkan. Masa dipaparkan mengikut Malaysia."}</T></p><div className="panel"><table><thead><tr><T>{['Tempoh / Rujukan', 'Ruang / Unit', 'Pelanggan', 'Acara / Tetamu', 'Status'].map(x => <th key={x}><T>{x}</T></th>)}</T></tr></thead><tbody><T>{rows.filter(b => filter === 'all' || b.status === filter).map(b => <tr key={b.id}><td><T>{b.event_date}</T> <T>{b.event_type.startsWith('Buffet Ramadan') ? '· Tarikh pilihan sahaja' : b.start_time}</T><br /><T>{!b.event_type.startsWith('Buffet Ramadan') && <>hingga {b.end_date} {b.end_time}</>}</T><br /><small><T>{b.id}</T></small></td><td><T>{b.venues?.name}</T><label htmlFor={'unit-' + b.id}><T>{"Unit"}</T></label><select id={'unit-' + b.id} disabled={busy === b.id} value={b.unit_id || ''} onChange={e => { if (e.target.value)
        void update(b, { unit_id: e.target.value }); }}><option value=""><T>{"Belum ditetapkan"}</T></option><T>{units.filter(u => u.venue_id === b.venue_id).map(u => <option key={u.id} value={u.id}><T>{u.name}</T></option>)}</T></select></td><td>{b.customer_name}<br />{b.organisation}<br />{b.email}<br /><T>{b.email_verified_at && <small className="verified-label"><T>{"\u2713 E-mel disahkan"}</T><br /></small>}</T>{b.phone}</td><td><T>{b.event_type}</T><T>{" / "}</T><T>{b.pax}</T><br /><T>{b.notes && <details className="event-brief"><summary><T>{"View event brief / Nota"}</T></summary><div className="booking-brief">{b.notes}</div></details>}</T></td><td><label htmlFor={'status-' + b.id}><T>{"Status"}</T></label><select id={'status-' + b.id} value={b.status} disabled={busy === b.id} onChange={e => void update(b, { status: e.target.value })}><T>{statuses.filter(s => !b.event_type.startsWith('Buffet Ramadan') || !['confirmed', 'completed', 'awaiting_payment'].includes(s)).map(s => <option key={s} value={s}><T>{s}</T></option>)}</T></select><T>{b.status === 'pending' && <div className="approval-actions"><button disabled={busy === b.id || !b.unit_id || b.event_type.startsWith('Buffet Ramadan')} onClick={() => void update(b, { status: 'confirmed' })}><T>{"Luluskan"}</T></button><button className="reject" disabled={busy === b.id} onClick={() => void update(b, { status: 'rejected' })}><T>{"Tolak"}</T></button></div>}</T></td></tr>)}</T></tbody></table><T>{!rows.length && <p><T>{"Tiada permohonan lagi."}</T></p>}</T></div><section id="calendar"><h2><T>{"Kalendar ruang"}</T></h2><label htmlFor="calendar-venue"><T>{"Pilih ruang untuk melihat jadual"}</T></label><select id="calendar-venue" className="admin-calendar-select" value={calendarVenue} onChange={e => setCalendarVenue(e.target.value)}><option value=""><T>{"Pilih ruang"}</T></option><T>{Array.from(new Map(units.map(u => [u.venue_id, u.venue_id])).values()).map(id => <option key={id} value={id}><T>{units.filter(u => u.venue_id === id).length > 1 ? 'Kijal Permai Apartment' : units.find(u => u.venue_id === id)?.name}</T></option>)}</T></select><T>{calendarVenue && <Calendar venue={calendarVenue} stay={units.filter(u => u.venue_id === calendarVenue).length > 1} date={calendarDate} onSelect={setCalendarDate}/>}</T></section></> : null}</T></main></AdminShell>;
}
