# Pengesahan database Supabase

Projek: ti-properties-booking-portal (slqbzkyuindxzdurcspx).

- Enam venue / ruang dan 12 unit apartment dipasang.
- RLS diaktifkan bagi semua enam jadual aplikasi.
- Anonymous tidak boleh membaca bookings atau memanggil submit_enquiry.
- Role authenticated tidak boleh mengemas kini nama pelanggan; kolum status/unit sahaja dibenarkan dan masih memerlukan polisi admin.
- Dua pengesahan bertindih dihantar serentak: satu berjaya, satu ditolak dengan 23P01 no_double_booking.
- Slot bersebelahan diterima.
- Perubahan pengesahan direkod dalam booking_audit.
- Role authenticated tanpa admin tidak dapat membaca rekod ujian.
- RPC berjaya menggunakan role service_role.
- Permohonan keenam bagi e-mel sama dalam sejam ditolak. Permohonan kesebelas bagi identiti rangkaian sama dalam sejam ditolak.
- Data ujian pengesahan dibersihkan; ujian rate limit dibatalkan melalui rollback.
- Security advisor: tiada WARN/ERROR. Satu INFO disengajakan: enquiry_limits tiada polisi akses pengguna, dan semua akses anon/authenticated telah ditarik. Jadual ini digunakan oleh server sahaja.

Authentication melalui pelayar, penghantaran borang di hosting serta URL awam belum disahkan. Ujian login admin menunggu akaun admin diwujudkan.

Rujukan maklumat advisor: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
