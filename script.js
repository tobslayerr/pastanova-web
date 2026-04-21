/* --- 0. Logika Loading Screen (Preloader) --- */
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => { loader.style.display = 'none'; }, 600);
    }
});

/* --- Logika Utama Website & Component Loader --- */
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetch('/navbar.html').then(res => res.text()),
        fetch('/footer.html').then(res => res.text())
    ]).then(([navbarData, footerData]) => {
        
        // Pengecekan Aman (Menghindari Error NULL)
        const navHolder = document.getElementById('navbar-placeholder');
        const footHolder = document.getElementById('footer-placeholder');
        
        if (navHolder) navHolder.innerHTML = navbarData;
        if (footHolder) footHolder.innerHTML = footerData;

        initWebsiteLogic();
    }).catch(err => console.error("Gagal memuat komponen:", err));
});

function initWebsiteLogic() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const navLinks = document.querySelectorAll('.nav-links a');

    const toggleMenu = () => {
        mobileBtn.classList.toggle('open');
        sidebar.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
    };

    if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', () => {
        if (sidebar && sidebar.classList.contains('sidebar-open')) toggleMenu();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('sidebar-open')) toggleMenu();
        });
    });

    const pathname = window.location.pathname;
    const isHome = pathname === '/' || pathname === '/index.html';
    const sections = document.querySelectorAll('main > section[id]');
    
    const updateActiveAnchor = (targetId) => {
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if ((targetId === 'beranda' && linkHref === '/') || linkHref === `/#${targetId}`) {
                link.classList.add('active');
            }
        });
    };

    const currentHash = window.location.hash;
    
    // Setel menu aktif default
    if (pathname.includes('/about-us')) navLinks.forEach(link => { if (link.getAttribute('href') === '/about-us/') link.classList.add('active'); });
    else if (pathname.includes('/our-feedback')) navLinks.forEach(link => { if (link.getAttribute('href') === '/our-feedback/') link.classList.add('active'); });
    else if (pathname.includes('/faqs')) navLinks.forEach(link => { if (link.getAttribute('href') === '/faqs/') link.classList.add('active'); });
    else if (pathname.includes('/contact-us')) navLinks.forEach(link => { if (link.getAttribute('href') === '/contact-us/') link.classList.add('active'); });
    else if (isHome && !currentHash) navLinks.forEach(link => { if (link.getAttribute('href') === '/') link.classList.add('active'); });

    if (isHome && sections.length > 0) {
        if (currentHash) setTimeout(() => { updateActiveAnchor(currentHash.substring(1)); }, 300);
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) updateActiveAnchor(entry.target.id); });
        }, { threshold: 0.3 }); 
        sections.forEach(section => scrollObserver.observe(section));
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '/' && isHome) {
                e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
        reveals.forEach(reveal => revealObserver.observe(reveal));
    }
}