/* The plane between the Ahmedabad events and the Udaipur wedding.

   It flies down the dashed line in step with the scroll: this file works out
   how far through the section the guest is and writes that to a --progress
   custom property, and style.css turns it into a position. Keeping the
   arithmetic here and the movement there means no layout is touched per
   frame, and the whole thing is one property write. */
window.Journey = (function () {
  'use strict';

  function init() {
    var track = document.getElementById('journey-track');
    var plane = document.getElementById('journey-plane');
    if (!track || !plane) return;

    var ticking = false;
    var lastY = window.scrollY;
    var lastDone = null;
    var lastHeight = null;
    var lastFacing = null;

    /* Only worth measuring while the track is on or near the screen; the rest
       of the time the scroll handler returns at once. Assumed near until the
       observer says otherwise, so the first paint is always measured. */
    var near = true;

    function measure() {
      ticking = false;

      var box = track.getBoundingClientRect();
      var height = window.innerHeight;

      /* 0 when the top of the track reaches 85% down the screen, 1 by the time
         its bottom has risen to 35% — the stretch where the track is properly
         in view. */
      var from = height * 0.85;
      var to = height * 0.35;
      var done = (from - box.top) / ((from - to) + box.height);
      done = Math.max(0, Math.min(1, done));

      /* Nose-down travelling down the page, nose-up on the way back. */
      var y = window.scrollY;
      if (y !== lastY) {
        var facing = y > lastY ? '180deg' : '0deg';
        if (facing !== lastFacing) {
          plane.style.setProperty('--facing', facing);
          lastFacing = facing;
        }
        lastY = y;
      }

      if (box.height !== lastHeight) {
        plane.style.setProperty('--track', box.height + 'px');
        lastHeight = box.height;
      }

      /* Nothing has moved — before the track arrives and after it has gone,
         the plane is pinned to one end — so there is nothing to write. */
      var rounded = done.toFixed(4);
      if (rounded === lastDone) return;
      lastDone = rounded;

      /* Peaks at mid-flight: the plane swells slightly while its shadow
         shrinks and fades away beneath it, which reads as altitude. Both
         settle again as it comes back down. */
      var climb = Math.sin(done * Math.PI);

      plane.style.setProperty('--progress', rounded);
      plane.style.setProperty('--climb', (1 + climb * 0.08).toFixed(3));
      plane.style.setProperty('--shadow-scale', (1 - climb * 0.4).toFixed(3));
      plane.style.setProperty('--shadow-alpha', (0.5 - climb * 0.35).toFixed(3));
    }

    function onScroll() {
      if (!near || ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    }

    /* A fast fling can carry the track off screen between two frames, so it
       is measured once more on the way out to pin the plane to the right end. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        near = entries[0].isIntersecting;
        if (!near) lastY = window.scrollY;
        requestAnimationFrame(measure);
      }, { rootMargin: '50% 0px' }).observe(track);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      lastDone = null;
      if (near) onScroll();
      else requestAnimationFrame(measure);
    });
    measure();
  }

  return { init: init };
})();
