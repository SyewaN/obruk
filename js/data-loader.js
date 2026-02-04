/**
 * Data Loader - GeoJSON and sensor data
 */

class DataLoader {
    constructor() {
        this.sensors = [];
    }

    async loadFromGeoJSON(filepath) {
        try {
            const response = await fetch(filepath);
            const geojson = await response.json();
            this.parseSensors(geojson);
            return this.sensors;
        } catch (error) {
            console.warn('Could not load GeoJSON, using sample data');
            this.loadSampleData();
            return this.sensors;
        }
    }

    parseSensors(geojson) {
        this.sensors = geojson.features.map(feature => {
            const props = feature.properties;
            const [lon, lat] = feature.geometry.coordinates;

            return {
                id: props.sensor_id || props.id,
                name: props.name || `Sensor ${props.sensor_id}`,
                lat: lat,
                lon: lon,
                tds: props.tds || 0,
                temperature: props.temperature || 0,
                riskLevel: this.calculateRisk(props.tds || 0),
                timestamp: props.timestamp || new Date().toISOString()
            };
        });
    }

    calculateRisk(tds) {
        if (tds < 1500) return 'low';
        if (tds < 3000) return 'medium';
        return 'high';
    }

    loadSampleData() {
        this.sensors = [
            {
                id: 'S001',
                name: 'Konya Merkez',
                lat: 38.7269,
                lon: 32.4829,
                tds: 1800,
                temperature: 15.3,
                riskLevel: 'medium',
                timestamp: new Date().toISOString()
            },
            {
                id: 'S002',
                name: 'Konya Çumra',
                lat: 37.9500,
                lon: 32.7500,
                tds: 2400,
                temperature: 14.8,
                riskLevel: 'high',
                timestamp: new Date().toISOString()
            }
        ];
    }

    getAllSensors() {
        return [...this.sensors];
    }

    getSensor(id) {
        return this.sensors.find(s => s.id === id);
    }
}

const dataLoader = new DataLoader();
