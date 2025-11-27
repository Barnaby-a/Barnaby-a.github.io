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
