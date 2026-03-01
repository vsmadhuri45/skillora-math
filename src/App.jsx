import { useState, useMemo, useCallback } from "react";

// ─── Google Fonts ───────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";
document.head.appendChild(fontLink);

// ─── MATH UTILITIES ─────────────────────────────────────────────────────────
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const isPrime = n => { if (n < 2) return false; if (n === 2) return true; if (n % 2 === 0) return false; for (let i = 3; i <= Math.sqrt(n); i += 2) if (n % i === 0) return false; return true; };
const primeFactors = n => { const f = []; let d = 2; while (d * d <= n) { while (n % d === 0) { f.push(d); n = Math.floor(n / d); } d++; } if (n > 1) f.push(n); return f; };
const factorial = n => { if (n < 0) return NaN; if (n <= 1) return 1; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

const numberToWords = (n) => {
  const ones = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  if (n === 0) return 'zero';
  const h = num => {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? '-'+ones[num%10] : '');
    if (num < 1e3) return ones[Math.floor(num/100)]+' hundred'+(num%100?' '+h(num%100):'');
    if (num < 1e6) return h(Math.floor(num/1e3))+' thousand'+(num%1e3?' '+h(num%1e3):'');
    if (num < 1e9) return h(Math.floor(num/1e6))+' million'+(num%1e6?' '+h(num%1e6):'');
    return h(Math.floor(num/1e9))+' billion'+(num%1e9?' '+h(num%1e9):'');
  };
  return (n<0?'negative ':'')+h(Math.abs(n));
};

const wordsToNumber = (w) => {
  const map = {zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,thousand:1e3,million:1e6,billion:1e9};
  let cur = 0, result = 0;
  w.toLowerCase().replace(/-/g,' ').split(/\s+/).forEach(word => {
    const v = map[word];
    if (v === undefined) return;
    if (v === 100) cur *= 100;
    else if (v >= 1000) { result += (cur||1)*v; cur = 0; }
    else cur += v;
  });
  return result + cur;
};

const simplifyFraction = (n, d) => { const g = gcd(Math.abs(n), Math.abs(d)); return [n/g, d/g]; };

const decimalToBinary = n => (parseInt(n) >>> 0).toString(2);
const binaryToDecimal = b => parseInt(b, 2);

// Matrix helpers
const matMul = (A, B) => {
  const r = A.length, c = B[0].length, m = B.length;
  return Array.from({length:r}, (_,i) => Array.from({length:c}, (_,j) => A[i].reduce((s,_,k) => s + A[i][k]*B[k][j], 0)));
};
const matAdd = (A, B) => A.map((r,i) => r.map((v,j) => v + B[i][j]));
const matSub = (A, B) => A.map((r,i) => r.map((v,j) => v - B[i][j]));
const matTranspose = A => A[0].map((_, j) => A.map(r => r[j]));
const det2 = A => A[0][0]*A[1][1] - A[0][1]*A[1][0];
const det3 = A => A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1]) - A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0]) + A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
const inv2 = A => { const d = det2(A); return [[A[1][1]/d, -A[0][1]/d], [-A[1][0]/d, A[0][0]/d]]; };

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────
const Label = ({children}) => <label style={{display:'block',fontSize:'0.75rem',fontFamily:'DM Sans',color:'#94a3b8',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'4px'}}>{children}</label>;
const Input = ({...p}) => <input {...p} style={{width:'100%',background:'#0f1729',border:'1px solid #2d3f6b',borderRadius:'8px',padding:'10px 14px',color:'#e2e8f0',fontFamily:'JetBrains Mono',fontSize:'0.95rem',outline:'none',boxSizing:'border-box',...p.style}} />;
const Btn = ({children,onClick,variant='primary',style={}}) => <button onClick={onClick} style={{padding:'10px 22px',borderRadius:'8px',border:'none',cursor:'pointer',fontFamily:'DM Sans',fontWeight:500,fontSize:'0.9rem',transition:'all 0.15s',...(variant==='primary'?{background:'#f59e0b',color:'#0f1729'}:{background:'#1e2d4d',color:'#94a3b8'}),...style}}>{children}</button>;
const Result = ({children,label='Result'}) => children!=null && children!=='' ? <div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><div style={{fontSize:'0.7rem',color:'#f59e0b',fontFamily:'DM Sans',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'6px'}}>{label}</div><div style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'1.05rem',wordBreak:'break-all'}}>{children}</div></div> : null;
const Row = ({children}) => <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>{children}</div>;
const Field = ({label,children}) => <div><Label>{label}</Label>{children}</div>;

// ─── CALCULATORS ────────────────────────────────────────────────────────────

function SimpleAlgebra() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [op,setOp]=useState('+'); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseFloat(a), y=parseFloat(b);
    if(isNaN(x)||isNaN(y)) return setRes('Invalid input');
    const r = op==='+'?x+y:op==='-'?x-y:op==='×'?x*y:op==='÷'?y!==0?x/y:'Cannot divide by zero':0;
    setRes(typeof r==='string'?r:`${x} ${op} ${y} = ${r}`);
  };
  return <div>
    <Row><Field label="First Number"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. 24"/></Field><Field label="Second Number"><Input value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. 6"/></Field></Row>
    <div style={{marginTop:'12px'}}><Label>Operation</Label><div style={{display:'flex',gap:'8px'}}>{['+','-','×','÷'].map(o=><Btn key={o} onClick={()=>setOp(o)} variant={op===o?'primary':'secondary'}>{o}</Btn>)}</div></div>
    <Btn style={{marginTop:'16px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function NumberWords() {
  const [val,setVal]=useState(''); const [mode,setMode]=useState('num2word'); const [res,setRes]=useState(null);
  const calc = () => {
    if(mode==='num2word') { const n=parseInt(val); setRes(isNaN(n)?'Invalid':numberToWords(n)); }
    else { const n=wordsToNumber(val); setRes(isNaN(n)||n===0&&val.toLowerCase()!=='zero'?'Could not parse':''+n); }
  };
  return <div>
    <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}><Btn onClick={()=>setMode('num2word')} variant={mode==='num2word'?'primary':'secondary'}>Number → Words</Btn><Btn onClick={()=>setMode('word2num')} variant={mode==='word2num'?'primary':'secondary'}>Words → Number</Btn></div>
    <Field label={mode==='num2word'?'Enter Number':'Enter Words'}><Input value={val} onChange={e=>setVal(e.target.value)} placeholder={mode==='num2word'?'e.g. 5692':'e.g. five thousand six hundred ninety-two'}/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Convert</Btn>
    <Result>{res}</Result>
  </div>;
}

function RandomNumber() {
  const [min,setMin]=useState('1'); const [max,setMax]=useState('100'); const [count,setCount]=useState('1'); const [res,setRes]=useState(null);
  const gen = () => {
    const lo=parseInt(min),hi=parseInt(max),c=parseInt(count);
    if(isNaN(lo)||isNaN(hi)||lo>hi) return setRes('Invalid range');
    const nums = Array.from({length:Math.min(c,50)},()=>Math.floor(Math.random()*(hi-lo+1))+lo);
    setRes(nums.join(', '));
  };
  return <div>
    <Row><Field label="Min"><Input value={min} onChange={e=>setMin(e.target.value)}/></Field><Field label="Max"><Input value={max} onChange={e=>setMax(e.target.value)}/></Field></Row>
    <div style={{marginTop:'12px'}}><Field label="Count (max 50)"><Input value={count} onChange={e=>setCount(e.target.value)} type="number" min="1" max="50"/></Field></div>
    <Btn style={{marginTop:'12px'}} onClick={gen}>Generate</Btn>
    <Result>{res}</Result>
  </div>;
}

function ArrangeNumbers() {
  const [nums,setNums]=useState(''); const [order,setOrder]=useState('asc'); const [res,setRes]=useState(null);
  const calc = () => {
    const arr = nums.split(/[\s,]+/).map(Number).filter(x=>!isNaN(x));
    if(!arr.length) return;
    const sorted = [...arr].sort((a,b)=>order==='asc'?a-b:b-a);
    setRes(sorted.join(' , '));
  };
  return <div>
    <Field label="Numbers (comma or space separated)"><Input value={nums} onChange={e=>setNums(e.target.value)} placeholder="e.g. 5, 2, 8, 1, 9"/></Field>
    <div style={{display:'flex',gap:'8px',marginTop:'12px'}}><Btn onClick={()=>setOrder('asc')} variant={order==='asc'?'primary':'secondary'}>Ascending ↑</Btn><Btn onClick={()=>setOrder('desc')} variant={order==='desc'?'primary':'secondary'}>Descending ↓</Btn></div>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Arrange</Btn>
    <Result>{res}</Result>
  </div>;
}

function NumberExpansion() {
  const [num,setNum]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const n = Math.abs(parseInt(num));
    if(isNaN(n)) return;
    const s = String(n); const parts = [];
    const places = [1,10,100,1000,10000,100000,1000000,10000000,100000000];
    for(let i=0;i<s.length;i++){
      const d=parseInt(s[i]); const p=places[s.length-1-i];
      if(d!==0) parts.push(`${d}×${p}`);
    }
    setRes(parts.join(' + '));
  };
  return <div>
    <Field label="Number"><Input value={num} onChange={e=>setNum(e.target.value)} placeholder="e.g. 5692"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Expand</Btn>
    <Result label={`Expansion of ${num}`}>{res}</Result>
  </div>;
}

function CompareNumbers() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseFloat(a),y=parseFloat(b);
    if(isNaN(x)||isNaN(y)) return;
    setRes(x>y?`${a} > ${b}`:x<y?`${a} < ${b}`:`${a} = ${b}`);
  };
  return <div>
    <Row><Field label="Number A"><Input value={a} onChange={e=>setA(e.target.value)}/></Field><Field label="Number B"><Input value={b} onChange={e=>setB(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Compare</Btn>
    <Result>{res}</Result>
  </div>;
}

function MaxMin() {
  const [nums,setNums]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const arr = nums.split(/[\s,]+/).map(Number).filter(x=>!isNaN(x));
    if(!arr.length) return;
    setRes(`Maximum: ${Math.max(...arr)}   |   Minimum: ${Math.min(...arr)}`);
  };
  return <div>
    <Field label="Numbers (comma or space separated)"><Input value={nums} onChange={e=>setNums(e.target.value)} placeholder="e.g. 4, 7, 2, 9, 1"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Find Max &amp; Min</Btn>
    <Result>{res}</Result>
  </div>;
}

