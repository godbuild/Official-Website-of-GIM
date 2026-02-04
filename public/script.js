// script.js
// Creates the entire page DOM, slider with auto-advance and page-flip effect,
// SSE client for live update notifications and Notification permission helper.

const app = document.getElementById('app') || document.body.appendChild(document.createElement('div'));
app.classList.add('container');

// ---------- Helper: create elements ----------
const el = (tag, opts = {}, children = []) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(opts)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'attrs') {
      Object.entries(v).forEach(([a, val]) => e.setAttribute(a, val));
    } else e[k] = v;
  }
  (Array.isArray(children) ? children : [children]).forEach(c => { if (c) e.appendChild(c); });
  return e;
};

// ---------- Header / Hero with slider ----------
const hero = el('header', { class: 'hero-header' });

// Slider container (absolute)
const slider = el('div', { class: 'slider' });
hero.appendChild(slider);

// Replace/extend this array with your own image URLs. Use at least two images.
const images = [
  // sample free image urls
  'https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=8f2b1f2f9b8d5f9d7a02c9a9f7a7f0f4',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=61f5a6cae4b4d7b00f5f735a7d8b3a06',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=7c9b3f23a8b04d4f85f0b8a1bb1d2f2b'
];

let currentIndex = 0;
images.forEach((src, i) => {
  const img = el('img', { attrs: { src }, class: i === 0 ? 'active' : '' });
  img.dataset.index = i;
  slider.appendChild(img);
});

// Overlay (logo + greeting)
const overlay = el('div', { class: 'hero-overlay' });
const logo = el('div', { class: 'logo-placeholder', text: 'LOGO' });
const title = el('h1', { text: 'Welcome to the Official Site Of Godbuild Imoh Michael' });
const subtitle = el('p', { text: 'Official website — updates, projects and contact' });
overlay.appendChild(logo);
overlay.appendChild(title);
overlay.appendChild(subtitle);
hero.appendChild(overlay);

// slider buttons
const btnPrev = el('button', { class: 'slider-btn btn-prev', attrs: { 'aria-label': 'Previous image' }, html: '&#8249;' });
const btnNext = el('button', { class: 'slider-btn btn-next', attrs: { 'aria-label': 'Next image' }, html: '&#8250;' });
hero.appendChild(btnPrev);
hero.appendChild(btnNext);

app.appendChild(hero);

// ---------- Sticky main header (appears on scroll) ----------
const mainHeader = el('div', { class: 'main-header' }, el('div', { class: 'container', html: '<strong>Godbuild Imoh Michael</strong>' }));
document.body.appendChild(mainHeader);

