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
    
    // Memuat Navbar dan Footer secara paralel menggunakan Fetch API
    Promise.all([
        fetch('/navbar.html').then(res => res.text()),
        fetch('/footer.html').then(res => res.text())
    ]).then(([navbarData, footerData]) => {
        
        // Memasukkan HTML ke dalam Placeholder
        document.getElementById('navbar-placeholder').innerHTML = navbarData;
        document.getElementById('footer-placeholder').innerHTML = footerData;

        // Setelah komponen HTML dimuat, inisialisasi semua logika website
        initWebsiteLogic();

    }).catch(err => console.error("Gagal memuat komponen:", err));

});

// Fungsi untuk menjalankan logika setelah komponen selesai dimuat
function initWebsiteLogic() {
    
    /* --- 1. Logika Mobile Sidebar Toggle & Overlay --- */
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

    /* --- 2. Navigasi Cerdas Multi-page & Tweak Halaman Spesifik --- */
    const pathname = window.location.pathname;
    const isAboutUs = pathname.includes('/about-us');
    const isOurFeedback = pathname.includes('/our-feedback');
    const isFaqs = pathname.includes('/faqs');
    const isContactUs = pathname.includes('/contact-us');
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
    if (isAboutUs) navLinks.forEach(link => { if (link.getAttribute('href') === '/about-us/') link.classList.add('active'); });
    else if (isOurFeedback) navLinks.forEach(link => { if (link.getAttribute('href') === '/our-feedback/') link.classList.add('active'); });
    else if (isFaqs) navLinks.forEach(link => { if (link.getAttribute('href') === '/faqs/') link.classList.add('active'); });
    else if (isContactUs) navLinks.forEach(link => { if (link.getAttribute('href') === '/contact-us/') link.classList.add('active'); });
    else if (isHome && !currentHash) navLinks.forEach(link => { if (link.getAttribute('href') === '/') link.classList.add('active'); });

    // Scroll Observer untuk Home
    if (isHome && sections.length > 0) {
        if (currentHash) setTimeout(() => { updateActiveAnchor(currentHash.substring(1)); }, 300);
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) updateActiveAnchor(entry.target.id); });
        }, { threshold: 0.3 }); 
        sections.forEach(section => scrollObserver.observe(section));
    }

    /* --- 3. Anti-Reload Smooth Scroll --- */
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '/' && isHome) {
                e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    const logoLink = document.querySelector('a.logo');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '/' && isHome) {
                e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    /* --- 4. Scroll Reveal Animation (Di-load ulang untuk Footer juga) --- */
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
        reveals.forEach(reveal => revealObserver.observe(reveal));
    }
}