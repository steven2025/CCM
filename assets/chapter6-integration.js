(() => {
  'use strict';
  let auth=null;
  const ids=['c6_hw1','c6_hw2_local','c6_hw3','c6_hw4'];
  async function api(action,extra={}){
    if(!auth?.id||!auth.inviteCode)throw new Error('请先在主程序登录');
    const r=await fetch(auth.apiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:auth.id,inviteCode:auth.inviteCode,...extra})});
    const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.message||'提交失败');return j;
  }
  window.addEventListener('message',async e=>{
    if(e.source!==parent||e.data?.type!=='CCM_AUTH'||e.origin!==location.origin)return;
    auth=e.data.auth;window.CCMHostAuth=auth;window.dispatchEvent(new CustomEvent('ccm-auth-ready'));
    document.querySelectorAll('iframe').forEach(f=>{try{if(new URL(f.src,location.href).origin===location.origin)f.contentWindow.postMessage({type:'CCM_AUTH',auth},location.origin);}catch{}});
    try{const j=await api('chapter-notes-list',{chapterId:'chapter-6-reflections'});ids.forEach(id=>{if(j.notes?.[id])document.getElementById(id).value=j.notes[id].text||'';});}catch(e){console.warn(e.message);}
  });
  if(parent!==window)parent.postMessage({type:'CCM_AUTH_REQUEST'},location.origin);
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin||e.data?.type!=='CCM_AUTH_REQUEST')return;
    const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===e.source);
    if(frame&&auth)e.source.postMessage({type:'CCM_AUTH',auth},location.origin);
  });
  document.querySelectorAll('.hs-think-submit').forEach(b=>b.addEventListener('click',async()=>{
    const status=b.parentElement.querySelector('.hs-think-status');
    try{
      if(auth?.role!=='student')throw new Error('请使用学生账号提交');
      const notes={};ids.forEach(id=>notes[id]={text:document.getElementById(id)?.value||''});
      b.disabled=true;await api('chapter-notes-save',{chapterId:'chapter-6-reflections',notes});
      if(status)status.textContent='✓ 已保存到 COS · '+auth.name;
    }catch(e){if(status)status.textContent=e.message;}finally{b.disabled=false;}
  }));
  window.uploadVideoHook=async blob=>{
    if(auth?.role!=='student')throw new Error('请使用学生账号提交');
    const type=blob.type.split(';')[0],ext=type==='video/mp4'?'mp4':'webm';
    const init=await api('assignment-upload-init',{assignmentId:'course-reflection-video',fileName:`${auth.name}_${auth.className||auth.classId}.${ext}`,size:blob.size,contentType:type});
    const r=await fetch(init.uploadUrl,{method:'PUT',headers:init.requiredHeaders,body:blob});if(!r.ok)throw new Error('视频上传失败');
    const completed=await api('assignment-upload-complete',{submissionId:init.submissionId});
    const record=completed.submission;
    if(!record||record.submissionId!==init.submissionId||record.status!=='submitted'||!record.submittedAt)throw new Error('云端未返回有效提交确认，请重试');
    return {submissionId:record.submissionId,submittedAt:record.submittedAt,fileName:record.objectKey.split('/').pop(),name:record.name};
  };
})();
