<template>
  <div style="position: relative; width: 100%; height: 100%">
    <MapView ref="mapViewRef" />

    <NotificationContainer />

    <div class="top-right-controls">
      <CoordinateSearch :map="mapRef" />
      <LoginButton @open-login="loginModalVisible = true" />
    </div>

    <LoginModal :visible="loginModalVisible" @close="loginModalVisible = false" />

    <MeasureTool v-if="mapRef" :map="mapRef" />
    <SidePanel :is-online="isOnline" :status-text="statusText" />
    <DetailPanel />

    <div class="copyright">
      &copy; {{ new Date().getFullYear() }} KenMap v1.1.0- Develop by CandraSP
    </div>

    <PinModal
      :visible="pinModalVisible"
      :lat="pinLat"
      :lng="pinLng"
      @close="pinModalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import MapView from "@/components/MapView.vue";
import NotificationContainer from "@/components/NotificationContainer.vue";
import LoginButton from "@/components/auth/LoginButton.vue";
import LoginModal from "@/components/auth/LoginModal.vue";
import MeasureTool from "@/components/MeasureTool.vue";
import SidePanel from "@/components/SidePanel.vue";
import DetailPanel from "@/components/DetailPanel.vue";
import PinModal from "@/components/pins/PinModal.vue";
import CoordinateSearch from "@/components/CoordinateSearch.vue";

const auth = useAuthStore();
const mapViewRef = ref(null);
const mapRef = shallowRef(null);
const isOnline = ref(navigator.onLine);
const statusText = ref("Memuat data…");

const loginModalVisible = ref(false);
const pinModalVisible = ref(false);
const pinLat = ref(0);
const pinLng = ref(0);

// Expose openPinModal ke window untuk dipanggil dari HTML string dalam popup Leaflet
window.__openPinModal = (lat, lng) => {
  pinLat.value = lat;
  pinLng.value = lng;
  pinModalVisible.value = true;
};

onMounted(async () => {
  await auth.checkLoginStatus();

  // Tunggu MapView mount lalu ambil map instance
  setTimeout(() => {
    if (mapViewRef.value) {
      mapRef.value = mapViewRef.value.map;
      isOnline.value = mapViewRef.value.isOnline;
      statusText.value = mapViewRef.value.statusText;
    }
  }, 100);
});
</script>

<style scoped>
.top-right-controls {
  position: fixed;
  top: 14px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
}

.copyright {
  position: fixed;
  bottom: 0px;
  left: 0px;
  font-size: 9px;
  color: white;
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 1000;
  pointer-events: none;
}

@media (min-width: 768px) {
  .copyright {
    font-size: 10px;
  }
}
</style>
