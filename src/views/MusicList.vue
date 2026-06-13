<script setup>
  import { ref, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import api from '../api'

  const router = useRouter()

  // 从 router.currentRoute 获取歌单 id（避免 useRoute() 在懒加载组件中返回 undefined）
  const playlistId = computed(() => {
    const r = router?.currentRoute?.value
    return r?.query?.id
  })

  // 歌单详情数据
  const playListDetail = ref(null)
  const loading = ref(false)

  const fetchPlayListDetail = async () => {
    const id = playlistId.value
    if (!id) return

    loading.value = true
    try {
      const res = await api.get('/playlist/detail', { id })
      playListDetail.value = res.playlist
      console.log('歌单详情：', playListDetail.value)
    } catch (err) {
      console.error('Failed to fetch playlist detail:', err)
      playListDetail.value = null
    } finally {
      loading.value = false
    }
  }

  // 拼接歌手名
  const getArtists = (ar) => {
    if (!ar || !ar.length) return ''
    return ar.map(a => a.name).join(' / ')
  }

  // 返回上一页
  const goBack = () => {
    router.back()
  }

  // 点击歌曲 - 跳转到播放页
  const playTrack = (track) => {
    if (!track || !track.id) return
    router.push({
      name: 'player',
      query: {
        id: track.id,
        name: track.name,
        artist: getArtists(track.ar),
        cover: track.al?.picUrl || '',
      },
    })
  }

  // 监听路由 query 变化，每次 id 改变时重新请求
  watch(
    () => router?.currentRoute?.value?.query?.id,
    (newId) => {
      if (newId) {
        fetchPlayListDetail()
      }
    },
    { immediate: true }
  )
</script>


<template>
  <div class="music-list">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack">← 返回</button>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态：没有传入 id -->
    <div v-else-if="!playlistId" class="empty-state">
      <div class="empty-icon">🎵</div>
      <p>未指定歌单 ID，请从推荐页进入</p>
    </div>

    <!-- 数据加载失败 -->
    <div v-else-if="!playListDetail" class="empty-state">
      <div class="empty-icon">😕</div>
      <p>歌单加载失败，请稍后重试</p>
    </div>

    <!-- 歌单详情 -->
    <template v-else>
      <!-- 歌单头部 -->
      <div class="playlist-header">
        <div class="cover-wrap">
          <img
            :src="playListDetail.coverImgUrl"
            :alt="playListDetail.name"
            class="cover-img"
          />
        </div>
        <div class="header-info">
          <h2 class="playlist-name">{{ playListDetail.name }}</h2>
          <div class="creator">
            <img
              v-if="playListDetail.creator"
              :src="playListDetail.creator.avatarUrl"
              class="creator-avatar"
            />
            <span>{{ playListDetail.creator?.nickname || '未知' }}</span>
          </div>
          <p class="description" v-if="playListDetail.description">
            {{ playListDetail.description }}
          </p>
          <div class="meta">
            <span>共 {{ playListDetail.trackCount || 0 }} 首</span>
            <span v-if="playListDetail.playCount">播放 {{ playListDetail.playCount }}</span>
          </div>
        </div>
      </div>

      <!-- 歌曲列表 -->
      <div class="track-section">
        <div class="track-header">
          <h3>歌曲列表</h3>
        </div>

        <ul class="track-list" v-if="playListDetail.tracks && playListDetail.tracks.length">
          <li
            v-for="(track, index) in playListDetail.tracks"
            :key="track.id"
            class="track-item"
            @click="playTrack(track)"
          >
            <span class="track-index">{{ index + 1 }}</span>
            <div class="track-cover-box">
              <img
                :src="track.al?.picUrl"
                alt="album cover"
                class="track-cover"
              />
            </div>
            <div class="track-info">
              <span class="track-name">{{ track.name }}</span>
              <span class="track-artist">{{ getArtists(track.ar) }}</span>
            </div>
          </li>
        </ul>

        <div v-else class="empty-tracks">
          <p>暂无歌曲数据</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.music-list {
  min-height: calc(100vh - 64px - 64px);
  padding: 8px 0;
}

/* ========== 返回按钮 ========== */
.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  transition: color var(--transition);
}

.back-btn:hover {
  color: var(--color-primary);
}

/* ========== 加载 & 空状态 ========== */
.loading-state,
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
}

.loading-state p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 16px;
}

/* 简单的 spinner */
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 歌单头部 ========== */
.playlist-header {
  display: flex;
  gap: 28px;
  margin-bottom: 36px;
}

.cover-wrap {
  position: relative;
  width: 220px;
  height: 220px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.playlist-name {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.creator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.creator-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.description {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
  /* 三行溢出省略 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: auto;
}

/* ========== 歌曲列表 ========== */
.track-section {
  margin-top: 24px;
}

.track-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-primary);
}

.track-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.track-list {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 20px;
  transition: background 0.15s ease;
  cursor: pointer;
}

.track-item:nth-child(even) {
  background: #fafafa;
}

.track-item:hover {
  background: #f0f0f0;
}

.track-index {
  width: 28px;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.track-item:nth-child(-n+3) .track-index {
  color: var(--color-primary);
  font-weight: 600;
}

.track-cover-box {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.track-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.track-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  font-size: 12px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-tracks {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
