# Git & Vercel Rollback — Memo Cepat

**Tanggal:** 10 September 2026
**Tujuan:** Panduan kembali ke versi/build lama saat website atau kode lokal error.

> Aturan repo: push/merge ke `development`/`main` HANYA atas perintah + konfirmasi eksplisit user (lihat `AGENTS.md`).

---

## 1. Kenali Dulu Sumber Masalahnya

| Sumber masalah | Alur yang dipakai |
|---|---|
| Kode di **lokal** (commit lokal / file ter-commit) | `git reset` / `git revert` |
| **Production di Vercel** (build lama masih tersimpan) | Instant Rollback di dashboard Vercel (tidak menyentuh git/lokal) |
| Kombinasi lokal + production rusak | Benahi lokal via git, push, Vercel auto-redeploy |

---

## 2. Kode Lokal Error

### a) Commit terakhir yang salah (belum di-push / mau buang)

```bash
# Mundur 1 commit, HAPUS isi commit tsb sekaligus (working tree ikut bersih)
git reset --hard HEAD~1

# Mundur 1 commit, tapi PERTAHANKAN isinya di staging (untuk diperbaiki lalu commit ulang)
git reset --soft HEAD~1
```

- `HEAD~1` = 1 commit ke belakang; `HEAD~2` = 2 commit; dst.
- `reset --hard` = isi commit yang di-skip **hilang permanen**. Hati-hati.

### b) Perubahan lokal BELUM di-commit (dirty worktree)

```bash
# Simpan dulu ke tempat aman sebelum ngorek-ngorek (paling aman)
git stash

# Balik bersih ke state commit terakhir (buang semua perubahan belum commit)
git reset --hard HEAD

# Kembalikan perubahan yang tadi di-stash
git stash pop
```

> `git stash` tidak menghapus apa pun — perubahan diparkir di stash. `git stash pop` mengembalikannya sekaligus menghapus dari stash (pakai `git stash apply` kalau mau tetap menyimpan salinannya).

---

## 3. Commit yang SUDAH di-push ke development / main

**>= Wajib pakai `git revert`, bukan `reset`.** `reset` menulis ulang history → butuh `git push --force` yang merusak riwayat repo/kolaborator.

```bash
git checkout main                 # atau development sesuai lokasi error
git revert <commit_hash>          # commit baru yang membalikkan dampak commit tsb
git push origin main              # Vercel auto-deploy → production = versi sebelum error
```

- Bisa di-revert lagi kalau ternyata revert-nya salah (commit baru lagi).
- Untuk sinkron: lakukan hal yang sama di branch `development` agar tidak selisih.

---

## 4. Production di Vercel Error (tanpa sentuh git)

1. Vercel Dashboard → project → tab **Deployments**.
2. Cari deployment commit sebelumnya yang sukses/hijau.
3. Menu **⋮** → **Rollback** (atau **Promote to Production**).
4. Selesai — production kembali ke build lama. Git & lokal tidak berubah.

> Ini pilihan tercepat untuk "1 step back" bila build lama masih tersimpan di Vercel.

---

## 5. Ringkasan Command

| Command | Pindah pointer? | Isi commit lama? | Aman untuk commit sudah di-push? |
|---|---|---|---|
| `git reset --hard HEAD~1` | Ya (mundur 1) | Dihapus | ❌ (perlu force-push) |
| `git reset --soft HEAD~1` | Ya (mundur 1) | Dipindah ke staging | ❌ |
| `git reset --hard HEAD` | Tidak | Hapus perubahan belum commit | ✅ (tanpa push) |
| `git stash` / `git stash pop` | Tidak | Simpan / pulihkan perubahan belum commit | ✅ |
| `git revert <hash>` | Tidak (tambah commit) | — | ✅ (paling aman) |

---

## 6. Aturan Emas

1. **Belum di-commit?** `git stash` dulu sebelum coba apa pun.
2. **Sudah di-push?** Pakai `git revert`, bukan `reset`.
3. **Production error & build lama masih ada di Vercel?** Rollback dari dashboard — tercepat, nol risiko git.
4. **Jangan pernah** `git push --force` ke `development`/`main` tanpa perintah + konfirmasi eksplisit user.