// Súbor: src/scripts/script.js
// Čistý klientsky skript bez zbytočného routera: plynulý posun (Lenis), zdržanlivé odhaľovanie
// fotografií, kurátorské filtrovanie galérie, prístupný Lightbox aj mobilné menu a živé hodiny.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/* ------------------------------------------------------------------
   Plynulé skrolovanie (Lenis) – len na počítači s myšou alebo touchpadom.
------------------------------------------------------------------ */
let lenis = null;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initSmoothScroll() {
    if (lenis) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer || prefersReducedMotion()) return;
    lenis = new Lenis({
        lerp: 0.082,
        autoRaf: true,
        prevent: (node) => Boolean(node.closest && node.closest('#lightbox, #site-nav')),
    });
}

function lockScroll(locked) {
    document.body.classList.toggle('no-scroll', locked);
    if (lenis) {
        if (locked) lenis.stop();
        else lenis.start();
    }
}

function scrollToTarget(target) {
    const isNumber = typeof target === 'number';
    if (lenis) {
        lenis.scrollTo(target, { duration: 1.35 });
        return;
    }
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (isNumber) window.scrollTo({ top: target, behavior });
    else target.scrollIntoView({ behavior });
}

document.addEventListener('click', (e) => {
    if (!lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const link = e.target.closest && e.target.closest('a[href*="#"]');
    if (!link || link.target === '_blank') return;
    const url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const section = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!section) return;
    e.preventDefault();
    if (document.body.classList.contains('no-scroll')) lockScroll(false);
    scrollToTarget(section);
    history.replaceState(history.state, '', url.hash);
});

/* ------------------------------------------------------------------
   Odhaľovanie fotografií pri vstupe do zorného poľa ([data-reveal="image"])
------------------------------------------------------------------ */
function revealElement(el, delayMs = 0) {
    if (delayMs > 0) el.style.setProperty('--reveal-delay', `${delayMs}ms`);
    el.classList.add('is-revealed');
    setTimeout(() => {
        el.classList.add('reveal-done');
        el.style.removeProperty('--reveal-delay');
    }, delayMs + 1350);
}

function initReveal() {
    window.__revealInit = true;
    if (!document.documentElement.classList.contains('reveal-ready')) return;

    const pending = new Set(document.querySelectorAll('[data-reveal]:not(.is-revealed)'));
    if (!pending.size) return;

    let ticking = false;
    const check = () => {
        ticking = false;
        const vh = window.innerHeight;
        let visibleInFrame = 0;
        pending.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return;
            if (rect.top < vh * 0.96 && rect.bottom > 0) {
                pending.delete(el);
                const stagger = el.classList.contains('gallery-item') ? (visibleInFrame++ % 4) * 65 : 0;
                revealElement(el, stagger);
            }
        });
        if (!pending.size) {
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        }
    };

    const schedule = () => {
        if (ticking || !pending.size) return;
        ticking = true;
        requestAnimationFrame(check);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    check();
}

/* ------------------------------------------------------------------
   Paralax na fotografiách (počítač cez Lenis)
------------------------------------------------------------------ */
function initParallax() {
    if (!lenis) return;
    const items = Array.from(document.querySelectorAll('[data-parallax]')).map((el) => {
        const layer = el.hasAttribute('data-parallax-layer');
        return {
            el,
            layer,
            speed: Number(el.dataset.parallax) || 0,
            anchor: layer ? el.parentElement : el,
            imgs: layer || el.tagName === 'IMG' ? [el] : Array.from(el.querySelectorAll('img')),
        };
    }).filter((item) => item.imgs.length && item.speed);
    if (!items.length) return;

    const update = () => {
        const vh = window.innerHeight;
        items.forEach(({ imgs, layer, speed, anchor }) => {
            const img = imgs.length === 1 ? imgs[0] : imgs.find((i) => i.getClientRects().length > 0);
            if (!img) return;
            const rect = anchor.getBoundingClientRect();
            if (rect.bottom < -200 || rect.top > vh + 200) return;
            const progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
            const shift = progress * speed * rect.height;
            img.style.transform = layer
                ? `translate3d(0, ${shift.toFixed(1)}px, 0)`
                : `translate3d(0, ${shift.toFixed(1)}px, 0) scale(${(1 + 2 * Math.abs(speed)).toFixed(3)})`;
        });
    };

    lenis.on('scroll', update);
    window.addEventListener('resize', update);
    update();
}

