'use strict';
(() => {
  const canvas=document.getElementById('data-surface');if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
  const stage=canvas.parentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)'),toggle=document.getElementById('motion-toggle');
  const editing=new URLSearchParams(location.search).has('edit');
  let width=0,height=0,pattern='wave',frame=0,time=0,last=0,visible=false,paused=false,enabled=!editing,opacity=.8,pointer=0,target=0,rgb="22,93,255";
  function point(col,row){const x=(col-21.5)*23,z=(row-12.5)*17;const y=pattern==='wave'?Math.sin(col*.17+time*.35+pointer)*34+Math.cos(row*.21+col*.13+time*.3)*48:pattern==='clusters'?Math.exp(-((col-(13+Math.sin(time*.5)*2))**2+(row-(9+Math.cos(time*.4)*1.5))**2)/(45+Math.sin(time*.7)*15))*(150+pointer*40)+Math.exp(-((col-(31+Math.sin(time*.4)*2.5))**2+(row-(18+Math.cos(time*.6)*2))**2)/32)*(125-pointer*20):Math.sin(col*.24+time*.65)*Math.cos(row*.28)*70+Math.sin(col*.65+time)*12;const scale=Math.min(width/950,height/330);return [width*.56+(x+z*.63)*scale,height*.49+(z*.48-y)*scale];}
  function draw(){
    ctx.fillStyle='#edf4ff';ctx.fillRect(0,0,width,height);
    for(let row=0;row<26;row++){ctx.beginPath();for(let col=0;col<44;col++){const [x,y]=point(col,row);col?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=`rgba(${rgb},${(.22+row/40)*opacity})`;ctx.lineWidth=1.35;ctx.stroke();}
    for(let col=0;col<44;col+=3){ctx.beginPath();for(let row=0;row<26;row++){const [x,y]=point(col,row);row?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=`rgba(${rgb},.12)`;ctx.lineWidth=1;ctx.stroke();}
  }
  function run(stamp){frame=0;if(reduce.matches||document.hidden||!enabled||paused){sync();return;}if(stamp-last>32){time+=Math.min((stamp-last)/1000,.05);pointer+=(target-pointer)*.06;last=stamp;draw();}if(visible&&!document.hidden&&!paused&&!reduce.matches&&enabled)frame=requestAnimationFrame(run);}
  function sync(){cancelAnimationFrame(frame);frame=0;const running=visible&&!document.hidden&&!paused&&!reduce.matches&&enabled;stage.dataset.running=String(running);if(running){last=performance.now();frame=requestAnimationFrame(run);}else draw();}
  function resize(){const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  new ResizeObserver(resize).observe(stage);new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:.05}).observe(stage);
  stage.addEventListener('pointermove',e=>{target=(e.offsetX/width-.5)*1.5;},{passive:true});stage.addEventListener('pointerleave',()=>target=0);
  document.querySelectorAll('[data-pattern]').forEach(button=>button.addEventListener('click',()=>{pattern=button.dataset.pattern;document.querySelectorAll('[data-pattern]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));draw();}));
  toggle.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('dss:motiontoggle')));
  document.addEventListener('dss:motionchange',event=>{paused=event.detail.paused;toggle.setAttribute('aria-label',paused?'Play animation':'Pause animation');toggle.setAttribute('aria-pressed',String(paused));toggle.innerHTML=paused?'<i data-lucide="play"></i>':'<i data-lucide="pause"></i>';window.lucide?.createIcons();sync();});
  window.updateDataSurface=theme=>{if(/^#[0-9a-f]{6}$/i.test(theme.accent||""))rgb=theme.accent.slice(1).match(/../g).map(x=>parseInt(x,16)).join(",");enabled=!editing&&theme.canvasEnabled!==false;opacity=Math.max(.1,Math.min(1,(Number(theme.canvasOpacity)||80)/100));sync();};
  document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));resize();stage.classList.add('is-ready');
})();
