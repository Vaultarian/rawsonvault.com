/* LDLC menu music (Jos, 8 Nov 2026): plays on the LDLC home screen and the levels page, and nowhere else.
   Not in the editor, not when you TEST, not when you PLAY: those pages don't load this file.
   - Browsers only allow sound after you click or press a key, so it starts on your first click or key.
   - It carries on from where it was when you go between the home screen and the levels page.
   - The little speaker button turns it off, and it stays off. */
(function () {
  'use strict';
  const POS = 'ldlc-music-pos', MUTE = 'ldlc-music-muted';
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const ses = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };

  const music = new Audio('sounds/menu-music.mp3');
  music.loop = true; music.volume = 0.4; music.preload = 'auto';
  let muted = get(MUTE) === '1';

  const saved = parseFloat(ses(POS));
  if (saved > 0) music.addEventListener('loadedmetadata', () => { try { music.currentTime = saved % (music.duration || saved + 1); } catch (e) {} }, { once: true });

  const btn = document.createElement('button');
  btn.id = 'musicBtn'; btn.type = 'button';
  btn.style.cssText = 'position:fixed;right:14px;top:14px;z-index:60;width:44px;height:44px;border-radius:50%;' +
    'border:2px solid #ff2d3d;background:rgba(20,0,4,.85);color:#fff;font-size:20px;cursor:pointer;padding:0;line-height:1';
  const paint = () => { btn.textContent = muted ? '🔇' : '🔊'; btn.title = btn.ariaLabel = muted ? 'Music is off. Press to turn it on' : 'Music is on. Press to turn it off'; };
  btn.addEventListener('click', e => {
    e.stopPropagation();
    muted = !muted; set(MUTE, muted ? '1' : '0'); paint();
    if (muted) music.pause(); else start();
  });
  paint();
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
  if (document.body) document.body.appendChild(btn);

  function start() { if (!muted) music.play().catch(() => {}); }
  start();                                           // works if the browser already allows it
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    addEventListener(ev, function once() { start(); if (!music.paused) removeEventListener(ev, once, true); }, true));

  const remember = () => { if (!isNaN(music.currentTime)) ses(POS, String(music.currentTime)); };
  setInterval(remember, 1000);
  addEventListener('pagehide', remember);
})();
