const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

class Element {
  constructor() { this.handlers = {}; this.hidden = false; this.open = false; this.textContent = ''; this.parts = {}; }
  addEventListener(name, callback) { this.handlers[name] = callback; }
  setAttribute() {}
  querySelector(selector) { return this.parts[selector] ||= new Element(); }
  showModal() { this.open = true; }
  close() { this.open = false; this.handlers.close?.(); }
  focus() {}
}
function ui({ secure = true, installed = false, apple = false, registrationFails = false } = {}) {
  const button = new Element();
  let dialog, registered = 0;
  const events = {};
  const window = {
    isSecureContext: secure,
    matchMedia: () => ({ matches: installed, addEventListener() {} }),
    addEventListener: (name, handler) => { events[name] = handler; }
  };
  const navigator = {
    userAgent: apple ? 'iPhone' : 'Chrome', platform: apple ? 'iPhone' : 'Win32', maxTouchPoints: 0,
    serviceWorker: { register(url, options) {
      registered++; assert.equal(url, './sw.js'); assert.equal(options.scope, './');
      return registrationFails ? Promise.reject(new Error('test')) : Promise.resolve({});
    } }
  };
  vm.runInNewContext(read('assets/pwa.js'), {
    window, navigator, console: { warn() {} }, location: { protocol: secure ? 'https:' : 'file:' },
    document: { getElementById: () => button, createElement: () => (dialog = new Element()), body: { appendChild() {} } }
  });
  return { button, events, get dialog() { return dialog; }, get registered() { return registered; } };
}

(async () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  for (const base of ['https://example.test/', 'https://example.test/CCM/']) {
    assert.equal(new URL(manifest.start_url, base).href, base + 'index.html');
    assert.equal(new URL(manifest.scope, base).href, base);
  }
  for (const icon of manifest.icons) {
    const bytes = fs.readFileSync(path.join(root, icon.src));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes);
  }
  let page = ui();
  assert.equal(page.registered, 1); assert.equal(page.button.hidden, false);
  page.button.handlers.click(); assert.equal(page.dialog.open, true);
  assert.match(page.dialog.querySelector('[data-help]').textContent, /Install app/);
  let prompted = 0, prevented = false;
  page.events.beforeinstallprompt({ preventDefault() { prevented = true; }, prompt: async () => { prompted++; }, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
  assert(prevented); assert.equal(page.dialog.querySelector('[data-install]').hidden, false);
  await page.dialog.querySelector('[data-install]').handlers.click();
  assert.equal(prompted, 1); assert.match(page.dialog.querySelector('[data-status]').textContent, /Cancelled/);
  await page.dialog.querySelector('[data-install]').handlers.click(); assert.equal(prompted, 1);
  page.events.appinstalled(); assert.equal(page.button.hidden, true); assert.equal(page.dialog.open, false);
  assert.equal(ui({ installed: true }).button.hidden, true);
  page = ui({ apple: true }); page.button.handlers.click(); assert.match(page.dialog.querySelector('[data-help]').textContent, /Safari/);
  page = ui({ secure: false }); assert.equal(page.registered, 0); page.button.handlers.click(); assert.match(page.dialog.querySelector('[data-help]').textContent, /HTTPS/);
  page = ui({ registrationFails: true }); await Promise.resolve(); page.button.handlers.click(); assert.match(page.dialog.querySelector('[data-help]').textContent, /could not load/);

  const events = {}, cache = new Map(), deleted = [];
  let offline = false, calls = [];
  const base = 'https://example.test/CCM/';
  const expectedCache = 'ccm-pwa-%2FCCM%2F-v27';
  const cacheApi = { put: async (url, response) => cache.set(url, response), match: async url => cache.get(url) };
  vm.runInNewContext(read('sw.js'), {
    URL, Response,
    self: { location: { href: base + 'sw.js' }, addEventListener: (name, handler) => { events[name] = handler; }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches: { open: async name => { assert.equal(name, expectedCache); return cacheApi; }, keys: async () => [expectedCache, 'ccm-pwa-%2FCCM%2F-v26', 'another-app-cache'], delete: async key => { deleted.push(key); } },
    fetch: async (request, options) => {
      calls.push({ request, options }); if (offline) throw new Error('offline');
      return new Response(typeof request === 'string' ? 'offline bilingual page' : 'fresh course');
    }
  });
  let pending;
  events.install({ waitUntil(promise) { pending = promise; } }); await pending;
  assert.deepEqual([...cache.keys()], [base + 'offline.html']);
  events.activate({ waitUntil(promise) { pending = promise; } }); await pending;
  assert.deepEqual(deleted, ['ccm-pwa-%2FCCM%2F-v26']);
  async function request(url, method = 'GET', mode = 'navigate') {
    let response;
    events.fetch({ request: { url, method, mode }, respondWith(promise) { response = promise; } });
    return response ? (await response).text() : null;
  }
  assert.equal(await request(base + 'index.html'), 'fresh course');
  assert.equal(calls.at(-1).options.cache, 'no-store');
  offline = true;
  assert.equal(await request(base), 'offline bilingual page');
  for (const url of ['https://api.example.test/', base + 'system/adminPIN.json', base + 'system/materials.json', base + 'video.mp4', 'https://example.test/OTHER/']) assert.equal(await request(url), null);
  assert.equal(await request(base + 'index.html', 'POST'), null);
  assert.equal(await request(base + 'index.html', 'GET', 'cors'), null);
  assert.equal(cache.size, 1);
  console.log('PASS: manifest paths/sizes; bilingual install UI; cancel/installed/iOS/insecure/error states; offline fallback; API/data/video bypass; cache isolation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