function MultiplicationTable() {
  const [n,setN]=useState(''); const [upto,setUpto]=useState('12'); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseInt(n),u=parseInt(upto);
    if(isNaN(x)||isNaN(u)) return;
    const rows = Array.from({length:u},(_,i)=>`${x} × ${i+1} = ${x*(i+1)}`);
    setRes(rows.join('\n'));
  };
  return <div>
    <Row><Field label="Number"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 7"/></Field><Field label="Up to"><Input value={upto} onChange={e=>setUpto(e.target.value)} placeholder="12"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Generate Table</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.8'}}>{res}</pre></div>}
  </div>;
}

function SimplifyFraction() {
  const [n,setN]=useState(''); const [d,setD]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const num=parseInt(n),den=parseInt(d);
    if(isNaN(num)||isNaN(den)||den===0) return setRes('Invalid');
    const [sn,sd]=simplifyFraction(num,den);
    setRes(sd===1?`${sn}`:sn===num&&sd===den?`${num}/${den} is already in simplest form`:`${num}/${den} = ${sn}/${sd}`);
  };
  return <div>
    <Row><Field label="Numerator"><Input value={n} onChange={e=>setN(e.target.value)}/></Field><Field label="Denominator"><Input value={d} onChange={e=>setD(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Simplify</Btn>
    <Result>{res}</Result>
  </div>;
}

function ClockAngle() {
  const [h,setH]=useState(''); const [m,setM]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const hr=parseFloat(h)%12,mn=parseFloat(m);
    if(isNaN(hr)||isNaN(mn)||mn<0||mn>=60) return setRes('Invalid');
    const hourAngle = hr*30 + mn*0.5;
    const minAngle = mn*6;
    const diff = Math.abs(hourAngle-minAngle);
    const angle = Math.min(diff, 360-diff);
    setRes(`Angle between hands = ${angle.toFixed(2)}°`);
  };
  return <div>
    <Row><Field label="Hour (0–12)"><Input value={h} onChange={e=>setH(e.target.value)} placeholder="e.g. 3"/></Field><Field label="Minutes (0–59)"><Input value={m} onChange={e=>setM(e.target.value)} placeholder="e.g. 30"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate Angle</Btn>
    <Result>{res}</Result>
  </div>;
}

function Mensuration() {
  const [shape,setShape]=useState('circle'); const [vals,setVals]=useState({}); const [res,setRes]=useState(null);
  const shapes = {
    circle:{label:'Circle',fields:['Radius'],calc:v=>`Area = π×r² = ${(Math.PI*v[0]**2).toFixed(4)}\nCircumference = 2πr = ${(2*Math.PI*v[0]).toFixed(4)}`},
    rectangle:{label:'Rectangle',fields:['Length','Width'],calc:v=>`Area = ${v[0]*v[1]}\nPerimeter = ${2*(v[0]+v[1])}`},
    triangle:{label:'Triangle (sides)',fields:['Side a','Side b','Side c'],calc:v=>{const s=(v[0]+v[1]+v[2])/2;const area=Math.sqrt(s*(s-v[0])*(s-v[1])*(s-v[2]));return `Area (Heron's) = ${area.toFixed(4)}\nPerimeter = ${v[0]+v[1]+v[2]}`}},
    square:{label:'Square',fields:['Side'],calc:v=>`Area = ${v[0]**2}\nPerimeter = ${4*v[0]}\nDiagonal = ${(v[0]*Math.SQRT2).toFixed(4)}`},
    parallelogram:{label:'Parallelogram',fields:['Base','Height'],calc:v=>`Area = base × height = ${v[0]*v[1]}`},
    trapezium:{label:'Trapezium',fields:['Side a','Side b','Height'],calc:v=>`Area = ½(a+b)×h = ${0.5*(v[0]+v[1])*v[2]}`},
    rhombus:{label:'Rhombus',fields:['Diagonal 1','Diagonal 2'],calc:v=>`Area = ½×d1×d2 = ${0.5*v[0]*v[1]}`},
    cube:{label:'Cube',fields:['Side'],calc:v=>`Volume = ${v[0]**3}\nSurface Area = ${6*v[0]**2}\nLateral SA = ${4*v[0]**2}`},
    cuboid:{label:'Cuboid',fields:['Length','Width','Height'],calc:v=>`Volume = ${v[0]*v[1]*v[2]}\nSurface Area = ${2*(v[0]*v[1]+v[1]*v[2]+v[0]*v[2])}`},
    sphere:{label:'Sphere',fields:['Radius'],calc:v=>`Volume = 4/3×π×r³ = ${(4/3*Math.PI*v[0]**3).toFixed(4)}\nSurface Area = 4πr² = ${(4*Math.PI*v[0]**2).toFixed(4)}`},
    cylinder:{label:'Cylinder',fields:['Radius','Height'],calc:v=>`Volume = πr²h = ${(Math.PI*v[0]**2*v[1]).toFixed(4)}\nCurved SA = 2πrh = ${(2*Math.PI*v[0]*v[1]).toFixed(4)}\nTotal SA = ${(2*Math.PI*v[0]*(v[0]+v[1])).toFixed(4)}`},
    cone:{label:'Cone',fields:['Radius','Height'],calc:v=>{const l=Math.sqrt(v[0]**2+v[1]**2);return `Volume = 1/3×πr²h = ${(Math.PI*v[0]**2*v[1]/3).toFixed(4)}\nSlant height = ${l.toFixed(4)}\nCurved SA = πrl = ${(Math.PI*v[0]*l).toFixed(4)}`}},
  };
  const s = shapes[shape];
  const calc = () => {
    const vs = s.fields.map((_,i)=>parseFloat(vals[i]||''));
    if(vs.some(isNaN)||vs.some(v=>v<=0)) return setRes('Enter valid positive values');
    setRes(s.calc(vs));
  };
  return <div>
    <Label>Shape</Label>
    <select value={shape} onChange={e=>{setShape(e.target.value);setVals({});setRes(null);}} style={{width:'100%',background:'#0f1729',border:'1px solid #2d3f6b',borderRadius:'8px',padding:'10px 14px',color:'#e2e8f0',fontFamily:'DM Sans',marginBottom:'12px'}}>
      {Object.entries(shapes).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
    </select>
    <Row>{s.fields.map((f,i)=><Field key={f} label={f}><Input value={vals[i]||''} onChange={e=>setVals(p=>({...p,[i]:e.target.value}))}/></Field>)}</Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.95rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function AngleDecider() {
  const [a,setA]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseFloat(a);
    if(isNaN(v)||v<0||v>360) return setRes('Enter angle between 0 and 360');
    const t = v===0?'Zero':v<90?'Acute':v===90?'Right':v<180?'Obtuse':v===180?'Straight':v<360?'Reflex':'Full Angle';
    setRes(`${v}° is a ${t} angle`);
  };
  return <div>
    <Field label="Angle (degrees)"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. 45"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Classify</Btn>
    <Result>{res}</Result>
  </div>;
}

function MixedImproper() {
  const [mode,setMode]=useState('mixed2imp');
  const [w,setW]=useState(''); const [n,setN]=useState(''); const [d,setD]=useState('');
  const [imp,setImp]=useState(''); const [impD,setImpD]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    if(mode==='mixed2imp') {
      const W=parseInt(w),N=parseInt(n),D=parseInt(d);
      if(isNaN(W)||isNaN(N)||isNaN(D)||D===0) return setRes('Invalid');
      setRes(`${W} ${N}/${D} = ${W*D+N}/${D}`);
    } else {
      const num=parseInt(imp),den=parseInt(impD);
      if(isNaN(num)||isNaN(den)||den===0) return setRes('Invalid');
      const whole=Math.floor(num/den),rem=num%den;
      setRes(rem===0?`${whole}`:whole===0?`${rem}/${den}`:`${whole} ${rem}/${den}`);
    }
  };
  return <div>
    <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}><Btn onClick={()=>setMode('mixed2imp')} variant={mode==='mixed2imp'?'primary':'secondary'}>Mixed → Improper</Btn><Btn onClick={()=>setMode('imp2mixed')} variant={mode==='imp2mixed'?'primary':'secondary'}>Improper → Mixed</Btn></div>
    {mode==='mixed2imp'?<><Row><Field label="Whole"><Input value={w} onChange={e=>setW(e.target.value)}/></Field><Field label="Numerator"><Input value={n} onChange={e=>setN(e.target.value)}/></Field></Row><div style={{marginTop:'12px'}}><Field label="Denominator"><Input value={d} onChange={e=>setD(e.target.value)}/></Field></div></>:<Row><Field label="Numerator"><Input value={imp} onChange={e=>setImp(e.target.value)}/></Field><Field label="Denominator"><Input value={impD} onChange={e=>setImpD(e.target.value)}/></Field></Row>}
    <Btn style={{marginTop:'12px'}} onClick={calc}>Convert</Btn>
    <Result>{res}</Result>
  </div>;
}

function FractionDecimal() {
  const [mode,setMode]=useState('frac2dec');
  const [n,setN]=useState(''); const [d,setD]=useState(''); const [dec,setDec]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    if(mode==='frac2dec') {
      const num=parseInt(n),den=parseInt(d);
      if(isNaN(num)||isNaN(den)||den===0) return setRes('Invalid');
      setRes(`${num}/${den} = ${(num/den).toString()}`);
    } else {
      const v=parseFloat(dec);
      if(isNaN(v)) return setRes('Invalid');
      const str=v.toString();
      const decIdx=str.indexOf('.');
      if(decIdx===-1) return setRes(`${v}/1`);
      const decPlaces=str.length-decIdx-1;
      const denom=10**decPlaces;
      const numer=Math.round(v*denom);
      const [sn,sd]=simplifyFraction(numer,denom);
      setRes(`${dec} = ${sn}/${sd}`);
    }
  };
  return <div>
    <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}><Btn onClick={()=>setMode('frac2dec')} variant={mode==='frac2dec'?'primary':'secondary'}>Fraction → Decimal</Btn><Btn onClick={()=>setMode('dec2frac')} variant={mode==='dec2frac'?'primary':'secondary'}>Decimal → Fraction</Btn></div>
    {mode==='frac2dec'?<Row><Field label="Numerator"><Input value={n} onChange={e=>setN(e.target.value)}/></Field><Field label="Denominator"><Input value={d} onChange={e=>setD(e.target.value)}/></Field></Row>:<Field label="Decimal"><Input value={dec} onChange={e=>setDec(e.target.value)} placeholder="e.g. 0.75"/></Field>}
    <Btn style={{marginTop:'12px'}} onClick={calc}>Convert</Btn>
    <Result>{res}</Result>
  </div>;
}

