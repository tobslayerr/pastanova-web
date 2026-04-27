/* =========================================================
   MENU LOGIC & CART SYSTEM (menu.js)
   ========================================================= */

const API_URL = '/api';
let currentCategory = 'semua';
let currentSearch = '';
let currentPage = 1;

let cart = JSON.parse(localStorage.getItem('pastanova_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('menu-grid')) {
        loadCategories();
        fetchMenus();
        const searchInput = document.getElementById('searchInput');
        if(searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                currentSearch = e.target.value;
                currentPage = 1;
                fetchMenus();
            });
        }
    }
    updateCartBadge();
});

async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const cats = await res.json();
        const filterBox = document.getElementById('filterBox');
        if(!filterBox) return;

        filterBox.innerHTML = `<button class="filter-btn active" data-filter="semua">Semua</button>` + 
            cats.map(c => `<button class="filter-btn" data-filter="${c.name}">${c.name}</button>`).join('');
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.dataset.filter;
                currentPage = 1;
                fetchMenus();
            });
        });
    } catch(err) { console.error("Gagal muat kategori:", err); }
}

// --- FUNGSI LOAD DATA MENU ---
async function fetchMenus() {
    const grid = document.getElementById('menu-grid');
    const pagination = document.getElementById('pagination');

    // 1. Tampilkan Spinner Loading sebelum mengambil data
    if(grid) {
        grid.innerHTML = `
            <div class="menu-loading-container">
                <i class='bx bx-loader-circle bx-spin'></i>
                <h3>Sedang Meracik Menu...</h3>
            </div>
        `;
    }
    // Sembunyikan pagination sementara saat loading
    if(pagination) pagination.innerHTML = '';

    // 2. Mulai ambil data dari API
    try {
        const res = await fetch(`${API_URL}/menus?search=${currentSearch}&category=${currentCategory}&page=${currentPage}&limit=6`);
        const data = await res.json();
        
        // 3. Render data jika berhasil
        renderGrid(data.menus);
        renderPagination(data.totalPages);
    } catch(err) { 
        console.error("Gagal muat menu:", err); 
        if(grid) {
            grid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1/-1; font-weight:bold; font-size:1.2rem; color:#FF4757;">Oops, Gagal memuat menu. Pastikan koneksimu stabil!</p>';
        }
    }
}

function renderGrid(menus) {
    const grid = document.getElementById('menu-grid');
    if(!grid) return;
    if(menus.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; font-weight:bold; font-size:1.2rem; color:#888;">Oops, Menu tidak ditemukan.</p>';
        return;
    }

    grid.innerHTML = menus.map(m => `
        <div class="menu-card reveal active from-bottom">
            <span class="menu-tag">${m.category}</span>
            <div class="menu-img-container">
                <img src="${m.images[0]}" alt="${m.name}">
            </div>
            <div class="menu-content">
                <h3>${m.name}</h3>
                <p>${m.description}</p>
                <div class="menu-card-footer">
                    <span class="price-tag">Rp ${m.price.toLocaleString('id-ID')}</span>
                    <a href="/menu/detail/?id=${m._id}" class="btn-go-detail"><i class='bx bx-chevron-right'></i></a>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if(!pagination) return;
    pagination.innerHTML = '';
    for(let i=1; i<=totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => { currentPage = i; fetchMenus(); window.scrollTo({top: 0, behavior: 'smooth'}); };
        pagination.appendChild(btn);
    }
}


/* =========================================================
   SISTEM KERANJANG (CART ENGINE)
   ========================================================= */

function saveCart() {
    localStorage.setItem('pastanova_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
}

function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    badges.forEach(b => {
        b.innerText = totalQty;
        b.style.display = totalQty > 0 ? 'flex' : 'none';
    });
}

window.toggleCart = () => {
    const modal = document.getElementById('cartModal');
    if(modal) {
        modal.classList.toggle('active');
        renderCartItems(); 
    }
}

window.addToCart = (id, name, price, image, qty = 1) => {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id, name, price, image, qty });
    }
    saveCart();
}

window.renderCartItems = () => {
    const list = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotalPrice');
    if(!list || !totalEl) return;

    if (cart.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#888; font-weight:bold; margin-top:3rem;">🛒 Keranjangmu masih kosong. <br>Yuk pilih pasta favoritmu!</div>';
        totalEl.innerText = 'Rp 0';
        return;
    }

    let total = 0;
    list.innerHTML = cart.map((item, index) => {
        total += item.price * item.qty;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">Rp ${item.price.toLocaleString('id-ID')}</div>
                    <div class="cart-qty-ctrl">
                        <button onclick="updateCartQty(${index}, -1)"><i class='bx bx-minus'></i></button>
                        <span>${item.qty}</span>
                        <button onclick="updateCartQty(${index}, 1)"><i class='bx bx-plus'></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    totalEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

window.updateCartQty = (index, delta) => {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1); 
    }
    saveCart();
}

window.checkoutCartWA = () => {
    if(cart.length === 0) return alert('Keranjang belanja kamu masih kosong!');
    
    let total = 0;
    let text = `Halo *PastaNova!* 👋%0A`;
    text += `Saya ingin memesan menu dari keranjang:%0A%0A`;
    text += `━━━━━━━━━━━━━━━━━━━━━%0A`;
    text += `*Daftar Pesanan:*%0A`;
    
    cart.forEach(item => {
        let subtotal = item.price * item.qty;
        total += subtotal;
        text += `▪️ ${item.qty}x *${item.name}*%0A`;
        text += `   ↳ Rp ${subtotal.toLocaleString('id-ID')}%0A`;
    });
    
    text += `━━━━━━━━━━━━━━━━━━━━━%0A%0A`;
    text += `💰 *Total Pembayaran:* *Rp ${total.toLocaleString('id-ID')}*%0A%0A`;
    text += `Mohon informasi ketersediaannya ya. Terima kasih! 🙏`;
    
    window.open(`https://wa.me/6281287990438?text=${text}`, '_blank');
}
