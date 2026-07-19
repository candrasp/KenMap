import { ref, shallowRef, onMounted, onUnmounted } from "vue";
import L from "leaflet";
import { useInfrastrukturStore } from "@/stores/infrastruktur";
import { useAuthStore } from "@/stores/auth";

// Konstanta peta
export const PONOROGO_CENTER = [-7.967572, 111.40931];
export const PONOROGO_BOUNDS = L.latLngBounds(L.latLng(-8.1, 111.3), L.latLng(-7.7, 111.65));
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 18;

// Konfigurasi basemap: tambahkan entri baru di sini kalau mau nambah pilihan lagi
// (misal citra Bing, peta topografi, dll) - tinggal tambah 1 object baru.
export const TILE_LAYERS = {
  satelit: {
    label: "Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    dbPrefix: "ponorogo-tile-satelit:",
    // thumbnail kecil untuk tombol toggle (ganti dengan screenshot asli kalau ada)
    thumbnail: "/icons/basemap-satelit.png",
  },
  jalan: {
    label: "Jalan",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    dbPrefix: "ponorogo-tile-jalan:",
    thumbnail: "/icons/basemap-jalan.png",
  },
};

// Dipertahankan untuk kompatibilitas kalau ada file lain yang masih import ini
export const ESRI_URL = TILE_LAYERS.satelit.url;
export const DB_TILE_PREFIX = TILE_LAYERS.satelit.dbPrefix;

const GEOJSON_FILES = {
  kota: "/data-kota.geojson",
  kecamatan: "/data-kecamatan.geojson",
  desa: "/data-desa.geojson",
};

const STYLES = {
  kota: { color: "#c0392b", weight: 3, fillOpacity: 0.02 },
  kecamatan: { color: "#e67e22", weight: 2, fillOpacity: 0.04, dashArray: "6 3" },
  desa: { color: "#2980b9", weight: 1.2, fillOpacity: 0.05, dashArray: "2 4" },
};

