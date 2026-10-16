export const WHATSAPP_NUMBER='60168434470';
export function bookingWhatsAppUrl({reference,venue,event,date,endDate,start,end,pax,setup,ramadan=false}){
 const lines=['Salam TI Properties, saya ingin membuat susulan permohonan ini.','Rujukan: '+reference,'Lokasi / ruang: '+venue,'Jenis: '+event,'Tarikh pilihan: '+date];
 if(ramadan)lines.push('Pertanyaan Buffet Ramadan sahaja. Harga, masa dan tempat duduk belum disahkan.');
 else if(endDate&&endDate!==date)lines.push('Tarikh keluar: '+endDate,'Masuk: 15:00 · Keluar: 12:00 (masa Malaysia)');
 else lines.push('Slot pilihan: '+start+' – '+end+' (masa Malaysia)');
 lines.push('Tetamu: '+pax);if(setup)lines.push('Setup: '+setup);lines.push('Status: Menunggu semakan admin. Belum disahkan.');
 return 'https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(lines.join('\n'));
}
