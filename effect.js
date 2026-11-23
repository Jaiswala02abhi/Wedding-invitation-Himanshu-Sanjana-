/* Decorative particles: the gold motes drifting behind the preloader, and the
   confetti thrown when the scratch card gives up its date. Both scatter
   randomly, so they are built here rather than written out in the HTML. */
window.Effects = (function () {
  'use strict';

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ---- Drifting motes ---------------------------------------------------- */

  function motes(container, count) {
    if (!container) return;

    var html = '';
    for (var i = 0; i < count; i++) {
      var size = rand(2, 6);
      html += '<span class="motes__item" style="' +
        'left:' + rand(0, 100) + '%;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'animation-duration:' + rand(5, 10) + 's;' +
        'animation-delay:' + rand(0, 5) + 's' +
        '"></span>';
    }
    container.innerHTML = html;
  }

  /* ---- Ambient sparks ----------------------------------------------------- */

  /* The flecks that drift up through the scratch section. Unlike the motes
     above these are solid gold specks rather than soft haloes, and they turn
     as they rise. A negative delay starts each one part-way through its own
     loop, so the section is already full of them on arrival. */
  function sparks(container, count) {
    if (!container) return;

    var html = '';
    for (var i = 0; i < count; i++) {
      var size = rand(2, 6);
      html += '<span class="sparks__item" style="' +
        'left:' + rand(0, 100) + '%;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'background:' + (i % 2 === 0 ? '#c9a24a' : '#fdf2a9') + ';' +
        'opacity:' + rand(0.2, 0.7).toFixed(2) + ';' +
        'animation-duration:' + rand(15, 35) + 's;' +
        'animation-delay:-' + rand(0, 20) + 's' +
        '"></span>';
    }
    container.innerHTML = html;
  }

  /* ---- Confetti ---------------------------------------------------------- */

  var COLORS = ['#d4af37', '#fdf2a9', '#ffffff'];

  /* Gold flakes tumbling down over the heart. They are drawn as four-sided
     slivers rather than squares, which reads more like foil than paper. */
  function confetti(canvas, count) {
    if (!canvas) return;

    /* The canvas is twice the card each way, so at a phone's full 3x density
       it would be millions of pixels cleared and redrawn every frame. 2x is
       already sharper than a falling flake can be seen to be. */
    var box = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = box.width * dpr;
    canvas.height = box.height * dpr;

    var ctx = canvas.getContext('2d');

    var parts = [];
    for (var i = 0; i < count; i++) {
      parts.push({
        x: rand(0, box.width),
        y: -rand(0, box.height),
        vx: rand(-4, 4),
        vy: rand(3, 8),
        size: rand(2, 7),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: rand(0.5, 1),
        spin: rand(-10, 10),
        tilt: rand(0, 360)
      });
    }

    /* Flakes fade out once past this line rather than at the very bottom, so
       the shower thins out instead of stopping dead. */
    var fadeFrom = box.height * 0.2;
    var time = 0;

    (function frame() {
      time += 0.016;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var alive = false;

      parts.forEach(function (p) {
        if (p.alpha <= 0) return;
        alive = true;

        p.x += p.vx + Math.sin(time * 5 + p.y * 0.01) * 0.5;
        p.y += p.vy;
        p.tilt += p.spin;
        if (p.y > fadeFrom) p.alpha -= 0.02;

        /* A flake still above the canvas costs nothing to skip. */
        if (p.y < -p.size * 2) return;

        /* One transform set per flake, rather than a save and restore of the
           whole drawing state — the same picture for a fraction of the work. */
        var a = p.tilt * Math.PI / 180;
        var cos = Math.cos(a) * dpr;
        var sin = Math.sin(a) * dpr;
        ctx.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size * 0.5);
        ctx.lineTo(p.size * 0.8, -p.size);
        ctx.lineTo(p.size, p.size * 0.8);
        ctx.lineTo(-p.size * 0.5, p.size);
        ctx.closePath();
        ctx.fill();
      });

      if (alive) requestAnimationFrame(frame);
      else {
        /* Done: hand the canvas memory back rather than holding an empty
           picture the size of two cards. */
        canvas.width = 0;
        canvas.height = 0;
      }
    })();
  }

  return { motes: motes, sparks: sparks, confetti: confetti };
})();
