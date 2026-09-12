import {DOMAIN,grid,integrate,distribution,doubleWell,doubleWellGrad,rng,langevin,histogram} from './math.js';
const $=id=>document.getElementById(id);
const M='#9c2b5f', T='#176b68', K='#252925', GRID='#e9ece6';
const xs=grid(...DOMAIN), clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=(n,d=2)=>Number(n).toFixed(d).replace(/^-0\.00$/,'0.00');
const val=id=>Number($(id).value);
const out=(id,d=2)=>$(id+'-value').textContent=fmt(val(id),d);
let clipId=0;
function plot({x=xs,curves=[],height=210,ymax,ymin=0,xlabel='x',ylabel='',hist=null,points=[],annotations=[],arrows=null}) {
  const W=580,H=height,L=45,R=15,U=23,B=32, PW=W-L-R,PH=H-U-B;
  const lo=x[0],hi=x.at(-1),max=ymax??Math.max(.1,...curves.flatMap(c=>c.y))*1.13;
  const sx=v=>L+(v-lo)/(hi-lo)*PW, sy=v=>H-B-(v-ymin)/(max-ymin)*PH;
  const clip='plot-clip-'+(clipId++);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${ylabel||'Density'} as a function of ${xlabel}"><defs><clipPath id="${clip}"><rect x="${L}" y="${U}" width="${PW}" height="${PH}"/></clipPath></defs>`;
  for(let i=0;i<=3;i++){const y=ymin+(max-ymin)*i/3; s+=`<line x1="${L}" y1="${sy(y)}" x2="${W-R}" y2="${sy(y)}" stroke="${GRID}"/><text x="${L-8}" y="${sy(y)+3}" text-anchor="end">${fmt(y,Math.abs(max-ymin)>8?0:1)}</text>`;}
  for(let i=Math.ceil(lo);i<=Math.floor(hi);i++)s+=`<line x1="${sx(i)}" y1="${U}" x2="${sx(i)}" y2="${H-B}" stroke="${GRID}" stroke-dasharray="2 4"/><text x="${sx(i)}" y="${H-13}" text-anchor="middle">${i}</text>`;
  s+=`<text x="${L}" y="12" class="axis-title">${ylabel}</text><text x="${W-R}" y="${H-7}" text-anchor="end" class="axis-title">${xlabel}</text><g clip-path="url(#${clip})">`;
  if(hist){const binw=PW/hist.length;hist.forEach((d,i)=>{s+=`<rect x="${L+i*binw+.7}" y="${sy(d)}" width="${binw-1.4}" height="${Math.max(0,sy(0)-sy(d))}" fill="${T}" opacity=".27"/>`;});}
  for(const c of curves){const xx=c.x??x;const d=c.y.map((y,i)=>`${i?'L':'M'}${sx(xx[i]).toFixed(2)},${sy(y).toFixed(2)}`).join('');if(c.fill)s+=`<path d="${d} L${sx(xx.at(-1))},${sy(0)} L${sx(xx[0])},${sy(0)} Z" fill="${c.color}" opacity=".07"/>`;s+=`<path d="${d}" fill="none" stroke="${c.color}" stroke-width="${c.width||2.1}" ${c.dash?'stroke-dasharray="6 5"':''}/>`;}
  for(const a of annotations){s+=`<line x1="${sx(a.x)}" y1="${U}" x2="${sx(a.x)}" y2="${H-B}" stroke="${a.color||K}" stroke-dasharray="3 4" opacity=".35"/>`;}
  for(const p of points)s+=`<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="${p.r||2.4}" fill="${p.color||T}" opacity="${p.opacity??.65}" ${p.stroke?'stroke="white" stroke-width="1.5"':''}/>`;
  if(arrows){for(const a of arrows){const px=sx(a.x),py=sy(a.y),dx=clamp(a.s*7,-23,23);if(Math.abs(dx)<1)continue;const q=px+dx,sgn=Math.sign(dx);s+=`<path d="M${px},${py}H${q}M${q-sgn*4},${py-3}L${q},${py}L${q-sgn*4},${py+3}" fill="none" stroke="${T}" stroke-width="1.4"/>`;}}
  s+='</g>';
  for(const a of annotations)if(a.label)s+=`<text x="${clamp(sx(a.x)+5,L,W-70)}" y="${U+12}" style="fill:${a.color||K};font-size:10px">${a.label}</text>`;
  return s+'</svg>';
}

