(() => {
  'use strict';
  // Many accepted pages use inline rem sizes. Apply one shared scale to those
  // sizes and stylesheet declarations instead of enlarging the root (and titles).
  const variable = '--ccm-content-scale';
  function enlargeDeclaration(style) {
    const value = style.getPropertyValue('font-size');
    if (!value || value.includes(variable)) return;
    // Relative em/% sizes already inherit their parent's scaled size.
    if (!/(?:rem|px|vw|vh|vmin|vmax)\b/.test(value)) return;
    style.setProperty('font-size', `calc((${value}) * var(${variable}, 1))`, style.getPropertyPriority('font-size'));
  }
  function visitRules(rules) {
    for (const rule of rules) {
      if (rule.style) enlargeDeclaration(rule.style);
      if (rule.cssRules) visitRules(rule.cssRules);
    }
  }
  for (const sheet of document.styleSheets) {
    try { visitRules(sheet.cssRules); } catch { /* Cross-origin sheets stay untouched. */ }
  }
  function visitInline(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches('[style]')) enlargeDeclaration(root.style);
    root.querySelectorAll('[style]').forEach(el => enlargeDeclaration(el.style));
  }
  document.querySelectorAll('.slide, #tableModal, #readingModal, #iwaoModal').forEach(visitInline);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE && node.closest('.slide, #tableModal, #readingModal, #iwaoModal')) visitInline(node);
    }
  }).observe(document.body, {childList: true, subtree: true});
})();
