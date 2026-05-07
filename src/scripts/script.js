document.addEventListener('astro:page-load', function () {

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


    // --- 6. CUSTOM CURSOR LOGIC ---
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor) {
        // Track mouse movement (použijeme onmousemove, aby nevznikali duplikáty pri navigácii)
        document.onmousemove = (e) => {
            // Hardware accelerated position update
            customCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        };

        // Interaktívne prvky, na ktorých sa kurzor zväčší (hover)
        const interactiveSelectors = 'a, button, .creation-box, .bx, .theme-toggle-icon, .footer-link';
        
        // Funkcia na re-bindovanie eventov
        const bindCursorHover = () => {
            document.querySelectorAll(interactiveSelectors).forEach(el => {
                if (!el.dataset.cursorBound) {
                    el.addEventListener('mouseenter', () => customCursor.classList.add('cursor-hover'));
                    el.addEventListener('mouseleave', () => customCursor.classList.remove('cursor-hover'));
                    el.dataset.cursorBound = 'true';
                }
            });
        };
        
        bindCursorHover();
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
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    };

    const handleFooterMacroScroll = () => {
        const footerMacro = document.getElementById('footer-macro');
        if (footerMacro) {
            const rect = footerMacro.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (rect.top < windowHeight && rect.bottom > 0) {
                // Výpočet: 0 keď sa text začne objavovať zdola, 1 keď je celý na obrazovke
                let progress = (windowHeight - rect.top) / (rect.height || 100);

                // Povolíme hodnoty medzi 0 a trochu viac ako 1
                progress = Math.max(0, progress);

                // Výraznejší efekt zväčšovania (až 30%)
                const scale = 1 + (progress * 0.3);
                footerMacro.style.transform = `scale(${scale})`;
            }
        }
    };

    const handleHeroParallax = () => {
        const hero = document.querySelector('.hero');
        if (hero) {
            const scrollY = window.scrollY;
            const heroHeight = hero.offsetHeight;
            if (scrollY > heroHeight) return;

            const heroVideo = hero.querySelector('.hero-video');
            const heroContent = hero.querySelector('.hero-content');
            const heroOverlay = hero.querySelector('.hero-overlay');

            if (heroVideo) {
                // Parallax pre obrázok (posúva sa pomalšie ako zvyšok stránky)
                heroVideo.style.transform = `translateY(${scrollY * 0.45}px)`;
            }
            if (heroContent) {
                // Jemnejší parallax pre text s postupným zánikom (fade out)
                heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
                heroContent.style.opacity = Math.max(0, 1 - (scrollY / (heroHeight * 0.7)));
            }
            if (heroOverlay) {
                // Postupné stmavovanie pre silný filmový "fade" efekt
                const darkness = Math.min(scrollY / heroHeight, 0.85);
                heroOverlay.style.backgroundColor = `rgba(0, 0, 0, ${darkness})`;
            }
        }
    };

    // --- 7. MOBILNÝ SLIDER (BENTO GRID NA MOBILOCH) ---
    const sliderWrapper = document.getElementById('creations-slider');
    const sliderThumb = document.getElementById('slider-thumb');
    
    if (sliderWrapper && sliderThumb) {
        const updateSliderThumb = () => {
            const maxScrollLeft = sliderWrapper.scrollWidth - sliderWrapper.clientWidth;
            if (maxScrollLeft > 0) {
                // Posun thumbu: šírka thumbu je 30%, čiže sa posúva maximálne o zvyšných 70% až do cca zrkadlového okraja
                const scrollPercentage = sliderWrapper.scrollLeft / maxScrollLeft;
                // Posun vypočítame vzhľadom k šírke kontajnera thumbu
                sliderThumb.style.transform = `translateX(${scrollPercentage * 230}%)`; 
                // 230% posunie 30% element na samotný okraj tracku (3.3 * 30% = cca 100%, posúvame samotnú ľavú hranu o cca 233% jej vlastnej šírky aby koniec lícoval).
            }
        };

        // Aktualizuj na začiatku a pri posune
        sliderWrapper.addEventListener('scroll', updateSliderThumb, { passive: true });
        // Počkaj na načítanie fontov a obrázkov, potom uprav
        setTimeout(updateSliderThumb, 100);
        window.addEventListener('resize', updateSliderThumb);
    }

    // Event listenery zostávajú, lebo vnútorná logika funkcií je už ošetrená
    // Používame .onscroll a .onresize namiesto addEventListener, aby sme predišli duplikácii pri astro:page-load
    window.onscroll = () => {
        activateNavOnScroll();
        handleScrollTopBtn();
        handleHeaderScroll();
        handleFooterMacroScroll();
        handleHeroParallax();
    };
    window.onresize = () => {
        handleHeaderScroll();
        handleFooterMacroScroll();
    };

    // Prvotné spustenie
    activateNavOnScroll();
    handleHeaderScroll();
    handleFooterMacroScroll();
    handleHeroParallax();
});