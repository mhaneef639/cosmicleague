/* ============================================================
   COSMIC LEAGUE — Frontend Script
   ============================================================

   BEFORE GOING LIVE:
   Replace SCRIPT_URL below with the Web App URL you get after
   deploying apps-script-backend.gs in Google Apps Script.
   See apps-script-backend.gs for step-by-step instructions.
   ============================================================ */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4vZGeaxisA6RqkjXRL243CqRsHMUziuAhMLwTqYbUWstLYxepoh3hjM1gNLOtcYkg4A/exec';

/* ── Navigation ─────────────────────────────────────────────── */

const nav = document.getElementById('nav');
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

mobileToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  mobileToggle.classList.toggle('open', isOpen);
  mobileToggle.setAttribute('aria-expanded', isOpen);
});

document.querySelectorAll('.nav-mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    mobileToggle.classList.remove('open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ── Smooth scroll ──────────────────────────────────────────── */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth'
    });
  });
});

/* ── Scroll reveal ──────────────────────────────────────────── */

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    // stagger siblings (service cards, audience cards, process steps)
    const siblings = Array.from(
      entry.target.parentElement.querySelectorAll('.reveal:not(.revealed)')
    );
    const delay = siblings.indexOf(entry.target) * 80;
    setTimeout(() => {
      entry.target.classList.add('revealed');
    }, delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Form ───────────────────────────────────────────────────── */

const form       = document.getElementById('applyForm');
const formSucess = document.getElementById('formSuccess');
const submitBtn  = document.getElementById('submitBtn');

const FIELDS = [
  { id: 'fullName',   msg: 'Please enter your full name.'            },
  { id: 'profession', msg: 'Please describe what you do.'            },
  { id: 'email',      msg: 'Please enter a valid email address.',  type: 'email' },
  { id: 'reason',     msg: 'Please tell us why you are seeking coaching.' },
];

// Live clear on input
FIELDS.forEach(({ id }) => {
  document.getElementById(id).addEventListener('input', function () {
    this.classList.remove('invalid');
    document.getElementById(id + 'Error').textContent = '';
  });
});

function validate() {
  let ok = true;
  FIELDS.forEach(({ id, msg, type }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(id + 'Error');
    const val = el.value.trim();
    const invalid =
      !val ||
      (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
    if (invalid) {
      el.classList.add('invalid');
      err.textContent = msg;
      ok = false;
    }
  });
  return ok;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const btnText    = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  submitBtn.disabled       = true;
  btnText.style.display    = 'none';
  btnSpinner.style.display = 'block';

  const payload = {
    fullName:   document.getElementById('fullName').value.trim(),
    profession: document.getElementById('profession').value.trim(),
    email:      document.getElementById('email').value.trim(),
    reason:     document.getElementById('reason').value.trim(),
  };

  try {
    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      // Demo mode — simulate network delay when URL not yet configured
      await new Promise(r => setTimeout(r, 900));
    } else {
      // Google Apps Script requires no-cors; success is assumed on network ok
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    form.style.display          = 'none';
    formSucess.style.display    = 'block';
    formSucess.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch {
    submitBtn.disabled       = false;
    btnText.style.display    = 'inline';
    btnSpinner.style.display = 'none';

    if (!form.querySelector('.submit-err')) {
      const el = document.createElement('p');
      el.className   = 'submit-err field-error';
      el.style.textAlign = 'center';
      el.textContent = 'Something went wrong. Please try again or contact us directly.';
      form.querySelector('.form-submit-row').insertAdjacentElement('afterend', el);
    }
  }
});
