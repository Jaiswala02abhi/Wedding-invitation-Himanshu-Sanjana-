/* Google Analytics for Wedvo's own pages: the home page, theme previews, the editor, the video makers, the payment
   page and the about pages. It is never put on a client's invitation (wedvo.in/NAME), so those pages load exactly
   as before and their guests are not counted.
   What leaves the site: which page was opened (its address WITHOUT edit keys, link names, order numbers or phone
   numbers: only ad tags like utm_source are kept), and four events: a save in the editor, a payment started,
   a payment done, with the theme and the amount. No names, numbers or invitation details are sent. */
(function() {
    var ID = 'G-D53GV696XN';
    /* the Wedvo property's measurement ID (Analytics account 412738876, property "Wedvo", stream "Wedvo website") */
    var TEST = Array.isArray(window.__WV_GA_TEST) ? window.__WV_GA_TEST : null;
    /* a test collects the calls instead of sending them */
    if (TEST && window.__WV_GA_ID)
        ID = window.__WV_GA_ID;
    if (window.__WV_GA_ON || !/^G-[A-Z0-9]{6,}$/.test(ID) || /^G-X+$/.test(ID))
        return;
    if (!TEST && /^(localhost|127\.0\.0\.1)$/.test(location.hostname))
        return;
    /* a test computer is not a visitor */
    try {
        if (window.top !== window.self && /^\/editor\//.test(location.pathname))
            return;
    } catch (e) {
        return;
    }
    /* the editor opened inside another page (Wedvo's own "Changes" page) is not a visitor either */
    window.__WV_GA_ON = 1;

    var KEEP = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'gbraid', 'wbraid', 'dclid', 'srsltid'];
    /* an address of this site with nothing private in it; another site's address is kept as it came */
    function clean(u) {
        try {
            var x = new URL(u,location.href);
            if (x.origin !== location.origin)
                return x.href;
            var q = new URLSearchParams();
            KEEP.forEach(function(k) {
                var v = x.searchParams.get(k);
                if (v)
                    q.set(k, v.slice(0, 150));
            });
            var s = q.toString();
            return x.origin + x.pathname + (s ? '?' + s : '');
        } catch (e) {
            return location.origin + location.pathname;
        }
    }
    /* an order number as a short code, so no link name travels with it */
    function code(s) {
        var h = 5381;
        s = String(s);
        for (var i = 0; i < s.length; i++)
            h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
        return 'o' + h.toString(36) + s.length.toString(36);
    }

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        if (TEST)
            TEST.push([].slice.call(arguments));
        else
            window.dataLayer.push(arguments);
    }
    var cfg = {
        page_location: clean(location.href)
    };
    if (document.referrer)
        cfg.page_referrer = clean(document.referrer);
    /* 'set' comes first and is what counts: Google's tag for this property ignores the same values when they are given
     only with 'config' and would send the full address (checked 2026-11-12 on a test page, by reading what was sent).
     With 'set' every hit of the page, later events too, carries the clean address. */
    gtag('set', cfg);
    gtag('js', new Date());
    gtag('config', ID, cfg);
    if (!TEST) {
        window.gtag = window.gtag || gtag;
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
        (document.head || document.documentElement).appendChild(s);
    }

    function send(name, p) {
        try {
            gtag('event', name, p || {});
        } catch (e) {}
    }
    function once(key) {
        try {
            if (localStorage.getItem(key))
                return false;
            localStorage.setItem(key, '1');
        } catch (e) {}
        return true;
    }
    function item(id, name, price) {
        return [{
            item_id: id,
            item_name: name,
            price: price,
            quantity: 1
        }];
    }
    function bought(order, value, id, name) {
        value = +value || 0;
        if (!order || !once('wvga-p-' + code(order)))
            return;
        send('purchase', {
            transaction_id: code(order),
            currency: 'INR',
            value: value,
            items: item(id, name, value)
        });
    }

    /* the payment page of an invitation says what was paid (pay.php) */
    var P = window.WV_GA_PURCHASE;
    if (P && P.id)
        bought(P.id, P.value, P.theme || 'invitation', 'Invitation: ' + (P.theme || ''));

    /* a save in the editor, a payment started, and a video paid for: read from the site's own answers */
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
            /* only this site's own calls, by their full path (the makers call "pay.php?..." without a folder) */
            var api = /\/api\.php\?/.test(url) ? ((/[?&]a=(save|pay)(&|$)/.exec(url) || [])[1] || '') : ''
              , mk = /\/(save-the-date|invite-video)\/pay\.php\?/.exec(url)
              , act = mk ? ((/[?&]a=(start|check)(&|$)/.exec(url) || [])[1] || '') : '';
            if ((api && m === 'POST') || act)
                p.then(function(r) {
                    return r.clone().json();
                }).then(function(d) {
                    if (!d || !d.ok)
                        return;
                    var W = window.WV || {}
                      , th = String(W.theme || '')
                      , price = +W.price || 0;
                    if (api === 'save')
                        send('invitation_save', {
                            theme: th,
                            first_save: d['new'] ? 'yes' : 'no'
                        });
                    else if (api === 'pay' && !d.paid)
                        send('begin_checkout', {
                            currency: 'INR',
                            value: price,
                            items: item(th, 'Invitation: ' + th, price)
                        });
                    else if (mk) {
                        var id = mk[1]
                          , nm = id === 'save-the-date' ? 'Save the Date video' : 'Invitation video'
                          , amt = +d.amount || 0
                          , ord = d.order || d.id || (/[?&]order=([^&]+)/.exec(url) || [])[1] || '';
                        if (act === 'start' && !d.paid && !d.free && amt > 0)
                            send('begin_checkout', {
                                currency: 'INR',
                                value: amt,
                                items: item(id, nm, amt)
                            });
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
