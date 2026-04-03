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

    // --- 1. FUNKCIONALITA MOBILNÉHO MENU (bez zmeny) ---
    if (menuIcon && navWrapper) {
        menuIcon.addEventListener('click', toggleMenu);
        navWrapper.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navWrapper.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });
        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => {
                if (navWrapper.classList.contains('active')) {
                    toggleMenu();
                }
            });
        }
    }

    function toggleMenu() {
        menuIcon.classList.toggle('bx-x');
        menuIcon.classList.toggle('active');
        navWrapper.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        body.classList.toggle('body-no-scroll');
    }

    // --- 2. ZMENA TÉMY (SVETLÝ/TMAVÝ REŽIM) ---
    // === VYLEPŠENIE: Zjednodušená a čistejšia logika ===
    if (themeToggle) {
        // Funkcia na aplikovanie zvolenej témy
        const applyTheme = (theme) => {
            if (theme === 'light') {
                body.classList.add('light-mode');
                themeToggle.classList.replace('bx-sun', 'bx-moon');
            } else {
                body.classList.remove('light-mode');
                themeToggle.classList.replace('bx-moon', 'bx-sun');
            }
        };

        // Pri načítaní stránky zistíme tému z localStorage, predvolená je 'light'
        const currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme);

        // Listener pre kliknutie na prepínač
        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('light-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }


    // --- 3. ANIMÁCIA PRI SCROLLOVANÍ (FADE IN) (bez zmeny) ---
    if (fadeInElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        fadeInElements.forEach(el => {
            observer.observe(el);
        });
    }

    // --- 4. FUNKCIONALITA MODÁLNEJ GALÉRIE ---
    // === VYLEPŠENIE: Pridaná podpora pre zatvorenie klávesou Escape ===
    if (modal && modalImg && modalClose && creationBoxes) {

        const openModal = (imgSrc) => {
            modalImg.src = imgSrc;
            modal.classList.add('active');
            body.classList.add('body-no-scroll');
            // Pridá poslucháča na klávesnicu, keď je okno otvorené
            document.addEventListener('keydown', handleModalKeydown);
        };
        
        const closeModal = () => {
            modal.classList.remove('active');
            if (!navWrapper.classList.contains('active')) {
                body.classList.remove('body-no-scroll');
            }
            // Odstráni poslucháča, aby nebežal na pozadí
            document.removeEventListener('keydown', handleModalKeydown);
        };

        const handleModalKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };

        creationBoxes.forEach(box => {
            box.addEventListener('click', () => {
                const img = box.querySelector('img');
                if (img) {
                    openModal(img.src);
                }
            });
        });

        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }


    // --- 5. TLAČIDLO "NÁVRAT HORE" (bez zmeny) ---
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==========================================================
    // --- HLAVNÝ OBSLUŽNÝ PROGRAM PRE VŠETKY FUNKCIE SCROLLOVANIA ---
    // (bez zmeny)
    // ==========================================================

    const activateNavOnScroll = () => {
        const scrollPosition = window.scrollY;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - header.offsetHeight - 20;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.navbar a[href*=${sectionId}]`);

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                }
            }
        });
    };

    const handleScrollTopBtn = () => {
        if (scrollTopBtn) {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }
    };

    const handleHeaderScroll = () => {
        const desktopBreakpoint = 992; 
        if (header) {
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

    // Jeden centrálny poslucháč pre všetky scroll funkcie
    window.addEventListener('scroll', () => {
        activateNavOnScroll();
        handleScrollTopBtn();
        handleHeaderScroll();
    });

    // Poslucháč pre zmenu veľkosti okna
    window.addEventListener('resize', handleHeaderScroll);

    // Prvotné spustenie pre správne nastavenie pri načítaní
    activateNavOnScroll();
    handleHeaderScroll();
    
});