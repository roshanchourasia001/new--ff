const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const {authGuard,verifyFirebaseToken}=require('./dist/auth');
const {db}=require('./dist/storage/db');
const claims={uid:'qa-auth-user',email:'qa@example.test',email_verified:true,firebase:{sign_in_provider:'google.com'}};
async function withServer(run){
  const app=express();app.use(express.json());
  app.use(authGuard(async token=>{if(token==='valid')return claims;if(token==='unverified')return {...claims,email_verified:false};throw Error('invalid');}));
  app.use((req,res)=>res.json({uid:res.locals.identity?.uid,userId:req.body?.userId}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  try{await run(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(r=>server.close(r));}
}
test('missing, invalid and unverified tokens cannot log in',()=>withServer(async base=>{
  for(const token of ['', 'bad','unverified']){
    const r=await fetch(base+'/auth/google-login',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({email:'victim@test.com'})});
    assert.equal(r.status,401);
  }
}));
test('verified UID controls identity; body cannot impersonate another user',()=>withServer(async base=>{
  const headers={Authorization:'Bearer valid','Content-Type':'application/json'};
  const ok=await fetch(base+'/auth/google-login',{method:'POST',headers,body:'{}'});
  assert.equal(ok.status,200);assert.deepEqual(await ok.json(),{uid:claims.uid,userId:claims.uid});
  const bad=await fetch(base+'/matches/m1/register',{method:'POST',headers,body:JSON.stringify({userId:'user_roshan'})});assert.equal(bad.status,403);
}));
test('wallet/profile/history ownership and admin permissions are enforced',()=>withServer(async base=>{
  for(const path of ['/wallet/user_roshan','/users/profile/user_roshan','/matches/my-matches/user_roshan','/admin/metrics'])
    assert.equal((await fetch(base+path,{headers:{Authorization:'Bearer valid'}})).status,403);
  assert.equal((await fetch(base+'/wallet/'+claims.uid,{headers:{Authorization:'Bearer valid'}})).status,200);
}));
test('suspended accounts are rejected',()=>withServer(async base=>{
  db.users[claims.uid]={isBanned:true};
  try{assert.equal((await fetch(base+'/wallet/'+claims.uid,{headers:{Authorization:'Bearer valid'}})).status,403);}finally{delete db.users[claims.uid];}
}));
test('public match list stays available without login',()=>withServer(async base=>{
  assert.equal((await fetch(base+'/matches')).status,200);
}));
test('actual Firebase verifier rejects a forged token',async()=>{
  await assert.rejects(()=>verifyFirebaseToken('not-a-valid-firebase-token'));
});
