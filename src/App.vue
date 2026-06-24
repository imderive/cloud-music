<script setup>
  import { RouterLink, RouterView, useRouter } from 'vue-router'
  import { ref, onMounted } from 'vue'
  import { useUserStore } from './stores/user'
  import logoImg from '@/assets/imgs/logo.jpg'

  const { state, checkLogin, logout } = useUserStore()
  const router = useRouter()

  // 获取用户输入的搜索关键词
  const searchKeyword = ref('')
  const handleSearch = () => {
    const keyword = searchKeyword.value.trim()
    if (!keyword) return
    router.push({ name: 'search', query: { keywords: keyword } })
  }

  // 退出登录
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // 去我的音乐
  const goMyMusic = () => {
    router.push('/mymusic')
  }

  onMounted(() => {
    checkLogin()
  })
</script>

<template>
  <div class="app">
    <header class="top-nav">
      <div class="top-nav-inner">
        <div class="logo">
          <RouterLink to="/">
            <img :src="logoImg" alt="时雨云音乐" class="logo-img" />
          </RouterLink>
        </div>
        <nav class="nav-links">
          <RouterLink to="/" class="nav-link">音乐馆</RouterLink>
          <RouterLink to="/mymusic" class="nav-link">我的音乐</RouterLink>
        </nav>
        <div class="nav-actions">
          <input
            type="text"
            placeholder="搜索歌曲、歌手、专辑"
            class="search-input search-box"
            v-model="searchKeyword"
            @keyup.enter="handleSearch"
          />
          <!-- 已登录：头像下拉 -->
          <div v-if="state.isLoggedIn && state.profile" class="user-menu">
            <button class="user-avatar">
              <img
                :src="state.profile.avatarUrl"
                :alt="state.profile.nickname"
              />
            </button>
            <div class="user-dropdown">
              <div class="user-dropdown-header">
                <span class="user-name">{{ state.profile.nickname }}</span>
              </div>
              <button class="user-dropdown-item" @click="goMyMusic">🎵 我的音乐</button>
              <button class="user-dropdown-item" @click="handleLogout">🚪 退出登录</button>
            </div>
          </div>
          <!-- 未登录 -->
          <RouterLink v-else to="/login" class="login-btn">登录</RouterLink>
        </div>
      </div>
    </header>
    <main class="main-view">
      <RouterView />
    </main>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
}

/* ========== 顶部导航 ========== */
.top-nav {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #242424;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.top-nav-inner {
  width: 100%;
  max-width: var(--max-width);
  padding: 0 32px;
  display: flex;
  align-items: center;
}

.logo {
  height: 48px;
  flex-shrink: 0;
}

.logo a {
  display: block;
  height: 100%;
}

.logo-img {
  height: 100%;
  width: auto;
  object-fit: contain;
}

.nav-links {
  display: flex;
  gap: 8px;
  margin-left: 32px;
}

.nav-link {
  color: #ccc;
  text-decoration: none;
  font-size: 14px;
  padding: 6px 18px;
  border-radius: var(--radius-full);
  transition: all var(--transition);
  position: relative;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-link.router-link-active {
  color: #fff;
  background: var(--color-primary);
  font-weight: 500;
}

.nav-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 12px;
}

.search-input {
  width: 200px;
  height: 34px;
  padding: 0 16px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 13px;
  transition: all var(--transition);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.2);
  width: 240px;
}

.login-btn {
  padding: 7px 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-primary);
  color: #ccc;
  font-size: 13px;
  text-decoration: none;
  transition: all var(--transition);
  white-space: nowrap;
}

.login-btn:hover {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.user-menu {
  position: relative;
  padding: 6px 0 10px; /* 扩大触摸区域 */
  margin: -6px 0 -10px; /* 视觉上不变 */
}

/* 隐形桥接：防止鼠标在头像和下拉菜单之间时菜单消失 */
.user-menu::before {
  content: '';
  position: absolute;
  top: 100%;
  left: -20px;
  right: -20px;
  height: 14px;
  pointer-events: none;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--transition), transform 0.2s ease;
  position: relative;
  z-index: 1;
}

.user-avatar:hover {
  border-color: var(--color-primary);
  transform: scale(1.08);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 50%;
}

.user-dropdown {
  position: absolute;
  top: 46px;
  right: 0;
  min-width: 160px;
  padding: 8px 0;
  border-radius: 10px;
  background: #2d2d2d;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transform: translateY(4px) scale(0.96);
  /* 出现：0s 延迟；消失：0.15s 延迟，防止鼠标瞬间划过时闪烁 */
  transition:
    opacity 0.18s ease 0.15s,
    transform 0.18s ease 0.15s;
}

/* 下拉菜单上的小三角箭头 */
.user-dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 14px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #2d2d2d;
  opacity: 0;
  transition: opacity 0.18s ease 0.15s;
}

.user-dropdown-header {
  padding: 6px 16px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 4px;
}

.user-name {
  font-size: 13px;
  color: #f5f5f5;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}

.user-dropdown-item {
  width: 100%;
  padding: 9px 16px;
  border: none;
  background: transparent;
  color: #bbb;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.user-menu:hover .user-dropdown {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(1);
  /* 悬停出现：0s 延迟 */
  transition:
    opacity 0.2s ease 0s,
    transform 0.2s ease 0s;
}

.user-menu:hover .user-dropdown::before {
  opacity: 1;
  transition: opacity 0.2s ease 0s;
}

/* ========== 主内容区 - 居中对齐 ========== */
.main-view {
  flex: 1;
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 32px 24px;
}
</style>
