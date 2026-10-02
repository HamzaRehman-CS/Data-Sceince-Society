const {test}=require('node:test');const assert=require('node:assert/strict');const {createAuth}=require('../lib/workos-auth');
test('WorkOS callbacks require browser-bound state, verified email, and an explicit owner allowlist',async()=>{
 const {WorkOS}=require('@workos-inc/node'); const sdk=new WorkOS('sk_test_fake',{clientId:'client_test'});let exchanges=0,saved=0;
 sdk.userManagement.authenticateWithCode=async()=>{exchanges++;return{sealedSession:'sealed',user:{id:'user_test',email:'learner@example.test',emailVerified:true,role:'admin'}}};
 const auth=createAuth({env:{WORKOS_API_KEY:'sk_test_fake',WORKOS_CLIENT_ID:'client_test',WORKOS_COOKIE_PASSWORD:'x'.repeat(32)},client:sdk});
 const response=()=>({headers:{},getHeader(k){return this.headers[k]},setHeader(k,v){this.headers[k]=v},writeHead(s,h){this.status=s;Object.assign(this.headers,h)},end(){}});
 let res=response();await auth.route({method:'GET',headers:{}},res,new URL('http://localhost:3000/auth/signup'),()=>{});
 const state=new URL(res.headers.Location).searchParams.get('state');const cookie=res.headers['Set-Cookie'][0].split(';')[0];
 let bad=response();await auth.route({method:'GET',headers:{cookie}},bad,new URL('http://localhost:3000/callback?state=wrong&code=code'),()=>{saved++});assert.equal(exchanges,0);assert.equal(saved,0);
 let good=response();await auth.route({method:'GET',headers:{cookie}},good,new URL('http://localhost:3000/callback?state='+state+'&code=code'),async(user,isAdmin)=>{saved++;assert.equal(isAdmin,false);return{role:'student'}});assert.equal(exchanges,1);assert.equal(saved,1);assert.equal(good.headers.Location,'http://localhost:3000/member-dashboard.html');
 sdk.userManagement.authenticateWithCode=async()=>({sealedSession:'sealed',user:{email:'learner@example.test',emailVerified:false}});let unverified=response();await auth.route({method:'GET',headers:{cookie}},unverified,new URL('http://localhost:3000/callback?state='+state+'&code=code'),()=>{saved++});assert.equal(saved,1);
});
test('a damaged sealed cookie clears the session instead of failing the website request',async()=>{
 const auth=createAuth({env:{WORKOS_API_KEY:'sk_test_fake',WORKOS_CLIENT_ID:'client_test',WORKOS_COOKIE_PASSWORD:'x'.repeat(32)},client:{userManagement:{loadSealedSession(){throw new Error('Invalid session')}}}});
 const res={headers:{},getHeader(k){return this.headers[k]},setHeader(k,v){this.headers[k]=v}};
 assert.equal(await auth.identity({headers:{cookie:'dss_workos=damaged'}},res),null);
 assert.match(res.headers['Set-Cookie'][0],/Max-Age=0/);
});
