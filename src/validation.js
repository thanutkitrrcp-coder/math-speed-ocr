export function validParentOrigin(origin) {
  try {
    const url=new URL(origin);
    if(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname))return true;
    if(url.protocol!=='https:')return false;
    return url.hostname==='script.google.com' || url.hostname==='script.googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com');
  } catch (_) { return false; }
}
export function convertStrokes(strokes,dimensions) {
  if(!Array.isArray(strokes)||!strokes.length||strokes.length>180)throw new Error('จำนวนเส้นไม่ถูกต้อง');
  const width=Number(dimensions?.width),height=Number(dimensions?.height);
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<100||width>1800||height<80||height>1200)throw new Error('ขนาดกระดานไม่ถูกต้อง');
  let total=0;
  return strokes.map((s)=>{
    if(!Array.isArray(s)||!s.length||s.length>3200)throw new Error('รูปแบบเส้นไม่ถูกต้อง');
    total+=s.length;
    if(total>3200)throw new Error('จำนวนจุดมากเกินไป');
    return {points:s.map(p=>{
      if(!Array.isArray(p)||p.length!==2||!p.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1000))throw new Error('พิกัดไม่ถูกต้อง');
      return {x:p[0]*width/1000,y:p[1]*height/1000};
    }),lineWidth:3};
  });
}
