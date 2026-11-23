/* Wedvo: puts window.WVC into the page. Runs once before main.js, and again (live=true) for every edit in the preview. */
window.WVApply = (function () {
  'use strict';
  var VIDEOS = ['mehendi', 'sangeet', 'haldi', 'wedding'];
  /* every film a client can pick for an event; the first four are the theme's own */
  var PICK = ['mehendi', 'sangeet', 'haldi', 'wedding', 'mehendi-2', 'haldi-2', 'sangeet-2', 'wedding-2', 'baraat'];
  var PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function txt(el, t) { if (el) el.textContent = t == null ? '' : String(t); }
  function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }
  function lines(el, t) {
    if (!el) return; el.textContent = '';
    String(t || '').split('\n').forEach(function (l, i) { if (i) el.appendChild(document.createElement('br')); el.appendChild(document.createTextNode(l)); });
  }
  function maps(q) { return /^https?:\/\//i.test(q || '') ? q : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q || ''); }
  function arr(a) { return Array.isArray(a) ? a : []; }
  var journeyEl = null, lastEvents = '', lastPhotos = '';

  function apply(c, live) {
    c = c || {};
    var h = c.hero || {}, iv = c.invite || {}, sc = c.scratch || {}, st = c.story || {}, ev = c.events || {}, jn = c.journey || {}, fm = c.family || {}, rs = c.rsvp || {}, pc = c.postcard || {};
    if (c.site && c.site.title) document.title = c.site.title;
    txt($('.preloader__text'), c.preloader); txt($('.hero__tap-text'), c.tap || 'Tap to Begin');

    /* hero */
    var hn = $$('.hero__name'); txt(hn[0], h.first); txt(hn[1], h.second); txt($('.hero__weds'), h.joiner);
    txt($('.hero__scroll-text'), h.scroll);

    /* invitation */
    txt($('.invite__onkar'), iv.symbol); show($('.invite__onkar'), !!iv.symbol);
    lines($('.invite__shabad'), iv.shabad); show($('.invite__shabad'), !!iv.shabad);
    txt($('.invite__heading'), iv.heading); lines($('.invite__lead'), iv.lead);
    var nm = $$('.invite__name'), rl = $$('.invite__relation'), pa = $$('.invite__parents');
    [iv.first || {}, iv.second || {}].forEach(function (p, i) { txt(nm[i], p.name); txt(rl[i], p.relation); show(rl[i], !!p.relation); txt(pa[i], p.parents); show(pa[i], !!p.parents); });
    txt($('.invite__with'), iv.joiner);

    /* scratch + countdown */
    txt($('.scratch__eyebrow'), sc.eyebrow); txt($('.scratch__title'), sc.title); lines($('#scratch-date'), sc.date); txt($('.scratch__hint-text'), sc.hint);
    var titles = window.__wvTitles || (window.__wvTitles = $$('.section__title'));   // parts can move; each keeps its own heading
    txt(titles[0], (c.countdown || {}).title);
    var cd = $('#countdown'); if (cd && c.iso) cd.setAttribute('data-countdown', c.iso);

    /* story */
    txt($('.story__title'), st.title);
    var paras = arr(st.paras).filter(Boolean), box = $('.story__text');
    $$('p', box).forEach(function (p) { p.remove(); });
    paras.forEach(function (t, i) { var p = document.createElement('p'); p.setAttribute('data-reveal', 'up'); if (live) p.className = 'is-in'; p.style.transitionDelay = (0.2 * (i + 1)) + 's'; p.textContent = t; box.appendChild(p); });
    var photos = arr(st.photos).filter(Boolean), pkey = JSON.stringify(photos);
    if (pkey !== lastPhotos) {
      lastPhotos = pkey;
      var car = $('#carousel'); car.replaceChildren();
      photos.forEach(function (src) { var d = document.createElement('div'); d.className = 'carousel__slide'; var im = document.createElement('img'); im.src = src; im.alt = ''; im.loading = 'lazy'; im.draggable = false; d.appendChild(im); car.appendChild(d); });
    }   // carousel.js re-reads its slides on every step, so no restart is needed
    show($('.story__grid'), photos.length > 0 || paras.length > 0);

    /* events + journey */
    txt(titles[1], ev.title);
    var items = arr(ev.items).filter(function (x) { return x && x.name; });
    var list = $('.events__list');
    if (!journeyEl) journeyEl = $('.journey', list);
    var ekey = items.length + '|' + (jn.show !== false) + '|' + (jn.after || 0);
    if (ekey !== lastEvents) {
      lastEvents = ekey;
      list.replaceChildren();
      items.forEach(function (x, i) {
        if (jn.show !== false && journeyEl && i === Math.max(1, Math.min(items.length - 1, jn.after || items.length - 1))) list.appendChild(journeyEl);
        var a = document.createElement('article'); a.className = live ? 'event is-in' : 'event'; a.setAttribute('data-reveal', 'up');
        a.innerHTML = '<header><h3 class="event__name"></h3><p class="event__date"></p><p class="event__time"></p></header>' +
          '<video class="event__video" muted loop playsinline preload="none"></video>' +
          '<footer class="event__venue"><p class="event__venue-label">Venue</p><p class="event__venue-name"></p><p class="event__street"></p><p class="event__country"></p>' +
          '<a class="map-link" target="_blank" rel="noopener noreferrer">' + PIN + 'View on Maps</a></footer>';
        $('video', a).setAttribute('data-src', '' + VIDEOS[i % 4] + '.mp4');
        list.appendChild(a);
      });
      if (live && window.__wvEventVideos) window.__wvEventVideos();
    }
    $$('.event', list).forEach(function (a, i) {
      var x = items[i]; if (!x) return;
      txt($('.event__name', a), x.name); txt($('.event__date', a), x.date); txt($('.event__time', a), x.time);
      $('video', a).setAttribute('aria-label', x.name);
      if (c.layout || x.video) { var vk = PICK.indexOf(x.video) > -1 ? x.video : !c.layout ? '' : /meh[ae]?n?d/i.test(x.name) ? 'mehendi' : sangeet|cocktail/i.test(x.name) ? 'sangeet' : haldi/i.test(x.name) ? 'haldi' : /wedding|shaadi|vivah|phere/i.test(x.name) ? 'wedding' : '', vv = $('video', a), vs = '' + vk + '.mp4'; if (vk && vv.getAttribute('data-src') !== vs) { vv.setAttribute('data-src', vs); if (vv.getAttribute('src')) { vv.setAttribute('src', vs); vv.load(); } } }   // the film follows the event when events move
      txt($('.event__venue-name', a), x.venue); txt($('.event__street', a), x.street); show($('.event__street', a), !!x.street);
      txt($('.event__country', a), x.country); show($('.event__country', a), !!x.country);
      var ml = $('.map-link', a); ml.href = maps(x.map || [x.venue, x.street, x.country].filter(Boolean).join(', ')); show($('.event__venue', a), !!(x.venue || x.street));
    });
    if (journeyEl) {
      var stops = $$('.journey__stop', journeyEl);
      var i1 = $('img', stops[0]), i2 = $('img', stops[1]);
      if (i1 && jn.fromImage && i1.getAttribute('src') !== jn.fromImage) i1.src = jn.fromImage;
      if (i2 && jn.toImage && i2.getAttribute('src') !== jn.toImage) i2.src = jn.toImage;
      if (i1) i1.alt = jn.from || ''; if (i2) i2.alt = jn.to || '';
      txt($('.journey__place', stops[0]), jn.from); txt($('.journey__place', stops[1]), jn.to);
      if (live) stops.forEach(function (s) { s.classList.add('is-in'); });
    }

    /* family */
    txt(titles[2], fm.title);
    var groups = arr(fm.groups).filter(function (g) { return g && (g.title || g.names); }), fc = $('.family__card');
    fc.replaceChildren();
    groups.forEach(function (g) { var d = document.createElement('div'); d.className = 'family__group'; var h4 = document.createElement('h4'); h4.textContent = g.title || ''; var p = document.createElement('p'); p.textContent = g.names || ''; d.append(h4, p); fc.appendChild(d); });
    show(fc.parentNode, groups.length > 0);

    /* rsvp */
    show($('#rsvp'), rs.show !== false);
    txt(titles[3], rs.title); txt($('.rsvp__lead'), rs.lead);
    var band = $('.pass__airline'); if (band) { var svg = $('svg', band); band.textContent = ' ' + (rs.airline || ''); if (svg) band.insertBefore(svg, band.firstChild); }
    var cities = $$('.pass__city');
    [[rs.fromCode, rs.fromPlace, rs.fromWhen], [rs.toCode, rs.toPlace, rs.toWhen]].forEach(function (v, i) {
      if (!cities[i]) return; txt($('.pass__code', cities[i]), v[0]); txt($('.pass__place', cities[i]), v[1]); txt($('.pass__when', cities[i]), v[2]);
    });
    var cn = $$('.choice__name'), ci = $$('.choice input');
    txt(cn[0], rs.yes || 'Joyfully yes'); txt(cn[1], rs.no || 'Regretfully no');
    if (ci[0]) ci[0].value = rs.yes || 'Joyfully yes'; if (ci[1]) ci[1].value = rs.no || 'Regretfully no';
    window.__WV_RSVPTXT = { yes: rs.thanks || '', no: rs.regrets || '' };
    var sample = $('.rsvp__sample'); if (sample) sample.style.display = 'none';

    /* postcard */
    txt($('.postcard__thanks'), pc.thanks); txt($('.postcard__text'), pc.text);
    var sign = $('.postcard__sign'); if (sign) { sign.textContent = (pc.sign || '') + ' '; var sp = document.createElement('span'); sp.textContent = pc.names || ''; sign.appendChild(sp); }
    var pm = $$('.postcard__postmark > *'); txt(pm[0], pc.city); txt(pm[1], pc.date); txt(pm[2], pc.country);
    var note = $('.postcard__note'); txt(note, pc.note); show(note, !!pc.note);
    txt($('.postcard__to'), pc.to);
    var ul = $('.postcard__lines'); if (ul) { ul.replaceChildren(); String(pc.lines || '').split('\n').filter(Boolean).forEach(function (l) { var li = document.createElement('li'); li.textContent = l; ul.appendChild(li); }); }
    show($('.footer__credit'), false);

    /* song */
    var au = $('#music'), song = c.song || 'music.mp3';
    if (au && au.getAttribute('src') !== song) { var was = !au.paused; au.setAttribute('src', song); if (was) au.play().catch(function () {}); }
  }
  return { apply: apply };
})();
