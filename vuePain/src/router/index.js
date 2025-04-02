import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Register from '@/views/Register.vue'
import ProviderPlans from '@/views/ProviderPlans.vue' 
import familyHome from '@/views/familyTracker/familyHome.vue'
import FamilyHome from '@/views/familyTracker/familyHome.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/signup',
      name: 'signup',
      component: Register
    },
    {
      path: '/plans',
      name: 'plans',
      component: ProviderPlans
    },
    {
      path: '/maxTracker',
      name: 'maxTracker',
      component: FamilyHome
    }
  ]
})

export default router
