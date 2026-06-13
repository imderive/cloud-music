<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import api, { clearCookie } from '../api'
  import { useUserStore } from '../stores/user'

  const router = useRouter()
  const { setLogin } = useUserStore()

  // 二维码图片 base64
  const qrImg = ref('')
  // 二维码唯一 key
  const qrKey = ref('')
  // 状态: loading | waiting | scanned | expired | success | error
  const qrStatus = ref('loading')
  // 状态提示文本
  const statusText = ref('正在生成二维码...')
  // 轮询定时器
  let pollTimer = null

  // 获取二维码
  const fetchQRCode = async () => {
    qrStatus.value = 'loading'
    statusText.value = '正在生成二维码...'
    qrImg.value = ''
    qrKey.value = ''

    // 清除旧 cookie，确保每次生成新二维码有独立的会话
    clearCookie()

    try {
      // 1. 获取二维码 key（务必带 timestamp 防止缓存）
      const ts = Date.now()
      const keyRes = await api.get('/login/qr/key', { timestamp: ts })
      qrKey.value = keyRes.data?.unikey
      if (!qrKey.value) {
        qrStatus.value = 'error'
        statusText.value = '获取二维码失败，请重试'
        return
      }

      // 2. 生成二维码图片
      const createRes = await api.get('/login/qr/create', {
        key: qrKey.value,
        platform: 'web',
        qrimg: true,
        timestamp: Date.now(),
        ua: 'pc',
      })
      qrImg.value = createRes.data?.qrimg
      if (!qrImg.value) {
        qrStatus.value = 'error'
        statusText.value = '生成二维码失败，请重试'
        return
      }

      // 3. 开始轮询扫码状态
      qrStatus.value = 'waiting'
      statusText.value = '请使用网易云音乐 App 扫码登录'
      startPolling()
    } catch (err) {
      console.error('二维码生成失败:', err)
      qrStatus.value = 'error'
      statusText.value = '网络错误，请重试'
    }
  }

  // 检查扫码状态
  const checkStatus = async () => {
    try {
      const res = await api.get('/login/qr/check', {
        key: qrKey.value,
        timestamp: Date.now(),
        ua: 'pc',
        noCookie: true,
      })
      return res
    } catch {
      return null
    }
  }

  // 轮询扫码状态
  const startPolling = () => {
    stopPolling()
    pollTimer = setInterval(async () => {
      const res = await checkStatus()
      if (!res) return

      const code = res.code

      switch (code) {
        case 801:
          // 等待扫码
          qrStatus.value = 'waiting'
          statusText.value = '请使用网易云音乐 App 扫码登录'
          break
        case 802:
          // 已扫码，等待确认
          qrStatus.value = 'scanned'
          statusText.value = '已扫码，请在手机上确认登录'
          break
        case 803: {
          // 登录成功！response.cookie 包含了登录凭证
          stopPolling()
          qrStatus.value = 'success'
          statusText.value = '登录成功！正在跳转...'

          const cookie = res.cookie || ''
          if (cookie) {
            // 持久化 cookie 到 localStorage（API 拦截器会自动读取）
            localStorage.setItem('music_cookie', cookie)
            await handleLoginSuccess(cookie)
          }
          break
        }
        case 800:
          // 二维码已过期
          stopPolling()
          qrStatus.value = 'expired'
          statusText.value = '二维码已过期，请刷新'
          break
      }
    }, 3000)
  }

  // 登录成功 → 获取用户信息
  const handleLoginSuccess = async (cookie) => {
    try {
      // POST 方式调用 /login/status，body 里传 cookie
      const res = await api.post('/login/status', { cookie }, { params: { timestamp: Date.now() } })
      const account = res.data?.account
      const profile = res.data?.profile
      if (account) {
        setLogin({
          userId: account.id,
          nickname: profile?.nickname || account.userName || '用户',
          avatarUrl: profile?.avatarUrl || '',
          signature: profile?.signature || '',
        })
        setTimeout(() => {
          router.push('/mymusic')
        }, 800)
        return
      }
    } catch (err) {
      console.error('获取登录状态失败:', err)
    }
    // fallback: 直接跳转
    setTimeout(() => {
      router.push('/mymusic')
    }, 800)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onMounted(() => {
    fetchQRCode()
  })

  onUnmounted(() => {
    stopPolling()
  })
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2>登录网易云音乐</h2>
      <p class="login-desc">使用网易云音乐 App 扫码登录</p>

      <!-- 二维码区域 -->
      <div class="qr-wrapper">
        <!-- 加载中 -->
        <div v-if="qrStatus === 'loading'" class="qr-loading">
          <div class="spinner"></div>
          <p>{{ statusText }}</p>
        </div>

        <!-- 二维码 -->
        <template v-else-if="qrStatus !== 'error'">
          <div class="qr-img-box" :class="{ expired: qrStatus === 'expired' }">
            <img v-if="qrImg" :src="qrImg" alt="登录二维码" class="qr-img" />
            <!-- 过期蒙层 -->
            <div v-if="qrStatus === 'expired'" class="qr-expired-mask" @click="fetchQRCode">
              <div class="refresh-icon">⟳</div>
              <p>二维码已过期</p>
              <p class="refresh-hint">点击刷新</p>
            </div>
            <!-- 成功蒙层 -->
            <div v-if="qrStatus === 'success'" class="qr-success-mask">
              <div class="success-icon">✓</div>
              <p>{{ statusText }}</p>
            </div>
          </div>
        </template>

        <!-- 错误状态 -->
        <div v-if="qrStatus === 'error'" class="qr-error" @click="fetchQRCode">
          <div class="error-icon">!</div>
          <p>{{ statusText }}</p>
          <p class="refresh-hint">点击重试</p>
        </div>
      </div>

      <!-- 状态提示 -->
      <p class="status-text" :class="{ scanned: qrStatus === 'scanned' }">
        <span v-if="qrStatus === 'waiting'" class="scan-icon">📱</span>
        <span v-if="qrStatus === 'scanned'" class="scan-icon">✓</span>
        {{ statusText }}
      </p>

      <p class="login-footer">
        登录即表示同意
        <a href="#">用户协议</a> 和 <a href="#">隐私政策</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px - 64px);
}

