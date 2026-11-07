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
    if(!blob.size||blob.size>100*1024*1024)throw new Error('视频文件须大于0且不超过100MB');
    const type=blob.type.split(';')[0],ext=type==='video/mp4'?'mp4':'webm';
    if(!['video/mp4','video/webm'].includes(type))throw new Error('仅支持MP4、WebM视频');
    const init=await api('assignment-upload-init',{assignmentId:'course-reflection-video',fileName:`${auth.name}_${auth.className||auth.classId}.${ext}`,size:blob.size,contentType:type});
    await new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();xhr.open('PUT',init.uploadUrl);
      Object.entries(init.requiredHeaders).forEach(([k,v])=>xhr.setRequestHeader(k,v));
      xhr.upload.onprogress=e=>{const p=document.getElementById('rvUploadProgress');if(p){p.style.display='block';p.value=e.lengthComputable?e.loaded/e.total*100:0;}};
      xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('视频上传失败 HTTP '+xhr.status));
      xhr.onerror=()=>reject(new Error('网络错误，请重试'));xhr.timeout=600000;xhr.ontimeout=()=>reject(new Error('上传超时，请重试'));xhr.send(blob);
    });
    const completed=await api('assignment-upload-complete',{submissionId:init.submissionId});
    const record=completed.submission;
    if(!record||record.submissionId!==init.submissionId||record.status!=='submitted'||!record.submittedAt)throw new Error('云端未返回有效提交确认，请重试');
    return {submissionId:record.submissionId,submittedAt:record.submittedAt,fileName:record.objectKey.split('/').pop(),name:record.name};
  };
  const input=document.getElementById('rvFile'),button=document.getElementById('rvFileSubmit'),preview=document.getElementById('rvFilePreview'),info=document.getElementById('rvFileInfo'),status=document.getElementById('rvFileStatus');
  let selected=null,url=null;
  if(input)input.onchange=()=>{selected=null;button.disabled=true;if(url)URL.revokeObjectURL(url);preview.removeAttribute('src');preview.style.display='none';status.textContent='';const f=input.files[0];if(!f)return;
    info.textContent=f.name+' · '+(f.size/1024/1024).toFixed(2)+'MB';
    if(!f.size||f.size>100*1024*1024){status.textContent='文件须大于0且不超过100MB';return;}
    if(!['video/mp4','video/webm'].includes(f.type)){status.textContent='请选择MP4或WebM视频';return;}
    selected=f;url=URL.createObjectURL(f);preview.src=url;preview.style.display='block';button.disabled=false;
  };
  if(button)button.onclick=async()=>{if(!selected)return;button.disabled=true;input.disabled=true;status.textContent='正在上传，请勿关闭页面…';try{const r=await window.uploadVideoHook(selected);status.textContent='✓ COS已确认提交成功 · '+r.name+' · '+new Date(r.submittedAt).toLocaleString()+' · 提交编号：'+r.submissionId+'。待教师审核后展示。';selected=null;}catch(e){status.textContent='上传失败：'+e.message;button.disabled=false;}finally{input.disabled=false;}};
})();
