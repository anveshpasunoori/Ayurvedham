import {readFileSync} from 'node:fs';
const modules=['conditions','herbs','formulations','therapies','ailments','yoga'];
const queue=[];
for(const module of modules){const data=JSON.parse(readFileSync(new URL('../data/'+module+'.json',import.meta.url)));for(const record of data.items){if(record.review?.status==='reviewed')continue;const name=record.names?.en||record.names?.sa||record.name||record.id;queue.push({module,id:record.id,name,status:record.review?.status||record.status||'unreviewed',priority:record.safetyClass==='herbo-mineral'||record.safetyClass==='contains-toxic-herb'?'high':'normal'});}}
queue.sort((a,b)=>Number(b.priority==='high')-Number(a.priority==='high')||a.module.localeCompare(b.module)||a.id.localeCompare(b.id));
process.stdout.write(JSON.stringify({total:queue.length,items:queue},null,2)+'\n');
