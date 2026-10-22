'use client';
import {T, LocalizedAttributes, translateCurrent} from "../../../components/Language";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Brand from '../../../components/Brand';
import Link from 'next/link';
const labels: Record<string, string> = { pending: 'Menunggu semakan', quoted: 'Sebutharga disediakan', awaiting_payment: 'Menunggu bayaran', confirmed: 'Disahkan', completed: 'Selesai', rejected: 'Tidak diluluskan', cancelled: 'Dibatalkan' };
export default function Tracking() { const { id } = useParams<{
    id: string;
}>(), [row, setRow] = useState<any>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false); const endpoint = () => '/api/tracking/' + id + '?t=' + new URLSearchParams(window.location.search).get('t'); async function load() { const r = await fetch(endpoint(), { cache: 'no-store' }); if (!r.ok)
    throw Error('Pautan tidak sah atau permohonan tidak ditemui.'); setRow(await r.json()); } useEffect(() => { load().catch(e => setError(e.message)); }, [id]); async function cancel() { if (!window.confirm(translateCurrent('Batalkan permohonan yang masih menunggu ini?')))
    return; setBusy(true); try {
    const r = await fetch(endpoint(), { method: 'PATCH' });
    if (!r.ok)
        throw Error((await r.json()).error);
    await load();
}
catch (e) {
    setError(e instanceof Error ? e.message : 'Kemas kini gagal');
}
finally {
    setBusy(false);
} } return <><header><Brand /><nav><Link href="/"><T>{"Portal pelanggan"}</T></Link></nav></header><main className="tracking-page"><p className="eyebrow"><T>{"PERMOHONAN ANDA"}</T></p><h1><T>{"Semak status tempahan"}</T></h1><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T><T>{row && <section className="panel"><span className={'status-chip status-' + row.status}><T>{labels[row.status] || row.status}</T></span><h2><T>{row.event_type}</T></h2><p><T>{row.venues?.location}</T><T>{" \u00B7 "}</T><T>{row.venues?.name}</T></p><dl className="booking-summary"><div><dt><T>{"Pemohon"}</T></dt><dd>{row.customer_name}</dd></div><div><dt><T>{"Tarikh & masa Malaysia"}</T></dt><dd><T>{row.event_date}</T> <T>{row.start_time.slice(0, 5)}</T><T>{" \u2192 "}</T><T>{row.end_date}</T> <T>{row.end_time.slice(0, 5)}</T></dd></div><div><dt><T>{"Tetamu"}</T></dt><dd><T>{row.pax}</T></dd></div><div><dt><T>{"Rujukan"}</T></dt><dd><T>{row.public_reference}</T></dd></div></dl><p><T>{"Simpan pautan ini untuk kegunaan anda sahaja. Sebutharga, menu dan pembayaran diuruskan bersama pasukan TI Properties."}</T></p><div className="approval-actions"><button disabled={busy} onClick={() => load().catch(e => setError(e.message))}><T>{"Muat semula status"}</T></button><T>{row.status === 'pending' && <button className="reject" disabled={busy} onClick={() => void cancel()}><T>{"Batalkan permohonan"}</T></button>}</T></div></section>}</T><p><T>{"Perlu bantuan? "}</T><a href="https://wa.me/60168434470" target="_blank" rel="noopener noreferrer"><T>{"WhatsApp 016-843 4470 \u2197"}</T></a></p></main></>; }
