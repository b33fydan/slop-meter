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
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];return {alwaysOnTop:w.isAlwaysOnTop(),transparent:w.getBackgroundColor(),bounds:w.getBounds()};});
 assert.equal(state.alwaysOnTop,true);
 await page.screenshot({path:path.resolve(__dirname,'output/landscape.png'),omitBackground:true});
 await page.locator('#rating').fill('100');assert.equal(await page.locator('#verdict').textContent(),'ABSOLUTE SLOP');
 await page.waitForTimeout(1800);
 assert.ok(await page.evaluate(()=>particles.some(p=>p.stuck)), 'Mud should stick to the screen');await page.screenshot({path:path.resolve(__dirname,'output/eruption.png'),omitBackground:true});
 await page.locator('#reset').click();assert.equal(await page.locator('#score').textContent(),'00');assert.equal(await page.evaluate(()=>particles.length),0);
 await page.locator('#portrait').click();await page.locator('#plus').click();assert.equal(await page.locator('#count').textContent(),'01');assert.equal(await page.locator('#score').textContent(),'10');
 const rect=await page.locator('#aperture').boundingBox();assert.ok(Math.abs(rect.width/rect.height-9/16)<.005);
 await page.locator('#align').click();assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('aligning')),true);
 await page.locator('#clean').click();assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('clean')&&!el.classList.contains('aligning')),true);
 await page.screenshot({path:path.resolve(__dirname,'output/portrait.png'),omitBackground:true});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,native:state,portraitRatio:rect.width/rect.height,checks:['native always on top','slider maximum','reset','flaw count','portrait aspect ratio','clean exits alignment','no renderer errors']},null,2));
 }finally{await app.close();fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
