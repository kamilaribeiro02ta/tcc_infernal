(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function revealImmediately() {
    document.querySelectorAll(".reveal-on-scroll, .reveal-stagger")
      .forEach(element => element.classList.add("is-visible"));
  }

  function initReveal() {
    const targets = [
      ...document.querySelectorAll(".reveal-on-scroll, .reveal-stagger")
    ];

    if (!targets.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      revealImmediately();
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.14,
      rootMargin: "0px 0px -9% 0px"
    });

    targets.forEach(target => observer.observe(target));

    requestAnimationFrame(() => {
      document.querySelectorAll(".hero-shell.reveal-on-scroll")
        .forEach(hero => hero.classList.add("is-visible"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReveal, { once: true });
  } else {
    initReveal();
  }

  reduceMotion.addEventListener?.("change", event => {
    if (event.matches) revealImmediately();
  });
})();
