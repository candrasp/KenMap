<template>
  <div id="measure-control" @click.stop @dblclick.stop>
    <span v-if="measuring || result" id="measure-result">{{ result || 'Klik peta untuk menggambar garis!' }}</span>
    <button @click="toggleMeasure" :style="measuring ? { background: '#b3432b', borderColor: '#8a2a18' } : {}">
      <img src="/icons/ruler-dimension-line.svg" alt="Ukur" style="width:16px;vertical-align:middle;filter:invert(0.9)" />
      {{ measuring ? 'Selesai' : 'Ukur Jarak' }}
    </button>
    <button v-if="measuring && points.length > 0" @click="undo" title="Hapus point terakhir">
      <img src="/icons/undo-2.svg" alt="Undo" style="width:16px;vertical-align:middle;filter:invert(0.9)" />
    </button>
    <button v-if="!measuring && result" @click="clear" style="background:#b3432b;border-color:#8a2a18">
      Hapus
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import { useInfrastrukturStore } from '@/stores/infrastruktur'

const props = defineProps({ map: Object })
const infrastrukturStore = useInfrastrukturStore()

const measuring = ref(false)
const points = ref([])
const result = ref('')
let polyline = null
let tempPolyline = null
let markers = []

function formatDistance(meters) {
  return Math.round(meters).toLocaleString('id-ID') + ' m'
}

function calcTotal() {
  let total = 0
  for (let i = 1; i < points.value.length; i++) {
    total += points.value[i - 1].distanceTo(points.value[i])
  }
  return total
}

function onMapClick(e) {
  if (!measuring.value) return
  // Tutup popup dan hentikan propagasi agar handler lain tidak membuka popup
  props.map.closePopup()
  L.DomEvent.stopPropagation(e)
  points.value.push(e.latlng)
  const dot = L.circleMarker(e.latlng, { radius: 5, color: '#f39c12', fillColor: '#f39c12', fillOpacity: 1 }).addTo(props.map)
  markers.push(dot)

  if (!polyline) {
    polyline = L.polyline([e.latlng], { color: '#f39c12', weight: 3 }).addTo(props.map)
  } else {
    polyline.addLatLng(e.latlng)
  }
  result.value = `Total : ${formatDistance(calcTotal())}`
}

function onMouseMove(e) {
  if (!measuring.value || points.value.length === 0) return
  const lastPoint = points.value[points.value.length - 1]
  if (!tempPolyline) {
    tempPolyline = L.polyline([lastPoint, e.latlng], { color: '#f39c12', weight: 3, opacity: 0.5, dashArray: '5,5' }).addTo(props.map)
  } else {
    tempPolyline.setLatLngs([lastPoint, e.latlng])
  }
}

function onDblClick() {
  if (measuring.value) toggleMeasure()
}

function toggleMeasure() {
  measuring.value = !measuring.value
  infrastrukturStore.setMeasuring(measuring.value)
  if (measuring.value) {
    props.map.doubleClickZoom.disable()
    props.map.closePopup()
    props.map.getContainer().style.cursor = 'crosshair'
    clear()
    props.map.on('click', onMapClick)
    props.map.on('mousemove', onMouseMove)
    props.map.on('dblclick', onDblClick)
  } else {
    props.map.doubleClickZoom.enable()
    props.map.getContainer().style.cursor = ''
    props.map.off('click', onMapClick)
    props.map.off('mousemove', onMouseMove)
    props.map.off('dblclick', onDblClick)
    if (tempPolyline) { props.map.removeLayer(tempPolyline); tempPolyline = null }
  }
}

function undo() {
  if (points.value.length === 0) return
  points.value.pop()
  const lastMarker = markers.pop()
  if (lastMarker) props.map.removeLayer(lastMarker)
  if (polyline) {
    polyline.setLatLngs(points.value)
    if (points.value.length === 0) { props.map.removeLayer(polyline); polyline = null }
  }
  result.value = points.value.length > 1 ? `Total : ${formatDistance(calcTotal())}` : ''
}

function clear() {
  points.value = []
  result.value = ''
  markers.forEach(m => props.map.removeLayer(m))
  markers = []
  if (polyline) { props.map.removeLayer(polyline); polyline = null }
  if (tempPolyline) { props.map.removeLayer(tempPolyline); tempPolyline = null }
}

// Ctrl+Z shortcut
function onKeydown(e) {
  if (e.ctrlKey && e.key === 'z' && measuring.value) {
    e.preventDefault()
    undo()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  infrastrukturStore.setMeasuring(false)
  if (props.map) {
    props.map.off('click', onMapClick)
    props.map.off('mousemove', onMouseMove)
    props.map.off('dblclick', onDblClick)
  }
})
</script>
