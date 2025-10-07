const floatingNav = document.querySelector('.floating-nav');
const cursorGlow = document.querySelector('.cursor-glow');
const animateEls = document.querySelectorAll('[data-animate]');
const notificationStack = document.getElementById('notificationStack');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const menuClose = document.querySelector('.menu-close');
const faqItems = document.querySelectorAll('.faq-item');
const primaryButtons = document.querySelectorAll('.ripple');
const waveCanvas = document.getElementById('waveCanvas');
const scrollProgressBar = document.querySelector('.scroll-progress-bar');
const parallaxLayers = document.querySelectorAll('[data-parallax]');
const heroSection = document.querySelector('.hero');
const floatCards = document.querySelectorAll('.float-card');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointerState = { x: 0.5, y: 0.5 };

let lastScroll = window.scrollY;
let navVisible = false;
let parallaxScheduled = false;
let waveCtx;
let waveAnimationFrame;

function updateNavVisibility() {
  const currentScroll = window.scrollY;
  if (currentScroll < 40) {
    floatingNav.classList.remove('visible');
    navVisible = false;
  } else if (currentScroll < lastScroll - 6) {
    floatingNav.classList.add('visible');
    navVisible = true;
  } else if (currentScroll > lastScroll && navVisible) {
    floatingNav.classList.remove('visible');
    navVisible = false;
  }
  lastScroll = currentScroll;
}

function updateScrollProgress() {
  if (!scrollProgressBar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll <= 0 ? 0 : (window.scrollY / maxScroll) * 100;
  scrollProgressBar.style.height = `${Math.max(0, Math.min(100, progress))}%`;
}

function updateParallax() {
  parallaxLayers.forEach(layer => {
    const depth = parseFloat(layer.dataset.parallax || '0');
    const rect = layer.getBoundingClientRect();
    const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * depth;
    layer.style.setProperty('--parallax-offset', `${offset}px`);
  });
}

function requestParallaxUpdate() {
  if (parallaxScheduled) return;
  parallaxScheduled = true;
  requestAnimationFrame(() => {
    updateParallax();
    parallaxScheduled = false;
  });
}

function handleScroll() {
  updateNavVisibility();
  updateScrollProgress();
  if (!prefersReducedMotion) {
    requestParallaxUpdate();
  }
}

window.addEventListener('scroll', handleScroll, { passive: true });

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

animateEls.forEach(el => observer.observe(el));

const notifMessages = [
  '💵 Pagamento recebido: +$237.80 via SecretWave',
  '💵 Depósito confirmado: +$102.50',
  '💵 Transferência completada: +$64.30',
  '💵 Você recebeu +$198.00',
  '💵 Pagamento aprovado: +$154.10',
  '💵 Seu saldo aumentou: +$289.60'
];

let notifIndex = 0;
let audioContext;

function playChime() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  const ctx = audioContext;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.45);
}

