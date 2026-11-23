/* Wires the page together. Each module above owns one piece of behaviour. */
(function () {
  'use strict';

  /* Each module is started on its own, so one that throws — an older browser
     missing an API, a section removed from the HTML — costs only its own
     piece. Unguarded, it would stop everything after it, including the hero:
     the preloader would never lift and the page would stay locked for good. */
  function run(name, fn) {
    try {
      return fn();
    } catch (e) {
      if (window.console) console.error('[' + name + ']', e);
    }
  }

  var music = run('music', function () { return window.Music.init(); }) ||
    { start: function () {} };

  run('sparks', function () {
    window.Effects.sparks(document.getElementById('sparks'), window.WEDDING.sparkCount);
  });

  run('reveal', function () { window.Reveal.watch(); });
  run('carousel', function () { window.Carousel.init(); });
  run('scratch', function () { window.ScratchCard.init(); });
  run('journey', function () { window.Journey.init(); });
  run('rsvp', function () { window.Rsvp.init(); });
  run('countdown', function () {
    window.Countdown.start(document.getElementById('countdown'));
  });

  /* The sections that loop an animation forever — the hero's prompts, the
     sparks and breathing heart, the bobbing plane — are paused while they are
     off screen; style.css does the pausing for anything inside .is-offscreen. */
  if ('IntersectionObserver' in window) {
    var idle = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-offscreen', !entry.isIntersecting);
      });
    }, { rootMargin: '100px 0px' });

    document.querySelectorAll('#hero, .scratch, #journey-track').forEach(function (el) {
      idle.observe(el);
    });
  }

  /* Runs last: the preloader and the unopened film cover everything until a
     guest taps. The music starts on that same tap, because it is the gesture
     browsers require before any sound is allowed to play. */
  var opened = run('hero', function () {
    return window.Hero.init(function () {
      music.start();
    });
  });

  /* If the opening itself failed, skip it rather than leave the guest behind
     a preloader and a cover that will never lift. */
  if (!opened) {
    ['preloader', 'hero-cover'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    document.documentElement.classList.remove('is-locked');
    document.body.classList.remove('is-locked');
  }
})();
