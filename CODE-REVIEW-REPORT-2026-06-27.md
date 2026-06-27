# Code Review 根因分析报告 — 2026-06-27

## 审查范围

`CrawlProgress.tsx` + `PolicyCrawlBadge.tsx` — 两个 badge+dropdown 进度组件

## 发现汇总

| 严重度 | 数量 | 模式 |
|------|:--:|------|
| 🔴 确认缺陷 | 5 | 错误处理缺失、NaN 未防护、null 渲染 |
| ⚠️ 潜在缺陷 | 2 | 运行时类型不安全 |
| 💡 改进建议 | 7 | 代码重复、状态管理、无 AbortController |

## 根因分析：为什么这些错误会出现？

### 根因 1：没有统一的 fetch 错误处理约定

**涉及的发现**: #1 `catch {}` 吞没、#2 `if (res.ok)` 无 else、#3 catch 丢弃 Error、#13 零错误状态不对称

**为什么会发生**:
- 每个组件各自实现 fetch 逻辑，没有共享的 `useFetch` 或 `fetchJSON` 工具
- `CollegePanel` 用 `.catch(() => setLoading(false))`，`CrawlProgress` 用 `catch {}`，`PolicyCrawlBadge` 用 `.catch(() => setFetchError(true))`
- 同一个项目里 4 种不同的错误处理模式

**初期能否避免**: ✅ 可以。在第一个需要 fetch 的组件出现时，就应该提取共享的 fetch 封装（含 `res.ok` 检查 + `console.error` + 错误状态）。

### 根因 2：TypeScript 类型安全 ≠ 运行时安全

**涉及的发现**: #4 `dateTo` 渲染 "null"、#5 `parseFloat` → NaN、#6 `STATUS_CONFIG` 查找无 fallback

**为什么会发生**:
- `ProvinceStatus.dateTo: string | null` — TypeScript 只保证编译时不传错类型，不保证运行时 API 返回的数据结构
- `parseFloat("N/A")` — TypeScript 不检查字符串内容
- `Record<"success"|"partial"|"empty", ...>` — 编译时强制 key 完整，但运行时 `p.status` 来自 JSON.parse，可能是任意值

**初期能否避免**: ✅ 可以。原则：**所有 API 返回数据在渲染前必须经过运行时校验**。`parseFloat` 后用 `Number.isNaN` 检查、查找表用 `|| fallback`、条件渲染用 `&&` 而非单边检查。

### 根因 3：fetch 无 AbortController

**涉及的发现**: #7 fetch 在 unmount 后 setState、#8#9 两个文件都缺 AbortController

**为什么会发生**:
- React 官方文档未强制要求，开发者容易忽略
- 组件挂在 header 中几乎不会卸载，所以"实际不会出问题"
- 但 React Strict Mode 双挂载会暴露这个问题

**初期能否避免**: ✅ 可以。原则：**每个 fetch in useEffect 必须有 AbortController + 清理函数**。

### 根因 4：copy-paste 导致代码重复漂移

**涉及的发现**: #10 面板重叠、#14 DROPDOWN_TOP 重复定义

**为什么会发生**:
- `PolicyCrawlBadge` 是从 `CrawlProgress` 模仿出来的（注释里写了 "same style as CrawlProgress"）
- 两个组件 80% 的骨架代码相同（badge + ref + expanded + mousedown/ESC handler + fixed dropdown）
- 但 copy 时没有提取共享基类，导致各自独立演化

**初期能否避免**: ⚠️ 部分可以。第二个 badge 组件出现时，就应该识别出"这是同一模式"并提取共享逻辑。但实践中，第一个组件通常不会过度设计。

### 根因 5：状态生命周期管理不完整

**涉及的发现**: #11 数据永不刷新（空依赖）、#12 筛选状态跨开关持久化

**为什么会发生**:
- `useEffect([], ...)` 是"一次性"思维，但 badge 显示的是会变化的动态数据
- `filter` 是组件级 state，但它是面板内部的临时 UI 状态，关闭时应该重置
- 没有明确的状态生命周期定义：哪些状态属于 badge，哪些属于面板

**初期能否避免**: ✅ 可以。原则：**定义状态的所有权**。面板打开时初始化的 UI 状态（如 filter），在面板关闭时必须重置。

---

## 应该在开发中遵循的规则

### 规则 1：统一 fetch 模式

```typescript
// ✅ 正确：每个 fetch 都有这三样
useEffect(() => {
  const ac = new AbortController();
  fetch(url, { signal: ac.signal })
    .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
    .then(data => { setData(data); setError(false); })
    .catch(err => {
      if (err.name === 'AbortError') return;
      console.error('ComponentName fetch:', err);
      setError(true);
    });
  return () => ac.abort();
}, [deps]);
```

禁止: `catch {}`（空 catch）、`catch(() => ...)`（丢弃 error 参数）、`if (res.ok) ...`（无 else 分支）

### 规则 2：API 返回值必须运行时校验

```typescript
// ✅ 正确
const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.empty;
const pct = Number.isNaN(parseFloat(raw)) ? 0 : parseFloat(raw);
const dateStr = (from && to) ? `${from} ~ ${to}` : "—";  // 两边都检查
```

禁止：单边条件 `p.dateFrom ? ... : ...`（另一边可能是 null）、无 fallback 的查找表访问

### 规则 3：Copy 前先提取共享

当新组件与现有组件共享 50%+ 的骨架代码时，先提取共享 Hook 或基类组件，再实现差异部分。

### 规则 4：面板/弹窗状态必须重置

```typescript
const handleOpen = () => {
  setFilter("全部");  // 重置内部 UI 状态
  setExpanded(true);
};
```

### 规则 5：非一次性数据需要刷新机制

- 显示动态数据（如爬取进度）的组件，不能只用 `useEffect([], ...)`
- 要么轮询，要么在焦点恢复时重新 fetch

---

## 严重度趋势

本次发现的 14 个问题中，**12 个（86%）可以在初期通过项目级约定避免**。核心缺失：共享的 `useFetch` Hook、API 运行时校验、组件 Copy 时的提取意识。
