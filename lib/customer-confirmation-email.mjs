export function customerConfirmationEmail(source,link){
 const name=String(source.customer||'Tuan / Puan').replace(/\s+/g,' ').trim();
 const title=source.title||source.payload?.eventTitle||'acara';
 const date=iso=>/^\d{4}-\d{2}-\d{2}$/.test(iso||'')?new Date(iso+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):String(iso||'—');
 const start=date(source.event_date),end=source.payload?.eventEndDate;
 const period=start+(end&&end!==source.event_date?' – '+date(end):'');
 const paragraphs=[
  'Salam sejahtera '+name+',',
  'Terima kasih kerana memilih Elysium Hall, Kuala Terengganu Drawbridge untuk '+title+' pada '+period+'.',
  'Bersama-sama e-mel ini dilampirkan dokumen Confirmation bernombor rujukan '+source.ref+' untuk semakan dan tindakan pihak tuan / puan.',
  'Mohon pihak tuan / puan menandatangani serta mengecop dokumen tersebut, kemudian mengembalikannya bersama bukti pembayaran atau salah satu dokumen berikut, mengikut yang berkenaan.',
  'Letter of Undertaking (LOU) — Surat Aku Janji\nLocal Order (LO) — Pesanan Tempatan\nPurchase Order (PO) — Pesanan Belian',
  'Borang maklumat e-Invois juga boleh dilengkapkan sekiranya diperlukan.',
  'Sila gunakan pautan berikut untuk memulangkan dokumen:\n'+link,
  'Sekiranya terdapat sebarang pindaan atau pertanyaan, sila maklumkan kepada saya.',
  'Terima kasih atas kerjasama pihak tuan / puan.',
  'Yang benar,'
 ];
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const html=paragraphs.map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('')+'<img src="cid:nabella-approval-signature" alt="Tandatangan Siti Nabella Abdullah" width="160" style="display:block;width:160px;height:auto"><p><strong>Siti Nabella Abdullah</strong><br>Executive, Sales<br>TI Properties Sdn Bhd<br>011-7161 0309</p>';
 return {subject:'Confirmation Tempahan '+String(title).replace(/[\r\n]/g,' ')+' | '+String(source.ref).replace(/[\r\n]/g,' '),text:paragraphs.join('\n\n')+'\n\nSiti Nabella Abdullah\nExecutive, Sales\nTI Properties Sdn Bhd\n011-7161 0309',html:'<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">'+html+'</div>'};
}
