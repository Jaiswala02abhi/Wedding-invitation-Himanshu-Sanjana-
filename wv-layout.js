/* The order and the sections the client chose. An invitation without a choice keeps the design as it is. */
(function() {
    var IDS = ['hero', 'invite', 'scratch', 'countdown', 'story', 'events', 'family', 'rsvp']
      , main = document.querySelector('main');
    if (!main)
        return;
    [].slice.call(main.children).filter(function(e) {
        return e.tagName === 'SECTION';
    }).forEach(function(s, i) {
        if (IDS[i])
            s.setAttribute('data-wv', IDS[i]);
    });
    var foot = document.querySelector('footer.footer');
    if (foot)
        foot.setAttribute('data-wv', 'ending');
    function lay(c) {
        var L = (c && c.layout) || {};
        var kids = [].slice.call(main.children)
          , want = (Array.isArray(L.order) ? L.order : []).map(function(id) {
            return main.querySelector('[data-wv="' + id + '"]');
        }).filter(function(e) {
            return e && e.parentNode === main;
        })
          , slots = want.map(function(e) {
            return kids.indexOf(e);
        }).sort(function(a, b) {
            return a - b;
        });
        if (want.length && !want.every(function(e, n) {
            return kids.indexOf(e) === slots[n];
        })) {
            main.style.display = 'flex';
            main.style.flexDirection = 'column';
            kids.forEach(function(k, n) {
                k.style.order = String(n * 10);
            });
            want.forEach(function(e, n) {
                e.style.order = String(slots[n] * 10);
            });
        }
        var css = (Array.isArray(L.hide) ? L.hide : []).map(function(id) {
            return /^[a-z]+$/.test(id) ? '[data-wv="' + id + '"]{display:none!important}' : '';
        }).join('')
          , st = document.getElementById('wv-layout');
        if (!st) {
            st = document.createElement('style');
            st.id = 'wv-layout';
            document.head.appendChild(st);
        }
        st.textContent = css;
    }
    var A = window.WVApply
      , run = A.apply;
    A.apply = function(c, live) {
        run(c, live);
        lay(c);
    }
    ;
}
)();
