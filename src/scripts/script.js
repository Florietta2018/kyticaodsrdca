// Súbor: src/scripts/script.js
// Spúšťa sa pri každom načítaní stránky (aj po prechode cez Astro ClientRouter).
// Všetky listenery na window/document sa pri odchode zo stránky zrušia cez AbortController.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let pageController = null;

/* ------------------------------------------------------------------
   Plynulé skrolovanie (Lenis) – len na počítači s myšou alebo touchpadom.
   Na dotykových zariadeniach a pri „obmedziť pohyb“ ostáva natívne skrolovanie.
------------------------------------------------------------------ */
let lenis = null;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initSmoothScroll() {
    if (lenis) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finePointer || prefersReducedMotion()) return;
    lenis = new Lenis({
        lerp: 0.085,
        autoRaf: true,
        // Vo vnútri lightboxu a otvoreného menu Lenis koliesko neobsluhuje.
        prevent: (node) => Boolean(node.closest && node.closest('#lightbox, #site-nav')),
    });
}

// Zamknutie stránky pri otvorenom menu alebo lightboxe.
function lockScroll(locked) {
    document.body.classList.toggle('no-scroll', locked);
    if (lenis) {
        if (locked) lenis.stop();
        else lenis.start();
    }
}

// Posun na prvok alebo na pozíciu. Odsadenie pod pevnú hlavičku zabezpečí
// scroll-padding-top v CSS (rešpektuje ho Lenis aj natívny posun).
function scrollToTarget(target) {
    const isNumber = typeof target === 'number';
    if (lenis) {
        lenis.scrollTo(target, { duration: 1.4 });
        return;
    }
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (isNumber) window.scrollTo({ top: target, behavior });
    else target.scrollIntoView({ behavior });
}

// Odkazy na sekcie (#creations, /#contact …) posúvame cez Lenis, aby boli rovnako plynulé.
// Capture fáza a preventDefault zároveň zabránia, aby odkaz spracoval ClientRouter.
document.addEventListener('click', (e) => {
    if (!lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const link = e.target.closest && e.target.closest('a[href*="#"]');
    if (!link || link.target === '_blank') return;
    const url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const section = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!section) return;
    e.preventDefault();
    // Ak je otvorené menu, stránku najprv odomkneme, inak by Lenis posun ignoroval.
    if (document.body.classList.contains('no-scroll')) lockScroll(false);
    scrollToTarget(section);
    history.replaceState(history.state, '', url.hash);
}, { capture: true });

document.addEventListener('astro:before-swap', () => {
    if (pageController) pageController.abort();
    lockScroll(false);
});

document.addEventListener('astro:page-load', () => {
    if (pageController) pageController.abort();
    pageController = new AbortController();
    const { signal } = pageController;

    initSmoothScroll();
    initReveal(signal);
    initParallax(signal);
    initHeader(signal);
    initHeroVideo();
    initMenu(signal);
    initOpenStatus();
    initGallery(signal);
    initScrollTop(signal);
});

/* ------------------------------------------------------------------
   Objavovanie prvkov pri skrolovaní (data-reveal = mask | up | image | fade)
   Každý prvok sa animuje iba raz. Počiatočný skrytý stav nastavuje trieda
   html.reveal-ready (pridá ju skript v <head>, pri „obmedziť pohyb“ nie).
------------------------------------------------------------------ */
function initReveal(signal) {
    window.__revealInit = true;
    if (!document.documentElement.classList.contains('reveal-ready')) return;

    // Pozíciu kontrolujeme cez getBoundingClientRect pri skrolovaní. IntersectionObserver
    // tu nepoužívame: fotku úplne orezanú cez clip-path považuje za neviditeľnú a nikdy ju neoznámi.
    const pending = new Set(document.querySelectorAll('[data-reveal]:not(.is-revealed)'));
    pending.forEach((el) => {
        if (el.dataset.revealDelay) el.style.setProperty('--reveal-delay', `${el.dataset.revealDelay}ms`);
    });

    const reveal = (el) => {
        el.classList.add('is-revealed');
        pending.delete(el);
        // Po dobehnutí animácie odstránime oneskorenie, aby neplatilo pre hover efekty.
        const delay = Number(el.dataset.revealDelay) || 0;
        setTimeout(() => {
            el.classList.add('reveal-done');
            el.style.removeProperty('--reveal-delay');
        }, delay + 1600);
    };

    let ticking = false;
    const check = () => {
        ticking = false;
        const vh = window.innerHeight;
        pending.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return; // skrytý prvok
            // Fotky sa začnú odhaľovať hneď pri vstupe na obrazovku (inak by pri rýchlom
            // skrolovaní zostávali prázdne miesta), texty až keď sú kúsok vnútri.
            const trigger = el.dataset.reveal === 'image' ? vh : vh * 0.9;
            if (rect.top < trigger && rect.bottom > 0) reveal(el);
        });
    };
    const schedule = () => {
        if (ticking || !pending.size) return;
        ticking = true;
        requestAnimationFrame(check);
    };

    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', schedule, { signal });
    check();
}

