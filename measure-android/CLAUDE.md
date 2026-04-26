# 邦和量尺 - Android 原生应用

## 项目状态

- **阶段 1（项目基础）**: 已完成 ✅
- **阶段 2（核心页面）**: 已完成 ✅ - 50 个 Kotlin 文件
- **阶段 3（量尺向导）**: 待开始
- **阶段 4（业务模块）**: 待开始
- **阶段 5（原生能力）**: 待开始

## 技术栈

- Kotlin + Jetpack Compose
- Retrofit + OkHttp (网络)
- Room (本地数据库)
- ViewModel + StateFlow (状态管理)
- Navigation Compose (路由)
- DataStore (偏好设置)
- Coil (图片加载)
- Moshi (JSON 解析)

## 工程结构

```
measure-android/
├── core/           # 基础设施：网络、数据库、存储、主题、导航
├── data/           # 数据层：API 接口、Repository 实现
│   ├── auth/       # 认证：登录、Token 管理
│   ├── dashboard/  # 工作台：统计数据
│   ├── task/       # 任务：工单列表、详情
│   └── notification/ # 消息通知
├── domain/         # 业务逻辑：数据模型
├── presentation/   # UI 层：Compose 页面
│   ├── splash/     # 闪屏页
│   ├── login/      # 登录页（密码+短信）
│   ├── admin/      # 管理首页（4 Tab）
│   ├── worker/     # 外勤首页（3 Tab+FAB）
│   ├── dashboard/  # 工作台（统计卡片+快捷操作）
│   ├── tasks/      # 任务列表+工单详情
│   ├── notification/ # 消息列表
│   ├── profile/    # 个人中心
│   └── common/     # 通用组件
├── utils/          # 工具类
└── app/            # Android 配置
```

## 架构

MVVM + Repository 模式：
```
UI (Compose) -> ViewModel -> Repository -> API / Room
```

## 已实现功能

### 认证流程
- 闪屏页（自动检测登录状态）
- 登录页（密码登录 + 短信验证码登录）
- JWT Token 自动拦截 + 401 自动跳登录页

### 核心页面
- 管理首页（首页、任务、消息、我的）
- 外勤首页（我的任务、消息、我的 + 新建量尺 FAB）
- 工作台（统计卡片：待处理/进行中/已完成/已逾期 + 工单总数 + 快捷操作）
- 任务列表（搜索、筛选、分页、卡片展示）
- 工单详情页（基本信息、客户信息、地址、时间）
- 消息列表（未读标记、一键全部已读）
- 个人中心（头像、用户名、角色、手机号、退出登录）

### 数据层
- DashboardRepository（统计数据 API）
- TaskRepository（工单列表 + 本地缓存）
- NotificationRepository（消息通知）
- AuthRepository（登录 + Token 管理）

## 构建

```bash
./gradlew assembleDebug    # 构建 debug APK
./gradlew installDebug     # 安装到设备
```

## API 地址

后端地址：`https://www.fsbhgg.com`
API 前缀：`/api/v1`

## 下一步：阶段 3

量尺向导（核心业务功能）：
- 多步骤向导容器
- 基本信息（天气、施工条件、高空作业等）
- 材料测量（添加材料、多个面、尺寸、照片）
- 签名确认
- 照片上传 + 水印
- 离线同步队列