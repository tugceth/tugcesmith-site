document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const burger = document.querySelector('.burger');
  const navMenu = document.querySelector('.nav-menu');
  if (burger && navMenu) {
    burger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Follow Me dropdown
  const followWrap = document.querySelector('.follow-wrap');
  const followBtn = document.querySelector('.follow-btn');
  if (followWrap && followBtn) {
    followBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      followWrap.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!followWrap.contains(e.target)) {
        followWrap.classList.remove('open');
      }
    });
  }

  // Carousel arrow buttons
  document.querySelectorAll('.carousel-wrap').forEach((wrap) => {
    const track = wrap.querySelector('.carousel');
    const prev = wrap.querySelector('.carousel-prev');
    const next = wrap.querySelector('.carousel-next');
    if (!track) return;
    const scrollAmount = () => (track.querySelector('.carousel-card')?.offsetWidth || 220) + 14;
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));

    // Continuous autoplay: the track glides at a steady speed (no stepping),
    // then glides back at the end. Pauses on hover/touch/focus/interaction.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    track.style.scrollSnapType = 'none';
    track.style.scrollBehavior = 'auto';
    const SPEED = 55; // px per second
    let visible = false, hold = false, pausedUntil = 0, dir = 1, acc = track.scrollLeft, last = 0;
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.25 }).observe(wrap);
    const pause = (ms) => { pausedUntil = performance.now() + ms; };
    wrap.addEventListener('mouseenter', () => { hold = true; });
    wrap.addEventListener('mouseleave', () => { hold = false; pause(600); });
    wrap.addEventListener('focusin', () => { hold = true; });
    wrap.addEventListener('focusout', () => { hold = false; pause(600); });
    ['touchstart', 'pointerdown', 'wheel'].forEach((ev) => wrap.addEventListener(ev, () => pause(5000), { passive: true }));
    wrap.querySelectorAll('.carousel-nav button').forEach((bt) => bt.addEventListener('click', () => pause(6000)));
    const tick = (t) => {
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      const max = track.scrollWidth - track.clientWidth;
      if (visible && !hold && !document.hidden && t >= pausedUntil && max > 4) {
        // re-sync if the user moved the track themselves
        if (Math.abs(track.scrollLeft - acc) > 2) acc = track.scrollLeft;
        acc += dir * SPEED * dt;
        if (acc >= max) { acc = max; dir = -1; }
        else if (acc <= 0) { acc = 0; dir = 1; }
        track.scrollLeft = acc;
      } else {
        acc = track.scrollLeft;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // Scroll-triggered reveal animations
  const revealTargets = document.querySelectorAll(
    '[data-reveal], .carousel-wrap, .doodle-grid, .stat-row'
  );
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animated count-up for stat numbers
  const statNumbers = document.querySelectorAll('.stat-number[data-count-to]');
  const runCountUp = (el) => {
    const target = parseInt(el.getAttribute('data-count-to'), 10);
    const suffix = el.getAttribute('data-count-suffix') || '';
    if (prefersReducedMotion) {
      el.textContent = target.toLocaleString() + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
  if (statNumbers.length && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCountUp(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statNumbers.forEach((el) => countObserver.observe(el));
  } else {
    statNumbers.forEach((el) => runCountUp(el));
  }

  if (revealTargets.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    // No IntersectionObserver support, or reduced motion: show everything immediately
    revealTargets.forEach((el) => el.classList.add('in-view'));
  }

  // Custom Bitcoin-coin cursor (fine pointer + motion allowed only)
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (hasFinePointer && !prefersReducedMotion) {

    const glow = document.createElement('div');
    glow.id = 'btc-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    const cursor = document.createElement('div');
    cursor.id = 'btc-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = `
      <div class="btc-cursor-scale">
        <svg class="btc-cursor-spin" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" fill="#F7931A" stroke="#14110A" stroke-width="1.4"/>
          <text x="16" y="22" text-anchor="middle" font-family="Georgia, serif" font-size="19" font-weight="700" fill="#FFFFFF">&#8383;</text>
        </svg>
      </div>
    `;
    document.body.appendChild(cursor);

    let started = false;

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
      if (!started) {
        started = true;
        cursor.classList.add('active');
        glow.classList.add('active');
      }
    });
    document.addEventListener('mouseleave', () => { cursor.classList.remove('active'); glow.classList.remove('active'); });
    document.addEventListener('mouseenter', () => { if (started) { cursor.classList.add('active'); glow.classList.add('active'); } });
    document.addEventListener('mousedown', () => cursor.classList.add('click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('click'));

    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }


  // Hero videos: clone the Trusted Setup film; hide cards that have no source yet
  const srcVid = document.getElementById('tsc-video');
  document.querySelectorAll('.vcard video').forEach((v) => {
    let src = v.dataset.src || '';
    if (v.dataset.clone && srcVid) src = srcVid.getAttribute('src');
    if (src) {
      v.preload = 'none';
      const start = () => { v.src = src; v.play && v.play().catch(() => {}); };
      const later = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 400));
      if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once: true });
    }
    else { v.parentElement.classList.add('empty'); v.remove(); }
  });

  // Connector lines from the feature cards into the figure
  const stage = document.querySelector('.stage');
  const svg = stage && stage.querySelector('.lines');
  const figure = stage && stage.querySelector('.figure');
  const canvas = stage && stage.querySelector('.canvas');
  const heroText = document.querySelector('.hero-text');
  const fit = () => {
    if (!stage) return 1;
    if (window.innerWidth < 1100) { stage.style.removeProperty('--s'); return 1; }
    const avail = window.innerHeight - 60 - (heroText ? heroText.offsetHeight : 330) - 8;
    const sc = Math.max(0.76, Math.min(window.innerWidth / 1440, avail / 660, 1.3));
    stage.style.setProperty('--s', sc.toFixed(4));
    return sc;
  };
  const drawLines = () => {
    if (!svg || !figure) return;
    fit();
    const scaled = window.innerWidth >= 1100;
    const o = (scaled ? canvas : stage).getBoundingClientRect();
    const k = scaled ? o.width / 1440 : 1;
    const W = scaled ? 1440 : o.width, Hh = scaled ? 660 : o.height;
    const f = figure.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    let out = '';
    stage.querySelectorAll('.fcard').forEach((c) => {
      const r = c.getBoundingClientRect();
      const [fx, fy] = c.dataset.to.split(',').map(Number);
      const stacked = !scaled;
      const left = r.left + r.width / 2 < f.left + f.width / 2;
      const X = (v) => (v - o.left) / k, Y = (v) => (v - o.top) / k;
      const tx = X(f.left + f.width * fx), ty = Y(f.top + f.height * fy);
      let sx, sy, d;
      if (stacked) {
        sx = X(left ? r.left : r.right); sy = Y(r.top + r.height / 2);
        const out1 = left ? Math.max(sx - 30, 5) : Math.min(sx + 30, W - 5);
        d = `M${sx},${sy} C${out1},${sy + (ty - sy) * .25} ${left ? tx - 60 : tx + 60},${ty - 10} ${tx},${ty}`;
      } else {
        sx = X(left ? r.right : r.left); sy = Y(r.top + r.height / 2);
        d = `M${sx},${sy} C${sx + (tx - sx) * .75},${sy} ${tx},${sy + (ty - sy) * .25} ${tx},${ty}`;
      }
      out += `<path d="${d}"/><circle cx="${sx}" cy="${sy}" r="5.5"/><circle cx="${tx}" cy="${ty}" r="5.5"/>`;
    });
    svg.innerHTML = out;
    svg.querySelectorAll('path').forEach((p) => p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 2));
  };
  if (stage) {
    drawLines();
    window.addEventListener('resize', drawLines);
    window.addEventListener('load', drawLines);
    if ('ResizeObserver' in window) new ResizeObserver(drawLines).observe(stage);
  }

  // Doodle lightbox
  const lb = document.getElementById('lightbox');
  if (lb) {
    const lbImg = lb.querySelector('img');
    const close = () => { lb.hidden = true; lbImg.classList.remove('zoom'); document.body.style.overflow = ''; };
    document.querySelectorAll('.doodle-card.has-img').forEach((c) => c.addEventListener('click', (e) => {
      e.preventDefault();
      const im = c.querySelector('img');
      lbImg.src = im.src; lbImg.alt = im.alt; lb.hidden = false; document.body.style.overflow = 'hidden';
    }));
    lbImg.addEventListener('click', (e) => { e.stopPropagation(); lbImg.classList.toggle('zoom'); });
    lb.addEventListener('click', close);
    lb.querySelector('.lb-close').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) close(); });
  }
});
