# 🌊 HydroSense Monitor

**Sweden Junior Water Prize 2026** - Türkiye DSİ  
*Yeraltı Suyu Tuzlanması & Obruk Risk Monitoring Sistemi*

---

## 📋 Proje Özeti

HydroSense Monitor, yeraltı suyu tuzlanması (salinite) ve dolayısıyla obruk (çökme) riskini izleyen, açıklanabilir analitik yöntemlerle değerlendiren ve karar destek sağlayan **çevresel izleme sistemi** prototipidir.

**⚠️ Önemli:** Bu sistem kesin tahmin sunmaz. Eğilim göstergeleri ve risk uyarıları sağlar.

---

## 🎨 Kullanıcı Arayüzü (Frontend)

### **Tasarım Felsefesi**
- **Akademik & Profesyonel:** Bilim makaleleri ve raporlardan ilham alan tasarım
- **Koyu Tema (Gruvbox):** Göz rahatlığı ve gece kullanımı için optimize
- **Açık Tema Seçeneği:** Kullanıcı tercihine göre değiştirilebilir
- **Responsive:** Masaüstü, tablet ve mobil cihazlarda optimal deneyim

### **Ana Bileşenler**

#### 1. **Header (Başlık)**
- Başlık ve Alt başlık
- Tema Toggle Butonu (🌙 / ☀️)
- Sidebar Toggle Butonu (📋)

#### 2. **Collapsible Sidebar (Sol Panel)**
**Özellikleri:**
- Desktop: Daima görünür
- Tablet/Mobil: Açılabilir/Kapatılabilir

**Paneller:**
- **Görünüm Seçenekleri:** Harita, İstatistikler, Tablo ayrı ayrı açılabilir
- **Risk Filtresi:** Düşük/Orta/Yüksek risk sensörlerini seçli kontrol
- **Zaman Seçimi:** Slider ile geçmiş verileri görebilme
- **Sensör Seçimi:** Dropdown ile spesifik sensör seçimi
- **Özet İstatistikler:** Aktif sensör, Ortalama TDS, Maksimum Risk
- **Risk Efsanesi:** TDS değeri ve risk seviyesi tanımı
- **Bilgi Kutusu:** Sistem hakkında açıklama

#### 3. **Main Content Area**

**A. Harita Bölgesi (Sağ Üst)**
- Leaflet.js ile interactive harita
- Renkli sensör markerları (Düşük 🟢 / Orta 🟡 / Yüksek 🔴)
- Popup bilgileri ve tooltip'ler
- Zoom, pan, basemap seçim

**B. Analitik Bölgesi (Sağ Alt - Kaydırılabilir)**
- **Tuzluluk Zaman Serileri:** Seçili sensörlerin TDS trendi (line chart)
- **Risk Dağılımı:** Pie chart (Low/Medium/High oranları)
- **Sensör Karşılaştırması:** Bar chart (TDS vs Sıcaklık)
- **Sensör Verileri Tablosu:** Gerçek zamanlı ölçümler
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

---

## 🏗️ Proje Yapısı

```
obruk/
├── index.html                # Ana HTML (Collapsible sidebar + Maps)
├── css/
│   └── style.css             # Gruvbox tema, responsive design
├── js/
│   ├── app.js               # Ana uygulama mantığı
│   ├── data-loader.js       # GeoJSON veri yükleme
│   ├── risk-analyzer.js     # Risk hesaplama motoru
│   ├── map-renderer.js      # Leaflet harita rendering
│   ├── charts.js            # Chart.js grafikler
│   └── theme.js             # Tema ve UI yönetimi
├── data/
│   └── sensors.geojson      # Sensör verileri (GeoJSON formatı)
└── README.md                # Bu dosya
```

---

## 🚀 Kurulum & Çalıştırma

### **Gereksinimler**
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)
- İnternet bağlantısı (CDN'lerden dosya yükleme)

### **Yerel Geliştirme**

```bash
# Python HTTP Server
python -m http.server 8000

# Node.js http-server
npx http-server

# VS Code Live Server
# Sağ tıkla → Open with Live Server
```

**Erişim:** `http://localhost:8000`

### **GitHub Pages'e Dağıt**

1. Repository'i klonla veya fork et
2. Settings → Pages → Branch: main → Save
3. 2-3 dakika bekle
4. Siteniz `https://username.github.io/obruk` adresinde live olur

---

## 📚 Kaynaklar

- **Leaflet.js:** Harita görselleştirme
- **Chart.js:** İnteraktif grafikler
- **GeoJSON Spec:** https://tools.ietf.org/html/rfc7946
- **OpenStreetMap:** Harita verileri

---

## 📄 Lisans & Etik

- **Açık Kaynak:** MIT License
- **Açık Veri:** Tüm veriler GeoJSON formatında erişilebilir
- **Açık Bilim:** Kod tamamen okunabilir ve denetlenebilir

**Sorumluluk Beyanı:** Bu sistem "risk göstergesi" sunar, kesin tahmin değil. Başlıca karar verme süreci için yetkili kurumlarla koordine edilmesi gerekir.

---

## 👥 Proje Ekibi

**Sweden Junior Water Prize 2026**  
Türkiye DSİ (Devlet Su İşleri)  
İzleme & Analiz Sistemi

---

## ⏰ Güncelleme Tarihi

*Son Güncelleme: 4 Şubat 2026*

Tema tasarımı, collapsible sidebar ve akademik UI tamamlandı. Frontend ve backend entegrasyon devam ediyor.
