# MYTODO - 任务管理应用

一个功能强大的任务管理应用，使用 React + TypeScript + Vite 构建，帮助用户高效管理日常任务。

## 功能特性

- ✅ 任务管理：创建、编辑、删除和完成任务
- ✅ 任务分类：按不同类别组织任务
- ✅ 语音输入：支持通过语音创建任务
- ✅ 数据可视化：任务完成情况统计和分析
- ✅ 响应式设计：适配不同屏幕尺寸
- ✅ 本地存储：任务数据持久化

## 技术栈

- **前端框架**：React 19.2.0
- **开发语言**：TypeScript
- **构建工具**：Vite 7.3.1
- **状态管理**：React Context API
- **样式方案**：CSS
- **API 服务**：模拟 API

## 安装和运行

### 前提条件

- Node.js 18.0 或更高版本
- npm 或 yarn

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/Abird64/MYTODO.git
cd MYTODO
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器

```bash
npm run dev
```

4. 构建生产版本

```bash
npm run build
```

5. 预览生产版本

```bash
npm run preview
```

## 项目结构

```
MYTODO/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 组件
│   │   ├── Dashboard.tsx        # 仪表盘组件
│   │   ├── Settings.tsx         # 设置组件
│   │   ├── TaskManager.tsx      # 任务管理组件
│   │   └── VoiceInputButton.tsx # 语音输入按钮组件
│   ├── services/        # API 服务
│   ├── store/           # 状态管理
│   ├── types/           # 类型定义
│   ├── utils/           # 工具函数
│   ├── App.tsx          # 应用主组件
│   └── main.tsx         # 应用入口
├── public/              # 公共文件
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## 使用说明

### 创建任务

1. 在任务管理界面点击 "添加任务" 按钮
2. 输入任务标题和描述
3. 选择任务分类和截止日期
4. 点击 "保存" 按钮

### 语音输入

1. 点击麦克风图标
2. 说出任务内容，例如："明天上午 10 点开会"
3. 系统会自动识别并创建任务

### 管理任务

- **编辑任务**：点击任务卡片上的编辑按钮
- **完成任务**：点击任务卡片上的复选框
- **删除任务**：点击任务卡片上的删除按钮
- **筛选任务**：使用顶部的筛选器按状态或分类筛选任务

### 数据统计

在仪表盘界面查看任务完成情况的统计数据和图表。

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目链接：[https://github.com/Abird64/MYTODO](https://github.com/Abird64/MYTODO)

---

**享受高效的任务管理体验！** 🎯