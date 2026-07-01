(function () {
  const reduceMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const gsap = window.gsap;
  const Flip = window.Flip;

  if (gsap && Flip) {
    gsap.registerPlugin(window.Flip);
  }

  if (gsap) {
    gsap.defaults({ duration: 0.38, ease: "power2.out" });
    document.documentElement.classList.add("motion-ready");
  }

  function prefersReducedMotion() {
    return Boolean(reduceMotionQuery?.matches);
  }

  function canAnimate(target) {
    if (!gsap || prefersReducedMotion()) return false;
    if (!target) return false;
    if (target instanceof Element) return target.isConnected;
    return true;
  }

  function toArray(selectorOrNodes, root = document) {
    if (!selectorOrNodes) return [];
    if (typeof selectorOrNodes === "string") return Array.from(root.querySelectorAll(selectorOrNodes));
    if (selectorOrNodes instanceof Element) return [selectorOrNodes];
    return Array.from(selectorOrNodes).filter(Boolean);
  }

  function enterView(name, root) {
    if (!canAnimate(root)) return false;
    const targets = toArray("[data-motion-enter], .motion-enter", root);
    gsap.fromTo(
      targets.length ? targets : root,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, stagger: 0.04, overwrite: "auto" },
    );
    return true;
  }

  function enterSearchResults(root) {
    if (!canAnimate(root)) return false;
    const cards = toArray(".candidate-card[data-search-score]:not([hidden])", root);
    const scan = root.querySelector(".motion-scan-layer");
    if (!cards.length && !scan) return false;

    const timeline = gsap.timeline({ defaults: { duration: 0.34, ease: "power2.out" } });

    if (scan) {
      timeline
        .fromTo(scan, { autoAlpha: 0, xPercent: -22 }, { autoAlpha: 1, xPercent: 22, duration: 0.42 }, 0)
        .to(scan, { autoAlpha: 0, duration: 0.18 }, ">");
    }

    if (cards.length) {
      timeline.fromTo(
        cards,
        { autoAlpha: 0, y: 18, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          stagger: 0.055,
          clearProps: "transform,opacity,visibility",
        },
        scan ? 0.12 : 0,
      );
    }
    return true;
  }

  function runMutation(mutator) {
    mutator();
    return true;
  }

  function flipContainer(container, mutator, targetsSelector) {
    if (!container || typeof mutator !== "function") return false;
    if (!gsap || !Flip || prefersReducedMotion()) {
      return runMutation(mutator);
    }

    let state;
    try {
      const targets = targetsSelector ? toArray(targetsSelector, container) : Array.from(container.children);
      if (!targets.length) return runMutation(mutator);
      state = Flip.getState(targets);
    } catch (error) {
      return runMutation(mutator);
    }

    mutator();
    try {
      Flip.from(state, {
        duration: 0.42,
        ease: "power2.inOut",
        absolute: false,
        nested: true,
        prune: true,
        stagger: 0.025,
      });
    } catch (error) {
      // DOM mutation has already completed; animation failures must not break product logic.
    }
    return true;
  }

  function flipSearchCards(container, mutator) {
    return flipContainer(container, mutator, ".candidate-card[data-search-score]");
  }

  function flipFilterChips(container, mutator) {
    return flipContainer(container, mutator, "[data-search-filter-chip]");
  }

  function enterImportState(state, root) {
    if (!canAnimate(root)) return false;
    const panel = root.querySelector(`[data-import-state="${state}"]`);
    if (!panel) return false;
    const targets = toArray(".import-hero-icon, h2, .import-muted, .import-metric, .result-stat, .import-actions", panel);
    if (!targets.length) return false;

    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 14 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.045,
        overwrite: "auto",
        clearProps: "transform,opacity,visibility",
      },
    );
    return true;
  }

  function updateImportProgress(nodes, value) {
    const targets = toArray(nodes);
    if (!targets.length || !gsap || prefersReducedMotion()) return false;
    gsap.to(targets, {
      width: `${value}%`,
      duration: 0.32,
      ease: "power2.out",
      overwrite: "auto",
    });
    return true;
  }

  function enterTalentView(root) {
    if (!canAnimate(root)) return false;
    const rows = toArray("[data-talent-item]", root).filter((row) => !row.closest(".state-hidden"));
    if (!rows.length) return false;

    gsap.fromTo(
      rows,
      { autoAlpha: 0, y: 12 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.035,
        overwrite: "auto",
        clearProps: "transform,opacity,visibility",
      },
    );
    return true;
  }

  function pulseTalentSelection(item) {
    if (!canAnimate(item)) return false;
    gsap.fromTo(
      item,
      { boxShadow: "0 0 0 0 rgba(139,244,81,0)" },
      {
        boxShadow: "0 0 0 2px rgba(139,244,81,0.28), 0 0 28px rgba(139,244,81,0.18)",
        duration: 0.24,
        yoyo: true,
        repeat: 1,
        overwrite: "auto",
        clearProps: "boxShadow",
      },
    );
    return true;
  }

  function enterResumeDetail(root) {
    if (!canAnimate(root)) return false;
    const targets = toArray(".resume-profile-hero, .resume-tabs, .resume-detail-card", root);
    if (!targets.length) return false;

    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.045,
        overwrite: "auto",
        clearProps: "transform,opacity,visibility",
      },
    );
    return true;
  }

  function enterResumePanel(root) {
    if (!canAnimate(root)) return false;
    const activePanel = root.querySelector(".resume-tab-panel.is-active");
    if (!activePanel) return false;
    gsap.fromTo(
      activePanel,
      { autoAlpha: 0, y: 12 },
      {
        autoAlpha: 1,
        y: 0,
        overwrite: "auto",
        clearProps: "transform,opacity,visibility",
      },
    );
    return true;
  }

  function enterMarketInsight(root) {
    if (!canAnimate(root)) return false;
    const targets = toArray("[data-market-insight-result]", root).filter((node) => !node.hidden);
    if (!targets.length) return false;

    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 10 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.04,
        overwrite: "auto",
        clearProps: "transform,opacity,visibility",
      },
    );
    return true;
  }

  window.DeerRecallMotion = {
    enterView,
    enterSearchResults,
    flipSearchCards,
    flipFilterChips,
    enterImportState,
    updateImportProgress,
    enterTalentView,
    pulseTalentSelection,
    enterResumeDetail,
    enterResumePanel,
    enterMarketInsight,
    prefersReducedMotion,
  };
})();
