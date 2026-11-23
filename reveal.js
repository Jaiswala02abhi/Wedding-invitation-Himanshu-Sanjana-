/* Fades elements in as they scroll into view. Mark one up in the HTML with
   data-reveal="up|fade|left|zoom"; style.css says where each starts from, and
   an inline transition-delay staggers a group.

   This replaces the GSAP ScrollTrigger the original page loaded 250KB for. */
window.Reveal = (function () {
  'use strict';

  function watch() {
    var targets = document.querySelectorAll('[data-reveal]');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    targets.forEach(function (el) { observer.observe(el); });
  }

  return { watch: watch };
})();
