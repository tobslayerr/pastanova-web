/* =========================================================
   ADMIN LOGIC & SECURITY (admin.js)
   ========================================================= */

const API_URL = '/api';

// --- 1. PROTEKSI HALAMAN (CEK TOKEN) ---
const token = localStorage.getItem('pastanova_admin_token');
if (!token) { window.location.href = '/admin/login.html'; }

function logoutAdmin() {
    localStorage.removeItem('pastanova_admin_token');
    window.location.href = '/admin/login.html';
}

function handleApiError(res) {
    if (res.status === 401 || res.status === 403) {
        alert("Sesi login Anda telah habis atau tidak valid. Silakan login kembali.");
        logoutAdmin(); return true;
    }
    return false;
}

// --- 2. INISIALISASI & GLOBAL STATE ---
let selectedFiles = [];
let existingMenuImages = []; // Menyimpan foto lama saat mode Edit
let editMenuId = null;       // ID menu yang sedang diedit
let allMenus = [];           // Cache seluruh menu

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadAddons(); 
    loadMenus();

    document.getElementById('catForm').addEventListener('submit', addCategory);
    document.getElementById('addonForm').addEventListener('submit', addAddon);
    document.getElementById('menuForm').addEventListener('submit', submitMenuForm); // Diubah ke submitMenuForm
    document.getElementById('imageInput').addEventListener('change', handleFileSelect);
});

// --- LOGIKA DRAG & DROP FOTO (LAMA & BARU) ---
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    selectedFiles = selectedFiles.concat(files);
    renderPreviews(); e.target.value = ''; 
}

function renderPreviews() {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    
    // Render Foto Lama
    existingMenuImages.forEach((imgUrl, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${imgUrl}"><button type="button" class="btn-remove-preview" onclick="removeExistingFile(${index})">&times;</button>`;
        container.appendChild(div);
    });

    // Render Foto Baru (Bisa drag n drop)
    selectedFiles.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.draggable = true; div.dataset.index = index;
        div.innerHTML = `<img src="${url}"><button type="button" class="btn-remove-preview" onclick="removeFile(${index})">&times;</button>`;
        div.addEventListener('dragstart', handleDragStart); div.addEventListener('dragover', handleDragOver);
        div.addEventListener('dragleave', handleDragLeave); div.addEventListener('drop', handleDrop);
        container.appendChild(div);
    });
}

function removeFile(index) { selectedFiles.splice(index, 1); renderPreviews(); }
function removeExistingFile(index) { existingMenuImages.splice(index, 1); renderPreviews(); }

let dragStartIndex;
function handleDragStart(e) { dragStartIndex = +e.target.closest('.preview-item').dataset.index; e.target.classList.add('dragging'); }
function handleDragOver(e) { e.preventDefault(); const overItem = e.target.closest('.preview-item'); if (overItem) overItem.classList.add('drag-over'); }
function handleDragLeave(e) { const overItem = e.target.closest('.preview-item'); if (overItem) overItem.classList.remove('drag-over'); }
function handleDrop(e) {
    e.preventDefault(); const dropTarget = e.target.closest('.preview-item'); if (!dropTarget) return;
    dropTarget.classList.remove('drag-over'); const dragEndIndex = +dropTarget.dataset.index;
    const itemToMove = selectedFiles.splice(dragStartIndex, 1)[0];
    selectedFiles.splice(dragEndIndex, 0, itemToMove);
    renderPreviews();
}

// --- 3. CRUD ADDONS ---
async function loadAddons() {
    try {
        const res = await fetch(`${API_URL}/addons`);
        const addons = await res.json();
        
        // Render List
        const list = document.getElementById('addonList');
        list.innerHTML = addons.map(a => `
            <li>
                <img src="${a.image}" style="width:45px; height:45px; border-radius:10px; object-fit:cover;">
                <div style="flex:1; line-height:1.2;">
                    <strong>${a.name}</strong><br>
                    <small style="color:#888;">${a.description || ''}</small><br>
                    <small style="color:var(--primary-orange); font-weight:bold;">+ Rp ${a.price.toLocaleString('id-ID')}</small>
                </div>
                <button type="button" onclick="deleteAddon('${a._id}')" class="btn-delete-small"><i class='bx bx-trash'></i></button>
            </li>
        `).join('');

        // Render Checkbox
        const grid = document.getElementById('addonSelectionGrid');
        grid.innerHTML = addons.map(a => `
            <label class="addon-check-item">
                <input type="checkbox" name="menuAddons" value="${a._id}" id="chk-addon-${a._id}">
                <span>${a.name} (+Rp${a.price.toLocaleString('id-ID')})</span>
            </label>
        `).join('');
    } catch(err) { console.error(err); }
}

