<script setup>
  import {ref, computed, onMounted, onUnmounted} from 'vue'
  import { useRouter } from 'vue-router'
  import api from '../api'

  const router = useRouter()
  // 推荐歌单
  const playList = ref([])
  const fetchPlayList = async () => {
    try{
      const res = await api.get('/personalized', {limit: 5})
      playList.value = (res.result || []).map(item => ({
        id: item.id,
        name: item.name,
        coverImgUrl: item.picUrl,
        copywriter: item.copywriter || ''
    }))
    }catch(err){
      console.error('Failed to fetch playlist:', err)
    }
  }

  //推荐新音乐
  const newSongs = ref([])
  const fetchNewSongs = async () => {
    try{
      const res = await api.get('/personalized/newsong')
      newSongs.value = (res.result || []).map(item => ({
        id: item.id,
        name: item.name,
        coverImgUrl: item.picUrl,
        artists: item.artists?.map(a => a.name).join(', ') || ''
      }))
    }catch(err){
      console.error('Failed to fetch new songs:', err)
    }
  }

  //歌手榜单
  const topArtists = ref([])
  const fetchTopArtists = async () => {
    try{
      const res = await api.get('/top/artists', {limit: 20})
      topArtists.value = (res.artists || []).map((artist, index) => ({
        id: artist.id,
        name: artist.name,
        img: artist.picUrl,
        rank: index + 1
      }))
      // console.log('Top artists:', topArtists.value)
    }catch(err){
      console.error('Failed to fetch top artists:', err)
    }
  }

  // 歌手轮播
  const ARTIST_PER_PAGE = 5
  const artistPage = ref(0)
  let artistTimer = null

  const artistPages = computed(() => {
    const pages = []
    for (let i = 0; i < topArtists.value.length; i += ARTIST_PER_PAGE) {
      pages.push(topArtists.value.slice(i, i + ARTIST_PER_PAGE))
    }
    return pages
  })

  const artistTotal = computed(() => artistPages.value.length)

  const toArtistPage = (p) => {
    if (p < 0) artistPage.value = artistTotal.value - 1
    else if (p >= artistTotal.value) artistPage.value = 0
    else artistPage.value = p
    resetArtistTimer()
  }

  const prevArtist = () => toArtistPage(artistPage.value - 1)
  const nextArtist = () => toArtistPage(artistPage.value + 1)

  const startArtistTimer = () => {
    artistTimer = setInterval(() => nextArtist(), 4000)
  }

  const resetArtistTimer = () => {
    clearInterval(artistTimer)
    startArtistTimer()
  }

  // 点击歌单跳转到歌单详情页
  const pushMusicList = (id) => {
    // console.log('跳转歌单详情，id=', id)
    // 这里可以使用路由导航到歌单详情页
    if(!id) return
    router.push({
      name: 'musiclist',
      query: { id }
    })
  }

  // 点击新歌 → 跳转播放页
  const playNewSong = (song) => {
    if (!song || !song.id) return
    router.push({
      name: 'player',
      query: {
        id: song.id,
        name: song.name,
        artist: song.artists,
        cover: song.coverImgUrl || ''
      },
    })
  }

  // 点击歌手 → 跳转搜索页
  const goArtist = (artist) => {
    if (!artist || !artist.name) return
    router.push({
      name: 'search',
      query: { keywords: artist.name },
    })
  }

  onMounted(() => {
    fetchPlayList()
    fetchNewSongs()
    fetchTopArtists()
    startArtistTimer()
  })

  onUnmounted(() => {
    clearInterval(artistTimer)
  })
</script>

