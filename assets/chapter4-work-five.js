(() => {
 const root=document.querySelector('[data-work5]');if(!root)return;
 const tasks={
 mba:[
 ['项目验收会','下周有个<strong>项目验收会</strong>，请安排评审专家，并组织会议。'],
 ['员工吐槽大会','下个月要开展我公司第一届<strong>“员工吐槽大会”</strong>。'],
 ['税务检查接待与汇报','税务局来我司检查<strong>税务信息化建设工作</strong>，请安排接待和汇报。'],
 ['新员工入职培训','新入职<strong>6名大学生</strong>，请做好他们的入职培训工作。'],
 ['大客户流失应对','信息反馈得知公司有几个<strong>大客户有被对手挖走的倾向</strong>，请拿出对策并立即实施。']
 ],
 undergraduate:[
 ['材料创新设计大赛','学院要举办<strong>“材料创新设计大赛”</strong>，面向全校学生征集作品。你作为<strong>学生会竞赛部部长</strong>，需要安排下属<em>A干事</em>负责大赛全流程筹备。'],
 ['毕业晚会与毕业市集','下个月毕业季临近，学院要为应届毕业生举办<strong>送毕晚会＋毕业市集</strong>活动。你作为<strong>学生会文艺部／外联部部长</strong>，需要安排<em>干事B</em>推进活动落地。'],
 ['新生入学系列工作','9月新生入学，学院要完成<strong>新生报到、迎新晚会、专业认知教育、新生破冰</strong>等系列工作。你作为<strong>学生会主席团／迎新负责人</strong>，需要安排<em>部长C</em>推进。'],
 ['暑期企业参访调研','学院计划组织暑期社会实践团，前往本地材料类龙头企业（如重庆长安新能源、西南铝业等）参访调研。你作为<strong>实践团负责人／学生会实践部部长</strong>，需要安排<em>干事D</em>推进。'],
 ['材料科学主题展区','学校要举办<strong>“校园科普文化节”</strong>，材料学院需承办<strong>“材料科学主题展区”</strong>，面向全校师生科普材料知识、展示专业成果。你作为<strong>学院科协／学生会负责人</strong>，需要安排<em>干事E</em>推进。']
 ]};
 const colors=[['#216889','#e1f2fc'],['#99651a','#fff0cb'],['#28765e','#dff4e9'],['#73519c','#eee5fa'],['#a34757','#ffe4eb']];
 let audience='mba';const selected={mba:0,undergraduate:0};
 const card=root.querySelector('[data-work5-card]');
 function render(){const index=selected[audience],task=tasks[audience][index];root.querySelectorAll('[data-work5-audience]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.work5Audience===audience)));root.querySelectorAll('[data-work5-task]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.work5Task===index)));card.style.setProperty('--task-accent',colors[index][0]);card.style.setProperty('--task-bg',colors[index][1]);card.innerHTML='<span class="work5-task-meta">'+(audience==='mba'?'MBA学员':'本科生')+' · 任务 '+(index+1)+' / 5</span><h3>'+task[0]+'</h3><p>'+task[1]+'</p>';card.scrollTop=0;}
 root.querySelectorAll('[data-work5-audience]').forEach(b=>b.onclick=()=>{audience=b.dataset.work5Audience;render()});root.querySelectorAll('[data-work5-task]').forEach(b=>b.onclick=()=>{selected[audience]=+b.dataset.work5Task;render()});render();
 const video=root.querySelector('video');new MutationObserver(()=>{if(!root.classList.contains('active'))video.pause()}).observe(root,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause()});
})();
