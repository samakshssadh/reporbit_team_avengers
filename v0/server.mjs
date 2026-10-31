import http from 'node:http';
import {createGemma,repositoryContext,validateChat,inputError} from './ai.mjs';
const gemma=createGemma();
const contexts=new Map();
let aiBusy=false;
import {readFile} from 'node:fs/promises';
import {stacks,median,assess,score} from './matching.mjs';
const cache=new Map();
async function github(path) {
 const hit=cache.get(path); if(hit&&Date.now()-hit.time<300000)return hit.data;
 const response=await fetch('https://api.github.com'+path,{headers:{Accept:'application/vnd.github+json','User-Agent':'Local-Repo-Match',...(process.env.GITHUB_TOKEN?{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`}:{})},signal:AbortSignal.timeout(15000)});
 if(!response.ok){const err=new Error(response.status===403||response.status===429?'GitHub rate limit or access restriction. Wait and retry, or configure GITHUB_TOKEN in .env.':`GitHub request failed (${response.status}).`);err.status=response.status;throw err;}
 const data=await response.json();cache.set(path,{data,time:Date.now()});if(cache.size>400)cache.delete(cache.keys().next().value);return data;
}
async function analyze(repo,selected,experience) {
 const base='/repos/'+repo.full_name,warnings=[];
 async function optional(path,fallback){try{return await github(path);}catch(e){warnings.push(path.split('/').slice(-1)[0]+': '+e.message);return fallback;}}
 const readmeData=await optional(base+'/readme',null);
 const readme=readmeData?.content?Buffer.from(readmeData.content,'base64').toString('utf8').slice(0,100000):'';
 const languages=await optional(base+'/languages',{});
 const issues=await optional(base+'/issues?state=open&per_page=30&sort=updated',[]);
 const commits=await optional(base+'/commits?per_page=20',[]);
 const pulls=await optional(base+'/pulls?state=all&sort=created&direction=desc&per_page=3',[]);
 const reviewTimes=[];let reviewed=0;
 for(const pr of pulls){
  const reviews=await optional(base+`/pulls/${pr.number}/reviews?per_page=100`,[]);
  const first=reviews.filter(r=>['OWNER','MEMBER','COLLABORATOR'].includes(r.author_association)&&r.user?.login!==pr.user?.login&&r.user?.type!=='Bot'&&r.submitted_at).sort((a,b)=>Date.parse(a.submitted_at)-Date.parse(b.submitted_at))[0];
  if(first){reviewTimes.push(Math.max(0,(Date.parse(first.submitted_at)-Date.parse(pr.created_at))/86400000));reviewed++;}
 }
 const matched=selected.filter(s=>stacks[s].startsWith('language:')?Object.keys(languages).some(l=>l.toLowerCase()===s.toLowerCase())||repo.language?.toLowerCase()===s.toLowerCase():(repo.topics||[]).includes(stacks[s].slice(6)));
 const dates=commits.map(c=>Date.parse(c.commit?.committer?.date)).filter(Number.isFinite).sort((a,b)=>b-a);
 const gaps=dates.slice(1).map((d,i)=>(dates[i]-d)/86400000);
 const assessment=assess(readme,issues),reviewDays=median(reviewTimes),daysSincePush=Math.max(0,(Date.now()-Date.parse(repo.pushed_at))/86400000);
 return {name:repo.full_name,url:repo.html_url,description:repo.description,stars:repo.stargazers_count,matched,languages:Object.keys(languages),daysSincePush,commitGap:median(gaps),commitCount:dates.length,reviewDays,reviewed,pullSample:pulls.length,assessment,...score({matched:matched.length,total:selected.length,assessment,daysSincePush,reviewDays,experience}),warnings,readmeUrl:readmeData?.html_url||repo.html_url+'#readme'};
}
async function search(selected,experience,page){
 const repos=new Map();let total=0;
 // Search each skill separately: GitHub language/topic qualifiers do not express arbitrary stack OR queries.
 for(const stack of selected){
  const q=`${stacks[stack]} archived:false fork:false is:public pushed:>${new Date(Date.now()-365*86400000).toISOString().slice(0,10)}`;
  const data=await github('/search/repositories?'+new URLSearchParams({q,sort:'updated',order:'desc',per_page:'4',page:String(page)}));
  total+=data.total_count;
  for(const repo of data.items)if(repo.has_issues)repos.set(repo.full_name,repo);
 }
 const results=[];
 for(const repo of [...repos.values()].slice(0,6))results.push(await analyze(repo,selected,experience));
 return {results:results.filter(r=>r.matched.length).sort((a,b)=>b.score-a.score),page,hasMore:page<10&&total>page*4,authenticated:!!process.env.GITHUB_TOKEN};
}
let busy=false;
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/chat'&&req.method==='POST'){
   res.setHeader('Content-Type','application/json');
   if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)throw inputError('Cross-origin requests are not allowed.',403);
   if(!req.headers['content-type']?.startsWith('application/json'))throw inputError('Send JSON.',415);
   if(aiBusy)throw inputError('Gemma is answering another question. Please retry shortly.',429);
   let raw='',bytes=0;
   for await(const chunk of req){bytes+=chunk.length;if(bytes>100000)throw inputError('Chat is too long. Start a new conversation.',413);raw+=chunk;}
   let body;try{body=JSON.parse(raw);}catch{throw inputError('Invalid JSON.');}
   validateChat(body);
   aiBusy=true;
   try{
    let context=null;
    if(body.repo){const hit=contexts.get(body.repo);context=hit&&Date.now()-hit.time<300000?hit.data:await repositoryContext(body.repo,github);contexts.set(body.repo,{data:context,time:Date.now()});if(contexts.size>20)contexts.delete(contexts.keys().next().value);}
    const result=await gemma(body.messages,context);
    res.end(JSON.stringify({...result,coverage:context?.coverage,files:context?.files.map(f=>f.path)||[],warnings:context?.warnings||[]}));
   }finally{aiBusy=false;}
   return;
  }
  if(req.method!=='GET'){res.writeHead(405);return res.end('Method not allowed');}
  if(url.pathname==='/api/search'){
   res.setHeader('Content-Type','application/json');
   const selected=[...new Set((url.searchParams.get('stack')||'').split(','))],experience=url.searchParams.get('experience'),page=Number(url.searchParams.get('page')||1);
   if(!selected.length||selected.length>3||selected.some(s=>!Object.hasOwn(stacks,s))||!['beginner','intermediate','advanced'].includes(experience)||!Number.isInteger(page)||page<1||page>10){res.writeHead(400);return res.end(JSON.stringify({error:'Choose 1–3 supported skills and an experience level.'}));}
   if(busy){res.writeHead(429);return res.end(JSON.stringify({error:'A search is already running. Please try again shortly.'}));}
   busy=true;try{res.end(JSON.stringify(await search(selected,experience,page)));}finally{busy=false;}return;
  }
  const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
  if(!files[url.pathname]){res.writeHead(404);return res.end('Not found');}
  const [file,type]=files[url.pathname];res.setHeader('Content-Type',type+'; charset=utf-8');res.end(await readFile(new URL('./public/'+file,import.meta.url)));
 }catch(e){res.writeHead(e.status>=400&&e.status<600?e.status:502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.name==='TimeoutError'?'GitHub took too long. Please retry.':e.message}));}
});
server.listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log(`Repo Match running at http://localhost:${server.address().port}`));
