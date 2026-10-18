'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {T,LocalizedAttributes} from './Language';
import {photoGroup} from '../lib/photo-groups.mjs';
type Item={id:string;title:string;category:string;destination:string};
const labels:Record<string,string>={elysium:'Elysium Hall',gallery:'Gallery',hydraulic:'Hydraulic Tour',facade:'Kuala Terengganu Drawbridge'};
export default function VenuePhotos({group}:{group:'elysium'|'gallery'|'hydraulic'|'facade'}){
 const [items,setItems]=useState<Item[]>([]),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch('/api/media',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();const b=await r.json();setItems(b.items||[])}).catch(e=>{if(e.name!=='AbortError')setFailed(true)}).finally(()=>{if(!controller.signal.aborted)setReady(true)});return()=>controller.abort()},[]);
 const visible=items.filter(i=>photoGroup(i)===group).sort((a,b)=>a.title.localeCompare(b.title)).slice(0,group==='facade'?6:4);
 return <section className="venue-photos"><div className="section-heading"><div><p className="eyebrow"><T>GAMBAR SEBENAR</T></p><h2>{labels[group]}</h2></div><Link href={'/galeri-menu?destination=drawbridge&group='+group}><T>Lihat semua gambar ↗</T></Link></div>{!ready?<p><T>Memuatkan…</T></p>:failed||!visible.length?<p><T>Gambar belum tersedia. Lihat galeri atau hubungi pasukan kami.</T></p>:<div className="venue-photo-grid">{visible.map(item=><a key={item.id} href={'/api/media/'+item.id} target="_blank" rel="noopener noreferrer"><LocalizedAttributes><img src={'/api/media/'+item.id} alt={item.title} loading="lazy"/></LocalizedAttributes><span><T>Lihat gambar penuh</T> ↗</span></a>)}</div>}<p className="muted"><T>Gambar rujukan daripada TI Properties. Susun atur acara dan akses lawatan tertakluk kepada pengesahan.</T></p></section>
}
