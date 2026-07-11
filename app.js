const radio = document.getElementById('radio');
const playButton = document.getElementById('playButton');
const playIcon = document.getElementById('playIcon');
const playText = document.getElementById('playText');
const status = document.getElementById('status');
const statusText = document.getElementById('statusText');
const volume = document.getElementById('volume');
const installButton = document.getElementById('installButton');
const iosTip = document.getElementById('iosTip');
const shareButton = document.getElementById('shareButton');

let deferredPrompt = null;
radio.volume = Number(volume.value);

function setPlaying(isPlaying) {
  status.classList.toggle('playing', isPlaying);
  playIcon.textContent = isPlaying ? '❚❚' : '▶';
  playText.textContent = isPlaying ? 'Pause Radio' : 'Listen Live';
  statusText.textContent = isPlaying ? 'Live now' : 'Ready to listen';
  playButton.setAttribute('aria-label', isPlaying ? 'Pause Kingdom Frequency Radio' : 'Play Kingdom Frequency Radio');
}

playButton.addEventListener('click', async () => {
  if (radio.paused) {
    try {
      statusText.textContent = 'Connecting…';
      await radio.play();
      setPlaying(true);
    } catch (error) {
      statusText.textContent = 'Unable to connect. Tap again.';
      setPlaying(false);
      console.error(error);
    }
  } else {
    radio.pause();
    setPlaying(false);
  }
});

radio.addEventListener('playing', () => setPlaying(true));
radio.addEventListener('pause', () => setPlaying(false));
radio.addEventListener('waiting', () => statusText.textContent = 'Buffering…');
radio.addEventListener('error', () => {
  statusText.textContent = 'Stream unavailable. Please try again.';
  setPlaying(false);
});

volume.addEventListener('input', () => {
  radio.volume = Number(volume.value);
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installButton.hidden = true;
});

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
if (isIos && !isStandalone) iosTip.hidden = false;

shareButton.addEventListener('click', async () => {
  const shareData = {
    title: 'Kingdom Frequency Radio',
    text: 'Listen live to Kingdom Frequency Radio — Tuned to Truth. Powered by the Word.',
    url: window.location.href
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      shareButton.textContent = 'Link Copied';
      setTimeout(() => shareButton.textContent = 'Share Station', 1800);
    }
  } catch (error) {
    if (error.name !== 'AbortError') console.error(error);
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}
