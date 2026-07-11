const radio=document.getElementById('radio');
const playButton=document.getElementById('playButton');
const playIcon=document.getElementById('playIcon');
const playText=document.getElementById('playText');
const statusText=document.getElementById('statusText');
const volume=document.getElementById('volume');
const installButton=document.getElementById('installButton');
const installHelp=document.getElementById('installHelp');
const shareTop=document.getElementById('shareTop');
let deferredPrompt=null;

radio.volume=Number(volume.value);

function setState(playing){
  playIcon.textContent=playing?'❚❚':'▶';
  playText.textContent=playing?'Pause Live Radio':'Play Live Radio';
  statusText.textContent=playing?'Live now':'Ready to listen';
}

playButton.addEventListener('click',async()=>{
  if(radio.paused){
    statusText.textContent='Connecting…';
    try{await radio.play();setState(true)}
    catch(e){statusText.textContent='Unable to connect. Tap again.'}
  }else{radio.pause();setState(false)}
});

radio.addEventListener('playing',()=>setState(true));
radio.addEventListener('pause',()=>setState(false));
radio.addEventListener('waiting',()=>statusText.textContent='Buffering…');
radio.addEventListener('error',()=>statusText.textContent='Stream unavailable. Try again.');
volume.addEventListener('input',()=>radio.volume=Number(volume.value));

async function shareApp(){
  const data={
    title:'Kingdom Frequency Radio™',
    text:'Listen live to Kingdom Frequency Radio™ — Tuned to Truth. Powered by the Word.',
    url:location.href
  };
  try{
    if(navigator.share) await navigator.share(data);
    else{
      await navigator.clipboard.writeText(location.href);
      statusText.textContent='App link copied';
    }
  }catch(e){}
}
shareTop.addEventListener('click',shareApp);

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredPrompt=e;installButton.hidden=false;
});
installButton.addEventListener('click',async()=>{
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt=null;
  installButton.hidden=true;
});

const isIos=/iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone;
if(isIos&&!isStandalone){
  installHelp.innerHTML='On iPhone, tap the <strong>Share</strong> button in Safari, then choose <strong>Add to Home Screen</strong>.';
}

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js'));
}
