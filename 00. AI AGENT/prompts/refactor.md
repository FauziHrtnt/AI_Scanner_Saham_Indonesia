# Panduan Refactoring (Refactoring Guidelines)

Refactoring adalah proses restrukturisasi kode internal tanpa mengubah perilaku eksternal sistem. Tujuannya adalah meningkatkan keterbacaan, mengurangi kompleksitas, dan mempermudah pemeliharaan.

## Prinsip Utama Refactoring

### 1. Pastikan Tes Berjalan Terlebih Dahulu
* Jangan melakukan refactoring pada kode yang tidak memiliki unit test yang memadai.
* Jalankan tes sebelum mulai mengubah kode untuk memastikan status awal stabil.

### 2. Lakukan Secara Bertahap (Small Steps)
* Jangan melakukan refactoring skala besar sekaligus. Ubah satu bagian kecil, jalankan tes, lalu lanjutkan.
* Pisahkan commit refactoring dari commit penambahan fitur atau perbaikan bug.

### 3. Aturan Kebersihan Kode
* **DRY (Don't Repeat Yourself)**: Satukan logika duplikat ke dalam fungsi atau modul utilitas bersama.
* **KSRP (Keep It Simple, Stupid)**: Hindari over-engineering. Pilih solusi yang paling mudah dipahami.
* **Separation of Concerns**: Pisahkan logika bisnis dari logika presentasi UI atau akses database langsung.
