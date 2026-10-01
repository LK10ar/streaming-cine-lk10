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
