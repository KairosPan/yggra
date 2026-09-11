const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data/atlas.json');
const model=require('../dist/state.js')(data);
test('a paper-only deep link resolves its branch',()=>{const s=model.fromParams(new URLSearchParams('view=questions&paper=voyager&question=q1'));assert.equal(s.branch,'memory');assert.equal(s.paper,'voyager');assert.equal(s.question,'q1');});
test('a valid ancestor branch preserves a selected descendant',()=>{const s=model.normalize({branch:'harness',paper:'hyperagents'});assert.equal(s.branch,'harness');assert.equal(s.paper,'hyperagents');});
test('inconsistent IDs resolve to valid branch membership',()=>{const s=model.normalize({branch:'memory',paper:'dgm'});assert.equal(s.paper,'reflexion');});
test('invalid parameters, prototype names and invalid zoom are safe',()=>{for(const branch of ['__proto__','constructor','toString']){const s=model.fromParams(new URLSearchParams('view=bad&branch='+branch+'&paper=bad&question=bad&zoom=Infinity'));assert.equal(s.branch,'evolution');assert.equal(s.view,'tree');assert.equal(s.question,'all');assert.equal(s.zoom,1);}assert.equal(model.normalize({zoom:30}).zoom,1.5);assert.equal(model.normalize({zoom:.1}).zoom,.75);});
test('URL state survives a reload with punctuation and unicode in search',()=>{const s=model.normalize({view:'papers',query:'tools & code + "x" / Gödel',paper:'dgm',branch:'evolution',question:'q2',collapsed:true,zoom:1.2});assert.deepEqual(model.fromParams(new URLSearchParams(model.toQuery(s))),s);});
test('lens filters are explicit and selecting a filtered-out paper resolves to a result',()=>{const s=model.normalize({view:'papers',question:'q3',paper:'self-refine',branch:'foundation'});assert.equal(s.paper,'dgm');const ids=model.filteredPapers(s).map(p=>p.id);assert.deepEqual(ids,['dgm','hyperagents']);});
test('empty results stay empty instead of silently resetting filters',()=>{const s=model.normalize({view:'papers',query:'no-paper-matches-this'});assert.equal(model.filteredPapers(s).length,0);assert.equal(s.query,'no-paper-matches-this');});
test('long input is bounded and no user text becomes taxonomy identifiers',()=>{const s=model.normalize({query:'a'.repeat(1000),branch:'<script>alert(1)</script>'});assert.equal(s.query.length,240);assert.equal(s.branch,'evolution');});
test('a capability route without readings survives deep links and reloads without inventing a paper',()=>{
 const s=model.fromParams(new URLSearchParams('view=tree&branch=generative-communication&paper=dgm'));
 assert.equal(s.branch,'generative-communication');assert.equal(s.paper,null);
 assert.ok(!model.toQuery(s).includes('paper='));
 assert.deepEqual(model.fromParams(new URLSearchParams(model.toQuery(s))),s);
});
test('cross-classified course readings keep the requested route and are searchable by every route',()=>{
 const s=model.fromParams(new URLSearchParams('view=tree&branch=world-models&paper=sayplan'));
 assert.equal(s.branch,'world-models');assert.equal(s.paper,'sayplan');
 const ids=model.filteredPapers(model.normalize({query:'Structured & scientific reasoning'})).map(p=>p.id);
 assert.ok(ids.includes('winoground'));
});
