(()=>{
  'use strict';
  const BASE='https://ccm2025-1311686407.cos.ap-chongqing.myqcloud.com/chapter3/interactive-case-project/';
  const API='https://1311686407-1ngfs1nlvf.ap-guangzhou.tencentscf.com';
  const ASSIGNMENT='chapter3-interactive-case-video';
  const CASES=[
    {id:1,cap:2,key:'case-01-mmg',zh:'MMG外派高管的文化适应',en:'MMG Expatriate Adaptation',tags:['外派管理','文化适应'],desc:'首位母国外派高管面对总部期待、当地团队关系与文化适应的多重挑战。'},
    {id:2,cap:3,key:'case-02-novizan',zh:'诺唯赞全球化战略的跨文化突围',en:'Vazyme Globalization',tags:['全球协同','本地化'],desc:'从海外业务“三无”开局，到建立本地团队、供应链与跨地域协同机制。'},
    {id:3,cap:2,key:'case-03-citic-dicastal',zh:'中信戴卡文化在墨西哥工厂落地',en:'CITIC Dicastal in Mexico',tags:['文化融合','海外工厂'],desc:'“仁义礼智信”如何转化为墨西哥员工能够理解、参与并认同的管理实践。'},
    {id:4,cap:3,key:'case-04-startimes',zh:'四达时代文化“走出去”',en:'StarTimes in Africa',tags:['文化传播','非洲市场'],desc:'数字电视业务进入非洲时，商业可持续性、本地需求与文化传播之间的选择。'},
    {id:5,cap:2,key:'case-05-ale-restaurant',zh:'Ale在意大利餐厅的管理困境',en:'Ale’s Restaurant Dilemma',tags:['沟通','变革管理'],desc:'古巴经理、中国团队与意大利餐饮情境，在新菜单改革中产生的沟通与决策冲突。'},
    {id:6,cap:3,key:'case-06-sihe',zh:'思和科技跨国并购薪酬整合',en:'Sihe Compensation Integration',tags:['跨国并购','薪酬公平'],desc:'并购德国和芬兰企业后，如何平衡地区差异、关键人才、内部公平与预算压力。'},
    {id:7,cap:2,key:'case-07-aiju',zh:'爱菊粮油哈萨克斯坦本土化',en:'Aiju Localization in Kazakhstan',tags:['人才本土化','授权'],desc:'驻哈基地如何从中方外派人员“灭火”，走向当地员工培养、授权与自主运营。'},
    {id:8,cap:3,key:'case-08-v-company',zh:'V公司收购韩国T公司后的整合',en:'V–T Post-acquisition Integration',tags:['企业文化','人才保留'],desc:'中国民营企业收购韩资品牌后，在招聘、职级、薪酬和组织认同方面的整合困局。'}
  ];
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const modal=$('#caseWorkshopModal'); if(!modal)return;
  const SCRIPT_BASE=new URL('./',document.currentScript?.src||location.href);
  const title=$('#caseWorkshopTitle'), info=$('#caseWorkshopInfo'), mdPre=$('#caseWorkshopMd');
  const pdfStage=$('#casePdfStage'),pdfCanvas=$('#casePdfCanvas'),pdfStatus=$('#casePdfStatus'),pdfPageLabel=$('#casePdfPage');
  let current=null, auth=window.CCMHostAuth||null, counts={}, mine=null, mdLoaded=new Set(), drag=null;
  let pdfDoc=null,pdfPage=1,pdfZoom=1,pdfToken=0,pdfRenderTask=null,pdfJsPromise=null,resizeTimer=null;
  const getAuth=()=>auth||window.CCMHostAuth||null;
  const urls=c=>({pdf:BASE+c.key+'.pdf',md:BASE+'interactive-case-script-template.md'});
  async function downloadFile(url,name,kind){
    const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error(`下载失败（${response.status}）`);
    let blob;
    if(kind==='md'){const text=await response.text();blob=new Blob(['\uFEFF',text],{type:'text/markdown;charset=utf-8'});}
    else blob=await response.blob();
    const objectUrl=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=objectUrl;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),2000);
  }
  async function call(action,extra={}){
    const a=getAuth()||{};
    if(!a.id)throw Error('请先从课程主程序登录后再选题。');
    const body={action,assignmentId:ASSIGNMENT,id:a.id,inviteCode:a.inviteCode,...extra};
    const r=await fetch(a.apiUrl||API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),j=await r.json();
    if(!r.ok||!j.ok)throw Error(j.message||'选题服务暂时不可用'); return j;
  }
  function setMsg(text,kind=''){const el=info.querySelector('#caseWorkshopMessage');if(!el)return;el.textContent=text||'';el.className='case-workshop-message '+kind;}
  function updateCards(){
    $$('.case-workshop-btn').forEach(btn=>{const c=CASES.find(x=>x.id===Number(btn.dataset.caseId)),n=counts[c.id]||0,el=btn.querySelector('.case-workshop-cap');el.textContent=`${n} / ${c.cap}人`;el.classList.toggle('full',n>=c.cap);btn.classList.toggle('mine',mine===c.id);});
  }
  async function refresh(){
    try{const [list,own]=await Promise.all([call('topic-choice-list'),call('topic-choice-mine')]);(list.topics||[]).forEach(x=>counts[x.topicId]=x.count);mine=own.topicId==null?null:Number(own.topicId);updateCards();if(current)renderInfo();}
    catch(e){setMsg(e.message,'error');}
  }
  function renderInfo(){
    const c=current,u=urls(c),a=getAuth(),n=counts[c.id]||0,full=n>=c.cap&&!Object.is(mine,c.id),mineText=mine===c.id?'✓ 这是你的选题':'';
    info.innerHTML=`<h3>${c.zh}</h3><div class="en-title">${c.en}</div><div class="case-workshop-tags">${c.tags.map(t=>`<span>${t}</span>`).join('')}</div><p class="case-workshop-desc">${c.desc}</p><div class="case-workshop-status">已选：<b>${n} / ${c.cap}人</b><br>${mineText||'每名学生只能登记一个案例；截止前可以改选。'}</div><div class="case-workshop-actions"><button class="choose" type="button" ${full||!a?.id?'disabled':''}>${mine===c.id?'✓ 已选择本案例':full?'名额已满':'选择本案例'}</button><button class="download" type="button">⬇ 下载案例PDF</button><button class="script" type="button">⬇ 下载通用MD脚本</button></div><div id="caseWorkshopMessage" class="case-workshop-message">${a?.id?'':'请先从课程主程序登录后再登记选题。'}</div>`;
    const fresh=$('#caseWorkshopMessage'); if(fresh){window.requestAnimationFrame(()=>{});} 
    info.querySelector('.choose')?.addEventListener('click',choose);
    info.querySelector('.download')?.addEventListener('click',event=>runDownload(event.currentTarget,u.pdf,c.key+'.pdf','pdf'));
    info.querySelector('.script')?.addEventListener('click',event=>runDownload(event.currentTarget,u.md,'互动视频案例通用制作脚本.md','md'));
  }
  async function runDownload(button,url,name,kind){
    const label=button.textContent;button.disabled=true;button.textContent='正在准备下载…';try{await downloadFile(url,name,kind);}catch(error){setMsg(error.message,'error');}finally{button.disabled=false;button.textContent=label;}
  }
  async function choose(){
    const localMsg=info.querySelector('#caseWorkshopMessage'); const button=info.querySelector('.choose'); button.disabled=true;localMsg.textContent='正在登记…';localMsg.className='case-workshop-message';
    try{const r=await call('topic-choice-set',{topicId:current.id});mine=Number(r.topicId);(r.topics||[]).forEach(x=>counts[x.topicId]=x.count);updateCards();renderInfo();info.querySelector('#caseWorkshopMessage').textContent='✓ 选题登记成功';info.querySelector('#caseWorkshopMessage').className='case-workshop-message ok';}
    catch(e){localMsg.textContent=e.message;localMsg.className='case-workshop-message error';button.disabled=false;}
  }
  async function showMd(c){
    if(mdLoaded.has(c.id))return;mdPre.textContent='正在加载MD脚本…';
    try{const r=await fetch(urls(c).md,{cache:'no-store'});if(!r.ok)throw Error();mdPre.textContent=await r.text();mdLoaded.add(c.id);}catch{mdPre.textContent='MD预览暂时无法加载，请使用左侧“下载MD脚本”。';}
  }
  function ensurePdfJs(){
    if(!pdfJsPromise)pdfJsPromise=import(new URL('pdfjs/pdf.min.mjs',SCRIPT_BASE).href).then(lib=>{lib.GlobalWorkerOptions.workerSrc=new URL('pdfjs/pdf.worker.min.mjs',SCRIPT_BASE).href;return lib;});
    return pdfJsPromise;
  }
  function updatePdfControls(){
    pdfPageLabel.textContent=pdfDoc?`${pdfPage} / ${pdfDoc.numPages}`:'准备加载…';
    $('#casePdfPrev').disabled=!pdfDoc||pdfPage<=1;$('#casePdfNext').disabled=!pdfDoc||pdfPage>=pdfDoc.numPages;
  }
  async function renderPdfPage(){
    if(!pdfDoc)return;const token=pdfToken,pageNumber=pdfPage;
    try{
      pdfRenderTask?.cancel();const page=await pdfDoc.getPage(pageNumber);if(token!==pdfToken)return;
      const natural=page.getViewport({scale:1}),available=Math.max(260,pdfStage.clientWidth-36),fit=Math.min(1.65,available/natural.width),viewport=page.getViewport({scale:fit*pdfZoom}),ratio=Math.min(2,window.devicePixelRatio||1),ctx=pdfCanvas.getContext('2d');
      pdfCanvas.width=Math.floor(viewport.width*ratio);pdfCanvas.height=Math.floor(viewport.height*ratio);pdfCanvas.style.width=`${viewport.width}px`;pdfCanvas.style.height=`${viewport.height}px`;pdfCanvas.classList.add('ready');pdfStatus.hidden=true;
      pdfRenderTask=page.render({canvasContext:ctx,viewport,transform:ratio===1?null:[ratio,0,0,ratio,0,0]});await pdfRenderTask.promise;if(token!==pdfToken)return;updatePdfControls();
    }catch(error){if(error?.name==='RenderingCancelledException')return;pdfStatus.hidden=false;pdfStatus.textContent='PDF页面渲染失败，请使用左侧下载按钮。';pdfCanvas.classList.remove('ready');}
  }
  async function loadPdf(url){
    const token=++pdfToken;pdfPage=1;pdfZoom=1;pdfCanvas.classList.remove('ready');pdfStatus.hidden=false;pdfStatus.textContent='正在加载PDF预览…';pdfPageLabel.textContent='加载中…';
    if(location.protocol==='file:'){pdfStatus.textContent='浏览器禁止在双击打开的本地文件中运行PDF预览。请运行项目根目录的“启动第三章本地预览.cmd”。';pdfPageLabel.textContent='需要本地服务器';return;}
    try{if(pdfDoc){await pdfDoc.destroy();pdfDoc=null;}const lib=await ensurePdfJs(),task=lib.getDocument({url});const doc=await task.promise;if(token!==pdfToken){await doc.destroy();return;}pdfDoc=doc;updatePdfControls();await renderPdfPage();}
    catch(error){if(token!==pdfToken)return;pdfStatus.hidden=false;pdfStatus.textContent='PDF预览加载失败，请检查网络或使用左侧下载按钮。';pdfCanvas.classList.remove('ready');pdfPageLabel.textContent='加载失败';}
  }
  function switchTab(kind){
    $$('.case-workshop-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.caseTab===kind));
    $$('.case-workshop-pane').forEach(p=>p.classList.toggle('active',p.dataset.casePane===kind));
    if(kind==='md'&&current)showMd(current);
  }
  function openCase(id){
    current=CASES.find(c=>c.id===id);if(!current)return;const u=urls(current);title.textContent=`案例${String(current.id).padStart(2,'0')} · ${current.zh}`;mdPre.textContent='点击“MD脚本预览”后加载。';renderInfo();switchTab('pdf');modal.classList.remove('minimized');modal.classList.add('open');loadPdf(u.pdf);refresh();
  }
  $$('.case-workshop-btn').forEach(btn=>btn.addEventListener('click',()=>openCase(Number(btn.dataset.caseId))));
  $$('.case-workshop-tabs button').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.caseTab)));
  $('#caseWorkshopClose').onclick=()=>{modal.classList.remove('open','minimized','fullscreen');pdfToken++;pdfRenderTask?.cancel();pdfDoc?.destroy();pdfDoc=null;pdfCanvas.classList.remove('ready');};
  $('#caseWorkshopMini').onclick=()=>modal.classList.toggle('minimized');
  $('#caseWorkshopFull').onclick=()=>modal.classList.toggle('fullscreen');
  $('#casePdfPrev').onclick=()=>{if(pdfDoc&&pdfPage>1){pdfPage--;renderPdfPage();}};
  $('#casePdfNext').onclick=()=>{if(pdfDoc&&pdfPage<pdfDoc.numPages){pdfPage++;renderPdfPage();}};
  $('#casePdfZoomOut').onclick=()=>{if(pdfDoc){pdfZoom=Math.max(.6,pdfZoom-.15);renderPdfPage();}};
  $('#casePdfZoomIn').onclick=()=>{if(pdfDoc){pdfZoom=Math.min(2.2,pdfZoom+.15);renderPdfPage();}};
  const head=modal.querySelector('.case-workshop-head');
  head.addEventListener('pointerdown',e=>{if(e.target.closest('button')||modal.classList.contains('fullscreen'))return;const r=modal.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};head.setPointerCapture?.(e.pointerId);});
  head.addEventListener('pointermove',e=>{if(!drag)return;modal.style.left=Math.max(0,Math.min(innerWidth-modal.offsetWidth,drag.left+e.clientX-drag.x))+'px';modal.style.top=Math.max(0,Math.min(innerHeight-52,drag.top+e.clientY-drag.y))+'px';});
  head.addEventListener('pointerup',()=>drag=null);head.addEventListener('pointercancel',()=>drag=null);
  window.addEventListener('message',e=>{if(e.data?.type==='CCM_AUTH'){auth=e.data.auth||null;window.CCMHostAuth=auth;updateCards();if(current)renderInfo();refresh();}});
  try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'CCM_AUTH_REQUEST'},'*');}catch{}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))$('#caseWorkshopClose').click();});
  new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(pdfDoc&&modal.classList.contains('open'))renderPdfPage();},180);}).observe(pdfStage);
  updateCards();if(getAuth()?.id)refresh();
})();

