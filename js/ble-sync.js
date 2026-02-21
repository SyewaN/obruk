(function (global) {
  const LOCAL_KEY = global.BLE_SYNC_LOCAL_KEY || 'hydrosense-ble-segments';
  const DEFAULTS = {
    apiUrl: '',
    headers: {},
    deviceName: 'TarlaSensor',
    serviceUuid: '12345678-1234-1234-1234-123456789abc',
    characteristicUuid: '87654321-4321-4321-4321-cba987654321'
  };

  const state = {
    config: { ...DEFAULTS },
    device: null,
    characteristic: null,
    initialized: false
  };

  function emit(onStatus, message) {
    if (typeof onStatus === 'function') onStatus(message);
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocal(list) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  }

  function enqueue(reading) {
    const queue = readLocal();
    queue.push(reading);
    writeLocal(queue);
    return queue;
  }

  function normalizeReading(raw) {
    const tds = Number(raw?.tds ?? raw?.TDS ?? raw?.tdsValue);
    const moisture = Number(raw?.moisture ?? raw?.humidity ?? raw?.nem);
    const temp = Number(raw?.temp ?? raw?.temperature ?? raw?.sicaklik);
    const timestamp = raw?.timestamp || raw?.syncedAt || new Date().toISOString();

    return {
      tds: Number.isFinite(tds) ? tds : null,
      moisture: Number.isFinite(moisture) ? moisture : null,
      temp: Number.isFinite(temp) ? temp : null,
      timestamp
    };
  }

  async function connect(onStatus) {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth desteklenmiyor');
    }

    // Stale characteristic'i kullanma: cihaz bağlı değilse sıfırla.
    if (state.characteristic && state.device?.gatt?.connected) {
      return state.characteristic;
    }
    state.characteristic = null;

    emit(onStatus, 'Bluetooth cihazı aranıyor...');
    state.device = await navigator.bluetooth.requestDevice({
      filters: [{ name: state.config.deviceName }],
      optionalServices: [state.config.serviceUuid]
    });

    emit(onStatus, 'Cihaza bağlanıyor...');
    const server = await state.device.gatt.connect();
    const service = await server.getPrimaryService(state.config.serviceUuid);
    state.characteristic = await service.getCharacteristic(state.config.characteristicUuid);

    state.device.addEventListener('gattserverdisconnected', () => {
      state.characteristic = null;
    });

    return state.characteristic;
  }

  function parsePayload(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error('Cihaz verisi JSON formatında değil');
    }
    return normalizeReading(parsed);
  }

  async function readDevice(onStatus) {
    // Bazı cihazlarda ilk read sırasında "GATT Error: Unknown" dönebiliyor.
    // Bu durumda bir kez yeniden bağlanıp tekrar dener.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const characteristic = await connect(onStatus);
        emit(onStatus, 'Veri okunuyor...');
        const value = await characteristic.readValue();
        const text = new TextDecoder('utf-8').decode(value);
        return parsePayload(text);
      } catch (err) {
        const message = String(err?.message || err || '').toLowerCase();
        const isGattUnknown = message.includes('gatt') && message.includes('unknown');
        state.characteristic = null;
        if (state.device?.gatt?.connected) {
          try { state.device.gatt.disconnect(); } catch (_) {}
        }
        if (!isGattUnknown || attempt === 1) {
          throw err;
        }
        emit(onStatus, 'Bağlantı yenileniyor...');
      }
    }
  }

  async function flushQueue(onStatus) {
    const queue = readLocal();
    if (!queue.length) return { sent: 0, remaining: 0 };

    const apiUrl = state.config.apiUrl;
    if (!apiUrl || apiUrl === 'API_URL_BURAYA' || !navigator.onLine) {
      emit(onStatus, 'Offline: veri localde saklandı');
      return { sent: 0, remaining: queue.length };
    }

    emit(onStatus, 'Sunucuya gönderiliyor...');
    let res;
    try {
      res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...state.config.headers },
        body: JSON.stringify(queue)
      });
    } catch (err) {
      emit(onStatus, 'Sunucuya erisilemiyor (network/CORS)');
      throw err;
    }

    if (!res.ok) {
      throw new Error('Sunucuya gönderim başarısız');
    }

    writeLocal([]);
    return { sent: queue.length, remaining: 0 };
  }

  const BLESync = {
    init(options = {}) {
      state.config = {
        ...DEFAULTS,
        ...state.config,
        ...options,
        headers: { ...DEFAULTS.headers, ...(global.BLE_SYNC_API_HEADERS || {}), ...(options.headers || {}) },
        deviceName: options.deviceName || global.BLE_SYNC_DEVICE_NAME || state.config.deviceName,
        serviceUuid: options.serviceUuid || global.BLE_SYNC_SERVICE_UUID || state.config.serviceUuid,
        characteristicUuid: options.characteristicUuid || global.BLE_SYNC_CHARACTERISTIC_UUID || state.config.characteristicUuid
      };

      if (!state.initialized) {
        state.initialized = true;
        window.addEventListener('online', () => {
          this.sync(() => {}).catch(() => {});
        });
      }

      this.sync(() => {}).catch(() => {});
    },

    async sync(onStatus) {
      const reading = await readDevice(onStatus);
      enqueue(reading);
      try {
        await flushQueue(onStatus);
        emit(onStatus, '✅ Gönderildi!');
      } catch (err) {
        // BLE okuma başarılıysa veriyi localde tut ve sync'i düşürme.
        emit(onStatus, 'BLE okundu, gönderim beklemede');
      }
      return reading;
    },

    getLocal() {
      return readLocal();
    }
  };

  global.BLESync = BLESync;
})(window);
