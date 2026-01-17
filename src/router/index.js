import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Detail from '../views/Detail.vue'
import Artists from '../views/Artists.vue'
import ArtistProfile from '../views/ArtistProfile.vue'
import About from '../views/About.vue'
import R18 from '../views/R18.vue'

const routes = [
  { 
    path: '/', 
    name: 'Home', 
    component: Home,
    meta: { title: 'MtcACG - 首页' }
  },
  { 
    path: '/r18', 
    name: 'R18', 
    component: R18,
    meta: { title: 'R-18 内容 - MtcACG' }
  },
  { 
    path: '/detail/:id', 
    name: 'Detail', 
    component: Detail,
    meta: { title: '图片详情 - MtcACG' }
  },
  { 
    path: '/artists', 
    name: 'Artists', 
    component: Artists,
    meta: { title: '画师分类 - MtcACG' }
  },
  { 
    path: '/artist/:name', 
    name: 'ArtistProfile', 
    component: ArtistProfile,
    meta: { title: '画师主页 - MtcACG' }
  },
  { 
    path: '/about', 
    name: 'About', 
    component: About,
    meta: { title: '关于 - MtcACG' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫：更新页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'MtcACG'
  next()
})

export default router
