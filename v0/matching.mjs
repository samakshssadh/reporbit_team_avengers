export const stacks = {JavaScript:'language:JavaScript',TypeScript:'language:TypeScript',Python:'language:Python',Java:'language:Java',Go:'language:Go',Rust:'language:Rust','C++':'language:C++','C#':'language:C#',PHP:'language:PHP',Ruby:'language:Ruby',Swift:'language:Swift',Kotlin:'language:Kotlin',React:'topic:react',Vue:'topic:vue',Angular:'topic:angular','Next.js':'topic:nextjs','Node.js':'topic:nodejs',Django:'topic:django',Flask:'topic:flask',Flutter:'topic:flutter'};
export const median = values => { const a=values.filter(Number.isFinite).sort((a,b)=>a-b); return a.length ? (a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2 : null; };
export function assess(readme, issues) {
 const text=readme.toLowerCase();
 const setup=/npm (install|ci)|pnpm install|yarn install|pip install|cargo build|go (run|build)|docker compose|getting started|installation/.test(text);
 const tests=/npm test|pytest|cargo test|go test|running tests|test suite/.test(text);
 const contribution=/contribut|development setup|developer guide/.test(text);
 const complex=/distributed|compiler|kernel|consensus|concurrency|low.level|memory management/.test(text);
 const opportunities=issues.filter(i=>!i.pull_request&&!i.assignee&&!i.assignees?.length).map(i=>{
  const labels=i.labels.map(l=>typeof l==='string'?l:l.name).join(' ').toLowerCase();
  const difficult=/advanced|hard|complex|expert/.test(labels+' '+i.title.toLowerCase());
  const easy=/good first issue|beginner|easy|first.timers/.test(labels);
  return {title:i.title,url:i.html_url,difficulty:difficult?'Hard':easy?'Easy':'Medium',evidence:difficult?'Advanced label or title':easy?'Beginner-friendly issue label':'No explicit difficulty label; medium is a low-confidence default'};
 });
 return {setup,tests,contribution,complex,opportunities,readmeAvailable:!!readme};
}
export function score({matched,total,assessment,daysSincePush,reviewDays,experience}) {
 const target={beginner:'Easy',intermediate:'Medium',advanced:'Hard'}[experience];
 const fit=assessment.opportunities.some(i=>i.difficulty===target);
 const parts={stack:Math.round(40*matched/total),experience:fit?30:assessment.opportunities.length?8:0,activity:daysSincePush<7?15:daysSincePush<30?12:daysSincePush<90?7:2,reviews:reviewDays===null?0:reviewDays<2?15:reviewDays<7?12:reviewDays<30?6:2};
 return {score:Object.values(parts).reduce((a,b)=>a+b,0),parts,target,fit};
}
