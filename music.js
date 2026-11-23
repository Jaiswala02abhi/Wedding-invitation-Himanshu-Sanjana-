/* Background music, on the gold record in the corner. The record spins while
   the track plays and stops when it is paused — style.css runs the spin, this
   only toggles a class.

   Playback starts from the guest's tap on the hero cover (see hero.js), which
   is the gesture browsers require before any sound is allowed. The volume is
   faded up from silence over two seconds rather than landing at full. */
window.Music = (function () {
  'use strict';

  var FADE_TO = 0.5;
  var FADE_MS = 2000;

  function init() {
    var audio = document.getElementById('music');
    var button = document.getElementById('music-toggle');
    if (!audio || !button) return { start: function () {} };

    function paint(playing) {
      button.classList.toggle('is-playing', playing);
      button.setAttribute('aria-label',
        playing ? 'Pause background music' : 'Play background music');
    }

    /* Steps the volume up to FADE_TO so the track eases in under the names. */
    function fadeIn() {
      var started = performance.now();
      audio.volume = 0;

      (function step(now) {
        var done = Math.min(1, (now - started) / FADE_MS);
        audio.volume = done * FADE_TO;
        if (done < 1) requestAnimationFrame(step);
      })(started);
    }

    function play() {
      return audio.play().then(function () { paint(true); });
    }

    button.addEventListener('click', function () {
      if (audio.paused) play().catch(function () {});
      else { audio.pause(); paint(false); }
    });

    /* Called by main.js on the opening tap. */
    function start() {
      button.classList.add('is-in');
      play().then(fadeIn).catch(function () {
        /* Still refused — the button is there for the guest to press. */
        paint(false);
      });
    }

    return { start: start };
  }

  return { init: init };
})();
