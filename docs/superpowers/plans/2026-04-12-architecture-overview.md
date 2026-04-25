# 广告工程全流程系统 - 总架构与阶段规划

> **面向 AI 代理的工作者：** 本项目拆分为 6 个独立子计划，按依赖顺序执行。
> 每个子计划产出独立可测试的软件单元。
> 使用 superpowers:subagent-driven-development 逐任务实现。

**目标：** 构建一套 SaaS 化广告工程全流程管理系统，支持多租户、多端访问

**架构：** 三端（甲方端/广告商端/平台端）+ 共享后端 API + MySQL 多租户逻辑隔离

**技术栈：** Express.js + MySQL + Sequelize + Vue3 + Element Plus + Flutter + 微信小程序

---

## 子计划索引

| # | 计划 | 文件 | 依赖 | 说明 |
|---|------|------|------|------|
| 1 | 后端 API | `2026-04-12-backend-api.md` | 无 | 核心基础，所有前端依赖 |
| 2 | 广告商后台 | `2026-04-12-admin-web.md` | 1 | Vue3 管理后台 |
| 3 | 甲方 Web 端 | `2026-04-12-client-web.md` | 1 | Vue3 领导/管理端（审批+管理） |
| 4 | 甲方小程序 | `2026-04-12-client-miniapp.md` | 1 | 微信原生，业务员申报端 |
| 5 | 超级管理后台 | `2026-04-12-super-admin.md` | 1 | 平台监管端 |
| 6 | 测量 APP | `2026-04-12-measure-app.md` | 1 | Flutter 测量/施工端 |

---

## 项目目录结构

```
├── backend/                    # 后端 API (Express.js)
│   ├── src/
│   │   ├── app.js              # 入口
│   │   ├── config/             # 配置
│   │   │   └── database.js
│   │   ├── models/             # Sequelize 模型
│   │   ├── middleware/          # 中间件
│   │   ├── routes/             # 路由定义
│   │   ├── controllers/        # 控制器
│   │   ├── services/           # 业务逻辑
│   │   └── utils/              # 工具函数
│   ├── migrations/             # 数据库迁移
│   ├── seeders/                # 种子数据
│   ├── tests/                  # 测试
│   └── uploads/                # 文件存储
├── admin-web/                  # 广告商后台 (Vue3)
├── client-web/                 # 甲方 Web 端 (Vue3)
├── super-admin/                # 超级管理后台 (Vue3)
├── client-miniapp/             # 甲方小程序
└── measure-app/                # 测量 APP (Flutter)
```
