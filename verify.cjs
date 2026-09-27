const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slop-meter-test-'));
 const app=await electron.launch({executablePath:require('electron'),args:[__dirname, '--user-data-dir='+profile]});
 try{
 const page=await app.firstWindow();await page.waitForSelector('#rating');
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.setAudioMuted(true));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];return {alwaysOnTop:w.isAlwaysOnTop(),transparent:w.getBackgroundColor(),bounds:w.getBounds()};});
 assert.equal(state.alwaysOnTop,true);
 await page.waitForFunction(()=>Object.values(sounds).every(audio=>audio.readyState>=2&&Number.isFinite(audio.duration)&&audio.duration>0));
 const soundFiles=await page.evaluate(()=>Object.fromEntries(Object.entries(sounds).map(([name,audio])=>[name,new URL(audio.src).pathname.split('/').pop()])));
 assert.deepEqual(soundFiles,{human:'anime-wow.mp3',sus:'awkward-cricket.mp3',erupt:'fart-meme-sound.mp3',boom:'vine-boom-sound.mp3'});
 await page.evaluate(()=>{
  window.soundStarts={human:0,sus:0,erupt:0,boom:0};
  for(const [name,audio] of Object.entries(sounds))audio.addEventListener('playing',()=>window.soundStarts[name]++);
 });
 // Exercise the shortcut IPC path before a click, so sound cannot rely on prior user activation.
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.send('action','erupt'));
 await page.waitForFunction(()=>sounds.erupt.currentTime>0&&!sounds.erupt.paused);
 await page.locator('#reset').click();
 await page.locator('#human-taste').click();
 await page.waitForFunction(()=>sounds.human.currentTime>0&&!sounds.human.paused&&confetti.some(p=>p.y>50));
 assert.ok(await page.evaluate(()=>confetti.length>=200&&particles.length===0),'Human taste must rain plenty of confetti without mud');
 assert.equal(await page.locator('#score').textContent(),'00');
 await page.screenshot({path:path.resolve(__dirname,'output/human-taste-confetti.png'),omitBackground:true});
 await page.locator('#human-taste').click();
 await page.waitForFunction(()=>window.soundStarts.human===2);
 assert.ok(await page.evaluate(()=>confetti.length<=800),'Repeated celebration must keep particle count bounded');
 await page.locator('#sus').click();
 await page.waitForFunction(()=>sounds.sus.currentTime>0&&!sounds.sus.paused);
 assert.equal(await page.evaluate(()=>sounds.human.paused),true,'New reactions should stop the previous sound');
 await page.locator('#reset').click();
 assert.equal(await page.evaluate(()=>confetti.length+particles.length),0);
 assert.equal(await page.evaluate(()=>Object.values(sounds).every(audio=>audio.paused&&audio.currentTime===0)),true,'Reset must stop sounds');
 assert.equal(await page.evaluate(()=>window.soundStarts.boom),0,'Reaction buttons should not trigger rating feedback');
 await page.locator('#rating').fill('20');
 await page.waitForFunction(()=>window.soundStarts.boom===1&&sounds.boom.currentTime>0);
 await page.locator('#rating').fill('10');await page.locator('#rating').fill('10');
 assert.equal(await page.evaluate(()=>window.soundStarts.boom),1,'Downward or unchanged ratings should not trigger a boom');
 await page.locator('#reset').click();
 const slider=await page.locator('#rating').boundingBox(),sliderX=slider.x+slider.width/2;
 const thumb=await page.locator('#thumb').boundingBox();
 await page.mouse.move(sliderX,thumb.y+thumb.height/2);await page.mouse.down();
 await page.mouse.move(sliderX,slider.y+slider.height*.8,{steps:5});
 await page.waitForFunction(()=>window.soundStarts.boom===2,null,{timeout:2000});
 await page.mouse.move(sliderX,slider.y+slider.height*.6,{steps:5});
 await page.waitForFunction(()=>rating>30);
 assert.equal(await page.evaluate(()=>window.soundStarts.boom),2,'A continuous upward drag should not repeatedly cut off the boom');
 await page.mouse.move(sliderX,slider.y+slider.height*.75,{steps:5});
 await page.waitForFunction(()=>rating<30);
 await page.mouse.move(sliderX,slider.y+slider.height*.6,{steps:5});
 await page.waitForFunction(()=>window.soundStarts.boom===3);await page.mouse.up();
 await page.locator('#reset').click();
 const opening=page.locator('#aperture');
 const assertOpening=async ratio=>{
  const box=await opening.boundingBox(),controls=await page.locator('#controls').boundingBox(),meter=await page.locator('#meter').boundingBox(),header=await page.locator('#branding').boundingBox();
  assert.ok(Math.abs(box.width/box.height-ratio)<.005,'Resizing must preserve the selected video proportions');
  const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width&&box.y+box.height<=viewport.height,'Opening must stay on screen');
  assert.ok(box.x+box.width<meter.x,'Opening must leave the meter accessible');
  const reactions=await page.locator('#reactions').boundingBox();
  assert.ok(reactions.x>box.x+box.width&&reactions.y>=0&&reactions.y+reactions.height<meter.y,'Reaction buttons must stay clear of the video and meter');
  if(ratio<1){
   for(const selector of ['#branding','#controls','#flaws','#hint']){
    const sidebar=await page.locator(selector).boundingBox();
    if(sidebar)assert.ok(box.x>sidebar.x+sidebar.width,'Portrait opening must stay beside '+selector);
   }
  }else{
   assert.ok(box.y>=header.y+header.height+20,'Landscape opening must remain below the branding');
   assert.ok(box.y+box.height<controls.y,'Landscape opening must remain above the controls');
  }
  const mask=await page.locator('#mask-hole').evaluate(el=>Object.fromEntries(['x','y','width','height'].map(k=>[k,Number(el.getAttribute(k))])));
  assert.ok(Math.abs(mask.x-box.x-2)<1&&Math.abs(mask.y-box.y-2)<1&&Math.abs(mask.width-box.width+4)<1&&Math.abs(mask.height-box.height+4)<1,'Transparent opening must follow the resized frame');
  return box;
 };
 const sizes=[];
 const panel=await page.locator('#meter').boundingBox();
 assert.ok(panel.x>state.bounds.width*.77&&panel.x<=state.bounds.width*.77+97&&panel.x+panel.width<=state.bounds.width-10,'Right column should move toward the edge while staying on screen');
 for(const [format,ratio] of [['landscape',16/9],['portrait',9/16]]){
  await page.locator('#'+format).click();await page.locator('#size').fill('90');
  const initial=await assertOpening(ratio);
  await page.locator('#max-size').click();const maximum=await assertOpening(ratio);
  assert.ok(maximum.width>initial.width&&maximum.height>initial.height,'Max size must enlarge both formats');
  if(format==='portrait')assert.ok(maximum.y<40&&maximum.y+maximum.height>state.bounds.height-20,'Portrait maximum must reach near the top and bottom edges');
  sizes.push({format,width:Math.round(maximum.width),height:Math.round(maximum.height)});
  if(format==='portrait')await page.screenshot({path:path.resolve(__dirname,'output/portrait-max.png'),omitBackground:true});
  await page.locator('#align').click();
  for(const corner of ['tl','tr','bl','br']){
   await page.locator('#size').fill('60');const before=await opening.boundingBox();
   const handle=await page.locator('.corner.'+corner).boundingBox(),x=handle.x+handle.width/2,y=handle.y+handle.height/2;
   await page.mouse.move(x,y);await page.mouse.down();
   await page.mouse.move(x+(corner.includes('r')?70:-70),y+(corner.includes('b')?70/ratio:-70/ratio),{steps:6});await page.mouse.up();
   const after=await assertOpening(ratio);
   assert.ok(after.width>before.width+30&&after.height>before.height,'Each corner must enlarge the opening');
   const oppositeX=corner.includes('r')?'x':null;
   assert.ok(Math.abs((oppositeX?after.x:after.x+after.width)-(oppositeX?before.x:before.x+before.width))<2,'Opposite horizontal edge must stay fixed');
   assert.ok(Math.abs((corner.includes('b')?after.y:after.y+after.height)-(corner.includes('b')?before.y:before.y+before.height))<2,'Opposite vertical edge must stay fixed');
  }
  const box=await opening.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(0,0,{steps:6});await page.mouse.up();
  await assertOpening(ratio);
  await page.locator('#max-size').click();await page.locator('#align').click();
  for(const edge of ['left','right','top','bottom']){
   await page.locator('#'+format).click();await page.locator('#size').fill('65');
   const before=await opening.boundingBox();
   const handle=page.locator('.edge-'+edge),hit=await handle.boundingBox();
   await handle.hover();
   assert.equal(await handle.evaluate(el=>getComputedStyle(el).cursor),['left','right'].includes(edge)?'ew-resize':'ns-resize');
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('aligning')),false,'Hover resizing should work without Align video');
   const start={x:hit.x+hit.width/2,y:hit.y+hit.height/2};
   const dx=edge==='left'?-60:edge==='right'?60:0,dy=edge==='top'?-60:edge==='bottom'?60:0;
   await page.mouse.move(start.x,start.y);await page.mouse.down();
   for(const direction of [1,-1]){
    await page.mouse.move(start.x+dx*direction,start.y+dy*direction,{steps:5});
    await page.waitForFunction(({edge,expected})=>Math.abs(document.getElementById('aperture').getBoundingClientRect()[edge]-expected)<1,{edge,expected:({left:before.x,right:before.x+before.width,top:before.y,bottom:before.y+before.height})[edge]+(dx||dy)*direction},{timeout:2000});
    const after=await opening.boundingBox();
    const sides=r=>({left:r.x,right:r.x+r.width,top:r.y,bottom:r.y+r.height});
    for(const side of ['left','right','top','bottom']){
     const expected=sides(before)[side]+(side===edge?(dx||dy)*direction:0);
     assert.ok(Math.abs(sides(after)[side]-expected)<1,JSON.stringify({format,edge,side,direction,before,after,expected,message:'Resize must move only its own edge'}));
    }
   }
   await page.mouse.up();assert.equal(await page.locator('#ratio-label').textContent(),'CUSTOM');
   const custom=await opening.boundingBox(),customRatio=custom.width/custom.height;
   await assertOpening(customRatio);
   await page.locator('#size').fill('75');
   const scaled=await opening.boundingBox();assert.ok(Math.abs(scaled.width/scaled.height-customRatio)<.005,'Size slider must keep the custom shape');
  }
  await page.locator('#'+format).click();await assertOpening(ratio);
 }
 // Observe real BrowserWindow ignore-mouse calls while supplying deterministic screen cursor positions.
 const hitBox=await opening.boundingBox();
 await app.evaluate(({screen,BrowserWindow},box)=>{
  const w=BrowserWindow.getAllWindows()[0],b=w.getBounds();
  globalThis.nativeHitTest={originalCursor:screen.getCursorScreenPoint,originalIgnore:w.setIgnoreMouseEvents,ignored:false,point:{x:b.x,y:b.y}};
  screen.getCursorScreenPoint=()=>globalThis.nativeHitTest.point;
  w.setIgnoreMouseEvents=function(value,options){globalThis.nativeHitTest.ignored=value;return globalThis.nativeHitTest.originalIgnore.call(this,value,options);};
 },hitBox);
 const checkNativePointer=async(point,expected)=>{
  const ignored=await app.evaluate(async({BrowserWindow},p)=>{
   const b=BrowserWindow.getAllWindows()[0].getBounds();globalThis.nativeHitTest.point={x:b.x+p.x,y:b.y+p.y};
   await new Promise(resolve=>setTimeout(resolve,100));return globalThis.nativeHitTest.ignored;
  },point);
  assert.equal(ignored,expected,'Native click-through state should follow hover/drag position');
 };
 try{
  const center={x:hitBox.x+hitBox.width/2,y:hitBox.y+hitBox.height/2};
  await checkNativePointer({x:0,y:0},false);await checkNativePointer(center,true);
  for(const edge of ['left','right','top','bottom']){
   const hit=await page.locator('.edge-'+edge).boundingBox();
   await checkNativePointer({x:hit.x+hit.width/2,y:hit.y+hit.height/2},false);
   await checkNativePointer(center,true);
  }
  const hit=await page.locator('.edge-left').boundingBox(),start={x:hit.x+hit.width/2,y:hit.y+hit.height/2};
  await checkNativePointer(start,false);await page.mouse.move(start.x,start.y);await page.mouse.down();
  await checkNativePointer(center,false);await page.mouse.up();await checkNativePointer(center,true);
 }finally{
  await app.evaluate(({screen,BrowserWindow})=>{
   screen.getCursorScreenPoint=globalThis.nativeHitTest.originalCursor;
   BrowserWindow.getAllWindows()[0].setIgnoreMouseEvents=globalThis.nativeHitTest.originalIgnore;
   delete globalThis.nativeHitTest;
  });
 }
 await page.locator('#landscape').click();await page.locator('#size').fill('90');
 await page.screenshot({path:path.resolve(__dirname,'output/landscape.png'),omitBackground:true});
 await page.locator('#rating').fill('100');assert.equal(await page.locator('#verdict').textContent(),'ABSOLUTE SLOP');
 await page.waitForFunction(()=>window.soundStarts.erupt===2);
 await page.waitForFunction(()=>sounds.boom.currentTime>0&&!sounds.boom.paused&&sounds.erupt.currentTime>0&&!sounds.erupt.paused);
 await page.waitForTimeout(1800);
 assert.equal(await page.evaluate(()=>window.soundStarts.erupt),2,'Meltdown must not replay the fart every animation frame');
 assert.ok(await page.evaluate(()=>particles.some(p=>p.stuck)), 'Mud should stick to the screen');await page.screenshot({path:path.resolve(__dirname,'output/eruption.png'),omitBackground:true});
 await page.locator('#reset').click();assert.equal(await page.locator('#score').textContent(),'00');assert.equal(await page.evaluate(()=>particles.length),0);
 await page.locator('#portrait').click();await page.locator('#plus').click();assert.equal(await page.locator('#count').textContent(),'01');assert.equal(await page.locator('#score').textContent(),'10');
 const rect=await page.locator('#aperture').boundingBox();assert.ok(Math.abs(rect.width/rect.height-9/16)<.005);
 await page.locator('#align').click();assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('aligning')),true);
 await page.locator('#clean').click();assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('clean')&&!el.classList.contains('aligning')),true);
 assert.equal(await page.locator('#human-taste').isVisible(),true);
 assert.equal(await page.locator('#sus').isVisible(),true);
 await page.screenshot({path:path.resolve(__dirname,'output/portrait.png'),omitBackground:true});
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setBounds({x:0,y:0,width:1280,height:720}));
 await page.waitForFunction(()=>innerWidth===1280&&innerHeight===720);
 await page.evaluate(()=>action('clean'));
 for(const [format,ratio] of [['landscape',16/9],['portrait',9/16]]){
  await page.locator('#'+format).click();await page.locator('#max-size').click();const maximum=await assertOpening(ratio);
  if(format==='portrait')assert.ok(maximum.y<40&&maximum.y+maximum.height>700,'Portrait should also fill the available height at 720p');
  await page.screenshot({path:path.resolve(__dirname,'output/'+format+'-max-720p.png'),omitBackground:true});
 }
 assert.equal(await page.locator('#sound-status').textContent(),'');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,native:state,maximumOpenings:sizes,rightPanelShift:Math.round(panel.x-state.bounds.width*.77),portraitRatio:rect.width/rect.height,checks:['upward slider moves play vine boom and downward moves stay quiet','continuous upward drags play one clean boom','boom and fart both play at maximum rating','right column stays on screen after moving right','all four edges resize independently in and out without alignment','custom shape scales and presets restore proportions','native border hover captures input and center clicks pass through after dragging','all four bundled sounds decode and play','shortcut audio before user activation','human taste rains bounded confetti','repeated reactions restart audio','meltdown sound plays once','reset clears effects and audio','reaction buttons stay outside the video and remain visible in clean mode','native always on top','larger landscape and portrait openings','all four resize corners preserve proportions and opposite edges','drag remains inside safe area','mask follows resized opening','maximum size at 720p','slider maximum','reset','flaw count','portrait aspect ratio','clean exits alignment','no renderer errors']},null,2));
 }finally{await app.close();fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
