import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGemma,validateChat,repositoryContext} from './ai.mjs';
test('validates chat roles, repository and message bounds',()=>{
 assert.throws(()=>validateChat({messages:[{role:'system',text:'x'}]}));
 assert.throws(()=>validateChat({repo:'../a/b',messages:[{role:'user',text:'x'}]}));
 assert.throws(()=>validateChat({messages:[{role:'user',text:'x'.repeat(12001)}]}));
 assert.equal(validateChat({repo:'owner/repo',messages:[{role:'user',text:'hello'}]}).repo,'owner/repo');
});
test('discovers Gemma, keeps key in header, and grounds conversation',async()=>{
 const calls=[];const generate=createGemma({apiKey:'test-key',fetcher:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url.includes('models?')?{models:[{name:'models/gemini-example',supportedGenerationMethods:['generateContent']},{name:'models/gemma-3-27b-it',supportedGenerationMethods:['generateContent']}]}:{candidates:[{content:{parts:[{text:'Grounded answer'}]},finishReason:'STOP'}]}};}});
 const answer=await generate([{role:'user',text:'Summarise'}],{files:[{path:'README.md',text:'Example'}]});
 assert.equal(answer.model,'gemma-3-27b-it');assert.equal(answer.text,'Grounded answer');assert.ok(calls[1].url.includes('gemma-3-27b-it:generateContent'));assert.ok(!calls[1].url.includes('test-key'));assert.equal(calls[1].options.headers['x-goog-api-key'],'test-key');assert.ok(calls[1].options.body.includes('README.md'));assert.ok(!calls[1].options.body.includes('test-key'));
});
test('never falls back to Gemini and hides provider error bodies',async()=>{
 const noGemma=createGemma({apiKey:'x',fetcher:async()=>({ok:true,json:async()=>({models:[]})})});await assert.rejects(()=>noGemma([{role:'user',text:'hi'}]),/No Gemma/);
 const rejected=createGemma({apiKey:'x',model:'gemma-3-27b-it',fetcher:async()=>({ok:false,status:403,json:async()=>({secret:'do not leak'})})});await assert.rejects(()=>rejected([{role:'user',text:'hi'}]),e=>e.message.includes('cannot access')&&!e.message.includes('do not leak'));
});
test('repository sampling excludes secret files and reports coverage',async()=>{
 const requested=[];const github=async path=>{requested.push(path);if(path==='/repos/a/b')return {default_branch:'main',private:false};if(path.endsWith('/readme'))return {path:'README.md',content:Buffer.from('Project overview').toString('base64')};if(path.includes('/git/trees/'))return {tree:[{type:'blob',path:'.env',sha:'secret',size:10},{type:'blob',path:'src/main.js',sha:'code',size:20}]};if(path.endsWith('/git/blobs/code'))return {encoding:'base64',content:Buffer.from('console.log("hello")').toString('base64')};throw Error('Unexpected request');};
 const context=await repositoryContext('a/b',github);assert.deepEqual(context.files.map(f=>f.path),['README.md','src/main.js']);assert.ok(context.coverage.includes('2 file excerpts'));assert.ok(!requested.some(p=>p.includes('/blobs/secret')));
});
test('does not send private repository contents',async()=>{await assert.rejects(()=>repositoryContext('a/b',async()=>({private:true})),/Only public/);});