/* ------------------------------------------------------------------
   Hlavička a úvodné video
------------------------------------------------------------------ */
function initHeader() {
    const header = document.getElementById('site-header');
    if (!header || header.classList.contains('is-static-solid')) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initHeroVideo() {
    const video = document.getElementById('hero-video');
    if (!video) return;

    // Na mobile nastavíme zodpovedajúci vertikálny poster bez sťahovania druhého videa
    if (window.matchMedia('(max-width: 768px)').matches && video.dataset.posterMobile) {
        video.poster = video.dataset.posterMobile;
    }

    if (prefersReducedMotion()) {
        video.removeAttribute('autoplay');
        video.pause();
    }
}

/* ------------------------------------------------------------------
   Mobilné menu s plným zachytením klávesového fokusu (Focus Trap)
------------------------------------------------------------------ */
function initMenu() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
        document.body.classList.toggle('menu-open', open);
        lockScroll(open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.querySelector('.menu-toggle-label').textContent = open ? 'Zavrieť' : 'Menu';
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));

    document.addEventListener('keydown', (e) => {
        if (!document.body.classList.contains('menu-open')) return;
        if (e.key === 'Escape') {
            setOpen(false);
            toggle.focus();
            return;
        }
        if (e.key === 'Tab') {
            const focusables = [
                toggle,
                ...Array.from(nav.querySelectorAll('a[href]')).filter((el) => el.getClientRects().length > 0),
            ];
            if (!focusables.length) return;
            const pos = focusables.indexOf(document.activeElement);
            if (e.shiftKey && (pos <= 0)) {
                e.preventDefault();
                focusables[focusables.length - 1].focus();
            } else if (!e.shiftKey && pos === focusables.length - 1) {
                e.preventDefault();
                focusables[0].focus();
            }
        }
    });

    window.matchMedia('(min-width: 1041px)').addEventListener('change', (e) => {
        if (e.matches) setOpen(false);
    });
}

/* ------------------------------------------------------------------
   „Teraz otvorené / zatvorené“ podľa času v Bratislave a sviatkov SR
------------------------------------------------------------------ */
const DAY_PHRASE = ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'];

function bratislavaNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Bratislava',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    const date = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
    return { date, minutes: get('hour') * 60 + get('minute') };
}

function easterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(year, month - 1, day);
}

function isHoliday(date) {
    const md = `${date.getUTCDate()}.${date.getUTCMonth() + 1}`;
    const fixed = ['1.1', '6.1', '1.5', '8.5', '5.7', '29.8', '1.9', '15.9', '1.11', '17.11', '24.12', '25.12', '26.12'];
    if (fixed.includes(md)) return true;
    const easter = easterSunday(date.getUTCFullYear());
    const day = 86400000;
    return date.getTime() === easter - 2 * day || date.getTime() === easter + day;
}

const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};
const prettyTime = (t) => t.replace(/^0/, '');

function hoursFor(hours, weekday) {
    const row = hours.find((h) => h.days.includes(weekday));
    return row && row.open ? row : null;
}

function openStatusText(hours) {
    const { date, minutes } = bratislavaNow();
    if (isHoliday(date)) return null;

    const today = hoursFor(hours, date.getUTCDay());
    if (today) {
        if (minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
            return { open: true, text: `Teraz otvorené · dnes do ${prettyTime(today.close)}` };
        }
        if (minutes < toMinutes(today.open)) {
            return { open: false, text: `Dnes otvárame o ${prettyTime(today.open)}` };
        }
    }

    for (let offset = 1; offset <= 7; offset++) {
        const next = new Date(date.getTime() + offset * 86400000);
        if (isHoliday(next)) return { open: false, text: 'Teraz zatvorené' };
        const row = hoursFor(hours, next.getUTCDay());
        if (row) {
            const when = offset === 1 ? 'zajtra' : DAY_PHRASE[next.getUTCDay()];
            return { open: false, text: `Zatvorené · otvárame ${when} o ${prettyTime(row.open)}` };
        }
    }
    return null;
}

