/* The gold foil inside the heart. Dragging across it erases the foil; once
   enough is gone the whole sheet fades out, the date scales up behind it and
   a shower of gold falls over the card.

   How much has been scratched is measured by dividing the heart into a 10x10
   grid and counting which cells the pointer has crossed, rather than reading
   the canvas back pixel by pixel. Only the inner 8x8 counts — the corners of
   a heart-shaped clip are never visible, so nobody can reach them. */
window.ScratchCard = (function () {
  'use strict';

  function init() {
    var canvas = document.getElementById('scratch-foil');
    var date = document.getElementById('scratch-date');
    var hint = document.getElementById('scratch-hint');
    var shimmer = document.getElementById('scratch-shimmer');
    var confetti = document.getElementById('scratch-confetti');
    if (!canvas) return;

    var tune = window.WEDDING.scratch;
    var ctx = canvas.getContext('2d');
    var size = 0;
    var drawing = false;
    var last = null;
    var done = false;
    var touched = {};
    var count = 0;

    /* ---- Paint the foil --------------------------------------------------- */

    function paint() {
      var dpr = window.devicePixelRatio || 1;

      /* offsetWidth, not the bounding rect: the card is still scaled down by
         its reveal transform the first time this runs, and a rect would size
         the foil to the scaled-down box. */
      size = canvas.offsetWidth;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var gold = ctx.createLinearGradient(0, 0, size, size);
      gold.addColorStop(0, '#d4af37');
      gold.addColorStop(0.3, '#e6c27a');
      gold.addColorStop(0.5, '#c9a227');
      gold.addColorStop(0.7, '#fdf2a9');
      gold.addColorStop(1, '#aa771c');
      ctx.fillStyle = gold;
      ctx.fillRect(0, 0, size, size);

      /* A dusting of light and dark pixels, so the foil has a grain to it
         rather than reading as a flat gradient. */
      for (var i = 0; i < size * size * 0.04; i++) {
        ctx.fillStyle = Math.random() > 0.5
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(0,0,0,0.04)';
        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
      }
    }

    /* ---- Scratch ---------------------------------------------------------- */

    /* A soft-edged hole, so the foil tears rather than being cut out. */
    function rub(x, y) {
      var radius = size * 0.1;
      var fade = ctx.createRadialGradient(x, y, 0, x, y, radius);
      fade.addColorStop(0, 'rgba(0,0,0,1)');
      fade.addColorStop(0.4, 'rgba(0,0,0,0.8)');
      fade.addColorStop(0.8, 'rgba(0,0,0,0.2)');
      fade.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = fade;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function scratch(e) {
      if (done) return;

      /* Mapped through the rendered width rather than taken raw, so the
         pointer still lands where the guest expects while the card is mid
         hover-animation or part-way through its reveal. */
      var box = canvas.getBoundingClientRect();
      var x = (e.clientX - box.left) / box.width * size;
      var y = (e.clientY - box.top) / box.height * size;
      var from = last || { x: x, y: y };

      /* Pointer events arrive far apart on a fast drag, so the gap between
         this point and the last is filled in by hand. */
      var span = Math.hypot(x - from.x, y - from.y);
      var steps = Math.max(1, Math.ceil(span / (size * 0.02)));

      for (var i = 0; i <= steps; i++) {
        var px = from.x + (x - from.x) * (i / steps);
        var py = from.y + (y - from.y) * (i / steps);
        rub(px, py);

        var cx = Math.floor(px / size * 10);
        var cy = Math.floor(py / size * 10);
        if (cx < 1 || cx > 8 || cy < 1 || cy > 8) continue;

        var key = cx + ',' + cy;
        if (!touched[key]) { touched[key] = true; count++; }
      }

      last = { x: x, y: y };

      /* 64 cells are reachable, so both figures are a percentage of those. */
      var cleared = count / 64 * 100;

      /* Part-way there, the foil catches the light once. */
      if (cleared > tune.shimmerAt && shimmer.hidden) shimmer.hidden = false;
      if (cleared > tune.threshold) reveal();
    }

    function reveal() {
      if (done) return;
      done = true;

      canvas.classList.add('is-cleared');
      hint.classList.add('is-done');
      shimmer.hidden = true;
      date.classList.add('is-in');
      window.Effects.confetti(confetti, 800);
    }

    /* ---- Pointer ---------------------------------------------------------- */

    canvas.addEventListener('pointerdown', function (e) {
      drawing = true;
      last = null;
      canvas.setPointerCapture(e.pointerId);
      scratch(e);
    });

    canvas.addEventListener('pointermove', function (e) {
      if (drawing) scratch(e);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      canvas.addEventListener(type, function () {
        drawing = false;
        last = null;
      });
    });

    /* Dragging across the heart on a phone should scratch it, not scroll the
       page past it. */
    canvas.addEventListener('touchmove', function (e) {
      if (!done) e.preventDefault();
    }, { passive: false });

    paint();

    /* The foil is sized from the rendered card, so a resize that changes the
       card has to repaint it. Anything already scratched is lost, which only
       matters before the reveal — after it the canvas is hidden anyway.

       Only a real change of width counts: a phone fires `resize` every time
       its address bar slides in or out during a scroll, and repainting then
       would stall the scroll and wipe a half-scratched heart. */
    var pending = false;
    window.addEventListener('resize', function () {
      if (done || pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        if (!done && canvas.offsetWidth !== size) paint();
      });
    });
  }

  return { init: init };
})();
