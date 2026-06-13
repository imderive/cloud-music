<script setup>
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import api from '../api'

  const router = useRouter()

  // 路由信息
  const currentRoute = computed(() => router?.currentRoute?.value || {})
  const songId = computed(() => currentRoute.value.query?.id)
  const songName = computed(() => currentRoute.value.query?.name || '未知歌曲')
  const songArtist = computed(() => currentRoute.value.query?.artist || '未知歌手')
  const songCover = computed(() => currentRoute.value.query?.cover || '')

  // 播放状态
  const audio = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const songUrl = ref('')
  const loading = ref(false)
  const error = ref('')

  // 歌词
  const lyrics = ref([])       // [{time, text}]
  const hasLyric = ref(false)  // 是否有歌词（而非纯音乐等）
  const lyricLoading = ref(false)
  const currentLyricIndex = ref(-1)
  const lyricContainer = ref(null)

  // 进度百分比
  const progress = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })

  // 格式化时间
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // ========== 解析 LRC 歌词 ==========
  const parseLRC = (lrcText) => {
    if (!lrcText) return []
    const lines = lrcText.split('\n')
    const result = []

    for (const line of lines) {
      // 匹配 [mm:ss.xx] 或 [mm:ss]
      const match = line.match(/^\[(\d{2}):(\d{2})[.:]?(\d{0,3})\](.*)/)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0
        const time = minutes * 60 + seconds + ms / 1000
        const text = (match[4] || '').trim()
        if (text) {
          result.push({ time, text })
        }
      }
    }

    // 按时间排序
    result.sort((a, b) => a.time - b.time)
    return result
  }

  // 获取歌词
  const fetchLyric = async (id) => {
    lyricLoading.value = true
    lyrics.value = []
    hasLyric.value = false
    try {
      const res = await api.get('/lyric', { id })
      const lrc = res.lrc?.lyric || ''
      // 纯音乐 v1 版本没有歌词
      if (!lrc || lrc.includes('纯音乐')) {
        hasLyric.value = false
        return
      }
      const parsed = parseLRC(lrc)
      if (parsed.length > 0) {
        lyrics.value = parsed
        hasLyric.value = true
      }
    } catch {
      hasLyric.value = false
    } finally {
      lyricLoading.value = false
    }
  }

  // ========== 获取歌曲并播放 ==========
  const fetchAndPlay = async () => {
    const id = songId.value
    if (!id) {
      error.value = '未指定歌曲 ID'
      return
    }

    loading.value = true
    error.value = ''
    songUrl.value = ''

    // 同时获取歌词
    fetchLyric(id)

    try {
      const res = await api.get('/song/url', { id })
      const data = res.data?.[0]
      if (!data || !data.url) {
        error.value = '暂无播放资源'
        return
      }
      songUrl.value = data.url

      // 创建 audio
      if (audio.value) {
        audio.value.pause()
        audio.value.src = ''
      }

      const el = new Audio(data.url)
      el.addEventListener('loadedmetadata', () => {
        duration.value = el.duration
      })
      el.addEventListener('timeupdate', () => {
        currentTime.value = el.currentTime
        updateCurrentLyric(el.currentTime)
      })
      el.addEventListener('play', () => { isPlaying.value = true })
      el.addEventListener('pause', () => { isPlaying.value = false })
      el.addEventListener('ended', () => { isPlaying.value = false })
      el.addEventListener('error', () => {
        error.value = '播放失败，请稍后重试'
        isPlaying.value = false
      })

      audio.value = el
      el.play().catch(() => {
        error.value = '播放失败，请稍后重试'
        isPlaying.value = false
      })
    } catch (err) {
      console.error('获取歌曲 URL 失败:', err)
      error.value = '获取播放地址失败'
    } finally {
      loading.value = false
    }
  }

  // 根据当前播放时间找到对应歌词行
  const updateCurrentLyric = (time) => {
    if (!lyrics.value.length) return
    let index = -1
    for (let i = 0; i < lyrics.value.length; i++) {
      if (lyrics.value[i].time <= time) {
        index = i
      } else {
        break
      }
    }
    if (index !== currentLyricIndex.value) {
      currentLyricIndex.value = index
      scrollLyricToCurrent()
    }
  }

  // 滚动歌词到当前行
  const scrollLyricToCurrent = () => {
    nextTick(() => {
      if (!lyricContainer.value) return
      const activeEl = lyricContainer.value.querySelector('.lyric-line.active')
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  // ========== 控制 ==========
  const togglePlay = () => {
    if (!audio.value) return
    if (isPlaying.value) {
      audio.value.pause()
    } else {
      audio.value.play()
    }
  }

  const seekTo = (e) => {
    if (!audio.value || !duration.value) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.value.currentTime = pct * duration.value
  }

  // 点击歌词跳转
  const seekToLyric = (time) => {
    if (!audio.value) return
    audio.value.currentTime = time
  }

  const goBack = () => {
    router.back()
  }

  // ========== 生命周期 ==========
  watch(() => currentRoute.value.query?.id, (newId) => {
    if (newId) fetchAndPlay()
  })

  onMounted(() => {
    if (songId.value) fetchAndPlay()
  })

  onUnmounted(() => {
    if (audio.value) {
      audio.value.pause()
      audio.value.src = ''
      audio.value = null
    }
  })
</script>

<template>
  <div class="player-page">
    <!-- 返回 -->
    <button class="back-btn" @click="goBack">← 返回</button>

    <!-- 加载中 -->
    <div v-if="loading" class="state-center">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="state-center">
      <p class="error-text">{{ error }}</p>
      <button class="btn-outline" @click="goBack">返回</button>
    </div>

    <!-- 播放器 -->
    <div v-else class="player-layout" :class="{ 'has-lyric': hasLyric }">
      <!-- 左侧：封面 + 信息 + 控制 -->
      <div class="player-main">
        <div class="cover-area">
          <div v-if="songCover" class="cover-wrap" :class="{ spinning: isPlaying }">
            <img :src="songCover" :alt="songName" class="cover-img" />
          </div>
          <div v-else class="cover-placeholder">🎧</div>
        </div>

        <div class="song-info">
          <h3>{{ songName }}</h3>
          <p>{{ songArtist }}</p>
        </div>

        <!-- 控制按钮 -->
        <div class="player-controls">
          <button class="ctrl-btn play-btn" :disabled="!songUrl" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶️' }}
          </button>
        </div>

        <!-- 进度条 -->
        <div class="progress-wrap">
          <div class="progress-bar" @click="seekTo">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="progress-time">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：歌词 -->
      <div v-if="hasLyric" class="player-lyric" ref="lyricContainer">
        <div v-if="lyricLoading" class="lyric-loading">歌词加载中...</div>
        <template v-else>
          <div
            v-for="(line, idx) in lyrics"
            :key="idx"
            class="lyric-line"
            :class="{ active: idx === currentLyricIndex }"
            @click="seekToLyric(line.time)"
          >
            {{ line.text }}
          </div>
          <div
            v-if="!lyrics.length"
            class="lyric-line"
          >
            暂无歌词
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-page {
  min-height: calc(100vh - 64px - 64px);
  padding-bottom: 40px;
}

/* ========== 返回 ========== */
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

/* ========== 加载 / 错误 ========== */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.state-center p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 12px;
}

.error-text {
  color: var(--color-primary) !important;
}

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

.btn-outline {
  margin-top: 16px;
  padding: 8px 24px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: transparent;
  font-size: 13px;
  transition: all var(--transition);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: #fff;
}

/* ========== 播放器布局 ========== */
.player-layout {
  display: flex;
  gap: 40px;
  justify-content: center;
  align-items: flex-start;
}

.player-layout.has-lyric {
  justify-content: center;
  max-width: 900px;
  margin: 0 auto;
}

/* 左侧主区域 */
.player-main {
  width: 380px;
  flex-shrink: 0;
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 40px 36px;
  text-align: center;
}

/* 封面 */
.cover-area {
  margin-bottom: 24px;
}

.cover-placeholder {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
}

.cover-wrap {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.cover-wrap.spinning {
  animation: spin 20s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 歌曲信息 */
.song-info {
  margin-bottom: 24px;
}

.song-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-info p {
  font-size: 14px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 控制 */
.player-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.ctrl-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-bg);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ctrl-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.play-btn {
  width: 60px;
  height: 60px;
  background: var(--color-primary);
  font-size: 24px;
}

.play-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

/* 进度条 */
.progress-wrap {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 5px;
  border-radius: 3px;
  background: var(--color-border);
  overflow: hidden;
  cursor: pointer;
}

.progress-fill {
  width: 0%;
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.15s linear;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ========== 歌词面板 ========== */
.player-lyric {
  flex: 1;
  min-width: 0;
  max-height: 480px;
  overflow-y: auto;
  padding: 20px 0;
  /* 隐藏滚动条但可滚动 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.player-lyric::-webkit-scrollbar {
  display: none;
}

.lyric-loading {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
  padding-top: 100px;
}

.lyric-line {
  padding: 8px 16px;
  font-size: 15px;
  color: var(--color-text-muted);
  line-height: 1.8;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  text-align: center;
}

.lyric-line:hover {
  color: var(--color-text);
}

.lyric-line.active {
  color: var(--color-primary);
  font-size: 18px;
  font-weight: 600;
}
</style>
