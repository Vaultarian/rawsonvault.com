/* The timer alarm. Every timer calls JosAlarm.ring() when it reaches zero.
   The sound plays over and over until someone presses the big STOP button
   (or RESET / START). If Audio is switched off in Settings, it stays quiet. */
(function () {
  var sound = new Audio('../sounds/timer-alarm.mp3');
  sound.loop = true;
  sound.volume = 0.8;
  var ringing = false;

  var css = document.createElement('style');
  css.textContent =
    '#jos-alarm-stop{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);' +
    'z-index:9999;display:none;padding:18px 54px;font:bold 32px system-ui,sans-serif;' +
    'color:#fff;background:#e5383b;border:4px solid #fff;border-radius:18px;cursor:pointer;' +
    'box-shadow:0 6px 24px rgba(0,0,0,.45);animation:josAlarmPulse .6s ease-in-out infinite alternate}' +
    '@keyframes josAlarmPulse{to{transform:translateX(-50%) scale(1.08)}}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.id = 'jos-alarm-stop';
  btn.textContent = '⏹ STOP';
  btn.addEventListener('click', stop);

  function audioOn() {
    try {
      var s = JSON.parse(localStorage.getItem('jos-settings'));
      return !s || s.audio !== false;
    } catch (e) { return true; }
  }

  function ring() {
    if (ringing) return;
    ringing = true;
    if (!btn.parentNode) document.body.appendChild(btn);
    btn.style.display = 'block';
    if (audioOn()) {
      sound.currentTime = 0;
      sound.play().catch(function () {});
    }
  }

  function stop() {
    ringing = false;
    sound.pause();
    sound.currentTime = 0;
    btn.style.display = 'none';
  }

  /* pressing any other button (RESET, START...) also stops the alarm */
  document.addEventListener('click', function (e) {
    if (ringing && e.target.closest && e.target.closest('button') && e.target !== btn) stop();
  }, true);

  window.JosAlarm = { ring: ring, stop: stop };
})();
