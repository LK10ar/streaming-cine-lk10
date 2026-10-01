/* Ciné LK10 — couche visuelle : barre de progression, apparition au scroll, tilt 3D du héros (desktop). */
(function(){
 try{
  var d=document,h=d.documentElement,w=window;
  var mm=function(q){return w.matchMedia&&w.matchMedia(q).matches};
  var c=navigator.connection||{};
  var lite=mm('(prefers-reduced-motion: reduce)')||c.saveData||(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
  if(lite)h.classList.add('fx-lite');

  var bar=d.createElement('div');bar.id='fx-progress';d.body.appendChild(bar);
  var tick=false;
  function upd(){tick=false;var m=Math.max(d.body.scrollHeight,h.scrollHeight)-w.innerHeight;bar.style.transform='scaleX('+(m>0?Math.min(1,w.scrollY/m):0)+')'}
  w.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});

  var io=(!lite&&'IntersectionObserver' in w)?new IntersectionObserver(function(es){
   es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.08,rootMargin:'0px 0px -5% 0px'}):null;
  function scan(){if(!io)return;d.querySelectorAll('#home-page .slider-section:not(.fx-reveal)').forEach(function(s){s.classList.add('fx-reveal');io.observe(s)})}
  scan();
  var hp=d.getElementById('home-page');
  if(hp&&'MutationObserver' in w)new MutationObserver(scan).observe(hp,{childList:true});
  // sécurité : si rien ne s'est révélé, on affiche tout
  setTimeout(function(){if(!d.querySelector('.fx-reveal.in'))d.querySelectorAll('.fx-reveal').forEach(function(s){s.classList.add('in')})},5000);

  if(!lite&&mm('(hover:hover) and (pointer:fine)')&&mm('(min-width:993px)')){
   var hero=d.getElementById('hero-carousel'),raf=0;
   if(hero){
    hero.addEventListener('mousemove',function(e){
     if(raf)return;raf=requestAnimationFrame(function(){raf=0;var r=hero.getBoundingClientRect();
      var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      hero.style.setProperty('--ry',(x*5).toFixed(2)+'deg');hero.style.setProperty('--rx',(-y*3).toFixed(2)+'deg')})
    });
    hero.addEventListener('mouseleave',function(){hero.style.setProperty('--ry','0deg');hero.style.setProperty('--rx','0deg')});
   }
  }
 }catch(e){console.warn('cine-fx',e)}
})();

