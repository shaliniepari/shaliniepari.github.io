/* Gallery cloud chamber. Never more than 2 tracks on screen at once. */
(function(){
  const wrap=document.getElementById('chamber'), cv=document.getElementById('chamber-cv');
  if(!wrap||!cv||window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c=cv.getContext('2d'); let CW=0,CH=0;
  function size(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    CW=wrap.clientWidth; CH=wrap.clientHeight;
    cv.width=Math.round(CW*dpr); cv.height=Math.round(CH*dpr);
    c.setTransform(dpr,0,0,dpr,0,0);
  }
  size(); window.addEventListener('resize',size);

  const MAX=2, HOLD=2200, FADE=5000;
  const rnd=(a,b)=>a+Math.random()*(b-a), sgn=()=>Math.random()<0.5?-1:1;
  const fade=age=>age<HOLD?1:Math.max(0,1-(age-HOLD)/FADE);
  const diffuse=age=>1+Math.max(0,age-HOLD*0.4)/FADE*2.4;
  const tracks=[]; /*HOOK*/
  let now=performance.now();

  function add(o){
    const t=Object.assign({k:0,dk:0,jit:0.005,w:1.2,a:0.55,speed:0.09,target:400,drop:0.45,done:false,traveled:0},o);
    t.pts=[{x:t.x,y:t.y,t:now,dx:0,dy:0,r:0}]; tracks.push(t);
  }
  function electron(){ const s=sgn(); add({x:rnd(CW*0.12,CW*0.88),y:rnd(CH*0.38,CH*0.62),ang:rnd(0,Math.PI*2),speed:rnd(0.07,0.11),target:rnd(380,760),k:s*rnd(0.008,0.016),dk:s*rnd(0.000008,0.00002)}); }
  function muon(){ const left=Math.random()<0.5; add({x:left?-10:CW+10,y:rnd(CH*0.15,CH*0.85),ang:(left?0:Math.PI)+rnd(-0.3,0.3),speed:rnd(0.12,0.17),target:2400,k:rnd(-0.0006,0.0006),jit:0.003,w:1.1,a:0.45,drop:0.3}); }
  function spawn(){ if(Math.random()<0.8) electron(); else muon(); }

  function step(t,dt){
    if(t.done) return;
    let dist=t.speed*dt;
    while(dist>0&&!t.done){
      const s=Math.min(4,dist); dist-=s;
      t.ang+=t.k*s+(Math.random()-0.5)*2*t.jit; t.k+=t.dk*s;
      t.x+=Math.cos(t.ang)*s; t.y+=Math.sin(t.ang)*s; t.traveled+=s;
      const has=Math.random()<t.drop, sp=2+t.w*1.2;
      t.pts.push({x:t.x,y:t.y,t:now,dx:has?rnd(-sp,sp):0,dy:has?rnd(-sp,sp):0,r:has?rnd(0.4,1.0)*(0.7+t.w*0.22):0});
      if(t.traveled>=t.target||t.x<-120||t.x>CW+120||t.y<-120||t.y>CH+120) t.done=true;
    }
  }
  function draw(t){
    const pts=t.pts,n=pts.length,CHUNK=3;
    c.lineCap='round'; c.lineJoin='round';
    for(let i=1;i<n;i+=CHUNK){
      const end=Math.min(n-1,i+CHUNK-1), mid=pts[Math.min(n-1,i+1)];
      const age=now-mid.t, f=fade(age); if(f<=0) continue;
      const df=diffuse(age), al=t.a*f;
      c.beginPath(); c.moveTo(pts[i-1].x,pts[i-1].y);
      for(let j=i;j<=end;j++) c.lineTo(pts[j].x,pts[j].y);
      c.lineWidth=t.w*4.6*df; c.strokeStyle=`rgba(150,200,245,${al*0.16})`; c.stroke();
      c.lineWidth=t.w*df;     c.strokeStyle=`rgba(80,150,225,${al})`;       c.stroke();
    }
    for(let i=0;i<n;i++){
      const p=pts[i]; if(p.r<=0) continue;
      const age=now-p.t, f=fade(age); if(f<=0) continue;
      const df=diffuse(age);
      c.beginPath(); c.arc(p.x+p.dx*df,p.y+p.dy*df,p.r,0,Math.PI*2); c.fillStyle=`rgba(100,165,230,${t.a*f*0.6})`; c.fill();
    }
    if(!t.done){
      c.beginPath(); c.arc(t.x,t.y,7,0,Math.PI*2); c.fillStyle='rgba(120,185,250,0.1)'; c.fill();
      c.beginPath(); c.arc(t.x,t.y,2,0,Math.PI*2); c.fillStyle='rgba(90,165,245,0.55)'; c.fill();
    }
  }

  let last=now, nextSpawn=now+1200;
  function frame(ts){
    now=ts;
    const dt=Math.min(50,ts-last); last=ts;
    c.clearRect(0,0,CW,CH);
    if(now>=nextSpawn&&tracks.length<MAX){ spawn(); nextSpawn=now+rnd(500,1600); }
    for(const t of tracks){ step(t,dt); draw(t); }
    for(let i=tracks.length-1;i>=0;i--){ const t=tracks[i]; if(t.done&&now-t.pts[t.pts.length-1].t>HOLD+FADE) tracks.splice(i,1); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