const START=1.6,END=3000,STRIDE=60;
let frames=[],frameIndex=0,running=false,animation=null,lastFrame=0,densityCeiling=1.5;
const params=()=>({b:val('barrier'),a:val('tilt'),t:val('temperature')});
function setRunLabel(){ $('run').textContent=running?'Pause':frameIndex===frames.length-1?'Replay comparison':frameIndex?'Continue comparison':'Run comparison'; }
function pause(){running=false;if(animation)cancelAnimationFrame(animation);animation=null;setRunLabel();}
function prepareRun(showCompleted=true){
  pause();const {b,a,t}=params(),random=rng(),grad=x=>doubleWellGrad(x,b,a);let points=Array(128).fill(START),descent=START;
  frames=[{points:[...points],descent,steps:0}];
  for(let k=1;k<=END;k++){descent=clamp(descent-.003*grad(descent),...DOMAIN);points=points.map(x=>langevin(x,grad,t,random));if(k%STRIDE===0)frames.push({points:[...points],descent,steps:k});}
  const d=distribution(xs,x=>doubleWell(x,b,a),t);
  densityCeiling=Math.max(1.4,...d.density,...frames.slice(1).flatMap(f=>histogram(f.points,24)))*1.12;
  frameIndex=showCompleted?frames.length-1:0;setRunLabel();renderInference();
}
function renderInference(){
  const {b,a,t}=params(),energy=x=>doubleWell(x,b,a),d=distribution(xs,energy,t),minIndex=d.energy.indexOf(Math.min(...d.energy)),map=xs[minIndex],f=frames[frameIndex];
  for(const id of ['barrier','tilt','temperature'])out(id);
  const pathX=grid(START,f.descent,45);
  $('energy-plot').innerHTML=plot({curves:[{y:d.energy,color:K},{x:pathX,y:pathX.map(energy),color:M,width:3}],height:270,ymin:Math.min(-1,Math.min(...d.energy)-.5),ymax:Math.max(3.8,energy(START)+.5),ylabel:'E(z)',xlabel:'z',points:[...f.points.map((x,i)=>({x,y:energy(x)+.04*(i%3-1),color:T,opacity:.4})),{x:START,y:energy(START),color:'#a2aaa3',r:5.5,opacity:1,stroke:true},{x:f.descent,y:energy(f.descent),color:M,r:6,opacity:1,stroke:true}],annotations:Math.abs(a)<.00001?[{x:-1,label:'global min.',color:K},{x:1,label:'global min.',color:K}]:[{x:map,label:'global min.',color:K}]});
  $('density-plot').innerHTML=plot({curves:[{y:d.density,color:K,fill:true}],height:270,ymax:densityCeiling,ylabel:'Density',xlabel:'z',hist:f.steps?histogram(f.points,24):null});
  $('step-count').textContent=f.steps.toLocaleString()+' steps';$('infer-caption').textContent=f.steps===END?'Completed seeded run':f.steps===0?`Both procedures start at z = ${START}.`:'Same energy and initialization';
  const right=f.points.filter(x=>x>0).length/f.points.length,target=integrate(xs.filter(x=>x>=0),d.density.filter((_,i)=>xs[i]>=0));
  if(f.steps===0){$('inference-result').textContent='Run the comparison to follow the magenta descent point and the teal sampling chains.';return;}
  const error=energy(f.descent)-d.energy[minIndex];
  $('inference-result').textContent=`Descent is at z = ${fmt(f.descent)}${error>.1?', with energy above the global minimum':', near a global minimum'}. ${fmt(right*100,0)}% of the chains are on the right, compared with ${fmt(target*100,0)}% of the target probability.`;
}
function animate(time){if(!running)return;if(time-lastFrame>=90){frameIndex=Math.min(frames.length-1,frameIndex+1);lastFrame=time;renderInference();}if(frameIndex===frames.length-1){pause();return;}animation=requestAnimationFrame(animate);}
$('run').addEventListener('click',()=>{if(running){pause();return;}if(frameIndex===frames.length-1){frameIndex=0;renderInference();}running=true;lastFrame=0;setRunLabel();animation=requestAnimationFrame(animate);});
$('initial-state').addEventListener('click',()=>{pause();frameIndex=0;setRunLabel();renderInference();});
$('infer-reset').addEventListener('click',()=>{Object.entries({barrier:1,tilt:-.5,temperature:.8}).forEach(([id,v])=>$(id).value=v);prepareRun(true);});
for(const id of ['barrier','tilt','temperature'])$(id).addEventListener('input',()=>prepareRun(false));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:0}).observe($('inference'));

function renderComposition(){
  const g=val('goal'),w=val('weight'),A=x=>doubleWell(x,1.3),B=x=>(x-g)**2/(2*.55**2),a=distribution(xs,A),c=distribution(xs,x=>A(x)+w*B(x));out('goal');out('weight',1);
  const energies=[{y:a.energy,color:M,width:2.3},{y:xs.map(x=>w*B(x)),color:T,width:2.3},{y:c.energy,color:K,width:2.6}],densities=[{y:a.density,color:M,width:2.3},{y:c.density,color:K,fill:true,width:2.6}];
  $('compose-energy').innerHTML=plot({curves:energies,height:270,ymax:10,ylabel:'Energy',xlabel:'z',annotations:w?[{x:g,label:'goal',color:T}]:[]});
  $('compose-density').innerHTML=plot({curves:densities,height:270,ymax:Math.max(2,...densities.flatMap(c=>c.y))*1.05,ylabel:'Density',xlabel:'z',annotations:w?[{x:g,label:'goal',color:T}]:[]});
  for(const name of ['none','left','right'])$('goal-'+name).setAttribute('aria-pressed',String(name==='none'?w===0:w===1&&g===(name==='left'?-1:1)));
  const right=integrate(xs.filter(x=>x>=0),c.density.filter((_,i)=>xs[i]>=0));
  $('composition-insight').textContent=w===0?'No goal energy is added. The black and magenta curves coincide: the original two-mode distribution is recovered exactly.':Math.abs(g)<.35?`The goal conflicts with the two original modes. Its weight determines how strongly the model favors an intermediate position.`:`The original model assigns 50% probability to each side. With the ${g<0?'left':'right'} goal, ${fmt(100*(g<0?1-right:right),0)}% of the composed probability lies on the requested side; the original energy stays fixed.`;
}
for(const name of ['none','left','right'])$('goal-'+name).addEventListener('click',()=>{$('goal').value=name==='left'?-1:1;$('weight').value=name==='none'?0:1;renderComposition();});
for(const id of ['goal','weight'])$(id).addEventListener('input',renderComposition);
$('compose-reset').addEventListener('click',()=>{$('goal').value=1;$('weight').value=1;renderComposition();});
prepareRun(true);renderComposition();
