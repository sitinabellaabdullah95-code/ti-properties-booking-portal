import './style.css';
import {LanguageProvider} from '../components/Language';
export const metadata={title:'TI Properties | Booking Portal',description:'Venue enquiries for TI Properties'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ms"><body><LanguageProvider>{children}</LanguageProvider></body></html>}
