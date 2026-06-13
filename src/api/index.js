import axios from 'axios'

const request = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 15000,
  withCredentials: true, // 跨域携带 Cookie
})

// Cookie 解析辅助函数
const parseSetCookie = (setCookieHeader) => {
  if (!setCookieHeader) return null
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  for (const c of cookies) {
    const match = c.match(/^(MUSIC_U=[^;]+)/)
    if (match) return match[1]
  }
  return null
}

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 读取持久化 cookie，作为 query 参数传给后端
    const cookie = localStorage.getItem('music_cookie')
    if (cookie) {
      // 合并到 params 中（后端用 query.cookie 读取）
      config.params = { ...config.params, cookie }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 从 Set-Cookie 头中提取 MUSIC_U 并持久化
    const setCookie = response.headers['set-cookie']
    if (setCookie) {
      const cookie = parseSetCookie(setCookie)
      if (cookie) {
        localStorage.setItem('music_cookie', cookie)
      }
    }
    return response.data
  },
  (error) => {
    // 登录接口 800/801/802 也会走到 error，但要保留 cookie
    if (error.response) {
      const setCookie = error.response.headers['set-cookie']
      if (setCookie) {
        const cookie = parseSetCookie(setCookie)
        if (cookie) {
          localStorage.setItem('music_cookie', cookie)
        }
      }
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  }
)

// GET/POST 封装
export function get(url, params, config = {}) {
  return request.get(url, { params, ...config })
}

export function post(url, data, config = {}) {
  return request.post(url, data, config)
}

// 导出用于手动管理 cookie 的函数
export function clearCookie() {
  localStorage.removeItem('music_cookie')
}

export default { get, post, clearCookie }
