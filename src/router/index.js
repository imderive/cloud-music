import { createRouter, createWebHistory } from 'vue-router'
import MusicHall from '../views/MusicHall.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'music',
      component: MusicHall,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/player',
      name: 'player',
      component: () => import('../views/Player.vue'),
    },
    {
      path: '/musiclist',
      name: 'musiclist',
      component: () => import('../views/MusicList.vue'),
    },
    {
      path: '/mymusic',
      name: 'mymusic',
      component: () => import('../views/MyMusic.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/Search.vue'),
    },
  ],
})

export default router
