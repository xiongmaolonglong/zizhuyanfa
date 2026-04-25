# 广告工程全流程管理系统

## 技术栈

### 前端 (admin-web, client-web, super-admin)
- Vue 3 + Composition API
- Element Plus UI 组件库
- Vite 构建工具
- Pinia 状态管理
- Vue Router 路由
- ECharts 图表

### 后端 (backend)
- Node.js + Express
- Sequelize ORM
- MySQL 数据库
- JWT 认证

## 开发命令

```bash
# 前端开发
cd admin-web && npm run dev

# 后端开发
cd backend && npm run dev

# 运行测试
cd backend && npm test
```

## 代码规范

- 使用 ESLint 进行代码检查
- 提交前确保代码通过 lint 检查
- 遵循 Vue 3 Composition API 最佳实践

## ECC 自动功能

此项目已启用 ECC (everything-claude-code) 自动化功能：

- **编辑代码后**: 自动检查代码质量
- **运行构建后**: 自动分析构建结果
- **提交代码前**: 自动检查代码规范
- **会话开始**: 自动加载项目上下文
