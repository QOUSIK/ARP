function arpWireHeader(){
    const burger = document.querySelector(".burger");
    const navigation = document.querySelector(".navigation");
    const header = document.querySelector(".header-area");
    const languageSelect = document.getElementById("languageSelect");
    const languageSelector = document.querySelector(".language-selector");

    // Guard: only wire once per element
    if (burger && !burger._wired && navigation){
        burger.addEventListener("click", (e) => {
            e.stopPropagation();
            burger.classList.toggle("active");
            navigation.classList.toggle("active");
        });
        // Close on link click
        navigation.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                burger.classList.remove("active");
                navigation.classList.remove("active");
            });
        });
        // Close on outside click (once)
        if (!document._arpHeaderOutsideClose){
            document.addEventListener('click', (e) => {
                const navActive = navigation && navigation.classList.contains('active');
                if (navActive && !e.target.closest('.navigation') && !e.target.closest('.burger')){
                    burger.classList.remove("active");
                    navigation.classList.remove("active");
                }
            });
            document._arpHeaderOutsideClose = true;
        }
        burger._wired = true;
    }

    if (header && !window._arpHeaderScrollWired){
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) header.classList.add("scrolled");
            else header.classList.remove("scrolled");
        });
        window._arpHeaderScrollWired = true;
    }

    if (languageSelect && languageSelector && !languageSelect._wired){
        languageSelect.addEventListener("change", function(){
            const selectedLang = this.value;
            languageSelector.setAttribute("data-lang", selectedLang);
            try { localStorage.setItem('arp_lang', selectedLang); } catch {}
        });
        // Initialize from storage
        const savedLang = (localStorage.getItem('arp_lang') || 'en');
        languageSelect.value = savedLang;
        languageSelector.setAttribute("data-lang", savedLang);
        languageSelect._wired = true;
    }
}

// Run once DOM is ready and again after HTML includes are injected
if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', arpWireHeader);
} else {
    arpWireHeader();
}
document.addEventListener('includesLoaded', arpWireHeader);

// Функция для компактного отображения языка
function updateLanguageTextForMobile() {
    const languageSelect = document.getElementById('languageSelect');
    if (!languageSelect) return;
    
    const isCompactMode = window.innerWidth <= 1000;
    
    if (isCompactMode) {
        // Сохраняем оригинальные значения
        languageSelect.querySelector('option[value="en"]').textContent = 'ENG';
        languageSelect.querySelector('option[value="ru"]').textContent = 'RU';
        languageSelect.querySelector('option[value="tr"]').textContent = 'TUR';
        languageSelect.querySelector('option[value="de"]').textContent = 'GER';
    } else {
        // Возвращаем полные названия
        languageSelect.querySelector('option[value="en"]').textContent = 'English';
        languageSelect.querySelector('option[value="ru"]').textContent = 'Русский';
        languageSelect.querySelector('option[value="tr"]').textContent = 'Türkçe';
        languageSelect.querySelector('option[value="de"]').textContent = 'Deutsch';
    }
}

// Вызываем при загрузке и изменении размера
function arpWireLangCompact(){
    updateLanguageTextForMobile();
    if (!window._arpLangCompactWired){
        window.addEventListener('resize', updateLanguageTextForMobile);
        window._arpLangCompactWired = true;
    }
}
if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', arpWireLangCompact);
} else {
    arpWireLangCompact();
}
document.addEventListener('includesLoaded', arpWireLangCompact);
