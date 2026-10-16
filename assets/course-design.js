(()=>{'use strict';
const back=document.querySelector('.masthead .back');
if(back&&window.parent!==window){back.textContent='← 返回课程介绍';back.addEventListener('click',event=>{event.preventDefault();window.parent.postMessage({type:'CCM_COURSE_DESIGN_CLOSE'},location.origin);});}
const tabs=[...document.querySelectorAll('[data-tab]')];
const groups={}, remembered={};
function wrap(className,nodes){const el=document.createElement('div');el.className=className;nodes.forEach(n=>el.append(n));return el;}
function heading(title,description=''){const el=document.createElement('div');el.className='section-heading';const h=document.createElement('h2');h.textContent=title;el.append(h);if(description){const p=document.createElement('p');p.textContent=description;el.append(p);}return el;}
const design=document.getElementById('design');
const dh=[...design.querySelectorAll(':scope > .section-heading')], dg=[...design.querySelectorAll(':scope > .gallery')], cases=[...design.querySelectorAll('.case-card')], caseImages=[...dg[0].children], tasks=[...design.querySelectorAll('.task')], taskImages=[...dg[1].children], stages=[...design.querySelectorAll('.stages article')], notes=[...design.querySelectorAll(':scope > .source-note')];
groups.design=[
 ['理念与学习方式',[dh[0],design.querySelector('.principles')]],
 ['案例设计原理',[dh[1],design.querySelector('.flow'),notes[0]]],
 ...cases.map((c,i)=>[['盈塑工业','T 公司','平方轮椅'][i],[wrap('detail-pair',[c,caseImages[[0,2,1][i]]])]]),
 ['AI 开发训练总览',[dh[2],design.querySelector('.statement')]],
 ...tasks.map((t,i)=>[['第一章 · 视频产品','第二章 · 数据应用','第三章 · 互动产品','期末 · 完整应用'][i],[wrap('detail-pair',[t,taskImages[i]])]]),
 ['开发路径 · 设计与实现',[heading('期末开发路径：设计与实现'),wrap('stages',stages.slice(0,4)),notes[1]]],
 ['开发路径 · 测试与交付',[heading('期末开发路径：测试与交付'),wrap('stages',stages.slice(4))]],
 ['学情管理',[wrap('dashboard-detail',[dh[3],design.querySelector('#dashboard-figure')])]]
];
const effects=document.getElementById('effects'),eh=effects.querySelector('.section-heading'), ep=effects.querySelector('.principles'),eg=effects.querySelector('.gallery'),en=effects.querySelector('.source-note');
groups.effects=[['课堂应用观察',[eh,effects.querySelector('.audiences'),effects.querySelector('blockquote')]],['参与与学习过程',[heading('持续参与，呈现学习过程'),ep]],['实践界面与说明',[heading('互动学习与项目实践'),eg,en]]];
const cooperation=document.getElementById('cooperation'),ch=cooperation.querySelector('.section-heading'),cc=[...cooperation.querySelectorAll('.cooperation-grid article')],cn=cooperation.querySelector('.source-note');
groups.cooperation=[['合作方向',[ch,cooperation.querySelector('.statement')]],...cc.map((c,i)=>[['平台授权使用','现有平台改造','定制化课程设计'][i],[wrap('single-cooperation',[c])]]),['实施与授权说明',[heading('明确范围，协商实施'),cn]]];
Object.entries(groups).forEach(([id,items])=>{
 const panel=document.getElementById(id);panel.replaceChildren();panel.classList.add('workspace');
 const nav=document.createElement('nav');nav.className='subnav';nav.setAttribute('aria-label',tabs.find(t=>t.dataset.tab===id).textContent.trim()+'子导航');
 const stage=document.createElement('div');stage.className='content-stage';
 items.forEach(([label,nodes],index)=>{
 const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.topic=String(index);button.id=id+'-topic-'+index;button.setAttribute('aria-controls',id+'-content-'+index);button.addEventListener('click',()=>select(id,index,true));nav.append(button);
 const content=document.createElement('section');content.className='topic-content';content.id=id+'-content-'+index;content.setAttribute('role','region');content.setAttribute('aria-labelledby',button.id);content.append(...nodes);stage.append(content);
 });panel.append(nav,stage);
});
function select(id,index,update=false){
 if(!groups[id])id='design';index=Number.isInteger(index)?index:(remembered[id]||0);if(index<0||index>=groups[id].length)index=0;remembered[id]=index;
 tabs.forEach(t=>{const active=t.dataset.tab===id;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.dataset.tab).hidden=!active;});
 const panel=document.getElementById(id);panel.querySelectorAll('.subnav button').forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});panel.querySelectorAll('.topic-content').forEach((c,i)=>{c.hidden=i!==index;if(i===index)c.scrollTop=0;});
 if(update)history.replaceState(null,'','#'+id+'/'+index);
}
function readHash(){const [id,index]=location.hash.slice(1).split('/');select(id,index===undefined?undefined:Number(index));}
 tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>select(tab.dataset.tab,undefined,true));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();tabs[next].focus();select(tabs[next].dataset.tab,undefined,true);}});});
 readHash();window.addEventListener('hashchange',readHash);
const dialog=document.getElementById('image-dialog');document.querySelectorAll('.image-open').forEach(button=>button.addEventListener('click',()=>{const source=button.querySelector('img');dialog.querySelector('img').src=source.src;dialog.querySelector('img').alt=source.alt;dialog.querySelector('p').textContent=button.closest('figure').querySelector('figcaption').textContent;dialog.showModal();}));document.getElementById('image-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
})();
