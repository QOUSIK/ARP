function arpWireHeader() {
    const header = document.querySelector('.header-area');
    if (!header || header._arpWired) return;
    header._arpWired = true;

    const burger = header.querySelector('.burger');
    const mobileNav = header.querySelector('.mobile-nav');
    const closeMobileNav = header.querySelector('.close-mobile-nav');
    const languageSelect = document.getElementById('languageSelect');
    const languageSelectMobile = document.getElementById('languageSelectMobile');

    // --- Mobile navigation toggle ---
    if (burger && mobileNav && !burger._arpWired) {
        const closeNav = () => {
            burger.classList.remove('active');
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        };

        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            burger.classList.toggle('active');
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';

            if (mobileNav.classList.contains('active')) {
                const menuItems = mobileNav.querySelectorAll('li');
                menuItems.forEach((item, index) => {
                    item.style.transitionDelay = `${0.1 + index * 0.05}s`;
                });
            }
        });

        if (closeMobileNav) {
            closeMobileNav.addEventListener('click', closeNav);
        }

        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeNav);
        });

        if (!document._arpMobileNavOutsideClose) {
            document.addEventListener('click', (e) => {
                if (mobileNav.classList.contains('active') &&
                    !e.target.closest('.mobile-nav') &&
                    !e.target.closest('.burger')) {
                    closeNav();
                }
            });
            document._arpMobileNavOutsideClose = true;
        }

        burger._arpWired = true;
    }

    // --- Header scroll effect ---
    if (!window._arpHeaderScrollWired) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
        window._arpHeaderScrollWired = true;
    }

    // --- Language selectors ---
    function setupLanguageSelector(selectElement) {
        if (!selectElement || selectElement._arpWired) return;

        selectElement.addEventListener('change', function () {
            const selectedLang = this.value;

            document.querySelectorAll('.language-selector').forEach(selector => {
                selector.setAttribute('data-lang', selectedLang);
            });

            if (languageSelect && selectElement !== languageSelect) {
                languageSelect.value = selectedLang;
            }
            if (languageSelectMobile && selectElement !== languageSelectMobile) {
                languageSelectMobile.value = selectedLang;
            }

            try {
                localStorage.setItem('arp_lang', selectedLang);
            } catch (e) { }
        });

        selectElement._arpWired = true;
    }

    setupLanguageSelector(languageSelect);
    setupLanguageSelector(languageSelectMobile);

    const savedLang = (localStorage.getItem('arp_lang') || 'en');
    if (languageSelect) languageSelect.value = savedLang;
    if (languageSelectMobile) languageSelectMobile.value = savedLang;
    document.querySelectorAll('.language-selector').forEach(selector => {
        selector.setAttribute('data-lang', savedLang);
    });
}

// Run once DOM is ready and again after HTML includes are injected
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arpWireHeader);
} else {
    arpWireHeader();
}
document.addEventListener('includesLoaded', arpWireHeader);

