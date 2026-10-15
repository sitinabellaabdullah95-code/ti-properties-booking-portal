# Status TI Properties Booking Portal

ZIP asal ditemui di Downloads dan disalin tanpa mengubah fail asal.

## Perubahan
- Borang BM untuk enam ruang di tiga destinasi.
- Penginapan menggunakan tarikh masuk/keluar; 12 unit berasingan. Waktu 15:00/12:00 ialah tetapan awal yang perlu disahkan pihak operasi.
- Dashboard menapis status, memaparkan kontak dan memilih unit.
- RLS menghadkan data pelanggan kepada admin; akaun biasa tidak boleh menaikkan peranan sendiri.
- Status/unit sahaja boleh dikemas kini admin; perubahan direkod dalam audit.
- Kekangan PostgreSQL exclusion menyekat pengesahan serentak yang bertindih pada unit sama. Slot bersebelahan dibenarkan.
- Had penghantaran disimpan di database: lima setiap e-mel sejam, sepuluh setiap alamat rangkaian sejam. Alamat rangkaian di-HMAC dengan kunci pelayan dan tarikh; IP asal tidak disimpan. Header dipercayai khusus Vercel.
- Semakan saiz request, jenis input, tarikh, masa, persetujuan dan honeypot. Kunci service role di modul server sahaja.
- Header keselamatan dan dependencies dikemas kini.

## Belum selesai
Sambungan GitHub, Vercel dan Supabase belum disahkan. Belum ada deployment atau URL awam yang disahkan. Ujian database/RLS/pertindihan sebenar dan ujian hujung-ke-hujung memerlukan projek Supabase. Jangan gunakan kod ini sebagai bukti sistem sudah live.

Admin yang diminta: tipgroupmarketing@gmail.com. Peranan belum diaktifkan; akaun perlu diwujudkan dan e-mel disahkan terlebih dahulu.

Tiada harga, kapasiti rasmi, bayaran online atau e-mel automatik ditetapkan. Tempahan ialah permohonan sehingga admin mengesahkan.

## Pengesahan tempatan
- Ujian validator: 3 lulus, termasuk input tidak sah dan suntikan status.
- Production build Next.js: lulus.
- Audit dependencies selepas pembaikan PostCSS: tiada kelemahan diketahui dilaporkan.
- Ujian database sebenar belum dijalankan. Skrip tests/database.integration.mjs disediakan untuk ujian concurrency, RLS dan eskalasi peranan selepas sambungan.
- Preview pelayar aplikasi mengalami timeout; semakan visual belum disahkan.

- Ujian HTTP selepas pembetulan origin: empat halaman respons 200 dengan header keselamatan; cross-origin 403, JSON rosak 400, input tidak sah 400, request besar 413, jenis kandungan salah 415. Semuanya lulus.
- Production build selepas pembetulan origin: lulus.