function DecimalOps() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [op,setOp]=useState('+'); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseFloat(a),y=parseFloat(b);
    if(isNaN(x)||isNaN(y)) return;
    const r = op==='+'?x+y:op==='-'?x-y:op==='×'?x*y:y!==0?x/y:'Cannot divide by zero';
    setRes(typeof r==='string'?r:`${a} ${op} ${b} = ${parseFloat(r.toFixed(10))}`);
  };
  return <div>
    <Row><Field label="First Decimal"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. 3.14"/></Field><Field label="Second Decimal"><Input value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. 2.71"/></Field></Row>
    <div style={{marginTop:'12px'}}><Label>Operation</Label><div style={{display:'flex',gap:'8px'}}>{['+','-','×','÷'].map(o=><Btn key={o} onClick={()=>setOp(o)} variant={op===o?'primary':'secondary'}>{o}</Btn>)}</div></div>
    <Btn style={{marginTop:'16px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function PrimeCheck() {
  const [n,setN]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseInt(n);
    if(isNaN(v)) return;
    setRes(`${v} is ${isPrime(v)?'':'NOT '}a prime number.`+(isPrime(v)?'':v<2?'':` It is divisible by ${primeFactors(v)[0]}.`));
  };
  return <div>
    <Field label="Number"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 97"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Check</Btn>
    <Result>{res}</Result>
  </div>;
}

function IntegerOps() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [op,setOp]=useState('+'); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseInt(a),y=parseInt(b);
    if(isNaN(x)||isNaN(y)) return;
    const r=op==='+'?x+y:op==='-'?x-y:op==='×'?x*y:op==='÷'?y!==0?Math.trunc(x/y):'Cannot divide by zero':op==='mod'?y!==0?x%y:'Cannot mod by zero':0;
    setRes(typeof r==='string'?r:`${x} ${op} ${y} = ${r}`);
  };
  return <div>
    <Row><Field label="Integer A"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. -5"/></Field><Field label="Integer B"><Input value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. 3"/></Field></Row>
    <div style={{marginTop:'12px'}}><Label>Operation</Label><div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>{['+','-','×','÷','mod'].map(o=><Btn key={o} onClick={()=>setOp(o)} variant={op===o?'primary':'secondary'}>{o}</Btn>)}</div></div>
    <Btn style={{marginTop:'16px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function CompareIntegers() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseInt(a),y=parseInt(b);
    if(isNaN(x)||isNaN(y)) return;
    setRes(x>y?`${x} > ${y}`:x<y?`${x} < ${y}`:`${x} = ${y}`);
  };
  return <div>
    <Row><Field label="Integer A"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. -7"/></Field><Field label="Integer B"><Input value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. -3"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Compare</Btn>
    <Result>{res}</Result>
  </div>;
}

function FractionOps() {
  const [n1,setN1]=useState(''); const [d1,setD1]=useState(''); const [n2,setN2]=useState(''); const [d2,setD2]=useState(''); const [op,setOp]=useState('+'); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseInt(n1),b=parseInt(d1),c=parseInt(n2),dd=parseInt(d2);
    if([a,b,c,dd].some(isNaN)||b===0||dd===0) return setRes('Invalid');
    let rn,rd;
    if(op==='+'){rn=a*dd+c*b;rd=b*dd;}
    else if(op==='-'){rn=a*dd-c*b;rd=b*dd;}
    else if(op==='×'){rn=a*c;rd=b*dd;}
    else{rn=a*dd;rd=b*c;}
    const [sn,sd]=simplifyFraction(rn,rd);
    setRes(`${a}/${b} ${op} ${c}/${dd} = ${sn}/${sd}`+(rn!==sn?` (simplified from ${rn}/${rd})`:''));
  };
  return <div>
    <Row><Field label="Numerator 1"><Input value={n1} onChange={e=>setN1(e.target.value)}/></Field><Field label="Denominator 1"><Input value={d1} onChange={e=>setD1(e.target.value)}/></Field></Row>
    <div style={{margin:'12px 0'}}><Label>Operation</Label><div style={{display:'flex',gap:'8px'}}>{['+','-','×','÷'].map(o=><Btn key={o} onClick={()=>setOp(o)} variant={op===o?'primary':'secondary'}>{o}</Btn>)}</div></div>
    <Row><Field label="Numerator 2"><Input value={n2} onChange={e=>setN2(e.target.value)}/></Field><Field label="Denominator 2"><Input value={d2} onChange={e=>setD2(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function CompareFractions() {
  const [n1,setN1]=useState(''); const [d1,setD1]=useState(''); const [n2,setN2]=useState(''); const [d2,setD2]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseInt(n1),b=parseInt(d1),c=parseInt(n2),dd=parseInt(d2);
    if([a,b,c,dd].some(isNaN)||b===0||dd===0) return;
    const l=a*dd,r=c*b;
    setRes(l>r?`${a}/${b} > ${c}/${dd}`:l<r?`${a}/${b} < ${c}/${dd}`:`${a}/${b} = ${c}/${dd}`);
  };
  return <div>
    <Row><Field label="Numerator 1"><Input value={n1} onChange={e=>setN1(e.target.value)}/></Field><Field label="Denominator 1"><Input value={d1} onChange={e=>setD1(e.target.value)}/></Field></Row>
    <div style={{height:'12px'}}/>
    <Row><Field label="Numerator 2"><Input value={n2} onChange={e=>setN2(e.target.value)}/></Field><Field label="Denominator 2"><Input value={d2} onChange={e=>setD2(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Compare</Btn>
    <Result>{res}</Result>
  </div>;
}

function Statistics() {
  const [nums,setNums]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const arr=nums.split(/[\s,]+/).map(Number).filter(x=>!isNaN(x));
    if(!arr.length) return;
    const sorted=[...arr].sort((a,b)=>a-b);
    const mean=arr.reduce((s,v)=>s+v,0)/arr.length;
    const n=sorted.length;
    const median=n%2===0?(sorted[n/2-1]+sorted[n/2])/2:sorted[Math.floor(n/2)];
    const freq={};arr.forEach(v=>freq[v]=(freq[v]||0)+1);
    const maxFreq=Math.max(...Object.values(freq));
    const modes=Object.keys(freq).filter(k=>freq[k]===maxFreq).map(Number);
    setRes(`Mean: ${mean.toFixed(4)}\nMedian: ${median}\nMode: ${modes.join(', ')}${maxFreq===1?' (no mode)':''}\nSum: ${arr.reduce((s,v)=>s+v,0)}\nCount: ${n}\nRange: ${sorted[n-1]-sorted[0]}`);
  };
  return <div>
    <Field label="Numbers (comma or space separated)"><Input value={nums} onChange={e=>setNums(e.target.value)} placeholder="e.g. 4, 7, 2, 7, 9, 1"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function LinearEq() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [res,setRes]=useState(null);
  return <div>
    <div style={{background:'#0a0f1e',borderRadius:'8px',padding:'12px 16px',marginBottom:'12px',fontFamily:'JetBrains Mono',color:'#94a3b8',fontSize:'0.85rem'}}>Solve: ax + b = 0</div>
    <Row><Field label="a (coefficient of x)"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. 3"/></Field><Field label="b (constant)"><Input value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. -12"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={()=>{const A=parseFloat(a),B=parseFloat(b);if(isNaN(A)||isNaN(B))return;setRes(A===0?B===0?'Infinite solutions':'No solution':`x = ${-B/A}`);}}>Solve</Btn>
    <Result>{res}</Result>
  </div>;
}

function CompSupAngles() {
  const [a,setA]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseFloat(a);
    if(isNaN(v)||v<0||v>180) return;
    const comp=90-v; const supp=180-v;
    setRes(`Complementary angle: ${comp>=0?comp:'Not possible (angle > 90°)'}\nSupplementary angle: ${supp>=0?supp:'Not possible (angle > 180°)'}`);
  };
  return <div>
    <Field label="Angle (degrees)"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. 60"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.95rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function PythagoreanTriplet() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [c,setC]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseInt(a),y=parseInt(b),z=parseInt(c);
    if([x,y,z].some(isNaN)||[x,y,z].some(v=>v<=0)) return;
    const sides=[x,y,z].sort((a,b)=>a-b);
    const is=sides[0]**2+sides[1]**2===sides[2]**2;
    setRes(`(${sides.join(', ')}) is ${is?'':'NOT '}a Pythagorean triplet.${is?`\n${sides[0]}² + ${sides[1]}² = ${sides[2]}²`:''}`);
  };
  return <div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
      <Field label="Side a"><Input value={a} onChange={e=>setA(e.target.value)}/></Field>
      <Field label="Side b"><Input value={b} onChange={e=>setB(e.target.value)}/></Field>
      <Field label="Side c"><Input value={c} onChange={e=>setC(e.target.value)}/></Field>
    </div>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Check</Btn>
    <Result>{res}</Result>
  </div>;
}

function DecimalPercent() {
  const [mode,setMode]=useState('d2p'); const [val,setVal]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseFloat(val);
    if(isNaN(v)) return;
    setRes(mode==='d2p'?`${v} = ${v*100}%`:`${v}% = ${v/100}`);
  };
  return <div>
    <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}><Btn onClick={()=>setMode('d2p')} variant={mode==='d2p'?'primary':'secondary'}>Decimal → %</Btn><Btn onClick={()=>setMode('p2d')} variant={mode==='p2d'?'primary':'secondary'}>% → Decimal</Btn></div>
    <Field label={mode==='d2p'?'Decimal':'Percentage'}><Input value={val} onChange={e=>setVal(e.target.value)} placeholder={mode==='d2p'?'e.g. 0.75':'e.g. 75'}/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Convert</Btn>
    <Result>{res}</Result>
  </div>;
}

