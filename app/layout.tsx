import './style.css';
import type {Metadata} from 'next';
import OptionalAnalytics from '../components/OptionalAnalytics';
import {LanguageProvider} from '../components/Language';
export const metadata:Metadata={metadataBase:new URL('https://ti-properties-booking-portal.netlify.app'),title:{default:'TI Properties | Tempahan Ruang, Acara & Penginapan',template:'%s | TI Properties'},description:'Tempah Hall Utama Elysium Level 3, VVIP Meeting Room Level 2, lawatan Kuala Terengganu Drawbridge, Pulau Poh Tasik Kenyir dan Kijal Permai Apartment. Semak jadual dan mohon sebut harga.',openGraph:{type:'website',locale:'ms_MY',siteName:'TI Properties',title:'TI Properties · Acara, Lawatan & Penginapan',description:'Ruang acara, lawatan Drawbridge dan penginapan di Terengganu.',images:[{url:'/images/drawbridge.jpg',alt:'Kuala Terengganu Drawbridge'}]},twitter:{card:'summary_large_image'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ms"><body><LanguageProvider>{children}<OptionalAnalytics/></LanguageProvider></body></html>}