/* ===== Fond de formes qui s'allument sous la souris + tilt 3D de l'affiche (desktop uniquement) ===== */
(function(){
 try{
  var d=document,w=window,mm=function(q){return w.matchMedia&&w.matchMedia(q).matches};
  var c=navigator.connection||{};
  var lite=mm('(prefers-reduced-motion: reduce)')||c.saveData||(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
  if(lite||!mm('(hover:hover) and (pointer:fine)')||!mm('(min-width:993px)'))return;

  /* tilt 3D de l'affiche dans la fenêtre film */
  d.addEventListener('mousemove',function(e){var p=e.target.closest&&e.target.closest('.d-poster-img');if(!p)return;
   var r=p.getBoundingClientRect();p.style.setProperty('--ry',(((e.clientX-r.left)/r.width-.5)*16).toFixed(1)+'deg');p.style.setProperty('--rx',(-((e.clientY-r.top)/r.height-.5)*12).toFixed(1)+'deg')},{passive:true});
  d.addEventListener('mouseout',function(e){var p=e.target.closest&&e.target.closest('.d-poster-img');
   if(p&&!p.contains(e.relatedTarget)){p.style.setProperty('--ry','0deg');p.style.setProperty('--rx','0deg')}},{passive:true});

  /* fond de formes : 'hex' (nid d'abeille) | 'diamond' (losanges) | 'dot' (points) */
  var SHAPE='hex',R=30,RAD=190,SQ=Math.sqrt(3);
  var base=d.createElement('canvas'),lit=d.createElement('canvas');base.className=lit.className='fx-hexc';
  d.body.appendChild(base);d.body.appendChild(lit);
  var bx=base.getContext('2d'),lx=lit.getContext('2d'),W=0,H=0,dpr=1,cols=0,rows=0,cw=SQ*R,rh=1.5*R;
  var cells={},mx=-9999,my=-9999,run=false;

  function shape(x,y,s,ctx){
   ctx.beginPath();
   if(SHAPE==='dot'){ctx.arc(x,y,s*.5,0,6.2832);return}
   if(SHAPE==='diamond'){ctx.moveTo(x,y-s);ctx.lineTo(x+s*.75,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*.75,y);ctx.closePath();return}
   for(var i=0;i<6;i++){var a=Math.PI/180*(60*i-30),px=x+s*Math.cos(a),py=y+s*Math.sin(a);i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();
  }
  function pos(cc,rr){return[cc*cw+(rr%2?cw/2:0),rr*rh]}
  function size(){
   dpr=Math.min(2,w.devicePixelRatio||1);W=w.innerWidth;H=w.innerHeight;
   [base,lit].forEach(function(k){k.width=W*dpr;k.height=H*dpr});
   bx.setTransform(dpr,0,0,dpr,0,0);lx.setTransform(dpr,0,0,dpr,0,0);
   cols=Math.ceil(W/cw)+2;rows=Math.ceil(H/rh)+2;
   bx.clearRect(0,0,W,H);bx.strokeStyle='rgba(255,222,0,.07)';bx.lineWidth=1;
   for(var r=0;r<rows;r++)for(var cc=0;cc<cols;cc++){var p=pos(cc,r);shape(p[0],p[1],R*.9,bx);bx.stroke()}
  }
  function frame(){
   lx.clearRect(0,0,W,H);
   if(mx>-999){var g=lx.createRadialGradient(mx,my,0,mx,my,280);g.addColorStop(0,'rgba(255,222,0,.09)');g.addColorStop(1,'rgba(255,222,0,0)');lx.fillStyle=g;lx.fillRect(mx-280,my-280,560,560)}
   var n=0;
   for(var k in cells){var s=cells[k];
    lx.fillStyle='rgba(255,222,0,'+(s.a*.14).toFixed(3)+')';lx.strokeStyle='rgba(255,222,0,'+(s.a*.85).toFixed(3)+')';lx.lineWidth=1.2;
    shape(s.x,s.y,R*.9,lx);lx.fill();lx.stroke();
    s.a*=.93;if(s.a<.02)delete cells[k];else n++}
   if(n||mx>-999)requestAnimationFrame(frame);else run=false;
  }
  function kick(){if(!run){run=true;requestAnimationFrame(frame)}}
  w.addEventListener('mousemove',function(e){
   mx=e.clientX;my=e.clientY;
   var r0=Math.max(0,Math.floor((my-RAD)/rh)),r1=Math.min(rows-1,Math.ceil((my+RAD)/rh));
   for(var r=r0;r<=r1;r++){var c0=Math.max(0,Math.floor((mx-RAD)/cw)-1),c1=Math.min(cols-1,Math.ceil((mx+RAD)/cw)+1);
    for(var cc=c0;cc<=c1;cc++){var p=pos(cc,r),dist=Math.hypot(p[0]-mx,p[1]-my);
     if(dist<RAD){var t=1-dist/RAD,a=t*t*(3-2*t),key=r*cols+cc,s=cells[key];
      if(!s)cells[key]={x:p[0],y:p[1],a:a};else if(a>s.a)s.a=a}}}
   kick()},{passive:true});
  d.addEventListener('mouseleave',function(){mx=my=-9999},{passive:true});
  var t=0;w.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(size,200)});
  size();
 }catch(e){console.warn('cine-fx hex',e)}
})();
