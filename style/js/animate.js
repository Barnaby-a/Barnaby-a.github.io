// Entrance animations controller (direction-aware)
// Behaviour: animate only when entering while scrolling DOWN.
// If the user scrolls UP past an element (leaves while scrolling up), the
// visible state is removed so the animation will replay on the next downward pass.
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const selectorList = '#site-header, #hero .hero-profile, #hero > .wrap, #about .about-left, #about .about-right, #full-stack .stack-item, .projects-list li, footer';
  const targets = Array.from(document.querySelectorAll(selectorList));
  if (!targets.length) return;

  if (reduceMotion) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  // Apply initial hidden state
  targets.forEach(el => el.classList.add('reveal'));

  // Track scroll direction via passive listener
  let lastY = (window.pageYOffset || document.documentElement.scrollTop) || 0;
  let goingDown = true;
  window.addEventListener('scroll', () => {
    const y = (window.pageYOffset || document.documentElement.scrollTop) || 0;
    goingDown = y > lastY;
    lastY = y;
  }, { passive: true });

  function computeStaggerDelay(el) {
    let delay = 0;
    try {
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll(':scope > .stack-item, :scope > li, :scope > .about-left, :scope > .about-right, :scope > .hero-profile, :scope > .wrap'));
        const idx = siblings.indexOf(el);
        if (idx >= 0) delay = idx * 70;
      }
    } catch (e) { /* ignore */ }
    return delay;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;

      if (entry.isIntersecting) {
        // ENTER: only run staggered animation when scrolling down
        if (goingDown) {
          if (el._revealTimer) { clearTimeout(el._revealTimer); el._revealTimer = null; }
          const delay = computeStaggerDelay(el);
          if (el._revealTimerAdd) clearTimeout(el._revealTimerAdd);
          el._revealTimerAdd = setTimeout(() => {
            el.classList.add('is-visible');
            el._revealTimerAdd = null;
          }, delay);
        } else {
          // Entering while scrolling up: make it visible without the staged animation
          el.classList.add('is-visible');
          if (el._revealTimerAdd) { clearTimeout(el._revealTimerAdd); el._revealTimerAdd = null; }
          if (el._revealTimer) { clearTimeout(el._revealTimer); el._revealTimer = null; }
        }

      } else {
        // LEAVE: remove visible state only when leaving while scrolling UP
        if (!goingDown) {
          if (el._revealTimer) clearTimeout(el._revealTimer);
          el._revealTimer = setTimeout(() => {
            el.classList.remove('is-visible');
            el._revealTimer = null;
          }, 80);
          if (el._revealTimerAdd) { clearTimeout(el._revealTimerAdd); el._revealTimerAdd = null; }
        } else {
          // leaving while scrolling down — keep it visible
        }
      }
    });
  }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(t => observer.observe(t));

  // Small initial entrance for header and hero elements
  window.addEventListener('load', () => {
    const intro = document.querySelectorAll('#site-header, #hero .hero-profile, #hero > .wrap');
    Array.from(intro).forEach((el, i) => {
      el.classList.add('reveal');
      setTimeout(() => el.classList.add('is-visible'), i * 90 + 60);
    });
  });

})();
// Entrance animations controller
(function () {
  'use strict';

  // Respect reduced motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Elements to reveal (broad but conservative set)
  const targets = Array.from(document.querySelectorAll('#site-header, #hero .hero-profile, #hero > .wrap, #about .about-left, #about .about-right, #full-stack .stack-item, .projects-list li, footer'));

  if (!targets.length) return;

  if (reduceMotion) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  // Initialize hidden state
  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      // Stagger based on index among visible siblings when possible
      let delay = 0;
      try {
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.querySelectorAll(':scope > .stack-item, :scope > li, :scope > .about-left, :scope > .about-right, :scope > .hero-profile, :scope > .wrap'));
          const idx = siblings.indexOf(el);
          if (idx >= 0) delay = idx * 70;
        }
      } catch (e) {
        // ignore selector issues in older browsers
      }

      setTimeout(() => el.classList.add('is-visible'), delay);
      obs.unobserve(el);
    });
  }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(t => observer.observe(t));

  // Small initial entrance for header and hero elements
  window.addEventListener('load', () => {
    const intro = document.querySelectorAll('#site-header, #hero .hero-profile, #hero > .wrap');
    Array.from(intro).forEach((el, i) => {
      el.classList.add('reveal');
      setTimeout(() => el.classList.add('is-visible'), i * 90 + 60);
    });
  });

})();
