'use client';
import {T, LocalizedAttributes} from "./Language";
import { KIJAL_ROOMS } from '../lib/kijal-options.mjs';
import Brand, { LocationLogo } from './Brand';
import VenuePhotos from './VenuePhotos';
import ElysiumFields from './ElysiumFields';
import { bookingWhatsAppUrl } from '../lib/whatsapp.mjs';
import Calendar from './Calendar';
import { ELYSIUM_SLOTS, overlapsSlot } from '../lib/event-slots.mjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Venue = {
    id: string;
    name: string;
    location: string;
    kind: string;
};
export default function BookingPortal({ mode = "all", preferredRoom = "" }: {
    mode?: "all" | "events" | "gallery" | "ramadan" | "kijal";
    preferredRoom?: string;
}) {
    const [venues, setVenues] = useState<Venue[]>([]), [error, setError] = useState(''), [reference, setReference] = useState(''), [whatsappUrl, setWhatsappUrl] = useState(''), [busy, setBusy] = useState(false), [venueId, setVenueId] = useState(''), [date, setDate] = useState('');
    const [startTime, setStartTime] = useState(''), [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('Semua');
    const [availability, setAvailability] = useState<{
        start: string;
        end: string;
    }[] | null>(null);
    const [roomType, setRoomType] = useState('');
    useEffect(() => { if (KIJAL_ROOMS.some(r => r.value === preferredRoom))
        setRoomType(preferredRoom); }, [preferredRoom]);
    const [verification, setVerification] = useState<any>(null), [otp, setOtp] = useState(''), [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null), [pendingSummary, setPendingSummary] = useState<any>(null), [tracking, setTracking] = useState('');
    const [visit, setVisit] = useState('Daily Visit Gallery');
    const stay = venues.find(v => v.id === venueId)?.kind === 'stay';
    useEffect(() => { import('../lib/supabase').then(({ publicDb }) => publicDb().from('venues').select('id,name,location,kind').eq('active', true).order('location')).then(({ data, error }) => { if (error)
        throw error; const all = data || []; setVenues(all); if (mode === 'events' || mode === 'ramadan')
        setVenueId(all.find(v => v.name === 'Elysium Hall')?.id || ''); if (mode === 'kijal')
        setVenueId(all.find(v => v.kind === 'stay')?.id || ''); if (mode === 'gallery')
        setVenueId(all.find(v => v.name === 'Gallery')?.id || ''); const query = new URLSearchParams(window.location.search), loc = query.get('location'); if (loc)
        setLocation(loc); const space = query.get('space'); if (space)
        setVenueId(all.find(v => v.name === space)?.id || ''); if (mode === 'gallery' && query.get('visit') === 'Hydraulic Tour') {
        setVisit('Hydraulic Tour');
        setVenueId(all.find(v => v.name === 'Hydraulic Room')?.id || '');
    } }).catch(() => setError('Tempahan belum tersedia. Sila cuba semula kemudian.')); }, [mode]);
    async function submit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); setError(''); const fd = new FormData(e.currentTarget); const d = Object.fromEntries(fd.entries()); if (mode === 'ramadan') {
        d.event_type = 'Buffet Ramadan — Pertanyaan';
        d.start_time = '18:00';
        d.end_time = '22:00';
        d.notes = '[PERTANYAAN RAMADAN: tarikh pilihan sahaja; masa, harga dan tempat duduk belum disahkan] ' + d.notes;
    } if (mode === 'gallery')
        d.event_type = visit; if (!stay)
        d.end_date = d.event_date;
    else {
        d.start_time = '15:00';
        d.end_time = '12:00';
        d.event_type = 'Accommodation';
    } const payload: Record<string, unknown> = { ...d }; if (venues.find(v => v.id === venueId)?.name === 'Elysium Hall' && mode !== 'ramadan') {
        const details: Record<string, string> = {};
        for (const [k, v] of fd.entries())
            if (k.startsWith('detail.')) {
                details[k.slice(7)] = String(v);
                delete payload[k];
            }
        details.meal_type = fd.getAll('meals').map(String).join(', ');
        delete payload.meals;
        payload.details = details;
    } try {
        const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const b = await res.json();
        if (!res.ok)
            throw Error(b.error);
        if (res.status === 202) {
            setVerification(b);
            setPendingPayload(payload);
            setPendingSummary({ venue: mode === 'ramadan' ? 'Kuala Terengganu Drawbridge' : (venues.find(v => v.id === venueId)?.location + ' — ' + venues.find(v => v.id === venueId)?.name), event: String(d.event_type), date: String(d.event_date), endDate: String(d.end_date), start: String(d.start_time), end: String(d.end_time), pax: String(d.pax), setup: d.setup ? String(d.setup) : '', ramadan: mode === 'ramadan', roomType: KIJAL_ROOMS.find(r => r.value === roomType)?.label || '' });
            return;
        }
        setWhatsappUrl(bookingWhatsAppUrl({ reference: b.reference, venue: mode === 'ramadan' ? 'Kuala Terengganu Drawbridge' : (venues.find(v => v.id === venueId)?.location + ' — ' + venues.find(v => v.id === venueId)?.name), event: String(d.event_type), date: String(d.event_date), endDate: String(d.end_date), start: String(d.start_time), end: String(d.end_time), pax: String(d.pax), setup: d.setup ? String(d.setup) : '', ramadan: mode === 'ramadan', roomType: KIJAL_ROOMS.find(r => r.value === roomType)?.label || '' }));
        setReference(b.reference);
    }
    catch (err) {
        setError(err instanceof Error ? err.message : 'Permohonan gagal.');
    }
    finally {
        setBusy(false);
    } }
    async function verifyEmail(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try {
        const r = await fetch('/api/verifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challenge: verification.challenge, token: verification.token, code: otp }) });
        const b = await r.json();
        if (!r.ok)
            throw Error(b.error);
        setReference(b.reference);
        setTracking(b.tracking_url);
        setWhatsappUrl(bookingWhatsAppUrl({ ...pendingSummary, reference: b.reference }));
        setVerification(null);
        setPendingPayload(null);
        setOtp('');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Pengesahan gagal.');
    }
    finally {
        setBusy(false);
    } }
    async function resendCode() { if (!pendingPayload)
        return; setBusy(true); setError(''); try {
        const r = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pendingPayload) });
        const b = await r.json();
        if (!r.ok)
            throw Error(b.error);
        setVerification(b);
        setOtp('');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Kod belum dapat dihantar.');
    }
    finally {
        setBusy(false);
    } }
    const eventVenues = venues.filter(v => !['Gallery', 'Hydraulic Room'].includes(v.name));
    const selected = venues.find(v => v.id === venueId);
    const title = mode === 'events' ? 'Elysium Hall' : mode === 'gallery' ? 'Gallery & Hydraulic Tour' : mode === 'ramadan' ? 'Pertanyaan Buffet Ramadan' : mode === 'kijal' ? 'Kijal Permai Apartment' : 'Ruang yang tepat. Masa yang sesuai.';
    return <><header><Brand /><nav><Link href="/galeri-menu"><T>{"Galeri & Menu"}</T></Link><T>{mode === 'events' && <Link href="/drawbridge/elysium-hall/sewaan-dewan"><T>{"Sewaan dewan"}</T></Link>}</T><Link href="/"><T>{"Utama"}</T></Link><Link href="/drawbridge"><T>{"Drawbridge"}</T></Link><a href="https://wa.me/60168434470" target="_blank" rel="noopener noreferrer"><T>{"WhatsApp"}</T></a><Link href="/admin/login"><T>{"Admin"}</T></Link></nav></header><main><LocationLogo location={selected?.location || (mode === 'kijal' ? 'Kijal' : mode !== 'all' ? 'Drawbridge' : '')} className="booking-logo"/><p className="eyebrow"><T>{"TEMPAHAN TI PROPERTIES"}</T></p><h1><T>{title}</T></h1>{mode==='events'?<VenuePhotos group="elysium"/>:mode==='gallery'?<VenuePhotos group={visit==='Hydraulic Tour'?'hydraulic':'gallery'}/>:null}<p className="muted"><T>{mode === 'ramadan' ? 'Daftarkan minat anda. Pasukan kami akan menghubungi anda apabila pakej dan jadual tersedia.' : mode === 'gallery' ? 'Pilih Daily Visit Gallery atau Hydraulic Tour. Setiap lawatan tertakluk kepada semakan jadual dan kelulusan.' : 'Pilih tarikh, jenis acara dan susun atur. Hantar permohonan untuk kelulusan pasukan kami.'}</T></p><T>{mode !== 'ramadan' && <div className="steps"><span className="active"><T>{"1 \u00B7 Pilih ruang"}</T></span><span><T>{"2 \u00B7 Lihat kalendar"}</T></span><span><T>{"3 \u00B7 Sahkan e-mel"}</T></span><span><T>{"4 \u00B7 Kelulusan admin"}</T></span></div>}</T><T>{reference ? <section className="panel success" role="status"><h2><T>{"Permohonan diterima"}</T></h2><p><T>{"No. rujukan: "}</T><T>{reference}</T></p><T>{tracking && <a className="btn" href={tracking}><T>{"Semak status permohonan \u2192"}</T></a>}</T><p><T>{"Tempahan belum disahkan dan tiada bayaran dikenakan melalui portal ini. Simpan nombor ini untuk urusan dengan pasukan TI Properties."}</T></p><div className="whatsapp-success"><h3><T>{"Maklumkan admin melalui WhatsApp"}</T></h3><p><T>{"Permohonan sudah disimpan. Klik butang ini untuk membuka ringkasan kepada 016-843 4470, kemudian tekan Hantar dalam WhatsApp."}</T></p><a className="btn whatsapp-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><T>{"Hantar ke WhatsApp \u2197"}</T></a><p className="muted"><T>{"Mesej hanya dihantar selepas anda menekan Hantar dalam WhatsApp."}</T></p></div><button onClick={() => { setReference(''); setWhatsappUrl(''); setTracking(''); }}><T>{"Permohonan baharu"}</T></button></section> : verification ? <section className="panel verification-card"><p className="eyebrow"><T>{"SATU LANGKAH LAGI"}</T></p><h2><T>{"Sahkan e-mel anda"}</T></h2><p><T>{verification.delivery === 'accepted' ? 'Kod 6 digit dihantar ke ' : 'Penghantaran kod sedang diproses untuk '}</T><T>{verification.email_hint}</T><T>{". Kod sah selama 10 minit. Semak Inbox atau Spam."}</T></p><p><T>{"Permohonan hanya dihantar kepada admin selepas kod disahkan."}</T></p><form onSubmit={verifyEmail}><label htmlFor="booking-otp"><T>{"Kod pengesahan"}</T></label><input id="booking-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required/><button disabled={busy}><T>{busy ? 'Menyemak…' : 'Sahkan & hantar permohonan'}</T></button></form><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T><div className="verification-links"><button className="text-button" disabled={busy} onClick={() => void resendCode()}><T>{"Hantar kod baharu"}</T></button><button className="text-button" disabled={busy} onClick={() => { setVerification(null); setError(''); }}><T>{"Isi borang semula"}</T></button></div></section> : <>{mode === 'all' ? <><div className="drawbridge-shortcuts"><Link href="/drawbridge"><T>{"Kuala Terengganu Drawbridge \u00B7 Semua pengalaman \u2197"}</T></Link><Link href="/drawbridge/gallery"><T>{"Daily Visit Gallery & Hydraulic Tour \u2197"}</T></Link><Link href="/drawbridge/buffet-ramadan"><T>{"Buffet Ramadan \u2726"}</T></Link></div><section className="venue-picker"><div className="section-heading"><div><span className="eyebrow"><T>{"01 / PILIH RUANG"}</T></span><h2><T>{"Di mana acara anda?"}</T></h2></div></div><div className="filter-pills"><T>{['Semua', ...Array.from(new Set(venues.map(v => v.location)))].map(l => <button type="button" className={location === l ? 'active' : ''} key={l} onClick={() => setLocation(l)}><T>{l}</T></button>)}</T></div><div className="venue-cards"><T>{eventVenues.filter(v => location === 'Semua' || v.location === location).map(v => <button type="button" aria-pressed={venueId === v.id} key={v.id} className={'venue-option ' + (venueId === v.id ? 'chosen' : '')} onClick={() => { setVenueId(v.id); setDate(''); }}><LocalizedAttributes><img src={v.kind === 'stay' ? '/images/kijal-building.webp' : v.location.includes('Drawbridge') ? '/images/drawbridge.jpg' : '/images/poh.webp'} alt={v.kind === 'stay' ? 'Kijal Permai Apartment' : v.location}/></LocalizedAttributes><span className="venue-content"><LocationLogo location={v.location} className="card-location-logo"/><small><T>{v.location}</T></small><strong><T>{v.name}</T></strong><span><T>{v.kind === 'stay' ? '12 unit · Penginapan' : 'Meeting · Seminar · Breakfast · Lunch · Hi Tea · Dinner'}</T></span><b><T>{venueId === v.id ? '✓ Ruang dipilih' : 'Lihat kalendar →'}</T></b></span></button>)}</T></div></section></> : mode === 'gallery' ? <section className="panel"><span className="eyebrow"><T>{"01 / PILIH LAWATAN"}</T></span><div className="visit-options"><T>{['Daily Visit Gallery', 'Hydraulic Tour'].map((t, i) => <button type="button" className={visit === t ? 'chosen' : ''} key={t} onClick={() => { setVisit(t); setVenueId(venues.find(v => v.name === (i ? 'Hydraulic Room' : 'Gallery'))?.id || ''); setDate(''); }}><strong><T>{i ? '02' : '01'}</T><T>{" \u00B7 "}</T><T>{t}</T></strong><span><T>{i ? 'Lawatan mekanisme hidraulik Drawbridge. Jadual dan kelulusan tertakluk kepada operasi.' : 'Rancang kunjungan ke Gallery Kuala Terengganu Drawbridge.'}</T></span></button>)}</T></div></section> : mode === 'events' ? <section className="panel selected-hall"><span className="eyebrow"><T>{"KUALA TERENGGANU DRAWBRIDGE"}</T></span><h2><T>{"Elysium Hall \u00B7 Event Hall"}</T></h2><p><T>{"Meeting \u00B7 Seminar \u00B7 Breakfast \u00B7 Lunch \u00B7 Hi Tea \u00B7 Dinner"}</T></p></section> : null}{venueId && mode !== 'ramadan' && <div id="kalendar-ruang"><Calendar venue={venueId} stay={stay} onAvailability={setAvailability} date={date} slots={selected?.name === 'Elysium Hall' ? ELYSIUM_SLOTS : undefined} onSelect={d => { setDate(d); setStartTime(''); setEndTime(''); }} onSlot={(start, end) => { setStartTime(start); setEndTime(end); }}/></div>}<form className="panel booking-form" onSubmit={submit}><span className="eyebrow"><T>{"03 / MAKLUMAT TEMPAHAN"}</T></span><h2><T>{selected?.name === 'Elysium Hall' && mode !== 'ramadan' ? 'Event enquiry & quotation' : 'Lengkapkan permohonan anda'}</T></h2><T>{mode === 'all' ? <><label htmlFor="venue"><T>{"Ruang pilihan"}</T></label><select id="venue" name="venue_id" value={venueId} onChange={e => { setVenueId(e.target.value); setDate(''); }} required><option value=""><T>{"Pilih ruang"}</T></option><T>{eventVenues.map(v => <option key={v.id} value={v.id}><T>{v.location}</T><T>{" \u2014 "}</T><T>{v.name}</T></option>)}</T></select></> : <><input type="hidden" name="venue_id" value={venueId}/><p className="muted"><T>{mode === 'ramadan' ? 'Kuala Terengganu Drawbridge · Pertanyaan sahaja' : selected ? selected.location + ' — ' + selected.name : 'Memuatkan ruang…'}</T></p></>}</T><T>{selected?.name === 'Elysium Hall' && mode !== 'ramadan' ? <ElysiumFields date={date} setDate={setDate} start={startTime} end={endTime} setTimes={(a, b) => { setStartTime(a); setEndTime(b); }} availability={availability}/> : <><div className="grid"><section><h2><T>{"Maklumat anda"}</T></h2><label htmlFor="name"><T>{"Nama penuh"}</T></label><input id="name" name="customer_name" autoComplete="name" required minLength={2} maxLength={150}/><label htmlFor="org"><T>{"Organisasi (pilihan)"}</T></label><input id="org" name="organisation" maxLength={150}/><label htmlFor="email"><T>{"E-mel"}</T></label><input id="email" type="email" name="email" autoComplete="email" required maxLength={200}/><label htmlFor="phone"><T>{"Telefon"}</T></label><input id="phone" type="tel" name="phone" autoComplete="tel" required minLength={7} maxLength={30}/></section><section><h2><T>{stay ? 'Penginapan' : mode === 'gallery' ? 'Butiran lawatan' : mode === 'ramadan' ? 'Minat anda' : 'Butiran acara'}</T></h2><T>{stay && <><label htmlFor="room-type"><T>{"Jenis apartment pilihan"}</T></label><select id="room-type" name="accommodation_type" value={roomType} onChange={e => setRoomType(e.target.value)} required><option value=""><T>{"Pilih jenis bilik"}</T></option><T>{KIJAL_ROOMS.map(r => <option key={r.value} value={r.value}><T>{r.label}</T><T>{" \u2014 kadar korporat 2026 RM"}</T><T>{r.rate}</T><T>{"/malam"}</T></option>)}</T></select><p className="muted"><T>{"Jenis bilik dan kadar tertakluk kepada pengesahan admin. Kalendar menunjukkan baki keseluruhan 12 unit."}</T></p></>}</T><T>{!stay && mode !== 'gallery' && mode !== 'ramadan' && <><label htmlFor="event"><T>{"Jenis acara"}</T></label><select id="event" name="event_type"><T>{['Meeting', 'Seminar', 'Breakfast', 'Lunch', 'Hi Tea', 'Dinner'].map(x => <option key={x} value={x}><T>{x}</T></option>)}</T></select><label htmlFor="setup"><T>{"Susun atur / Setup"}</T></label><select id="setup" name="setup" required><option value=""><T>{"Pilih susun atur"}</T></option><T>{['Round Table', 'Classroom', 'Theater', 'U Shape', 'I–U–I Setup'].map(x => <option key={x} value={x}><T>{x}</T></option>)}</T></select></>}</T><label htmlFor="date"><T>{stay ? 'Tarikh masuk' : mode === 'ramadan' ? 'Tarikh pilihan (belum disahkan)' : mode === 'gallery' ? 'Tarikh lawatan' : 'Tarikh acara'}</T></label><input id="date" type="date" min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())} name="event_date" value={date} onChange={e => setDate(e.target.value)} required/><T>{stay ? <><label htmlFor="checkout"><T>{"Tarikh keluar"}</T></label><input id="checkout" type="date" name="end_date" min={date} required/><p className="muted"><T>{"Masuk: 3 petang \u00B7 Keluar: 12 tengah hari. Unit ditetapkan oleh admin sebelum pengesahan."}</T></p></> : mode === 'ramadan' ? <p className="muted"><T>{"Tarikh ini ialah cadangan anda sahaja. Jadual operasi, masa, menu dan harga akan dimaklumkan oleh pasukan kami."}</T></p> : selected?.name === 'Elysium Hall' ? <><label htmlFor="event-slot"><T>{"Slot masa Elysium Hall"}</T></label><select id="event-slot" required disabled={!date || !availability} value={startTime && endTime ? startTime + '|' + endTime : ''} onChange={e => { const [a, b] = e.target.value.split('|'); setStartTime(a || ''); setEndTime(b || ''); }}><option value=""><T>{"Pilih slot masa"}</T></option><T>{ELYSIUM_SLOTS.map(slot => <option disabled={!availability || overlapsSlot(availability, date, slot.start, slot.end)} key={slot.start + slot.end} value={slot.start + '|' + slot.end}><T>{slot.label}</T><T>{availability && overlapsSlot(availability, date, slot.start, slot.end) ? ' · Ditempah' : ''}</T></option>)}</T></select><input type="hidden" name="start_time" value={startTime}/><input type="hidden" name="end_time" value={endTime}/><p className="muted"><T>{"Kalendar menunjukkan slot yang sudah ditempah. Permohonan tertakluk kepada kelulusan."}</T></p></> : <div className="grid"><div><label htmlFor="start"><T>{"Masa mula"}</T></label><input id="start" type="time" name="start_time" value={startTime} onChange={e => setStartTime(e.target.value)} required/></div><div><label htmlFor="end"><T>{"Masa tamat"}</T></label><input id="end" type="time" name="end_time" value={endTime} onChange={e => setEndTime(e.target.value)} required/></div></div>}</T><label htmlFor="pax"><T>{"Bilangan tetamu"}</T></label><input id="pax" type="number" name="pax" min="1" max="10000" step="1" required/></section></div><label htmlFor="notes"><T>{"Keperluan tambahan (pilihan)"}</T></label><textarea id="notes" name="notes" rows={4} maxLength={mode === 'ramadan' ? 1850 : 2000}/></>}</T><div className="trap" aria-hidden="true"><label><T>{"Laman web"}</T><input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="consent"><input type="checkbox" name="consent" required/><T>{" Saya bersetuju maklumat ini digunakan untuk mengurus permohonan dan menghubungi saya. Sila jangan masukkan maklumat sensitif."}</T></label><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T><button disabled={busy || !venueId}><T>{busy ? 'Menghantar…' : mode === 'ramadan' ? 'Hantar pertanyaan →' : 'Hantar untuk kelulusan →'}</T></button><p className="muted"><T>{"Permohonan tidak menjamin ketersediaan. Harga dan kapasiti akan dimaklumkan oleh pasukan TI Properties."}</T></p></form></>}</T></main><footer><T>{"TI Properties \u00B7 Venue & penginapan Terengganu"}</T></footer></>;
}