.login-card {
  width: 400px;
  padding: 48px 40px;
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  text-align: center;
}

.login-card h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.login-desc {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 32px;
}

/* ========== 二维码区域 ========== */
.qr-wrapper {
  width: 200px;
  height: 200px;
  margin: 0 auto 20px;
}

.qr-loading {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 13px;
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

.qr-img-box {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.qr-img-box.expired {
  border-color: #ddd;
}

.qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* 过期蒙层 */
.qr-expired-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.qr-expired-mask:hover {
  background: rgba(255, 255, 255, 0.85);
}

.refresh-icon {
  font-size: 32px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.qr-expired-mask p {
  font-size: 13px;
  color: var(--color-text-light);
}

.refresh-hint {
  font-size: 12px !important;
  color: var(--color-primary) !important;
  margin-top: 4px;
}

/* 成功蒙层 */
.qr-success-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.success-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #52c41a;
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.qr-success-mask p {
  font-size: 14px;
  color: var(--color-text);
}

/* 错误状态 */
.qr-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #ffccc7;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: #fff2f0;
}

.qr-error:hover {
  background: #ffebe8;
}

.error-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.qr-error p {
  font-size: 13px;
  color: var(--color-primary);
}

/* 状态文字 */
.status-text {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.status-text.scanned {
  color: var(--color-primary);
  font-weight: 500;
}

.scan-icon {
  margin-right: 6px;
}

/* 底部 */
.login-footer {
  font-size: 12px;
  color: var(--color-text-muted);
}

.login-footer a {
  color: var(--color-primary);
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>
