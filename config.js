/* Timings and tuning only. Everything a guest reads — names, dates, venues,
   phone numbers and the map links — lives in index.html. */
window.WEDDING = {
  /* How long to sit on the preloader before giving up on the hero video and
     showing the page anyway, in milliseconds. A guest on a slow connection
     should never be stuck staring at the loader. */
  videoTimeout: 4500,

  /* The page is held still while the opening film runs, so nobody scrolls off
     it mid-sentence. Normally the film's own `ended` releases it; this is the
     backstop for a browser that stalls or never fires that, and should stay a
     little longer than assets/media/hero.mp4 actually runs (about 10s). */
  heroHoldMs: 12000,

  /* How long the film plays on its own before the couple's names are dealt in
     over it, counted from the moment it actually starts. The three lines then
     take a further 2.3s to land, so this wants to stay comfortably short of
     heroHoldMs or the names will still be arriving as the page is released. */
  namesAtMs: 6500,

  /* How long after the tap the "Skip" button appears. Offered straight away
     it would suggest the film was not worth watching. */
  skipAfterMs: 1500,

  /* Gold motes drifting up behind the preloader. */
  moteCount: 25,

  /* Gold flecks drifting up through the scratch section. */
  sparkCount: 30,

  /* The story carousel. */
  carousel: {
    interval: 3500,   // ms each photo is held before sliding to the next
    swipe: 50         // px of drag that counts as a swipe rather than a tap
  },

  /* The gold foil over the heart. Both figures are a percentage of the part
     of the heart a pointer can actually reach — see assets/js/scratch-card.js. */
  scratch: {
    brush: 28,        // radius erased under the pointer, in canvas pixels
    shimmerAt: 16,    // % scratched away before the foil catches the light
    threshold: 25     // % scratched away before the date reveals itself
  }
};
