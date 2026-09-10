(() => {
  'use strict';
  const {papers,branches,questions} = window.ATLAS_DATA;
  const state={view:'tree',branch:'evolution',paper:'dgm',question:'all',query:'',collapsed:false,zoom:1};
  const $=(s)=>document.querySelector(s);
  const $$=(s)=>[...document.querySelectorAll(s)];
  const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons={tree:'<path d="M5 3v14M5 5h10M5 11h10M5 17h10"/><rect x="15" y="3" width="4" height="4" rx="1"/><rect x="15" y="9" width="4" height="4" rx="1"/><rect x="15" y="15" width="4" height="4" rx="1"/>',papers:'<path d="M6 4H3v15h12v-3"/><rect x="7" y="1" width="12" height="14" rx="1.5"/><path d="M10 5h6M10 8h6M10 11h3"/>',question:'<circle cx="11" cy="11" r="8"/><path d="M8.7 8.3c.4-2.6 5-2.6 4.7.3-.1 1.8-2.5 1.7-2.5 3.8M11 15.5h.01"/>',search:'<circle cx="9" cy="9" r="6"/><path d="m13.5 13.5 5 5"/>',fit:'<path d="M3 8V3h5M14 3h5v5M19 14v5h-5M8 19H3v-5"/>',compass:'<circle cx="11" cy="11" r="9"/><path d="m14.8 7.2-2.1 5.5-5.5 2.1 2.1-5.5z"/>'};
  function renderIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{const path=icons[el.dataset.icon];if(path)el.innerHTML=`<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;});}
  const statuses={tested:'已测试',mechanism:'机制支持',unknown:'待核查',outside:'不涉及'};
  const badge=(e)=>`<span class="evidence-status ${esc(e.status)}" title="${esc(e.note)}">${statuses[e.status]}</span>`;
  const relevant=(p)=>state.question==='all'||['tested','mechanism'].includes(p.evidence[state.question].status);
  const getPaper=(id)=>papers.find(p=>p.id===id);
  function announce(s){$('#live-status').textContent=s;}
  function setView(view){state.view=view;['tree','papers','questions'].forEach(v=>$('#'+v+'-view').hidden=v!==view);$$('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});$('#breadcrumb-view').textContent={tree:'文献分类树',papers:'文献索引',questions:'研究问题'}[view];if(view==='papers')renderPapers();if(view==='questions')renderQuestions();}
  function selectBranch(id){if(!branches[id])return;state.branch=id;state.paper=branches[id].papers[0];state.query='';$('#search').value='';setView('tree');if(['iterative','evolution','memory'].includes(id)&&state.collapsed)toggleBranches(false);renderTree();renderInspector();announce(`已选择${branches[id].title}，${branches[id].papers.length}篇文献`);}
  function selectPaper(id){const p=getPaper(id);if(!p)return;state.paper=id;state.branch=p.branch;renderInspector();renderTree();if(state.view==='papers')renderPapers();announce(`已选择 ${p.name}，详情中可阅读研究证据`);}
  function renderTree(){
    $$('[data-node]').forEach(el=>{el.classList.toggle('selected',el.dataset.node===state.branch);el.setAttribute('aria-pressed',String(el.dataset.node===state.branch));const ids=branches[el.dataset.node].papers;el.classList.toggle('dim',state.question!=='all'&&!ids.some(id=>relevant(getPaper(id))));});
    $$('[data-connection]').forEach(el=>el.classList.toggle('selected-path',el.dataset.connection===state.branch||(el.dataset.connection==='harness'&&['iterative','evolution','memory'].includes(state.branch))));
    const q=questions.find(x=>x.id===state.question);
    $('#view-insight').innerHTML=q?`<span data-icon="compass"></span><div><strong>${esc(q.title)}</strong><p>${esc(q.criterion)} 淡化分支暂未标注直接相关机制。</p></div>`:'<span data-icon="compass"></span><div><strong>从分支进入文献</strong><p>选择一个改进方法，查看它保留了什么，以及有哪些可核查的研究证据。</p></div>';
    renderIcons($('#view-insight'));
  }
  function renderInspector(){
    const b=branches[state.branch];const p=getPaper(state.paper);const related=b.papers.map(getPaper);
    $('#inspector').innerHTML=`<div class="inspector-inner"><div class="detail-eyebrow"><span>分支详情</span><span>${esc(b.code)}</span></div><h2>${esc(b.title)}</h2><p class="branch-summary">${esc(b.summary)}</p><div class="branch-labels">${b.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div>
      <section class="inspector-section"><div class="section-label"><span>代表文献</span><span>${related.length} PAPERS</span></div><div class="related-papers">${related.map(x=>`<button class="related-paper ${x.id===p.id?'active':''}" data-paper="${x.id}" aria-pressed="${x.id===p.id}"><div><strong>${esc(x.name)}</strong><small>${x.year} · ${esc(x.targets.slice(0,2).join(' / '))}</small></div><span>${x.id===p.id?'↗':x.year}</span></button>`).join('')}</div></section>
      <section class="inspector-section"><div class="paper-detail-header"><h3>${esc(p.name)}</h3><span>${p.year}</span></div><p class="paper-title">${esc(p.title)}</p><p class="mechanism-copy">${esc(p.mechanism)}</p><div class="section-label"><span>三个问题的证据</span><span>初步标注</span></div><div class="evidence-stack">${questions.map(q=>`<div class="evidence-item ${state.question===q.id?'focus':''}"><div class="evidence-item-top"><span class="q-label">${q.id.toUpperCase()}</span><strong>${esc(q.short)}</strong>${badge(p.evidence[q.id])}</div><p>${esc(p.evidence[q.id].note)}</p></div>`).join('')}</div>${p.limitation?`<p class="source-note">研究边界：${esc(p.limitation)}</p>`:''}<a class="source-link" href="${esc(p.source||p.paper)}" target="_blank" rel="noopener noreferrer"><span>阅读原始论文，核查证据</span><span aria-hidden="true">↗</span></a><p class="source-note">“机制支持”不等于因果验证；“已测试”仅指所述实验范围。年份按预印本首次提交。</p></section>`;
  }
  function visiblePapers(){const q=state.query.trim().toLowerCase();return papers.filter(p=>relevant(p)&&(!q||[p.name,p.title,p.mechanism,p.year,branches[p.branch].title,...p.targets,...Object.values(p.evidence).map(e=>e.note)].join(' ').toLowerCase().includes(q)));}
  function renderPapers(){const list=visiblePapers();$('#result-count').textContent=`${list.length} / ${papers.length} 篇`;
    $('#paper-list').innerHTML=list.length?list.map(p=>`<button class="index-card ${p.id===state.paper?'active':''}" data-paper="${p.id}" aria-pressed="${p.id===state.paper}"><div class="index-card-top"><h3>${esc(p.name)}</h3><span>${p.year} ↗</span></div><div class="full-title">${esc(p.title)}</div><p>${esc(p.mechanism)}</p><div class="index-card-bottom"><div class="branch-labels">${p.targets.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><span>${esc(branches[p.branch].title)}</span></div></button>`).join(''):`<div class="empty-state"><strong>没有找到匹配的文献</strong><p>尝试论文名称、工具、记忆或代码等关键词。<br>研究视角也会影响当前结果。</p><button class="clear-search" id="clear-search">重置查找与视角</button></div>`;
  }
  function renderQuestions(){
    $('#research-questions').innerHTML=questions.map(q=>`<article class="research-card ${state.question===q.id?'active':''}"><span class="research-q">${q.id.toUpperCase()} / RESEARCH QUESTION</span><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p><p class="criterion">${esc(q.criterion)}</p></article>`).join('');
    $('#evidence-rows').innerHTML=papers.map(p=>`<tr><td><button data-paper="${p.id}">${esc(p.name)}</button></td>${questions.map(q=>`<td>${badge(p.evidence[q.id])}</td>`).join('')}</tr>`).join('');
  }
  function setQuestion(id){state.question=id;$$('[data-question]').forEach(b=>{b.classList.toggle('active',b.dataset.question===id);b.setAttribute('aria-pressed',String(b.dataset.question===id));});renderTree();renderInspector();if(state.view==='papers')renderPapers();if(state.view==='questions')renderQuestions();announce(id==='all'?'显示全部改进机制':`研究视角：${questions.find(q=>q.id===id).short}`);}
  function toggleBranches(collapse=!state.collapsed){state.collapsed=collapse;$('#method-nodes').hidden=collapse;$('#harness-connections').style.display=collapse?'none':'';$('#method-axis').hidden=collapse;$('#toggle-branches').innerHTML=collapse?'展开 Harness <span>+</span>':'收起 Harness <span>−</span>';$('#toggle-branches').setAttribute('aria-expanded',String(!collapse));$('.node-expansion').innerHTML=`3 个方法分支 <span>${collapse?'+':'−'}</span>`;announce(collapse?'Harness 方法分支已收起':'Harness 方法分支已展开');}
  function zoom(delta){state.zoom=Math.max(.75,Math.min(1.5,Math.round((state.zoom+delta)*100)/100));$('#tree-stage').style.zoom=state.zoom;$('#zoom-label').textContent=Math.round(state.zoom*100)+'%';$('#zoom-out').disabled=state.zoom<=.75;$('#zoom-in').disabled=state.zoom>=1.5;}
  document.addEventListener('click',e=>{
    const el=e.target.closest('button');if(!el)return;
    if(el.dataset.view){state.query='';$('#search').value='';setView(el.dataset.view);return;}
    if(el.dataset.select){selectBranch(el.dataset.select);return;}
    if(el.dataset.node){selectBranch(el.dataset.node);return;}
    if(el.dataset.paper){selectPaper(el.dataset.paper);return;}
    if(el.dataset.question){setQuestion(el.dataset.question);return;}
    if(el.id==='toggle-branches')toggleBranches();
    if(el.id==='zoom-in')zoom(.1);
    if(el.id==='zoom-out')zoom(-.1);
    if(el.id==='zoom-reset'){state.zoom=1;zoom(0);$('#canvas-viewport').scrollTo({left:0,top:0,behavior:'auto'});}
    if(el.id==='clear-search'){state.query='';$('#search').value='';setQuestion('all');renderPapers();$('#search').focus();}
  });
  $('#search').addEventListener('input',e=>{state.query=e.target.value;setView('papers');});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus();}if(e.key==='Escape'&&document.activeElement===$('#search')){state.query='';$('#search').value='';renderPapers();$('#search').blur();}});
  renderIcons();renderTree();renderInspector();setView('tree');
})();
