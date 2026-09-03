/* Installation UI is independent of course authentication and saves no credentials. */
(() => {
  'use strict';
  const button = document.getElementById('pwaInstallButton');
  if (!button) return;
  const standalone = window.matchMedia('(display-mode: standalone)');
  const fullscreen = window.matchMedia('(display-mode: fullscreen)');
  const minimal = window.matchMedia('(display-mode: minimal-ui)');
  let promptEvent = null;
  let installedThisSession = false;
  let registrationError = false;
  let dialog = null;
  let busy = false;
  const isInstalled = () => installedThisSession || standalone.matches || fullscreen.matches || minimal.matches || navigator.standalone === true;
  const isAppleMobile = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const canRegister = () => window.isSecureContext && /^https?:$/.test(location.protocol) && 'serviceWorker' in navigator;

  function refreshButton() {
    button.hidden = isInstalled();
    if (isInstalled() && dialog && dialog.open) dialog.close();
  }

  function updateDialog() {
    if (!dialog) return;
    const help = dialog.querySelector('[data-help]');
    const install = dialog.querySelector('[data-install]');
    install.hidden = !promptEvent || !canRegister();
    install.disabled = busy;
    if (!canRegister()) {
      help.textContent = '请使用支持安装的浏览器打开正式 HTTPS 网页。本地文件（file://）不能安装。\nOpen the live HTTPS website in a browser that supports installation. Local files (file://) cannot be installed.';
    } else if (registrationError) {
      help.textContent = '安装组件未能加载。请检查网络及部署文件，刷新后重试；也可查看浏览器菜单中的安装选项。\nInstallation components could not load. Check the connection and deployment files, then reload; you can also check the browser’s install menu.';
    } else if (promptEvent) {
      help.textContent = '点击“立即安装”，然后在浏览器弹出的窗口中确认。\nSelect “Install now”, then confirm in the browser dialog.';
    } else if (isAppleMobile()) {
      help.textContent = '在 Safari 中打开本页面，点击“分享”→“添加到主屏幕”→“添加”；若有“作为网页 App 打开”，请保持开启。\nOpen this page in Safari. Tap Share → Add to Home Screen → Add. Keep “Open as Web App” enabled if shown.';
    } else if (/MicroMessenger|FBAN|FBAV|Instagram/.test(navigator.userAgent)) {
      help.textContent = '请先从右上角菜单选择“在浏览器中打开”，再使用浏览器的安装功能。\nChoose “Open in browser” from the menu, then use the browser’s installation option.';
    } else {
      help.textContent = '若未出现安装按钮，请查看浏览器地址栏或菜单中的“安装应用 / 添加到主屏幕”。Mac Safari 可查看“文件→添加到程序坞”。若已经安装，请从桌面或应用列表打开。\nIf no install prompt appears, check the address bar or browser menu for “Install app / Add to Home Screen”. In Mac Safari, check File → Add to Dock. If already installed, open it from your home screen or app list.';
    }
  }

  function openDialog() {
    if (isInstalled()) return;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'ccm-pwa-dialog';
      dialog.setAttribute('aria-labelledby', 'ccmPwaTitle');
      dialog.innerHTML = '<img src="./assets/icons/pwa/icon-192.png" alt="" width="72" height="72">' +
        '<h2 id="ccmPwaTitle">安装跨文化学习平台<br>Install the CCM learning app</h2>' +
        '<p>添加到桌面或主屏幕，下次一键打开。<br>Add it to your desktop or home screen for quick access.</p>' +
        '<p class="pwa-status" data-help></p>' +
        '<p class="pwa-note">课程、登录及答题需要联网。安装不会下载课程视频；不会新增账号、权限或成绩的离线缓存。<br>An internet connection is required for courses, login and quizzes. Installation does not download videos or add offline caches of accounts, permissions or scores.</p>' +
        '<p class="pwa-note">浏览器最终确认窗口的语言由设备设置决定。<br>The browser’s confirmation language follows your device settings.</p>' +
        '<p class="pwa-status" data-status role="status" aria-live="polite"></p>' +
        '<div class="pwa-actions"><button type="button" data-close>关闭 / Close</button><button type="button" data-install hidden>立即安装 / Install now</button></div>';
      document.body.appendChild(dialog);
      dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => { if (!button.hidden) button.focus(); });
      dialog.querySelector('[data-install]').addEventListener('click', async () => {
        if (!promptEvent || busy) return;
        busy = true;
        const event = promptEvent;
        promptEvent = null;
        const status = dialog.querySelector('[data-status]');
        updateDialog();
        try {
          await event.prompt();
          const choice = await event.userChoice;
          status.textContent = choice.outcome === 'accepted'
            ? '已提交安装请求，请等待浏览器完成。\nInstallation requested. Please wait for the browser to finish.'
            : '已取消。稍后可从浏览器菜单再次安装。\nCancelled. You can install later from the browser menu.';
        } catch (error) {
          status.textContent = '未能打开安装窗口，请使用浏览器菜单安装。\nCould not open the install dialog. Please use the browser menu.';
        } finally {
          busy = false;
          updateDialog();
        }
      });
    }
    dialog.querySelector('[data-status]').textContent = '';
    updateDialog();
    if (!dialog.open) dialog.showModal();
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    promptEvent = event;
    refreshButton();
    updateDialog();
  });
  window.addEventListener('appinstalled', () => {
    installedThisSession = true;
    promptEvent = null;
    refreshButton();
  });
  for (const query of [standalone, fullscreen, minimal]) {
    if (query.addEventListener) query.addEventListener('change', refreshButton);
  }
  button.addEventListener('click', openDialog);
  refreshButton();
  if (canRegister()) {
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
      .catch(error => {
        registrationError = true;
        console.warn('[CCM PWA] Service worker registration failed:', error);
        updateDialog();
      });
  }
})();
