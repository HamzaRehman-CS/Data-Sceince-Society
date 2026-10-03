'use strict';
(() => {
  const missions=[
    {name:'Split the stream',brief:'Two signal streams share the same space. Tune a boundary that separates them.',hint:'A straight boundary can solve this one. Its slope matters.',seed:17,target:p=>p.y>-.62*p.x+.12},
    {name:'The orbit trap',brief:'One signal lives inside an orbit. A straight line will never capture the whole pattern.',hint:'Try an orbit boundary, then tune its radius.',seed:73,target:p=>p.x*p.x+p.y*p.y<.42*.42},
    {name:'A noisy frontier',brief:'The frontier bends, and a few labels are noisy. Aim for a model that works on unseen signals.',hint:'Try a wave. Chase the overall pattern rather than every stray dot.',seed:131,target:p=>p.y>.48*Math.sin(3*p.x)+.05}
  ];
  let run=0,mission=0,model='line',tilt=20,offset=0,radius=30,bend=25,tries=0,best=0,tested=false,unlocked=false,visible=false;
  const root=()=>document.getElementById('model-arcade');
  const coord=p=>({x:205+p.x*166,y:140-p.y*112});
  function samples(seed,count,test=false){let state=seed;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};return Array.from({length:count},(_,i)=>{const p={x:random()*1.9-.95,y:random()*1.9-.95};p.label=Number(missions[mission].target(p));if(mission===2&&i%23===0)p.label=1-p.label;return p;});}
  const threshold=x=>model==='wave'?(bend/100)*Math.sin(3*x)+offset/100:Math.tan(tilt*Math.PI/180)*x+offset/100;
  const predict=p=>Number(model==='orbit'?p.x*p.x+(p.y-offset/100)*(p.y-offset/100)<(radius/100)**2:p.y>threshold(p.x));
  function boundary(){
    if(model==='orbit')return '<ellipse cx="205" cy="'+(140-offset/100*112)+'" rx="'+radius/100*166+'" ry="'+radius/100*112+'"/>';
    return '<path d="'+Array.from({length:81},(_,i)=>{const x=-1+i/40,p=coord({x,y:threshold(x)});return (i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2);}).join(' ')+'"/>';
  }
  function draw(){
    const el=root();if(!el)return;
    const train=samples(missions[mission].seed+run*997,28),test=samples(missions[mission].seed+run*997+2048,64,true),data=tested?test:train;
    el.querySelector('[data-arcade-mission]').textContent=String(mission+1).padStart(2,'0')+' / 03 · '+missions[mission].name;
    el.querySelector('[data-arcade-brief]').textContent=missions[mission].brief;
    el.querySelector('[data-arcade-svg]').innerHTML='<defs><clipPath id="arcade-clip"><rect x="28" y="20" width="354" height="240" rx="14"/></clipPath><filter id="arcade-glow"><feGaussianBlur stdDeviation="3"/></filter></defs><g stroke="#8eb6ff" stroke-opacity=".12">'+[70,140,210].map(y=>'<path d="M28 '+y+'H382"/>').join('')+[94,205,316].map(x=>'<path d="M'+x+' 20V260"/>').join('')+'</g><g clip-path="url(#arcade-clip)"><g class="arcade-boundary-glow" fill="none" stroke="#77b4ff" stroke-width="7" filter="url(#arcade-glow)">'+boundary()+'</g><g class="arcade-boundary" fill="none" stroke="#abd2ff" stroke-width="2" stroke-dasharray="6 4">'+boundary()+'</g>'+data.map((p,i)=>{const c=coord(p),wrong=tested&&predict(p)!==p.label;return '<g class="arcade-signal '+(wrong?'arcade-missed':'')+'" style="--delay:'+i%6*.3+'s">'+(p.label?'<path d="M'+c.x+' '+(c.y-4)+'l4 4-4 4-4-4Z" fill="#b7f2e3"/>':'<circle cx="'+c.x+'" cy="'+c.y+'" r="3.5" fill="#63a6ff"/>')+(wrong?'<circle cx="'+c.x+'" cy="'+c.y+'" r="8" fill="none" stroke="#ffcb9c" stroke-width="1.5"/>':'')+'</g>';}).join('')+'</g><text x="34" y="279" fill="#7892b5" font-size="10">'+(tested?'64 unseen observations · amber rings = mistakes':'28 training observations · fictional data')+'</text>';
    const trainScore=Math.round(train.filter(p=>predict(p)===p.label).length/train.length*100);
    el.querySelector('[data-arcade-train-score]').textContent=trainScore+'%';
    el.querySelector('[data-arcade-test-score]').textContent=tested?Math.round(test.filter(p=>predict(p)===p.label).length/test.length*100)+'%':'—';
    el.querySelector('[data-arcade-tries]').textContent=tries+' / 5 tests';
    el.querySelectorAll('[data-arcade-model]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.arcadeModel===model)));
    el.querySelector('[data-arcade-knob=tilt]').closest('label').hidden=model!=='line';
    el.querySelector('[data-arcade-knob=radius]').closest('label').hidden=model!=='orbit';
    el.querySelector('[data-arcade-knob=bend]').closest('label').hidden=model!=='wave';
    for(const [key,value]of Object.entries({tilt,offset,radius,bend})){const input=el.querySelector('[data-arcade-knob='+key+']');input.value=value;input.closest('label').querySelector('output').textContent=value+(key==='tilt'?'°':'');}
    el.querySelector('[data-arcade-test]').disabled=tries>=5;
    const next=el.querySelector('[data-arcade-next]');next.hidden=!unlocked;next.textContent=mission===2?'Play a new run ↻':'Next mission →';
  }
  function reset(){model='line';tilt=20;offset=0;radius=30;bend=25;tries=0;best=0;tested=false;unlocked=false;draw();root().querySelector('[data-arcade-feedback]').textContent=window.DSS?.content?.portal?.gameDescription||'Choose a model. Tune it. Test on unseen data.';}
  function initialize(){const el=root();if(!el)return;const config=window.DSS?.content?.portal||{};el.querySelector('[data-game-heading]').textContent=config.gameHeading||'Train the signal. Beat the noise.';if(!el.dataset.ready){el.dataset.ready='true';draw();}if(!tries)el.querySelector('[data-arcade-feedback]').textContent=config.gameDescription||'Choose a model. Tune it. Test on unseen data.';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;el.classList.toggle('arcade-quiet',reduced||document.body.classList.contains('page-motion-paused')||!visible||document.hidden);}
  document.addEventListener('click',e=>{
    const el=root();if(!el)return;
    const choice=e.target.closest('[data-arcade-model]');if(choice){model=choice.dataset.arcadeModel;tested=false;draw();}
    if(e.target.closest('[data-arcade-test]')&&tries<5){tries++;tested=true;const test=samples(missions[mission].seed+run*997+2048,64,true),score=Math.round(test.filter(p=>predict(p)===p.label).length/test.length*100);best=Math.max(best,score);unlocked=score>=86||tries===5;el.querySelector('[data-arcade-feedback]').textContent=score>=86?'Mission cleared. '+score+'% on unseen signals.':tries===5?'Best score: '+best+'%. '+missions[mission].hint:'Test score: '+score+'%. '+missions[mission].hint;draw();}
    if(e.target.closest('[data-arcade-next]')){if(mission===2)run++;mission=(mission+1)%3;reset();}
    if(e.target.closest('[data-arcade-restart]'))reset();
  });
  document.addEventListener('input',e=>{const key=e.target.dataset.arcadeKnob;if(!key)return;const v=Number(e.target.value);if(key==='tilt')tilt=v;if(key==='offset')offset=v;if(key==='radius')radius=v;if(key==='bend')bend=v;tested=false;draw();});
  document.addEventListener('dss:rendered',initialize);document.addEventListener('dss:motionchange',initialize);document.addEventListener('visibilitychange',initialize);
  const el=root();if(el)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;initialize();},{threshold:.1}).observe(el);
  initialize();
})();
