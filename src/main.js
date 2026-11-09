import * as ort from 'onnxruntime-web';
import {InferenceEngine,preprocessStrokes,isStrokeMeaningful,loadVocab} from 'ink-on/core';
import {validParentOrigin,convertStrokes} from './validation.js';

// Always run inference locally; single WASM thread works without SharedArrayBuffer in an iframe.
const root=new URL('./',window.location.href);
const asset=name=>new URL(name,root).href;
ort.env.wasm.numThreads=1;
ort.env.wasm.wasmPaths=asset('ort/');
let parentOrigin=null;
let engine=null,vocab=null,initialized=false,failedMessage='';
const status=document.getElementById('status');
const queue=[];
let busy=false;
function send(payload){if(parentOrigin && window.parent!==window)window.parent.postMessage(payload,parentOrigin);}
function errorText(err){return String(err?.message||err||'ไม่ทราบสาเหตุ').slice(0,160);}
async function init(){
  try {
    status.textContent='กำลังโหลดโมเดลฟรีบนอุปกรณ์...';
    vocab=await loadVocab(asset('models/comer/vocab.json'));
    engine=new InferenceEngine({
      encoderUrl:asset('models/comer/encoder_int8.onnx'),
      decoderUrl:asset('models/comer/decoder_int8.onnx'),
      beamWidth:2,executionProvider:'wasm'
    });
    await engine.init(); initialized=true;
    status.textContent='ตัวรู้จำพร้อมใช้งาน ✓ ไม่คิดค่า API';
    send({type:'MSC_OPEN_OCR_READY'});
  }catch(e){failedMessage='โหลดโมเดลไม่ได้: '+errorText(e);status.textContent=failedMessage;send({type:'MSC_OPEN_OCR_ERROR',message:failedMessage});}
}
async function processNext(){
  if(busy||!queue.length||!initialized)return;
  const job=queue.shift();busy=true;
  try{
    const ink=convertStrokes(job.strokes,job.dimensions);
    if(!isStrokeMeaningful(ink))throw new Error('ลายมือยังสั้นเกินไป กรุณาเขียนเพิ่มเติม');
    const input=preprocessStrokes(ink);
    const result=await engine.recognize(input,vocab,'expression');
    const latex=String(result?.latex||'').slice(0,1200);
    if(!latex)throw new Error('ยังอ่านข้อความนี้ไม่ได้');
    send({type:'MSC_OPEN_OCR_RESULT',requestId:job.requestId,latex});
  }catch(e){send({type:'MSC_OPEN_OCR_ERROR',requestId:job.requestId,message:errorText(e)});}
  finally{busy=false;processNext();}
}
window.addEventListener('message',event=>{
  if(event.source!==window.parent||!validParentOrigin(event.origin)||!event.data||typeof event.data!=='object')return;
  const d=event.data;
  if(d.type==='MSC_OPEN_OCR_HELLO'){
    parentOrigin=event.origin;
    if(initialized)send({type:'MSC_OPEN_OCR_READY'});
    else if(failedMessage)send({type:'MSC_OPEN_OCR_ERROR',message:failedMessage});
    return;
  }
  if(event.origin!==parentOrigin)return;
  if(d.type==='MSC_OPEN_OCR_RECOGNIZE' && typeof d.requestId==='string' && d.requestId.length<=120){
    if(!initialized){send({type:'MSC_OPEN_OCR_ERROR',requestId:d.requestId,message:'โมเดลยังไม่พร้อม'});return;}
    if(queue.length>=2){send({type:'MSC_OPEN_OCR_ERROR',requestId:d.requestId,message:'ระบบกำลังประมวลผล กรุณารอสักครู่'});return;}
    queue.push({requestId:d.requestId,strokes:d.strokes,dimensions:d.dimensions});processNext();
  }
});
init();
