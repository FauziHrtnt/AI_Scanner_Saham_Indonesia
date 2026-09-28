# Standar Penulisan Dokumentasi (Documentation Standards)

Dokumentasi yang baik sangat penting agar kode mudah dipelihara oleh manusia maupun AI Agent di masa mendatang.

## Aturan Penulisan Dokumentasi

### 1. Dokumentasi Kode (Inline & Block Comments)
* **Mengapa, bukan Bagaimana**: Tulis komentar untuk menjelaskan *mengapa* suatu keputusan kode diambil, bukan menjelaskan *bagaimana* kode itu bekerja (karena kode itu sendiri harus sudah cukup jelas/self-documenting).
* Gunakan standar komentar dokumentasi sesuai bahasa pemrograman:
  - JavaScript/TypeScript: JSDoc (`/** ... */`)
  - Python: Docstrings (`""" ... """`)
  - Go: Comment block di atas nama fungsi

### 2. Dokumentasi API (API Documentation)
* Setiap endpoint API baru wajib didokumentasikan dengan jelas:
  - URL & HTTP Method (e.g., `POST /api/v1/users`)
  - Header yang dibutuhkan (e.g., `Authorization`)
  - Format request body (JSON schema)
  - Format response sukses (status 200/201) dan response error (status 400/401/500)

### 3. Pembaruan README
* Jika ada perubahan cara instalasi, dependensi baru, atau variabel lingkungan baru, pastikan untuk langsung memperbarui berkas `README.md` dan `PROJECT_RULES.md`.
