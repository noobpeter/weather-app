# ATMOS° — 大气观测站

<p align="center">
  <img src="https://img.shields.io/badge/design-cyberpunk-%2300f5d4?style=flat-square&colorA=0a0a0f&colorB=00f5d4" alt="Design" />
  <img src="https://img.shields.io/badge/api-wttr.in-%238338ec?style=flat-square&colorA=0a0a0f&colorB=8338ec" alt="API" />
  <img src="https://img.shields.io/badge/license-MIT-%23ff006e?style=flat-square&colorA=0a0a0f&colorB=ff006e" alt="License" />
</p>

<p align="center">
  <strong>一款赛博朋克风格的现代天气观测应用</strong><br>
  融合玻璃拟态设计、动态霓虹效果与实时大气数据
</p>

![ATMOS Preview](screenshot.png)

---

## ✨ 设计特色

### 视觉风格
- **赛博朋克美学** — 深色背景配合霓虹青(#00f5d4)、粉(#ff006e)、紫(#8338ec)点缀
- **玻璃拟态界面** — 半透明卡片配合 backdrop-filter 模糊效果
- **动态背景** — 浮动渐变光晕 + 噪点纹理增加质感
- **非对称布局** — 打破常规的网格设计

### 交互细节
- 流畅的 CSS 动画与微交互
- 加载状态 Spinner 动画
- 卡片悬停效果与边框高亮
- 天气图标浮动动画

### 字体搭配
- **Space Grotesk** — 现代几何无衬线字体，用于标题和正文
- **JetBrains Mono** — 等宽字体，用于数据和标签

---

## 🚀 功能特性

| 功能 | 描述 |
|------|------|
| 🌍 **全球城市查询** | 支持中英文城市名称搜索 |
| 🌡️ **实时天气数据** | 温度、体感温度、湿度、风速、气压、能见度、紫外线 |
| 📅 **3日预报** | 未来三天天气趋势 |
| 🎨 **动态天气图标** | 根据天气状况自动匹配 emoji 图标 |
| 📱 **响应式设计** | 完美适配桌面端和移动端 |
| ⚡ **零配置使用** | 无需 API Key，完全免费 |

---

## 🛠️ 技术栈

- **HTML5** — 语义化结构
- **CSS3** — 
  - CSS Variables 主题系统
  - Flexbox + Grid 布局
  - Backdrop-filter 玻璃效果
  - CSS Animations 动画
- **Vanilla JavaScript** — ES6+，无框架依赖
- **wttr.in API** — 免费天气数据源

---

## 📦 安装与使用

⚠️ **重要提示**：直接双击打开 `index.html` 无法正常使用，因为浏览器安全策略会阻止本地文件访问 API。请使用以下方式运行：

### ⚡ 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/noobpeter/weather-app.git

# 2. 进入目录
cd weather-app

# 3. 启动本地服务器
python3 -m http.server 8080

# 4. 浏览器访问
open http://localhost:8080
```

### 其他启动方式

**Node.js:**
```bash
npx serve .
# 或
npx http-server -p 8080
```

**VS Code:**
1. 安装 **Live Server** 扩展
2. 右键点击 `index.html` → "Open with Live Server"

---

## ❓ 常见问题

### Q: 为什么直接打开 HTML 文件无法使用？
**A**: 浏览器安全策略（CORS）阻止本地文件访问外部 API。必须使用本地服务器运行。

### Q: 支持哪些浏览器？
**A**: 
- ✅ Chrome / Edge (推荐)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE 不支持

### Q: 数据从哪里来？需要 API Key 吗？
**A**: 使用 [wttr.in](https://wttr.in) 提供的免费天气 API，**完全免费，无需注册**。

### Q: 为什么有时候查询会失败？
**A**: 
- 网络连接问题
- wttr.in 服务暂时不可用
- 输入的城市名称不正确

请检查拼写或稍后重试。

---

## 🌟 项目结构

```
weather-app/
├── index.html          # 主页面
├── script.js           # 交互逻辑
├── README.md           # 项目文档
└── screenshot.png      # 预览图（可选）
```

---

## 🎮 使用指南

1. 在搜索框输入城市名称（如：**北京**、**Shanghai**、**Tokyo**、**London**）
2. 点击「观测」按钮或按 **Enter** 键
3. 查看实时大气数据和未来预报

---

## 🎨 设计理念

本项目遵循 **frontend-design-3** skill 的设计原则：

> **避免"AI Slop"设计** — 不采用过度使用的紫色渐变、Inter 字体和可预测布局  
> **大胆的美学方向** — 赛博朋克 + 玻璃拟态的强视觉风格  
> **精心打磨的细节** — 每个动画、间距、色彩都经过精心调整  
> **令人难忘的体验** — 创造一个视觉上有辨识度的天气应用

---

## 📸 截图

### 桌面端
![Desktop View](screenshot-desktop.png)

### 移动端
<p align="center">
  <img src="screenshot-mobile.png" width="300" alt="Mobile View" />
</p>

---

## 🔧 自定义主题

通过修改 CSS Variables 轻松自定义配色：

```css
:root {
  --neon-cyan: #00f5d4;    /* 主色调 */
  --neon-pink: #ff006e;    /* 强调色 */
  --neon-purple: #8338ec;  /* 辅助色 */
  --neon-orange: #fb5607;  /* 警告色 */
}
```

---

## 🤝 致谢

- **wttr.in** — 提供免费的天气数据 API
- **frontend-design-3** — 设计指导 Skill
- **Space Grotesk & JetBrains Mono** — 出色的开源字体

---

## 📝 更新日志

### v2.0 (2026-03-03)
- ✨ 全新赛博朋克视觉设计
- 🎨 玻璃拟态界面重构
- 🌈 动态霓虹背景效果
- 📊 新增更多气象数据展示
- 📱 优化移动端体验

### v1.0
- 🎉 初始版本发布
- 🌤️ 基础天气查询功能
- 📱 响应式布局

---

## 📄 License

MIT License © 2026 ATMOS Team

---

<p align="center">
  <strong>Made with 💜 by OpenClaw Agent</strong>
</p>