<template>
  <div class="coordinate-search" :class="{ 'is-focused': isFocused || showDropdown }" ref="rootEl">
    <!-- Search Icon -->
    <svg
      class="search-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>

    <input
      v-model="coordinateInput"
      type="text"
      placeholder="Cari koordinat, ODP, klien…"
      @keydown.enter.prevent="handleEnterKey"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
      @keydown.escape="closeDropdown"
      @keydown.down.prevent="navigateDown"
      @keydown.up.prevent="navigateUp"
    />

    <!-- Clear button -->
    <button
      v-if="coordinateInput"
      class="clear-btn"
      @click="clearSearch"
      title="Hapus"
      tabindex="-1"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <!-- Dropdown Results -->
    <Transition name="dropdown">
      <div v-if="showDropdown" class="search-dropdown">
        <!-- Loading state -->
        <div v-if="isSearching" class="dropdown-empty">
          <svg
            class="spin-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span>Mencari…</span>
        </div>

        <!-- Results -->
        <template v-else-if="results.length > 0">
          <!-- Category: ODP -->
          <div v-if="odpResults.length > 0" class="dropdown-category">ODP</div>
          <button
            v-for="(item, i) in odpResults"
            :key="'odp-' + item.id"
            class="dropdown-item"
            :class="{ highlighted: highlightIndex === i }"
            @mousedown.prevent="selectItem(item)"
          >
            <span class="item-icon odp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </span>
            <span class="item-name">{{ item.nama }}</span>
            <span class="item-coords">{{ item.lat?.toFixed(4) }}, {{ item.lng?.toFixed(4) }}</span>
          </button>

          <!-- Category: Klien -->
          <div v-if="klienResults.length > 0" class="dropdown-category">Klien</div>
          <button
            v-for="(item, i) in klienResults"
            :key="'klien-' + item.id"
            class="dropdown-item klien-item"
            :class="{ highlighted: highlightIndex === odpResults.length + i }"
            @mousedown.prevent="selectItem(item)"
          >
            <span class="item-icon klien" :style="{ color: statusColor(item.status) }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <div class="item-text">
              <span class="item-name">{{ item.nama }}</span>
              <span v-if="item.alamat" class="item-address">{{ item.alamat }}</span>
            </div>
            <span
              class="item-badge"
              :style="{ background: statusBg(item.status), color: statusColor(item.status) }"
            >
              {{ item.status || "pending" }}
            </span>
          </button>
        </template>

        <!-- No results -->
        <div v-else class="dropdown-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M8 11h6M11 8v6" />
          </svg>
          <span
            >Tidak ada yang cocok untuk "<strong>{{ coordinateInput }}</strong
            >"</span
          >
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import L from "leaflet";
import { useInfrastrukturStore } from "@/stores/infrastruktur";
import { useAuthStore } from "@/stores/auth";
import { useNotification } from "@/composables/useNotification";

const props = defineProps({ map: Object });

const infraStore = useInfrastrukturStore();
const authStore = useAuthStore();
const coordinateInput = ref("");
const { error } = useNotification();
const isFocused = ref(false);
const showDropdown = ref(false);
const isSearching = ref(false);
const results = ref([]);
const highlightIndex = ref(-1);
const rootEl = ref(null);
let debounceTimer = null;

// ---- Computed ----
const odpResults = computed(() => results.value.filter((r) => r._type === "odp"));
const klienResults = computed(() => results.value.filter((r) => r._type === "klien"));

// ---- Helpers ----
function statusColor(status) {
  if (status === "aktif") return "#10b981";
  if (status === "nonaktif") return "#ef4444";
  return "#f59e0b";
}
function statusBg(status) {
  if (status === "aktif") return "rgba(16,185,129,0.15)";
  if (status === "nonaktif") return "rgba(239,68,68,0.15)";
  return "rgba(245,158,11,0.15)";
}

