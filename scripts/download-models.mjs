import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
const base='https://github.com/kimseungdae/ink-on/releases/download/v0.1.0/';
const out=new URL('../public/models/comer/',import.meta.url);
await mkdir(out,{recursive:true});
for(const name of ['encoder_int8.onnx','decoder_int8.onnx','vocab.json']){
  const path=new URL(name,out);
  let present=false;
  try{const b=await readFile(path);present=b.length>(name.endsWith('.onnx')?1000000:100);}
  catch(_){}
  if(present){console.log('already present:',name);continue;}
  let r=await fetch(base+name,{redirect:'follow'});
  if(!r.ok && name==='vocab.json')r=await fetch('https://raw.githubusercontent.com/kimseungdae/ink-on/main/public/models/comer/vocab.json');
  if(!r.ok)throw new Error('Cannot download '+name+' (HTTP '+r.status+'). Obtain the file manually from https://github.com/kimseungdae/ink-on/releases/tag/v0.1.0');
  const buff=Buffer.from(await r.arrayBuffer());
  if(buff.length<(name.endsWith('.onnx')?1000000:100))throw new Error('File unexpectedly small: '+name);
  await writeFile(path,buff);console.log('downloaded:',name,buff.length);
}
await mkdir(new URL('../public/ort/',import.meta.url),{recursive:true});
const {copyFile,stat}=await import('node:fs/promises');
const dist=new URL('../node_modules/onnxruntime-web/dist/',import.meta.url);
const dest=new URL('../public/ort/',import.meta.url);
const MAX_PAGES_BYTES=25*1024*1024;
// Exact paired artifacts used by the upstream ink-on browser implementation.
// Do not copy asyncify or unrelated WebGPU/WebNN binaries.
for(const name of [
  'ort.all.min.mjs',
  'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jsep.wasm'
]){
  const from=new URL(name,dist);
  const size=(await stat(from)).size;
  if(size>MAX_PAGES_BYTES)throw new Error(name+' exceeds Cloudflare Pages 25 MiB asset limit');
  await copyFile(from,new URL(name,dest));
  console.log('Included paired ONNX runtime asset:',name,size,'bytes');
}
console.log('ONNX models and paired runtime assets are ready');
