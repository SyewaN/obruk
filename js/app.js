/**
 * HydroSense Monitor - Academic Dashboard Application
 * Main application controller with theme, panel, map, and chart management
 */

// Backend hazır olduğunda değiştirilecek.
const API_BASE = "https://example.com";

class App {
    constructor() {
        this.sensors = [];
        this.filteredSensors = [];
        this.activeRisks = ['low', 'medium', 'high'];
        this.selectedSensor = null;
        this.mapOpen = false;
        this.mode = 'academy';
        this.language = 'tr';
        this.translations = this.buildTranslations();
        this.latestReading = null;
        this.lastFetchAttempted = false;
        this.charts = {};
        this.init();
    }

    // Make top-left logo clickable to return to main dashboard
    setupHomeButton() {
        const logoSection = document.querySelector('.navbar-logo-section');
        if (!logoSection) return;
        logoSection.style.cursor = 'pointer';
        logoSection.addEventListener('click', () => {
            // close map if open and show dashboard
            const mapToggleBtn = document.getElementById('mapToggle');
            const mapSection = document.querySelector('.map-section');
            const dashSection = document.querySelector('.dashboard-section');
            const mapSettings = document.querySelector('.map-settings');

            if (this.mapOpen) {
                // simulate toggle close
                this.mapOpen = false;
                dashSection.style.display = 'block';
                mapSection.style.display = 'none';
                mapSettings.style.display = 'none';
                this.updateMapToggleLabel();
            }

            // scroll dashboard to top for clarity
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    async init() {
        console.log('🚀 Initializing HydroSense Monitor...');
        
        // Load saved theme preference
        this.loadThemePreference();
        this.loadModePreference();
        this.loadLanguagePreference();
        
        // Load data
        await dataLoader.loadFromGeoJSON('data/sensors.geojson');
        this.sensors = dataLoader.getAllSensors();
        console.log(`✓ Loaded ${this.sensors.length} sensors`);
        
        // Setup all controls
        this.setupThemeToggle();
        this.setupModeToggle();
        this.setupSidebarToggle();
        this.setupRiskFilters();
        this.setupSensorSelect();
        this.setupMapToggle();
        this.setupHomeButton();
        this.setupTimeFilters();
        this.setupModalControls();
        this.setupLanguageControls();
        this.setupDeviceControls();
        
        // Initialize charts
        this.initCharts();
        this.applyMode();
        this.applyLanguage();
        
        // Initial render
        this.render();

        // Dashboard canlı kalsın diye periyodik güncelleme.
        this.refreshLatestData();
        setInterval(() => this.refreshLatestData(), 30000);
        
        // Update timestamp
        this.updateTimestamp();
        setInterval(() => this.updateTimestamp(), 60000);
        
        // NOTE: Do NOT initialize the map renderer here. Map is heavy and should
        // only be created when the user opens the map (map default closed).
        // mapRenderer will be created on demand in setupMapToggle().
    }

    // ====== DEVICE DATA (PRIMARY: BLUETOOTH, FALLBACK: MOCK) ======
    /**
     * PRIMARY SOURCE: Bluetooth
     * Eğer cihaz bağlı değilse mock kullanılabilir.
     */
    async getSensorData() {
        const bluetoothData = await this.readBluetoothData();
        if (bluetoothData) {
            return bluetoothData;
        }
        return this.getMockSensorData();
    }

    /**
     * Bluetooth cihazına bağlanır.
     * TODO: ESP cihazı geldiğinde burada
     * Web Bluetooth ile servis ve karakteristik okunacak.
     */
    async connectBluetoothDevice() {
        // TODO: ESP hazır olduğunda burada
        // requestDevice, GATT server,
        // service ve characteristic okunacak.
    }

    /**
     * Bluetooth üzerinden sensör verisini okur.
     * TODO: ESP cihazı geldiğinde burada
     * Web Bluetooth ile servis ve karakteristik okunacak.
     */
    async readBluetoothData() {
        // Placeholder: ESP geldiğinde doldurulacak
        return null;
    }

    /**
     * Mock data üretimi.
     */
    getMockSensorData() {
        return {
            soil_moisture: Math.round(Math.random() * 100),
            air_temp: Math.round(15 + Math.random() * 15),
            humidity: Math.round(40 + Math.random() * 40),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Bluetooth'tan gelen veri buluta iletilir.
     */
    async sendSensorData(data) {
        const res = await fetch(`${API_BASE}/api/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'TESTKEY'
            },
            body: JSON.stringify(data)
        });
        return res.ok;
    }

    /**
     * Dashboard her zaman sunucudaki en son veriyi gösterir.
     */
    async fetchLatestData() {
        const res = await fetch(`${API_BASE}/data/latest.json`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    }

    setupDeviceControls() {
        const btn = document.getElementById('readDeviceBtn');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            const statusEl = document.getElementById('dataStatus');
            if (statusEl) statusEl.textContent = 'Veri gönderiliyor...';
            try {
                const data = await this.getSensorData();
                const ok = await this.sendSensorData(data);
                if (ok) {
                    this.latestReading = data;
                }
                if (statusEl && !ok) statusEl.textContent = 'Gönderim başarısız';
            } catch (err) {
                if (statusEl) statusEl.textContent = 'Gönderim başarısız';
                console.error('Device send failed:', err);
            } finally {
                this.updateDataStatus();
                btn.disabled = false;
            }
        });
    }

    async refreshLatestData() {
        this.lastFetchAttempted = true;
        const latest = await this.fetchLatestData().catch(() => null);
        if (latest) {
            this.latestReading = latest;
        }
        this.updateDataStatus();
    }

    updateDataStatus() {
        const statusEl = document.getElementById('dataStatus');
        if (!statusEl) return;
        if (!this.latestReading) {
            statusEl.textContent = this.lastFetchAttempted ? 'Veri bekleniyor' : 'Cihaz bağlı değil';
            return;
        }
        statusEl.textContent = `Son veri: ${new Date(this.latestReading.timestamp).toLocaleTimeString('tr-TR')}`;
    }

    // ====== THEME MANAGEMENT ======
    loadThemePreference() {
        const savedTheme = localStorage.getItem('hydrosense-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    setupThemeToggle() {
        const btn = document.getElementById('themeToggle');
        btn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('hydrosense-theme', isDark ? 'dark' : 'light');
            this.updateThemeIcon();
        });
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const btn = document.getElementById('themeToggle');
        const isDark = document.body.classList.contains('dark-theme');
        btn.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }

    // ====== MODE MANAGEMENT ======
    loadModePreference() {
        const savedMode = localStorage.getItem('hydrosense-mode');
        if (savedMode === 'farmer' || savedMode === 'academy') {
            this.mode = savedMode;
        }
    }

    setupModeToggle() {
        document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (!mode || mode === this.mode) return;
                this.setMode(mode);
            });
        });
    }

    setMode(mode) {
        this.mode = mode;
        localStorage.setItem('hydrosense-mode', mode);
        this.applyMode();
        this.render();
    }

    applyMode() {
        document.body.dataset.mode = this.mode;
        this.updateDashboardTitle();

        document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
            const isActive = btn.dataset.mode === this.mode;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        setTimeout(() => {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        }, 220);
    }

    updateDashboardTitle() {
        const title = document.getElementById('dashboardTitle');
        if (!title) return;
        const key = this.mode === 'farmer' ? 'dashboard.farmerTitle' : 'dashboard.academyTitle';
        title.textContent = this.t(key);
    }

    // ====== LANGUAGE MANAGEMENT ======
    buildTranslations() {
        return {
            tr: {
                'mode.farmer': 'Son Kullanıcı / Farmer',
                'mode.academy': 'Öğrenci / Akademi',
                'dashboard.farmerTitle': 'Çiftçi Paneli',
                'dashboard.academyTitle': 'Akademi Paneli',
                'time.1w': '1 Hafta',
                'time.2w': '2 Hafta',
                'meta.summary': 'Özet',
                'meta.top5': 'Top 5',
                'meta.8w': 'Son 8 hafta',
                'meta.current': 'Güncel',
                'meta.7d': 'Son 7 gün',
                'sidebar.title': 'Kontrol Merkezi',
                'sidebar.stats': 'İstatistikler',
                'sidebar.totalSensors': 'Toplam Sensör',
                'sidebar.avgTds': 'Ortalama TDS (ppm)',
                'sidebar.riskLevels': 'Risk Seviyeleri',
                'sidebar.low': 'Düşük',
                'sidebar.medium': 'Orta',
                'sidebar.high': 'Yüksek',
                'sidebar.sensorSelect': 'Sensör Seçimi',
                'sidebar.viewAll': 'Tümü Görüntüle',
                'sidebar.map': 'Harita',
                'sidebar.mapOpen': 'Aç',
                'sidebar.mapClose': 'Kapat',
                'sidebar.mapType': 'Harita Tipi',
                'sidebar.mapNormal': 'Normal Harita',
                'sidebar.mapSatellite': 'Uydu Görüntüsü',
                'sidebar.mapNasa': 'NASA Su Haritası',
                'sidebar.showSensors': 'Sensörleri Göster',
                'map.title': 'Harita Görünümü',
                'farmer.obrukTitle': 'Obruk Riski',
                'farmer.salinityTitle': 'Tuzlanma Durumu',
                'farmer.obrukDesc': 'Çiftçilere yönelik kısa açıklama.',
                'farmer.salinityDesc': 'Toprak/güncel tuzlanma durumu.',
                'farmer.toleranceTitle': '🌿 Bitkilerin Tuzluluk Toleransı',
                'farmer.cropsTitle': '🪴 Ekilen Ürünler: Tuzluluk & pH',
                'farmer.yieldTitle': '📉 Verim Düşüşü Eğilimi',
                'farmer.moistureTitle': '💧 Toprak Nem Göstergesi',
                'academy.tdsTitle': 'TDS Seviyesi (Zaman Serisi)',
                'academy.riskTitle': 'Risk Dağılımı',
                'academy.compareTitle': 'Sensör Karşılaştırması',
                'academy.statsTitle': 'İstatistiksel Özet',
                'stats.max': 'Maksimum TDS',
                'stats.min': 'Minimum TDS',
                'stats.std': 'Std. Sapma',
                'stats.anomaly': 'Anomali Oranı',
                'settings.title': 'Ayarlar',
                'settings.language': 'Dil',
                'settings.links': 'Bağlantılar',
                'settings.github': 'GitHub Deposu',
                'settings.about': 'Hakkında',
                'settings.aboutText1': 'Projemiz farklı bölgelerdeki esp aygıtları ile aldıkları veriler arasında korelasyon tahmini yaparak obruk ve su tuzlanma riskini tahmin eder.',
                'settings.aboutText2': 'Proje kesinlik iddia etmez, deneyseldir.',
                'indicator.low': 'Düşük',
                'indicator.medium': 'Orta',
                'indicator.high': 'Yüksek',
                'indicator.obrukLow': 'Mevcut sensör verilerine göre obruk riski düşük.',
                'indicator.obrukMedium': 'Bölgede obruk riski artıyor. Kontrol önerilir.',
                'indicator.obrukHigh': 'Bölgedeki sensörler yüksek risk gösteriyor. İnceleme önerilir.',
                'indicator.salinityNormal': 'Tuzlanma seviyesi normal aralıkta.',
                'indicator.salinityMedium': 'Orta düzey tuzlanma tespit edildi; tarım etkilenebilir.',
                'indicator.salinityHigh': 'Yüksek tuzlanma; toprak ve sulama gözden geçirilmelidir.'
            },
            en: {
                'mode.farmer': 'End User / Farmer',
                'mode.academy': 'Student / Academy',
                'dashboard.farmerTitle': 'Farmer Panel',
                'dashboard.academyTitle': 'Academic Panel',
                'time.1w': '1 Week',
                'time.2w': '2 Weeks',
                'meta.summary': 'Summary',
                'meta.top5': 'Top 5',
                'meta.8w': 'Last 8 weeks',
                'meta.current': 'Current',
                'meta.7d': 'Last 7 days',
                'sidebar.title': 'Control Center',
                'sidebar.stats': 'Statistics',
                'sidebar.totalSensors': 'Total Sensors',
                'sidebar.avgTds': 'Average TDS (ppm)',
                'sidebar.riskLevels': 'Risk Levels',
                'sidebar.low': 'Low',
                'sidebar.medium': 'Medium',
                'sidebar.high': 'High',
                'sidebar.sensorSelect': 'Sensor Selection',
                'sidebar.viewAll': 'View All',
                'sidebar.map': 'Map',
                'sidebar.mapOpen': 'Open',
                'sidebar.mapClose': 'Close',
                'sidebar.mapType': 'Map Type',
                'sidebar.mapNormal': 'Standard Map',
                'sidebar.mapSatellite': 'Satellite Imagery',
                'sidebar.mapNasa': 'NASA Water Map',
                'sidebar.showSensors': 'Show Sensors',
                'map.title': 'Map View',
                'farmer.obrukTitle': '🕳️ Sinkhole Risk',
                'farmer.salinityTitle': '🧂 Salinity Status',
                'farmer.obrukDesc': 'Short, farmer-focused summary.',
                'farmer.salinityDesc': 'Current soil salinity condition.',
                'farmer.toleranceTitle': '🌿 Crop Salinity Tolerance',
                'farmer.cropsTitle': '🪴 Planted Crops: Salinity & pH',
                'farmer.yieldTitle': '📉 Yield Decline Trend',
                'farmer.moistureTitle': '💧 Soil Moisture Gauge',
                'academy.tdsTitle': 'TDS Level (Time Series)',
                'academy.riskTitle': 'Risk Distribution',
                'academy.compareTitle': 'Sensor Comparison',
                'academy.statsTitle': 'Statistical Summary',
                'stats.max': 'Max TDS',
                'stats.min': 'Min TDS',
                'stats.std': 'Std. Deviation',
                'stats.anomaly': 'Anomaly Rate',
                'settings.title': 'Settings',
                'settings.language': 'Language',
                'settings.links': 'Links',
                'settings.github': 'GitHub Repository',
                'settings.about': 'About',
                'settings.aboutText1': 'Our project predicts sinkhole and water salinity risk by estimating correlations across ESP sensor data from different regions.',
                'settings.aboutText2': 'The project is experimental and does not claim certainty.',
                'indicator.low': 'Low',
                'indicator.medium': 'Medium',
                'indicator.high': 'High',
                'indicator.obrukLow': 'Sensor readings suggest a low sinkhole risk.',
                'indicator.obrukMedium': 'Sinkhole risk is rising. A check is recommended.',
                'indicator.obrukHigh': 'Sensors indicate high risk. Investigation is recommended.',
                'indicator.salinityNormal': 'Salinity is within the normal range.',
                'indicator.salinityMedium': 'Moderate salinity detected; crops may be affected.',
                'indicator.salinityHigh': 'High salinity; review soil and irrigation.'
            }
        };
    }

    loadLanguagePreference() {
        const savedLang = localStorage.getItem('hydrosense-lang');
        if (savedLang === 'en' || savedLang === 'tr') {
            this.language = savedLang;
        }
    }

    setupLanguageControls() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (!lang || lang === this.language) return;
                this.setLanguage(lang);
            });
        });
        this.updateLanguageButtons();
    }

    setLanguage(lang) {
        this.language = lang;
        localStorage.setItem('hydrosense-lang', lang);
        this.applyLanguage();
        this.updateDashboardTitle();
        this.updateMapToggleLabel();
        this.updateIndicators();
    }

    t(key) {
        return this.translations[this.language]?.[key] || key;
    }

    applyLanguage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = this.t(key);
        });
        this.updateLanguageButtons();
    }

    updateLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.language);
        });
    }

    // ====== SIDEBAR MANAGEMENT ======
    setupSidebarToggle() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar-panel');
        const overlay = document.getElementById('sidebarOverlay');
        const mobileBtn = document.getElementById('mobileSidebarBtn');
        const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

        const applySidebarState = (collapsed, persist = true) => {
            if (collapsed) {
                sidebar.classList.add('collapsed');
                toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                if (persist) localStorage.setItem('hydrosense-sidebar-collapsed', 'true');
                document.body.classList.remove('sidebar-open');
            } else {
                sidebar.classList.remove('collapsed');
                toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                if (persist) localStorage.removeItem('hydrosense-sidebar-collapsed');
                if (isMobile()) document.body.classList.add('sidebar-open');
            }
        };
        
        // Başlangıçta sidebar state'ini ayarla
        const savedState = localStorage.getItem('hydrosense-sidebar-collapsed');
        const isCollapsed = savedState === 'true';
        
        if (savedState === null && isMobile()) {
            applySidebarState(true, false);
        } else {
            applySidebarState(isCollapsed, false);
        }
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            applySidebarState(!sidebar.classList.contains('collapsed'));
        });

        if (mobileBtn) {
            mobileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                applySidebarState(!sidebar.classList.contains('collapsed'));
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                if (isMobile()) applySidebarState(true);
            });
        }

        // Swipe gestures for mobile sidebar
        let touchStartX = 0;
        let touchStartY = 0;
        let touchTracking = false;

        document.addEventListener('touchstart', (e) => {
            if (!isMobile() || e.touches.length !== 1) return;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchTracking = true;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!touchTracking || !isMobile()) return;
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;

            const isCollapsedNow = sidebar.classList.contains('collapsed');
            const nearLeftEdge = touchStartX < 24;

            if (dx > 40 && isCollapsedNow && nearLeftEdge) {
                applySidebarState(false);
                touchTracking = false;
            } else if (dx < -40 && !isCollapsedNow) {
                applySidebarState(true);
                touchTracking = false;
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            touchTracking = false;
        });

        window.addEventListener('resize', () => {
            if (!isMobile()) {
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // ====== RISK FILTERS ======
    setupRiskFilters() {
        document.querySelectorAll('input[data-risk]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.onRiskFilterChange());
        });
    }

    onRiskFilterChange() {
        this.activeRisks = [];
        document.querySelectorAll('input[data-risk]:checked').forEach(checkbox => {
            this.activeRisks.push(checkbox.dataset.risk);
        });
        this.render();
    }

    // ====== SENSOR SELECTION ======
    setupSensorSelect() {
        document.getElementById('sensorSelect').addEventListener('change', (e) => {
            this.selectedSensor = e.target.value || null;
            if (this.mapOpen && window.mapRenderer) {
                window.mapRenderer.highlightSensor(this.selectedSensor);
            }
        });
    }

    updateSensorSelect() {
        const select = document.getElementById('sensorSelect');
        const options = select.querySelectorAll('option');
        
        // Remove old options (keep first)
        for (let i = options.length - 1; i > 0; i--) {
            options[i].remove();
        }
        
        // Add filtered sensors
        this.filteredSensors.forEach(sensor => {
            const option = document.createElement('option');
            option.value = sensor.id;
            option.textContent = `${sensor.name} (${sensor.tds.toFixed(0)} ppm)`;
            select.appendChild(option);
        });
    }

    // ====== MAP TOGGLE ======
    setupMapToggle() {
        const mapToggleBtn = document.getElementById('mapToggle');
        const mapCloseBtn = document.getElementById('mapClose');
        const mapSection = document.querySelector('.map-section');
        const dashSection = document.querySelector('.dashboard-section');
        const mapSettings = document.querySelector('.map-settings');
        
        mapToggleBtn.addEventListener('click', () => {
            this.mapOpen = !this.mapOpen;
            
            if (this.mapOpen) {
                dashSection.style.display = 'none';
                mapSection.style.display = 'flex';
                mapSettings.style.display = 'block';
                this.updateMapToggleLabel();
                
                // Initialize map renderer on demand if not yet created
                if (!window.mapRenderer) {
                    window.mapRenderer = new MapRenderer('map', this.sensors);
                } else if (window.mapRenderer && window.mapRenderer.map) {
                    // ensure size is correct
                    setTimeout(() => window.mapRenderer.map.invalidateSize(), 50);
                }
            } else {
                dashSection.style.display = 'block';
                mapSection.style.display = 'none';
                mapSettings.style.display = 'none';
                this.updateMapToggleLabel();
            }
        });
        
        mapCloseBtn.addEventListener('click', () => {
            mapToggleBtn.click();
        });
        
        // Map settings listeners
        document.getElementById('sensorMarkersToggle').addEventListener('change', (e) => {
            if (window.mapRenderer) {
                window.mapRenderer.toggleMarkers(e.target.checked);
            }
        });
        
        // Map type radio buttons
        document.querySelectorAll('input[name="mapType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (window.mapRenderer && e.target.checked) {
                    window.mapRenderer.setMapType(e.target.value);
                }
            });
        });

        this.updateMapToggleLabel();
    }

    updateMapToggleLabel() {
        const mapToggleBtn = document.getElementById('mapToggle');
        if (!mapToggleBtn) return;
        const labelKey = this.mapOpen ? 'sidebar.mapClose' : 'sidebar.mapOpen';
        const icon = this.mapOpen ? 'fa-times' : 'fa-map';
        mapToggleBtn.innerHTML = `<i class="fas ${icon}"></i> ${this.t(labelKey)}`;
    }

    // ====== TIME FILTERS ======
    setupTimeFilters() {
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateCharts();
            });
        });
    }

    // ====== MODAL CONTROLS ======
    setupModalControls() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const modalClose = document.getElementById('settingsClose');
        
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
        });
        
        modalClose.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
        
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }

    // ====== CHART INITIALIZATION ====== 
    initCharts() {
        // Chart.js color scheme
        const chartColors = {
            low: '#A3BE8C',
            medium: '#EBCB8B',
            high: '#BF616A',
            accent: '#81A1C1',
            line: '#88C0D0',
            text: '#4D576A',
            grid: '#D7DDE8'
        };
        
        // Chart defaults
        Chart.defaults.color = chartColors.text;
        Chart.defaults.borderColor = chartColors.grid;
        
        // Chart 1: TDS Time Series
        const tdsCtx = document.getElementById('tdsChart').getContext('2d');
        this.charts.tds = new Chart(tdsCtx, {
            type: 'line',
            data: {
                labels: this.generateDateLabels(7),
                datasets: [{
                    label: 'TDS Seviyesi (ppm)',
                    data: this.generateTimeSeriesData(7),
                    borderColor: chartColors.line,
                    backgroundColor: 'rgba(136, 192, 208, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: chartColors.accent,
                    pointBorderColor: chartColors.accent,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: chartColors.text }
                    },
                    x: {
                        ticks: { color: chartColors.text }
                    }
                }
            }
        });
        
        // Chart 2: Risk Distribution (Pie)
        const riskCtx = document.getElementById('riskChart').getContext('2d');
        this.charts.risk = new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Düşük Risk', 'Orta Risk', 'Yüksek Risk'],
                datasets: [{
                    data: this.calculateRiskDistribution(),
                    backgroundColor: [
                        chartColors.low,
                        chartColors.medium,
                        chartColors.high
                    ],
                    borderColor: chartColors.grid,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
        
        // Chart 3: Sensor Comparison (Bar)
        const compCtx = document.getElementById('comparisonChart').getContext('2d');
        this.charts.comparison = new Chart(compCtx, {
            type: 'bar',
            data: {
                labels: this.getTopSensorNames(5),
                datasets: [{
                    label: 'TDS (ppm)',
                    data: this.getTopSensorValues(5),
                    backgroundColor: chartColors.accent,
                    borderColor: chartColors.accent,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: chartColors.text }
                    },
                    y: {
                        ticks: { color: chartColors.text }
                    }
                }
            }
        });

        // Farmer mode charts
        this.initFarmerCharts(chartColors);
    }

    updateCharts() {
        if (this.charts.tds) {
            this.charts.tds.data.labels = this.generateDateLabels(7);
            this.charts.tds.data.datasets[0].data = this.generateTimeSeriesData(7);
            this.charts.tds.update();
        }
    }

    // ====== DATA GENERATION ======
    generateDateLabels(days) {
        const labels = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }));
        }
        return labels;
    }

    generateTimeSeriesData(days) {
        const data = [];
        for (let i = 0; i < days; i++) {
            const baseValue = this.sensors.reduce((sum, s) => sum + s.tds, 0) / this.sensors.length;
            const variation = (Math.random() - 0.5) * 100;
            data.push(Math.round(baseValue + variation));
        }
        return data;
    }

    calculateRiskDistribution() {
        const counts = { low: 0, medium: 0, high: 0 };
        this.sensors.forEach(s => counts[s.riskLevel]++);
        return [counts.low, counts.medium, counts.high];
    }

    getTopSensorNames(count) {
        return this.sensors
            .sort((a, b) => b.tds - a.tds)
            .slice(0, count)
            .map(s => s.name.substring(0, 10));
    }

    getTopSensorValues(count) {
        return this.sensors
            .sort((a, b) => b.tds - a.tds)
            .slice(0, count)
            .map(s => s.tds);
    }

    // ====== FARMER CHARTS ======
    initFarmerCharts(chartColors) {
        const cropToleranceCtx = document.getElementById('cropToleranceChart')?.getContext('2d');
        if (cropToleranceCtx) {
            const cropData = this.getCropToleranceData();
            this.charts.cropTolerance = new Chart(cropToleranceCtx, {
                type: 'bar',
                data: {
                    labels: cropData.labels,
                    datasets: [{
                        label: 'Tuzluluk Toleransı',
                        data: cropData.values,
                        backgroundColor: chartColors.accent,
                        borderColor: chartColors.accent,
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, ticks: { color: chartColors.text } },
                        y: { ticks: { color: chartColors.text } }
                    }
                }
            });
        }

        const cropPhCtx = document.getElementById('cropPhChart')?.getContext('2d');
        if (cropPhCtx) {
            const cropPh = this.getCropPhData();
            this.charts.cropPh = new Chart(cropPhCtx, {
                type: 'bar',
                data: {
                    labels: cropPh.labels,
                    datasets: [{
                        label: 'Tuzluluk',
                        data: cropPh.salinity,
                        backgroundColor: chartColors.medium
                    }, {
                        label: 'pH',
                        data: cropPh.ph,
                        backgroundColor: chartColors.accent
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                    scales: {
                        x: { ticks: { color: chartColors.text } },
                        y: { beginAtZero: true, ticks: { color: chartColors.text } }
                    }
                }
            });
        }

        const yieldCtx = document.getElementById('yieldDropChart')?.getContext('2d');
        if (yieldCtx) {
            const trend = this.getYieldTrendData();
            this.charts.yield = new Chart(yieldCtx, {
                type: 'line',
                data: {
                    labels: trend.labels,
                    datasets: [{
                        label: 'Verim Endeksi',
                        data: trend.values,
                        borderColor: chartColors.high,
                        backgroundColor: 'rgba(191, 97, 106, 0.12)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        pointBackgroundColor: chartColors.high
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: false, ticks: { color: chartColors.text } },
                        x: { ticks: { color: chartColors.text } }
                    }
                }
            });
        }

        const moistureCtx = document.getElementById('soilMoistureChart')?.getContext('2d');
        if (moistureCtx) {
            const moisture = this.getMoistureValue();
            this.charts.moisture = new Chart(moistureCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Nem', 'Kalan'],
                    datasets: [{
                        data: [moisture, 100 - moisture],
                        backgroundColor: [chartColors.low, chartColors.grid],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                }
            });
        }
    }

    updateFarmerCharts() {
        if (this.charts.cropTolerance) {
            const cropData = this.getCropToleranceData();
            this.charts.cropTolerance.data.labels = cropData.labels;
            this.charts.cropTolerance.data.datasets[0].data = cropData.values;
            this.charts.cropTolerance.update();
        }
        if (this.charts.cropPh) {
            const cropPh = this.getCropPhData();
            this.charts.cropPh.data.labels = cropPh.labels;
            this.charts.cropPh.data.datasets[0].data = cropPh.salinity;
            this.charts.cropPh.data.datasets[1].data = cropPh.ph;
            this.charts.cropPh.update();
        }
        if (this.charts.yield) {
            const trend = this.getYieldTrendData();
            this.charts.yield.data.labels = trend.labels;
            this.charts.yield.data.datasets[0].data = trend.values;
            this.charts.yield.update();
        }
        if (this.charts.moisture) {
            const moisture = this.getMoistureValue();
            this.charts.moisture.data.datasets[0].data = [moisture, 100 - moisture];
            this.charts.moisture.update();
        }
    }

    getAverageTds() {
        const source = this.filteredSensors.length ? this.filteredSensors : this.sensors;
        if (!source.length) return 0;
        return source.reduce((sum, s) => sum + s.tds, 0) / source.length;
    }

    getCropToleranceData() {
        const crops = [
            { name: 'Buğday', tolerance: 2200 },
            { name: 'Arpa', tolerance: 3000 },
            { name: 'Mısır', tolerance: 1700 },
            { name: 'Ayçiçek', tolerance: 2500 },
            { name: 'Patates', tolerance: 1400 }
        ];
        const avgTds = this.getAverageTds();
        return {
            labels: crops.map(c => c.name),
            values: crops.map(c => Math.max(200, Math.round(c.tolerance - (avgTds * 0.35))))
        };
    }

    getCropPhData() {
        const crops = ['Buğday', 'Arpa', 'Mısır', 'Nohut', 'Şekerpancarı'];
        const avgTds = this.getAverageTds();
        const baseSalinity = Math.max(600, Math.round(avgTds * 0.85));
        return {
            labels: crops,
            salinity: crops.map((_, i) => baseSalinity + i * 120),
            ph: crops.map((_, i) => 6.2 + i * 0.3)
        };
    }

    getYieldTrendData() {
        const labels = [];
        const values = [];
        const avgTds = this.getAverageTds();
        let base = 100 - Math.min(35, Math.round((avgTds - 1200) / 40));
        for (let i = 7; i >= 0; i--) {
            labels.push(`Hafta ${8 - i}`);
            const swing = (Math.random() - 0.5) * 6;
            values.push(Math.max(55, Math.round(base - i * 1.2 + swing)));
        }
        return { labels, values };
    }

    getMoistureValue() {
        const avgTds = this.getAverageTds();
        const moisture = Math.round(70 - Math.max(0, (avgTds - 1200) / 50));
        return Math.max(25, Math.min(85, moisture));
    }

    // ====== STATS UPDATE ======
    updateStats() {
        const count = this.filteredSensors.length;
        
        if (count === 0) {
            document.getElementById('sensorCount').textContent = '0';
            document.getElementById('avgTds').textContent = '-';
            document.getElementById('maxTds').textContent = '-';
            document.getElementById('minTds').textContent = '-';
            document.getElementById('stdTds').textContent = '-';
            document.getElementById('anomalyRate').textContent = '-';
            return;
        }
        
        const tdsValues = this.filteredSensors.map(s => s.tds);
        const avgTds = tdsValues.reduce((a, b) => a + b, 0) / count;
        const maxTds = Math.max(...tdsValues);
        const minTds = Math.min(...tdsValues);
        const stdTds = this.calculateStdDev(tdsValues);
        const anomalyRate = ((count * 0.15).toFixed(0) + ' / ' + count);
        
        document.getElementById('sensorCount').textContent = count;
        document.getElementById('avgTds').textContent = avgTds.toFixed(0);
        document.getElementById('maxTds').textContent = maxTds.toFixed(0);
        document.getElementById('minTds').textContent = minTds.toFixed(0);
        document.getElementById('stdTds').textContent = stdTds.toFixed(1);
        document.getElementById('anomalyRate').textContent = anomalyRate;
    }

    calculateStdDev(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    updateTimestamp() {
        const now = new Date();
        const formatted = now.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastUpdate').textContent = formatted;
    }

    // ====== MAIN RENDER ======
    render() {
        // Filter sensors by active risks
        this.filteredSensors = this.sensors.filter(s => 
            this.activeRisks.includes(s.riskLevel)
        );
        
        // Update UI elements
        this.updateSensorSelect();
        this.updateStats();
        
        // Update map if open
        if (this.mapOpen && window.mapRenderer) {
            window.mapRenderer.filterByRisk(this.filteredSensors);
            if (this.selectedSensor) {
                window.mapRenderer.highlightSensor(this.selectedSensor);
            }
        }
        
        // Update charts
        this.updateCharts();
        this.updateFarmerCharts();
        
        // Update user-facing indicators for obruk risk and salinization
        this.updateIndicators();
    }

    /**
     * Create simple 1-2 sentence comments for top sensors and show in main area
     * Rule-based: compare last value to recent average and produce short note
     */
    updateIndicators() {
        // Obruk risk: if any sensors high risk in filtered set, mark accordingly
        const obriskEl = document.getElementById('obriskIndicator');
        const salEl = document.getElementById('salinityIndicator');
        if (!obriskEl || !salEl) return;

        const highCount = this.filteredSensors.filter(s => s.riskLevel === 'high').length;
        const total = this.filteredSensors.length || 1;
        const highPct = Math.round((highCount / total) * 100);

        // Simple user-facing wording
        let obriskTextKey = 'indicator.low';
        if (highPct >= 50) obriskTextKey = 'indicator.high';
        else if (highPct >= 20) obriskTextKey = 'indicator.medium';
        const obriskText = this.t(obriskTextKey);

        // Salinization indicator: average TDS across filtered sensors
        const avgTds = this.getAverageTds();
        let salText = 'Normal';
        if (avgTds > 2500) salText = 'Yüksek Tuzlanma';
        else if (avgTds > 1800) salText = 'Orta Tuzlanma';

        // Fill elements
        obriskEl.querySelector('.indicator-value').textContent = `${obriskText} (${highPct}%)`;
        const obriskDescKey = highPct >= 50 ? 'indicator.obrukHigh' : (highPct >= 20 ? 'indicator.obrukMedium' : 'indicator.obrukLow');
        obriskEl.querySelector('.indicator-desc').textContent = this.t(obriskDescKey);

        salEl.querySelector('.indicator-value').textContent = `${Math.round(avgTds)} ppm`;
        const salDescKey = salText === 'Normal' ? 'indicator.salinityNormal' : (salText === 'Orta Tuzlanma' ? 'indicator.salinityMedium' : 'indicator.salinityHigh');
        salEl.querySelector('.indicator-desc').textContent = this.t(salDescKey);

        const obriskFill = obriskEl.querySelector('[data-meter="obrisk"]');
        const salFill = salEl.querySelector('[data-meter="salinity"]');
        if (obriskFill) obriskFill.style.width = `${Math.min(100, Math.max(10, highPct))}%`;
        if (salFill) {
            const salPct = avgTds > 2500 ? 90 : (avgTds > 1800 ? 60 : 30);
            salFill.style.width = `${salPct}%`;
        }
    }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📍 DOM loaded, initializing application...');
    window.app = new App();
});