function initOpenStatus() {
    document.querySelectorAll('[data-open-status]').forEach((el) => {
        try {
            const status = openStatusText(JSON.parse(el.dataset.hours));
            if (!status) return;
            el.textContent = status.text;
            el.classList.toggle('is-open', status.open);
            el.hidden = false;
        } catch {
            // Hodiny zostávajú dostupné v tabuľke
        }
    });

    try {
        const { date } = bratislavaNow();
        if (isHoliday(date)) return;
        const weekday = String(date.getUTCDay());
        document.querySelectorAll('.hours tr[data-days]').forEach((row) => {
            if (!row.dataset.days.split(',').includes(weekday) || row.classList.contains('is-today')) return;
            row.classList.add('is-today');
            const tag = document.createElement('span');
            tag.className = 'today-tag';
            tag.textContent = 'dnes';
            row.querySelector('th')?.append(tag);
        });
    } catch {
        // Tabuľka je platná aj bez štítku
    }
}

/* ------------------------------------------------------------------
   Galéria: Filtrovanie podľa príležitostí, dávky fotiek, posuvník, Lightbox
------------------------------------------------------------------ */
function initGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    const items = Array.from(gallery.querySelectorAll('.gallery-item'));
    const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
    const moreWrap = document.getElementById('gallery-more-wrap');
    const moreBtn = document.getElementById('gallery-more');
    const lessBtn = document.getElementById('gallery-less');
    const maxBatch = Number(gallery.dataset.maxBatch || 0);

    let shownBatch = 0;
    let activeFilter = 'all';

    gallery.classList.add('is-js-stagger');

    const updateStagger = () => {
        const visible = items.filter((el) => el.getClientRects().length > 0);
        items.forEach((el) => el.classList.remove('is-stagger', 'is-stagger-2'));
        visible.forEach((el, idx) => {
            if (idx % 4 === 1 || idx % 4 === 3) el.classList.add('is-stagger');
            if (idx % 2 === 1) el.classList.add('is-stagger-2');
        });
    };

    const updateThumb = () => {
        const thumb = document.getElementById('gallery-thumb');
        if (!thumb) return;
        const max = gallery.scrollWidth - gallery.clientWidth;
        const ratio = max > 0 ? Math.min(1, Math.max(0, gallery.scrollLeft / max)) : 0;
        thumb.style.setProperty('--gallery-progress', ratio.toFixed(4));
    };

    const renderGallery = (animateFresh = []) => {
        const isFiltered = activeFilter !== 'all';
        gallery.classList.toggle('is-filtered', isFiltered);

        items.forEach((item) => {
            const matchCat = !isFiltered || item.dataset.category === activeFilter;
            item.classList.toggle('is-filtered-out', !matchCat);
            item.classList.toggle('is-shown', Number(item.dataset.batch) <= shownBatch);
        });

        if (moreWrap) moreWrap.hidden = isFiltered;
        if (moreBtn) moreBtn.hidden = isFiltered || shownBatch >= maxBatch;
        if (lessBtn) lessBtn.hidden = isFiltered || shownBatch === 0;

        updateStagger();
        updateThumb();

        if (animateFresh.length && !prefersReducedMotion()) {
            animateFresh.forEach((item) => {
                item.dataset.reveal = 'image';
                item.classList.remove('is-revealed', 'reveal-done');
            });
            void gallery.offsetHeight;
            requestAnimationFrame(() => requestAnimationFrame(() => {
                animateFresh.forEach((item, i) => revealElement(item, i * 65));
            }));
        }
    };

    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextFilter = btn.dataset.filter || 'all';
            if (nextFilter === activeFilter) return;
            activeFilter = nextFilter;
            filterBtns.forEach((b) => {
                const active = b === btn;
                b.classList.toggle('is-active', active);
                b.setAttribute('aria-selected', String(active));
            });
            gallery.scrollLeft = 0;
            const matching = items.filter((item) => activeFilter === 'all'
                ? Number(item.dataset.batch) <= shownBatch
                : item.dataset.category === activeFilter);
            renderGallery(matching);
        });
    });

    moreBtn?.addEventListener('click', () => {
        shownBatch = Math.min(shownBatch + 1, maxBatch);
        const fresh = items.filter((item) => Number(item.dataset.batch) === shownBatch);
        renderGallery(fresh);
        fresh[0]?.focus({ preventScroll: true });
    });

    lessBtn?.addEventListener('click', () => {
        shownBatch = 0;
        renderGallery();
        const creations = document.getElementById('creations');
        if (creations) scrollToTarget(creations);
    });

    gallery.addEventListener('scroll', updateThumb, { passive: true });
    window.addEventListener('resize', () => {
        updateStagger();
        updateThumb();
    });

    renderGallery();
    initLightbox(items);
}

