/**
 * Map Renderer - Leaflet integration
 */

class MapRenderer {
    constructor(elementId, sensors) {
        this.sensors = sensors;
        this.markers = new Map();
        this.visibleMarkers = [];
        this.initMap(elementId);
    }

    initMap(elementId) {
        // Center on Turkey
        const center = [39.0, 35.0];
        this.map = L.map(elementId, { 
            zoomControl: true,
            attributionControl: true 
        }).setView(center, 7);

        // Add basemap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Render sensors
        this.renderSensors(this.sensors);
        
        // Invalidate size when first shown
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 100);
    }

    renderSensors(sensors) {
        // Clear existing
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers.clear();
        this.visibleMarkers = [];

        // Add new
        sensors.forEach(sensor => {
            this.addMarker(sensor);
        });

        // Fit bounds
        if (this.visibleMarkers.length > 0) {
            this.map.fitBounds(
                L.featureGroup(this.visibleMarkers).getBounds(),
                { padding: [50, 50] }
            );
        }
    }

    addMarker(sensor) {
        const color = this.getRiskColor(sensor.riskLevel);
        
        const marker = L.circleMarker([sensor.lat, sensor.lon], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        });

        marker.bindPopup(this.createPopup(sensor));
        marker.bindTooltip(sensor.name, { sticky: false });
        marker.addTo(this.map);

        this.markers.set(sensor.id, marker);
        this.visibleMarkers.push(marker);
    }

    createPopup(sensor) {
        const riskClass = sensor.riskLevel.toUpperCase();
        const riskSymbol = {
            'LOW': '🟢',
            'MEDIUM': '🟡',
            'HIGH': '🔴'
        }[riskClass];

        return `
            <div style="font-size: 0.9rem;">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--accent);">${sensor.name}</h4>
                <p style="margin: 0.2rem 0;"><strong>ID:</strong> ${sensor.id}</p>
                <p style="margin: 0.2rem 0;"><strong>TDS:</strong> ${sensor.tds.toFixed(1)} ppm</p>
                <p style="margin: 0.2rem 0;"><strong>Temp:</strong> ${sensor.temperature.toFixed(1)}°C</p>
                <p style="margin: 0.5rem 0 0 0;"><strong>Risk:</strong> ${riskSymbol} ${riskClass}</p>
            </div>
        `;
    }

    getRiskColor(riskLevel) {
        const colors = {
            'low': '#a3be8c',     // Nord 14 - Green
            'medium': '#d08770',  // Nord 12 - Orange
            'high': '#bf616a'     // Nord 11 - Red
        };
        return colors[riskLevel] || '#81a1c1';
    }

    filterByRisk(sensors) {
        this.markers.forEach((marker, sensorId) => {
            const hasSensor = sensors.some(s => s.id === sensorId);
            if (hasSensor) {
                marker.setStyle({ opacity: 1, fillOpacity: 0.9 });
            } else {
                marker.setStyle({ opacity: 0.3, fillOpacity: 0.3 });
            }
        });
    }

    highlightSensor(sensorId) {
        this.markers.forEach((marker, id) => {
            if (id === sensorId) {
                marker.setStyle({ radius: 10, weight: 3 });
                marker.openPopup();
            } else {
                marker.setStyle({ radius: 8, weight: 2 });
            }
        });
    }

    toggleMarkers(visible) {
        this.markers.forEach((marker) => {
            if (visible) {
                marker.setStyle({ opacity: 1, fillOpacity: 0.9 });
            } else {
                marker.setStyle({ opacity: 0.2, fillOpacity: 0.1 });
            }
        });
    }

    toggleSatelliteView(useSatellite) {
        // Remove existing layer
        this.map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                this.map.removeLayer(layer);
            }
        });
        
        // Add appropriate layer
        const tileUrl = useSatellite 
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        
        const attribution = useSatellite 
            ? '© Esri' 
            : '© OpenStreetMap contributors';
        
        L.tileLayer(tileUrl, {
            attribution: attribution,
            maxZoom: 18
        }).addTo(this.map);
    }
}

let mapRenderer = null;