/* ------------------------------------------------------------------
   Paralax na fotkách (len keď beží Lenis, teda na počítači)
   data-parallax="0.1"         fotka sa posúva vnútri svojho rámu (rám ostáva)
   data-parallax + -layer      posúva sa celý prvok (vrstvy s rôznou rýchlosťou)
------------------------------------------------------------------ */
function initParallax(signal) {
    if (!lenis) return;
    const items = Array.from(document.querySelectorAll('[data-parallax]')).map((el) => {
        const layer = el.hasAttribute('data-parallax-layer');
        return {
            el,
            layer,
            speed: Number(el.dataset.parallax) || 0,
            // vrstva meria pozíciu podľa rodiča, aby ju vlastný posun neovplyvňoval
            anchor: layer ? el.parentElement : el,
            // v ráme môže byť viac fotiek pre rôzne šírky obrazovky; posúvame tú viditeľnú
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
            // -1 = prvok práve vchádza zdola, 0 = je v strede obrazovky, 1 = odchádza hore
            const progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
            const shift = progress * speed * rect.height;
            img.style.transform = layer
                ? `translate3d(0, ${shift.toFixed(1)}px, 0)`
                : `translate3d(0, ${shift.toFixed(1)}px, 0) scale(${(1 + 2 * Math.abs(speed)).toFixed(3)})`;
        });
    };

    const unsubscribe = lenis.on('scroll', update);
    window.addEventListener('resize', update, { signal });
    signal.addEventListener('abort', () => {
        if (typeof unsubscribe === 'function') unsubscribe();
    });
    update();
}

/* ------------------------------------------------------------------
   Hlavička: po odscrollovaní z hera dostane plné pozadie
------------------------------------------------------------------ */
function initHeader(signal) {
    const header = document.getElementById('site-header');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', update, { passive: true, signal });
    update();
}

/* ------------------------------------------------------------------
   Video v úvode: pri nastavení „obmedziť pohyb“ ho zastavíme na prvom zábere
------------------------------------------------------------------ */
function initHeroVideo() {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.hero-video').forEach((video) => {
        video.removeAttribute('autoplay');
        video.pause();
    });
}

/* ------------------------------------------------------------------
   Mobilné menu
------------------------------------------------------------------ */
function initMenu(signal) {
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
        if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
            setOpen(false);
            toggle.focus();
        }
    }, { signal });
    // Pri zväčšení okna na desktop menu zavrieme, aby nezostal zamknutý scroll.
    window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
        if (e.matches) setOpen(false);
    }, { signal });
}

/* ------------------------------------------------------------------
   „Teraz otvorené / zatvorené“ podľa otváracích hodín (čas v Bratislave)
------------------------------------------------------------------ */
const DAY_PHRASE = ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'];

function bratislavaNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Bratislava',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    // Dátum zostavíme v UTC, aby sme s ním mohli bezpečne posúvať dni.
    const date = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
    return { date, minutes: get('hour') * 60 + get('minute') };
}

function easterSunday(year) {
    // Anonymný gregoriánsky algoritmus
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(year, month - 1, day);
}

// Štátne sviatky SR. V tieto dni môže byť otvorené inak, preto stav radšej nezobrazujeme.
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
            return { open: true, text: `Teraz otvorené, dnes do ${prettyTime(today.close)}` };
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
            return { open: false, text: `Teraz zatvorené, otvárame ${when} o ${prettyTime(row.open)}` };
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
            // Ak niečo zlyhá, stav jednoducho nezobrazíme. Hodiny sú stále v tabuľke.
        }
    });

    // Zvýraznenie dnešného dňa v tabuľke hodín (cez sviatky nie, hodiny môžu byť iné)
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
        // Bez zvýraznenia je tabuľka stále úplná.
    }
}

