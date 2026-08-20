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

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone;

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

/* GOOGLE ANALYTICS EVENT TRACKING */

function trackEvent(eventName, parameters = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, parameters);
  }
}

/* Track radio playback */
radio.addEventListener('play', () => {
  trackEvent('radio_play', {
    station_name: 'Kingdom Frequency Radio'
  });
});

radio.addEventListener('pause', () => {
  trackEvent('radio_pause', {
    station_name: 'Kingdom Frequency Radio'
  });
});

/* Track app sharing */
if (shareButton) {
    shareButton.addEventListener('click', () => {
        trackEvent('share_app');
    });
}

/* Track app installation prompt */
if (installButton) {
    installButton.addEventListener('click', () => {
        trackEvent('install_button_click');
    });
}

/* Track ministry and social links */
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    const destination = link.textContent.trim().toLowerCase();

    trackEvent('outbound_link_click', {
      link_name: destination,
      link_url: link.href
    });
  });
});

/* SERVICE WORKER */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
  });
}
