'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import AdminShell, {adminNavigation} from './AdminShell';
import {T, useLanguage} from './Language';
import {addDays, localToday, statusLabels, useWorkspace} from '../lib/use-workspace';
import {roomLabel} from '../lib/elysium-rooms.mjs';
import {activeStatuses, blocksCalendar} from '../lib/workspace.mjs';
import {translateText} from '../lib/language-core.mjs';
import styles from './AdminOverview.module.css';

const shortcuts = [
  ['/admin/bookings', 'check', 'blue'],
  ['/admin/calendar', 'calendar', 'cyan'],
  ['/admin/quotation-digital', 'document', 'violet'],
  ['/admin/walk-in', 'plus', 'green'],
  ['/admin/quotes', 'document', 'amber'],
  ['/admin/event-orders', 'list', 'cyan'],
  ['/admin/finance-handover', 'folder', 'green'],
  ['/admin/reports', 'chart', 'violet'],
];
const iconPaths: Record<string, string> = {
  check: 'M5 12l4 4L19 6',
  calendar: 'M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  document: 'M7 3h7l5 5v13H5V3h2zm7 0v5h5M8 12h8m-8 4h8',
  plus: 'M12 5v14M5 12h14',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  folder: 'M3 7V5h7l2 2h9v13H3V7z',
  chart: 'M4 4v16h16M8 15l4-5 3 2 5-6',
  search: 'M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
};

function Icon({name}: {name:string}) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[name] || iconPaths.folder}/></svg>;
}

