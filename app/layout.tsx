import './style.css';
import './corporate.css';
import type {Metadata} from 'next';
import OptionalAnalytics from '../components/OptionalAnalytics';
import {LanguageProvider} from '../components/Language';
export const metadata:Metadata={metadataBase:new URL('https://ti-properties-booking-portal.netlify.app'),title:{default:'Kuala Terengganu Drawbridge | Portal Tempahan',template:'%s | TI Properties'},description:'Tempah Hall Utama Elysium Level 3, VVIP Meeting Room Level 2, lawatan Kuala Terengganu Drawbridge. Semak jadual dan mohon sebut harga.',openGraph:{type:'website',locale:'ms_MY',siteName:'TI Properties',title:'Kuala Terengganu Drawbridge · Acara & Lawatan',description:'Ruang acara, mesyuarat, jamuan dan lawatan Kuala Terengganu Drawbridge.',images:[{url:'/images/drawbridge.jpg',alt:'Kuala Terengganu Drawbridge'}]},twitter:{card:'summary_large_image'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ms"><body><LanguageProvider>{children}<OptionalAnalytics/></LanguageProvider></body></html>}
