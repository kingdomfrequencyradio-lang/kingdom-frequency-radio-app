const radio = document.getElementById('radio');
const playButton = document.getElementById('playButton');
const playIcon = document.getElementById('playIcon');
const playText = document.getElementById('playText');
const statusText = document.getElementById('statusText');
const volume = document.getElementById('volume');
const shareButton = document.getElementById('shareButton');
const installButton = document.getElementById('installButton');
const installHelp = document.getElementById('installHelp');
const songTitle = document.getElementById('songTitle');

let deferredPrompt = null;
let metadataConnection = null;

radio.volume = Number(volume.value);

function setPlayerState(isPlaying) {
  playIcon.textContent = isPlaying ? '❚❚' : '▶';

  playText.textContent = isPlaying
    ? 'Pause Kingdom Frequency Radio™'
    : 'Play Kingdom Frequency Radio™';

  statusText.textContent = isPlaying
    ? 'Live now'
    : 'Ready to listen';
}

playButton.addEventListener('click', async () => {
  if (radio.paused) {
    statusText.textContent = 'Connecting…';

    try {
      await radio.play();
      setPlayerState(true);
    } catch (error) {
      statusText.textContent = 'Unable to connect. Tap again.';
      console.error(error);
    }
  } else {
    radio.pause();
    setPlayerState(false);
  }
});

radio.addEventListener('playing', () => setPlayerState(true));
radio.addEventListener('pause', () => setPlayerState(false));
radio.addEventListener('waiting', () => {
  statusText.textContent = 'Buffering…';
});

radio.addEventListener('error', () => {
  statusText.textContent = 'Stream unavailable. Please try again.';
});

volume.addEventListener('input', () => {
  radio.volume = Number(volume.value);
});

shareButton.addEventListener('click', async () => {
  const shareData = {
    title: 'Kingdom Frequency Radio™',
    text: 'Listen live to Kingdom Frequency Radio™ — Tuned to Truth. Powered by the Word.',
    url: location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(location.href);
      statusText.textContent = 'App link copied';
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error);
    }
  }
});

window.addEventListener('beforeinstallprompt', event => {
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

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone;

if (isIos && !isStandalone) {
  installHelp.innerHTML =
    'On iPhone, tap the <strong>Share</strong> button in Safari, then choose <strong>Add to Home Screen</strong>.';
}

/* NOW PLAYING METADATA */

const metadataUrl =
  'https://api.zeno.fm/mounts/metadata/subscribe/6x0bwezlk70tv';

function showSongTitle(value) {
  if (!songTitle) return;

  const cleanedTitle = String(value || '').trim();

  songTitle.textContent =
    cleanedTitle || 'Live Programming';
}

function readMetadata(data) {
  const title =
    data.streamTitle ||
    data.title ||
    data.song ||
    data.nowPlaying ||
    '';

  showSongTitle(title);
}

function connectMetadata() {
  if (!songTitle || typeof EventSource === 'undefined') {
    return;
  }

  metadataConnection = new EventSource(metadataUrl);

  metadataConnection.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      readMetadata(data);
    } catch (error) {
      console.error('Metadata could not be read:', error);
    }
  };

  metadataConnection.onerror = () => {
    showSongTitle('Live Programming');

    if (metadataConnection) {
      metadataConnection.close();
    }

    setTimeout(connectMetadata, 10000);
  };
}

connectMetadata();

/* SERVICE WORKER */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
