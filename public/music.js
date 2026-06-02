'use strict';

const CHAMPS_SONGS = [
  { year: '2021', title: 'DIE FOR YOU',  artist: 'ft. Grabbitz',                  id: 'h7MYJghRWt0' },
  { year: '2022', title: 'FIRE AGAIN',   artist: 'ft. Ashnikko',                  id: 'DqgK4llE1cw' },
  { year: '2023', title: 'TICKING AWAY', artist: 'ft. Grabbitz & bbno$',          id: 'CdZN8PI3MqM' },
  { year: '2024', title: 'SUPERPOWER',   artist: 'ft. KISS OF LIFE & Mark Tuan',  id: 'DX4BE9GmpH4' },
  { year: '2025', title: 'LAST SHOT',    artist: 'ft. templuv & 347aidan',        id: 'cLx3tyzht3Y' },
];

let ytPlayer  = null;
let currentIdx = 4;
let isPlaying  = false;
let seeking    = false;   // 使用者正在拖進度條時，暫停自動更新
let pollTimer  = null;

// ── 時間格式化 mm:ss ──
function _fmt(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

// ── YouTube IFrame API 回呼（全域） ──
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-hidden', {
    height: '1',
    width: '1',
    videoId: CHAMPS_SONGS[currentIdx].id,
    playerVars: { autoplay: 0, controls: 0, disablekb: 1, enablejsapi: 1 },
    events: {
      onReady: e => {
        e.target.setVolume(Number(document.getElementById('mp-vol').value));
        _startPoll();
      },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED) _selectTrack((currentIdx + 1) % CHAMPS_SONGS.length);
        isPlaying = (e.data === YT.PlayerState.PLAYING);
        _updatePlayBtn();
      }
    }
  });
};

// ── 進度條 polling（500ms） ──
function _startPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (!ytPlayer || seeking) return;
    const cur = ytPlayer.getCurrentTime?.() ?? 0;
    const dur = ytPlayer.getDuration?.() ?? 0;
    if (dur > 0) {
      const seekEl = document.getElementById('mp-seek');
      seekEl.max   = dur;
      seekEl.value = cur;
      _updateSeekFill(cur / dur);
    }
    document.getElementById('mp-cur').textContent = _fmt(cur);
    document.getElementById('mp-dur').textContent = _fmt(dur);
  }, 500);
}

// ── 進度條填色（CSS 自訂屬性） ──
function _updateSeekFill(ratio) {
  const pct = Math.round(ratio * 100);
  document.getElementById('mp-seek').style.setProperty('--pct', `${pct}%`);
}

// ── 音量圖示更新（0條/1條/2條/3條弧線）──
function _updateVolIcon(val) {
  const icon = document.getElementById('mp-vol-icon');
  if (!icon) return;
  const v = Number(val);
  const spk = `<path d="M3 9v6h4l5 5V4L7 9H3z"/>`;
  const w1  = `<path d="M14 8.97v6.06c1.48-.73 2.5-2.25 2.5-4.03s-1.02-3.3-2.5-4.03z"/>`;
  const w2  = `<path d="M17.5 12c0-2.42-1.4-4.5-3.5-5.54v11.07c2.1-1.04 3.5-3.12 3.5-5.53z"/>`;
  const w3  = `<path d="M20.93 12c0-3.17-1.54-5.99-4-7.69v15.38c2.46-1.7 4-4.52 4-7.69z"/>`;
  icon.innerHTML = spk + (v > 0 ? w1 : '') + (v > 33 ? w2 : '') + (v > 66 ? w3 : '');
}

// ── 播放鍵 icon 更新 ──
function _updatePlayBtn() {
  const btn = document.getElementById('mp-toggle');
  if (!btn) return;
  const navBtn = document.getElementById('mp-nav-btn');
  if (navBtn) navBtn.classList.toggle('mp-playing', isPlaying);
  btn.innerHTML = isPlaying
    ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
         <rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>
       </svg>`
    : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
         <polygon points="5,3 20,12 5,21"/>
       </svg>`;
}

// ── 歌曲資訊 + 年份按鈕更新 ──
function _updateDisplay() {
  const s = CHAMPS_SONGS[currentIdx];
  document.getElementById('mp-title').textContent  = s.title;
  document.getElementById('mp-artist').textContent = s.artist;
  document.querySelectorAll('.mp-yr').forEach((b, i) =>
    b.classList.toggle('active', i === currentIdx)
  );
}

// ── 播放 / 暫停 ──
function _togglePlay() {
  if (!ytPlayer || typeof ytPlayer.playVideo !== 'function') return;
  isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
}

// ── 換曲 ──
function _selectTrack(idx) {
  currentIdx = idx;
  _updateDisplay();
  const seekEl = document.getElementById('mp-seek');
  seekEl.value = 0;
  _updateSeekFill(0);
  document.getElementById('mp-cur').textContent = '0:00';
  if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById(CHAMPS_SONGS[idx].id);
    isPlaying = true;
    _updatePlayBtn();
  }
}

// ── DOMContentLoaded：綁事件、載 API ──
document.addEventListener('DOMContentLoaded', () => {
  const seekEl = document.getElementById('mp-seek');

  document.getElementById('mp-nav-btn').addEventListener('click', () => {
    const bar = document.getElementById('music-bar');
    const btn = document.getElementById('mp-nav-btn');
    const isOpen = !bar.classList.contains('mp-hidden');
    bar.classList.toggle('mp-hidden', isOpen);
    btn.classList.toggle('mp-nav-active', !isOpen);
  });

  document.getElementById('mp-toggle').addEventListener('click', _togglePlay);

  document.getElementById('mp-vol').addEventListener('input', e => {
    if (ytPlayer) ytPlayer.setVolume(Number(e.target.value));
    _updateVolIcon(e.target.value);
  });

  document.querySelectorAll('.mp-yr').forEach(btn =>
    btn.addEventListener('click', () => _selectTrack(Number(btn.dataset.idx)))
  );

  // 進度條：拖曳時停止自動更新，放開時 seek
  seekEl.addEventListener('mousedown',  () => { seeking = true; });
  seekEl.addEventListener('touchstart', () => { seeking = true; }, { passive: true });
  seekEl.addEventListener('input', () => {
    const ratio = seekEl.value / seekEl.max;
    _updateSeekFill(isNaN(ratio) ? 0 : ratio);
    document.getElementById('mp-cur').textContent = _fmt(Number(seekEl.value));
  });
  seekEl.addEventListener('mouseup', () => {
    seeking = false;
    if (ytPlayer) ytPlayer.seekTo(Number(seekEl.value), true);
  });
  seekEl.addEventListener('touchend', () => {
    seeking = false;
    if (ytPlayer) ytPlayer.seekTo(Number(seekEl.value), true);
  });

  _updateDisplay();
  _updatePlayBtn();
  _updateSeekFill(0);
  _updateVolIcon(document.getElementById('mp-vol').value);

  // 載入 YouTube IFrame API
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
});
