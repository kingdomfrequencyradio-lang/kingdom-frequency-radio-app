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

async function refreshMetadata() {
  if (!songTitle) return;

  const controller = new AbortController();

  try {
    const response = await fetch(metadataUrl, {
      cache: 'no-store',
      signal: controller.signal
    });

    if (!response.ok || !response.body) {
      throw new Error('Metadata request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let text = '';
    let found = false;

    while (!found) {
      const { value, done } = await reader.read();

      if (done) break;

      text += decoder.decode(value, { stream: true });

      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonText = line.substring(5).trim();

          if (jsonText) {
            const data = JSON.parse(jsonText);

            if (data.streamTitle) {
              showSongTitle(data.streamTitle);
              found = true;
              break;
            }
          }
        }
      }
    }

  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Metadata error:', error);
    }
  } finally {
    controller.abort();
  }

  setTimeout(refreshMetadata, 15000);
}

refreshMetadata();

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
