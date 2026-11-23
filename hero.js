/* The opening: a preloader, then a film a guest taps to begin.

   The sequence is
     1. the preloader holds until the video has a frame to show (or the
        videoTimeout in config.js runs out, whichever comes first),
     2. the guest taps the cover, which fades out and starts the film,
     3. the names are dealt in one at a time, then the scroll hint appears
        and the page unlocks. A "Skip" button, offered shortly after the tap,
        jumps straight to that point.

   `onOpen` fires at step 2 so the music can start on the same gesture — an
   audio element that plays without one is blocked by every browser. */
window.Hero = (function () {
  'use strict';

  function init(onOpen) {
    var preloader = document.getElementById('preloader');
    var hero = document.getElementById('hero');
    var video = document.getElementById('hero-video');
    var poster = document.getElementById('hero-poster');
    var cover = document.getElementById('hero-cover');
    var names = document.getElementById('hero-names');
    var scroll = document.getElementById('hero-scroll');
    var skip = document.getElementById('hero-skip');

    window.Effects.motes(document.getElementById('motes'), window.WEDDING.moteCount);

    /* ---- 0. Start at the top --------------------------------------------- */

    /* index.html has already switched scroll restoration off; this catches
       what that cannot: a browser that restored the position before reading
       it, a #fragment in the address the browser jumped to, and a page handed
       back from the back/forward cache. Only while the page is still locked —
       once the guest is free to scroll, where they are is their business. */
    var released = false;
    var target = null;

    if (location.hash.length > 1) {
      try { target = document.querySelector(location.hash); } catch (e) { target = null; }
    }

    function toTop() {
      if (!released && (window.scrollY || window.pageYOffset)) window.scrollTo(0, 0);
    }
    toTop();
    window.addEventListener('load', toTop);
    window.addEventListener('pageshow', toTop);

    /* ---- 1. Hold the preloader until there is something behind it -------- */

    var shown = false;

    /* Once faded, an element is taken out of the page altogether, so the
       animations inside it stop running. The timer is the backstop for a
       browser that skips the transition (reduced motion, a background tab). */
    function removeAfterFade(el, ms) {
      var gone = false;
      function remove() {
        if (gone) return;
        gone = true;
        el.hidden = true;
      }
      el.addEventListener('transitionend', function (e) {
        if (e.target === el && e.propertyName === 'opacity') remove();
      });
      setTimeout(remove, ms + 200);
    }

    function reveal() {
      if (shown) return;
      shown = true;
      preloader.classList.add('is-done');
      removeAfterFade(preloader, 600);
    }

    /* A frame is decoded and painted — drop the still and let the video through. */
    function firstFrame() {
      poster.classList.add('is-hidden');
      reveal();
    }

    video.addEventListener('loadeddata', firstFrame);
    video.addEventListener('playing', firstFrame);
    if (video.readyState >= 2) firstFrame();

    /* The still is a perfectly good opening image, so a slow video is never
       worth more than this much of a guest's patience. Counted from when the
       page began loading, not from when this script ran — on a slow
       connection the scripts alone can take several seconds to arrive, and
       the guest has been waiting all that time. */
    var waited = window.performance && performance.now ? performance.now() : 0;
    setTimeout(reveal, Math.max(0, window.WEDDING.videoTimeout - waited));

    /* ---- 2. The tap ------------------------------------------------------ */

    var opened = false;
    var backstop = null;
    var namesTimer = null;
    var skipTimer = null;
    var named = false;

    /* Deals the three lines in, one after another. style.css owns the wipe;
       the inline delay is what staggers them. */
    function showNames() {
      if (named) return;
      named = true;
      clearTimeout(namesTimer);
      names.querySelectorAll('*').forEach(function (line, i) {
        line.style.transitionDelay = (i * 0.4) + 's';
      });
      names.classList.add('is-in');
    }

    /* Hands the page over: the hint appears and scrolling is allowed again.
       Called once, by whichever comes first — the film ending, the backstop,
       or playback being refused outright. */
    function release() {
      if (released) return;
      released = true;
      clearTimeout(backstop);
      clearTimeout(skipTimer);
      skip.hidden = true;
      scroll.classList.add('is-in');
      document.documentElement.classList.remove('is-locked');
      document.body.classList.remove('is-locked');

      /* A link straight to a section (…/#rsvp) still gets there — after the
         opening, rather than instead of it. */
      if (target) {
        setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
      }
    }

    cover.addEventListener('click', function () {
      if (opened) return;
      opened = true;

      cover.classList.add('is-open');
      removeAfterFade(cover, 1000);

      var playing = video.play();
      if (playing && playing.catch) {
        playing.catch(function () {
          /* Refused: the still stays up, so there is no film to wait on and
             nothing to hold the page for. */
          showNames();
          release();
        });
      }

      if (onOpen) onOpen();

      /* ---- 3. The film runs, then the names ----------------------------- */

      /* The film is given a few seconds to itself before the names arrive over
         it. Armed from the tap, then re-armed from the moment playback really
         begins — on a slow connection those are not the same instant. */
      namesTimer = setTimeout(showNames, window.WEDDING.namesAtMs);

      video.addEventListener('playing', function onPlaying() {
        video.removeEventListener('playing', onPlaying);
        if (named) return;
        clearTimeout(namesTimer);
        namesTimer = setTimeout(showNames, window.WEDDING.namesAtMs);
      });

      /* The film plays once, and the page stays where it is until it has
         finished — the opening is meant to be watched, not scrolled past. */
      video.addEventListener('ended', function () {
        showNames();
        release();
      });
      backstop = setTimeout(function () {
        showNames();
        release();
      }, window.WEDDING.heroHoldMs);

      skipTimer = setTimeout(function () {
        if (!released) skip.hidden = false;
      }, window.WEDDING.skipAfterMs);
    });

    /* Skipping lands where the film would have: held on its last frame — the
       backdrop the names sit on — with the names in and the page free. */
    skip.addEventListener('click', function () {
      video.pause();
      if (isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
      showNames();
      release();
    });

    /* The hint has done its job once the guest has taken the advice, and so
       has this listener — it would otherwise run on every scroll for good. */
    window.addEventListener('scroll', function onScroll() {
      if (window.scrollY <= 80 || !scroll.classList.contains('is-in')) return;
      scroll.classList.remove('is-in');
      window.removeEventListener('scroll', onScroll);
    }, { passive: true });

    return hero;
  }

  return { init: init };
})();