/* ------------------------------------------------------------------
   Galéria: „Zobraziť ďalšie“, posuvník na mobile, lightbox
------------------------------------------------------------------ */
function initGallery(signal) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    const items = Array.from(gallery.querySelectorAll('.gallery-item'));

    // Odkrývanie ďalších fotiek po dávkach (desktop)
    const moreBtn = document.getElementById('gallery-more');
    const lessBtn = document.getElementById('gallery-less');
    const maxBatch = Number(gallery.dataset.maxBatch || 0);
    let shownBatch = 0;

    const renderBatches = () => {
        items.forEach((item) => item.classList.toggle('is-shown', Number(item.dataset.batch) <= shownBatch));
        if (moreBtn) moreBtn.hidden = shownBatch >= maxBatch;
        if (lessBtn) lessBtn.hidden = shownBatch === 0;
    };

    moreBtn?.addEventListener('click', () => {
        shownBatch = Math.min(shownBatch + 1, maxBatch);
        const fresh = Array.from(gallery.querySelectorAll(`.gallery-item[data-batch="${shownBatch}"]`));
        // Nové fotky dostanú rovnakú „oponu“ ako fotky pri skrolovaní, jedna po druhej.
        fresh.forEach((item, i) => {
            item.dataset.reveal = 'image';
            item.classList.remove('is-revealed', 'reveal-done');
            item.style.setProperty('--reveal-delay', `${i * 70}ms`);
        });
        renderBatches();
        void gallery.offsetHeight; // prehliadač si zapamätá skrytý počiatočný stav
        requestAnimationFrame(() => requestAnimationFrame(() => {
            fresh.forEach((item, i) => {
                item.classList.add('is-revealed');
                setTimeout(() => {
                    item.classList.add('reveal-done');
                    item.style.removeProperty('--reveal-delay');
                }, i * 70 + 1200);
            });
        }));
        // Posunieme fokus na prvú novú fotku, aby čítačky obrazovky vedeli, čo pribudlo.
        gallery.querySelector(`.gallery-item[data-batch="${shownBatch}"]`)?.focus({ preventScroll: true });
    });
    lessBtn?.addEventListener('click', () => {
        shownBatch = 0;
        renderBatches();
        const creations = document.getElementById('creations');
        if (creations) scrollToTarget(creations);
    });
    renderBatches();

    // Ukazovateľ posunu na mobile
    const thumb = document.getElementById('gallery-thumb');
    if (thumb) {
        const updateThumb = () => {
            const max = gallery.scrollWidth - gallery.clientWidth;
            const ratio = max > 0 ? gallery.scrollLeft / max : 0;
            thumb.style.transform = `translateX(${ratio * 233}%)`;
        };
        gallery.addEventListener('scroll', updateThumb, { passive: true });
        window.addEventListener('resize', updateThumb, { signal });
        updateThumb();
    }

    initLightbox(items, signal);
}

function initLightbox(items, signal) {
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
        caption.textContent = item.dataset.caption;
        count.textContent = `${index + 1} / ${list.length}`;
    };

    // fade = true: stará fotka sa stratí, nová sa po načítaní objaví (prelínanie pri listovaní)
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
        }, 180);
    };

    const open = (item) => {
        // Listujeme len medzi fotkami, ktoré sú práve viditeľné.
        list = items.filter((el) => el.getClientRects().length > 0);
        lastFocus = item;
        show(list.indexOf(item));
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
            // Fokus krúži len medzi tlačidlami lightboxu.
            e.preventDefault();
            const pos = controls.indexOf(document.activeElement);
            const step = e.shiftKey ? -1 : 1;
            controls[(pos + step + controls.length) % controls.length].focus();
        }
    }, { signal });

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
function initScrollTop(signal) {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;
    btn.addEventListener('click', () => scrollToTarget(0));
    const update = () => btn.classList.toggle('is-visible', window.scrollY > 1400);
    window.addEventListener('scroll', update, { passive: true, signal });
    update();
}
