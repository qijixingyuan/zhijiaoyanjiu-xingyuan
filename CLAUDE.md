# CLAUDE.md — 高职院校政策研究平台

## 技术栈

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Prisma 5 + SQLite (可迁移 PostgreSQL)
- ECharts 5 + echarts-for-react (地图)
- 数据: 教育部《全国普通高等学校名单》1540 所专科院校

## 自我验证规则（每次修改后必须执行）

修改代码后，必须本地运行验证，不得等用户反馈。

**每次修改涉及交互逻辑（点击/输入/弹窗/抽屉/筛选），必须用 Playwright 模拟完整操作链路并确认通过。不可仅凭代码审查或 curl 状态码判断"已修复"。**

1. `npm run dev` 启动 → 确认 http://localhost:3000 返回 200
2. 验证所有 4 个页面: `/` `/policy` `/stats` `/college/[id]` 均返回 200
3. 涉及地图交互 → Playwright 测试：点击省份 → 抽屉打开 → 点击空白 → 抽屉关闭
4. 涉及院校搜索 → Playwright 测试：输入关键词 → 列表加载 → 点击院校 → Tab 详情显示
5. 涉及政策搜索 → Playwright 测试：LLM 智能分析 → 解析结果 chip → 匹配政策列表
6. **发现问题立即修复，修复后必须重新测试，不得说\"应该可以了\"后交差**
3. 验证 GeoJSON: `/china.json` 返回 200 (582KB)
4. 验证 API: `/api/colleges/geo` 返回完整 31 省数据，stats.total=1540
5. 验证筛选: `/api/colleges?province=湖南省` 返回 91 条
6. 发现报错立即修复，不得提交有错误的代码

## 协作规则

1. 先读后写 — 修改文件前先 Read
2. **改架构必须全局同步** — 修改组件或页面架构时，用 `grep -r "ComponentName" src/app --include="*.tsx"` 扫描所有引用点，确保没有遗漏的旧路由或旧组件依赖
3. 小步提交 — 每完成一个功能点立即 commit
4. 15分钟止损 — 同一问题试两次不行，换方案
5. 不懂就问 — 不确定的逻辑必须问用户
6. **死代码立即删除** — 旧组件不再被引用时，确认后立即删除，避免误导后续开发

## 关键文件

```
src/components/map/ChinaMap.tsx   — ECharts 地图 (GeoJSON 异步加载)
src/lib/china-geo.ts              — 城市→省份映射表
prisma/seed.ts                    — XLS 导入脚本
prisma/schema.prisma              — 数据模型
src/app/api/                      — API 路由
```

## React 组件声明顺序（硬性规则）

**`const` 函数必须在调用它的 `useEffect` 之前声明。**

错误示例（已经踩过 3 次坑）：
```typescript
// ❌ 错误：useEffect 引用还未声明的 loadColleges
useEffect(() => { loadColleges(query); }, [query]);
const loadColleges = (q: string) => { ... };
```

正确写法：
```typescript
// ✅ 正确：const 函数在前，useEffect 在后
const loadColleges = (q: string) => { ... };
useEffect(() => { loadColleges(query); }, [query]);
```

**原因**: `const` 声明存在"暂时性死区"（temporal dead zone），在声明行之前访问会抛出 `ReferenceError: Cannot access before initialization`。React 静默吞掉此错误，组件表现为空白页，不报 visible error。

**检查方法**: 如果某个页面/组件突然空白，首先检查 `useEffect` 是否引用了后续声明的 `const` 函数。

## ECharts 地图关键约束（踩坑记录）

