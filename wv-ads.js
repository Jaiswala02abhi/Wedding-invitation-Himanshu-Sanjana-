/* Meta (Facebook / Instagram) pixel for Wedvo's own pages, so an ad can learn who looked, who started a payment and
   who paid. It is on the same pages as ga.js (home, about pages, theme previews, the editor, the payment page and the
   two video makers) and never on a client's invitation (wedvo.in/NAME).
   Pixel: dataset "wedvo save the date" (908299598940452), made by Abhishek on 2026-11-13 in the ad account that runs
   Wedvo's ads.
   What Meta is told: PageView, ViewContent (a video maker opened), Lead (an invitation saved for the first time),
   InitiateCheckout (a payment started) and Purchase (a payment done, with the amount in INR, once per order).
   What it is never told: an edit key, a link name, an order number or a phone number. The pixel always reports the
   address of the page, so while it reports, the address bar is switched for a moment to the same address without those
   parts (only ad tags like utm_source and fbclid stay) and then put back. A page reached from a page with such an
   address sends nothing at all, because the pixel would report where the visitor came from too. The pixel's own
   guessing (button texts, page details, typed phone numbers) is switched off. */
(function() {
    /* 908299598940452: "wedvo save the date", owned by the business of the old "testing" ad account (disabled 2026-11-22).
     2159799711576358: "Wedvo website", made 2026-11-22 in the Revnova business for the Revnova ad account that now runs the ads.
     Every event goes to both. */
    var IDS = ['908299598940452', '2159799711576358'];
    if (window.__WV_ADS_ON)
        return;
    window.__WV_ADS_ON = 1;
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname))
        return;
    /* a test computer is not a visitor */
    var KEEP = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'fbclid', 'gclid', 'gbraid', 'wbraid', 'dclid', 'srsltid'];
    var STD = {
        PageView: 1,
        ViewContent: 1,
        Lead: 1,
        InitiateCheckout: 1,
        Purchase: 1
    };
    /* this site's address with nothing private in it: the path, the ad tags and the #part */
    function plain(u) {
        var x = new URL(u,location.href)
          , q = new URLSearchParams();
        KEEP.forEach(function(k) {
            var v = x.searchParams.get(k);
            if (v)
                q.set(k, v.slice(0, 600));
        });
        var s = q.toString();
        return x.pathname + (s ? '?' + s : '') + x.hash;
    }
    function here() {
        return location.pathname + location.search + location.hash;
    }
    function isPrivate(u) {
        try {
            var x = new URL(u,location.href);
            return x.origin === location.origin && x.pathname + x.search + x.hash !== plain(u);
        } catch (e) {
            return true;
        }
    }
    /* an order number as a short code, so no link name travels with it (the same code ga.js uses) */
    function code(s) {
        var h = 5381;
        s = String(s);
        for (var i = 0; i < s.length; i++)
            h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
        return 'o' + h.toString(36) + s.length.toString(36);
    }
    function once(key) {
        try {
            if (localStorage.getItem(key))
                return false;
            localStorage.setItem(key, '1');
        } catch (e) {}
        return true;
    }

    var inFrame;
    try {
        inFrame = window.top !== window.self;
    } catch (e) {
        inFrame = true;
    }
    var send;
    if (inFrame) {
        /* a video maker opened inside the home page: the home page reports for it, so nothing is counted twice */
        send = function(name, p, id) {
            try {
                var f = window.parent.__WV_ADS;
                if (typeof f === 'function')
                    f(name, p, id);
            } catch (e) {}
        }
        ;
    } else {
        if (document.referrer && isPrivate(document.referrer))
            return;
        /* Meta's own loader, with its automatic extras off */
        var n = window.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        }
        ;
        if (!window._fbq)
            window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        n.disablePushState = true;
        /* no page view of its own when the editor rewrites its address (that address holds the edit key) */
        IDS.forEach(function(id) {
            n('set', 'autoConfig', false, id);
            n('init', id);
        });
        var ready = false
          , wait = []
          , held = 0
          , real = '';
        function seen() {
            try {
                return performance.getEntriesByType('resource').filter(function(r) {
                    return /facebook\.com\/tr/.test(r.name);
                }).length;
            } catch (e) {
                return 0;
            }
        }
        /* the address bar shows the plain address while an event is on its way, and the real one again right after */
        function hold() {
            if (!held) {
                var w = plain(location.href);
                if (w !== here()) {
                    real = here();
                    try {
                        history.replaceState(history.state, '', w);
                    } catch (e) {
                        real = '';
                    }
                }
            }
            held++;
        }
        function free() {
            if (--held > 0)
                return;
            held = 0;
            if (real) {
                var r = real;
                real = '';
                try {
                    if (!isPrivate(location.href))
                        history.replaceState(history.state, '', r);
                } catch (e) {}
            }
        }
        function fire(name, p, id) {
            var before = seen()
              , t0 = Date.now();
            hold();
            try {
                n(STD[name] ? 'track' : 'trackCustom', name, p || {}, id ? {
                    eventID: id
                } : {});
            } catch (e) {}
            var iv = setInterval(function() {
                if (seen() > before || Date.now() - t0 > 2500) {
                    clearInterval(iv);
                    free();
                }
            }, 40);
        }
        send = function(name, p, id) {
            if (ready)
                fire(name, p, id);
            else
                wait.push([name, p, id]);
        }
        ;
        window.__WV_ADS = send;
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://connect.facebook.net/en_US/fbevents.js';
        s.onload = function() {
            ready = true;
            wait.splice(0).forEach(function(a) {
                fire(a[0], a[1], a[2]);
            });
        }
        ;
        (document.head || document.documentElement).appendChild(s);
        send('PageView');
    }

    function thing(id, name, value) {
        var p = {
            content_type: 'product',
            content_ids: [id],
            content_name: name
        };
        if (value != null) {
            p.value = +value || 0;
            p.currency = 'INR';
        }
        return p;
    }
    function bought(order, value, id, name) {
        value = +value || 0;
        if (!order || value <= 0 || !once('wvads-p-' + code(order)))
            return;
        send('Purchase', thing(id, name, value), code(order));
    }

    /* a video maker was opened */
    var mk = /\/(save-the-date|invite-video)\//.exec(location.pathname);
    if (mk)
        send('ViewContent', thing(mk[1], mk[1] === 'save-the-date' ? 'Save the Date video' : 'Invitation video'));
    /* the payment page of an invitation says what was paid (pay.php) */
    var P = window.WV_GA_PURCHASE;
    if (P && P.id)
        bought(P.id, P.value, P.theme || 'invitation', 'Invitation: ' + (P.theme || ''));

    /* a first save, a payment started and a payment done: read from the site's own answers, as ga.js does */
    var F = window.fetch;
    if (!F)
        return;
    window.fetch = function(input, init) {
        var p = F.apply(this, arguments);
        try {
            var url = typeof input === 'string' ? input : (input && input.url) || ''
              , m = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
            var U = new URL(url,location.href);
            url = U.origin === location.origin ? U.pathname + U.search : '';
            var api = /\/api\.php\?/.test(url) ? ((/[?&]a=(save|pay)(&|$)/.exec(url) || [])[1] || '') : ''
              , k = /\/(save-the-date|invite-video)\/pay\.php\?/.exec(url)
              , act = k ? ((/[?&]a=(start|check)(&|$)/.exec(url) || [])[1] || '') : '';
            if ((api && m === 'POST') || act)
                p.then(function(r) {
                    return r.clone().json();
                }).then(function(d) {
                    if (!d || !d.ok)
                        return;
                    var W = window.WV || {}
                      , th = String(W.theme || '')
                      , price = +W.price || 0;
                    if (api === 'save') {
                        if (d['new'])
                            send('Lead', thing(th, 'Invitation: ' + th));
                    } else if (api === 'pay' && !d.paid)
                        send('InitiateCheckout', thing(th, 'Invitation: ' + th, price));
                    else if (k) {
                        var id = k[1]
                          , nm = id === 'save-the-date' ? 'Save the Date video' : 'Invitation video'
                          , amt = +d.amount || 0
                          , ord = d.order || d.id || (/[?&]order=([^&]+)/.exec(url) || [])[1] || '';
                        if (act === 'start' && !d.paid && !d.free && amt > 0)
                            send('InitiateCheckout', thing(id, nm, amt));
                        if (d.paid === true && ord && amt > 0)
                            bought(decodeURIComponent(ord), amt, id, nm);
                    }
                }).catch(function() {});
        } catch (e) {}
        return p;
    }
    ;
}
)();
