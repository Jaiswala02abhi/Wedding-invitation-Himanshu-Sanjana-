/* Live countdown to the wedding, ticking once a second. The date it counts
   down to is the data-countdown attribute on #countdown in index.html.

   A number that changes flips out and back rather than swapping in place,
   which is what the `flip` argument below is for — the very first paint
   writes the numbers straight in, and every tick after that animates. */
window.Countdown = (function () {
  'use strict';

  function start(el) {
    if (!el) return;

    var target = new Date(el.getAttribute('data-countdown')).getTime();
    var cells = el.querySelectorAll('.countdown__value');

    function paint(flip) {
      var at = new Date(el.getAttribute('data-countdown')).getTime();   /* the date can change in the editor */
      var left = Math.max(0, (isNaN(at) ? target : at) - Date.now());
      var parts = [
        Math.floor(left / 86400000),
        Math.floor(left % 86400000 / 3600000),
        Math.floor(left % 3600000 / 60000),
        Math.floor(left % 60000 / 1000)
      ];

      parts.forEach(function (value, i) {
        var cell = cells[i];
        var text = String(value).padStart(2, '0');
        if (cell.textContent === text) return;

        if (!flip) { cell.textContent = text; return; }

        /* Out upwards, then the new number is placed below with transitions
           off and released a frame later so it rises into the slot. */
        cell.classList.add('is-turning');
        setTimeout(function () {
          cell.textContent = text;
          cell.classList.add('is-instant', 'is-below');
          cell.classList.remove('is-turning');
          void cell.offsetWidth;
          cell.classList.remove('is-instant', 'is-below');
        }, 250);
      });
    }

    var timer = null;

    function run() {
      if (timer) return;
      /* Back on screen after a while away: snap to the right numbers rather
         than flipping every one of them at once. */
      paint(false);
      timer = setInterval(function () { paint(true); }, 1000);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    paint(false);

    /* Ticks only while it can be seen — a flip forces a layout, and there is
       no reason to pay for one every second under a guest's scroll elsewhere. */
    if (!('IntersectionObserver' in window)) { run(); return; }

    var onScreen = false;

    function update() {
      if (onScreen && !document.hidden) run();
      else stop();
    }

    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      update();
    }, { rootMargin: '100px 0px' }).observe(el);

    document.addEventListener('visibilitychange', update);
  }

  return { start: start };
})();
