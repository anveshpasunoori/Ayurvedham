import {createServer} from 'node:http';
export function createHttpServer(handle){
 return createServer(async(req,res)=>{
  try{
   const path=new URL(req.url,'http://localhost').pathname;
   const result=await handle({method:req.method,path,headers:req.headers});
   res.writeHead(result.status,{...result.headers,'x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(JSON.stringify(result.body));
  }catch{res.writeHead(500,{'content-type':'application/json','cache-control':'no-store'});res.end('{"error":"Request failed"}');}
 });
}