**绝对红线：**
- `registerMap` 必须调用在 `echarts` **全局对象**上（`import * as echarts from 'echarts'` → `echarts.registerMap("china", geo)`），**绝不**能调用在 chart 实例上
- echarts-for-react 的 `onChartReady` 传入的是 chart 实例（EChartsInstance），不是 echarts 全局对象。chart 实例没有 registerMap 方法
- 正确流程：fetch GeoJSON → `echarts.registerMap("china", json)` → 设置 `geoLoaded=true` → 渲染 ReactECharts（此时 option 可安全引用 `map: "china"`）
- GeoJSON 加载完成前不渲染 ReactECharts（显示 loading），避免渲染时地图未注册
- 地图空白处（海洋/背景）点击不触发 ECharts `click` 事件。需用 `instance.getZr().on("click")` 监听 zrender 级别点击，`!params.target` 表示点击了空白区域
- 地图 overlay（stats/legend/tooltip）必须加 `pointer-events-none`，否则拦截 canvas 点击事件

## E2E 测试（每次 UI 修改后必须执行）

修改任何 UI 组件后，必须用 Playwright 模拟完整用户操作链路：

```bash
cd "D:/AI Projects/高职院校地图系统" && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  // 1. 加载页面
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForSelector('canvas', { timeout: 10000 });
  console.log('1. Map loaded, errors:', errors.length);

  // 2. 点击地图省份（湖南）→ 验证切换到院校 Tab
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width * 0.57, y: box.height * 0.55 } });
  await page.waitForTimeout(2500);
  const text1 = await page.textContent('body');
  console.log('2. On college tab:', text1.includes('选择左侧院校查看详情'), '| errors:', errors.length);

  // 3. 验证院校列表加载
  console.log('3. College list:', text1.includes('职业技术'));

  // 4. 点击第一所院校 → 验证详情加载
  const colleges = page.locator('div').filter({ hasText: /职业技术学院$/ });
  if (await colleges.count() > 0) {
    await colleges.first().click();
    await page.waitForTimeout(2000);
    const text2 = await page.textContent('body');
    console.log('4. Detail:', text2.includes('标识码'), '| Link:', text2.includes('官方链接'), '| errors:', errors.length);
  }
  
  // 5. 验证其他页面
  for (const tab of ['政策数据库', '统计后台']) {
    await page.locator('button:has-text(\"' + tab + '\")').click();
    await page.waitForTimeout(500);
  }
  console.log('5. All tabs navigable, final errors:', errors.length);
  
  if (errors.length > 0) { console.error('FAIL:', errors); process.exit(1); }
  console.log('PASS: All checks passed');
  await browser.close();
})();
"
```

## echarts-for-react 事件绑定踩坑

**绝对不要用 `onEvents` prop！**
- `onEvents={{ click: fn }}` 在 echarts-for-react 3.x 中不稳定，点击事件可能不触发
- 正确做法：`onChartReady` → `instance.on('click', fn)` + `instance.off` 清理
- 参考 `src/components/map/MapPanel.tsx` 的 `handleChartReady` 实现

## 政策爬虫 — 诊断与修复方案（2026-06-26）

### 诊断总览

| 源 | 状态 | 根因 | 解决方案 |
|------|:--:|------|------|
| 教育部 | ❌ 0链接 | Vue.js SPA，页面内容由 JS 异步加载 | `page.waitForSelector('.moe_list li a, .zcfg_list li a', {timeout:10000})` 等待 Vue 渲染完成后再提取 |
| 湖南 | ⚠️ 链接文本乱码 | `document.write(str.substr(...))` 动态写入链接文字 | `page.waitForLoadState('networkidle')` 等所有 JS 执行完，document.write 完成后 DOM 中才有完整链接 |
| 广东 | ⚠️ 无政策 | URL 指向 `zwgknew/gsgg/`（公示公告），不是政策文件页 | 换为 `https://edu.gd.gov.cn/zwgknew/jyzcfg/`（教育政策法规）或搜索"广东省教育厅 职业教育 政策文件"找正确栏目 URL |
| 江苏 | ❌ 404 | URL `/col/col57890/` 已失效 | 在 `jyt.jiangsu.gov.cn` 搜索"通知公告"或"政策文件"找当前有效 URL |
| 浙江 | ❌ 404 | URL `/col/col1543966/` 已失效 | 同上，在 `jyt.zj.gov.cn` 找当前有效栏目 URL |

### 修复优先级

