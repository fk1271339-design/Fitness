/* ==========================================================================
   Evolve Fitness — Dynamic Background Scroll & Transformation Logic
   
   Features:
   1. Dynamic Background Image Scroll Observer (Crossfades 7 img/ backgrounds)
   2. Smooth Opacity Transformation Slider (Before & After Physique reveal)
   3. Soft Feathered Cursor Spotlight on hover
   4. Gold Glow Burst at 100% transformation unlock
   5. Interactive 3D Card tilt, Modal, and GSAP Counters
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const q = s => document.querySelector(s);
  const qa = s => document.querySelectorAll(s);

  const afterLayer    = q('#afterLayer');
  const spotlightMask = q('#spotlightMask');
  const reveal        = q('#transformation');
  const target        = q('#target');
  const hint          = q('#hint');
  const slider        = q('#revealSlider');
  const meterVal      = q('#meterVal');
  const meterStatus   = q('#meterStatusText');
  const meterBox      = q('#meterBox');
  const glowBurst     = q('#glowBurst');
  const revealProgress = q('#revealProgress');
  const labelRight    = q('#labelRight');
  const beforeImg     = q('.before img');
  const afterImg      = afterLayer ? afterLayer.querySelector('img') : null;

  const touch = matchMedia('(pointer:coarse)').matches;
  let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  let pos   = { x: mouse.x, y: mouse.y };
  const cursor = q('.cursor');
  const dot    = q('.cursor-dot');

  let currentSliderVal = 0;

  // ── Dynamic Rotating Theory Words ("IS NOT A THEORY") ─────────────────
  const theoryWordEl = q('#theoryDynamicWord');
  const theoryArticleEl = q('#theoryArticle');
  if (theoryWordEl) {
    const theoryWords = [
      { article: 'A', word: 'THEORY.' },
      { article: 'A', word: 'COINCIDENCE.' },
      { article: 'AN', word: 'ILLUSION.' },
      { article: 'A', word: 'MYTH.' },
      { article: 'AN', word: 'ACCIDENT.' },
      { article: 'A', word: 'FANTASY.' },
      { article: 'AN', word: 'OPTION.' },
      { article: 'A', word: 'DREAM.' },
      { article: 'A', word: 'SHORTCUT.' },
      { article: 'A', word: 'GUESSWORK.' }
    ];
    let tWordIdx = 0;

    setInterval(() => {
      theoryWordEl.classList.remove('word-flip-in');
      theoryWordEl.classList.add('word-flip-out');
      if (theoryArticleEl) theoryArticleEl.classList.add('article-swap');

      setTimeout(() => {
        tWordIdx = (tWordIdx + 1) % theoryWords.length;
        const currentItem = theoryWords[tWordIdx];

        theoryWordEl.textContent = currentItem.word;
        if (theoryArticleEl) {
          theoryArticleEl.textContent = currentItem.article;
          theoryArticleEl.classList.remove('article-swap');
        }

        theoryWordEl.classList.remove('word-flip-out');
        theoryWordEl.classList.add('word-flip-in-prep');

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            theoryWordEl.classList.remove('word-flip-in-prep');
            theoryWordEl.classList.add('word-flip-in');
          });
        });
      }, 450);
    }, 2500);
  }

  // ── 0. Dynamic Scroll Background Image Switcher ───────────────────
  const bgSlides = qa('.bg-slide');

  function switchBgSection(sectionId) {
    if (!bgSlides.length) return;
    bgSlides.forEach(slide => {
      if (slide.dataset.section === sectionId) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
  }

  // Section observer setup
  const sectionsToObserve = [
    { id: 'home', selector: '#home' },
    { id: 'transformation', selector: '#transformation' },
    { id: 'facilities', selector: '#facilities' },
    { id: 'trainers', selector: '#trainers' },
    { id: 'perks', selector: '#perks' },
    { id: 'marquee', selector: '.marquee' },
    { id: 'footer', selector: 'footer' }
  ];

  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-bg-section') || entry.target.id;
          if (sectionId) {
            switchBgSection(sectionId);
          }
        }
      });
    }, observerOptions);

    sectionsToObserve.forEach(item => {
      const el = q(item.selector);
      if (el) {
        el.setAttribute('data-bg-section', item.id);
        sectionObserver.observe(el);
      }
    });
  } else {
    // Fallback scroll listener
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      sectionsToObserve.forEach(item => {
        const el = q(item.selector);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            switchBgSection(item.id);
          }
        }
      });
    });
  }

  // ── 1. Custom Cursor Follower ─────────────────────────────────────────
  function animateCursor() {
    pos.x += (mouse.x - pos.x) * 0.17;
    pos.y += (mouse.y - pos.y) * 0.17;
    if (cursor && dot) {
      cursor.style.left = dot.style.left = pos.x + 'px';
      cursor.style.top  = dot.style.top  = pos.y + 'px';
    }
    requestAnimationFrame(animateCursor);
  }

  if (!touch && cursor && dot) {
    animateCursor();
    addEventListener('mousemove', e => (mouse = { x: e.clientX, y: e.clientY }));
    qa('a,button,input,.reveal,.facility').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
  }

  // ── 2. Smooth Crossfade Transformation (Slider 0% → 100%) ────────────
  function updateTransformation(val) {
    currentSliderVal = val;
    const t = val / 100; // Normalized 0 → 1

    // 1. Smooth opacity crossfade on After layer
    if (afterLayer) {
      afterLayer.style.opacity = t;
    }

    // 2. Morph the Before image filters (gradually desaturate & dim)
    if (beforeImg) {
      const bBrightness = 0.88 - (t * 0.25);   // 0.88 → 0.63
      const bSaturate   = 0.85 - (t * 0.5);     // 0.85 → 0.35
      const bContrast   = 1.02 - (t * 0.15);    // 1.02 → 0.87
      beforeImg.style.filter = `brightness(${bBrightness}) contrast(${bContrast}) saturate(${bSaturate})`;
    }

    // 3. Morph the After image filters (gradually enhance vibrancy)
    if (afterImg) {
      const aBrightness = 0.85 + (t * 0.25);    // 0.85 → 1.1
      const aSaturate   = 0.6  + (t * 0.55);    // 0.6  → 1.15
      const aContrast   = 0.9  + (t * 0.25);    // 0.9  → 1.15
      afterImg.style.filter = `brightness(${aBrightness}) contrast(${aContrast}) saturate(${aSaturate})`;
      const scale = 1 + (t * 0.02); // 1.0 → 1.02
      afterImg.style.transform = `scale(${scale})`;
    }

    // 4. Update meter badge text
    if (meterVal) {
      meterVal.textContent = `${val}%`;
      if (val >= 100) {
        meterVal.classList.add('max');
      } else {
        meterVal.classList.remove('max');
      }
    }

    // 5. Update progress glow bar
    if (revealProgress) {
      revealProgress.style.width = `${val}%`;
    }

    // 6. Update meter box active state
    if (meterBox) {
      if (val > 0) {
        meterBox.classList.add('meter-active');
      } else {
        meterBox.classList.remove('meter-active');
      }
    }

    // 7. Status text & glow burst at 100%
    if (val >= 100) {
      if (meterStatus) {
        meterStatus.innerHTML = '<span style="color: var(--gold); text-shadow: 0 0 16px var(--gold); font-weight: 800;">⚡ FULL TRANSFORMATION UNLOCKED — THE BEAST IS UNLEASHED!</span>';
      }
      if (glowBurst) {
        glowBurst.classList.add('active');
      }
      if (labelRight) {
        labelRight.style.boxShadow = '0 0 22px rgba(255, 183, 3, 0.7)';
      }
    } else {
      if (meterStatus) {
        if (val > 60) {
          meterStatus.innerHTML = `<span style="color: #ffd166;">Almost there... keep pulling for full reveal</span>`;
        } else if (val > 20) {
          meterStatus.innerHTML = `<span>The transformation is blending in... drag further →</span>`;
        } else {
          meterStatus.innerHTML = `Drag the slider to smoothly transform. At 100% the full physique is revealed.`;
        }
      }
      if (glowBurst) {
        glowBurst.classList.remove('active');
      }
      if (labelRight) {
        labelRight.style.boxShadow = '';
      }
    }
  }

  // Slider event
  if (slider) {
    slider.addEventListener('input', e => {
      updateTransformation(parseInt(e.target.value));
    });
  }

  // ── 3. Soft Feathered Cursor Spotlight (hover preview) ────────────────
  if (reveal && !touch) {
    reveal.addEventListener('mousemove', e => {
      const r = reveal.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      if (spotlightMask) {
        const maskImg = spotlightMask.querySelector('img');
        if (maskImg) {
          maskImg.style.webkitMaskImage = `radial-gradient(circle 80px at ${x}px ${y}px, #000 30%, transparent 100%)`;
          maskImg.style.maskImage       = `radial-gradient(circle 80px at ${x}px ${y}px, #000 30%, transparent 100%)`;
        }
        spotlightMask.style.opacity = currentSliderVal >= 95 ? '0' : '1';
      }

      if (target) {
        target.style.left    = x + 'px';
        target.style.top     = y + 'px';
        target.style.opacity = currentSliderVal >= 95 ? '0' : '0.8';
      }

      if (hint) hint.style.opacity = '0';
    });

    reveal.addEventListener('mouseleave', () => {
      if (spotlightMask) spotlightMask.style.opacity = '0';
      if (target)        target.style.opacity = '0';
      if (hint && currentSliderVal < 10) hint.style.opacity = '1';
    });
  }

  // ── 4. Interactive Facilities 3D Carousel Controller ───────────────
  const track = q('#carouselTrack');
  const cards = qa('.carousel-card');
  const prevBtn = q('#carouselPrev');
  const nextBtn = q('#carouselNext');
  const dotsContainer = q('#carouselDots');

  if (track && cards.length) {
    let currentIndex = 0;
    let autoPlayTimer = null;

    // Generate dots
    cards.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(i));
      if (dotsContainer) dotsContainer.appendChild(dot);
    });

    const dots = qa('.dot');

    function updateCarousel() {
      const cardWidth = cards[0].offsetWidth + 22;
      track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

      cards.forEach((card, i) => {
        if (i === currentIndex) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      dots.forEach((dot, i) => {
        if (i === currentIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    function goToSlide(index) {
      currentIndex = (index + cards.length) % cards.length;
      updateCarousel();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    // Auto Play
    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => goToSlide(currentIndex + 1), 3600);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
    }

    const wrapper = q('#facilitiesCarousel');
    if (wrapper) {
      wrapper.addEventListener('mouseenter', stopAutoPlay);
      wrapper.addEventListener('mouseleave', startAutoPlay);
    }

    startAutoPlay();
    window.addEventListener('resize', updateCarousel);
  }

  // ── 5. Modal Handlers ─────────────────────────────────────────────────
  const modal = q('#joinModal');
  const openModal = () => {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const input = q('#joinForm input');
      if (input) input.focus();
    }, 250);
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  qa('.modal-open').forEach(b => b.addEventListener('click', openModal));
  const closeBtn = q('.close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  const joinForm = q('#joinForm');
  if (joinForm) {
    joinForm.addEventListener('submit', e => {
      e.preventDefault();
      const success = q('.success');
      if (success) success.classList.add('show');
      e.target.reset();
    });
  }

  const newsletter = q('#newsletter');
  if (newsletter) {
    newsletter.addEventListener('submit', e => {
      e.preventDefault();
      e.target.innerHTML = '<span style="color:var(--gold);font-size:12px;font-weight:800;padding:12px 0;text-shadow: 0 0 12px var(--gold)">YOU\'RE ON THE LIST. ⚡</span>';
    });
  }

  const menu = q('.menu');
  if (menu) {
    menu.addEventListener('click', () => {
      const navLinks = q('#navLinks');
      if (navLinks) navLinks.classList.toggle('show');
    });
  }

  // ── 6. GSAP ScrollTrigger Stats & Meters ──────────────────────────────
  function runStats() {
    if (!window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.to('.bar i', {
      width: i => document.querySelectorAll('.bar i')[i].dataset.width,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#perks', start: 'top 72%', once: true }
    });

    qa('.counter').forEach(el => {
      const val = parseFloat(el.dataset.value);
      gsap.to({ n: 0 }, {
        n: val,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '#perks', start: 'top 70%', once: true },
        onUpdate: function () {
          const n = this.targets()[0].n;
          el.textContent = (Number.isInteger(val) ? Math.round(n).toLocaleString() : n.toFixed(1)) + el.dataset.suffix;
        }
      });
    });
  }

  window.gsap ? runStats() : addEventListener('load', runStats);
});
