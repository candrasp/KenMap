// Pemetaan warna badge status. Dipakai untuk header DetailPanel dan
// (kalau perlu) di dalam tiap DetailSection.
//
// PENTING: nilai di bawah ini sengaja dipertahankan PERSIS seperti sebelum
// refactor — termasuk perbedaan kecil bg untuk status "pending" (klien) vs
// "planning" (sto/odc/odp) yang sebelumnya ditulis manual di computed terpisah.
// Kalau ternyata itu cuma inkonsistensi yang tidak disengaja, tinggal disamakan
// di sini saja (satu tempat), tidak perlu ubah di 4 tempat lagi.
const STATUS_STYLES = {
  aktif: { color: "#6ee7b7", bg: "rgba(16, 185, 129, 0.15)" },
  nonaktif: { color: "#fca5a5", bg: "rgba(239, 68, 68, 0.15)" },
  maintenance: { color: "#fbbf24", bg: "rgba(251, 146, 60, 0.15)" },
  planning: { color: "#fcd34d", bg: "rgba(253, 211, 52, 0.15)" },
  pending: { color: "#fcd34d", bg: "rgba(245, 158, 11, 0.15)" },
};

/**
 * @param {string|null|undefined} status - nilai status mentah dari data device
 * @param {string} defaultStatus - status fallback per tipe device kalau field status kosong
 *   (mis. sto -> 'aktif', odc/odp -> 'planning', klien -> 'pending')
 * @returns {{ label: string, color: string, bg: string }}
 */
export function getStatusBadge(status, defaultStatus = "planning") {
  const resolved = status || defaultStatus;
  const style = STATUS_STYLES[resolved] || STATUS_STYLES[defaultStatus] || STATUS_STYLES.planning;
  return {
    label: resolved.toUpperCase(),
    color: style.color,
    bg: style.bg,
  };
}
