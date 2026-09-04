(() => {
  'use strict';
  if (location.protocol === 'file:') return;
  let auth = window.CCMHostAuth || null, catalog = null, busy = false;
  const $ = id => document.getElementById(id);
  const reader = () => window.CCMReaderImages;
  const cleanPages = pages => Object.fromEntries(Object.entries(pages || {}).map(([key, list]) => [key, list.map(({src, ...item}) => item)]));
  const api = async (action, data = {}) => {
    if (!auth?.apiUrl || !auth?.id || !auth?.inviteCode) throw new Error('请从主程序登录后进入本章 / Please open this chapter after signing in.');
    const response = await fetch(auth.apiUrl, {method:'POST', headers:{'Content-Type':'application/json'}, cache:'no-store', body:JSON.stringify({...data, action, id:auth.id, inviteCode:auth.inviteCode})});
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(payload?.message || `HTTP ${response.status}`);
    return payload;
  };
  const style = document.createElement('style');
  style.textContent = `
    #ccmCloudImages{position:fixed;inset:5vh 5vw;z-index:10020;background:#f8fafc;border:1px solid #b9cce1;border-radius:20px;box-shadow:0 28px 80px #102a43aa;display:none;overflow:hidden;color:#17324d;font-family:inherit}
    #ccmCloudImages.open{display:grid;grid-template-rows:auto 1fr auto}.ccm-ci-head{display:flex;align-items:center;gap:12px;padding:15px 18px;background:linear-gradient(115deg,#0c4a6e,#176b87);color:#fff}.ccm-ci-head h3{margin:0;flex:1;font-size:1.05rem}.ccm-ci-head button,.ccm-ci-actions button,.ccm-ci-footer button,.ccm-ci-upload{border:0;border-radius:10px;padding:9px 13px;font-weight:700;cursor:pointer}.ccm-ci-head button{background:#ffffff25;color:#fff;font-size:1.2rem}.ccm-ci-body{padding:16px;overflow:auto}.ccm-ci-help{margin:0 0 12px;color:#526b7f;font-size:.86rem}.ccm-ci-list{display:grid;gap:12px}.ccm-ci-row{display:grid;grid-template-columns:112px minmax(180px,1fr) auto;gap:12px;align-items:center;background:#fff;border:1px solid #d7e3ee;border-radius:14px;padding:10px}.ccm-ci-row img{width:112px;height:72px;object-fit:contain;background:#eef4f8;border-radius:8px}.ccm-ci-row input{width:100%;box-sizing:border-box;border:1px solid #b8c9d8;border-radius:9px;padding:9px;font:inherit}.ccm-ci-actions{display:flex;flex-wrap:wrap;gap:6px}.ccm-ci-actions button{background:#e7f1f7;color:#174966}.ccm-ci-actions .danger{background:#fee2e2;color:#9b1c1c}.ccm-ci-empty{text-align:center;padding:30px;color:#64748b}.ccm-ci-footer{display:flex;align-items:center;gap:10px;padding:13px 17px;border-top:1px solid #d7e3ee;background:#fff}.ccm-ci-footer .save{margin-left:auto;background:#0f7896;color:#fff}.ccm-ci-upload{display:inline-block;background:#d9f4ed;color:#12634f}.ccm-ci-status{min-height:1.2em;color:#526b7f;font-size:.85rem}.ccm-ci-progress{height:5px;background:#dbe7ee;border-radius:9px;overflow:hidden;display:none}.ccm-ci-progress span{display:block;height:100%;width:0;background:#18a37d}@media(max-width:720px){#ccmCloudImages{inset:2vh 2vw}.ccm-ci-row{grid-template-columns:82px 1fr}.ccm-ci-row img{width:82px;height:60px}.ccm-ci-actions{grid-column:1/-1}}
  `;
  document.head.append(style);
  document.body.insertAdjacentHTML('beforeend', `<section id="ccmCloudImages" role="dialog" aria-modal="true" aria-label="云端图片管理"><header class="ccm-ci-head"><h3 id="ccmCiTitle">云端图片管理</h3><button id="ccmCiClose" aria-label="关闭">×</button></header><main class="ccm-ci-body"><p class="ccm-ci-help">当前页图片会按这里的顺序显示。名称是学生看到的名称；移除后需点击“保存更改”。</p><div class="ccm-ci-list" id="ccmCiList"></div></main><footer class="ccm-ci-footer"><label class="ccm-ci-upload">＋ 上传图片<input id="ccmCiFile" hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label><span class="ccm-ci-status" id="ccmCiStatus"></span><button class="save" id="ccmCiSave">保存更改</button></footer><div class="ccm-ci-progress" id="ccmCiProgress"><span></span></div></section>`);
  const modal = $('ccmCloudImages'), list = $('ccmCiList'), status = $('ccmCiStatus'), fileInput = $('ccmCiFile');
  const pageItems = () => catalog.pages[reader().getPageId()] ||= [];
  const setStatus = (text, error = false) => { status.textContent = text; status.style.color = error ? '#b42318' : ''; };
  const apply = () => { reader().applyCloudCatalog(catalog); };
  function renderManager() {
    $('ccmCiTitle').textContent = `第 ${reader().getPageNumber()} 页 · 云端图片管理`;
    list.replaceChildren(); const items = pageItems();
    if (!items.length) { const empty = document.createElement('p'); empty.className='ccm-ci-empty'; empty.textContent='当前页尚无云端图片'; list.append(empty); }
    items.forEach((item, index) => {
      const row=document.createElement('div'); row.className='ccm-ci-row';
      const img=document.createElement('img'); img.src=item.src; img.alt=item.name;
      const input=document.createElement('input'); input.value=item.name; input.maxLength=160; input.oninput=()=>item.name=input.value;
      const actions=document.createElement('div'); actions.className='ccm-ci-actions';
      [['↑ 上移',-1],['↓ 下移',1]].forEach(([label,delta])=>{const b=document.createElement('button');b.textContent=label;b.disabled=busy||(delta<0?index===0:index===items.length-1);b.onclick=()=>{[items[index],items[index+delta]]=[items[index+delta],items[index]];renderManager();};actions.append(b);});
      const remove=document.createElement('button'); remove.className='danger'; remove.textContent='移除'; remove.disabled=busy; remove.onclick=()=>{if(confirm(`从学生端移除“${item.name}”？`)){items.splice(index,1);renderManager();}}; actions.append(remove);
      row.append(img,input,actions); list.append(row);
    });
  }
  async function load() {
    if (!reader() || !auth?.id) return;
    try { const result=await api('chapter-images-list',{chapterId:reader().chapterId}); catalog=result.catalog; apply(); if(auth.role==='teacher'){const edit=$('editBtn');edit.hidden=false;edit.textContent='云端图片管理';edit.onclick=open;}} catch(error) { console.warn('Chapter images:', error.message); }
  }
  function open(){if(!catalog)return alert('图片目录尚未加载，请稍后重试。');setStatus('');renderManager();modal.classList.add('open');}
  function close(){if(busy)return;modal.classList.remove('open');reader().openPictures();}
  async function save(){if(busy)return;busy=true;renderManager();setStatus('正在保存…');try{const result=await api('chapter-images-save',{chapterId:reader().chapterId,expectedRevision:catalog.revision,pages:cleanPages(catalog.pages)});catalog=result.catalog;apply();setStatus('已保存，学生端刷新后即可看到。');renderManager();}catch(error){setStatus(error.message,true);}finally{busy=false;renderManager();}}
  async function upload(file){if(!file)return;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>8*1024*1024)return setStatus('请选择不超过 8MB 的 PNG/JPG/WebP/GIF 图片。',true);busy=true;renderManager();const bar=$('ccmCiProgress'),fill=bar.firstElementChild;bar.style.display='block';fill.style.width='0';setStatus('正在准备上传…');try{const init=await api('chapter-image-upload-init',{chapterId:reader().chapterId,pageId:reader().getPageId(),fileName:file.name,contentType:file.type,size:file.size});await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('PUT',init.uploadUrl);Object.entries(init.requiredHeaders||{}).forEach(([k,v])=>xhr.setRequestHeader(k,v));xhr.upload.onprogress=e=>{if(e.lengthComputable)fill.style.width=`${Math.round(e.loaded/e.total*100)}%`;};xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error(`COS 上传失败 HTTP ${xhr.status}`));xhr.onerror=()=>reject(new Error('COS 上传失败，请检查网络或桶的 CORS。'));xhr.send(file);});setStatus('正在登记图片…');const result=await api('chapter-image-upload-complete',{uploadId:init.uploadId,expectedRevision:catalog.revision,name:file.name.replace(/\.[^.]+$/,'')});catalog=result.catalog;apply();setStatus('上传成功。');}catch(error){setStatus(error.message,true);}finally{busy=false;bar.style.display='none';fill.style.width='0';fileInput.value='';renderManager();}}
  $('ccmCiClose').onclick=close;$('ccmCiSave').onclick=save;fileInput.onchange=()=>upload(fileInput.files[0]);
  window.addEventListener('ccm-auth-ready',event=>{auth=event.detail||null;load();});window.addEventListener('ccm-reader-images-ready',load);
  if (reader() && auth?.id) load();
})();
