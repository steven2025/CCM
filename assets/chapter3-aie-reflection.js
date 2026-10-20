(() => {
  'use strict';
  const launch = document.querySelector('[data-aie-open]');
  if (!launch) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'ccm-aie-dialog';
  dialog.setAttribute('aria-labelledby', 'ccmAieTitle');
  dialog.innerHTML = '<header class="ccm-aie-head"><strong id="ccmAieTitle">跨文化相遇互动反思</strong><div><button type="button" data-aie-full>全屏 / Fullscreen</button><button type="button" data-aie-close>返回第三章 / Close</button></div></header><iframe title="跨文化相遇互动反思 · AIE Reflection" allow="autoplay; fullscreen" src="about:blank"></iframe>';
  document.body.append(dialog);
  const frame = dialog.querySelector('iframe');
  const full = dialog.querySelector('[data-aie-full]');
  function pause() {
    try { frame.contentWindow.CCMAieActivity?.pause(); } catch {}
  }
  function close() { if (dialog.open) dialog.close(); }
  launch.addEventListener('click', () => {
    frame.src = new URL(launch.dataset.aieUrl, location.href).href;
    dialog.showModal();
    // Stop any chapter media while the activity has focus.
    document.querySelectorAll('audio,video').forEach(media => media.pause());
  });
  full.addEventListener('click', () => {
    const expanded = dialog.classList.toggle('expanded');
    full.textContent = expanded ? '还原 / Restore' : '全屏 / Fullscreen';
    full.setAttribute('aria-pressed', String(expanded));
  });
  dialog.querySelector('[data-aie-close]').addEventListener('click', close);
  dialog.addEventListener('close', () => {
    pause();
    frame.src = 'about:blank';
    dialog.classList.remove('expanded');
    full.textContent = '全屏 / Fullscreen';
    full.setAttribute('aria-pressed', 'false');
    launch.focus();
  });
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'CCM_AIE_CLOSE') close();
  });
  // Escape pressed inside an iframe is forwarded to the containing dialog.
  frame.addEventListener('load', () => {
    try {
      frame.contentDocument.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !frame.contentDocument.querySelector('.modal-mask.show')) {
          event.preventDefault(); close();
        }
      });
    } catch {}
  });
  new MutationObserver(() => { if (dialog.open && !launch.closest('.slide')?.classList.contains('active')) close(); })
    .observe(launch.closest('.slide'), {attributes: true, attributeFilter: ['class']});
  document.addEventListener('visibilitychange', () => { if (document.hidden && dialog.open) pause(); });
})();
