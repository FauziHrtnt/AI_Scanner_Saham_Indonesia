# Protokol Keamanan & Mitigasi Risiko Sistem (Security & Risk Mitigation) — Stock Scanner Ecosystem

Dokumen ini mendefinisikan standar keamanan informasi, perlindungan kunci API, mitigasi *rate-limiting* penyedia data pasar, serta batas keselamatan finansial (*safety guardrails*) untuk ekosistem **AI Stock Scanner & BSJP Dashboard**.

---

## 🛡️ 1. Batas Keselamatan Finansial (Zero-Execution Principle)

1. **Larangan Otomatisasi Eksekusi Order Riil (*No Auto-Trading*)**:
   * Sistem ini dirancang secara sadar dan sengaja sebagai **Manual Research Assistant**.
   * **DILARANG KERAS** menambahkan pustaka atau kode yang meminta kredensial akun sekuritas, PIN transaksi, atau melakukan submit order beli/jual riil secara otomatis ke bursa.
   * Setiap aksi beli dan jual harus dilakukan secara sadar oleh trader manusia melalui platform broker berizin resmi (OJK).
2. **Proteksi Saham Gorengan / Spekulatif**:
   * Saham-saham dengan kapitalisasi mikro, tidak likuid, atau dalam papan pemantauan khusus bursa tidak boleh disamarkan sebagai rekomendasi aman.
   * Sistem wajib menyematkan label risiko eksplisit (`HIGH_RISK_SPECULATIVE`) dan peringatan pembatasan ukuran modal (*half sizing*).

---

## ⚡ 2. Mitigasi Rate-Limiting & Keandalan Data Pasar (Yahoo Finance & TradingView)

Karena penyedia data utama (Yahoo Finance) bersifat *unofficial*, sistem harus menerapkan teknik konsumsi data yang sangat tertib untuk mencegah pemblokiran alamat IP (HTTP 429 *Too Many Requests*):

### A. Strategi Batching Adaptif
* **Ukuran Batch Terkendali**: Pemindaian 750+ saham IDX dipecah ke dalam kelompok kecil (*batch*) berukuran 25–50 ticker.
* **Jeda Antar Permintaan (*Inter-Request Delay*)**: Jeda waktu acak (*jitter*) sebesar 3.000 ms – 5.000 ms antar ticker individual.
* **Jeda Antar Kelompok (*Batch Delay*)**: Istirahat selama 15.000 ms – 20.000 ms sebelum memulai batch berikutnya.

### B. Mekanisme Retry dengan Exponential Backoff
Jika penyedia data mengembalikan error jaringan atau rate limit:
```typescript
async function fetchWithRetry<T>(fn: () => Promise<T>, maxRetries = 4, baseDelayMs = 2000): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### C. Proteksi Debounce pada Tombol Scan Website
* Tombol *Scan Sekarang* pada antarmuka Next.js wajib dinonaktifkan (*disabled*) seketika saat diklik, dengan durasi debounce minimal 30 detik untuk mencegah pengguna menekan tombol berulang-ulang yang dapat membebani server dan memicu rate limit.

---

## 🔑 3. Pengelolaan Kredensial & Kunci Rahasia (API Keys)

1. **Isolasi Variabel Lingkungan (`.env`)**:
   * Token sensitif seperti `TELEGRAM_BOT_TOKEN` dan `GEMINI_API_KEY` **wajib** disimpan di dalam file `.env` dan **wajib** terdaftar pada `.gitignore`.
2. **Larangan Eksposur ke Sisi Klien (*No Client Exposure*)**:
   * **Dilarang** menyematkan kunci rahasia ke variabel bertanda `NEXT_PUBLIC_` di Next.js. Seluruh pemanggilan AI (Google Gemini) atau bot Telegram hanya boleh terjadi pada layer *Server Route Handlers* atau *Node.js Daemon*.

---

## 🧹 4. Sanitasi Input & Pencegahan Injeksi

1. **Validasi Ketat Format Ticker**:
   * Input kode saham yang diterima oleh API `/api/scan` atau `/api/paper-trades` harus divalidasi dengan ekspresi reguler:
     ```typescript
     const TICKER_REGEX = /^[A-Z]{4}(\.JK)?$/;
     if (!TICKER_REGEX.test(ticker)) {
       throw new Error("Format ticker saham tidak valid. Gunakan 4 huruf kapital.");
     }
     ```
2. **Pencegahan SQL Injection pada PostgreSQL**:
   * Seluruh query basis data wajib menggunakan *parameterized queries* via Prisma Client atau driver `pg` berparameter (`$1, $2`). Dilarang melakukan *string concatenation* langsung ke query SQL.
