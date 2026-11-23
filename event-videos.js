/* Plays the wedding-event films only while they are on screen. Each <video>
   carries its file in data-src, so nothing is downloaded until a guest scrolls
   near it. Only the film most in view plays; the rest are paused, because a
   phone decoding two or three films at once stutters on all of them. */
/* Wedvo: a named function, so the editor can run it again for new event cards. */
window.__wvEventVideos = function () {
  'use strict';

  var videos = Array.prototype.slice.call(document.querySelectorAll('.event__video[data-src]'));
  if (!videos.length) return;

  /* How much of each film is on screen, keyed by its index in `videos`. */
  var ratios = videos.map(function () { return 0; });
  var current = null;

  videos.forEach(function (video) {
    /* iOS and Android only autoplay a film that is muted and inline; set the
       properties as well as the attributes, since some browsers read only one. */
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('disableremoteplayback', '');

    video.addEventListener('playing', function () { video.classList.add('is-playing'); });
    video.addEventListener('loadeddata', function () { video.classList.add('is-ready'); });
  });

  /* On a slow or data-saving connection, buffering a film in full as soon as
     it is near would split an already thin pipe between two or three films,
     and the one on screen would stall. There, a film coming up fetches only
     enough to show its first frame, and the whole film is fetched once it is
     the one actually playing. Browsers without the Network Information API
     keep the full preload. */
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var slow = !!connection &&
    (connection.saveData === true || /(^|-)2g$|^3g$/.test(connection.effectiveType || ''));

  function load(video, now) {
    if (video.getAttribute('src')) {
      if (now && video.preload !== 'auto') video.preload = 'auto';
      return;
    }
    video.preload = now || !slow ? 'auto' : 'metadata';
    video.src = video.getAttribute('data-src');
    video.load();
  }

  function play(video) {
    load(video, true);
    video.muted = true;
    var attempt = video.play();
    /* A browser that refuses autoplay (iOS low-power mode, data saver) leaves
       the film waiting; the next touch anywhere on the page starts it. */
    if (attempt && attempt.catch) {
      attempt.catch(function () { video.classList.add('is-blocked'); });
    }
  }

  function pause(video) {
    if (!video.paused) video.pause();
  }

  /* Play the film most in view, pause every other one. */
  function update() {
    var best = null;
    var bestRatio = 0.2;
    ratios.forEach(function (ratio, i) {
      if (ratio > bestRatio) { best = videos[i]; bestRatio = ratio; }
    });
    videos.forEach(function (video) { if (video !== best) pause(video); });
    current = best;
    if (best && !document.hidden && !best.hasAttribute('data-held')) play(best);
  }

  videos.forEach(function (video) {
    /* A tap toggles the film; one the guest paused stays paused until they
       tap it again, rather than restarting on the next scroll. */
    video.addEventListener('click', function (event) {
      event.stopPropagation();
      if (video.paused) {
        video.removeAttribute('data-held');
        play(video);
      } else {
        video.setAttribute('data-held', '');
        video.pause();
      }
    });
  });

  /* Retry a blocked film inside a real gesture, which every browser honours. */
  function retry(event) {
    if (event.target.closest && event.target.closest('.event__video')) return;
    if (current && current.paused && !current.hasAttribute('data-held')) play(current);
  }
  document.addEventListener('touchend', retry, { passive: true });
  document.addEventListener('click', retry);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) videos.forEach(pause);
    else update();
  });

  if (!('IntersectionObserver' in window)) {
    videos.forEach(load);
    current = videos[0];
    play(current);
    return;
  }

  /* Start fetching well before the film arrives, so it is ready to play. */
  var nearby = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      load(entry.target);
      nearby.unobserve(entry.target);
    });
  }, { rootMargin: '600px 0px' });

  var onScreen = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      ratios[videos.indexOf(entry.target)] = entry.isIntersecting ? entry.intersectionRatio : 0;
    });
    update();
  }, { threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1] });

  videos.forEach(function (video) {
    nearby.observe(video);
    onScreen.observe(video);
  });
};
window.__wvEventVideos();
