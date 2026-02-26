// script.js – Full version with all features

window.addEventListener('DOMContentLoaded', () => {
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

  // ---------- Font Awesome (if not present) ----------
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    document.head.appendChild(fa);
  }

  // ---------- Theme setup ----------
  const theme = (() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  })();
  document.documentElement.setAttribute('data-theme', theme);

  // ---------- App container ----------
  let app = document.getElementById('app');
  if (!app) {
    app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
  }
  app.classList.add('container');

  // ---------- Hero slider ----------
  const hero = el('header', { class: 'hero-header' });
  const slider = el('div', { class: 'slider' });
  hero.appendChild(slider);

  const images = [
    'https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1600&auto=format&fit=crop'
  ];
  let currentIndex = 0;
  images.forEach((src, i) => {
    const img = el('img', { attrs: { src }, class: i === 0 ? 'active' : '' });
    img.dataset.index = i;
    slider.appendChild(img);
  });

  const overlay = el('div', { class: 'hero-overlay' }, [
    el('h1', { text: 'Welcome to the Official Site Of Godbuild Imoh Michael' }),
    el('p', { text: 'Official website — updates, projects and contact' })
  ]);
  hero.appendChild(overlay);

  const btnPrev = el('button', { class: 'slider-btn btn-prev', attrs: { 'aria-label': 'Previous image' }, html: '&#8249;' });
  const btnNext = el('button', { class: 'slider-btn btn-next', attrs: { 'aria-label': 'Next image' }, html: '&#8250;' });
  hero.appendChild(btnPrev);
  hero.appendChild(btnNext);
  app.appendChild(hero);

  // ---------- Sticky main header with privacy & theme buttons ----------
  const mainHeader = el('div', { class: 'main-header' }, [
    el('div', { class: 'container header-content' }, [
      el('strong', { text: 'Godbuild Imoh Michael' }),
      el('div', { class: 'header-buttons' }, [
        el('button', {
          class: 'privacy-btn',
          attrs: { 'aria-label': 'Privacy Policy', title: 'Privacy Policy' }
        }, el('i', { class: 'fas fa-shield-alt' })),
        el('button', {
          class: 'theme-toggle',
          attrs: { 'aria-label': 'Toggle theme', title: 'Toggle light/dark mode' }
        }, [
          el('i', { class: `fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}` })
        ])
      ])
    ])
  ]);
  document.body.appendChild(mainHeader);

  // ---------- Privacy Policy Modal ----------
  const modalOverlay = el('div', { class: 'modal-overlay hidden' });
  const modalContent = el('div', { class: 'modal-content' }, [
    el('h2', { text: 'Privacy Policy' }),
    el('div', { class: 'privacy-text' }, [
      el('p', { text: 'This website does not collect any personal data unless explicitly provided by you (e.g., via contact forms). We use cookies only for essential functionality. Your data is never sold or shared with third parties. For questions, contact michaelgodbuild@yahoo.com.' })
    ]),
    el('label', { class: 'consent-label' }, [
      el('input', { type: 'checkbox', id: 'consent-checkbox' }),
      el('span', { text: ' I consent to the privacy policy.' })
    ]),
    el('button', { class: 'close-modal', text: 'Close' })
  ]);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // ---------- Main content ----------
  const main = el('main', { class: 'container' });

  // ----- About Me with Read More -----
  const factsSection = el('section', { class: 'section facts', attrs: { id: 'about' } });
  const fullAboutText = `
<p>The Story of Godbuild Imoh Michael, simply called Godbuild, was born on Monday January 3, 2011, to the family of Mr. & Mrs. Imoh Michael of Otoro Abak & Oruk Anam respectively, both in Abak L.G.A, Akwa Ibom State, at the University of Uyo Teaching Hospital (UUTH), Uyo. He resides in Eket from birth. He is the firstborn son and is followed by a sister (born 2012), a brother (born 2015), and another sister (born 2020).</p>
<p>A worshipper at The Redeemed Christian Church of God. He attended nursery/primary at Christ Redeemers Academy, Eket (2014–2017) where he left at Primary 2, having skipped Nursery 1 due to his intelligence. He continued at Christian Discipleship Academy, Eket (2017–2020). The COVID-19 pandemic interrupted his Primary 5 education. He then attended secondary school at Faith Academy, Eket (2020 till date). He wrote his First School Leaving Certificate in 2021 and is currently in SS3, the final class.</p>
<p>Godbuild is a dynamic person, a believer in Christ. He has published an article titled "Born to be Great", a songwriter, a creative mind, a thinking, thoughtful, and problem‑solving person. His favourite sport is football. He is an active learner of computer science with aspirations to become a software developer, and he is currently an amateur web designer.</p>
<p class="date">— Updated Wednesday February 4, 2026</p>
`;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = fullAboutText;
  const paragraphs = Array.from(tempDiv.children);

  const firstP = paragraphs[0].outerHTML;
  const secondPText = paragraphs[1].textContent;
  let splitIndex = 250;
  while (splitIndex < secondPText.length && secondPText[splitIndex] !== ' ') splitIndex++;
  if (splitIndex >= secondPText.length) splitIndex = secondPText.length;
  const secondPVisible = secondPText.substring(0, splitIndex);
  const secondPHidden = secondPText.substring(splitIndex);
  const remainingHTML = paragraphs.slice(2).map(p => p.outerHTML).join('');

  const aboutDiv = el('div', { class: 'about-text' });
  const visibleSpan = el('span', { class: 'visible-part' });
  visibleSpan.innerHTML = firstP + `<p>${secondPVisible}</p>`;
  const ellipsisSpan = el('span', { class: 'ellipsis', html: '… ' });
  const hiddenSpan = el('span', { class: 'read-more-content hidden' });
  hiddenSpan.innerHTML = `<p>${secondPHidden}</p>${remainingHTML}`;
  const readMoreBtn = el('button', { class: 'read-more-btn', text: 'Continue Reading' });

  aboutDiv.appendChild(visibleSpan);
  aboutDiv.appendChild(ellipsisSpan);
  aboutDiv.appendChild(hiddenSpan);
  aboutDiv.appendChild(readMoreBtn);

  factsSection.innerHTML = '<h2>About Me</h2>';
  factsSection.appendChild(aboutDiv);

  readMoreBtn.addEventListener('click', () => {
    const isHidden = hiddenSpan.classList.contains('hidden');
    if (isHidden) {
      hiddenSpan.classList.remove('hidden');
      ellipsisSpan.classList.add('hidden');
      readMoreBtn.textContent = 'Show Less';
    } else {
      hiddenSpan.classList.add('hidden');
      ellipsisSpan.classList.remove('hidden');
      readMoreBtn.textContent = 'Continue Reading';
    }
  });

  main.appendChild(factsSection);

  // ----- Contact & Socials with custom images + fallback icons -----
  const contactSection = el('section', { class: 'section', attrs: { id: 'contact' } });
  contactSection.innerHTML = `<h2>Contact</h2>
    <div class="contact-grid">
      <div class="contact-card">
        <h3><u>Phone</u></h3>
        <p><a href="sms:+2348015617311">GODBUILD-IMOH-MICHAEL</a></p>
      </div>
      <div class="contact-card">
        <h3><u>Email</u></h3>
        <p><a href="mailto:michaelgodbuild@gmail.com">Gmail</a><br><a href="mailto:michaelgodbuild@yahoo.com">Yahoo Mail</a></p>
      </div>
      <div class="contact-card">
        <h3><u>Socials</u></h3>
        <div class="social-grid" id="social-grid"></div>
      </div>
    </div>`;
  main.appendChild(contactSection);

  const socialGrid = document.getElementById('social-grid');
  if (socialGrid) {
    const socials = [
      { 
        name: 'Instagram', 
        url: 'https://www.instagram.com/godbuildmichael?igsh=MTcwaWlidHRheWxkcA==', 
        img: '/icons/instagram.png',
        fallbackIcon: 'fa-brands fa-instagram'
      },
      { 
        name: 'Threads', 
        url: 'https://www.threads.com/@godbuildmichael', 
        img: '/icons/threads.png',
        fallbackIcon: 'fa-brands fa-threads'
      },
      { 
        name: 'X', 
        url: 'https://x.com/godbuildmichael', 
        img: '/icons/x.png',
        fallbackIcon: 'fa-brands fa-x-twitter'
      },
      { 
        name: 'Blogs', 
        url: 'https://rondukeup.blogspot.com/', 
        img: '/icons/blog.png',
        fallbackIcon: 'fa-solid fa-blog'
      }
    ];

    socials.forEach(s => {
      const item = el('a', { href: s.url, target: '_blank', class: 'social-item' });

      const img = el('img', { 
        class: 'social-icon',
        attrs: { src: s.img, alt: s.name, loading: 'lazy' }
      });

      const fallback = el('i', { 
        class: `${s.fallbackIcon} fallback-icon`,
        attrs: { 'aria-hidden': 'true' }
      });

      img.onerror = function() {
        this.style.display = 'none';
        fallback.style.display = 'inline-block';
      };

      item.appendChild(img);
      item.appendChild(fallback);
      item.appendChild(el('span', { text: s.name }));
      socialGrid.appendChild(item);
    });
  }

  app.appendChild(main);

  // ---------- Footer ----------
  const footer = el('footer', { class: 'site-footer' });
  footer.innerHTML = `<div class="container"><small>Copyright &copy; ${new Date().getFullYear()}. Godbuild Michael</small></div>`;
  document.body.appendChild(footer);

  // ---------- Toast container ----------
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

  setTimeout(() => showToast('👋 Welcome to Godbuild Imoh Michael\'s official site!'), 500);

  // ---------- Notification bell button ----------
  const notifButton = el('button', { class: 'notif-button', attrs: { 'aria-label': 'Notifications', title: 'Click to allow notifications' } }, [
    el('i', { class: 'fas fa-bell' }),
    el('span', { class: 'notif-status', text: 'Off' })
  ]);
  document.body.appendChild(notifButton);

  async function updateNotificationStatus() {
    const statusSpan = notifButton.querySelector('.notif-status');
    if (!statusSpan) return;
    if (!('Notification' in window)) {
      statusSpan.textContent = 'Unsupported';
      return;
    }
    const permission = Notification.permission;
    if (permission === 'granted') {
      statusSpan.textContent = 'On';
      notifButton.classList.add('granted');
    } else {
      statusSpan.textContent = 'Off';
      notifButton.classList.remove('granted');
    }
  }

  notifButton.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      showToast('Notifications not supported.');
      return;
    }
    if (Notification.permission === 'granted') {
      showToast('Notifications already enabled.');
      return;
    }
    const permission = await Notification.requestPermission();
    updateNotificationStatus();
    showToast(permission === 'granted' ? '✅ Notifications enabled!' : '❌ Notification permission denied.');
  });
  updateNotificationStatus();

  // ---------- Slider logic ----------
  const imgElements = Array.from(slider.querySelectorAll('img'));
  function goto(index, animate = true) {
    index = (index + images.length) % images.length;
    if (index === currentIndex) return;
    if (animate && slider && imgElements.length) {
      slider.classList.add('flip-out');
      setTimeout(() => {
        if (imgElements[currentIndex]) imgElements[currentIndex].classList.remove('active');
        if (imgElements[index]) imgElements[index].classList.add('next-show');
        currentIndex = index;
        slider.classList.remove('flip-out');
        slider.classList.add('flip-in');
        setTimeout(() => {
          imgElements.forEach(img => img.classList.remove('next-show'));
          if (imgElements[currentIndex]) imgElements[currentIndex].classList.add('active');
          slider.classList.remove('flip-in');
        }, 500);
      }, 240);
    } else {
      if (imgElements[currentIndex]) imgElements[currentIndex].classList.remove('active');
      currentIndex = index;
      if (imgElements[currentIndex]) imgElements[currentIndex].classList.add('active');
    }
    resetAuto();
  }

  btnPrev.addEventListener('click', () => goto(currentIndex - 1));
  btnNext.addEventListener('click', () => goto(currentIndex + 1));

  let autoTimer = null;
  const AUTO_INTERVAL = 15000;
  function nextSlide() { goto(currentIndex + 1); }
  function resetAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(nextSlide, AUTO_INTERVAL);
  }
  resetAuto();
  hero.addEventListener('mouseenter', () => { if (autoTimer) clearInterval(autoTimer); });
  hero.addEventListener('mouseleave', () => { resetAuto(); });

  // ---------- Scroll handler for sticky header ----------
  function checkScroll() {
    const heroHeight = hero.getBoundingClientRect().height;
    mainHeader.classList.toggle('visible', window.scrollY > heroHeight - 80);
  }
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();

  // ---------- Modal functionality ----------
  const privacyBtn = document.querySelector('.privacy-btn');
  const closeModalBtn = document.querySelector('.close-modal');
  const consentCheckbox = document.getElementById('consent-checkbox');

  function openModal() {
    modalOverlay.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  privacyBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ---------- Theme toggle ----------
  const themeToggle = document.querySelector('.theme-toggle');
  const themeIcon = themeToggle.querySelector('i');

  function setTheme(newTheme) {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });

  // ---------- SSE (optional) ----------
  let eventSource;
  function connectEvents() {
    if (!('EventSource' in window)) return;
    if (eventSource) eventSource.close();
    eventSource = new EventSource('/events');
    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        const text = payload.body || payload.message || 'New update';
        showToast(text, 6000);
        if (Notification.permission === 'granted') {
          new Notification(payload.title || 'Update from Godbuild', {
            body: text,
            icon: payload.icon || '',
            data: payload.url || ''
          }).onclick = function() { if (payload.url) window.open(payload.url, '_blank'); this.close(); };
        }
      } catch (err) { console.error('Bad event data', err); }
    };
  }
  connectEvents();

  // Expose helpers
  window.GodbuildSite = {
    requestNotificationPermission: async () => {
      if (!('Notification' in window)) return { granted: false };
      const status = await Notification.requestPermission();
      return { granted: status === 'granted', status };
    },
    connectEvents,
    goto,
    nextSlide,
    showToast,
    setTheme,
    openModal,
    closeModal
  };
});
