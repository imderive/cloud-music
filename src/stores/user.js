import { reactive } from 'vue'
import api from '../api'

// 全局用户状态
const state = reactive({
  isLoggedIn: !!localStorage.getItem('music_uid'),
  profile: JSON.parse(localStorage.getItem('music_profile') || 'null'),
  // profile: { userId, nickname, avatarUrl, signature }
})

export function useUserStore() {
  // 检查登录状态
  const checkLogin = async () => {
    try {
      const res = await api.get('/login/status')
      if (res.data?.account) {
        const account = res.data.account
        const profile = res.data.profile || {}
        const user = {
          userId: account.id,
          nickname: profile.nickname || account.userName || '用户',
          avatarUrl: profile.avatarUrl || '',
          signature: profile.signature || '',
        }
        state.profile = user
        state.isLoggedIn = true
        localStorage.setItem('music_uid', String(user.userId))
        localStorage.setItem('music_profile', JSON.stringify(user))
        return user
      }
    } catch {
      // 未登录或请求失败
    }
    state.isLoggedIn = false
    state.profile = null
    return null
  }

  // 登录成功后保存用户信息
  const setLogin = (profile) => {
    const user = {
      userId: profile.userId || profile.account?.id,
      nickname: profile.nickname || profile.account?.userName || '用户',
      avatarUrl: profile.avatarUrl || '',
      signature: profile.signature || '',
    }
    state.profile = user
    state.isLoggedIn = true
    localStorage.setItem('music_uid', String(user.userId))
    localStorage.setItem('music_profile', JSON.stringify(user))
  }

  // 退出登录
  const logout = async () => {
    try {
      await api.get('/logout')
    } catch {
      // ignore
    }
    state.isLoggedIn = false
    state.profile = null
    localStorage.removeItem('music_uid')
    localStorage.removeItem('music_profile')
    localStorage.removeItem('music_cookie')
  }

  // 获取已收藏的歌单列表（创建 + 收藏）
  const fetchUserPlaylists = async () => {
    if (!state.profile?.userId) return []
    try {
      const res = await api.get('/user/playlist', { uid: state.profile.userId })
      return res.playlist || []
    } catch {
      return []
    }
  }

  // 获取用户详情
  const fetchUserDetail = async () => {
    if (!state.profile?.userId) return null
    try {
      const res = await api.get('/user/detail', { uid: state.profile.userId })
      return res
    } catch {
      return null
    }
  }

  return { state, checkLogin, setLogin, logout, fetchUserPlaylists, fetchUserDetail }
}
