/**
 * Theme Manager Module
 * Koyu/Açık tema ve sidebar toggle'ı yönetir
 */

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'hydrosense-theme';
        this.SIDEBAR_KEY = 'hydrosense-sidebar';
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupSidebarToggle();
        this.setupDisplayToggle();
    }

    /**
     * Tema sistemini kur
     */
    setupTheme() {
        const themeToggle = document.getElementById('themeToggle');
        
        // Kaydedilmiş tema tercihini yükle
        const savedTheme = localStorage.getItem(this.THEME_KEY) || 'dark';
        this.setTheme(savedTheme);

        // Toggle butonuna event ekle
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * Tema ayarla
     */
    setTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'light') {
            html.classList.remove('theme-dark');
            html.classList.add('theme-light');
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
        } else {
            html.classList.add('theme-dark');
            html.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
        }

        // Icon güncelle
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }

        localStorage.setItem(this.THEME_KEY, theme);
    }

    /**
     * Tema değiştir
     */
    toggleTheme() {
        const html = document.documentElement;
        const isLight = html.classList.contains('theme-light');
        this.setTheme(isLight ? 'dark' : 'light');
    }

    /**
     * Sidebar toggle
     */
    setupSidebarToggle() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const closeSidebar = document.getElementById('closeSidebar');
        const sidebar = document.getElementById('controlSidebar');

        if (!sidebar) return;

        // Mobil'de sidebar açık/kapalı durumunu saklat
        const savedState = localStorage.getItem(this.SIDEBAR_KEY) !== 'closed';
        
        if (window.innerWidth <= 768 && savedState === false) {
            sidebar.classList.remove('open');
        } else if (window.innerWidth > 768) {
            sidebar.classList.add('open'); // Desktop'te daima açık
        }

        // Toggle butonlarına event ekle
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => this.closeSidebar());
        }

        // Window resize'a tepki ver
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.add('open');
            } else {
                sidebar.classList.remove('open');
            }
        });
    }

    /**
     * Sidebar aç/kapat
     */
    toggleSidebar() {
        const sidebar = document.getElementById('controlSidebar');
        if (!sidebar) return;

        const isOpen = sidebar.classList.contains('open');
        
        if (isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * Sidebar aç
     */
    openSidebar() {
        const sidebar = document.getElementById('controlSidebar');
        if (sidebar) {
            sidebar.classList.add('open');
            localStorage.setItem(this.SIDEBAR_KEY, 'open');
        }
    }

    /**
     * Sidebar kapat
     */
    closeSidebar() {
        const sidebar = document.getElementById('controlSidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            localStorage.setItem(this.SIDEBAR_KEY, 'closed');
        }
    }

    /**
     * Görünüm seçeneklerini yönet
     */
    setupDisplayToggle() {
        const displayButtons = document.querySelectorAll('.display-btn');
        
        displayButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const view = btn.dataset.view;
                const viewElement = this.getViewElement(view);
                
                if (viewElement) {
                    const isActive = btn.classList.contains('active');
                    btn.classList.toggle('active');
                    viewElement.style.display = isActive ? 'none' : 'block';
                }
            });
        });
    }

    /**
     * View elementini getir
     */
    getViewElement(view) {
        switch(view) {
            case 'map':
                return document.getElementById('mapSection');
            case 'stats':
                return document.getElementById('analyticsSection');
            case 'table':
                return document.getElementById('tableSection');
            default:
                return null;
        }
    }
}

// Sayfa yüklendiğinde tema yöneticisini başlat
document.addEventListener('DOMContentLoaded', () => {
    const themeManager = new ThemeManager();
});
