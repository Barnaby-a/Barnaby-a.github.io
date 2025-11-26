// Minimal side-box + header behaviour
let lastScrollY = window.scrollY || 0;
const TOP_THRESHOLD = 10; // px from top to consider "at top"

function handleScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const currentY = window.scrollY || window.pageYOffset || 0;

    // scrolled visual
    if (currentY > TOP_THRESHOLD) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    // show side box when not at very top
    if (currentY > TOP_THRESHOLD) {
        document.body.classList.add('side-visible');
        header.classList.add('side-hidden');
        // ensure active state is set for side nav immediately
        if (typeof window.__computeNearestSection === 'function') window.__computeNearestSection();
    } else {
        document.body.classList.remove('side-visible');
        header.classList.remove('side-hidden');
    }

    lastScrollY = currentY;
}

window.addEventListener('scroll', handleScroll, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
    // mark current path link active (if any)
    const navLinks = document.querySelectorAll('.nav__item');
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) link.classList.add('active');
    });

    // smooth-scroll anchors for nav links (prevent default navigation reload)
    navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const hashIdx = href.indexOf('#');
        if (hashIdx !== -1) {
            link.addEventListener('click', (ev) => {
                ev.preventDefault();
                const id = href.slice(hashIdx + 1);
                // If this is the hero/home anchor, scroll to the absolute top to avoid
                // the sticky header overlapping the target (scrollIntoView was leaving
                // a ~100px offset). Otherwise, scroll to the section normally.
                if (id === 'home' || id === 'hero') {
                    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0,0); }
                } else {
                    const el = document.getElementById(id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                // update active immediately
                setTimeout(() => setActiveById(id), 50);
                // update URL hash without reloading
                try { history.replaceState(null, '', '#' + id); } catch (e) {}
            });
        } else {
            // treat Home/root links: smoothly scroll to top instead of navigating away
            const isHome = href === '/' || href === '' || href === './' || href.indexOf('index.html') !== -1;
            if (isHome) {
                link.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => setActiveById('hero'), 50);
                    try { history.replaceState(null, '', '/'); } catch (e) {}
                });
            }
        }
    });

    // Also attach a catch-all handler to any other Home variants (including cloned links)
    const homeSelectors = ["a[href='/']", "a[href='/index.html']", "a[href='./index.html']", "a[href='index.html']", "a[href='./']"];
    document.querySelectorAll(homeSelectors.join(',')).forEach(a => {
        // avoid double-binding if already bound
        if (a.__homeHandlerBound) return;
        a.addEventListener('click', (ev) => {
            ev.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setActiveById('hero'), 50);
            try { history.replaceState(null, '', '/'); } catch (e) {}
            // hide side box if present
            document.body.classList.remove('side-visible');
        });
        a.__homeHandlerBound = true;
    });

    // gather section ids from nav links (hash targets)
    const sectionLinks = () => Array.from(navLinks).filter(l => {
        const href = l.getAttribute('href') || '';
        return href.indexOf('#') !== -1;
    });

    let observedSections = [];
    const rebuildObservedSections = () => {
        observedSections = sectionLinks().map(l => {
            const href = l.getAttribute('href') || '';
            const id = href.slice(href.indexOf('#') + 1);
            return document.getElementById(id);
        }).filter(Boolean);
    };
    // initial build
    rebuildObservedSections();

    // helper to set active link(s) by section id
    function setActiveById(id) {
        if (!id) return;
        document.querySelectorAll('.nav__item').forEach(n => n.classList.remove('active'));
        // if id is 'hero' treat as Home (root href)
        if (id === 'hero' || id === 'home') {
            const homeSelectors = [
                ".nav__item[href='#home']",
                ".nav__item[href='/']",
                ".nav__item[href='/index.html']",
                ".nav__item[href='./index.html']",
                ".nav__item[href='index.html']"
            ];
            const all = document.querySelectorAll(homeSelectors.join(','));
            if (all && all.length) { all.forEach(el => el.classList.add('active')); return; }
            const first = document.querySelector('.nav__item'); if (first) first.classList.add('active');
            return;
        }
        document.querySelectorAll(".nav__item[href*='#" + id + "']").forEach(n => n.classList.add('active'));
    }

    // compute which section is most visible (largest visible height)
    function computeNearestSection() {
        if (!observedSections.length) return;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        // if hero still covers a lot of screen, treat Home as active
        const hero = document.getElementById('hero');
        if (hero) {
            const hr = hero.getBoundingClientRect();
            const heroVisible = Math.max(0, Math.min(hr.bottom, vh) - Math.max(hr.top, 0));
            if (heroVisible / vh >= 0.45) { setActiveById('hero'); return; }
        }

        let best = null, bestVisible = -1;
        observedSections.forEach(sec => {
            const r = sec.getBoundingClientRect();
            const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
            if (visible > bestVisible) { bestVisible = visible; best = sec; }
        });
        if (best && best.id) setActiveById(best.id);
    }

    // expose for immediate calls
    window.__computeNearestSection = computeNearestSection;

    // create side-box clone (if not present)
    if (!document.getElementById('side-box')) {
        const side = document.createElement('div');
        side.id = 'side-box';
        side.setAttribute('aria-hidden', 'true');
        const mainNav = document.getElementById('nav-main');
        if (mainNav) {
            const clone = mainNav.cloneNode(true);
            clone.id = 'side-nav-buttons';
            side.appendChild(clone);
            // clicking a side link hides the side box and smoothly scrolls
            clone.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', (ev) => {
                    const href = a.getAttribute('href') || '';
                    const hashIdx = href.indexOf('#');
                    if (hashIdx !== -1) {
                        ev.preventDefault();
                        const id = href.slice(hashIdx + 1);
                        // same home/hero special case here
                        if (id === 'home' || id === 'hero') {
                            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0,0); }
                        } else {
                            const target = document.getElementById(id);
                            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        setActiveById(id);
                        document.body.classList.remove('side-visible');
                        try { history.replaceState(null, '', '#' + id); } catch (e) {}
                    }
                });
            });
        }
        document.body.appendChild(side);
    }


    // debounce scroll-end to correct active selection
    let t = null;
    window.addEventListener('scroll', () => {
        if (t) clearTimeout(t);
        t = setTimeout(() => computeNearestSection(), 220);
    }, { passive: true });

    // Watch for DOM changes (sections growing/shrinking) and rebuild observedSections
    // Debounce changes so frequent edits don't thrash computation.
    const mainEl = document.querySelector('main') || document.body;
    if (mainEl && typeof MutationObserver !== 'undefined') {
        let mTimer = null;
        const mo = new MutationObserver(() => {
            if (mTimer) clearTimeout(mTimer);
            mTimer = setTimeout(() => {
                rebuildObservedSections();
                computeNearestSection();
            }, 220);
        });
        mo.observe(mainEl, { childList: true, subtree: true, characterData: true });
        // expose observer in case we need to disconnect later
        window.__sideboxMutationObserver = mo;
    }

    // initial state
    handleScroll();
    computeNearestSection();
});
