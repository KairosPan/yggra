(() => {
  'use strict';
  const {papers,branches,questions}=window.ATLAS_DATA, model=window.AtlasState;
  let state=model.fromParams(new URLSearchParams(location.search));
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons={tree:'<path d="M5 3v14M5 5h10M5 11h10M5 17h10"/><rect x="15" y="3" width="4" height="4" rx="1"/><rect x="15" y="9" width="4" height="4" rx="1"/><rect x="15" y="15" width="4" height="4" rx="1"/>',papers:'<path d="M6 4H3v15h12v-3"/><rect x="7" y="1" width="12" height="14" rx="1.5"/><path d="M10 5h6M10 8h6M10 11h3"/>',question:'<circle cx="11" cy="11" r="8"/><path d="M8.7 8.3c.4-2.6 5-2.6 4.7.3-.1 1.8-2.5 1.7-2.5 3.8M11 15.5h.01"/>',search:'<circle cx="9" cy="9" r="6"/><path d="m13.5 13.5 5 5"/>',fit:'<path d="M3 8V3h5M14 3h5v5M19 14v5h-5M8 19H3v-5"/>',compass:'<circle cx="11" cy="11" r="9"/><path d="m14.8 7.2-2.1 5.5-5.5 2.1 2.1-5.5z"/>'};
  const statuses={tested:'Tested',mechanism:'Mechanism',unknown:'Unverified',outside:'Out of scope'};
  const getPaper=id=>papers.find(p=>p.id===id);
  const href=patch=>model.toQuery({...state,...patch});
  const relevant=p=>state.question==='all'||window.ATLAS_DATA.question_filter.included_statuses.includes(p.evidence[state.question].status);
  const badge=e=>`<span class="evidence-status ${e.status}" data-evidence-status="${e.status}" title="${esc(e.note)}">${statuses[e.status]}</span>`;
  function iconsIn(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{if(icons[el.dataset.icon])el.innerHTML=`<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[el.dataset.icon]}</svg>`;});}
  function update(patch,{replace=false,announce=''}={}){state=model.normalize({...state,...patch});history[replace?'replaceState':'pushState'](null,'',href({}));render();if(announce)$('#live-status').textContent=announce;}
  function drawConnections(){
    if(state.view!=='tree')return;
    const root=$('[data-node="all"]'),harness=$('[data-node="harness"]');
    $$('[data-connection]').forEach(path=>{const id=path.dataset.connection,dest=$(`[data-node="${id}"]`),source=['iterative','evolution','memory'].includes(id)?harness:root;if(!dest||dest.closest('[hidden]'))return;const x1=source.offsetLeft+source.offsetWidth,y1=source.offsetTop+source.offsetHeight/2,x2=dest.offsetLeft,y2=dest.offsetTop+dest.offsetHeight/2,mid=(x1+x2)/2;path.setAttribute('d',`M${x1} ${y1} C${mid} ${y1},${mid} ${y2},${x2} ${y2}`);});
  }
  function renderCapabilities(){
    const root=branches.capabilities, routes=Object.values(branches).filter(b=>b.pathway);
    $('#capability-tree').innerHTML=`<div class="capability-heading"><div><span class="eyebrow">CAPABILITY LENS / 04</span><h2><a data-node="capabilities" id="branch-capabilities" data-action="select-branch" href="?view=tree&amp;branch=capabilities">${esc(root.title)}</a></h2><p>Six research routes, from observations to reasoning and action.</p></div><a class="pathway-overview-link" href="./pathways.html">Read the routes ↗</a></div><div class="capability-grid">${routes.map((b,i)=>`<a class="capability-node" id="branch-${b.id}" data-node="${b.id}" data-action="select-branch" href="?view=tree&amp;branch=${b.id}"><span class="pathway-number">0${i+1}</span><strong>${esc(b.title)}</strong><span>${esc(b.pathway.stages[0].title)} → ${esc(b.pathway.stages.at(-1).title)}</span><small>${b.papers.length?b.papers.length+' seed readings':'Readings TBD'} <span aria-hidden="true">↗</span></small></a>`).join('')}</div><p class="capability-scope">Editorial capability targets. Stage order does not represent ancestry or demonstrated self-improvement.</p>`;
    $('#nav-paper-count').textContent=papers.length;
    $('#seed-paper-count').textContent=String(papers.length).padStart(2,'0');
    $('#root-paper-count').textContent=`${papers.length} seed papers`;
  }
  function pathwayDetail(b){
    if(!b.pathway)return b.id==='capabilities'?'<a class="source-link" href="./pathways.html">Read all six capability pathways ↗</a>':'';
    const r=b.pathway,course=window.ATLAS_DATA.course_sources.find(c=>c.id===r.course_source_id);
    return `<section class="inspector-section pathway-inspector"><div class="section-label">CAPABILITY ROUTE · EDITORIAL</div><ol class="pathway-stages">${r.stages.map(step=>`<li><span>${esc(step.title)}</span></li>`).join('')}</ol><h3>Suggested evaluation</h3><p>${esc(r.suggested_evaluation)}</p><h3>Improvement hypothesis</h3><p>${esc(r.improvement_hypothesis)}</p><div class="document-links">${r.related_method_ids.map(id=>`<a href="${esc(href({view:'tree',branch:id,paper:branches[id].papers[0],question:'all'}))}" data-action="select-branch" data-select="${id}">${esc(branches[id].title)} ↗</a>`).join('')}</div><p class="source-note">${esc(r.stage_order_semantics)}</p><p class="source-note">${esc(r.reading_status)}</p><a class="source-link" href="${esc(course.url)}#schedule">Course lectures ${r.course_lectures.join(', ')} ↗</a><a class="source-link" href="./pathways.html#${b.id}">Read the complete pathway ↗</a></section>`;
  }
  function renderTree(){
    $$('[data-node]').forEach(el=>{const id=el.dataset.node,active=id===state.branch;el.classList.toggle('selected',active);if(active)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');el.setAttribute('aria-label',`${branches[id].title}: ${branches[id].papers.length} papers. Show branch details.`);el.href=href({view:'tree',branch:id,paper:branches[id].papers[0]||null,query:''});el.classList.toggle('dim',state.question!=='all'&&!branches[id].papers.some(id=>relevant(getPaper(id))));});
    $$('[data-connection]').forEach(el=>el.classList.toggle('selected-path',el.dataset.connection===state.branch||(el.dataset.connection==='harness'&&['iterative','evolution','memory'].includes(state.branch))));
    $('#method-nodes').hidden=state.collapsed;$('#harness-connections').style.display=state.collapsed?'none':'';$('#method-axis').hidden=state.collapsed;
    $('#toggle-branches').innerHTML=state.collapsed?'Expand harness <span>+</span>':'Collapse harness <span>−</span>';$('#toggle-branches').setAttribute('aria-expanded',String(!state.collapsed));$('.node-expansion').innerHTML=`3 method families <span>${state.collapsed?'+':'−'}</span>`;
    $('#tree-stage').style.zoom=state.zoom;$('#zoom-label').textContent=Math.round(state.zoom*100)+'%';$('#zoom-out').disabled=state.zoom<=.75;$('#zoom-in').disabled=state.zoom>=1.5;
    const q=questions.find(q=>q.id===state.question);$('#view-insight').innerHTML=q?`<span data-icon="compass"></span><div><strong>${esc(q.title)}</strong><p>${esc(q.criterion)}</p></div>`:'<span data-icon="compass"></span><div><strong>Explore a method family</strong><p>Select a branch to inspect its mechanisms, papers, and evidence.</p></div>';iconsIn($('#view-insight'));
  }
  function paperLink(p,context){return `<a class="related-paper ${p.id===state.paper?'active':''}" id="${context}-${p.id}" data-action="select-paper" data-paper-id="${p.id}" href="${esc(href({paper:p.id,branch:state.branch}))}" ${p.id===state.paper?'aria-current="true"':''}><div><strong>${esc(p.name)}</strong><small>${p.year} · ${esc(p.targets.slice(0,2).join(' / '))}</small></div><span aria-hidden="true">↗</span></a>`;}
  function renderInspector(){
    const b=branches[state.branch],p=getPaper(state.paper);$('#inspector').dataset.branchId=state.branch;if(p)$('#inspector').dataset.paperId=p.id;else delete $('#inspector').dataset.paperId;
    $('#inspector').innerHTML=`<div class="inspector-inner"><div class="detail-eyebrow"><span>BRANCH DETAILS</span><span>${esc(b.code)}</span></div><h2>${esc(b.title)}</h2><p class="branch-summary">${esc(b.summary)}</p><div class="branch-labels">${b.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div>${pathwayDetail(b)}<section class="inspector-section" aria-label="Papers in selected branch"><div class="section-label"><span>Representative papers</span><span>${b.papers.length} PAPERS</span></div><div class="related-papers">${b.papers.length?b.papers.map(id=>paperLink(getPaper(id),'related')).join(''):'<p class="source-note">No verified seed reading yet. The capability route and suggested experiment remain available above.</p>'}</div></section>${p?`<section class="inspector-section" aria-labelledby="selected-paper-heading"><div class="paper-detail-header"><h3 id="selected-paper-heading">${esc(p.name)}</h3><span>${p.year}</span></div><p class="paper-title">${esc(p.title)}</p><p class="mechanism-copy">${esc(p.mechanism)}</p><div class="section-label"><span>Evidence by question</span><span>Seed annotation</span></div><div class="evidence-stack">${questions.map(q=>`<section class="evidence-item ${state.question===q.id?'focus':''}" id="evidence-${p.id}-${q.id}" data-question-id="${q.id}" aria-label="${esc(q.short)} evidence"><div class="evidence-item-top"><span class="q-label">${q.id.toUpperCase()}</span><strong>${esc(q.short)}</strong>${badge(p.evidence[q.id])}</div><p>${esc(p.evidence[q.id].note)}</p></section>`).join('')}</div>${p.limitation?`<p class="source-note">Study boundary: ${esc(p.limitation)}</p>`:''}<a class="source-link" id="selected-paper-source" href="${esc(p.source||p.paper)}" target="_blank" rel="noopener noreferrer"><span>Read the original paper</span><span aria-hidden="true">↗</span></a><a class="source-link" id="selected-paper-permalink" href="${esc(href({paper:p.id}))}"><span>Permanent link to this selection</span><span aria-hidden="true">↗</span></a><p class="source-note">“Mechanism” is not causal validation. “Tested” applies only to the stated experiment. Years follow first arXiv submission.</p></section>`:''}`;
  }
  function renderPapers(){const list=model.filteredPapers(state);$('#result-count').textContent=`${list.length} / ${papers.length} papers`;$('#paper-list').innerHTML=list.length?list.map(p=>`<a class="index-card ${p.id===state.paper?'active':''}" id="paper-${p.id}" data-action="select-paper" data-paper-id="${p.id}" href="${esc(href({paper:p.id,branch:p.branch}))}" ${p.id===state.paper?'aria-current="true"':''}><div class="index-card-top"><h3>${esc(p.name)}</h3><span>${p.year} ↗</span></div><div class="full-title">${esc(p.title)}</div><p>${esc(p.mechanism)}</p><div class="index-card-bottom"><div class="branch-labels">${p.targets.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><span>${esc(branches[p.branch].title)}</span></div></a>`).join(''):'<div class="empty-state" role="status"><strong>No papers match this view</strong><p>Try a paper name, tool, memory, or code.<br>The research lens excludes unverified and out-of-scope annotations, not the possibility of relevant research.</p><button class="clear-search" id="clear-search" data-action="reset-filters">Reset search and lens</button></div>';}
  function renderQuestions(){
    $('#research-questions').innerHTML=questions.map(q=>`<article class="research-card ${state.question===q.id?'active':''}" id="question-${q.id}"><span class="research-q">${q.id.toUpperCase()} / RESEARCH QUESTION</span><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p><p class="criterion">Key evidence: ${esc(q.criterion)}</p></article>`).join('');
    $('#evidence-rows').innerHTML=papers.map(p=>`<tr data-paper-id="${p.id}"><th scope="row"><a id="matrix-${p.id}" data-action="select-paper" data-paper-id="${p.id}" href="${esc(href({paper:p.id,branch:p.branch}))}">${esc(p.name)}</a></th>${questions.map(q=>`<td data-question-id="${q.id}">${badge(p.evidence[q.id])}</td>`).join('')}</tr>`).join('');
  }
  function render(){
    const focusId=document.activeElement?.id;
    ['tree','papers','questions'].forEach(v=>$('#'+v+'-view').hidden=v!==state.view);
    $$('[data-view]').forEach(el=>{const active=el.dataset.view===state.view;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');el.href=href({view:el.dataset.view,query:''});});
    $$('[data-select]').forEach(el=>el.href=href({view:'tree',branch:el.dataset.select,paper:branches[el.dataset.select].papers[0],query:''}));
    $$('[data-question]').forEach(el=>{const active=el.dataset.question===state.question;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
    $('#breadcrumb-view').textContent={tree:'Literature taxonomy',papers:'Paper index',questions:'Research questions'}[state.view];$('#search').value=state.query;
    $('#filter-description').textContent=state.question==='all'?'Showing all mechanisms. Evidence labels refer only to the stated experimental scope.':`${state.question.toUpperCase()} lens: shows or highlights Tested and Mechanism annotations. Unverified or out-of-scope work is excluded from the index; exclusion is not negative evidence.`;
    document.title=`${getPaper(state.paper)?.name?getPaper(state.paper).name+' · ':''}${branches[state.branch].title} — Yggra`;document.body.dataset.view=state.view;document.body.dataset.question=state.question;
    renderTree();renderInspector();if(state.view==='papers')renderPapers();if(state.view==='questions')renderQuestions();
    if(focusId){const next=document.getElementById(focusId);if(next&&next!==document.activeElement&&!next.closest('[hidden]'))next.focus({preventScroll:true});}
    requestAnimationFrame(drawConnections);
  }
  document.addEventListener('click',event=>{
    const el=event.target.closest('button, a[data-action]');if(!el)return;
    if(el.tagName==='A'&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0))return;
    if(el.tagName==='A')event.preventDefault();
    if(el.dataset.view)return update({view:el.dataset.view,query:''});
    const branch=el.dataset.node||el.dataset.select;
    if(branch)return update({view:'tree',branch,paper:branches[branch].papers[0],query:'',collapsed:['iterative','evolution','memory'].includes(branch)?false:state.collapsed},{announce:`Selected ${branches[branch].title}. ${branches[branch].papers.length} papers.`});
    const id=el.dataset.paperId;
    if(id){const p=getPaper(id);return update({paper:id,branch:branches[state.branch].papers.includes(id)?state.branch:p.branch},{announce:`Selected ${p.name}. Evidence is available in the detail panel.`});}
    if(el.dataset.question)return update({question:el.dataset.question},{announce:'Research lens updated.'});
    if(el.id==='toggle-branches')update({collapsed:!state.collapsed},{announce:state.collapsed?'Harness expanded.':'Harness collapsed.'});
    if(el.id==='zoom-in')update({zoom:state.zoom+.1},{replace:true});if(el.id==='zoom-out')update({zoom:state.zoom-.1},{replace:true});
    if(el.id==='zoom-reset'){update({zoom:1},{replace:true});$('#canvas-viewport').scrollTo({left:0,top:0});}
    if(el.id==='clear-search'){update({query:'',question:'all'});$('#search').focus();}
  });
  $('#search').addEventListener('input',event=>update({view:'papers',query:event.target.value},{replace:true}));
  document.addEventListener('keydown',event=>{const editable=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable;if(event.key==='/'&&!editable){event.preventDefault();$('#search').focus();}if(event.key==='Escape'&&document.activeElement===$('#search')){update({query:''},{replace:true});$('#search').blur();}});
  window.addEventListener('popstate',()=>{state=model.fromParams(new URLSearchParams(location.search));render();$('#live-status').textContent='Restored the previous view.';});
  window.addEventListener('resize',drawConnections);if(document.fonts)document.fonts.ready.then(drawConnections);
  renderCapabilities();iconsIn();render();history.replaceState(null,'',href({}));
})();