function initLightbox(items) {
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    const count = document.getElementById('lightbox-count');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    if (!box || !img || !closeBtn) return;
    const controls = [prevBtn, nextBtn, closeBtn].filter(Boolean);

    let list = [];
    let index = 0;
    let lastFocus = null;
    let swapTimer = null;

    const render = (item) => {
        img.src = item.dataset.full;
        img.alt = item.dataset.caption;
        caption.textContent = item.dataset.tag
            ? `${item.dataset.caption} — ${item.dataset.tag}`
            : item.dataset.caption;
        count.textContent = `${index + 1} / ${list.length}`;
    };

    const show = (i, fade = false) => {
        index = (i + list.length) % list.length;
        const item = list[index];
        clearTimeout(swapTimer);
        if (!fade) {
            img.classList.remove('is-switching');
            render(item);
            return;
        }
        img.classList.add('is-switching');
        const preload = new Image();
        preload.src = item.dataset.full;
        swapTimer = setTimeout(() => {
            const reveal = () => {
                if (list[index] !== item) return;
                render(item);
                requestAnimationFrame(() => img.classList.remove('is-switching'));
            };
            if (preload.complete) reveal();
            else preload.addEventListener('load', reveal, { once: true });
        }, 170);
    };

    const open = (item) => {
        list = items.filter((el) => el.getClientRects().length > 0);
        if (!list.length) list = [item];
        lastFocus = item;
        show(Math.max(0, list.indexOf(item)));
        box.hidden = false;
        requestAnimationFrame(() => box.classList.add('is-active'));
        lockScroll(true);
        closeBtn.focus();
    };

    const close = () => {
        box.classList.remove('is-active');
        box.hidden = true;
        lockScroll(false);
        lastFocus?.focus();
    };

    items.forEach((item) => item.addEventListener('click', () => open(item)));
    closeBtn.addEventListener('click', close);
    prevBtn?.addEventListener('click', () => show(index - 1, true));
    nextBtn?.addEventListener('click', () => show(index + 1, true));
    box.addEventListener('click', (e) => {
        if (e.target === box || e.target.classList.contains('lightbox-figure')) close();
    });

    document.addEventListener('keydown', (e) => {
        if (box.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') show(index + 1, true);
        if (e.key === 'ArrowLeft') show(index - 1, true);
        if (e.key === 'Tab') {
            e.preventDefault();
            const pos = controls.indexOf(document.activeElement);
            const step = e.shiftKey ? -1 : 1;
            controls[(pos + step + controls.length) % controls.length].focus();
        }
    });

    let startX = 0;
    box.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].screenX - startX;
        if (dx < -50) show(index + 1, true);
        if (dx > 50) show(index - 1, true);
    }, { passive: true });
}

/* ------------------------------------------------------------------
   Tlačidlo „Návrat hore“
------------------------------------------------------------------ */
function initScrollTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;
    btn.addEventListener('click', () => scrollToTarget(0));
    const update = () => btn.classList.toggle('is-visible', window.scrollY > 1400);
    window.addEventListener('scroll', update, { passive: true });
    update();
}

/* ------------------------------------------------------------------
   Inicializácia
------------------------------------------------------------------ */
initSmoothScroll();
initHeader();
initHeroVideo();
initMenu();
initOpenStatus();
initGallery();
initReveal();
initParallax();
initScrollTop();