async function addAddon(e) {
    e.preventDefault();
    const btn = document.getElementById('saveAddonBtn');
    btn.disabled = true; btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Menyimpan...";

    const formData = new FormData();
    formData.append('name', document.getElementById('addonName').value);
    formData.append('description', document.getElementById('addonDesc').value);
    formData.append('price', document.getElementById('addonPrice').value);
    formData.append('image', document.getElementById('addonImage').files[0]);

    try {
        const res = await fetch(`${API_URL}/addons`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        if(handleApiError(res)) return;
        if(res.ok) { document.getElementById('addonForm').reset(); loadAddons(); }
    } catch(err) { console.error(err); }
    finally { btn.disabled = false; btn.innerText = "Save Add-on"; }
}

async function deleteAddon(id) {
    if(confirm("Yakin hapus Add-on ini? (Akan hilang dari menu terkait)")) {
        const res = await fetch(`${API_URL}/addons/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if(handleApiError(res)) return; loadAddons();
    }
}

// --- 4. CRUD KATEGORI ---
async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`); const cats = await res.json();
        document.getElementById('catList').innerHTML = cats.map(c => `<li><span style="font-weight:700;">${c.name}</span> <button type="button" onclick="deleteCategory('${c._id}')" class="btn-delete-small"><i class='bx bx-trash'></i></button></li>`).join('');
        document.getElementById('catSelect').innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    } catch(err) { console.error(err); }
}

async function addCategory(e) {
    e.preventDefault(); const name = document.getElementById('catName').value;
    try {
        const res = await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({name}) });
        if(handleApiError(res)) return; document.getElementById('catName').value = ''; loadCategories();
    } catch(err) { console.error(err); }
}

async function deleteCategory(id) {
    if(confirm("Yakin hapus kategori ini?")) {
        const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if(handleApiError(res)) return; loadCategories();
    }
}

// --- 5. CRUD MENU (TAMBAH & EDIT) ---
async function loadMenus() {
    try {
        const res = await fetch(`${API_URL}/menus?limit=100`);
        const data = await res.json();
        allMenus = data.menus; // Simpan ke memory global
        
        document.getElementById('menuTableBody').innerHTML = allMenus.map(m => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${m.images[0] || ''}" style="width:55px; height:55px; object-fit:cover; border-radius:10px;">
                        <div>
                            <strong style="color:var(--bg-dark-brown);">${m.name}</strong><br>
                            <small style="color:#888;">${m.description.substring(0,35)}...</small>
                        </div>
                    </div>
                </td>
                <td style="text-transform:capitalize; font-weight:600; color:#666;">${m.category}</td>
                <td style="font-weight:700; color:var(--primary-orange);">Rp ${m.price.toLocaleString('id-ID')}</td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button class="btn-edit" onclick="editMenu('${m._id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteMenu('${m._id}')">Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch(err) { console.error(err); }
}

function editMenu(id) {
    const m = allMenus.find(menu => menu._id === id);
    if(!m) return;
    
    editMenuId = m._id;
    document.getElementById('formTitle').innerHTML = "<i class='bx bx-edit'></i> EDIT PRODUCT";
    
    // Isi data
    document.getElementById('menuName').value = m.name;
    document.getElementById('menuDesc').value = m.description;
    document.getElementById('menuPrice').value = m.price;
    document.getElementById('catSelect').value = m.category;
    
    // Centang addon terkait
    document.querySelectorAll('input[name="menuAddons"]').forEach(cb => cb.checked = false);
    m.addons.forEach(addon => { const cb = document.getElementById(`chk-addon-${addon._id}`); if(cb) cb.checked = true; });

    existingMenuImages = [...m.images];
    selectedFiles = [];
    renderPreviews();

    // Ubah UI Tombol
    document.getElementById('submitMenuBtn').innerHTML = "<i class='bx bx-refresh'></i> UPDATE MENU";
    document.getElementById('cancelEditBtn').style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    editMenuId = null;
    document.getElementById('formTitle').innerHTML = "<i class='bx bx-plus-circle'></i> ADD NEW PRODUCT";
    document.getElementById('menuForm').reset();
    document.querySelectorAll('input[name="menuAddons"]').forEach(cb => cb.checked = false);
    
    existingMenuImages = [];
    selectedFiles = [];
    renderPreviews();

    document.getElementById('submitMenuBtn').innerHTML = "<i class='bx bx-save'></i> SAVE TO DATABASE";
    document.getElementById('cancelEditBtn').style.display = "none";
}

async function submitMenuForm(e) {
    e.preventDefault();
    if (selectedFiles.length === 0 && existingMenuImages.length === 0) return alert("Harap upload minimal 1 foto produk!");

    const submitBtn = document.getElementById('submitMenuBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Menyimpan...";
    submitBtn.disabled = true;

    const selectedAddons = Array.from(document.querySelectorAll('input[name="menuAddons"]:checked')).map(cb => cb.value);

    const formData = new FormData();
    formData.append('name', document.getElementById('menuName').value);
    formData.append('description', document.getElementById('menuDesc').value);
    formData.append('price', document.getElementById('menuPrice').value);
    formData.append('category', document.getElementById('catSelect').value);
    formData.append('addons', JSON.stringify(selectedAddons)); 
    
    if(editMenuId) formData.append('existingImages', JSON.stringify(existingMenuImages));
    selectedFiles.forEach(file => formData.append('images', file));

    const method = editMenuId ? 'PUT' : 'POST';
    const url = editMenuId ? `${API_URL}/menus/${editMenuId}` : `${API_URL}/menus`;

    try {
        const res = await fetch(url, { method: method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        if(handleApiError(res)) return; 
        if(res.ok) {
            alert(editMenuId ? 'Menu Berhasil Diupdate!' : 'Menu Berhasil Tersimpan!');
            cancelEdit(); loadMenus();
        } else { alert('Gagal menyimpan menu'); }
    } catch(err) { console.error(err); alert("Terjadi kesalahan jaringan."); } 
    finally { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
}

async function deleteMenu(id) {
    if(confirm("Yakin hapus menu beserta fotonya?")) {
        const res = await fetch(`${API_URL}/menus/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if(handleApiError(res)) return; loadMenus();
    }
}
