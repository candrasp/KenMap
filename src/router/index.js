import { createRouter, createWebHistory } from 'vue-router'
import MapPage from '@/views/MapPage.vue'

const routes = [
  {
    path: '/',
    name: 'map',
    component: MapPage,
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
