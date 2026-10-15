# Trim on Paste

粘贴时自动去掉文本首尾的空白（空格、Tab、换行、`&nbsp;`）。

## 安装

1. 装 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)
2. 访问 [`trim-on-paste.user.js`](https://github.com/jsfaint/trim-on-paste/raw/main/trim-on-paste.user.js)，脚本管理器会弹出安装确认（必须是 raw 链接，GitHub 的源码页返回的是 HTML，装不了）

装完即用，无需配置。

## 行为

拦截 `input`（文本类，排除 checkbox/radio/number 等）和 `textarea` 的 `paste` 事件，把剪贴板里的 `text/plain` 首尾空白去掉再插入。

几个刻意的实现选择：

- **只在确实需要改时才 `preventDefault`。** 剪贴板文本本来就干净时完全不插手，不碰撤销栈，也不重放 paste。
- **用 `document.execCommand('insertText')` 而不是 `el.value = ...`。** execCommand 虽已标记废弃，但它是目前唯一能在替换文本的同时保住撤销栈、正确落光标、并触发 React/Vue 受控输入 `input` 事件的 API。直接赋值会丢撤销、丢光标位置，框架也收不到变更，输入框会和组件状态脱节。`execCommand` 不可用时退回 `setRangeText` + 手工派发 `input` 事件。
- **`String.prototype.trim()` 而非自定义正则。** 它的 `\s` 已包含 `\u00A0`（`&nbsp;`）和 `\uFEFF`（BOM），从网页复制的文本常带这两种，正好一并清掉。

## 边界

| 不做的事 | 原因 |
|---|---|
| 不处理 `contenteditable`（Notion、飞书、ChatGPT、Gmail 正文） | 这些地方粘贴常带 `text/html`，`preventDefault` 后只插纯文本会连带丢掉加粗、表格、图片，破坏性大于收益 |
| 只 trim 整段首尾 | 不动每行缩进，不压缩中间连续空白 |
| `@match *://*/*`，无白名单 | 全站生效 |

需要覆盖 `contenteditable` 或按站点开关，改几行即可，但保格式与 trim 之间必然要取舍。

## 验证

装好后在任意页面按 F12，Console 里跑：

```js
const t = document.createElement('textarea');
document.body.append(t); t.focus();
const dt = new DataTransfer(); dt.setData('text/plain', '  hello \n ');
t.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
console.log(JSON.stringify(t.value) === '"hello"'); // true
```

## 为什么不用现成脚本

Greasyfork 上现有的都是限定场景的版本——只认链接前缀、只认某个财务系统/发票页、拦的是 `copy` 而非 `paste`——没有通用的。多数还直接覆写 `el.value`，会清掉输入框已有内容并把光标丢到末尾。

## 许可

MIT