export function useLeaflet(mapContainerId) {
  const map = shallowRef(null);
  const statusText = ref("Memuat data…");
  const isOnline = ref(navigator.onLine);
  const infrastrukturStore = useInfrastrukturStore();
  const authStore = useAuthStore();

  let kecamatanLabelsGroup, desaLabelsGroup;
  let stoLayerGroup, oltLayerGroup, odcLayerGroup, odpLayerGroup, klienLayerGroup, kabelLayerGroup;
  let currentTileLayer = null;
  const currentBasemap = ref(localStorage.getItem("basemap-pilihan") || "satelit");

  // Ganti basemap aktif: hapus tile lama, pasang tile baru, simpan preferensi user
  function switchBasemap(key) {
    if (!TILE_LAYERS[key] || (key === currentBasemap.value && currentTileLayer)) return;
    if (currentTileLayer) map.value.removeLayer(currentTileLayer);
    currentTileLayer = createOfflineTileLayer(key);
    currentTileLayer.addTo(map.value);
    // Tile layer harus di bawah semua layer lain (boundary, ODC, ODP, dst)
    currentTileLayer.bringToBack();
    currentBasemap.value = key;
    localStorage.setItem("basemap-pilihan", key);
  }

  // Control custom ala Google Maps: tombol thumbnail pojok kiri-bawah untuk toggle basemap
  const BasemapToggleControl = L.Control.extend({
    options: { position: "bottomleft" },
    onAdd() {
      const container = L.DomUtil.create("div", "leaflet-bar leaflet-control basemap-toggle");
      const img = document.createElement("img");
      const render = () => {
        // Tombol menampilkan thumbnail basemap LAIN (yang akan aktif kalau diklik) - ini pola Google Maps
        const otherKey = currentBasemap.value === "satelit" ? "jalan" : "satelit";
        img.src = TILE_LAYERS[otherKey].thumbnail;
      };
      container.appendChild(img);
      render();

      L.DomEvent.disableClickPropagation(container);
      container.onclick = () => {
        const otherKey = currentBasemap.value === "satelit" ? "jalan" : "satelit";
        switchBasemap(otherKey);
        render();
      };
      return container;
    },
  });

  // Buat IDB-backed tile layer untuk offline support
  // key: 'satelit' | 'jalan' (lihat TILE_LAYERS di atas)
  function createOfflineTileLayer(key) {
    const cfg = TILE_LAYERS[key];
    return L.tileLayer(cfg.url, {
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      attribution: cfg.attribution,
      // NOTE: kalau mekanisme cache IDB kamu (di file lain) membaca
      // DB_TILE_PREFIX secara langsung, pastikan disesuaikan supaya
      // tiap basemap punya prefix cache sendiri (cfg.dbPrefix) -
      // biar tile satelit & jalan tidak saling menimpa di IndexedDB.
    });
  }

  function pickName(props, level) {
    if (!props) return "Tanpa nama";
    const candidates = {
      kota: ["nama", "name", "WADMKK", "nmkab", "NAMOBJ", "KABKOT", "kabupaten"],
      kecamatan: ["nama", "name", "WADMKC", "nmkec", "NAMOBJ", "kecamatan"],
      desa: ["nama", "name", "WADMKD", "nmdesa", "NAMOBJ", "desa", "DESA"],
    }[level] || ["name"];
    for (const key of candidates) {
      if (props[key]) return props[key];
    }
    return "Tanpa nama";
  }

  function buildPopupHTML(title, iconSvg, subtitle, lat, lng) {
    const pinBtn = authStore.isLoggedIn
      ? `<button class="popup-add-pin-btn"
           onclick="window.__openPinModal(${lat}, ${lng}); this.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button').click();">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;">
             <path d="M12 5v14M5 12h14"/></svg>
           Tambahkan Pin
         </button>`
      : "";
    return (
      `<div class="popup-title">${title}</div>` +
      (subtitle ? `<div class="popup-coords">${iconSvg}<span>${subtitle}</span></div>` : "") +
      (lat !== undefined
        ? `<div class="popup-coords" style="margin-top:2px;font-size:10px;opacity:0.7;"><span>${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}</span></div>`
        : "") +
      (pinBtn ? `<div class="popup-pin-action">${pinBtn}</div>` : "")
    );
  }

  async function loadBoundaryLayer(level, filename) {
    try {
      const res = await fetch(filename);
      if (!res.ok) throw new Error("File tidak ditemukan: " + filename);
      const geojson = await res.json();

      if (level === "kota") {
        L.geoJSON(geojson, {
          style: STYLES[level],
          onEachFeature: (feature, layer) => {
            if (!authStore.isLoggedIn) return;
            const name = pickName(feature.properties, level);
            const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
            layer.bindPopup(buildPopupHTML(name, svg, "Kota/Kabupaten"));
          },
        }).addTo(map.value);
      }

      if (level === "kecamatan") {
        for (const feature of geojson.features) {
          const name = pickName(feature.properties, level);
          const displayName = name.replace(/^Kecamatan\s+/, "");
          if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
            try {
              const bounds = L.geoJSON(feature).getBounds();
              const center = bounds.getCenter();
              const lat = center.lat.toFixed(4);
              const lng = center.lng.toFixed(4);
              const marker = L.marker(center, {
                icon: L.divIcon({
                  className: "place-label",
                  html: displayName,
                  iconSize: null,
                  iconAnchor: [0, 0],
                }),
              });
              if (authStore.isLoggedIn) {
                const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
                marker.bindPopup(buildPopupHTML(displayName, svg, "Kecamatan", lat, lng));
              }
              marker.addTo(kecamatanLabelsGroup);
            } catch (e) {
              console.warn("Label gagal: " + name, e);
            }
          }
        }
      }

      if (level === "desa") {
        L.geoJSON(geojson, {
          style: STYLES[level],
          onEachFeature: (feature, layer) => {
            const name = pickName(feature.properties, level);
            layer.on("click", (e) => {
              if (!authStore.isLoggedIn) return;
              const lat = e.latlng.lat.toFixed(5);
              const lng = e.latlng.lng.toFixed(5);
              const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
              L.popup()
                .setLatLng(e.latlng)
                .setContent(buildPopupHTML(name, svg, "", lat, lng))
                .openOn(map.value);
            });
          },
        }).addTo(map.value);

        for (const feature of geojson.features) {
          const name = pickName(feature.properties, level);
          const displayName = name.replace(/^Desa\s+/, "");
          if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
            try {
              const bounds = L.geoJSON(feature).getBounds();
              const center = bounds.getCenter();
              const lat = center.lat.toFixed(4);
              const lng = center.lng.toFixed(4);
              const marker = L.marker(center, {
                icon: L.divIcon({
                  className: "place-label",
                  html: displayName,
                  iconSize: null,
                  iconAnchor: [0, 0],
                }),
              });
              if (authStore.isLoggedIn) {
                const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
                marker.bindPopup(buildPopupHTML(displayName, svg, "Desa", lat, lng));
              }
              marker.addTo(desaLabelsGroup);
            } catch (e) {
              console.warn("Label gagal: " + name, e);
            }
          }
        }
      }

      return (geojson.features || []).length;
    } catch (err) {
      console.warn(`Gagal memuat ${filename}:`, err.message);
      return 0;
    }
  }

  function updateLabelsByZoom() {
    const zoom = map.value.getZoom();
    if (zoom <= 13) {
      if (!map.value.hasLayer(kecamatanLabelsGroup)) kecamatanLabelsGroup.addTo(map.value);
      map.value.removeLayer(desaLabelsGroup);
    } else {
      map.value.removeLayer(kecamatanLabelsGroup);
      if (!map.value.hasLayer(desaLabelsGroup)) desaLabelsGroup.addTo(map.value);
    }
  }

  onMounted(async () => {
    // Init map
    map.value = L.map(mapContainerId, {
      center: PONOROGO_CENTER,
      zoom: 17,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    // Controls: zoom + reset view (bottom-right)
    L.control.zoom({ position: "bottomright" }).addTo(map.value);

    const ResetViewControl = L.Control.extend({
      onAdd(m) {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control leaflet-control-custom",
        );
        container.title = "Kembali ke posisi awal";
        const img = document.createElement("img");
        img.src = "/icons/locate-fixed.svg";
        container.appendChild(img);
        container.onclick = (e) => {
          e.stopPropagation();
          m.setView(PONOROGO_CENTER, 17);
        };
        return container;
      },
    });
    new ResetViewControl({ position: "bottomright" }).addTo(map.value);

    // Tile layer (basemap dinamis - default sesuai preferensi tersimpan/satelit)
    switchBasemap(currentBasemap.value);

    // Tombol toggle basemap ala Google Maps (pojok kiri-bawah)
    new BasemapToggleControl().addTo(map.value);

    // Layer groups
    kecamatanLabelsGroup = L.layerGroup();
    desaLabelsGroup = L.layerGroup();
    stoLayerGroup = L.layerGroup().addTo(map.value);
    oltLayerGroup = L.layerGroup().addTo(map.value);
    odcLayerGroup = L.layerGroup().addTo(map.value);
    odpLayerGroup = L.layerGroup().addTo(map.value);
    klienLayerGroup = L.layerGroup().addTo(map.value);
    kabelLayerGroup = L.layerGroup().addTo(map.value);

    // Pass layer groups to store
    infrastrukturStore.setLayerGroups({
      sto: stoLayerGroup,
      olt: oltLayerGroup,
      odc: odcLayerGroup,
      odp: odpLayerGroup,
      klien: klienLayerGroup,
      kabel: kabelLayerGroup,
    });

    map.value.on("zoomend", updateLabelsByZoom);

    // Online/offline
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Load boundary data
    const [kota, kecamatan, desa] = await Promise.all([
      loadBoundaryLayer("kota", GEOJSON_FILES.kota),
      loadBoundaryLayer("kecamatan", GEOJSON_FILES.kecamatan),
      loadBoundaryLayer("desa", GEOJSON_FILES.desa),
    ]);

    if (kota + kecamatan + desa === 0) {
      statusText.value = "Data GeoJSON tidak ditemukan.";
    } else {
      statusText.value = `Dimuat: ${kota} kota, ${kecamatan} kecamatan, ${desa} desa.`;
    }

    updateLabelsByZoom();

    // Load FTTH infrastructure
    await infrastrukturStore.loadAll();
  });

  // Definisikan handler online/offline di top-level
  const onOnline = () => {
    isOnline.value = true;
  };
  const onOffline = () => {
    isOnline.value = false;
  };

  // Daftarkan lifecycle hook secara synchronous
  onUnmounted(() => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    if (map.value) {
      map.value.off("zoomend", updateLabelsByZoom);
      map.value.remove();
    }
  });

  return { map, statusText, isOnline, currentBasemap, switchBasemap };
}
