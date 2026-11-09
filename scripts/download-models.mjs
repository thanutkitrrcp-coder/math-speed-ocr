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
// include all available WASM binaries in the published site (onnxruntime-web chooses the needed file).
const {readdir,copyFile,stat}=await import('node:fs/promises');
const dep=new URL('../node_modules/onnxruntime-web/dist/',import.meta.url);
const MAX_PAGES_ASSET_BYTES=25*1024*1024;
for(const f of await readdir(dep)){
  if(!f.endsWith('.wasm'))continue;
  const from=new URL(f,dep);
  const bytes=(await stat(from)).size;
  if(bytes>MAX_PAGES_ASSET_BYTES){
    console.log('Skipping oversized optional WASM for Cloudflare Pages:',f,(bytes/1048576).toFixed(2)+' MiB');
    continue;
  }
  await copyFile(from,new URL('../public/ort/'+f,import.meta.url));
  console.log('Included WASM:',f,(bytes/1048576).toFixed(2)+' MiB');
}
console.log('ONNX models and compatible WASM assets are ready');