```
1. 修复教育部（影响最大，中央政策）
2. 修��湖南（document.write 方案通用，可能适用于其他省份）
3. 更新江苏/浙江 URL（404 类问题只需找新 URL）
4. 更新广东 URL（换政策法规栏目）
```

### 通用爬虫健壮性改进

1. **添加 `waitForLoadState('networkidle')`** — 等所有 JS 执行完（解决 SPA 和 document.write 问题）
2. **添加 fallback 选择器** — 先用站点专用选择器，失败后回退到通用 `ul li a` 模式
3. **URL 失效检测** — 爬取前先 HEAD 请求检查 200，非 200 的标记 `status=broken` 跳过
4. **已验证可用的源 URL** — 成功爬取过的 URL 写入配置文件，下次优先使用

## 常用命令

```bash
cd "D:/AI Projects/高职院校地图系统"
npm run dev              # 开发服务器
npm run db:push          # 更新数据库
npm run db:seed          # 重新导入 1540 院校
npm run db:studio        # Prisma Studio 数据浏览
npx tsx prisma/seed.ts   # 运行种子脚本
```

## 阿里云部署（硬性规则，必读）

### 服务器信息

| 项目 | 值 |
|------|-----|
| IP | 47.107.31.231 |
| SSH 密钥 | `D:\AI Projects\claude cunjifen\01系统基础指南\luoyu.pem` |
| SSH 用户 | root |
| 项目目录 | `/www/wwwroot/zhijiao/` |
| 端口 | **3001** |
| PM2 名称 | `zhijiao` |
| 数据库 | SQLite (`prisma/dev.db`) |
| 部署文档 | `DEPLOY-{date}.md`（项目目录，带日期） |

### 隔离红线（绝对不能违反）

1. **端口隔离**: 本项目用 **3001**，绝不占用 **3000**（luoyu 积分系统）
2. **进程隔离**: PM2 名称 `zhijiao`，不碰 `luoyu-backend`
3. **目录隔离**: 只在 `/www/wwwroot/zhijiao/` 操作，不读写 `/www/wwwroot/luoyu/`
4. **数据库隔离**: SQLite 独立文件，不连接 MySQL
5. **Nginx 隔离**: 宝塔面板新增反向代理，不修改现有 luoyu 配置

### 部署三原则（用户要求）

1. **服务器需要部署文档** — 先提交到 git，push 后再 pull 到服务器（或 git 不通时直接传文件）
2. **紧急热修复** — 在服务器上改完后，必须同步回本地，提交到 git
3. **必须直接传文件** — 传文件前先 `git status` 确认没有未跟踪文件冲突，conflict 时先移除服务器上的同名文件再 pull

### 部署流程（每次部署按此步骤）

```bash
# 1. 先 commit & push 所有本地改动
cd "D:/AI Projects/高职院校地图系统"
git add -A && git commit -m "..." && git push

# 2. SSH 连接服务器
ssh -i "D:\AI Projects\claude cunjifen\01系统基础指南\luoyu.pem" root@47.107.31.231

# 3. 拉取 + 构建
cd /www/wwwroot/zhijiao && git pull && PORT=3001 npm run build

# 4. 重启 PM2
pm2 restart zhijiao 2>/dev/null || pm2 start npm --name zhijiao -- start -- --port 3001 && pm2 save

# 5. 验证
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/
# 应返回 200
```

### 部署相关文档

每次部署必须保存带日期的文档：
- 本地: `D:\AI Projects\高职院校地图系统\DEPLOY-{YYYY-MM-DD}.md`
- 服务器: `/www/wwwroot/zhijiao/DEPLOY-{YYYY-MM-DD}.md`

### 服务器已有系统（参考，不要碰）

| 端口 | 项目 | PM2 名称 | 数据库 |
|:--:|------|------|------|
| 3000 | 罗峪村积分系统 | luoyu-backend | MySQL |
| 80/443 | Nginx 反向代理 | - | - |
| 8888 | 宝塔面板 | - | - |
| 3306 | MySQL | - | - |
