# TI Properties Booking Portal

Next.js + Supabase untuk permohonan venue, penginapan 12 unit dan pengurusan admin.

## Deployment yang disasarkan
Vercel + Supabase, repositori GitHub milik pengguna. Jangan publish sehingga database dan pemboleh ubah pelayan telah dikonfigurasi.

1. Sambungkan akaun melalui authorization penyedia. Jangan kongsi password atau secret dalam chat.
2. Wujudkan projek Supabase yang pengguna benarkan. Jalankan schema.sql diikuti 002_hardening.sql sekali sahaja. Jika database sedia ada mempunyai data, audit data dan migrasi dahulu.
3. Wujudkan / jemput akaun tipgroupmarketing@gmail.com melalui Supabase Auth. Selepas e-mel disahkan, jalankan 003_admin.sql. Matikan pendaftaran awam jika tidak diperlukan; gunakan MFA untuk akaun operasi.
4. Konfigurasi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY dan SUPABASE_SERVICE_ROLE_KEY melalui tetapan rahsia Vercel. Service role tidak boleh dimasukkan ke browser atau repository.
5. Pasang dependencies menggunakan pnpm install --frozen-lockfile. Jalankan node --test tests/validation.test.mjs dan pnpm build.
6. Jalankan node tests/database.integration.mjs dengan environment projek ujian untuk membuktikan kekangan concurrency dan RLS. Skrip mencipta data / akaun ujian sementara dan membersihkannya. Jangan jalankan tanpa izin pada database lain.
7. Deploy, buka URL tanpa login, uji permohonan, login admin, pengesahan, penolakan pertindihan serta paparan telefon. Semak respons endpoint dan database. Hanya kemudian laporkan URL live.

## Batas operasi
Permohonan belum menjadi tempahan sah. Admin menetapkan unit dan mengesahkan status; hanya confirmed/completed menyekat inventori. Status quoted/awaiting_payment tidak mengunci unit. Check-in 15:00 dan check-out 12:00 ialah tetapan awal. Harga, kapasiti dan butiran operasi perlu disahkan pihak TI Properties. Tiada pembayaran atau notifikasi e-mel automatik.

## Keselamatan
Data pelanggan dilindungi RLS. Akses admin memerlukan auth.users yang berdaftar dalam admin_users. Akaun biasa tidak boleh menetapkan peranan sendiri. Rahsia server menggunakan server-only. Had permohonan database menggunakan e-mel dan HMAC alamat rangkaian daripada header Vercel yang dipercayai. Jika hosting berbeza dipilih, semak semula sumber IP dan origin sebelum penerbitan.

Lihat AUDIT-BM.md untuk status semasa dan batas pengesahan.
