# Workflow Perbaikan Bug (Bug Fix Workflow)

Dokumen ini berisi panduan bagi AI Agent dan Developer dalam mendeteksi, mereproduksi, dan memperbaiki masalah (bug) di dalam aplikasi.

## Langkah-Langkah Perbaikan Bug

### 1. Reproduksi Masalah (Reproduce)
* **Wajib**: Sebelum menulis kode perbaikan, buatlah skenario pengetesan atau script mandiri yang dapat mereproduksi error secara konsisten.
* Gunakan test case otomatis jika memungkinkan.
* Dokumentasikan:
  - Input yang memicu error.
  - Output yang salah.
  - Output yang diharapkan.

### 2. Analisis Penyebab (Root Cause Analysis)
* Telusuri *stack trace* atau log sistem untuk menemukan file dan baris kode yang bermasalah.
* Identifikasi mengapa kondisi error tersebut terjadi (misal: *null pointer*, *race condition*, tipe data tidak sesuai, logika percabangan salah).
* Periksa apakah masalah ini memengaruhi modul lain.

### 3. Implementasi Perbaikan (Implementation)
* Buat perbaikan seminimal dan seaman mungkin (*least disruptive fix*).
* Hindari mengubah fungsionalitas yang tidak berhubungan dengan bug tersebut.
* Pastikan penanganan kesalahan (*error handling*) dan *edge cases* ditangani dengan baik (misal: input kosong, tipe data tidak valid).

### 4. Verifikasi & Pengujian (Verification)
* Jalankan kembali skenario reproduksi untuk memastikan bug telah hilang.
* Pastikan seluruh unit test yang ada tetap berjalan dengan sukses (*no regression*).
* Tulis tes unit baru khusus untuk kasus bug ini agar tidak terjadi kembali di masa mendatang.

---
*Gunakan template ini setiap kali melakukan tugas perbaikan bug.*
