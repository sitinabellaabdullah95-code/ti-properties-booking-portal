'use client';
import {T, LocalizedAttributes, useLanguage} from "./Language";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Brand from './Brand';
import { publicDb } from '../lib/supabase';
export default function AdminShell({ children, title = 'Papan utama' }: {
    children: React.ReactNode;
    title?: string;
}) { const {locale}=useLanguage(); const path = usePathname(), router = useRouter(), [menu, setMenu] = useState(false), [today, setToday] = useState(''); useEffect(() => { setToday(new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'full' }).format(new Date())); }, [locale]); return <div className={'admin-shell rt-admin ' + (menu ? 'sidebar-open' : '')}><aside className="admin-sidebar"><Brand /><small><T>{"TI PROPERTIES \u00B7 PENGURUSAN"}</T></small><nav><T>{[['/admin', '▦', 'Papan utama'], ['/admin#approvals', '✓', 'Kelulusan tempahan'], ['/admin/quotes', '▤', 'Sebutharga'], ['/admin/reports', '▥', 'Laporan Booking'], ['/admin#calendar', '▦', 'Kalendar ruang'], ['/admin/media', '▧', 'Gambar & menu'], ['/admin/notifications', '✉', 'Notifikasi e-mel']].map(([url, icon, name]) => <Link onClick={() => setMenu(false)} className={path === url ? 'active' : ''} key={url} href={url}><span><T>{icon}</T></span><T>{name}</T></Link>)}</T></nav><div className="sidebar-bottom"><Link href="/"><T>{"\u2197 Halaman awam"}</T></Link><Link href="/venues"><T>{"\uFF0B Tempah ruang"}</T></Link><p><T>{"3 destinasi \u00B7 12 unit penginapan"}</T></p></div></aside><div className="admin-content"><header className="admin-topbar"><div><LocalizedAttributes><button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label="Buka menu admin"><T>{"\u2630"}</T></button></LocalizedAttributes><strong><T>{title}</T></strong><small><T>{today}</T></small></div><div className="admin-account"><span className="avatar"><T>{"TI"}</T></span><span><T>{"Admin"}</T><small><T>{"TI Properties"}</T></small></span><LocalizedAttributes><button title="Log keluar" onClick={async () => { await publicDb().auth.signOut(); router.replace('/admin/login'); }}><T>{"\u21AA"}</T></button></LocalizedAttributes></div></header><T>{children}</T></div></div>; }