function RatioPercent() {
  const [mode,setMode]=useState('r2p'); const [a,setA]=useState(''); const [b,setB]=useState(''); const [p,setP]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    if(mode==='r2p') {
      const x=parseFloat(a),y=parseFloat(b);
      if(isNaN(x)||isNaN(y)||y===0) return;
      setRes(`${x}:${y} = ${(x/(x+y)*100).toFixed(4)}% : ${(y/(x+y)*100).toFixed(4)}%`);
    } else {
      const v=parseFloat(p);
      if(isNaN(v)) return;
      const g=gcd(Math.round(v*100),10000);
      setRes(`${v}% = ${Math.round(v*100)/g} : ${10000/g}`);
    }
  };
  return <div>
    <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}><Btn onClick={()=>setMode('r2p')} variant={mode==='r2p'?'primary':'secondary'}>Ratio → %</Btn><Btn onClick={()=>setMode('p2r')} variant={mode==='p2r'?'primary':'secondary'}>% → Ratio</Btn></div>
    {mode==='r2p'?<Row><Field label="a"><Input value={a} onChange={e=>setA(e.target.value)}/></Field><Field label="b"><Input value={b} onChange={e=>setB(e.target.value)}/></Field></Row>:<Field label="Percentage"><Input value={p} onChange={e=>setP(e.target.value)} placeholder="e.g. 25"/></Field>}
    <Btn style={{marginTop:'12px'}} onClick={calc}>Convert</Btn>
    <Result>{res}</Result>
  </div>;
}

function Factors() {
  const [n,setN]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseInt(n);
    if(isNaN(v)||v<1) return;
    const f=[];
    for(let i=1;i<=v;i++) if(v%i===0) f.push(i);
    setRes(`Factors of ${v}: ${f.join(', ')}\nTotal: ${f.length} factors`);
  };
  return <div>
    <Field label="Number"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 48"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Find Factors</Btn>
    <Result>{res}</Result>
  </div>;
}

