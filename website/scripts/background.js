/* A static wireframe SVG animated as one composited layer. No render loop. */
(() => {
  const host = document.createElement('div'); host.id = 'dss-background'; host.setAttribute('aria-hidden', 'true');
  const path = []; const rings = [];
  const sample = (t, offset=0) => {
    const d=1+Math.sin(t)**2, x=350+285*Math.cos(t)/d, y=210+220*Math.sin(t)*Math.cos(t)/d;
    const dx=-Math.sin(t)*(1+Math.sin(t)**2)-2*Math.cos(t)**2*Math.sin(t), dy=Math.cos(2*t)*d-2*Math.sin(t)**2*Math.cos(t)**2;
    const length=Math.hypot(dx,dy)||1; return [x-offset*dy/length,y+offset*dx/length];
  };
  for(let band=0;band<9;band++) {
    const offset=(band-4)*4.5;
    path.push('<path d="'+Array.from({length:161},(_,i)=>{const [x,y]=sample(i/160*Math.PI*2,offset);return (i?'L':'M')+x.toFixed(1)+','+y.toFixed(1);}).join(' ')+'Z"/>');
  }
  for(let i=0;i<64;i++){const a=sample(i/64*Math.PI*2,-18),b=sample(i/64*Math.PI*2,18);rings.push(`<path d="M${a.join(',')}L${b.join(',')}"/>`);}
  host.innerHTML='<div class="infinity-motion"><svg viewBox="0 0 700 420" role="presentation"><g fill="none" stroke="currentColor" stroke-width=".9">'+path.join('')+rings.join('')+'</g><g fill="currentColor"><circle cx="66" cy="200" r="4"/><circle cx="574" cy="120" r="3"/><circle cx="359" cy="297" r="3"/></g></svg><span class="floating-node node-one"></span><span class="floating-node node-two"></span><span class="floating-node node-three"></span></div>';
  document.body.prepend(host);
  const paused=()=>document.documentElement.classList.toggle('motion-paused',document.hidden);
  document.addEventListener('visibilitychange',paused);paused();
  window.applyBackgroundSettings=theme=>{
    host.hidden=theme?.canvasEnabled===false;
    const opacity=Math.max(10,Math.min(100,Number(theme?.canvasOpacity)||65));host.style.setProperty('--motion-opacity',opacity/100);
  };
})();
