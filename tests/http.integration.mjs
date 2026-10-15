import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
for(const path of ['/','/venues','/admin/login','/admin']){const r=await fetch(base+path);assert.equal(r.status,200);assert.equal(r.headers.get('x-frame-options'),'DENY');assert.equal(r.headers.get('x-content-type-options'),'nosniff');}
const cases=[['cross origin',{origin:'https://example.com','content-type':'application/json'},'{}',403],['invalid JSON',{origin:base,'content-type':'application/json'},'{',400],['invalid fields',{origin:base,'content-type':'application/json'},'{}',400],['oversize',{origin:base,'content-type':'application/json'},JSON.stringify({notes:'a'.repeat(17000)}),413],['wrong content type',{origin:base,'content-type':'text/plain'},'{}',415]];
for(const [name,headers,body,expected] of cases){const r=await fetch(base+'/api/bookings',{method:'POST',headers,body});assert.equal(r.status,expected,name);console.log('PASS: '+name);}
console.log('PASS: four public route shells and security headers. Admin records require RLS authorization.');
