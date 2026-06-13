<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '../stores/user'

  const router = useRouter()
  const { state, fetchUserPlaylists, logout } = useUserStore()

  const activeTab = ref('all')
  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'created', label: '创建' },
    { key: 'collected', label: '收藏' },
  ]

  // 歌单数据
  const playlists = ref([])
  const loading = ref(false)
  const error = ref('')

  // 根据 tab 过滤
  const filteredPlaylists = computed(() => {
    if (activeTab.value === 'all') return playlists.value
    if (activeTab.value === 'created') {
      return playlists.value.filter((p) => p.userId === state.profile?.userId)
    }
    // collected: 非本人创建
    return playlists.value.filter((p) => p.userId !== state.profile?.userId)
  })

  // 加载用户歌单
  const loadPlaylists = async () => {
    if (!state.isLoggedIn) return
    loading.value = true
    error.value = ''
    try {
      const list = await fetchUserPlaylists()
      playlists.value = list
    } catch {
      error.value = '加载失败，请重试'
    } finally {
      loading.value = false
    }
  }

  // 点击歌单跳转详情
  const goPlaylist = (id) => {
    if (!id) return
    router.push({ name: 'musiclist', query: { id } })
  }

  // 去登录
  const goLogin = () => {
    router.push('/login')
  }

  onMounted(() => {
    loadPlaylists()
  })
</script>

<template>
  <div class="my-music">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>我的音乐</h2>
    </div>

    <!-- 未登录 -->
    <div v-if="!state.isLoggedIn" class="empty-state">
      <div class="empty-icon">🎵</div>
      <p>登录后查看你的音乐收藏</p>
      <button class="btn-outline" @click="goLogin">立即登录</button>
    </div>

    <!-- 已登录 -->
    <template v-else>
      <!-- 用户信息卡片 -->
      <div class="user-card" v-if="state.profile">
        <img
          :src="state.profile.avatarUrl"
          :alt="state.profile.nickname"
          class="user-card-avatar"
        />
        <div class="user-card-info">
          <h3>{{ state.profile.nickname }}</h3>
          <p v-if="state.profile.signature">{{ state.profile.signature }}</p>
        </div>
      </div>

      <!-- Tab 切换 -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 加载失败 -->
      <div v-else-if="error" class="state-box">
        <p>{{ error }}</p>
        <button class="btn-outline" style="margin-top: 16px" @click="loadPlaylists">重试</button>
      </div>

      <!-- 歌单列表 -->
      <div v-else-if="filteredPlaylists.length" class="playlist-grid">
        <div
          v-for="item in filteredPlaylists"
          :key="item.id"
          class="playlist-card"
          @click="goPlaylist(item.id)"
        >
          <div class="card-cover">
            <img :src="item.coverImgUrl" :alt="item.name" />
            <span class="card-count">{{ item.trackCount || 0 }}首</span>
          </div>
          <p class="card-name">{{ item.name }}</p>
          <p class="card-creator" v-if="item.creator">
            {{ item.creator.nickname }}
          </p>
        </div>
      </div>

      <!-- 空歌单 -->
      <div v-else class="state-box">
        <div class="empty-icon" style="font-size: 48px; margin-bottom: 16px;">📂</div>
        <p>暂无歌单</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.my-music {
  min-height: calc(100vh - 64px - 64px);
}

/* ========== 页面头部 ========== */
.page-header h2 {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 24px;
}

/* ========== 用户卡片 ========== */
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.user-card-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.user-card-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.user-card-info p {
  font-size: 13px;
  color: var(--color-text-muted);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== Tabs ========== */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: var(--color-bg-white);
  padding: 4px;
  border-radius: var(--radius-sm);
  width: fit-content;
  box-shadow: var(--shadow-sm);
}

.tab {
  padding: 8px 24px;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-light);
  font-size: 14px;
  transition: all var(--transition);
}

.tab:hover {
  color: var(--color-text);
}

.tab.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 500;
}

/* ========== 状态区域 ========== */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
}

.state-box p {
  font-size: 14px;
  color: var(--color-text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state p {
  font-size: 15px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.btn-outline {
  padding: 10px 32px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: transparent;
  font-size: 14px;
  transition: all var(--transition);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: #fff;
}

/* ========== 歌单网格 ========== */
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
}

.playlist-card {
  cursor: pointer;
  transition: transform var(--transition);
}

.playlist-card:hover {
  transform: translateY(-4px);
}

.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-count {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 11px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.card-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-creator {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
