'use client';
import {T, LocalizedAttributes} from "../../../components/Language";
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Brand from '../../../components/Brand';
export default function ProtectedQuote() { const { id } = useParams<{
    id: string;
}>(), [challenge, setChallenge] = useState<any>(null), [code, setCode] = useState(''), [download, setDownload] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''); async function request(verify = false) { setBusy(true); setError(''); try {
    const body = verify ? { ...challenge, code } : { token: new URLSearchParams(window.location.search).get('t') };
    const r = await fetch('/api/quotes/' + id + '/' + (verify ? 'verify' : 'start'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const b = await r.json();
    if (!r.ok)
        throw Error(b.error || 'Pautan tidak sah atau dokumen tidak tersedia.');
    if (verify)
        setDownload(b.download_url);
    else
        setChallenge(b);
}
catch (e) {
    setError(e instanceof Error ? e.message : 'Permintaan gagal.');
}
finally {
    setBusy(false);
} } return <><header><Brand /></header><main className="verify-page"><section className="panel verification-card"><span className="secure-icon"><T>{"\u25A3"}</T></span><p className="eyebrow"><T>{"DOKUMEN PERIBADI"}</T></p><h1><T>{"Sebutharga TI Properties"}</T></h1><p><T>{"Dokumen PDF ini hanya boleh dibuka oleh pelanggan melalui kod yang dihantar ke e-mel permohonan."}</T></p><T>{download ? <><p className="success-text"><T>{"E-mel disahkan. Akses sah selama 15 minit."}</T></p><a className="btn" href={download}><T>{"Muat turun PDF sebut harga \u2193"}</T></a></> : challenge ? <form onSubmit={e => { e.preventDefault(); void request(true); }}><p><strong>Ref no: {challenge.reference}</strong><br/><T>{challenge.delivery === 'accepted' ? 'Kod dihantar ke ' : 'Penghantaran kod sedang diproses untuk '}</T><T>{challenge.email_hint}</T><T>{". Semak Inbox dan Spam."}</T></p><label htmlFor="quote-code"><T>{"Kod pengesahan 6 digit"}</T></label><input id="quote-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value)} required/><button disabled={busy}><T>{busy ? 'Menyemak…' : 'Sahkan & buka dokumen'}</T></button><button className="text-button" type="button" disabled={busy} onClick={() => void request()}><T>{"Minta kod baharu"}</T></button></form> : <button disabled={busy} onClick={() => void request()}><T>{busy ? 'Menghantar kod…' : 'Hantar kod ke e-mel saya'}</T></button>}</T><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T><small><T>{"Pautan ini tidak mengesahkan tempahan atau pembayaran."}</T></small></section></main></>; }