// ---- Coordinate detection ----
function looksLikeCoordinate(input) {
  const parts = input.split(",").map((p) => p.trim());
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    return !isNaN(lat) && !isNaN(lng);
  }
  if (parts.length === 4) {
    const lat = parseFloat(parts[0] + "." + parts[1]);
    const lng = parseFloat(parts[2] + "." + parts[3]);
    return !isNaN(lat) && !isNaN(lng);
  }
  return false;
}

// ---- Search logic ----
function onInput() {
  highlightIndex.value = -1;
  const q = coordinateInput.value.trim();
  if (q.length < 2) {
    closeDropdown();
    return;
  }

  if (looksLikeCoordinate(q)) {
    // Don't show dropdown for coordinate-like input — use Enter to jump
    closeDropdown();
    return;
  }

  clearTimeout(debounceTimer);
  isSearching.value = true;
  showDropdown.value = true;

  debounceTimer = setTimeout(() => {
    const lower = q.toLowerCase();

    const matchedOdp = infraStore.odpList
      .filter((o) => o.nama?.toLowerCase().includes(lower) && o.lat && o.lng)
      .slice(0, 5)
      .map((o) => ({ ...o, _type: "odp" }));

    const matchedKlien = infraStore.klienList
      .filter((k) => k.nama?.toLowerCase().includes(lower) && k.lat && k.lng)
      .slice(0, 5)
      .map((k) => ({ ...k, _type: "klien" }));

    results.value = [...matchedOdp, ...matchedKlien];
    isSearching.value = false;
  }, 250);
}

// ---- Unified Enter key handler ----
function handleEnterKey() {
  // If dropdown is open and an item is highlighted, select it
  if (showDropdown.value && highlightIndex.value >= 0) {
    selectHighlighted();
    return;
  }
  // If dropdown is open but nothing highlighted, select first result
  if (showDropdown.value && results.value.length > 0) {
    selectItem(results.value[0]);
    return;
  }
  search();
}

