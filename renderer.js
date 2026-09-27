const $ = id => document.getElementById(id);
let rating=0, flaws=0, portrait=false, aligning=false, offset={x:0,y:0}, particles=[], last=0, burstUntil=0, previousEruption=0;
let confetti=[],confettiUntil=0,previousConfetti=0;
let ratingDragging=false,ratingRising=false;
const native=window.slop;
const sounds=Object.fromEntries(Object.entries({human:'anime-wow.mp3',sus:'awkward-cricket.mp3',erupt:'fart-meme-sound.mp3',boom:'vine-boom-sound.mp3'}).map(([name,file])=>{
 const audio=new Audio('assets/sounds/'+file);audio.preload='auto';return [name,audio];
}));
function stopSounds(names=Object.keys(sounds)){for(const name of names){sounds[name].pause();sounds[name].currentTime=0;}}
function playSound(name){
 // Rating feedback has its own channel so it can accompany the meltdown sound.
 stopSounds(name==='boom'?['boom']:['human','sus','erupt']);$('sound-status').textContent='';
 sounds[name].play().catch(error=>{
  if(error.name!=='AbortError')$('sound-status').textContent='Sound could not play. Try the button again.';
 });
}
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
let openingRatio=16/9;
function positionPanel(){
 const top=$('reactions').getBoundingClientRect().bottom+20;
 const bottom=innerHeight-document.querySelector('footer').getBoundingClientRect().top+18;
 $('meter').style.top=top+'px';$('meter').style.bottom=bottom+'px';
}
function openingSpace(){
 const left=portrait?Math.max(...['branding','flaws','controls','hint'].map(id=>$(id).getBoundingClientRect().right))+28:innerWidth*.04;
 // Portrait uses the space beside its controls, so it can extend almost edge to edge vertically.
 const top=portrait?34:Math.max(100,$('branding').getBoundingClientRect().bottom+36);
 const right=$('meter').getBoundingClientRect().left-28,bottom=portrait?innerHeight-14:$('controls').getBoundingClientRect().top-26;
 return {x:left,y:top,width:Math.max(1,right-left),height:Math.max(1,bottom-top)};
}
function maximumOpening(){
 const area=openingSpace(),ratio=openingRatio;
 const width=Math.min(area.width,area.height*ratio);
 return {area,ratio,width,height:width/ratio};
}
function layout(){
 positionPanel();
 const W=innerWidth,H=innerHeight;
 const {area,width:maxW,height:maxH}=maximumOpening();
 const minScale=Math.min(1,Math.max(120/maxW,120/maxH));
 const scale=clamp(Number($('size').value)/100,minScale,1);
 $('size').min=minScale*100;$('size').value=scale*100;
 const width=maxW*scale,height=maxH*scale;
 const x=clamp(area.x+(area.width-width)/2+offset.x,area.x,area.x+area.width-width);
 const y=clamp(area.y+(area.height-height)/2+offset.y,area.y,area.y+area.height-height);
 // Keep the saved position equal to the visible position, including after resizing a display.
 offset={x:x-area.x-(area.width-width)/2,y:y-area.y-(area.height-height)/2};
 Object.assign($('aperture').style,{left:x+'px',top:y+'px',width:width+'px',height:height+'px'});
 $('size-value').textContent=Math.round(scale*100)+'%';
 const preset=portrait?9/16:16/9,isPreset=Math.abs(openingRatio-preset)<.001;
 $('ratio-label').textContent=isPreset?(portrait?'9:16':'16:9'):'CUSTOM';
 $('portrait').classList.toggle('selected',portrait&&isPreset);
 $('landscape').classList.toggle('selected',!portrait&&isPreset);
 const r={x:x+2,y:y+2,width:width-4,height:height-4};
 for(const [k,v]of Object.entries(r))$('mask-hole').setAttribute(k,v);
 native?.hole(r);
 const d=Math.min(devicePixelRatio,2);
 if($('particles').width!==Math.round(W*d)||$('particles').height!==Math.round(H*d)||$('particles').style.width!==W+'px'||$('particles').style.height!==H+'px'){
  $('particles').width=Math.round(W*d);$('particles').height=Math.round(H*d);$('particles').style.width=W+'px';$('particles').style.height=H+'px';ctx.setTransform(d,0,0,d,0,0);
 }
}
function setOpeningRect(rect){
 openingRatio=rect.width/rect.height;
 const {area,width:maxW}=maximumOpening();
 $('size').min=1;
 $('size').value=100*rect.width/maxW;
 offset={x:rect.x-area.x-(area.width-rect.width)/2,y:rect.y-area.y-(area.height-rect.height)/2};
 layout();
}
function resizeEdge(r,edge,dx,dy){
 const area=openingSpace(),minW=Math.min(120,area.width),minH=Math.min(120,area.height);
 let left=r.left,right=r.right,top=r.top,bottom=r.bottom;
 if(edge==='left')left=clamp(r.left+dx,area.x,r.right-minW);
 if(edge==='right')right=clamp(r.right+dx,r.left+minW,area.x+area.width);
 if(edge==='top')top=clamp(r.top+dy,area.y,r.bottom-minH);
 if(edge==='bottom')bottom=clamp(r.bottom+dy,r.top+minH,area.y+area.height);
 setOpeningRect({x:left,y:top,width:right-left,height:bottom-top});
}
function setRating(value){
 const old=rating;rating=Math.max(0,Math.min(100,Number(value)));$('rating').value=rating;$('score').textContent=String(rating).padStart(2,'0');$('thumb').style.bottom=rating+'%';$('fill').style.height=(100-rating)+'%';
 if(rating>old&&(!ratingDragging||!ratingRising))playSound('boom');
 if(rating!==old)ratingRising=rating>old;
 $('verdict').textContent=rating===100?'ABSOLUTE SLOP':rating>=75?'TOO MUCH SLOP':rating>=45?'SOMETHING’S OFF':rating>=20?'PRETTY GOOD':'LOOKS LEGIT';
 document.body.classList.toggle('meltdown',rating===100);
 $('caption').textContent=rating===100?'CONTAINMENT FAILED. THE SLOP HAS ESCAPED.':`FLAWS SPOTTED: ${String(flaws).padStart(2,'0')}   /   GIVE CREDIT. COUNT THE WEIRD.`;
 positionPanel();
 if(rating===100&&old<100)erupt();
}
function erupt(){burstUntil=performance.now()+2800;spawn(100);playSound('erupt');}
function celebrate(){confettiUntil=performance.now()+4000;rainConfetti(260);playSound('human');}
function rainConfetti(count){
 const colors=['#ff354d','#ffd438','#b3ff28','#3de8d2','#5eafff','#ff64c6','#fff4dc'];
 for(let i=0;i<count&&confetti.length<800;i++)confetti.push({
  x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.4,
  vx:(Math.random()-.5)*100,vy:innerHeight*(.22+Math.random()*.2),
  width:5+Math.random()*9,height:8+Math.random()*14,angle:Math.random()*Math.PI*2,
  spin:(Math.random()-.5)*8,sway:Math.random()*Math.PI*2,age:0,life:9,color:colors[i%colors.length]
 });
}
// Every glob keeps its own rounded silhouette; no repeated star-shaped particles.
function mudShape(){return Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,r=.65+Math.random()*.55;return {x:Math.cos(a)*r,y:Math.sin(a)*r};});}
function spawn(n){
 const box=$('mascot').getBoundingClientRect();
 for(let i=0;i<n&&particles.length<440;i++){
  const big=Math.random()<.24;
  particles.push({x:box.x+box.width*.5,y:box.y+box.height*.65,vx:-100-Math.random()*innerWidth*.85,vy:(Math.random()-.56)*innerHeight*.9,life:big?5.5:2.7,age:0,size:big?22+Math.random()*30:3+Math.random()*15,angle:Math.random()*6,spin:(Math.random()-.5)*9,color:['#67401f','#86552b','#a06c37','#51321c'][i%4],shape:mudShape(),impact:big?.22+Math.random()*.9:Infinity,stuck:false,drips:Array.from({length:3},()=>({x:(Math.random()-.5)*1.3,width:.08+Math.random()*.12,length:.4+Math.random()*1.8})),flecks:Array.from({length:7},()=>({x:(Math.random()-.5)*4,y:(Math.random()-.5)*3,r:.05+Math.random()*.12}))});
 }
}
const ctx=$('particles').getContext('2d');
function blob(points){
 const first=points[0],end=points[points.length-1];ctx.beginPath();ctx.moveTo((end.x+first.x)/2,(end.y+first.y)/2);
 for(let i=0;i<points.length;i++){const p=points[i],next=points[(i+1)%points.length];ctx.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2);}ctx.closePath();
}
function frame(t){
 const dt=Math.min((t-last)/1000||0,.04);last=t;ctx.clearRect(0,0,innerWidth,innerHeight);
 if((rating===100||t<burstUntil)&&t-previousEruption>85){spawn(7);previousEruption=t;}
 particles=particles.filter(p=>p.age<p.life&&p.y<innerHeight+120&&p.x> -150);
 for(const p of particles){
  p.age+=dt;
  if(!p.stuck){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=480*dt;p.angle+=p.spin*dt;if(p.age>=p.impact){p.stuck=true;p.angle=0;}}
  const wet=p.stuck?Math.max(0,p.age-p.impact):0;
  if(p.stuck)p.y+=dt*(3+wet*4);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=Math.min(1,(p.life-p.age)*1.2);
  const squash=p.stuck?1+Math.sin(Math.min(wet/.18,1)*Math.PI)*.3:1;
  ctx.scale(p.size*(p.stuck?1.5*squash:1.35),p.size*(p.stuck?1: .7));
  ctx.fillStyle=p.color;
  if(p.stuck){
   ctx.strokeStyle=p.color;ctx.lineCap='round';
   for(const d of p.drips){const length=Math.min(wet*.52,d.length);ctx.lineWidth=d.width;ctx.beginPath();ctx.moveTo(d.x,.25);ctx.lineTo(d.x,.55+length);ctx.stroke();}
   for(const f of p.flecks){ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*.75,0,0,Math.PI*2);ctx.fill();}
  }
  blob(p.shape);ctx.fill();ctx.strokeStyle='#382215';ctx.lineWidth=.055;ctx.stroke();
  // A small wet sheen makes the splats read as thick liquid rather than confetti.
  ctx.fillStyle='#d8a96a';ctx.globalAlpha*=.3;ctx.beginPath();ctx.ellipse(-.25,-.3,.28,.09,-.4,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 if(t<confettiUntil&&t-previousConfetti>85){rainConfetti(14);previousConfetti=t;}
 confetti=confetti.filter(p=>p.age<p.life&&p.y<innerHeight+40);
 for(const p of confetti){
  p.age+=dt;p.x+=(p.vx+Math.sin(p.age*4+p.sway)*38)*dt;p.y+=p.vy*dt;p.vy+=25*dt;p.angle+=p.spin*dt;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(Math.cos(p.age*7+p.sway)*.7,1);
  ctx.globalAlpha=Math.min(1,(p.life-p.age)*2);ctx.fillStyle=p.color;ctx.fillRect(-p.width/2,-p.height/2,p.width,p.height);ctx.restore();
 }
 requestAnimationFrame(frame);
}
function action(a){if(a==='clean'||a==='align')finishDrag();if(a==='increase'){flaws++;setRating(rating+10);}if(a==='decrease'){flaws=Math.max(0,flaws-1);setRating(rating-10);}if(a==='reset'){flaws=0;particles=[];confetti=[];burstUntil=0;confettiUntil=0;stopSounds();setRating(0);}if(a==='clean'){document.body.classList.toggle('clean');if(aligning)action('align');}if(a==='align'){aligning=!aligning;document.body.classList.toggle('aligning',aligning);$('align').classList.toggle('selected',aligning);native?.align(aligning);}if(a==='erupt')erupt();if(a==='human')celebrate();if(a==='sus')playSound('sus');$('count').textContent=String(flaws).padStart(2,'0');}
$('rating').oninput=e=>setRating(e.target.value);$('size').oninput=layout;
$('rating').onpointerdown=()=>{ratingDragging=true;ratingRising=false;};
const endRatingDrag=()=>{ratingDragging=false;ratingRising=false;};
window.addEventListener('pointerup',endRatingDrag);
window.addEventListener('pointercancel',endRatingDrag);
window.addEventListener('blur',endRatingDrag);
$('max-size').onclick=()=>{ $('size').value=100;offset={x:0,y:0};layout(); };
for(const [id,a]of Object.entries({plus:'increase',minus:'decrease',reset:'reset',clean:'clean',align:'align','human-taste':'human',sus:'sus'}))$(id).onclick=()=>action(a);
function format(value){portrait=value;openingRatio=value?9/16:16/9;offset={x:0,y:0};document.body.classList.toggle('portrait',value);layout();}
$('portrait').onclick=()=>format(true);$('landscape').onclick=()=>format(false);$('display').onclick=()=>native?.display();$('quit').onclick=()=>native?native.quit():window.close();
let drag;
$('aperture').onpointerdown=e=>{
 const {edge,corner}=e.target.dataset;
 if(e.button!==0||(!aligning&&!edge&&!corner))return;
 const rect=$('aperture').getBoundingClientRect();
 drag={x:e.clientX,y:e.clientY,ox:offset.x,oy:offset.y,rect,edge,corner,pointerId:e.pointerId};
 native?.dragging(true);$('aperture').classList.add('resizing');
 $('aperture').setPointerCapture(e.pointerId);e.preventDefault();
};
$('aperture').onpointermove=e=>{
 if(!drag)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(drag.edge){
  resizeEdge(drag.rect,drag.edge,dx,dy);return;
 }else if(drag.corner){
  const {area,ratio,width:maxW}=maximumOpening();
  const sx=drag.corner.includes('r')?1:-1,sy=drag.corner.includes('b')?1:-1;
  const anchorX=sx===1?drag.rect.left:drag.rect.right,anchorY=sy===1?drag.rect.top:drag.rect.bottom;
  const roomW=sx===1?area.x+area.width-anchorX:anchorX-area.x;
  const roomH=sy===1?area.y+area.height-anchorY:anchorY-area.y;
  const wanted=drag.rect.width+(sx*dx+sy*dy/ratio)/(1+1/(ratio*ratio));
  const limit=Math.min(maxW,roomW,roomH*ratio);
  const width=clamp(wanted,Math.min(Math.max(120,120*ratio),limit),limit);
  $('size').value=100*width/maxW;
  const actualW=maxW*Number($('size').value)/100,actualH=actualW/ratio;
  const x=sx===1?anchorX:anchorX-actualW,y=sy===1?anchorY:anchorY-actualH;
  offset={x:x-area.x-(area.width-actualW)/2,y:y-area.y-(area.height-actualH)/2};
 }else offset={x:drag.ox+dx,y:drag.oy+dy};
 layout();
};
function finishDrag(){
 const pointerId=drag?.pointerId;drag=null;native?.dragging(false);$('aperture').classList.remove('resizing');
 if(pointerId!==undefined&&$('aperture').hasPointerCapture(pointerId))$('aperture').releasePointerCapture(pointerId);
}
$('aperture').onpointerup=$('aperture').onpointercancel=$('aperture').onlostpointercapture=finishDrag;
window.addEventListener('blur',finishDrag);
for(const handle of document.querySelectorAll('.edge'))handle.onkeydown=e=>{
 const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[e.key];
 if(!delta)return;
 e.preventDefault();resizeEdge($('aperture').getBoundingClientRect(),handle.dataset.edge,delta[0],delta[1]);
};
native?.onAction(action);native?.onShortcuts(keys=>{if(keys.length)$('warning').textContent='Unavailable shortcuts: '+keys.join(', ')+'. Use the buttons.';});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag)finishDrag();if(e.key==='Escape'&&aligning)action('align');if(!native&&e.altKey&&(e.ctrlKey||e.metaKey)){const a={ArrowUp:'increase',ArrowDown:'decrease',r:'reset',h:'clean',a:'align',e:'erupt'}[e.key];if(a){e.preventDefault();action(a);}}});
window.addEventListener('resize',layout);layout();setRating(0);requestAnimationFrame(frame);
