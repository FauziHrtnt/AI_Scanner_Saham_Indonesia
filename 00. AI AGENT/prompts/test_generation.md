# Standar Pembuatan Tes (Test Generation Standards)

Dokumen ini mendefinisikan standar penulisan tes otomatis untuk memastikan keandalan sistem jangka panjang.

## Standar Penulisan Tes

### 1. Struktur Pengujian (AAA Pattern)
Setiap test case harus disusun menggunakan pola:
* **Arrange (Persiapan)**: Siapkan data input, mock, dan konfigurasi yang diperlukan.
* **Act (Aksi)**: Panggil fungsi atau metode yang sedang diuji.
* **Assert (Verifikasi)**: Periksa apakah output dan efek samping sesuai dengan ekspektasi.

### 2. Cakupan Kasus (Test Cases Coverage)
* **Happy Path**: Skenario saat sistem menerima input yang benar dan berjalan lancar.
* **Edge Cases**: Kasus batas seperti input bernilai 0, null, string kosong, array kosong, atau angka sangat besar.
* **Sad Path (Error Handling)**: Pastikan sistem melempar error yang tepat saat menerima input yang salah atau saat layanan eksternal mati.

### 3. Isolasi Pengujian (Isolation)
* Unit test tidak boleh bergantung pada jaringan internet, database fisik, atau API pihak ketiga secara langsung. Use mocks/stubs.
* Setiap tes harus independen dan tidak bergantung pada urutan eksekusi tes lainnya.
