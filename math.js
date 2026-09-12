export const DOMAIN = [-2.4, 2.4];
export const grid = (lo, hi, n=600) => Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n);
export function integrate(xs, ys) { return ys.slice(1).reduce((s,y,i)=>s+(y+ys[i])*(xs[i+1]-xs[i])/2,0); }
export function distribution(xs, energy, temperature=1) {
  const es=xs.map(energy), min=Math.min(...es), ws=es.map(e=>Math.exp(-(e-min)/temperature));
  const area=integrate(xs,ws), density=ws.map(w=>w/area);
  return {energy:es,density,logZ:Math.log(area)-min/temperature,Z:area*Math.exp(-min/temperature)};
}
export const doubleWell = (x, barrier=1.3, tilt=0, offset=0) => barrier*(x*x-1)**2+tilt*x+offset;
export const doubleWellGrad = (x, barrier=1.3, tilt=0) => 4*barrier*x*(x*x-1)+tilt;
export function reflect(x, lo=DOMAIN[0], hi=DOMAIN[1]) {const w=hi-lo; const t=((x-lo)%(2*w)+2*w)%(2*w);return lo+(t<=w?t:2*w-t);}
export function rng(seed=2026) {return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function normal(random=Math.random) {return Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random());}
export function langevin(x, grad, temperature, random, eta=.003) {return reflect(x-eta*grad(x)+Math.sqrt(2*eta*temperature)*normal(random));}
export function histogram(values, bins=36, lo=DOMAIN[0], hi=DOMAIN[1]) {const counts=Array(bins).fill(0),w=(hi-lo)/bins;for(const v of values) counts[Math.min(bins-1,Math.max(0,Math.floor((v-lo)/w)))]+=1;return counts.map(c=>c/Math.max(1,values.length)/w);}
export const gaussian = (x,mean,variance) => Math.exp(-((x-mean)**2)/(2*variance))/Math.sqrt(2*Math.PI*variance);
export function smoothedDensity(x,sigma) {const v=.13+sigma*sigma;return .5*gaussian(x,-1,v)+.5*gaussian(x,1,v);}
export function score(x,sigma) {const v=.13+sigma*sigma, a=gaussian(x,-1,v), b=gaussian(x,1,v);return (-(x+1)*a-(x-1)*b)/(v*(a+b));}
// Symmetric joint Gaussian mixture: component variance .20 and within-component correlation .55.
export function joint(x,y) {const v=.20,r=.55;return [-1,1].reduce((sum,m)=>sum+.5*Math.exp(-((x-m)**2-2*r*(x-m)*(y-m)+(y-m)**2)/(2*v*(1-r*r)))/(2*Math.PI*v*Math.sqrt(1-r*r)),0);}
export function sampleDiscrete(xs,density,random=Math.random) {const sum=density.reduce((s,p)=>s+p,0);let r=random()*sum;for(let i=0;i<xs.length;i++){r-=density[i];if(r<=0)return xs[i];}return xs.at(-1);}
