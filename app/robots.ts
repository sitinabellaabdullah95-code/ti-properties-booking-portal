import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/api','/sebut-harga/','/tempahan/']},sitemap:'https://ti-properties-booking-portal.netlify.app/sitemap.xml'};}