<template>
  <!-- 推荐歌单 -->
  <div class="music-hall">
    <h2>推荐歌单</h2>
    <div class="playlist">
      <div 
      v-for="item in playList" 
      :key="item.id" 
      class="playlist-item"
      @click="pushMusicList(item.id)"
      >
        <img :src="item.coverImgUrl" alt="cover" class="cover"/>
        <div class="info">
          <h3>{{ item.name }}</h3>
          <p>{{ item.copywriter }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 推荐新音乐 -->
  <div class="newsong-section">
    <div class="newsong-header">
      <h2>推荐新音乐</h2>
      <button class="play-all-btn">▶ 播放全部</button>
    </div>
    <ul class="newsong-list">
      <li v-for="(song, index) in newSongs" :key="song.id" class="newsong-item" @click="playNewSong(song)">
        <span class="song-index">{{ index + 1 }}</span>
        <div class="song-cover-wrap">
          <img :src="song.coverImgUrl" alt="cover" class="song-cover" />
          <button class="cover-play-btn">▶</button>
        </div>
        <div class="song-info">
          <span class="song-name">{{ song.name }}</span>
          <span class="song-artist">{{ song.artists }}</span>
        </div>
        <button class="item-play-btn">▶</button>
      </li>
    </ul>
  </div>

  <!-- 歌手榜单 - 轮播 -->
  <div class="artist-wrap" style="margin-top: 48px;">
    <div class="artist-header">
      <h2>歌手榜单</h2>
      <div class="artist-ctrls">
        <button class="ctrl-arrow" @click="prevArtist">‹</button>
        <span class="ctrl-num">{{ artistPage + 1 }} / {{ artistTotal }}</span>
        <button class="ctrl-arrow" @click="nextArtist">›</button>
      </div>
    </div>
    <div class="artist-viewport">
      <div class="artist-track" :style="{ transform: `translateX(-${artistPage * 100}%)` }">
        <div v-for="(page, idx) in artistPages" :key="idx" class="artist-page">
          <div v-for="artist in page" :key="artist.id" class="artist-card" @click="goArtist(artist)">
            <div class="artist-img-box">
              <img :src="artist.img" :alt="artist.name" class="artist-img" />
              <span class="artist-badge">{{ artist.rank }}</span>
            </div>
            <p class="artist-name">{{ artist.name }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="artist-dots">
      <span
        v-for="(_, idx) in artistTotal"
        :key="idx"
        :class="['artist-dot', { on: idx === artistPage }]"
        @click="toArtistPage(idx)"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.music-hall {
  padding: 8px 0;
}

.music-hall h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-primary);
  display: inline-block;
}

.playlist {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.playlist-item {
  width: 200px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-bg-white);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
  cursor: pointer;
}

.playlist-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.playlist-item:hover .cover {
  transform: scale(1.06);
}

.info {
  padding: 14px 12px;
}

.info h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 6px;
  /* 单行溢出省略 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info p {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
  /* 两行溢出省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ========== 推荐新音乐 - 列表布局 ========== */
.newsong-section {
  margin-top: 48px;
  padding: 8px 0;
}

.newsong-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-primary);
}

.newsong-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.play-all-btn {
  padding: 8px 20px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  transition: background var(--transition);
}

.play-all-btn:hover {
  background: var(--color-primary-hover);
}

.newsong-list {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.newsong-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  transition: background 0.15s ease;
}

.newsong-item:nth-child(even) {
  background: #fafafa;
}

.newsong-item:hover {
  background: #f0f0f0;
}

.newsong-item:hover .cover-play-btn {
  opacity: 1;
}

.newsong-item:hover .item-play-btn {
  opacity: 1;
}

.song-index {
  width: 28px;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.newsong-item:nth-child(-n+3) .song-index {
  color: var(--color-primary);
  font-weight: 600;
}

.song-cover-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
}

.song-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-play-btn {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  font-size: 12px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-play-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  color: var(--color-primary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s ease;
  border: 1px solid var(--color-primary);
}

.item-play-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

/* ========== 歌手榜单 - 轮播 ========== */
.artist-wrap {
  padding: 8px 0;
}

.artist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-primary);
}

.artist-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  padding: 0;
  border: none;
}

.artist-ctrls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-arrow {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-bg-white);
  border: 1px solid var(--color-border);
  font-size: 18px;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition);
  line-height: 1;
}

.ctrl-arrow:hover {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.ctrl-num {
  font-size: 13px;
  color: var(--color-text-muted);
  min-width: 44px;
  text-align: center;
}

/* 视口 */
.artist-viewport {
  overflow: hidden;
  border-radius: var(--radius-md);
}

.artist-track {
  display: flex;
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.artist-page {
  display: flex;
  gap: 24px;
  min-width: 100%;
  justify-content: center;
}

/* 卡片 */
.artist-card {
  width: 160px;
  text-align: center;
  flex-shrink: 0;
}

.artist-img-box {
  position: relative;
  width: 130px;
  height: 130px;
  margin: 0 auto 10px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition);
}

.artist-card:hover .artist-img-box {
  box-shadow: var(--shadow-md);
}

.artist-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.artist-card:hover .artist-img {
  transform: scale(1.08);
}

.artist-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(74, 144, 217, 0.4);
}

.artist-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 指示器 */
.artist-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
}

.artist-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border);
  cursor: pointer;
  transition: all var(--transition);
}

.artist-dot:hover {
  background: #bbb;
}

.artist-dot.on {
  width: 24px;
  border-radius: 5px;
  background: var(--color-primary);
}
</style>