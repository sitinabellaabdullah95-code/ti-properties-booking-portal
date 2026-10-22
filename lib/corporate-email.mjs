export const CORPORATE_BOOKING_EMAIL='corporateinnovationstrategy@tiproperties.my';
export function corporateBookingEmail(b){
 return {subject:'Permohonan baharu / New booking request — '+b.public_reference,text:[
 'PERMOHONAN TEMPAHAN BAHARU / NEW BOOKING REQUEST','',
 'Ref no: '+b.public_reference,'Nama / Name: '+b.customer_name,
 'Organisasi / Organisation: '+(b.organisation||'—'),
 'E-mel / Email: '+b.email,'Telefon / Phone: '+b.phone,
 'Ruang / Venue: '+(b.venues?.name||'TI Properties'),
 'Acara / Event: '+b.event_type,'Mula / Start: '+b.event_date+' '+b.start_time.slice(0,5),
 'Tamat / End: '+b.end_date+' '+b.end_time.slice(0,5),'Tetamu / Guests: '+b.pax,
 'Zon waktu / Time zone: Malaysia (UTC+8)','',
 'Permohonan ini perlu semakan admin dan belum mengesahkan tempahan.',
 'This request requires admin review and does not confirm a booking.','',
 'Semak dalam dashboard / Review in dashboard:',
 'https://ti-properties-booking-portal.netlify.app/admin/quotes','',
 'Log masuk admin diperlukan. Nota terperinci pelanggan hanya tersedia dalam dashboard.',
 'Admin sign-in is required. Detailed customer notes are available only in the dashboard.'
 ].join('\n')};
}
