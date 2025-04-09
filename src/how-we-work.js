import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

window.Webflow ||= [];
window.Webflow.push(() => {
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const getProp = (value) => getComputedStyle(document.documentElement).getPropertyValue(value);

  const updateCircle = (circle, label, isActive) => {
    gsap.to(circle, {
      backgroundColor: getProp(
        isActive ? '--_base--brand--yellow-primary' : '--_base--neutral--neutral-900'
      ),
      color: getProp(
        isActive
          ? '--_semantics---text-color--text-primary'
          : '--_semantics---text-color--text-alternate'
      ),
      duration: 0.3,
    });
    if (label) {
      gsap.to(label, {
        color: getProp(
          isActive
            ? '--_semantics---text-color--text-alternate'
            : '--_semantics---text-color--text-tertiary'
        ),
        duration: 0.3,
      });
    }
  };

  gsap.matchMedia().add('(min-width: 992px)', () => {
    const scrollCards = gsap.utils.toArray('.scroll_card-item');
    const scrollCircles = gsap.utils.toArray('.scroll_circle');
    const scrollLabels = gsap.utils.toArray('.scroll_item h3');
    const scrollLineInners = gsap.utils.toArray('.scroll_line-inner');
    const nav = document.querySelector('.nav_component');
    const scrollTriggers = [];

    const checkScrollCardsFit = () => {
      const viewportHeight = window.innerHeight - 160;
      const allCardsFit = !scrollCards.some((card) => card.offsetHeight > viewportHeight);

      scrollCards.forEach((card) => {
        gsap.set(card, {
          position: allCardsFit ? 'sticky' : 'static',
          top: allCardsFit ? '11rem' : 'auto',
        });
      });
      gsap.set('.scroll_card-grid > div:last-child', { display: allCardsFit ? 'block' : 'none' });
    };

    const setupScrollAnimation = () => {
      scrollTriggers.push(
        ScrollTrigger.create({
          scrub: true,
          trigger: '.section_scroll',
          start: 'top top',
          end: 'bottom 192px',
          onEnter: () => gsap.to(nav, { yPercent: -100, ease: 'power2.out', duration: 0.5 }),
          onEnterBack: () => gsap.to(nav, { yPercent: -100, ease: 'power2.out', duration: 0.5 }),
          onLeaveBack: () => gsap.to(nav, { yPercent: 0, ease: 'power2.out', duration: 0.5 }),
          onLeave: () => gsap.to(nav, { yPercent: 0, ease: 'power2.out', duration: 0.5 }),
        })
      );

      gsap.set(scrollLabels, { color: getProp('--_semantics---text-color--text-tertiary') });
      updateCircle(scrollCircles[0], scrollLabels[0], true);

      scrollCards.forEach((card, index) => {
        const circle = scrollCircles[index];
        const lineInner = scrollLineInners[index];
        const label = scrollLabels[index];

        scrollTriggers.push(
          ScrollTrigger.create({
            animation: gsap.to(lineInner, { scaleX: 1, ease: 'none' }),
            scrub: true,
            trigger: card,
            start: 'top 160px',
            end: 'bottom 64px',
            onEnter: () => {
              if (index !== 0) updateCircle(circle, label, true);
            },
            onLeaveBack: () => {
              if (index !== 0) updateCircle(circle, label, false);
            },
            onLeave: () => {
              if (index === scrollCards.length - 1) {
                updateCircle(scrollCircles[5], null, true);
              }
            },
            onEnterBack: () => {
              if (index === scrollCards.length - 1) {
                updateCircle(scrollCircles[5], null, false);
              }
            },
          })
        );

        if (index !== scrollCards.length - 1) {
          scrollTriggers.push(
            ScrollTrigger.create({
              animation: gsap.to(card, {
                scale: 0.85,
                opacity: 0.5,
                transformOrigin: 'center 25%',
                ease: 'none',
              }),
              scrub: true,
              trigger: card,
              start: '10% 160px',
              end: 'bottom 64px',
              onLeave: () => gsap.set(card, { opacity: 0 }),
            })
          );
        }
      });
    };

    checkScrollCardsFit();
    setupScrollAnimation();
    window.addEventListener('resize', debounce(checkScrollCardsFit, 250));

    return () => {
      gsap.set([...scrollCards, '.scroll_card-grid > div:last-child', ...scrollLabels, nav], {
        clearProps: 'all',
      });
      gsap.set(scrollCards, {
        position: 'static',
        top: 'auto',
      });
      scrollTriggers.forEach((trigger) => trigger.kill());
    };
  });
});
