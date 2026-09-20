(()=>{
  const button=document.createElement('button');
  button.id='ccmDimensionLauncher';
  button.type='button';
  button.textContent='📊 维度查询 / Index';
  button.setAttribute('aria-label','打开跨文化维度指数查询 / Open cultural dimensions index');
  document.body.append(button);
  const target='https://steven2025.github.io/CCM/chapters/culture-dimention.html';
  const currentSlide=()=>document.querySelector('.slide:not([hidden])');
  const update=()=>{
    const n=Number(currentSlide()?.dataset.slide||0);
    button.hidden=n<8;
  };
  button.addEventListener('click',()=>{
    if(typeof window.CCMOpenTaskModal==='function') window.CCMOpenTaskModal(target,'跨文化维度指数查询 / Cultural Dimensions Index');
    else window.open(target,'_blank','noopener');
  });
  update();
  new MutationObserver(update).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','class']});
})();