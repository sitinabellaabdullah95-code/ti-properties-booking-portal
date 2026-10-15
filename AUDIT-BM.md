# Status TI Properties Booking Portal

ZIP asal ditemui di Downloads; fail asal tidak diubah. Kod dibaiki dan dimuat naik ke repositori GitHub pengguna. Hosting yang diluluskan ialah Netlify Free; database ialah Supabase Free dalam organisasi TI PROPERTIES SDN BHD.

## Siap dan disahkan
- Borang BM untuk enam ruang di tiga destinasi.
- Inventori 12 unit Kijal dengan tarikh masuk/keluar berasingan.
- Dashboard memilih unit, menapis status dan merekod perubahan pengesahan.
- Production build, ujian validator dan ujian HTTP tempatan lulus.
- Audit dependencies selepas pembaikan PostCSS tidak menemui kelemahan diketahui.
- Paparan utama berjaya diperiksa dalam pelayar.
- Database Supabase aktif, RLS dihidupkan pada semua jadual aplikasi dan akses privileged diasingkan daripada browser.
- Ujian database sebenar: pertindihan serentak ditolak; slot bersebelahan diterima; akses role biasa disekat; had permohonan e-mel dan rangkaian berfungsi; log audit diwujudkan.
- Data ujian dibersihkan. Lihat DATABASE-VERIFICATION.md untuk bukti dan batas ujian.

## Belum selesai
- Satu medan rahsia server Netlify menunggu pengguna tampal terus nilai dari Supabase; pelayar automasi tidak mengembalikan nilai kunci. Tiada kunci disimpan dalam sumber atau chat.
- Akaun admin tipgroupmarketing@gmail.com menunggu pengguna menetapkan password dalam borang Auth yang disediakan. Peranan admin dan ujian login akan diselesaikan selepas akaun wujud.
- Deployment, ujian borang melalui hosting dan URL awam belum disahkan. Portal belum boleh dilaporkan live.

## Tetapan operasi
Masuk apartment 15:00 dan keluar 12:00 ialah tetapan awal yang perlu disahkan pihak operasi. Harga dan kapasiti rasmi belum diberikan. Tiada bayaran online atau notifikasi e-mel automatik. Semua penghantaran ialah permohonan sehingga admin mengesahkan. Status confirmed/completed menyekat inventori; pending/quoted/awaiting_payment tidak mengunci unit.

