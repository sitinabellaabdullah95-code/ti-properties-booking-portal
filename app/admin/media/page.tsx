'use client';
import {T, LocalizedAttributes} from "../../../components/Language";
import AdminShell from '../../../components/AdminShell';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Brand from '../../../components/Brand';
import { publicDb } from '../../../lib/supabase';
type Item = {
    id: string;
    title: string;
    category: string;
    destination: string;
    published: boolean;
    storage_path: string;
};
export default function MediaAdmin() {
    const router = useRouter(), [allowed, setAllowed] = useState(false), [items, setItems] = useState<Item[]>([]), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    async function load() { const db = publicDb(); const { data: { user } } = await db.auth.getUser(); if (!user) {
        router.replace('/admin/login');
        return;
    } const { data: admin } = await db.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(); if (!admin) {
        setError('Akaun ini tiada akses admin.');
        return;
    } setAllowed(true); const { data, error } = await db.from('media_assets').select('id,title,category,destination,published,storage_path').order('created_at', { ascending: false }); if (error)
        throw Error('Pustaka belum dapat dimuatkan.'); setItems(data || []); }
    useEffect(() => { load().catch(e => setError(e.message)); }, []);
    async function upload(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const form = e.currentTarget, fd = new FormData(form), file = fd.get('file') as File; setError(''); setMessage(''); if (!file || !file.size || file.size > 8388608 || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
        setError('Pilih JPG, PNG, WebP atau PDF, maksimum 8 MB.');
        return;
    } setBusy(true); try {
        const db = publicDb(), extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' } as Record<string, string>)[file.type], path = crypto.randomUUID() + '.' + extension;
        const { error: up } = await db.storage.from('portal-media').upload(path, file, { contentType: file.type, upsert: false });
        if (up)
            throw Error('Fail tidak dapat dimuat naik. Sila cuba semula.');
        const { error: save } = await db.from('media_assets').insert({ title: String(fd.get('title')).trim(), category: fd.get('category'), destination: fd.get('destination'), storage_path: path, mime_type: file.type, published: false });
        if (save)
            throw Error('Fail telah dimuat naik tetapi rekod belum disimpan. Hubungi pentadbir sistem sebelum cuba lagi.');
        form.reset();
        setMessage('Disimpan sebagai draf. Semak dahulu, kemudian tekan Terbitkan untuk paparan pelanggan.');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Muat naik gagal.');
    }
    finally {
        setBusy(false);
    } }
    async function publish(item: Item) { setBusy(true); setError(''); setMessage(''); try {
        const { error, data } = await publicDb().from('media_assets').update({ published: !item.published }).eq('id', item.id).eq('published', item.published).select('id');
        if (error || !data?.length)
            throw Error('Kemas kini gagal. Muat semula dan cuba lagi.');
        setMessage(item.published ? 'Paparan pelanggan dihentikan. Fail masih tersimpan.' : 'Diterbitkan untuk pelanggan.');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Kemas kini gagal.');
    }
    finally {
        setBusy(false);
    } }
    async function preview(item: Item) { setError(''); const { data, error } = await publicDb().storage.from('portal-media').createSignedUrl(item.storage_path, 60); if (error || !data) {
        setError('Pratonton tidak tersedia.');
        return;
    } window.open(data.signedUrl, '_blank', 'noopener,noreferrer'); }
    return <AdminShell title="Gambar & menu"><main><p className="eyebrow"><T>{"PENGURUSAN KANDUNGAN"}</T></p><h1><T>{"Gambar & menu makanan"}</T></h1><p className="muted"><T>{"Muat naik bahan rasmi sahaja. Elakkan maklumat pelanggan atau dokumen dalaman; fail yang diterbitkan boleh dilihat orang awam."}</T></p><T>{error && <p className="error" role="alert"><T>{error}</T></p>}</T><T>{message && <p className="panel" role="status"><T>{message}</T></p>}</T><T>{allowed && <><form className="panel" onSubmit={upload}><h2><T>{"Tambah bahan"}</T></h2><label htmlFor="title"><T>{"Tajuk"}</T></label><input id="title" name="title" required maxLength={160}/><div className="grid"><div><label htmlFor="category"><T>{"Jenis"}</T></label><select id="category" name="category"><option value="photo"><T>{"Gambar ruang"}</T></option><option value="menu"><T>{"Menu makanan"}</T></option></select></div><div><label htmlFor="destination"><T>{"Destinasi"}</T></label><select id="destination" name="destination"><option value="drawbridge"><T>{"Kuala Terengganu Drawbridge"}</T></option><option value="pulau-poh"><T>{"Pulau Poh Tasik Kenyir"}</T></option><option value="kijal"><T>{"Kijal Permai Apartment"}</T></option></select></div></div><label htmlFor="file"><T>{"Fail gambar / PDF \u00B7 maksimum 8 MB"}</T></label><input id="file" name="file" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf"/><button disabled={busy}><T>{busy ? 'Menyimpan…' : 'Simpan sebagai draf'}</T></button></form><h2><T>{"Pustaka bahan"}</T></h2>{!items.length && <p><T>{"Belum ada bahan dimuat naik. Gambar Kijal sedia ada kekal di galeri pelanggan."}</T></p>}<div className="media-grid"><T>{items.map(item => <article className="card" key={item.id}><small><T>{item.category === 'menu' ? 'MENU' : 'GAMBAR'}</T><T>{" \u00B7 "}</T><T>{item.destination}</T></small><h2>{item.title}</h2><p><T>{item.published ? 'Diterbitkan' : 'Draf / tidak dipaparkan'}</T></p><div className="approval-actions"><button disabled={busy} onClick={() => void preview(item)}><T>{"Pratonton"}</T></button><button disabled={busy} onClick={() => void publish(item)}><T>{item.published ? 'Hentikan paparan' : 'Terbitkan'}</T></button></div></article>)}</T></div></>}</T></main></AdminShell>;
}