function spawnNotification() {
  const message = notifMessages[notifIndex % notifMessages.length];
  notifIndex += 1;

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <span class="notification-logo">
      <span class="wave-icon" aria-hidden="true"></span>
    </span>
    <span class="notification-text">${message}</span>
  `;

  const randomDelay = 3500 + Math.random() * 1500;
  const randomTop = Math.random() * 40 + 20; // between 20% and 60%
  notification.style.position = 'absolute';
  notification.style.left = `${Math.random() * 12 + 4}%`;
  notification.style.top = `${randomTop}%`;

  notificationStack.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('exit');
    setTimeout(() => notification.remove(), 900);
  }, randomDelay);

  requestAnimationFrame(() => {
    playChime();
  });

  setTimeout(spawnNotification, randomDelay * 0.8 + Math.random() * 1200);
}

setTimeout(spawnNotification, 1500);

function resizeWaveCanvas() {
  if (!waveCanvas || !waveCtx) return;
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  waveCanvas.width = width * ratio;
  waveCanvas.height = height * ratio;
  waveCanvas.style.width = `${width}px`;
  waveCanvas.style.height = `${height}px`;
  waveCtx.setTransform(1, 0, 0, 1, 0, 0);
  waveCtx.scale(ratio, ratio);
}

function renderWaveFrame(time) {
  if (!waveCanvas || !waveCtx) return;
  const width = waveCanvas.clientWidth;
  const height = waveCanvas.clientHeight;
  const t = time * 0.001;

  waveCtx.clearRect(0, 0, width, height);
  waveCtx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < 3; i += 1) {
    const progress = (i + 1) / 3;
    const amplitude = 24 + i * 10 + pointerState.y * 28;
    const frequency = 0.0032 + i * 0.0011;
    const speed = 0.8 + i * 0.45;
    const verticalShift = height * (0.35 + progress * 0.2 + pointerState.y * 0.05);
    const gradient = waveCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, `rgba(255, 102, 0, ${0.05 + progress * 0.06})`);
    gradient.addColorStop(1, `rgba(252, 163, 17, ${0.04 + pointerState.x * 0.1})`);

    waveCtx.beginPath();
    waveCtx.moveTo(0, height);
    for (let x = 0; x <= width; x += 16) {
      const angle = x * frequency + t * (speed + pointerState.x * 0.6) + progress * 1.6;
      const y = Math.sin(angle) * amplitude + verticalShift;
      waveCtx.lineTo(x, y);
    }
    waveCtx.lineTo(width, height);
    waveCtx.closePath();
    waveCtx.fillStyle = gradient;
    waveCtx.fill();
  }

  waveCtx.globalCompositeOperation = 'source-over';
  waveAnimationFrame = requestAnimationFrame(renderWaveFrame);
}

function initWaveCanvas() {
  if (!waveCanvas || prefersReducedMotion) return;
  waveCtx = waveCanvas.getContext('2d');
  resizeWaveCanvas();
  if (waveAnimationFrame) {
    cancelAnimationFrame(waveAnimationFrame);
  }
  waveAnimationFrame = requestAnimationFrame(renderWaveFrame);
}

window.addEventListener('pointerdown', () => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
});

window.addEventListener('pointermove', event => {
  pointerState.x = event.clientX / window.innerWidth;
  pointerState.y = event.clientY / window.innerHeight;
  if (cursorGlow) {
    cursorGlow.style.opacity = 1;
    cursorGlow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  }
});

window.addEventListener('pointerleave', () => {
  pointerState.x = 0.5;
  pointerState.y = 0.5;
  if (cursorGlow) {
    cursorGlow.style.opacity = 0;
  }
});

function updateHeroFloatMotion(clientX, clientY) {
  if (!heroSection || !floatCards.length || prefersReducedMotion) return;
  const rect = heroSection.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const relativeX = (clientX - rect.left) / rect.width - 0.5;
  const relativeY = (clientY - rect.top) / rect.height - 0.5;

  floatCards.forEach(card => {
    const wrapper = card.closest('.float-item');
    const depth = parseFloat(wrapper?.dataset.floatDepth || '0.25');
    card.style.setProperty('--float-x', `${relativeX * depth * 90}px`);
    card.style.setProperty('--float-y', `${relativeY * depth * 60}px`);
  });
}

function resetHeroFloatMotion() {
  floatCards.forEach(card => {
    card.style.setProperty('--float-x', '0px');
    card.style.setProperty('--float-y', '0px');
  });
}

if (heroSection && floatCards.length) {
  heroSection.addEventListener('pointermove', event => {
    updateHeroFloatMotion(event.clientX, event.clientY);
  });
  heroSection.addEventListener('pointerleave', resetHeroFloatMotion);
}

function toggleMobileMenu(open) {
  if (open) {
    mobileMenu.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
  } else {
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }
}

menuToggle?.addEventListener('click', () => toggleMobileMenu(true));
menuClose?.addEventListener('click', () => toggleMobileMenu(false));
mobileMenu?.querySelectorAll('a').forEach(link =>
  link.addEventListener('click', () => toggleMobileMenu(false))
);

faqItems.forEach(item => {
  const button = item.querySelector('.faq-question');
  button.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    faqItems.forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

primaryButtons.forEach(btn => {
  btn.addEventListener('click', event => {
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

let autoScrollId;

function startCarousel() {
  const track = document.querySelector('.carousel-track');
  if (!track) return;
  autoScrollId = setInterval(() => {
    track.scrollBy({ left: 260, behavior: 'smooth' });
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
      setTimeout(() => track.scrollTo({ left: 0, behavior: 'smooth' }), 1200);
    }
  }, 2800);
}

function stopCarousel() {
  clearInterval(autoScrollId);
}

const carouselTrack = document.querySelector('.carousel-track');
carouselTrack?.addEventListener('mouseenter', stopCarousel);
carouselTrack?.addEventListener('mouseleave', startCarousel);
window.addEventListener('load', () => {
  handleScroll();
  if (prefersReducedMotion) {
    waveCanvas?.classList.add('motion-disabled');
  } else {
    initWaveCanvas();
    requestParallaxUpdate();
  }
  startCarousel();
});

window.addEventListener('resize', () => {
  handleScroll();
  if (window.innerWidth >= 960) {
    toggleMobileMenu(false);
  }
  if (!prefersReducedMotion) {
    resizeWaveCanvas();
    requestParallaxUpdate();
  }
});

const magneticElements = document.querySelectorAll('.magnetic');

if (!prefersReducedMotion) {
  magneticElements.forEach(element => {
    const strength = parseFloat(element.dataset.magneticStrength || '0.2');
    const maxDistance = parseFloat(element.dataset.magneticLimit || '18');

    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      const offsetX = event.clientX - rect.left - rect.width / 2;
      const offsetY = event.clientY - rect.top - rect.height / 2;
      const translateX = Math.max(-maxDistance, Math.min(maxDistance, offsetX * strength));
      const translateY = Math.max(-maxDistance, Math.min(maxDistance, offsetY * strength));

      element.style.setProperty('--magnet-x', `${translateX}px`);
      element.style.setProperty('--magnet-y', `${translateY}px`);
      element.classList.add('magnet-active');
    });

    element.addEventListener('pointerleave', () => {
      element.style.setProperty('--magnet-x', '0px');
      element.style.setProperty('--magnet-y', '0px');
      element.classList.remove('magnet-active');
    });
  });
}
