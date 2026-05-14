/* ============================================================
   NexCore Landing Page — script.js
   Handles: hamburger menu, dark/light toggle, scroll reveal,
            header scroll style, contact form feedback
============================================================ */

// ── 1. DOM REFERENCES ─────────────────────────────────────────
const hamburger    = document.getElementById('hamburger');
const nav          = document.getElementById('nav');
const themeToggle  = document.getElementById('themeToggle');
const header       = document.getElementById('header');
const contactForm  = document.getElementById('contactForm');
const revealEls    = document.querySelectorAll('.reveal');


// ── 2. HAMBURGER MENU TOGGLE ──────────────────────────────────
hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  nav.classList.toggle('open', isOpen);
});

// Close nav when a link is clicked (mobile UX)
nav.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    nav.classList.remove('open');
  });
});


// ── 3. DARK / LIGHT MODE TOGGLE ───────────────────────────────
let isLight = false;

themeToggle.addEventListener('click', () => {
  isLight = !isLight;
  document.body.classList.toggle('light', isLight);
  themeToggle.textContent = isLight ? '🌙' : '☀';
});


// ── 4. SCROLL REVEAL (Intersection Observer) ──────────────────
// When an element with class .reveal enters the viewport, add .visible
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  },
  { threshold: 0.12 }
);

revealEls.forEach(el => observer.observe(el));


// ── 5. HEADER SCROLL STYLE ────────────────────────────────────
// Add a more opaque background when scrolled past 60px
window.addEventListener('scroll', () => {
  header.style.background = window.scrollY > 60
    ? 'rgba(8, 12, 16, 0.97)'
    : 'rgba(8, 12, 16, 0.82)';
});


// ── 6. CONTACT FORM — Simple submit feedback ──────────────────
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = '✓ Message Sent!';
    btn.style.background = '#00c48c';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
      btn.disabled = false;
      contactForm.reset();
    }, 3000);
  });
}
