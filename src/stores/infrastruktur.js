import { defineStore } from "pinia";
import { ref } from "vue";
import L from "leaflet";

// Ikon untuk setiap tipe perangkat FTTH
export const FTTH_ICONS = {
  sto: L.icon({
    iconUrl: "/icons/sto.svg",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
  }),
  olt: L.icon({
    iconUrl: "/icons/olt.svg",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
  }),
  odc: L.icon({
    iconUrl: "/icons/odc.svg",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
  }),
  "odp-tanam": L.icon({
    iconUrl: "/icons/odp-tanam.svg",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
  }),
  "odp-tiang": L.icon({
    iconUrl: "/icons/odp-tiang.svg",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10],
  }),
  "klien-aktif": L.icon({
    iconUrl: "/icons/klien-aktif.svg",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -8],
  }),
  "klien-nonaktif": L.icon({
    iconUrl: "/icons/klien-nonaktif.svg",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -8],
  }),
  "klien-pending": L.icon({
    iconUrl: "/icons/klien-pending.svg",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -8],
  }),
};

export const useInfrastrukturStore = defineStore("infrastruktur", () => {
  const stoList = ref([]);
  const odcList = ref([]);
  const odpList = ref([]);
  const klienList = ref([]);
  const kabelList = ref([]);
  const oltList = ref([]);
  const isMeasuring = ref(false);
  const selectedDevice = ref(null);

  // Layer groups — diisi saat useLeaflet composable dipakai
  let stoLayerGroup = null;
  let oltLayerGroup = null;
  let odcLayerGroup = null;
  let odpLayerGroup = null;
  let klienLayerGroup = null;
  let kabelLayerGroup = null;

  function setLayerGroups(groups) {
    stoLayerGroup = groups.sto;
    oltLayerGroup = groups.olt;
    odcLayerGroup = groups.odc;
    odpLayerGroup = groups.odp;
    klienLayerGroup = groups.klien;
    kabelLayerGroup = groups.kabel;
  }

  function setSelectedDevice(device) {
    selectedDevice.value = device;
  }

  function clearSelectedDevice() {
    selectedDevice.value = null;
  }

  function setMeasuring(val) {
    isMeasuring.value = val;
    if (val) {
      clearSelectedDevice();
    }
    const groups = [
      stoLayerGroup,
      oltLayerGroup,
      odcLayerGroup,
      odpLayerGroup,
      klienLayerGroup,
      kabelLayerGroup,
    ];
    groups.forEach((group) => {
      if (!group) return;
      group.eachLayer((layer) => {
        const el = layer.getElement ? layer.getElement() : null;
        if (el) {
          el.style.pointerEvents = val ? "none" : "auto";
        }
      });
    });
  }

  function clearAllLayers() {
    stoLayerGroup?.clearLayers();
    oltLayerGroup?.clearLayers();
    odcLayerGroup?.clearLayers();
    odpLayerGroup?.clearLayers();
    klienLayerGroup?.clearLayers();
    kabelLayerGroup?.clearLayers();
  }

  function renderAll() {
    clearAllLayers();
    renderKabel();
    renderSto();
    renderOlt();
    renderOdc();
    renderOdp();
    renderKlien();
  }

  function renderKabel() {
    kabelList.value.forEach((kabel) => {
      if (!kabel.geometry?.coordinates) return;
      const latlngs = kabel.geometry.coordinates.map((c) => [c[1], c[0]]);
      let style = { color: "#3b82f6", weight: 3, opacity: 0.8, interactive: !isMeasuring.value };
      if (kabel.jenis === "feeder")
        style = { color: "#10b981", weight: 4.5, opacity: 0.9, interactive: !isMeasuring.value };
      else if (kabel.jenis === "drop")
        style = {
          color: "#f59e0b",
          weight: 2,
          opacity: 0.8,
          dashArray: "5, 5",
          interactive: !isMeasuring.value,
        };

      const jenisLabel =
        { feeder: "Kabel Feeder", distribusi: "Kabel Distribusi", drop: "Kabel Drop" }[
          kabel.jenis
        ] || "Kabel";
      const polyline = L.polyline(latlngs, style);
      polyline.bindPopup(`
        <div class="popup-title" style="color:${style.color};">${jenisLabel}</div>
        <div class="popup-coords" style="font-weight:500;">Koneksi: ${kabel.dari_tipe.toUpperCase()} #${kabel.dari_id} ➔ ${kabel.ke_tipe.toUpperCase()} #${kabel.ke_id}</div>
        <div class="popup-coords">Jumlah Core: ${kabel.jumlah_core || "-"} Core</div>
        <div class="popup-coords" style="margin-top:4px;border-top:1px solid var(--sb-border);padding-top:4px;">
          Panjang: <strong>${kabel.panjang_meter ? Math.round(kabel.panjang_meter) + " m" : "-"}</strong>
        </div>
      `);
      kabelLayerGroup?.addLayer(polyline);
    });
  }

  function renderSto() {
    stoList.value.forEach((sto) => {
      if (!sto.lat || !sto.lng) return;
      const marker = L.marker([sto.lat, sto.lng], {
        icon: FTTH_ICONS["sto"],
        interactive: !isMeasuring.value,
      });
      marker.on("click", () => {
        if (isMeasuring.value) return;
        setSelectedDevice({ type: "sto", data: sto });
        const offset = window.innerWidth < 768 ? [0, -(window.innerHeight * 0.25)] : [0, 0];
        marker._map?.setView(marker.getLatLng(), marker._map.getZoom(), {
          animate: true,
          pan: { offset },
        });
      });
      marker.bindTooltip(sto.nama, {
        permanent: true,
        direction: "right",
        offset: [12, 0],
        className: "device-label",
      });
      stoLayerGroup?.addLayer(marker);
    });
  }

  function renderOlt() {
    oltList.value.forEach((olt) => {
      if (!olt.lat || !olt.lng) return;
      const marker = L.marker([olt.lat, olt.lng], {
        icon: FTTH_ICONS["olt"],
        interactive: !isMeasuring.value,
      });
      marker.on("click", () => {
        if (isMeasuring.value) return;
        setSelectedDevice({ type: "olt", data: olt });
        const offset = window.innerWidth < 768 ? [0, -(window.innerHeight * 0.25)] : [0, 0];
        marker._map?.setView(marker.getLatLng(), marker._map.getZoom(), {
          animate: true,
          pan: { offset },
        });
      });
      marker.bindTooltip(olt.nama, {
        permanent: true,
        direction: "right",
        offset: [12, 0],
        className: "device-label",
      });
      oltLayerGroup?.addLayer(marker);
    });
  }

  function renderOdc() {
    odcList.value.forEach((odc) => {
      if (!odc.lat || !odc.lng) return;
      const marker = L.marker([odc.lat, odc.lng], {
        icon: FTTH_ICONS["odc"],
        interactive: !isMeasuring.value,
      });
      marker.on("click", () => {
        if (isMeasuring.value) return;
        setSelectedDevice({ type: "odc", data: odc });
        // Geser peta agar marker berada di tengah area yang tersisa (50vh)
        const offset = window.innerWidth < 768 ? [0, -(window.innerHeight * 0.25)] : [0, 0];
        marker._map?.setView(marker.getLatLng(), marker._map.getZoom(), {
          animate: true,
          pan: { offset },
        });
      });
      marker.bindTooltip(odc.nama, {
        permanent: true,
        direction: "right",
        offset: [12, 0],
        className: "device-label",
      });
      odcLayerGroup?.addLayer(marker);
    });
  }

  function renderOdp() {
    odpList.value.forEach((odp) => {
      if (!odp.lat || !odp.lng) return;
      const iconKey = odp.tipe_pemasangan === "tanam" ? "odp-tanam" : "odp-tiang";
      const marker = L.marker([odp.lat, odp.lng], {
        icon: FTTH_ICONS[iconKey],
        interactive: !isMeasuring.value,
      });
      marker.on("click", () => {
        if (isMeasuring.value) return;
        setSelectedDevice({ type: "odp", data: odp });
        // Geser peta agar marker berada di tengah area yang tersisa (50vh)
        const offset = window.innerWidth < 768 ? [0, -(window.innerHeight * 0.25)] : [0, 0];
        marker._map?.setView(marker.getLatLng(), marker._map.getZoom(), {
          animate: true,
          pan: { offset },
        });
      });
      marker.bindTooltip(odp.nama, {
        permanent: true,
        direction: "right",
        offset: [12, 0],
        className: "device-label",
      });
      odpLayerGroup?.addLayer(marker);
    });
  }

  function renderKlien() {
    // Build ODP lookup map for fast access by id
    const odpMap = new Map(odpList.value.map((o) => [o.id, o]));

    klienList.value.forEach((klien) => {
      if (!klien.lat || !klien.lng) return;
      const iconKey = `klien-${klien.status || "pending"}`;
      const marker = L.marker([klien.lat, klien.lng], {
        icon: FTTH_ICONS[iconKey],
        interactive: !isMeasuring.value,
      });
      marker.on("click", () => {
        if (isMeasuring.value) return;
        setSelectedDevice({ type: "klien", data: klien });
        // Geser peta agar marker berada di tengah area yang tersisa (50vh)
        const offset = window.innerWidth < 768 ? [0, -(window.innerHeight * 0.25)] : [0, 0];
        marker._map?.setView(marker.getLatLng(), marker._map.getZoom(), {
          animate: true,
          pan: { offset },
        });
      });
      marker.bindTooltip(klien.nama, {
        permanent: false,
        direction: "top",
        offset: [0, -14],
        className: "device-label",
        sticky: false,
      });
      klienLayerGroup?.addLayer(marker);

      // Draw a dashed connection line from klien ke ODP
      if (klien.odp_id) {
        const odp = odpMap.get(klien.odp_id);
        if (odp?.lat && odp?.lng) {
          const statusColorMap = { aktif: "#10b981", nonaktif: "#fa6b6b", pending: "#f59e0b" };
          const lineColor = statusColorMap[klien.status] || "#f59e0b";
          const dropLine = L.polyline(
            [
              [klien.lat, klien.lng],
              [odp.lat, odp.lng],
            ],
            {
              color: lineColor,
              weight: 2,
              opacity: 0.6,

              interactive: false,
            },
          );
          klienLayerGroup?.addLayer(dropLine);
        }
      }
    });
  }

  async function loadAll() {
    try {
      const [resSto, resKabel, resOdc, resOdp, resKlien, resOlt] = await Promise.all([
        fetch("/api/sto"),
        fetch("/api/kabel"),
        fetch("/api/odc"),
        fetch("/api/odp"),
        fetch("/api/klien"),
        fetch("/api/olt"),
      ]);
      if (resSto.ok) stoList.value = await resSto.json();
      if (resKabel.ok) kabelList.value = await resKabel.json();
      if (resOdp.ok) odpList.value = await resOdp.json();
      if (resKlien.ok) klienList.value = await resKlien.json();
      if (resOlt.ok) oltList.value = await resOlt.json();

      if (resOdc.ok) {
        const rawOdc = await resOdc.json();
        odcList.value = rawOdc.map((odc) => {
          const olt = oltList.value.find((o) => o.id === odc.olt_id);
          return {
            ...odc,
            olt_nama: olt ? olt.nama : null,
            olt_kode: olt ? olt.kode : null,
          };
        });
      }

      renderAll();
    } catch (err) {
      console.error("Gagal memuat data infrastruktur:", err);
    }
  }

  return {
    stoList,
    odcList,
    odpList,
    klienList,
    kabelList,
    oltList,
    isMeasuring,
    selectedDevice,
    setLayerGroups,
    setMeasuring,
    setSelectedDevice,
    clearSelectedDevice,
    loadAll,
    renderAll,
  };
});
