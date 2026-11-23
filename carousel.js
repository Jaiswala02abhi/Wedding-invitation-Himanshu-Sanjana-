/* The three-photo carousel beside Our Story.

   Only three classes do the work: the current slide sits in the middle, and
   its two neighbours are pushed out to either side and dimmed — style.css
   owns those positions, so this file only ever decides which slide is which.

   It advances on its own while the section is on screen, pauses when it
   scrolls away, and a drag across it steps back or forward by hand. */
window.Carousel = (function () {
  'use strict';

  function init() {
    var track = document.getElementById('carousel');
    if (!track) return;

    var slides = Array.prototype.slice.call(track.children);
    var tune = window.WEDDING.carousel;
    var current = 0;
    var timer = null;

    function paint() {
      /* Wedvo: the photos can change in the editor, so they are re-read each time. */
      slides = Array.prototype.slice.call(track.children);
      if (current >= slides.length) current = 0;
      slides.forEach(function (slide, i) {
        var offset = i - current;

        /* Wrap, so the last slide sits to the left of the first rather than
           the whole way round the other side. */
        if (offset > 1) offset -= slides.length;
        if (offset < -1) offset += slides.length;

        slide.classList.toggle('is-current', offset === 0);
        slide.classList.toggle('is-next', offset === 1);
        slide.classList.toggle('is-prev', offset === -1);
      });
    }

    function step(by) {
      current = (current + by + slides.length) % slides.length;
      paint();
    }

    function play() {
      stop();
      timer = setInterval(function () { step(1); }, tune.interval);
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    /* Nothing should be moving in a section nobody is looking at. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) play();
        else stop();
      }, { threshold: 0.2 }).observe(track);
    } else {
      play();
    }

    /* ---- Drag to change photo --------------------------------------------
       A press stops the timer so the carousel does not slide out from under
       the guest's finger; the release starts it again either way. */

    var from = null;

    track.addEventListener('pointerdown', function (e) {
      from = e.clientX;
      stop();
    });

    track.addEventListener('pointerup', function (e) {
      if (from === null) return;
      var moved = from - e.clientX;
      if (Math.abs(moved) > tune.swipe) step(moved > 0 ? 1 : -1);
      from = null;
      play();
    });

    track.addEventListener('pointerleave', function () {
      if (from === null) return;
      from = null;
      play();
    });

    /* Wedvo editor: a photo the client has just added is brought to the front, so she sees it at once
       (shared/photo-peek.js sends 'wv-peek' on the picture). Nothing sends this on a guest's page. */
    track.addEventListener('wv-peek', function (e) {
      slides = Array.prototype.slice.call(track.children);
      var slide = e.target && e.target.closest ? e.target.closest('.carousel__slide') : null, i = slides.indexOf(slide);
      if (i < 0) return;
      current = i; paint(); if (timer) play();
    });

    paint();
  }

  return { init: init };
})();
