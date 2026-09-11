(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.AtlasState=factory(root.ATLAS_DATA);})(typeof window!=='undefined'?window:globalThis,function(data){
'use strict';
const byId=new Map(data.papers.map(p=>[p.id,p]));
const hasBranch=id=>Object.prototype.hasOwnProperty.call(data.branches,id);
function filteredPapers(s){const q=s.query.trim().toLowerCase();return data.papers.filter(p=>(s.question==='all'||data.question_filter.included_statuses.includes(p.evidence[s.question].status))&&(!q||[p.name,p.title,p.year,p.mechanism,...p.branch_ids.map(id=>data.branches[id].title),...p.targets,...Object.values(p.evidence).map(e=>e.note)].join(' ').toLowerCase().includes(q)));}
function normalize(input={}){
 const paper=byId.get(input.paper),branch=hasBranch(input.branch)?input.branch:paper?paper.branch:'evolution',n=Number(input.zoom);
 const s={view:['tree','papers','questions'].includes(input.view)?input.view:'tree',branch,paper:paper&&data.branches[branch].papers.includes(paper.id)?paper.id:data.branches[branch].papers[0]||null,question:['q1','q2','q3'].includes(input.question)?input.question:'all',query:typeof input.query==='string'?input.query.slice(0,240):'',collapsed:input.collapsed===true||input.collapsed==='1',zoom:Number.isFinite(n)&&n>0?Math.round(Math.max(.75,Math.min(1.5,n))*100)/100:1};
 if(s.view==='papers'){const visible=filteredPapers(s);if(visible.length&&!visible.some(p=>p.id===s.paper)){s.paper=visible[0].id;s.branch=visible[0].branch;}}
 return s;
}
function fromParams(p){return normalize({view:p.get('view'),branch:p.get('branch'),paper:p.get('paper'),question:p.get('question'),query:p.get('q'),collapsed:p.get('collapsed'),zoom:p.get('zoom')});}
function toQuery(state){const s=normalize(state),p=new URLSearchParams();p.set('view',s.view);p.set('branch',s.branch);if(s.paper)p.set('paper',s.paper);if(s.question!=='all')p.set('question',s.question);if(s.query)p.set('q',s.query);if(s.collapsed)p.set('collapsed','1');if(s.zoom!==1)p.set('zoom',String(s.zoom));return '?'+p.toString();}
return {normalize,fromParams,toQuery,filteredPapers};
});

