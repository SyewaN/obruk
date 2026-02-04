/**
 * HydroSense Monitor - Academic Dashboard Application
 * Main application controller with theme, panel, map, and chart management
 */

class App {
    constructor() {
        this.sensors = [];
        this.filteredSensors = [];
        this.activeRisks = ['low', 'medium', 'high'];
        this.selectedSensor = null;
        this.mapOpen = false;
        this.charts = {};
        this.init();
    }

    async init() {
        console.log('🚀 Initializing HydroSense Monitor...');
        
        // Load saved theme preference
        this.loadThemePreference();
        
        // Load data
        await dataLoader.loadFromGeoJSON('data/sensors.geojson');
        this.sensors = dataLoader.getAllSensors();
        console.log(`✓ Loaded ${this.sensors.length} sensors`);
        
        // Setup all controls
        this.setupThemeToggle();
        this.setupSidebarToggle();
        this.setupRiskFilters();
        this.setupSensorSelect();
        this.setupMapToggle();
        this.setupTimeFilters();
        this.setupModalControls();
        
        // Initialize charts
        this.initCharts();
        
        // Initial render
        this.render();
        
        // Update timestamp
        this.updateTimestamp();
        setInterval(() => this.updateTimestamp(), 60000);
        
        // Initialize map renderer (but don't show it yet)
        mapRenderer = new MapRenderer('map', this.sensors);
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

    // ====== SIDEBAR MANAGEMENT ======
    setupSidebarToggle() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar-panel');
        
        // Başlangıçta sidebar state'ini ayarla
        const savedState = localStorage.getItem('hydrosense-sidebar-collapsed');
        const isCollapsed = savedState === 'true';
        
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        } else {
            sidebar.classList.remove('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            // localStorage temizle çünkü başlangıçta açık olması default
            localStorage.removeItem('hydrosense-sidebar-collapsed');
        }
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('collapsed');
            const nowCollapsed = sidebar.classList.contains('collapsed');
            
            // Animasyon için icon'u çevir
            if (nowCollapsed) {
                toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                localStorage.setItem('hydrosense-sidebar-collapsed', 'true');
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                localStorage.removeItem('hydrosense-sidebar-collapsed');
            }
        });
        
        // Hover effect - collapsed state'te hover'da aç
        sidebar.addEventListener('mouseenter', () => {
            if (sidebar.classList.contains('collapsed')) {
                sidebar.style.width = '280px';
                sidebar.style.zIndex = '901';
            }
        });
        
        sidebar.addEventListener('mouseleave', () => {
            if (sidebar.classList.contains('collapsed')) {
                sidebar.style.width = '60px';
                sidebar.style.zIndex = '900';
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
            if (this.mapOpen && mapRenderer) {
                mapRenderer.highlightSensor(this.selectedSensor);
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
                mapToggleBtn.innerHTML = '<i class="fas fa-times"></i> Harita Kapat';
                
                // Initialize map size
                setTimeout(() => {
                    if (mapRenderer && mapRenderer.map) {
                        mapRenderer.map.invalidateSize();
                    }
                }, 50);
            } else {
                dashSection.style.display = 'block';
                mapSection.style.display = 'none';
                mapSettings.style.display = 'none';
                mapToggleBtn.innerHTML = '<i class="fas fa-map"></i> Harita Aç';
            }
        });
        
        mapCloseBtn.addEventListener('click', () => {
            mapToggleBtn.click();
        });
        
        // Map settings listeners
        document.getElementById('sensorMarkersToggle').addEventListener('change', (e) => {
            if (mapRenderer) {
                mapRenderer.toggleMarkers(e.target.checked);
            }
        });
        
        document.getElementById('satelliteToggle').addEventListener('change', (e) => {
            if (mapRenderer) {
                mapRenderer.toggleSatelliteView(e.target.checked);
            }
        });
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
        const aboutBtn = document.getElementById('aboutBtn');
        const aboutModal = document.getElementById('aboutModal');
        const modalClose = document.getElementById('modalClose');
        
        aboutBtn.addEventListener('click', () => {
            aboutModal.style.display = 'flex';
        });
        
        modalClose.addEventListener('click', () => {
            aboutModal.style.display = 'none';
        });
        
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.style.display = 'none';
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
        if (this.mapOpen && mapRenderer) {
            mapRenderer.filterByRisk(this.filteredSensors);
            if (this.selectedSensor) {
                mapRenderer.highlightSensor(this.selectedSensor);
            }
        }
        
        // Update charts
        this.updateCharts();
    }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📍 DOM loaded, initializing application...');
    window.app = new App();
});
