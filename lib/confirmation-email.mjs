export function confirmationEmail(b){
 if(b.status!=='confirmed')throw Error('NOT_CONFIRMED');
 const venue=b.venues?.name||'Ruang TI Properties';
 return {subject:'Pengesahan tempahan TI Properties — '+b.id,text:[
 'Salam '+b.customer_name+',','',
 'Tempahan anda telah disahkan oleh admin TI Properties.','',
 'Rujukan: '+b.id,'Lokasi: '+venue,'Unit / ruang: '+(b.units?.name||'Rujuk admin'),
 'Acara / penginapan: '+b.event_type,'Mula: '+b.event_date+' '+b.start_time.slice(0,5),
 'Tamat: '+b.end_date+' '+b.end_time.slice(0,5),'Zon waktu: Malaysia (UTC+8)','Jumlah tetamu: '+b.pax,'',
 'Untuk pertanyaan atau perubahan, hubungi 016-843 4470 atau balas e-mel ini.',
 'Butiran harga, menu dan bayaran adalah mengikut sebut harga yang dipersetujui bersama pasukan kami.','',
 'TI Properties Sdn. Bhd.'
 ].join('\n')};
}
