<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import api from '../api'

  const router = useRouter()

  // 搜索关键词（从路由 query 或手动输入）
  const keyword = ref('')
  const searchInput = ref('')

  // 搜索结果
  const songs = ref([])
  const loading = ref(false)
  const searched = ref(false)
  const totalCount = ref(0)

  // 获取当前路由中的 keywords
  const currentRoute = computed(() => router.currentRoute?.value || {})
  const routeKeyword = computed(() => currentRoute.value.query?.keywords || '')

  // 搜索（带防抖）
  let debounceTimer = null
  const doSearch = async (kw) => {
    const q = (kw || keyword.value).trim()
    if (!q) {
      songs.value = []
      searched.value = false
      totalCount.value = 0
      return
    }

    loading.value = true
    searched.value = true
    try {
      const res = await api.get('/cloudsearch', { keywords: q, type: 1, limit: 50 })
      const result = res.result
      totalCount.value = result?.songCount || 0
      songs.value = (result?.songs || []).map((song) => ({
        id: song.id,
        name: song.name,
        artists: (song.ar || []).map((a) => a.name).join(' / '),
        album: song.al?.name || '',
        cover: song.al?.picUrl || '',
        dt: song.dt || 0,
      }))
    } catch (err) {
      console.error('搜索失败:', err)
      songs.value = []
      totalCount.value = 0
    } finally {
      loading.value = false
    }
  }

  // 输入防抖
  const onInput = () => {
    clearTimeout(debounceTimer)
    keyword.value = searchInput.value
    debounceTimer = setTimeout(() => {
      doSearch(searchInput.value)
    }, 400)
  }

  // 按回车立即搜索
  const onEnter = () => {
    clearTimeout(debounceTimer)
    keyword.value = searchInput.value
    doSearch(searchInput.value)
  }

  // 点击歌曲播放
  const playTrack = (track) => {
    if (!track.id) return
    router.push({
      name: 'player',
      query: {
        id: track.id,
        name: track.name,
        artist: track.artists,
        cover: track.cover,
      },
    })
  }

  // 格式化时长 (ms → mm:ss)
  const formatTime = (ms) => {
    if (!ms) return '--'
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // 监听路由 keywords 变化
  watch(routeKeyword, (newKw) => {
    if (newKw) {
      searchInput.value = newKw
      keyword.value = newKw
      doSearch(newKw)
    }
  })

  onMounted(() => {
    if (routeKeyword.value) {
      searchInput.value = routeKeyword.value
      keyword.value = routeKeyword.value
      doSearch(routeKeyword.value)
    }
  })
</script>

<template>
  <div class="search-page">
    <!-- 搜索栏 -->
    <div class="search-hero">
      <h2>搜索</h2>
      <div class="search-bar">
        <input
          type="text"
          v-model="searchInput"
          placeholder="搜索歌曲、歌手、专辑..."
          class="search-field"
          @input="onInput"
          @keyup.enter="onEnter"
        />
        <button class="search-btn" @click="onEnter">🔍</button>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results">
      <!-- 加载中 -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>搜索中...</p>
      </div>

      <!-- 未搜索 -->
      <div v-else-if="!searched" class="state-box">
        <div class="state-icon">🎶</div>
        <p>输入关键词，发现你喜欢的音乐</p>
      </div>

      <!-- 无结果 -->
      <div v-else-if="!songs.length" class="state-box">
        <div class="state-icon">😕</div>
        <p>未找到相关歌曲，换个关键词试试</p>
      </div>

      <!-- 歌曲列表 -->
      <template v-else>
        <div class="results-header">
          <h3>歌曲</h3>
          <span class="count">找到 {{ totalCount }} 首</span>
        </div>
        <ul class="track-list">
          <li
            v-for="(track, index) in songs"
            :key="track.id"
            class="track-item"
            @click="playTrack(track)"
          >
            <span class="track-index">{{ index + 1 }}</span>
            <div class="track-cover-box">
              <img :src="track.cover" alt="cover" class="track-cover" />
            </div>
            <div class="track-info">
              <span class="track-name">{{ track.name }}</span>
              <span class="track-artist">{{ track.artists }}</span>
            </div>
            <span class="track-time">{{ formatTime(track.dt) }}</span>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.search-page {
  min-height: calc(100vh - 64px - 64px);
}

/* ========== 搜索栏 ========== */
.search-hero {
  text-align: center;
  padding: 20px 0 28px;
}

.search-hero h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 24px;
}

.search-bar {
  display: flex;
  align-items: center;
  max-width: 520px;
  margin: 0 auto;
  background: var(--color-bg-white);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--transition);
}

.search-bar:focus-within {
  box-shadow: var(--shadow-md);
}

.search-field {
  flex: 1;
  height: 48px;
  padding: 0 20px;
  font-size: 15px;
  background: transparent;
}

.search-btn {
  width: 56px;
  height: 48px;
  background: var(--color-primary);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition);
}

.search-btn:hover {
  background: var(--color-primary-hover);
}

/* ========== 状态区域 ========== */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
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

/* ========== 结果列表 ========== */
.results-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-primary);
}

.results-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.count {
  font-size: 13px;
  color: var(--color-text-muted);
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

.track-time {
  font-size: 12px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
</style>