export default function AdminOverview() {
  const {language, locale} = useLanguage();
  const tx = (ms:string, en:string) => language === 'en' ? en : ms;
  const router = useRouter();
  const [search, setSearch] = useState('');
  const today = localToday(), year = Number(today.slice(0,4));
  const {data, error, loading, reload} = useWorkspace(year+'-01-01', (year+1)+'-01-01');

  useEffect(() => {
    if (location.hash === '#calendar') router.replace('/admin/calendar');
    if (location.hash === '#approvals') router.replace('/admin/bookings');
  }, [router]);

  const rows = data?.bookings || [];
  const pending = rows.filter(b => b.status === 'pending').length;
  const upcoming = rows.filter(b => b.end_date >= today && b.event_date < addDays(today,7) && !['cancelled','rejected','completed'].includes(b.status))
    .sort((a,b) => (a.event_date+a.start_time).localeCompare(b.event_date+b.start_time));
  const latest = [...rows].sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0,5);
  const activeGuests = rows.filter(b => activeStatuses.includes(b.status) && b.end_date >= today).reduce((sum,b) => sum+b.pax,0);
  const now = new Date().toLocaleString('sv-SE',{timeZone:'Asia/Kuala_Lumpur'}).replace(' ','T');
  const number = new Intl.NumberFormat(locale);
  const showCount = (count:number) => data ? number.format(count) : '—';
  const venueName = (id:string) => roomLabel(data?.venues.find(v => v.id === id)?.name || '');
  const formatDate = (date:string, options:Intl.DateTimeFormatOptions) => new Date(date+'T12:00:00Z').toLocaleDateString(locale,{...options,timeZone:'UTC'});
  const bookingHref = (reference:string) => '/admin/bookings?search='+encodeURIComponent(reference);

  const nav = adminNavigation(locale);
  const normalize = (text:string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
  const query = normalize(search);
  const malayNav = adminNavigation('ms-MY');
  const englishNav = adminNavigation('en-MY');
  const menu = query
    ? nav.filter(([url],index) => [url, malayNav[index][2], translateText(englishNav[index][2],'en')]
        .some(value => normalize(value).includes(query)))
        .map(([url,,label]) => ({url,label,icon:shortcuts.find(item => item[0] === url)?.[1] || 'folder',tone:'blue'}))
    : shortcuts.map(([url,icon,tone]) => ({url,icon,tone,label:nav.find(item => item[0] === url)?.[2] || ''}));

  return <AdminShell className={styles.shell}>
    <main className={styles.dashboard}>
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Kuala Terengganu Drawbridge</p>
          <h1>{tx('Selamat datang, Admin','Welcome, Admin')}</h1>
          <p>{formatDate(today,{dateStyle:'full'})}</p>
        </div>
        <div className={styles.tools}>
          <label className={styles.search}>
            <Icon name="search"/>
            <input type="search" value={search} onChange={event => setSearch(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter' && query && menu.length === 1) router.push(menu[0].url); }}
              aria-label={tx('Cari menu admin','Find an admin menu')} aria-controls="dashboard-menu"
              placeholder={tx('Cari menu…','Find a menu…')}/>
          </label>
          <Link href="/admin/walk-in" className={styles.newBooking}><Icon name="plus"/>{tx('Walk-in baharu','New walk-in')}</Link>
        </div>
      </div>

      {error && <div className={styles.error} role="alert"><span>{error}</span><button type="button" onClick={() => void reload()}>{tx('Cuba lagi','Try again')}</button></div>}
      {loading && <p className={styles.loading} role="status"><T>Memuatkan…</T></p>}

      <div className={styles.layout}>
        <div className={styles.primary}>
          <section className={styles.hero} aria-labelledby="dashboard-review">
            <div className={styles.heroCount}>{showCount(pending)}</div>
            <div className={styles.heroText}>
              <p className={styles.eyebrow}>{tx('Tindakan hari ini','Today’s actions')}</p>
              <h2 id="dashboard-review">{tx('Tempahan menunggu semakan','Bookings awaiting review')}</h2>
              <p>{tx('Semak permohonan dan urus kelulusan tempahan.','Review requests and manage booking approvals.')}</p>
            </div>
            <Link href="/admin/bookings?status=pending" className={styles.heroAction}>{tx('Semak tempahan','Review bookings')} <span aria-hidden="true">→</span></Link>
          </section>

          <section id="dashboard-menu" aria-labelledby="dashboard-menu-heading">
            <div className={styles.heading}>
              <h2 id="dashboard-menu-heading">{query ? tx('Hasil carian menu','Menu search results') : tx('Menu utama','Main menu')}</h2>
              <small aria-live="polite">{query ? number.format(menu.length) : tx('Pautan pantas','Quick links')}</small>
            </div>
            {menu.length ? <div className={styles.menu}>{menu.map(({url,icon,tone,label}) =>
              <Link key={url} href={url} className={styles.tile} data-tone={tone}>
                <span className={styles.tileIcon}><Icon name={icon}/></span>
                <strong><T>{label}</T></strong>
                {url === '/admin/bookings' && pending > 0 && <span className={styles.badge} aria-label={tx(pending+' menunggu semakan',pending+' awaiting review')}>{showCount(pending)}</span>}
              </Link>)}</div> : <p className={styles.empty}>{tx('Tiada menu sepadan. Cuba kata kunci lain.','No matching menu. Try another keyword.')}</p>}
          </section>

          <section className={styles.panel} aria-labelledby="dashboard-activity">
            <div className={styles.heading}>
              <h2 id="dashboard-activity">{tx('Permohonan terkini','Latest requests')}</h2>
              <Link href="/admin/bookings">{tx('Lihat semua','View all')} →</Link>
            </div>
            {latest.map(b => <Link className={styles.request} href={bookingHref(b.public_reference)} key={b.id}>
              <span className={styles.dateChip}><b>{b.event_date.slice(8)}</b><small>{formatDate(b.event_date,{month:'short'})}</small></span>
              <span className={styles.itemText}>
                <strong><T>{b.event_type}</T></strong>
                <small>{b.organisation || b.customer_name} · {venueName(b.venue_id)} · {b.pax} pax</small>
              </span>
              <span className={'status-chip status-'+b.status}><T>{statusLabels[b.status] || b.status}</T></span>
            </Link>)}
            {data && !latest.length && <p className={styles.empty}>{tx('Belum ada permohonan untuk tahun ini.','No requests for this year yet.')}</p>}
          </section>
        </div>

        <aside className={styles.rail} aria-label={tx('Ringkasan operasi','Operations summary')}>
          <section className={styles.panel}>
            <div className={styles.heading}><h2>{tx('7 hari akan datang','Next 7 days')}</h2><Link href="/admin/calendar" aria-label={tx('Buka kalendar','Open calendar')}><Icon name="calendar"/></Link></div>
            <div className={styles.weekSummary}><strong>{showCount(upcoming.length)}</strong><span>{tx('tempahan akan datang','upcoming bookings')}</span></div>
            {upcoming.slice(0,4).map(b => <Link className={styles.event} key={b.id} href={bookingHref(b.public_reference)}>
              <time dateTime={b.event_date}>{formatDate(b.event_date,{day:'numeric',month:'short'})}</time>
              <span className={styles.itemText}><strong><T>{b.event_type}</T></strong><small>{b.start_time.slice(0,5)} · {venueName(b.venue_id)}</small></span>
            </Link>)}
            {data && !upcoming.length && <p className={styles.empty}>{tx('Tiada acara dijadualkan.','No events scheduled.')}</p>}
            <Link className={styles.panelLink} href="/admin/calendar"><T>Kalendar ruang</T> →</Link>
          </section>

          <section className={styles.panel}>
            <div className={styles.heading}><h2>{tx('Ruang sekarang','Spaces now')}</h2><span className={styles.count}>{showCount(data?.venues.length || 0)}</span></div>
            {data?.venues.map(v => {
              const occupied = rows.filter(b => b.venue_id === v.id && blocksCalendar(b.status) && b.event_date+'T'+b.start_time <= now && b.end_date+'T'+b.end_time > now);
              const capacity = data.units.filter(u => u.venue_id === v.id).length;
              return <Link className={styles.space} key={v.id} href={'/admin/calendar?venue='+v.id}>
                <span className={styles.dot} data-busy={occupied.length > 0}/>
                <span className={styles.itemText}><strong><T>{roomLabel(v.name)}</T></strong><small>{v.kind === 'stay'
                  ? tx('Unit tersedia: ','Available units: ')+Math.max(0,capacity-occupied.length)
                  : occupied.length ? tx('Sedang digunakan','In use now') : tx('Tiada tempahan disahkan sekarang','No confirmed booking now')}</small></span>
              </Link>;
            })}
            <Link className={styles.panelLink} href="/admin/spaces">{tx('Urus ruang','Manage spaces')} →</Link>
          </section>

          <section className={styles.guestSummary}><Icon name="chart"/><div><strong>{showCount(activeGuests)}</strong><span>{tx('Tetamu dalam tempahan aktif','Guests in active bookings')}</span></div></section>
        </aside>
      </div>
    </main>
  </AdminShell>;
}
