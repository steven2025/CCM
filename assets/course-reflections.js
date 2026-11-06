(() => {
 const API='https://1311686407-1ngfs1nlvf.ap-guangzhou.tencentscf.com';
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function request(){
   const a=JSON.parse(localStorage.getItem('ccm_auth_user_v2')||'null');if(!a?.id)throw Error('请先登录主程序');
   const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'assignment-gallery',id:a.id,inviteCode:localStorage.getItem('ccm_invite_code'),reflectionOnly:true,classId:'*'})});
   const j=await r.json();if(!r.ok||!j.ok)throw Error(j.message||'读取失败');return j;
 }
 document.addEventListener('click',async e=>{
   if(!e.target.closest('[data-reflection-load]'))return;
   const b=e.target.closest('[data-reflection-load]'),box=b.parentElement.querySelector('[data-reflection-list]');
   b.disabled=true;box.textContent='正在读取…';
   try{const j=await request();box.replaceChildren();const classes=new Map((j.classes||[]).map(c=>[c.classId,c.name]));
     const groups=Map.groupBy(j.rows||[],r=>r.classId);
     if(!groups.size)box.textContent='暂无审核通过的课程感悟视频';
     for(const [id,rows] of groups){const d=document.createElement('details');const summary=document.createElement('summary');summary.textContent='📁 '+(classes.get(id)||id||'未分班');d.append(summary);
       rows.sort((a,b)=>a.name.localeCompare(b.name,'zh')).forEach(row=>{const btn=document.createElement('button');btn.textContent=row.name;btn.style.cssText='margin:8px;padding:10px 16px;cursor:pointer';btn.onclick=()=>play(row,classes.get(id)||id);d.append(btn);});box.append(d);}
   }catch(e){box.textContent=e.message;}finally{b.disabled=false;}
 });
 function play(row,cls){
   const panel=document.createElement('section');panel.style.cssText='position:fixed;left:12%;top:12%;width:76%;height:72%;z-index:99999;background:#0f172a;border:1px solid #64748b;border-radius:16px;resize:both;overflow:auto;min-width:300px;min-height:240px;box-shadow:0 20px 80px #0009;color:white;display:flex;flex-direction:column';
   panel.innerHTML=`<header style="padding:12px;cursor:move;display:flex;gap:12px"><strong style="flex:1">${esc(row.name)} · ${esc(cls)}</strong><button data-max>放大/缩回</button><button data-full>全屏</button><button data-close>关闭</button></header><div data-player style="position:relative;flex:1;min-height:0;background:black"><video controls playsinline style="width:100%;height:100%"></video><span style="position:absolute;top:16px;left:16px;background:#0009;color:white;padding:6px 10px;pointer-events:none">${esc(row.name)} · ${esc(cls)}</span></div>`;
   document.body.append(panel);const video=panel.querySelector('video');video.src=row.fileUrl;
   panel.querySelector('[data-close]').onclick=()=>{video.pause();panel.remove();};
   let saved=null;panel.querySelector('[data-max]').onclick=()=>{if(saved){Object.assign(panel.style,saved);saved=null;}else{saved={left:panel.style.left,top:panel.style.top,width:panel.style.width,height:panel.style.height};Object.assign(panel.style,{left:'0',top:'0',width:'100%',height:'100%'});}};
   panel.querySelector('[data-full]').onclick=()=>panel.querySelector('[data-player]').requestFullscreen?.();
   let drag;const head=panel.querySelector('header');head.onpointerdown=e=>{if(e.target.closest('button'))return;const r=panel.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,l:r.left,t:r.top};head.setPointerCapture(e.pointerId);};head.onpointermove=e=>{if(drag){panel.style.left=Math.max(0,drag.l+e.clientX-drag.x)+'px';panel.style.top=Math.max(0,drag.t+e.clientY-drag.y)+'px';}};head.onpointerup=head.onpointercancel=()=>drag=null;
 }
})();
