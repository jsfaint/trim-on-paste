// ==UserScript==
// @name         Trim on Paste
// @namespace    https://github.com/jiasui/trim
// @version      1.0.0
// @description  粘贴时自动去掉文本首尾的空白（空格、Tab、换行、全角空格）
// @author       jiasui
// @match        *://*/*
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // 只接管"纯文本输入"控件。contenteditable（Notion/飞书/ChatGPT/邮件）粘贴时常带
  // text/html，在这里 preventDefault 会连带丢掉格式和图片，代价大于收益。
  const TEXT_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', '']);

  function isTextField(el) {
    if (el instanceof HTMLTextAreaElement) return true;
    if (el instanceof HTMLInputElement) return TEXT_TYPES.has(el.type);
    return false;
  }

  // 少数情况下 execCommand 用不了（如只读、浏览器拒绝），退回手工替换并补发 input 事件
  function fallbackInsert(el, text) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.setRangeText(text, start, end, 'end');
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: text }));
  }

  document.addEventListener(
    'paste',
    (e) => {
      // shadow DOM 里 e.target 会被重定向成宿主元素，composedPath 才能拿到真正的输入框
      const el = e.composedPath()[0];
      if (!isTextField(el)) return;

      const clipboard = e.clipboardData || window.clipboardData;
      if (!clipboard) return;

      const raw = clipboard.getData('text/plain');
      const trimmed = raw.trim();
      // 没东西可改就交回浏览器走默认流程，别去动撤销栈
      if (!trimmed || trimmed === raw) return;

      e.preventDefault();
      // execCommand 是唯一能在替换文本的同时保住撤销栈、并触发框架 input 事件的 API。
      // 直接改 el.value 会丢撤销、丢光标位置，React/Vue 受控输入也不会同步。
      if (!document.execCommand('insertText', false, trimmed)) fallbackInsert(el, trimmed);
    },
    true
  );
})();
