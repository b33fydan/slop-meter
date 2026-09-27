const $ = id => document.getElementById(id);
let rating=0, flaws=0, portrait=false, aligning=false, offset={x:0,y:0}, particles=[], last=0, burstUntil=0, previousEruption=0;
const native=window.slop;
function layout(){
 const W=innerWidth,H=innerHeight,ratio=portrait?9/16:16/9,scale=Number($('size').value)/100;
 const maxW=W*.68,maxH=H*.59;
 const width=Math.min(maxW,maxH*ratio)*scale,height=width/ratio;
 const x=Math.max(14,Math.min(W*.75-width-14,W*.04+(maxW-width)/2+offset.x));
 const y=Math.max(H*.21,Math.min(H*.82-height,H*.225+(maxH-height)/2+offset.y));
 Object.assign($('aperture').style,{left:x+'px',top:y+'px',width:width+'px',height:height+'px'});
 const r={x:x+2,y:y+2,width:width-4,height:height-4};
 for(const [k,v]of Object.entries(r))$('mask-hole').setAttribute(k,v);
 native?.hole(r);
 const d=Math.min(devicePixelRatio,2);$('particles').width=W*d;$('particles').height=H*d;$('particles').style.width=W+'px';$('particles').style.height=H+'px';ctx.setTransform(d,0,0,d,0,0);
}
function setRating(value){
 const old=rating;rating=Math.max(0,Math.min(100,Number(value)));$('rating').value=rating;$('score').textContent=String(rating).padStart(2,'0');$('thumb').style.bottom=rating+'%';$('fill').style.height=(100-rating)+'%';
 $('verdict').textContent=rating===100?'ABSOLUTE SLOP':rating>=75?'TOO MUCH SLOP':rating>=45?'SOMETHING’S OFF':rating>=20?'PRETTY GOOD':'LOOKS LEGIT';
 document.body.classList.toggle('meltdown',rating===100);
 $('caption').textContent=rating===100?'CONTAINMENT FAILED. THE SLOP HAS ESCAPED.':`FLAWS SPOTTED: ${String(flaws).padStart(2,'0')}   /   GIVE CREDIT. COUNT THE WEIRD.`;
 if(rating===100&&old<100)erupt();
}
function erupt(){burstUntil=performance.now()+2800;spawn(100);}
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
 requestAnimationFrame(frame);
}
function action(a){if(a==='increase'){flaws++;setRating(rating+10);}if(a==='decrease'){flaws=Math.max(0,flaws-1);setRating(rating-10);}if(a==='reset'){flaws=0;particles=[];burstUntil=0;setRating(0);}if(a==='clean'){document.body.classList.toggle('clean');if(aligning)action('align');}if(a==='align'){aligning=!aligning;document.body.classList.toggle('aligning',aligning);$('align').classList.toggle('selected',aligning);native?.align(aligning);}if(a==='erupt')erupt();$('count').textContent=String(flaws).padStart(2,'0');}
$('rating').oninput=e=>setRating(e.target.value);$('size').oninput=layout;
for(const [id,a]of Object.entries({plus:'increase',minus:'decrease',reset:'reset',clean:'clean',align:'align'}))$(id).onclick=()=>action(a);
function format(value){portrait=value;offset={x:0,y:0};document.body.classList.toggle('portrait',value);$('portrait').classList.toggle('selected',value);$('landscape').classList.toggle('selected',!value);$('ratio-label').textContent=value?'9:16':'16:9';layout();}
$('portrait').onclick=()=>format(true);$('landscape').onclick=()=>format(false);$('display').onclick=()=>native?.display();$('quit').onclick=()=>native?native.quit():window.close();
let drag;
$('aperture').onpointerdown=e=>{if(!aligning)return;drag={x:e.clientX,y:e.clientY,...{ox:offset.x,oy:offset.y}};$('aperture').setPointerCapture(e.pointerId);};
$('aperture').onpointermove=e=>{if(!drag)return;offset={x:drag.ox+e.clientX-drag.x,y:drag.oy+e.clientY-drag.y};layout();};$('aperture').onpointerup=()=>drag=null;
native?.onAction(action);native?.onShortcuts(keys=>{if(keys.length)$('warning').textContent='Unavailable shortcuts: '+keys.join(', ')+'. Use the buttons.';});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&aligning)action('align');if(!native&&e.altKey&&(e.ctrlKey||e.metaKey)){const a={ArrowUp:'increase',ArrowDown:'decrease',r:'reset',h:'clean',a:'align',e:'erupt'}[e.key];if(a){e.preventDefault();action(a);}}});
window.addEventListener('resize',layout);layout();setRating(0);requestAnimationFrame(frame);