// ---------- Main content: facts and contact ----------
const main = el('main', { class: 'container' });
const factsSection = el('section', { class: 'section facts', attrs: { id: 'facts' } });
factsSection.innerHTML = `<h2>Facts about me</h2>
main.appendChild(factsSection);

const contactSection = el('section', { class: 'section', attrs: { id: 'contact' } });
contactSection.innerHTML = `<h2>Contact</h2>
  <div class="contact-grid">
    <div class="contact-card">
      <h3><u>Phone</u></h3>
      <p><a href="sms:+2348015617311">GODBUILD-IMOH-MICHAEL</a></p>
    </div>
    <div class="contact-card">
      <h3><u>Email</u></h3>
      <p><a href="mailto:michaelgodbuild@gmail.com">michaelgodbuild@<br>gmail.com</a><br><a href="mailto:michaelgodbuild@yahoo.com">michaelgodbuild@<br>yahoo.com</a></p>
    </div>
    <div class="contact-card">
      <h3><u>Socials</u></h3>
      <ul id="social-links">
        <li><a href="https://www.instagram.com/godbuildmichael?igsh=MTcwaWlidHRheWxkcA=="target="blank">Instagram</a></li>
        <li><a href="https://www.threads.com/@godbuildmichael" target="blank">Threads</a></li>
        <li><a href="https://x.com/godbuildmichael" target="blank">X</a></li>
		    <li><a href="https://rondukeup.blogspot.com/" target="blank">My Blogs</a></li>
      </ul>
    </div>
  </div>`;
main.appendChild(contactSection);

app.appendChild(main);

// ---------- Footer ----------
const footer = el('footer', { class: 'site-footer' });
footer.innerHTML = `<div class="container"><small>Copyright &copy; ${new Date().getFullYear()}. Godbuild Michael</small></div>`;
document.body.appendChild(footer);

// toast container for in-page messages
const toast = el('div', { class: 'toast hidden', text: '' });
document.body.appendChild(toast);

function showToast(message, timeout = 5000) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, timeout);
}

// ---------- Slider logic: manual + auto + flip animation ----------
let autoTimer = null;
const AUTO_INTERVAL = 15000; // 15 seconds

const imgElements = Array.from(slider.querySelectorAll('img'));

function goto(index, animate = true) {
  index = (index + images.length) % images.length;
  if (index === currentIndex) return;
  // Flip effect: add flip-out, then swap classes, then flip-in
  if (animate) {
    slider.classList.add('flip-out');
    // wait for a short part of the flip, then switch
    setTimeout(() => {
      // remove active from previous
      imgElements[currentIndex].classList.remove('active');
      // mark next with next-show for flip-in
      imgElements[index].classList.add('next-show');
      currentIndex = index;
      slider.classList.remove('flip-out');
      // trigger flip-in
      slider.classList.add('flip-in');
      // after flip-in duration, clean up
      setTimeout(() => {
        imgElements.forEach(img => img.classList.remove('next-show'));
        imgElements[currentIndex].classList.add('active');
        slider.classList.remove('flip-in');
      }, 500); // should match CSS transition timing
    }, 240); // small gap for flip-out
  } else {
    imgElements[currentIndex].classList.remove('active');
    currentIndex = index;
    imgElements[currentIndex].classList.add('active');
  }
  resetAuto();
}

btnPrev.addEventListener('click', () => goto(currentIndex - 1));
btnNext.addEventListener('click', () => goto(currentIndex + 1));

function nextSlide() { goto(currentIndex + 1); }
function resetAuto() {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = setInterval(nextSlide, AUTO_INTERVAL);
}
resetAuto();

// pause on hover
hero.addEventListener('mouseenter', () => { if (autoTimer) clearInterval(autoTimer); });
hero.addEventListener('mouseleave', () => { resetAuto(); });

// ---------- Show sticky header on scroll ----------
function checkScroll() {
  const heroHeight = hero.getBoundingClientRect().height;
  if (window.scrollY > heroHeight - 80) mainHeader.classList.add('visible');
  else mainHeader.classList.remove('visible');
}
window.addEventListener('scroll', checkScroll, { passive: true });
checkScroll();

// ---------- Notifications & SSE updates ----------
// Call requestNotificationPermission() to ask user to allow notifications.
// The server below provides an SSE endpoint at /events to send live updates.
// When a message arrives we show an in-page toast and (if permission) a Notification.

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return { granted: false, reason: 'Notifications not supported' };
  const status = await Notification.requestPermission();
  return { granted: status === 'granted', status };
}

// Connect to server-sent events
let eventSource;
function connectEvents() {
  if (!('EventSource' in window)) {
    console.warn('EventSource not supported in this browser.');
    return;
  }
  if (eventSource) eventSource.close();

  eventSource = new EventSource('/events');
  eventSource.onopen = () => {
    console.info('Connected to updates stream.');
  };
  eventSource.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data);
      const text = payload.body || payload.message || 'New update';
      showToast(text, 6000);
      // show Notification if allowed
      if (Notification.permission === 'granted') {
        const n = new Notification(payload.title || 'Update from Godbuild', {
          body: text,
          icon: payload.icon || '',
          data: payload.url || ''
        });
        n.onclick = () => { if (payload.url) window.open(payload.url, '_blank'); n.close(); };
      }
    } catch (err) {
      console.error('Bad event data', err);
    }
  };
  eventSource.onerror = (err) => {
    console.warn('EventSource error', err);
    // auto-reconnect (EventSource does this by default) but we can attempt to re-create if it's closed:
    // keep minimal; browser will retry.
  };
}
connectEvents();

// Expose some helpers for admin/testing in the console:
window.GodbuildSite = {
  requestNotificationPermission,
  connectEvents,
  goto,
  nextSlide,
  showToast
};

// Note: For notifications to appear while the page is closed you would need Push API + Service Worker (not implemented here).
// This SSE + Notification approach will notify users while they have the site open (or in background tab).