function ProfitLoss() {
  const [cp,setCp]=useState(''); const [sp,setSp]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const c=parseFloat(cp),s=parseFloat(sp);
    if(isNaN(c)||isNaN(s)||c<=0) return;
    const diff=s-c;
    const pct=(Math.abs(diff)/c*100).toFixed(4);
    setRes(diff>0?`Profit = ${diff}\nProfit % = ${pct}%`:diff<0?`Loss = ${Math.abs(diff)}\nLoss % = ${pct}%`:`No Profit, No Loss`);
  };
  return <div>
    <Row><Field label="Cost Price (CP)"><Input value={cp} onChange={e=>setCp(e.target.value)} placeholder="e.g. 500"/></Field><Field label="Selling Price (SP)"><Input value={sp} onChange={e=>setSp(e.target.value)} placeholder="e.g. 650"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function RationalOps() {
  const [n1,setN1]=useState(''); const [d1,setD1]=useState(''); const [n2,setN2]=useState(''); const [d2,setD2]=useState(''); const [op,setOp]=useState('+'); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseInt(n1),b=parseInt(d1),c=parseInt(n2),dd=parseInt(d2);
    if([a,b,c,dd].some(isNaN)||b===0||dd===0) return setRes('Invalid');
    let rn,rd;
    if(op==='+'){rn=a*dd+c*b;rd=b*dd;}
    else if(op==='-'){rn=a*dd-c*b;rd=b*dd;}
    else if(op==='×'){rn=a*c;rd=b*dd;}
    else{if(c===0)return setRes('Cannot divide by zero');rn=a*dd;rd=b*c;}
    const [sn,sd]=simplifyFraction(rn,rd);
    setRes(`= ${sn}/${sd}${sn!==rn?' (simplified)':''}`);
  };
  return <div>
    <Row><Field label="Numerator 1"><Input value={n1} onChange={e=>setN1(e.target.value)}/></Field><Field label="Denominator 1"><Input value={d1} onChange={e=>setD1(e.target.value)}/></Field></Row>
    <div style={{margin:'12px 0'}}><Label>Operation</Label><div style={{display:'flex',gap:'8px'}}>{['+','-','×','÷'].map(o=><Btn key={o} onClick={()=>setOp(o)} variant={op===o?'primary':'secondary'}>{o}</Btn>)}</div></div>
    <Row><Field label="Numerator 2"><Input value={n2} onChange={e=>setN2(e.target.value)}/></Field><Field label="Denominator 2"><Input value={d2} onChange={e=>setD2(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function ReduceRational() {
  const [n,setN]=useState(''); const [d,setD]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const num=parseInt(n),den=parseInt(d);
    if(isNaN(num)||isNaN(den)||den===0) return;
    const [sn,sd]=simplifyFraction(num,den);
    const g=gcd(Math.abs(num),Math.abs(den));
    setRes(`${num}/${den} = ${sn}/${sd}\nGCD used: ${g}`);
  };
  return <div>
    <Row><Field label="Numerator"><Input value={n} onChange={e=>setN(e.target.value)}/></Field><Field label="Denominator"><Input value={d} onChange={e=>setD(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Reduce</Btn>
    <Result>{res}</Result>
  </div>;
}

function CompareRational() {
  const [n1,setN1]=useState(''); const [d1,setD1]=useState(''); const [n2,setN2]=useState(''); const [d2,setD2]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseInt(n1),b=parseInt(d1),c=parseInt(n2),dd=parseInt(d2);
    if([a,b,c,dd].some(isNaN)||b===0||dd===0) return;
    const l=a*dd,r2=c*b;
    setRes(l>r2?`${a}/${b} > ${c}/${dd}`:l<r2?`${a}/${b} < ${c}/${dd}`:`${a}/${b} = ${c}/${dd}`);
  };
  return <div>
    <Row><Field label="Numerator 1"><Input value={n1} onChange={e=>setN1(e.target.value)}/></Field><Field label="Denominator 1"><Input value={d1} onChange={e=>setD1(e.target.value)}/></Field></Row>
    <div style={{height:'12px'}}/>
    <Row><Field label="Numerator 2"><Input value={n2} onChange={e=>setN2(e.target.value)}/></Field><Field label="Denominator 2"><Input value={d2} onChange={e=>setD2(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Compare</Btn>
    <Result>{res}</Result>
  </div>;
}

function PrimeFactorization() {
  const [n,setN]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseInt(n);
    if(isNaN(v)||v<2) return setRes('Enter an integer ≥ 2');
    const f=primeFactors(v);
    const grouped={};f.forEach(p=>grouped[p]=(grouped[p]||0)+1);
    const expr=Object.entries(grouped).map(([p,e])=>e>1?`${p}^${e}`:p).join(' × ');
    setRes(`${v} = ${expr}`);
  };
  return <div>
    <Field label="Number"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 360"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Factorize</Btn>
    <Result>{res}</Result>
  </div>;
}

function SquaresRoots() {
  const [n,setN]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseFloat(n);
    if(isNaN(v)) return;
    const sq=v*v, sr=Math.sqrt(v);
    setRes(`${v}² = ${sq}\n√${v} = ${sr}${Number.isInteger(sr)?' (perfect square)':''}`);
  };
  return <div>
    <Field label="Number"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 9"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function CubesRoots() {
  const [n,setN]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseFloat(n);
    if(isNaN(v)) return;
    const cu=v**3, cr=Math.cbrt(v);
    setRes(`${v}³ = ${cu}\n∛${v} = ${parseFloat(cr.toFixed(10))}${Number.isInteger(cr)?' (perfect cube)':''}`);
  };
  return <div>
    <Field label="Number"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 27"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function GCDLCM() {
  const [nums,setNums]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const arr=nums.split(/[\s,]+/).map(Number).filter(x=>!isNaN(x)&&x>0&&Number.isInteger(x));
    if(arr.length<2) return setRes('Enter at least 2 positive integers');
    const g=arr.reduce((a,b)=>gcd(a,b));
    const l=arr.reduce((a,b)=>lcm(a,b));
    setRes(`GCD (HCF) = ${g}\nLCM = ${l}`);
  };
  return <div>
    <Field label="Numbers (at least 2, comma separated)"><Input value={nums} onChange={e=>setNums(e.target.value)} placeholder="e.g. 12, 18, 24"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate GCD &amp; LCM</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function Factorial2() {
  const [n,setN]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseInt(n);
    if(isNaN(v)||v<0) return setRes('Enter a non-negative integer');
    if(v>20) return setRes('Too large (max 20 for exact)');
    setRes(`${v}! = ${factorial(v)}`);
  };
  return <div>
    <Field label="n (non-negative integer, max 20)"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 7"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function Discount() {
  const [mp,setMp]=useState(''); const [disc,setDisc]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const m=parseFloat(mp),d=parseFloat(disc);
    if(isNaN(m)||isNaN(d)||d<0||d>100) return;
    const discAmt=m*d/100, sp=m-discAmt;
    setRes(`Marked Price: ${m}\nDiscount (${d}%): -${discAmt.toFixed(2)}\nSelling Price: ${sp.toFixed(2)}`);
  };
  return <div>
    <Row><Field label="Marked Price"><Input value={mp} onChange={e=>setMp(e.target.value)} placeholder="e.g. 1200"/></Field><Field label="Discount %"><Input value={disc} onChange={e=>setDisc(e.target.value)} placeholder="e.g. 15"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function SICI() {
  const [p,setP]=useState(''); const [r,setR]=useState(''); const [t,setT]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const P=parseFloat(p),R=parseFloat(r),T=parseFloat(t);
    if([P,R,T].some(isNaN)||P<=0) return;
    const SI=P*R*T/100;
    const CI=P*(Math.pow(1+R/100,T)-1);
    setRes(`Principal: ${P}\nRate: ${R}%  Time: ${T} years\n\nSimple Interest (SI) = ${SI.toFixed(4)}\nAmount (SI) = ${(P+SI).toFixed(4)}\n\nCompound Interest (CI) = ${CI.toFixed(4)}\nAmount (CI) = ${(P+CI).toFixed(4)}\n\nDifference (CI - SI) = ${(CI-SI).toFixed(4)}`);
  };
  return <div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
      <Field label="Principal (P)"><Input value={p} onChange={e=>setP(e.target.value)} placeholder="e.g. 5000"/></Field>
      <Field label="Rate % (R)"><Input value={r} onChange={e=>setR(e.target.value)} placeholder="e.g. 10"/></Field>
      <Field label="Time (T years)"><Input value={t} onChange={e=>setT(e.target.value)} placeholder="e.g. 3"/></Field>
    </div>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate SI &amp; CI</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function AlgebraicIdentities() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseFloat(a),y=parseFloat(b);
    if(isNaN(x)||isNaN(y)) return;
    setRes(`(a+b)² = a²+2ab+b² = ${(x+y)**2}\n(a-b)² = a²-2ab+b² = ${(x-y)**2}\na²-b² = (a+b)(a-b) = ${x**2-y**2}\n(a+b)³ = ${(x+y)**3}\n(a-b)³ = ${(x-y)**3}\na³+b³ = (a+b)(a²-ab+b²) = ${x**3+y**3}\na³-b³ = (a-b)(a²+ab+b²) = ${x**3-y**3}`);
  };
  return <div>
    <Row><Field label="a"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. 3"/></Field><Field label="b"><Input value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. 5"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Evaluate All Identities</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function PolyDivision() {
  const [div,setDiv]=useState(''); const [divis,setDivis]=useState(''); const [res,setRes]=useState(null);
  // Polynomial as array of coefficients [a_n, ..., a_0]
  const parseP = s => s.split(/\s+/).map(Number).filter(x=>!isNaN(x));
  const calc = () => {
    const d=parseP(div), v=parseP(divis);
    if(!d.length||!v.length||v.length>d.length) return setRes('Invalid. Enter coefficients highest to lowest, e.g. "1 -3 2" for x²-3x+2');
    let rem=[...d];
    const q=[];
    for(let i=0;i<=d.length-v.length;i++){
      const coef=rem[i]/v[0];
      q.push(coef);
      for(let j=0;j<v.length;j++) rem[i+j]-=coef*v[j];
    }
    const qStr=q.map((c,i)=>{const exp=q.length-1-i;return `${parseFloat(c.toFixed(6))}x^${exp}`;}).join(' + ');
    const rStr=rem.slice(v.length-1).map((c,i)=>{const exp=rem.slice(v.length-1).length-1-i;return `${parseFloat(c.toFixed(6))}x^${exp}`;}).join(' + ');
    setRes(`Quotient: ${qStr}\nRemainder: ${rStr}`);
  };
  return <div>
    <div style={{background:'#0a0f1e',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',color:'#94a3b8',fontSize:'0.8rem',fontFamily:'DM Sans'}}>Enter coefficients space-separated (highest degree first). E.g. x²-3x+2 → "1 -3 2"</div>
    <Field label="Dividend (e.g. 1 -3 2 for x²-3x+2)"><Input value={div} onChange={e=>setDiv(e.target.value)} placeholder="e.g. 2 -5 3"/></Field>
    <div style={{height:'12px'}}/>
    <Field label="Divisor (e.g. 1 -1 for x-1)"><Input value={divis} onChange={e=>setDivis(e.target.value)} placeholder="e.g. 1 -1"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Divide</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function SystemLinear() {
  // 2x2: ax+by=c, dx+ey=f
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [c,setC]=useState('');
  const [d,setD]=useState(''); const [e,setE]=useState(''); const [f,setF]=useState('');
  const [res,setRes]=useState(null);
  const calc = () => {
    const A=parseFloat(a),B=parseFloat(b),C=parseFloat(c),D=parseFloat(d),E=parseFloat(e),F=parseFloat(f);
    if([A,B,C,D,E,F].some(isNaN)) return;
    const det=A*E-B*D;
    if(det===0) return setRes('No unique solution (parallel or coincident lines)');
    const x=(C*E-B*F)/det;
    const y=(A*F-C*D)/det;
    setRes(`x = ${parseFloat(x.toFixed(8))}\ny = ${parseFloat(y.toFixed(8))}`);
  };
  return <div>
    <div style={{background:'#0a0f1e',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',color:'#94a3b8',fontSize:'0.8rem',fontFamily:'DM Sans'}}>System: ax + by = c  and  dx + ey = f</div>
    <div style={{marginBottom:'8px'}}><Label>Equation 1: ax + by = c</Label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
      {[['a',a,setA],['b',b,setB],['c',c,setC]].map(([l,v,s])=><div key={l}><Label>{l}</Label><Input value={v} onChange={e=>s(e.target.value)}/></div>)}
    </div></div>
    <div><Label>Equation 2: dx + ey = f</Label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
      {[['d',d,setD],['e',e,setE],['f',f,setF]].map(([l,v,s])=><div key={l}><Label>{l}</Label><Input value={v} onChange={ee=>s(ee.target.value)}/></div>)}
    </div></div>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Solve</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.95rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function QuadraticEq() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [c,setC]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const A=parseFloat(a),B=parseFloat(b),C=parseFloat(c);
    if([A,B,C].some(isNaN)||A===0) return setRes('Invalid (a ≠ 0)');
    const disc=B*B-4*A*C;
    if(disc>0){const x1=(-B+Math.sqrt(disc))/(2*A),x2=(-B-Math.sqrt(disc))/(2*A);setRes(`Discriminant = ${disc} > 0 → Two real roots\nx₁ = ${parseFloat(x1.toFixed(8))}\nx₂ = ${parseFloat(x2.toFixed(8))}`);}
    else if(disc===0){setRes(`Discriminant = 0 → One repeated root\nx = ${-B/(2*A)}`);}
    else{const re=-B/(2*A),im=Math.sqrt(-disc)/(2*A);setRes(`Discriminant = ${disc} < 0 → Complex roots\nx₁ = ${parseFloat(re.toFixed(8))} + ${parseFloat(im.toFixed(8))}i\nx₂ = ${parseFloat(re.toFixed(8))} - ${parseFloat(im.toFixed(8))}i`);}
  };
  return <div>
    <div style={{background:'#0a0f1e',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',color:'#94a3b8',fontSize:'0.8rem',fontFamily:'DM Sans'}}>Solve: ax² + bx + c = 0</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
      <Field label="a"><Input value={a} onChange={e=>setA(e.target.value)} placeholder="e.g. 1"/></Field>
      <Field label="b"><Input value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. -5"/></Field>
      <Field label="c"><Input value={c} onChange={e=>setC(e.target.value)} placeholder="e.g. 6"/></Field>
    </div>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Solve</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function DistanceFormula() {
  const [x1,setX1]=useState(''); const [y1,setY1]=useState(''); const [x2,setX2]=useState(''); const [y2,setY2]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseFloat(x1),b=parseFloat(y1),c=parseFloat(x2),d=parseFloat(y2);
    if([a,b,c,d].some(isNaN)) return;
    const dist=Math.sqrt((c-a)**2+(d-b)**2);
    setRes(`Distance = √((${c}-${a})² + (${d}-${b})²) = √${(c-a)**2+(d-b)**2} = ${parseFloat(dist.toFixed(8))}`);
  };
  return <div>
    <Row><Field label="x₁"><Input value={x1} onChange={e=>setX1(e.target.value)}/></Field><Field label="y₁"><Input value={y1} onChange={e=>setY1(e.target.value)}/></Field></Row>
    <div style={{height:'12px'}}/>
    <Row><Field label="x₂"><Input value={x2} onChange={e=>setX2(e.target.value)}/></Field><Field label="y₂"><Input value={y2} onChange={e=>setY2(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function SectionFormula() {
  const [x1,setX1]=useState(''); const [y1,setY1]=useState(''); const [x2,setX2]=useState(''); const [y2,setY2]=useState('');
  const [m,setM]=useState(''); const [n,setN]=useState(''); const [type,setType]=useState('internal'); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseFloat(x1),b=parseFloat(y1),c=parseFloat(x2),d=parseFloat(y2),M=parseFloat(m),N=parseFloat(n);
    if([a,b,c,d,M,N].some(isNaN)) return;
    const px = type==='internal'?(M*c+N*a)/(M+N):(M*c-N*a)/(M-N);
    const py = type==='internal'?(M*d+N*b)/(M+N):(M*d-N*b)/(M-N);
    setRes(`Point = (${parseFloat(px.toFixed(6))}, ${parseFloat(py.toFixed(6))})`);
  };
  return <div>
    <Row><Field label="x₁"><Input value={x1} onChange={e=>setX1(e.target.value)}/></Field><Field label="y₁"><Input value={y1} onChange={e=>setY1(e.target.value)}/></Field></Row>
    <div style={{height:'12px'}}/>
    <Row><Field label="x₂"><Input value={x2} onChange={e=>setX2(e.target.value)}/></Field><Field label="y₂"><Input value={y2} onChange={e=>setY2(e.target.value)}/></Field></Row>
    <div style={{height:'12px'}}/>
    <Row><Field label="m (ratio part 1)"><Input value={m} onChange={e=>setM(e.target.value)}/></Field><Field label="n (ratio part 2)"><Input value={n} onChange={e=>setN(e.target.value)}/></Field></Row>
    <div style={{display:'flex',gap:'8px',marginTop:'12px'}}><Btn onClick={()=>setType('internal')} variant={type==='internal'?'primary':'secondary'}>Internal</Btn><Btn onClick={()=>setType('external')} variant={type==='external'?'primary':'secondary'}>External</Btn></div>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function SlopeCalc() {
  const [x1,setX1]=useState(''); const [y1,setY1]=useState(''); const [x2,setX2]=useState(''); const [y2,setY2]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseFloat(x1),b=parseFloat(y1),c=parseFloat(x2),d=parseFloat(y2);
    if([a,b,c,d].some(isNaN)) return;
    if(c===a) return setRes('Undefined (vertical line)');
    const slope=(d-b)/(c-a);
    const angle=Math.atan(slope)*180/Math.PI;
    setRes(`Slope (m) = (${d}-${b})/(${c}-${a}) = ${parseFloat(slope.toFixed(8))}\nAngle with x-axis = ${parseFloat(angle.toFixed(4))}°`);
  };
  return <div>
    <Row><Field label="x₁"><Input value={x1} onChange={e=>setX1(e.target.value)}/></Field><Field label="y₁"><Input value={y1} onChange={e=>setY1(e.target.value)}/></Field></Row>
    <div style={{height:'12px'}}/>
    <Row><Field label="x₂"><Input value={x2} onChange={e=>setX2(e.target.value)}/></Field><Field label="y₂"><Input value={y2} onChange={e=>setY2(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate Slope</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function LineEquation() {
  const [x1,setX1]=useState(''); const [y1,setY1]=useState(''); const [x2,setX2]=useState(''); const [y2,setY2]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseFloat(x1),b=parseFloat(y1),c=parseFloat(x2),d=parseFloat(y2);
    if([a,b,c,d].some(isNaN)) return;
    if(c===a) return setRes(`Vertical line: x = ${a}`);
    const m=(d-b)/(c-a);
    const intercept=b-m*a;
    const [sm,sd]=simplifyFraction(Math.round((d-b)*1000),Math.round((c-a)*1000));
    setRes(`Slope-intercept: y = ${parseFloat(m.toFixed(6))}x ${intercept>=0?'+':''} ${parseFloat(intercept.toFixed(6))}\nStandard form: ${Math.round((d-b)*1000)}x - ${Math.round((c-a)*1000)}y ${intercept>=0?'+':'-'} ${Math.abs(Math.round(intercept*(c-a)*1000))} = 0`);
  };
  return <div>
    <Row><Field label="x₁"><Input value={x1} onChange={e=>setX1(e.target.value)}/></Field><Field label="y₁"><Input value={y1} onChange={e=>setY1(e.target.value)}/></Field></Row>
    <div style={{height:'12px'}}/>
    <Row><Field label="x₂"><Input value={x2} onChange={e=>setX2(e.target.value)}/></Field><Field label="y₂"><Input value={y2} onChange={e=>setY2(e.target.value)}/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Find Equation</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function Trigonometry() {
  const [angle,setAngle]=useState(''); const [unit,setUnit]=useState('deg'); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseFloat(angle);
    if(isNaN(v)) return;
    const rad=unit==='deg'?v*Math.PI/180:v;
    const s=Math.sin(rad),co=Math.cos(rad),t=Math.tan(rad);
    const fmt=x=>Math.abs(x)>1e10?'undefined':parseFloat(x.toFixed(8));
    setRes(`sin = ${fmt(s)}\ncos = ${fmt(co)}\ntan = ${fmt(t)}\ncosec = ${fmt(1/s)}\nsec = ${fmt(1/co)}\ncot = ${fmt(1/t)}`);
  };
  return <div>
    <Row><Field label="Angle"><Input value={angle} onChange={e=>setAngle(e.target.value)} placeholder="e.g. 30"/></Field>
    <Field label="Unit"><div style={{display:'flex',gap:'8px',marginTop:'4px'}}><Btn onClick={()=>setUnit('deg')} variant={unit==='deg'?'primary':'secondary'}>Degrees</Btn><Btn onClick={()=>setUnit('rad')} variant={unit==='rad'?'primary':'secondary'}>Radians</Btn></div></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate All Ratios</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function TriangleOps() {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [c,setC]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const x=parseFloat(a),y=parseFloat(b),z=parseFloat(c);
    if([x,y,z].some(isNaN)||[x,y,z].some(v=>v<=0)) return;
    if(x+y<=z||x+z<=y||y+z<=x) return setRes('Not a valid triangle (violates triangle inequality)');
    const s=(x+y+z)/2;
    const area=Math.sqrt(s*(s-x)*(s-y)*(s-z));
    const A=Math.acos((y*y+z*z-x*x)/(2*y*z))*180/Math.PI;
    const B=Math.acos((x*x+z*z-y*y)/(2*x*z))*180/Math.PI;
    const C=180-A-B;
    const type=x===y&&y===z?'Equilateral':x===y||y===z||x===z?'Isosceles':'Scalene';
    const angType=A===90||B===90||C===90?'Right':A>90||B>90||C>90?'Obtuse':'Acute';
    setRes(`Perimeter = ${x+y+z}\nArea = ${parseFloat(area.toFixed(6))} (Heron's formula)\nAngle A = ${parseFloat(A.toFixed(4))}°\nAngle B = ${parseFloat(B.toFixed(4))}°\nAngle C = ${parseFloat(C.toFixed(4))}°\nType: ${type}, ${angType}`);
  };
  return <div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
      <Field label="Side a"><Input value={a} onChange={e=>setA(e.target.value)}/></Field>
      <Field label="Side b"><Input value={b} onChange={e=>setB(e.target.value)}/></Field>
      <Field label="Side c"><Input value={c} onChange={e=>setC(e.target.value)}/></Field>
    </div>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Analyze Triangle</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function DegRad() {
  const [val,setVal]=useState(''); const [mode,setMode]=useState('d2r'); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseFloat(val);
    if(isNaN(v)) return;
    setRes(mode==='d2r'?`${v}° = ${parseFloat((v*Math.PI/180).toFixed(8))} rad`:`${v} rad = ${parseFloat((v*180/Math.PI).toFixed(8))}°`);
  };
  return <div>
    <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}><Btn onClick={()=>setMode('d2r')} variant={mode==='d2r'?'primary':'secondary'}>Degrees → Radians</Btn><Btn onClick={()=>setMode('r2d')} variant={mode==='r2d'?'primary':'secondary'}>Radians → Degrees</Btn></div>
    <Field label="Value"><Input value={val} onChange={e=>setVal(e.target.value)} placeholder={mode==='d2r'?'e.g. 90':'e.g. 1.5708'}/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Convert</Btn>
    <Result>{res}</Result>
  </div>;
}

function ComplexOps() {
  const [r1,setR1]=useState(''); const [i1,setI1]=useState(''); const [r2,setR2]=useState(''); const [i2,setI2]=useState('');
  const [op,setOp]=useState('+'); const [res,setRes]=useState(null);
  const fmt=(r,i)=>{const ir=parseFloat(r.toFixed(6)),ii=parseFloat(i.toFixed(6));return ii===0?`${ir}`:ir===0?`${ii}i`:`${ir} ${ii>=0?'+':'-'} ${Math.abs(ii)}i`;};
  const calc = () => {
    const a=parseFloat(r1),b=parseFloat(i1),c=parseFloat(r2),d=parseFloat(i2);
    if([a,b,c,d].some(isNaN)) return;
    let rr,ri;
    if(op==='+'){rr=a+c;ri=b+d;}
    else if(op==='-'){rr=a-c;ri=b-d;}
    else if(op==='×'){rr=a*c-b*d;ri=a*d+b*c;}
    else{const denom=c*c+d*d;if(denom===0)return setRes('Cannot divide by zero');rr=(a*c+b*d)/denom;ri=(b*c-a*d)/denom;}
    const mag=Math.sqrt(rr**2+ri**2);
    setRes(`Result: ${fmt(rr,ri)}\nModulus: ${parseFloat(mag.toFixed(8))}`);
  };
  return <div>
    <div style={{background:'#0a0f1e',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',color:'#94a3b8',fontSize:'0.8rem',fontFamily:'DM Sans'}}>Enter real and imaginary parts for each complex number (a + bi)</div>
    <Row><Field label="Real part (a)"><Input value={r1} onChange={e=>setR1(e.target.value)} placeholder="3"/></Field><Field label="Imaginary part (b)"><Input value={i1} onChange={e=>setI1(e.target.value)} placeholder="4"/></Field></Row>
    <div style={{margin:'12px 0'}}><Label>Operation</Label><div style={{display:'flex',gap:'8px'}}>{['+','-','×','÷'].map(o=><Btn key={o} onClick={()=>setOp(o)} variant={op===o?'primary':'secondary'}>{o}</Btn>)}</div></div>
    <Row><Field label="Real part (c)"><Input value={r2} onChange={e=>setR2(e.target.value)} placeholder="1"/></Field><Field label="Imaginary part (d)"><Input value={i2} onChange={e=>setI2(e.target.value)} placeholder="-2"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function Permutation() {
  const [n,setN]=useState(''); const [r,setR]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const N=parseInt(n),R=parseInt(r);
    if(isNaN(N)||isNaN(R)||R<0||R>N||N>20) return setRes('Invalid (ensure 0 ≤ r ≤ n ≤ 20)');
    const npr=factorial(N)/factorial(N-R);
    const ncr=factorial(N)/(factorial(R)*factorial(N-R));
    setRes(`nPr = P(${N},${R}) = ${N}!/(${N}-${R})! = ${npr}\nnCr = C(${N},${R}) = ${N}!/(${R}!×${N-R}!) = ${ncr}`);
  };
  return <div>
    <Row><Field label="n"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 5"/></Field><Field label="r"><Input value={r} onChange={e=>setR(e.target.value)} placeholder="e.g. 2"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate nPr &amp; nCr</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function Fibonacci() {
  const [n,setN]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const v=parseInt(n);
    if(isNaN(v)||v<1||v>50) return setRes('Enter between 1 and 50');
    const seq=[0,1];
    for(let i=2;i<v;i++) seq.push(seq[i-1]+seq[i-2]);
    setRes(seq.slice(0,v).join(', '));
  };
  return <div>
    <Field label="Number of terms (1–50)"><Input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. 10"/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Generate</Btn>
    <Result label="Fibonacci Sequence">{res}</Result>
  </div>;
}

function AngleBetweenLines() {
  const [m1,setM1]=useState(''); const [m2,setM2]=useState(''); const [res,setRes]=useState(null);
  const calc = () => {
    const a=parseFloat(m1),b=parseFloat(m2);
    if(isNaN(a)||isNaN(b)) return;
    if(1+a*b===0) return setRes('Lines are perpendicular (90°)');
    const tan=Math.abs((a-b)/(1+a*b));
    const angle=Math.atan(tan)*180/Math.PI;
    setRes(`tan(θ) = |m1-m2|/|1+m1×m2| = ${parseFloat(tan.toFixed(6))}\nAcute angle = ${parseFloat(angle.toFixed(4))}°\nObtuse angle = ${parseFloat((180-angle).toFixed(4))}°`);
  };
  return <div>
    <Row><Field label="Slope m1"><Input value={m1} onChange={e=>setM1(e.target.value)} placeholder="e.g. 2"/></Field><Field label="Slope m2"><Input value={m2} onChange={e=>setM2(e.target.value)} placeholder="e.g. -1"/></Field></Row>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate Angle</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function MatrixOps() {
  const empty2 = ()=>[[0,0],[0,0]];
  const [size,setSize]=useState(2);
  const [A,setA]=useState(empty2()); const [B,setB]=useState(empty2()); const [op,setOp]=useState('add'); const [res,setRes]=useState(null);
  const resize = s => { setSize(s); setA(Array.from({length:s},()=>Array(s).fill(0))); setB(Array.from({length:s},()=>Array(s).fill(0))); setRes(null); };
  const updateA=(i,j,v)=>setA(p=>{const n=[...p.map(r=>[...r])];n[i][j]=parseFloat(v)||0;return n;});
  const updateB=(i,j,v)=>setB(p=>{const n=[...p.map(r=>[...r])];n[i][j]=parseFloat(v)||0;return n;});
  const fmt=M=>M.map(r=>r.map(v=>parseFloat(v.toFixed(4))).join('\t')).join('\n');
  const calc = () => {
    try {
      if(op==='add') setRes('A + B =\n'+fmt(matAdd(A,B)));
      else if(op==='sub') setRes('A - B =\n'+fmt(matSub(A,B)));
      else if(op==='mul') setRes('A × B =\n'+fmt(matMul(A,B)));
      else if(op==='trans') setRes('Transpose of A =\n'+fmt(matTranspose(A)));
      else if(op==='det') setRes(size===2?`det(A) = ${det2(A)}`:`det(A) = ${det3(A)}`);
      else if(op==='inv') { if(size!==2) return setRes('Inverse only supported for 2×2 here'); const d=det2(A); if(d===0)return setRes('Matrix is singular, no inverse'); setRes('Inverse of A =\n'+fmt(inv2(A))); }
    } catch(e) { setRes('Error: '+e.message); }
  };
  const MatInput = ({mat,update}) => <div style={{display:'grid',gridTemplateColumns:`repeat(${size},1fr)`,gap:'4px'}}>
    {mat.map((row,i)=>row.map((v,j)=><input key={`${i}${j}`} value={v} onChange={e=>update(i,j,e.target.value)} style={{background:'#0f1729',border:'1px solid #2d3f6b',borderRadius:'4px',padding:'6px',color:'#e2e8f0',fontFamily:'JetBrains Mono',fontSize:'0.85rem',textAlign:'center',width:'100%',boxSizing:'border-box'}}/>))}
  </div>;
  return <div>
    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
      <Label>Size:</Label>
      {[2,3].map(s=><Btn key={s} onClick={()=>resize(s)} variant={size===s?'primary':'secondary'}>{s}×{s}</Btn>)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'12px'}}>
      <div><Label>Matrix A</Label><MatInput mat={A} update={updateA}/></div>
      {!['trans','det','inv'].includes(op)&&<div><Label>Matrix B</Label><MatInput mat={B} update={updateB}/></div>}
    </div>
    <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'}}>
      {[['add','A+B'],['sub','A-B'],['mul','A×B'],['trans','Transpose A'],['det','Det(A)'],['inv','Inverse A']].map(([k,l])=><Btn key={k} onClick={()=>setOp(k)} variant={op===k?'primary':'secondary'}>{l}</Btn>)}
    </div>
    <Btn onClick={calc}>Calculate</Btn>
    {res&&<div style={{marginTop:'16px',background:'#0a0f1e',border:'1px solid #f59e0b33',borderRadius:'10px',padding:'16px 20px'}}><pre style={{fontFamily:'JetBrains Mono',color:'#f8fafc',fontSize:'0.9rem',margin:0,lineHeight:'1.9'}}>{res}</pre></div>}
  </div>;
}

function Determinant() {
  const [size,setSize]=useState(2);
  const [mat,setMat]=useState([[0,0],[0,0]]); const [res,setRes]=useState(null);
  const resize=s=>{setSize(s);setMat(Array.from({length:s},()=>Array(s).fill(0)));setRes(null);};
  const update=(i,j,v)=>setMat(p=>{const n=[...p.map(r=>[...r])];n[i][j]=parseFloat(v)||0;return n;});
  const calc=()=>{setRes(size===2?`det = ${det2(mat)}`:`det = ${det3(mat)}`);};
  return <div>
    <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>{[2,3].map(s=><Btn key={s} onClick={()=>resize(s)} variant={size===s?'primary':'secondary'}>{s}×{s}</Btn>)}</div>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${size},1fr)`,gap:'6px',marginBottom:'12px'}}>
      {mat.map((r,i)=>r.map((v,j)=><input key={`${i}${j}`} value={v} onChange={e=>update(i,j,e.target.value)} style={{background:'#0f1729',border:'1px solid #2d3f6b',borderRadius:'4px',padding:'8px',color:'#e2e8f0',fontFamily:'JetBrains Mono',fontSize:'0.9rem',textAlign:'center',width:'100%',boxSizing:'border-box'}}/>))}
    </div>
    <Btn onClick={calc}>Calculate Determinant</Btn>
    <Result>{res}</Result>
  </div>;
}

function VectorOps() {
  const [op,setOp]=useState('add');
  const [a,setA]=useState(['','','']); const [b,setB]=useState(['','','']); const [res,setRes]=useState(null);
  const va=a.map(Number); const vb=b.map(Number);
  const calc=()=>{
    if(va.some(isNaN)||vb.some(isNaN)) return;
    const [ax,ay,az]=va, [bx,by,bz]=vb;
    if(op==='add') setRes(`(${ax+bx}, ${ay+by}, ${az+bz})`);
    else if(op==='sub') setRes(`(${ax-bx}, ${ay-by}, ${az-bz})`);
    else if(op==='dot') setRes(`A·B = ${ax*bx+ay*by+az*bz}`);
    else if(op==='cross') setRes(`A×B = (${ay*bz-az*by}, ${az*bx-ax*bz}, ${ax*by-ay*bx})`);
    else if(op==='magA') setRes(`|A| = ${parseFloat(Math.sqrt(ax**2+ay**2+az**2).toFixed(8))}`);
    else if(op==='magB') setRes(`|B| = ${parseFloat(Math.sqrt(bx**2+by**2+bz**2).toFixed(8))}`);
  };
  return <div>
    <Row>
      <div><Label>Vector A (x, y, z)</Label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px'}}>{[0,1,2].map(i=><input key={i} value={a[i]} placeholder={['x','y','z'][i]} onChange={e=>setA(p=>{const n=[...p];n[i]=e.target.value;return n;})} style={{background:'#0f1729',border:'1px solid #2d3f6b',borderRadius:'6px',padding:'8px',color:'#e2e8f0',fontFamily:'JetBrains Mono',fontSize:'0.85rem',textAlign:'center',boxSizing:'border-box'}}/>)}</div></div>
      <div><Label>Vector B (x, y, z)</Label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px'}}>{[0,1,2].map(i=><input key={i} value={b[i]} placeholder={['x','y','z'][i]} onChange={e=>setB(p=>{const n=[...p];n[i]=e.target.value;return n;})} style={{background:'#0f1729',border:'1px solid #2d3f6b',borderRadius:'6px',padding:'8px',color:'#e2e8f0',fontFamily:'JetBrains Mono',fontSize:'0.85rem',textAlign:'center',boxSizing:'border-box'}}/>)}</div></div>
    </Row>
    <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'12px'}}>
      {[['add','A+B'],['sub','A-B'],['dot','Dot Product'],['cross','Cross Product'],['magA','|A|'],['magB','|B|']].map(([k,l])=><Btn key={k} onClick={()=>setOp(k)} variant={op===k?'primary':'secondary'}>{l}</Btn>)}
    </div>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Calculate</Btn>
    <Result>{res}</Result>
  </div>;
}

function DecBin() {
  const [val,setVal]=useState(''); const [mode,setMode]=useState('d2b'); const [res,setRes]=useState(null);
  const calc=()=>{
    if(mode==='d2b'){const v=parseInt(val);if(isNaN(v))return;setRes(`${v} (decimal) = ${decimalToBinary(v)} (binary)`);}
    else{if(!/^[01]+$/.test(val))return setRes('Invalid binary');setRes(`${val} (binary) = ${binaryToDecimal(val)} (decimal)`);}
  };
  return <div>
    <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}><Btn onClick={()=>setMode('d2b')} variant={mode==='d2b'?'primary':'secondary'}>Decimal → Binary</Btn><Btn onClick={()=>setMode('b2d')} variant={mode==='b2d'?'primary':'secondary'}>Binary → Decimal</Btn></div>
    <Field label={mode==='d2b'?'Decimal Number':'Binary Number'}><Input value={val} onChange={e=>setVal(e.target.value)} placeholder={mode==='d2b'?'e.g. 42':'e.g. 101010'}/></Field>
    <Btn style={{marginTop:'12px'}} onClick={calc}>Convert</Btn>
    <Result>{res}</Result>
  </div>;
}

function SurfaceAreaVolume() { return <Mensuration/>; }

// ─── TOPIC REGISTRY ─────────────────────────────────────────────────────────
const categories = [
  {
    name:'Basic Arithmetic', icon:'🔢',
    topics:[
      {id:1,name:'Simple Algebra',desc:'Add, subtract, multiply, divide',component:SimpleAlgebra},
      {id:2,name:'Number ↔ Words',desc:'Convert numbers to/from words',component:NumberWords},
      {id:3,name:'Random Number',desc:'Generate random numbers',component:RandomNumber},
      {id:4,name:'Sort Numbers',desc:'Ascending & descending order',component:ArrangeNumbers},
      {id:5,name:'Number Expansion',desc:'Expanded form of numbers',component:NumberExpansion},
      {id:6,name:'Compare Numbers',desc:'Greater, lesser, or equal',component:CompareNumbers},
      {id:7,name:'Max & Min',desc:'Find maximum and minimum',component:MaxMin},
      {id:8,name:'Multiplication Table',desc:'Generate times tables',component:MultiplicationTable},
    ]
  },
  {
    name:'Fractions & Decimals', icon:'½',
    topics:[
      {id:9,name:'Simplify Fraction',desc:'Reduce to simplest form',component:SimplifyFraction},
      {id:13,name:'Mixed ↔ Improper',desc:'Convert fraction types',component:MixedImproper},
      {id:14,name:'Fraction ↔ Decimal',desc:'Convert between forms',component:FractionDecimal},
      {id:15,name:'Decimal Operations',desc:'+, -, ×, ÷ on decimals',component:DecimalOps},
      {id:19,name:'Fraction Operations',desc:'+, -, ×, ÷ on fractions',component:FractionOps},
      {id:20,name:'Compare Fractions',desc:'Which fraction is larger?',component:CompareFractions},
    ]
  },
  {
    name:'Integers & Number Theory', icon:'ℤ',
    topics:[
      {id:16,name:'Prime Number Check',desc:'Is it prime?',component:PrimeCheck},
      {id:17,name:'Integer Operations',desc:'Operations on integers',component:IntegerOps},
      {id:18,name:'Compare Integers',desc:'Compare signed integers',component:CompareIntegers},
      {id:27,name:'Factors',desc:'Find all factors of a number',component:Factors},
      {id:32,name:'Prime Factorization',desc:'Express as prime factors',component:PrimeFactorization},
      {id:33,name:'Squares & Roots',desc:'Square and square root',component:SquaresRoots},
      {id:34,name:'Cubes & Cube Roots',desc:'Cube and cube root',component:CubesRoots},
      {id:35,name:'GCD & LCM',desc:'Greatest common divisor & LCM',component:GCDLCM},
      {id:36,name:'Factorial',desc:'Calculate n!',component:Factorial2},
      {id:53,name:'Fibonacci Series',desc:'Generate Fibonacci sequence',component:Fibonacci},
    ]
  },
  {
    name:'Percentages & Finance', icon:'%',
    topics:[
      {id:25,name:'Decimal ↔ Percent',desc:'Convert between forms',component:DecimalPercent},
      {id:26,name:'Ratio ↔ Percent',desc:'Convert ratios and percentages',component:RatioPercent},
      {id:28,name:'Profit & Loss',desc:'Calculate profit/loss %',component:ProfitLoss},
      {id:37,name:'Discount',desc:'Marked price & discounts',component:Discount},
      {id:38,name:'SI & CI',desc:'Simple & compound interest',component:SICI},
    ]
  },
  {
    name:'Rational Numbers', icon:'ℚ',
    topics:[
      {id:29,name:'Rational Operations',desc:'+, -, ×, ÷ on rationals',component:RationalOps},
      {id:30,name:'Reduce Rational',desc:'Simplify rational numbers',component:ReduceRational},
      {id:31,name:'Compare Rationals',desc:'Compare two rationals',component:CompareRational},
    ]
  },
  {
    name:'Statistics', icon:'📊',
    topics:[
      {id:21,name:'Mean, Median, Mode',desc:'Measures of central tendency',component:Statistics},
    ]
  },
  {
    name:'Algebra', icon:'𝑥',
    topics:[
      {id:22,name:'Linear Equation',desc:'Solve ax + b = 0',component:LinearEq},
      {id:39,name:'Algebraic Identities',desc:'Evaluate all standard identities',component:AlgebraicIdentities},
      {id:40,name:'Polynomial Division',desc:'Divide polynomials',component:PolyDivision},
      {id:41,name:'System of Equations',desc:'Solve 2×2 linear system',component:SystemLinear},
      {id:43,name:'Quadratic Equation',desc:'Solve ax² + bx + c = 0',component:QuadraticEq},
    ]
  },
  {
    name:'Geometry', icon:'📐',
    topics:[
      {id:10,name:'Clock Angle',desc:'Angle between clock hands',component:ClockAngle},
      {id:11,name:'Mensuration',desc:'Area, perimeter, volume of shapes',component:Mensuration},
      {id:12,name:'Angle Classifier',desc:'Acute, right, obtuse, reflex',component:AngleDecider},
      {id:23,name:'Comp. & Supp. Angles',desc:'Complementary & supplementary',component:CompSupAngles},
      {id:24,name:'Pythagorean Triplet',desc:'Check if sides form a triplet',component:PythagoreanTriplet},
      {id:42,name:'Surface Area & Volume',desc:'3D shape calculations',component:SurfaceAreaVolume},
      {id:44,name:'Distance Formula',desc:'Distance between two points',component:DistanceFormula},
      {id:45,name:'Section Formula',desc:'Point dividing a line segment',component:SectionFormula},
      {id:46,name:'Slope Calculator',desc:'Slope of a line',component:SlopeCalc},
      {id:47,name:'Equation of Line',desc:'Find line equation from 2 points',component:LineEquation},
      {id:54,name:'Angle Between Lines',desc:'Angle between two lines',component:AngleBetweenLines},
      {id:49,name:'Triangle Operations',desc:'Area, angles, type of triangle',component:TriangleOps},
    ]
  },
  {
    name:'Trigonometry', icon:'sin',
    topics:[
      {id:48,name:'Trig Ratios',desc:'sin, cos, tan, cosec, sec, cot',component:Trigonometry},
      {id:50,name:'Degrees ↔ Radians',desc:'Convert angle units',component:DegRad},
    ]
  },
  {
    name:'Advanced Math', icon:'∑',
    topics:[
      {id:51,name:'Complex Numbers',desc:'+, -, ×, ÷ on complex numbers',component:ComplexOps},
      {id:52,name:'nPr & nCr',desc:'Permutations and combinations',component:Permutation},
      {id:55,name:'Matrix Operations',desc:'Add, subtract, multiply, transpose, inverse',component:MatrixOps},
      {id:56,name:'Determinants',desc:'Calculate matrix determinant',component:Determinant},
      {id:57,name:'Vector Operations',desc:'Add, subtract, dot/cross product',component:VectorOps},
      {id:58,name:'Decimal ↔ Binary',desc:'Convert number bases',component:DecBin},
    ]
  },
];

const allTopics = categories.flatMap(c=>c.topics.map(t=>({...t,category:c.name})));

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [selected,setSelected]=useState(allTopics[0]);
  const [search,setSearch]=useState('');
  const [openCats,setOpenCats]=useState(()=>new Set(categories.map(c=>c.name)));

  const filteredCats = useMemo(()=>{
    if(!search.trim()) return categories;
    const q=search.toLowerCase();
    return categories.map(c=>({...c,topics:c.topics.filter(t=>t.name.toLowerCase().includes(q)||t.desc.toLowerCase().includes(q)||String(t.id).includes(q))})).filter(c=>c.topics.length>0);
  },[search]);

  const toggleCat = name => setOpenCats(p=>{const n=new Set(p);n.has(name)?n.delete(name):n.add(name);return n;});

  const ActiveComp = selected.component;

  return (
    <div style={{display:'flex',height:'100vh',background:'#0f1729',fontFamily:'DM Sans',color:'#e2e8f0',overflow:'hidden'}}>
      {/* Sidebar */}
      <div style={{width:'280px',minWidth:'280px',background:'#0a0f1e',borderRight:'1px solid #1e2d4d',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Logo */}
        <div style={{padding:'20px 20px 16px',borderBottom:'1px solid #1e2d4d'}}>
          <div style={{fontFamily:'Playfair Display',fontSize:'1.3rem',fontWeight:700,color:'#f59e0b',letterSpacing:'0.02em'}}>Skillora</div>
          <div style={{fontSize:'0.72rem',color:'#475569',marginTop:'2px',fontFamily:'DM Sans',letterSpacing:'0.05em',textTransform:'uppercase'}}>Math Calculator · 58 Topics</div>
        </div>
        {/* Search */}
        <div style={{padding:'12px 16px',borderBottom:'1px solid #1e2d4d'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#475569',fontSize:'0.85rem'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search topics..." style={{width:'100%',background:'#0f1729',border:'1px solid #2d3f6b',borderRadius:'8px',padding:'8px 10px 8px 30px',color:'#e2e8f0',fontFamily:'DM Sans',fontSize:'0.85rem',outline:'none',boxSizing:'border-box'}}/>
          </div>
        </div>
        {/* Topics */}
        <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          {filteredCats.map(cat=>(
            <div key={cat.name}>
              <button onClick={()=>toggleCat(cat.name)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',background:'none',border:'none',cursor:'pointer',color:'#64748b',fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'DM Sans',fontWeight:600}}>
                <span>{cat.icon} {cat.name}</span>
                <span style={{fontSize:'0.7rem'}}>{openCats.has(cat.name)?'▾':'▸'}</span>
              </button>
              {openCats.has(cat.name)&&cat.topics.map(t=>(
                <button key={t.id} onClick={()=>{setSelected(t);}} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'8px 16px 8px 28px',background:selected.id===t.id?'#1e2d4d':'none',border:'none',cursor:'pointer',textAlign:'left',transition:'background 0.1s',borderLeft:selected.id===t.id?'3px solid #f59e0b':'3px solid transparent'}}>
                  <div>
                    <div style={{fontSize:'0.83rem',color:selected.id===t.id?'#f8fafc':'#94a3b8',fontWeight:selected.id===t.id?500:400}}>{t.name}</div>
                    <div style={{fontSize:'0.7rem',color:'#475569'}}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:'10px 16px',borderTop:'1px solid #1e2d4d',fontSize:'0.68rem',color:'#334155',textAlign:'center'}}>skillora.life</div>
      </div>

      {/* Main Content */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'20px 32px 16px',borderBottom:'1px solid #1e2d4d',background:'#0a0f1e'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{background:'#f59e0b22',color:'#f59e0b',borderRadius:'6px',padding:'3px 8px',fontSize:'0.7rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>{selected.category}</span>
            <span style={{color:'#334155',fontSize:'0.8rem'}}>#{selected.id}</span>
          </div>
          <div style={{fontFamily:'Playfair Display',fontSize:'1.6rem',fontWeight:700,color:'#f8fafc',marginTop:'4px'}}>{selected.name}</div>
          <div style={{color:'#64748b',fontSize:'0.85rem',marginTop:'2px'}}>{selected.desc}</div>
        </div>

        {/* Calculator Area */}
        <div style={{flex:1,overflowY:'auto',padding:'28px 32px'}}>
          <div style={{maxWidth:'640px'}}>
            <ActiveComp key={selected.id}/>
          </div>
        </div>
      </div>
    </div>
  );
}
