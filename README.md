# 时雨云音乐

基于 Vue 3 + Vite 构建的网易云音乐第三方客户端，支持音乐发现、扫码登录、在线播放与歌单管理。

## 功能

- **推荐歌单** — 首页展示个性化推荐歌单，点击查看详情与曲目列表
- **推荐新音乐** — 最新歌曲推荐，支持快速播放
- **歌手榜单** — 热门歌手轮播展示，点击跳转搜索
- **歌曲搜索** — 搜索歌曲、歌手、专辑，支持防抖输入
- **在线播放** — 歌曲播放页面，含进度条控制与 LRC 歌词同步显示
- **扫码登录** — 网易云音乐 App 扫码登录，同步个人歌单数据
- **我的音乐** — 查看已创建 / 收藏的歌单，分类筛选

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 构建 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router (懒加载) |
| HTTP | Axios (拦截器自动处理 Cookie) |
| 图标 | Emoji |

## 项目结构

```
src/
├── api/index.js          # Axios 封装、Cookie 管理
├── assets/
│   ├── css/reset.css     # 全局样式与 CSS 变量
│   └── imgs/logo.jpg     # Logo 图片
├── router/index.js       # 路由配置
├── stores/user.js        # Pinia 用户状态管理
├── views/
│   ├── MusicHall.vue     # 首页 — 推荐歌单 / 新音乐 / 歌手榜单
│   ├── Search.vue        # 搜索页
│   ├── Player.vue        # 播放器页（含歌词）
│   ├── MusicList.vue     # 歌单详情页
│   ├── MyMusic.vue       # 我的音乐页
│   └── Login.vue         # 扫码登录页
├── App.vue               # 根组件 — 导航栏 + 路由视图
└── main.js               # 应用入口
```

## 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- pnpm

### 安装依赖

```sh
pnpm install
```

### 启动开发服务器

```sh
pnpm dev
```

开发服务器默认运行在 `http://localhost:5173`，需要后端 API 代理在 `http://localhost:3000`（见下方说明）。

### 构建生产版本

```sh
pnpm build
```

产物输出到 `dist/` 目录。

### 预览生产构建

```sh
pnpm preview
```

## 后端 API

本项目依赖网易云音乐 API 代理服务，默认地址为 `http://localhost:3000`。推荐使用 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) 搭建本地服务。

启动 API 服务后，前端即可正常请求数据。

## 部署

项目已配置 `vercel.json`，可直接部署到 Vercel：

- 构建命令：`npm run build`
- 输出目录：`dist`
- SPA 路由重写已配置

## License

仅用于学习交流，请勿用于商业用途。
