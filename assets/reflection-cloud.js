(() => {
 'use strict';
 let auth=null;
 const chapter=document.body.dataset.reflectionChapter;
 const pending=new Map();
 async function request(action,extra={}){
  if(!auth?.id||!auth.inviteCode)throw Error('请先登录主程序 / Please log in');
  if(action.endsWith('save')&&(auth.role!=='student'||auth.readOnly))throw Error('仅学生可提交 / Student account required');
  const r=await fetch(auth.apiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:auth.id,inviteCode:auth.inviteCode,chapterId:chapter,...extra})});
  const j=await r.json();if(!r.ok||!j.ok)throw Error(j.message||'保存失败');return j;
 }
 const load=async()=>{const j=await request('chapter-notes-list');return Object.fromEntries(Object.entries(j.notes||{}).map(([k,v])=>[k,v.text||'']));};
 let queue=Promise.resolve();
 window.CCMReflection={load,save(qid,text){pending.set(qid,text);const operation=queue.catch(()=>{}).then(async()=>{const j=await request('chapter-notes-list');const notes={...(j.notes||{}),[qid]:{text,updatedAt:new Date().toISOString()}};await request('chapter-notes-save',{notes});pending.delete(qid);return true;});queue=operation;return operation;},identity:()=>auth};
 window.addEventListener('message',async e=>{
  if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='CCM_AUTH')return;
  auth=e.data.auth;window.CCMHostAuth=auth;window.dispatchEvent(new CustomEvent('ccm-auth-ready'));
  if(chapter==='chapter-5-reflections')try{const values=await load();['hw1','hw2','hw3'].forEach(id=>{const el=document.getElementById(id);if(el&&values[id]!==undefined&&document.activeElement!==el)el.value=values[id];});}catch(e){console.warn(e.message);}
 });
 if(parent!==window)parent.postMessage({type:'CCM_AUTH_REQUEST'},location.origin);
 document.querySelectorAll('.reflect-submit').forEach(b=>b.onclick=async()=>{const id=b.dataset.q,ta=document.getElementById(id),status=document.getElementById(id+'status');if(!ta.value.trim())return ta.focus();b.disabled=true;status.textContent='正在提交…';try{await window.CCMReflection.save(id,ta.value);status.textContent='✓ 已保存到 COS · '+auth.name;}catch(e){status.textContent='⚠ '+e.message+'；当前文字保留在页面，请重试';}finally{b.disabled=false;}});
})();
