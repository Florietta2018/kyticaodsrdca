document.addEventListener('DOMContentLoaded', function() {

    // --- VÝBER VŠETKÝCH POTREBNÝCH ELEMENTOV ---
    const body = document.body;
    const header = document.querySelector('.header');

    // Menu
    const menuIcon = document.getElementById('menu-icon');
    const navWrapper = document.getElementById('nav-wrapper');
    const menuOverlay = document.querySelector('.menu-overlay');
    const navLinks = document.querySelectorAll('.navbar a');

    // Téma
    const themeToggle = document.getElementById('theme-toggle');

    // Tlačidlá a Modály
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-img');
    const modalClose = document.getElementById('modal-close');

    // Sekcie a animované prvky
    const creationBoxes = document.querySelectorAll('.creation-box');
    const fadeInElements = document.querySelectorAll('.fade-in-element');
    const sections = document.querySelectorAll('section[id]');

    // --- 1. FUNKCIONALITA MOBILNÉHO MENU ---
    // ✅ NOVÝ PRÍSTUP: Funkcia je "nerozbitná". Sama si kontroluje každý element,
    // takže nespôsobí chybu, aj keby časť HTML chýbala.
    const toggleMenu = () => {
        // Skontroluj každý element tesne pred jeho použitím
        if (menuIcon) {
            menuIcon.classList.toggle('bx-x');
            menuIcon.classList.toggle('active');
        }
        if (navWrapper) {
            navWrapper.classList.toggle('active');
        }
        if (menuOverlay) {
            menuOverlay.classList.toggle('active');
        }
        // Body existuje vždy
        body.classList.toggle('body-no-scroll');
    };

    // Event listener priradíme, ak existuje aspoň klikateľná ikona.
    if (menuIcon) {
        menuIcon.addEventListener('click', toggleMenu);
    }

    // Ostatné event listenery pre menu sú tiež ošetrené samostatne
    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            if (navWrapper && navWrapper.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    if (navWrapper) {
        navWrapper.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navWrapper.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });
    }


    // --- 2. ZMENA TÉMY (SVETLÝ/TMAVÝ REŽIM) ---
    // Táto časť je v poriadku
    if (themeToggle) {
        const applyTheme = (theme) => {
            if (theme === 'light') {
                body.classList.add('light-mode');
                themeToggle.classList.replace('bx-sun', 'bx-moon');
            } else {
                body.classList.remove('light-mode');
                themeToggle.classList.replace('bx-moon', 'bx-sun');
            }
        };
        const currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme);
        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('light-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }


    // --- 3. ANIMÁCIA PRI SCROLLOVANÍ (FADE IN) ---
    // Táto časť je v poriadku
    if (fadeInElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        fadeInElements.forEach(el => observer.observe(el));
    }


    // --- 4. FUNKCIONALITA MODÁLNEJ GALÉRIE ---
    // Táto časť je v poriadku
    if (modal && modalImg && modalClose && creationBoxes.length > 0) {
        const openModal = (imgSrc) => {
            modalImg.src = imgSrc;
            modal.classList.add('active');
            body.classList.add('body-no-scroll');
            document.addEventListener('keydown', handleModalKeydown);
        };
        const closeModal = () => {
            modal.classList.remove('active');
            if (!navWrapper || !navWrapper.classList.contains('active')) {
                body.classList.remove('body-no-scroll');
            }
            document.removeEventListener('keydown', handleModalKeydown);
        };
        const handleModalKeydown = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        creationBoxes.forEach(box => {
            box.addEventListener('click', () => {
                const img = box.querySelector('img');
                if (img) openModal(img.src);
            });
        });
        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }


    // --- 5. TLAČIDLO "NÁVRAT HORE" ---
    // Táto časť je v poriadku
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // ==========================================================
    // --- FUNKCIE PRE SCROLLOVANIE A ZMENU VEĽKOSTI OKNA ---
    // ==========================================================
    const activateNavOnScroll = () => {
        if (!header || sections.length === 0) return;
        const scrollPosition = window.scrollY;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - header.offsetHeight - 20;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.navbar a[href*=${sectionId}]`);
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (correspondingLink) correspondingLink.classList.add('active');
            }
        });
    };

    const handleScrollTopBtn = () => {
        if (scrollTopBtn) {
            if (window.scrollY > 1500) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }
    };

    const handleHeaderScroll = () => {
        if (header) {
            const desktopBreakpoint = 992;
            if (window.innerWidth >= desktopBreakpoint) {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            } else {
                header.classList.remove('scrolled');
            }
        }
    };

    // Event listenery zostávajú, lebo vnútorná logika funkcií je už ošetrená
    window.addEventListener('scroll', () => {
        activateNavOnScroll();
        handleScrollTopBtn();
        handleHeaderScroll();
    });
    window.addEventListener('resize', handleHeaderScroll);
    
    // Prvotné spustenie
    activateNavOnScroll();
    handleHeaderScroll();
});