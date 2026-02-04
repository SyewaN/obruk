# hydrosense-map
## Sweden Junior Water Prize - Türkiye DSİ Projesi

### 🎯 Proje Amacı
Yeraltı suyu tuzlanması ve buna bağlı obruk (çökme) riskini gerçek zamanlı izleyen, bilimsel metodlarla analiz eden ve karar vericilere sade şekilde sunan açık kaynak bir çevresel izleme sistemidir.

### 📊 Sistem Mimarisi

```
IoT Katmanı (ESP32)
    ↓
Veri Toplama ve Depolama
    ↓
Analiz Motoru (Python)
    ↓
Statik Veri Katmanı (JSON/GeoJSON)
    ↓
Görselleştirme (GitHub Pages)
```

### 📁 Klasör Yapısı

```
water-salinity-monitor/
├── hardware/              # ESP32 ve sensör kodları
│   ├── esp32-main/       # Ana ESP32 firmware
│   └── README.md         # Donanım kurulum dokümantasyonu
│
├── backend/              # Veri işleme ve analiz
│   ├── data-collector/  # Veri toplama servisi
│   ├── analyzer/        # Python analiz motoru
│   ├── models/          # Veri modelleri
│   └── tests/           # Test dosyaları
│
├── frontend/            # GitHub Pages arayüzü
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── data/           # Statik JSON/GeoJSON dosyaları
│
├── docs/               # Dokümantasyon
│   ├── architecture.md
│   ├── api-spec.md
│   └── scientific-methodology.md
│
└── examples/           # Örnek veriler ve kullanım senaryoları
    ├── sample-data/
    └── simulations/
```

### 🔬 Bilimsel Metodoloji

**Ölçülen Parametreler:**
- Elektriksel İletkenlik (EC) / TDS - tuzluluk göstergesi
- Su sıcaklığı
- Zaman damgası
- Coğrafi konum (GPS)

**Hesaplanan Risk Göstergeleri:**
- Tuzluluk artış hızı (dEC/dt)
- Kısa/uzun dönem sapma analizi
- Mekânsal korelasyon (komşu sensörler)
- Bölgesel risk indeksi (0-100)

**Risk Sınıflandırması:**
- **Düşük (0-33)**: Normal değişim
- **Orta (34-66)**: Dikkat gerektiren eğilim
- **Yüksek (67-100)**: Acil izleme gerekli

### 🛠️ Teknoloji Yığını

**Donanım:**
- ESP32 DevKit
- TDS/EC Sensör
- DS18B20 Sıcaklık Sensörü
- GPS Modülü (opsiyonel - sabit konumlar için manuel giriş)

**Backend:**
- Python 3.9+
- NumPy, Pandas (veri analizi)
- Scipy (istatistiksel analiz)
- GeoPandas (mekânsal analiz)

**Frontend:**
- Vanilla JavaScript (framework yok)
- Leaflet.js (harita)
- Chart.js (grafikler)
- GitHub Pages (hosting)

### 🚀 Geliştirme Aşamaları

#### Faz 1: Statik Prototip (ŞU AN)
- [ ] Frontend arayüzü (Leaflet harita)
- [ ] Örnek veri ile görselleştirme
- [ ] Temel analiz algoritmaları
- [ ] GeoJSON veri formatı

#### Faz 2: Analiz Motoru
- [ ] Python risk hesaplama modülü
- [ ] Zaman serisi analizi
- [ ] Veri validasyonu
- [ ] Test senaryoları

#### Faz 3: IoT Entegrasyonu
- [ ] ESP32 firmware
- [ ] Veri toplama servisi
- [ ] Gerçek zamanlı veri akışı
- [ ] Bulut depolama entegrasyonu

#### Faz 4: Optimizasyon
- [ ] Performans iyileştirmeleri
- [ ] Veri sıkıştırma
- [ ] Enerji tasarrufu (ESP32)
- [ ] Dokümantasyon

### 📖 Kullanım

**Statik Prototip İçin:**
```bash
# Frontend klasörünü servis et
cd frontend
python -m http.server 8000
# Tarayıcıda: http://localhost:8000
```

**Analiz Motoru İçin:**
```bash
cd backend/analyzer
pip install -r requirements.txt
python analyze_salinity.py --input data/sample.json
```

### 📚 Bilimsel Kaynaklar

Proje dokümantasyonunda kullanılan metodolojiler için kaynak listeleri `docs/references.md` dosyasında bulunmaktadır.

### 🤝 Katkıda Bulunma

Bu proje Sweden Junior Water Prize başvurusu kapsamında geliştirilmektedir. Proje ekibi:
- [Adınız] - Sistem Tasarımı ve Analiz
- [Ekip Arkadaşlarınız]

### 📄 Lisans

Bu proje açık bilim prensipleriyle paylaşılmaktadır. Detaylar için LICENSE dosyasına bakınız.

### 🔗 İlgili Linkler

- DSİ: https://www.dsi.gov.tr/
- Sweden Junior Water Prize: https://www.siwi.org/sjwp/
- Proje Dokümantasyonu: [docs/](./docs/)

---
**Not:** Bu proje bir "web sitesi" değil, çevresel karar destek prototipi olarak tasarlanmıştır. Tüm risk tahminleri istatistiksel modellere dayanır ve kesinlik iddiası taşımaz.
