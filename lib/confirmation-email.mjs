export function confirmationEmail(b){
 if(b.status!=='confirmed')throw Error('NOT_CONFIRMED');
 const ref=b.public_reference||b.id;
 const venue=b.venues?.name||'Ruang TI Properties';
 return {subject:'Pengesahan tempahan / Booking confirmation TI Properties — '+ref,text:[
 'Salam '+b.customer_name+',','',
 'Tempahan anda telah disahkan oleh admin TI Properties.','',
 'Rujukan: '+ref,'Lokasi: '+venue,'Unit / ruang: '+(b.units?.name||'Rujuk admin'),
 'Acara / penginapan: '+b.event_type,'Mula: '+b.event_date+' '+b.start_time.slice(0,5),
 'Tamat: '+b.end_date+' '+b.end_time.slice(0,5),'Zon waktu: Malaysia (UTC+8)','Jumlah tetamu: '+b.pax,'',
 'Untuk pertanyaan atau perubahan, hubungi 016-843 4470 atau balas e-mel ini.',
 'Butiran harga, menu dan bayaran adalah mengikut sebut harga yang dipersetujui bersama pasukan kami.','',
 'ENGLISH','Your booking has been confirmed by TI Properties admin.','Reference: '+ref,'Venue: '+venue,'Unit / space: '+(b.units?.name||'Contact admin'),'Event / stay: '+b.event_type,'Start: '+b.event_date+' '+b.start_time.slice(0,5),'End: '+b.end_date+' '+b.end_time.slice(0,5),'Time zone: Malaysia (UTC+8)','Guests: '+b.pax,'For enquiries or changes, contact 016-843 4470 or reply to this email.','Prices, menus and payment terms follow the quotation agreed with our team.','','TI Properties Sdn. Bhd.'
 ].join('\n')};
}
