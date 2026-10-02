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
test('logout revokes the provider session, returns home and rejects cookie replay across server instances',async()=>{
 let revocations=0,authentications=0;
 const client={userManagement:{loadSealedSession(){return{getLogoutUrl:async()=> 'https://api.workos.com/user_management/sessions/logout?session_id=session_test',authenticate:async()=>{authentications++;return{authenticated:true,sessionId:'session_test',user:{emailVerified:true,email:'test@example.test'}};}};},revokeSession:async({sessionId})=>{assert.equal(sessionId,'session_test');revocations++;}}};
 const env={WORKOS_API_KEY:'sk_test_fake',WORKOS_CLIENT_ID:'client_test',WORKOS_COOKIE_PASSWORD:'x'.repeat(32),PUBLIC_ORIGIN:'https://society.example.test'};
 const auth=createAuth({env,client}),db={},res={headers:{},getHeader(k){return this.headers[k]},setHeader(k,v){this.headers[k]=v}};
 assert.equal(await auth.logout({headers:{cookie:'dss_workos=sealed'}},res,db),'https://society.example.test/?signedOut=1');
 assert.equal(revocations,1);assert.equal(res.headers['Set-Cookie'].filter(c=>/Max-Age=0; Secure/.test(c)).length,3);assert.notEqual(db.revokedWorkosSessions[0].token,'sealed');
 const another=createAuth({env,client}),persisted=JSON.parse(JSON.stringify(db));
 assert.equal(await another.identity({headers:{cookie:'dss_workos=sealed'}},res,persisted),null);assert.equal(authentications,0);
 assert.equal(await another.identity({headers:{cookie:'dss_workos=refreshed-cookie'}},res,persisted),null);assert.equal(authentications,1);
 client.userManagement.revokeSession=async()=>{throw Object.assign(new Error('Already gone'),{status:404});};
 assert.equal(await auth.logout({headers:{cookie:'dss_workos=second'}},res,db),'https://society.example.test/?signedOut=1');
});
test('an expired WorkOS refresh clears the cookie rather than breaking the portal',async()=>{
 const auth=createAuth({env:{WORKOS_API_KEY:'test',WORKOS_CLIENT_ID:'test',WORKOS_COOKIE_PASSWORD:'x'.repeat(32)},client:{userManagement:{loadSealedSession(){return{authenticate:async()=>({authenticated:false}),refresh:async()=>{throw Object.assign(new Error('Revoked'),{status:400});}};}}}});
 const res={headers:{},getHeader(k){return this.headers[k]},setHeader(k,v){this.headers[k]=v}};
 assert.equal(await auth.identity({headers:{cookie:'dss_workos=expired'}},res),null);assert.match(res.headers['Set-Cookie'][0],/Max-Age=0/);
});
