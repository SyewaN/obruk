/**
 * Main Application Controller
 * Tüm modülleri koordine eder
 */

class App {
    constructor() {
        this.sensors = [];
        this.filteredSensors = [];
        this.activeRiskFilters = ['low', 'medium', 'high'];
        this.selectedSensor = null;
    }

    /**
     * Uygulamayı başlat
     */
    async init() {
        console.log('🚀 Uygulama başlatılıyor...');
        
        // 1. Harita render'ini başlat
        mapRenderer = new MapRenderer('map');
        console.log('✓ Harita hazır');

        // 2. Verileri yükle
        await this.loadData();

        // 3. Risk analizi yap
        this.analyzeSensors();

        // 4. UI kontrol ve olaylarını ayarla
        this.setupEventListeners();

        // 5. İlk render
        this.render();

        console.log('✓ Uygulama başarıyla yüklendi');
    }

    /**
     * Verileri yükle
     */
    async loadData() {
        // GeoJSON dosyasından yüklemeyi dene, yoksa örnek veri kullan
        await dataLoader.loadFromGeoJSON('data/sensors.geojson');
        this.sensors = dataLoader.getAllSensors();
        console.log(`✓ ${this.sensors.length} sensör yüklendi`);
    }

    /**
     * Risk analizi yap
     */
    analyzeSensors() {
        this.sensors = riskAnalyzer.analyzeAllSensors(this.sensors);
        this.filteredSensors = [...this.sensors];
    }

    /**
     * Event listenerları kur
     */
    setupEventListeners() {
        // Zaman slider'ı
        const timeSlider = document.getElementById('timeSlider');
        if (timeSlider) {
            timeSlider.addEventListener('change', (e) => this.onTimeSliderChange(e));
            timeSlider.addEventListener('input', (e) => this.onTimeSliderChange(e));
        }

        // Risk filtresi checkboxes
        document.querySelectorAll('.filter-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.onRiskFilterToggle(e));
        });

        // Sensör seçimi
        const sensorSelect = document.getElementById('sensorSelect');
        if (sensorSelect) {
            sensorSelect.addEventListener('change', (e) => this.onSensorSelectChange(e));
        }

        // Harita sensör seçimi
        if (mapRenderer) {
            mapRenderer.onSensorSelected = (sensor) => this.onMapSensorSelect(sensor);
        }

        // Window resize
        window.addEventListener('resize', () => {
            if (mapRenderer) mapRenderer.invalidateSize();
        });
    }

    /**
     * Zaman slider değişikliği
     */
    onTimeSliderChange(e) {
        const value = parseInt(e.target.value);
        const timeDisplay = document.getElementById('timeDisplay');
        
        if (value === 100) {
            if (timeDisplay) timeDisplay.textContent = 'Son Veri';
        } else {
            const daysAgo = Math.round((100 - value) / 10);
            if (timeDisplay) timeDisplay.textContent = `${daysAgo} gün önce`;
        }

        // Burada zaman seçimine göre veriyi filtreleyebilirsiniz
        // Şimdilik sadece gösteriş amaçlı
    }

    /**
     * Risk filtresi toggle
     */
    onRiskFilterToggle(e) {
        const checkbox = e.target;
        const risk = checkbox.dataset.risk;

        if (checkbox.checked) {
            if (!this.activeRiskFilters.includes(risk)) {
                this.activeRiskFilters.push(risk);
            }
        } else {
            this.activeRiskFilters = this.activeRiskFilters.filter(r => r !== risk);
        }

        this.filterAndRender();
    }

    /**
     * Sensör seçimi değişti
     */
    onSensorSelectChange(e) {
        const sensorId = e.target.value;
        
        if (sensorId) {
            this.selectedSensor = this.sensors.find(s => s.id === sensorId);
            if (mapRenderer) mapRenderer.highlightSensor(sensorId);
        } else {
            this.selectedSensor = null;
        }

        this.render();
    }

    /**
     * Haritada sensör seçildi
     */
    onMapSensorSelect(sensor) {
        this.selectedSensor = sensor;
        
        // Select'i güncelle
        const sensorSelect = document.getElementById('sensorSelect');
        if (sensorSelect) {
            sensorSelect.value = sensor.id;
        }

        this.render();
    }

    /**
     * Filtrele ve render et
     */
    filterAndRender() {
        this.filteredSensors = this.sensors.filter(s => 
            this.activeRiskFilters.includes(s.riskLevel)
        );

        if (mapRenderer) {
            mapRenderer.filterByRisk(this.sensors, this.activeRiskFilters);
        }

        this.updateTable();
        chartManager.updateCharts(this.filteredSensors, this.selectedSensor?.id);
    }

    /**
     * Tüm render işlemleri
     */
    render() {
        this.updateSensorSelect();
        this.updateStatistics();
        this.filterAndRender();
        this.updateTable();
        chartManager.updateCharts(this.filteredSensors, this.selectedSensor?.id);
        this.updateLastUpdate();
    }

    /**
     * Son güncelleme zamanını göster
     */
    updateLastUpdate() {
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) {
            const now = new Date();
            lastUpdateEl.textContent = `Son Güncelleme: ${now.toLocaleString('tr-TR')}`;
        }
    }

    /**
     * Sensör select dropdown'unu güncelle
     */
    updateSensorSelect() {
        const select = document.getElementById('sensorSelect');
        if (!select) return;

        // Önceki seçenekleri temizle
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Yeni seçenekler ekle
        this.sensors.forEach(sensor => {
            const option = document.createElement('option');
            option.value = sensor.id;
            option.text = `${sensor.name} (${sensor.riskLevel})`;
            select.appendChild(option);
        });
    }

    /**
     * İstatistikleri güncelle
     */
    updateStatistics() {
        const stats = dataLoader.getStatistics();
        if (!stats) return;

        const activeSensorsEl = document.getElementById('activeSensors');
        const avgSalinityEl = document.getElementById('avgSalinity');
        const maxRiskEl = document.getElementById('maxRisk');

        if (activeSensorsEl) activeSensorsEl.textContent = stats.totalSensors;
        if (avgSalinityEl) avgSalinityEl.textContent = stats.avgTds + ' ppm';
        
        const maxRiskCount = Math.max(stats.highRiskCount, stats.mediumRiskCount, stats.lowRiskCount);
        if (maxRiskEl) {
            if (stats.highRiskCount > 0) {
                maxRiskEl.textContent = 'Yüksek';
                maxRiskEl.className = 'stat-value risk-high';
            } else if (stats.mediumRiskCount > 0) {
                maxRiskEl.textContent = 'Orta';
                maxRiskEl.className = 'stat-value risk-medium';
            } else {
                maxRiskEl.textContent = 'Düşük';
                maxRiskEl.className = 'stat-value risk-low';
            }
        }
    }

    /**
     * Tablo güncelle
     */
    updateTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.filteredSensors.forEach(sensor => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sensor.id}</td>
                <td>${sensor.name}</td>
                <td>${sensor.tds.toFixed(2)}</td>
                <td>${sensor.temperature.toFixed(2)}</td>
                <td><span class="risk-${sensor.riskLevel}">${sensor.riskLevel.toUpperCase()}</span></td>
                <td>${new Date(sensor.timestamp).toLocaleString('tr-TR')}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Haritayı göster
     */
    renderMap() {
        if (mapRenderer && this.sensors.length > 0) {
            mapRenderer.renderSensors(this.filteredSensors);
        }
    }
}

// Sayfa yüklendiğinde uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init().catch(error => {
        console.error('Uygulama başlatma hatası:', error);
    });
});
