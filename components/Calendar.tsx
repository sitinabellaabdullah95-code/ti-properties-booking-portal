'use client';
import {T, LocalizedAttributes, useLanguage} from "./Language";
import { overlapsSlot } from '../lib/event-slots.mjs';
import { useEffect, useState } from 'react';
type Period = {
    start: string;
    end: string;
};
const iso = (d: Date) => d.toISOString().slice(0, 10);
export default function Calendar({ venue, stay, date, onSelect, onSlot, slots, onAvailability }: {
    venue: string;
    stay: boolean;
    date: string;
    onSelect: (s: string) => void;
    onSlot?: (start: string, end: string) => void;
    slots?: {
        start: string;
        end: string;
        label: string;
    }[];
    onAvailability?: (periods: Period[] | null) => void;
}) { const {locale}=useLanguage();
    const [month, setMonth] = useState(() => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })).toISOString().slice(0, 7)), [periods, setPeriods] = useState<Period[]>([]), [capacity, setCapacity] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('');
    const first = new Date(month + '-01T00:00:00Z'), days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate(), today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    useEffect(() => { const c = new AbortController(); setLoading(true); setError(''); onAvailability?.(null); const end = iso(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1))); fetch('/api/availability?' + new URLSearchParams({ venue, from: month + '-01', to: end }), { signal: c.signal }).then(async (r) => { const b = await r.json(); if (!r.ok)
        throw Error(b.error); setPeriods(b.periods); onAvailability?.(b.periods); setCapacity(b.capacity); }).catch(e => { if (e.name !== 'AbortError')
        setError('Kalendar belum tersedia. Sila cuba semula.'); }).finally(() => { if (!c.signal.aborted)
        setLoading(false); }); return () => c.abort(); }, [venue, month]);
    useEffect(() => { if (date && date.slice(0, 7) !== month)
        setMonth(date.slice(0, 7)); }, [date]);
    const shift = (n: number) => setMonth(iso(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + n, 1))).slice(0, 7));
    const dayPeriods = periods.filter(p => p.start < date + 'T23:59:59' && p.end > date + 'T00:00:00');
    return <section className="calendar panel"><div className="section-heading"><div><span className="eyebrow"><T>{"02 / PILIH TARIKH"}</T></span><h2><T>{"Kalendar ketersediaan"}</T></h2></div><div className="month-nav"><LocalizedAttributes><button type="button" className="icon-btn" aria-label="Bulan sebelumnya" onClick={() => shift(-1)}><T>{"\u2039"}</T></button></LocalizedAttributes><strong><T>{first.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</T></strong><LocalizedAttributes><button type="button" className="icon-btn" aria-label="Bulan seterusnya" onClick={() => shift(1)}><T>{"\u203A"}</T></button></LocalizedAttributes></div></div><p className="muted"><T>{stay ? 'Pilih tarikh masuk. Baki unit dikira untuk malam berkenaan.' : 'Pilih hari untuk melihat waktu yang sudah ditempah.'}</T></p><div className="calendar-legend"><span><i /><T>{"Tersedia"}</T></span><span><i className="amber"/><T>{"Sebahagian ditempah"}</T></span><span><i className="red"/><T>{"Penuh"}</T></span></div><T>{error ? <p role="alert" className="error"><T>{error}</T></p> : <div className="calendar-grid" aria-busy={loading}><T>{['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Ahd'].map(d => <strong key={d} className="weekday"><T>{d}</T></strong>)}</T><T>{Array.from({ length: (first.getUTCDay() + 6) % 7 }, (_, i) => <span key={'pad' + i}/>)}</T><T>{Array.from({ length: days }, (_, i) => { const d = month + '-' + String(i + 1).padStart(2, '0'); const start = d + (stay ? 'T15:00:00' : 'T00:00:00'), end = stay ? iso(new Date(Date.parse(d) + 86400000)) + 'T12:00:00' : d + 'T23:59:59'; const count = periods.filter(p => p.start < end && p.end > start).length; const full = stay ? capacity > 0 && count >= capacity : periods.some(p => p.start <= start && p.end >= end); return <LocalizedAttributes><button type="button" key={d} disabled={loading || d < today || full} aria-pressed={date === d} aria-label={d + (full ? ' penuh' : ' pilih tarikh')} className={'calendar-day ' + (date === d ? 'selected ' : '') + (full ? 'full' : count ? 'partial' : 'available')} onClick={() => onSelect(d)}><b><T>{i + 1}</T></b><small><T>{loading ? '…' : full ? 'Penuh' : stay ? Math.max(0, capacity - count) + ' unit' : count ? 'Lihat slot' : 'Tersedia'}</T></small></button></LocalizedAttributes>; })}</T></div>}</T><T>{date && !loading && !error && <div className="day-detail"><strong><T>{date}</T><T>{" \u00B7 "}</T><T>{stay ? 'Penginapan' : 'Jadual ruang'}</T></strong><T>{!dayPeriods.length ? <p><T>{"Tiada tempahan disahkan pada hari ini."}</T></p> : <ul><T>{dayPeriods.map((p, i) => <li key={i}><T>{stay ? 'Unit ditempah' : p.start.slice(11, 16) + ' – ' + p.end.slice(11, 16)}</T> <span className="status-badge"><T>{"Disahkan"}</T></span></li>)}</T></ul>}</T><T>{!stay && onSlot && <><p><T>{slots ? 'Pilih satu slot Elysium Hall.' : 'Pilih slot mula (1 jam). Tempoh boleh diubah dalam borang.'}</T></p><div className="time-slots"><T>{(slots || Array.from({ length: 28 }, (_, i) => { const mins = 480 + i * 30; return { start: String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'), end: String(Math.floor((mins + 60) / 60)).padStart(2, '0') + ':' + String((mins + 60) % 60).padStart(2, '0'), label: String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0') }; })).map(slot => { const blocked = overlapsSlot(periods, date, slot.start, slot.end); return <button type="button" key={slot.start + '-' + slot.end} disabled={blocked} onClick={() => onSlot(slot.start, slot.end)}><T>{slot.label}</T><T>{blocked ? ' · Ditempah' : ''}</T></button>; })}</T></div></>}</T><p className="muted"><T>{"Masa Malaysia. Ketersediaan boleh berubah; permohonan memerlukan kelulusan admin."}</T></p></div>}</T></section>;
}
