(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{const next=api.legacyTarget(root.location.search,root.location.hash);if(next)root.location.replace(next);}})(typeof window!=='undefined'?window:globalThis,function(){
  function legacyTarget(search,hash=''){const params=new URLSearchParams(search);return ['view','branch','paper','question','q','collapsed','zoom'].some(key=>params.has(key))?'./atlas.html'+search+hash:null;}
  return {legacyTarget};
});
