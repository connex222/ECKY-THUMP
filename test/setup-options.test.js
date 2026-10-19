"use strict";
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/assets/app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/assets/arena.css'),'utf8');
test('all setup choices are present and visible as native radio controls',()=>{
  for (const [group,choices] of Object.entries({humour:['clean','cheeky','adult'],length:['quick','standard','party'],pace:['relaxed','lively']})) {
    const pattern=new RegExp('<input\\s+type="radio"\\s+name="'+group+'"\\s+value="([^"]+)"','g');
    const found=[...source.matchAll(pattern)].map(m=>m[1]);
    assert.deepEqual(found,choices);
  }
  assert.match(css,/\.setup-choice>input:checked\+\.setup-choice-face/);
});
test('host submits selected settings and adult mode reveals consent',()=>{
  assert.match(source,/rating:chosen\('humour'\)/);
  assert.match(source,/length:chosen\('length'\)/);
  assert.match(source,/pace:chosen\('pace'\)/);
  assert.match(source,/chosen\('humour'\)!=='adult'/);
});
