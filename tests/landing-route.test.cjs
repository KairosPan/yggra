const test = require('node:test');
const assert = require('node:assert/strict');
const { legacyTarget } = require('../dist/landing-route.js');

test('existing atlas bookmarks preserve every selection and fragment', () => {
  const query = '?view=questions&branch=harness&paper=dgm&question=q2&q=tools%20%26%20code&zoom=1.2';
  assert.equal(legacyTarget(query,'#inspector'),'./atlas.html'+query+'#inspector');
});
test('landing links and campaign parameters stay on the landing page', () => {
  assert.equal(legacyTarget('','#questions'),null);
  assert.equal(legacyTarget('?utm_source=research'),null);
});
test('all supported legacy state parameters reach the atlas validator', () => {
  for (const key of ['view','branch','paper','question','q','collapsed','zoom']) {
    assert.equal(legacyTarget(`?${key}=invalid`),`./atlas.html?${key}=invalid`);
  }
});