// ---- Coordinate search ----
function search() {

  const input = coordinateInput.value.trim();
  if (!input) return;

  if (!looksLikeCoordinate(input)) {
    // Trigger text search instead
    onInput();
    return;
  }

  const parts = input.split(",").map((p) => p.trim());
  let lat, lng;

  if (parts.length === 2) {
    lat = parseFloat(parts[0]);
    lng = parseFloat(parts[1]);
  } else if (parts.length === 4) {
    lat = parseFloat(parts[0] + "." + parts[1]);
    lng = parseFloat(parts[2] + "." + parts[3]);
  }

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    error("Koordinat tidak valid");
    return;
  }

  if (!props.map) return;

  closeDropdown();
  props.map.setView([lat, lng], 18);

  // Build popup content
  const pinBtn = authStore.isLoggedIn
    ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">
        <button
          onclick="window.__openPinModal(${lat}, ${lng}); this.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button').click();"
          style="
            display:inline-flex;align-items:center;gap:6px;
            background:#3ecf8e;color:#121212;
            border:none;border-radius:6px;
            padding:6px 12px;
            font-size:12px;font-weight:600;
            cursor:pointer;width:100%;justify-content:center;
            font-family:inherit;
          "
        >
          <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5'
            stroke-linecap='round' stroke-linejoin='round' style='width:13px;height:13px;'>
            <path d='M12 5v14M5 12h14'/>
          </svg>
          Tambahkan Pin
        </button>
      </div>`
    : "";

  L.popup()
    .setLatLng([lat, lng])
    .setContent(
      `
      <div style="font-size:13px;min-width:160px;">
        <div style="font-weight:700;font-size:14px;color:#ededed;margin-bottom:4px;">Lokasi Pencarian</div>
        <code style="font-size:11px;color:#858585;">${lat.toFixed(6)}, ${lng.toFixed(6)}</code>
        ${pinBtn}
      </div>
    `,
    )
    .openOn(props.map);
}

// ---- Select item from dropdown ----
function selectItem(item) {
  if (!props.map) return;
  props.map.setView([item.lat, item.lng], 18);
  coordinateInput.value = item.nama;
  closeDropdown();

  // Blur input to hide keyboard on mobile
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  // Highlight on the store's detail panel
  if (item._type === "odp") {
    infraStore.setSelectedDevice({ type: "odp", data: item });
  } else if (item._type === "klien") {
    infraStore.setSelectedDevice({ type: "klien", data: item });
  }
}

// ---- Keyboard navigation ----
function navigateDown() {
  if (!showDropdown.value) return;
  highlightIndex.value = Math.min(highlightIndex.value + 1, results.value.length - 1);
}
function navigateUp() {
  if (!showDropdown.value) return;
  highlightIndex.value = Math.max(highlightIndex.value - 1, -1);
}
function selectHighlighted() {
  if (highlightIndex.value >= 0 && highlightIndex.value < results.value.length) {
    selectItem(results.value[highlightIndex.value]);
  }
}

// ---- Focus/blur ----
function onFocus() {
  isFocused.value = true;
  if (coordinateInput.value.trim().length >= 2 && !looksLikeCoordinate(coordinateInput.value)) {
    showDropdown.value = true;
  }
}
function onBlur() {
  isFocused.value = false;
}
function closeDropdown() {
  showDropdown.value = false;
  isSearching.value = false;
  results.value = [];
  highlightIndex.value = -1;
}

function clearSearch() {
  coordinateInput.value = "";
  closeDropdown();
}

// ---- Click outside to close ----
// Use a small delay so mousedown-triggered selectItem() fires BEFORE dropdown is wiped
function handleClickOutside(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    setTimeout(() => closeDropdown(), 150);
  }
}
onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>

<style scoped>
.coordinate-search {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;

  background: #1c1c1c;
  border: 1px solid #27272a;
  border-radius: 99px;
  padding: 9px 10px 9px 11px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    border-radius 0.2s ease;
}

.coordinate-search.is-focused {
  border-color: var(--sb-accent);
  box-shadow: 0 0 0 3px rgba(62, 207, 142, 0.2);
}

.search-icon {
  width: 14px;
  height: 14px;
  color: var(--sb-text-secondary);
  flex-shrink: 0;
  transition: color 0.2s;
}

.coordinate-search.is-focused .search-icon {
  color: var(--sb-accent);
}

.coordinate-search input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--sb-text-primary);
  font-size: 12px;
  font-family: "Inter", sans-serif;
  width: 150px;
  padding: 0;
  line-height: 1;
}

.coordinate-search input::placeholder {
  color: var(--sb-text-secondary);
  font-size: 12px;
  font-family: inherit;
}

.clear-btn {
  background: transparent;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--sb-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  transition:
    color 0.15s,
    background 0.15s;
}

.clear-btn:hover {
  color: var(--sb-text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.clear-btn svg {
  width: 12px;
  height: 12px;
}

/* ---- Dropdown ---- */
.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  min-width: 260px;
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  z-index: 600;
  /* Custom minimalist scrollbar */
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #3f3f46 transparent;
}

.search-dropdown::-webkit-scrollbar {
  width: 4px;
}
.search-dropdown::-webkit-scrollbar-track {
  background: transparent;
}
.search-dropdown::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 2px;
}

.dropdown-category {
  padding: 8px 14px 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sb-text-secondary);
  border-top: 1px solid #27272a;
}

.dropdown-category:first-child {
  border-top: none;
}

.dropdown-item {
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.15s;
  color: var(--sb-text-primary);
}

.dropdown-item:hover,
.dropdown-item.highlighted {
  background: #27272a;
}

.item-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #27272a;
  color: #3b82f6;
}

.item-icon.odp {
  color: #3b82f6;
}
.item-icon.klien {
  color: #10b981;
}

.item-icon svg {
  width: 13px;
  height: 13px;
}

.item-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-address {
  font-size: 10.5px;
  color: var(--sb-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-coords {
  font-size: 10px;
  color: var(--sb-text-secondary);
  font-family: monospace;
  flex-shrink: 0;
}

.item-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 99px;
  flex-shrink: 0;
  text-transform: capitalize;
}

/* Empty / Loading state */
.dropdown-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px;
  font-size: 12px;
  color: var(--sb-text-secondary);
}

.dropdown-empty svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
