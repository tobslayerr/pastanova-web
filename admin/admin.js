/* =========================================================
   ADMIN LOGIC & SECURITY (admin.js)
   ========================================================= */

const API_URL = '/api';

// --- 1. PROTEKSI HALAMAN (CEK TOKEN) ---
const token = localStorage.getItem('pastanova_admin_token');
if (!token) {
    window.location.href = '/admin/login.html';
}

function logoutAdmin() {
    localStorage.removeItem('pastanova_admin_token');
    window.location.href = '/admin/login.html';
}

// Fungsi Bantuan untuk Error Token
function handleApiError(res) {
    if (res.status === 401 || res.status === 403) {
        alert("Sesi login Anda telah habis atau tidak valid. Silakan login kembali.");
        logoutAdmin();
        return true;
    }
    return false;
}


// --- 2. LOGIKA DRAG & DROP FOTO ---
let selectedFiles = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadMenus();

    document.getElementById('catForm').addEventListener('submit', addCategory);
    document.getElementById('menuForm').addEventListener('submit', addMenu);
    document.getElementById('imageInput').addEventListener('change', handleFileSelect);
});

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    selectedFiles = selectedFiles.concat(files);
    renderPreviews();
    e.target.value = ''; 
}

function renderPreviews() {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.draggable = true;
        div.dataset.index = index;
        
        div.innerHTML = `
            <img src="${url}">
            <button type="button" class="btn-remove-preview" onclick="removeFile(${index})">&times;</button>
        `;

        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('dragleave', handleDragLeave);
        div.addEventListener('drop', handleDrop);

        container.appendChild(div);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderPreviews();
}

let dragStartIndex;
function handleDragStart(e) {
    dragStartIndex = +e.target.closest('.preview-item').dataset.index;
    e.target.classList.add('dragging');
}
function handleDragOver(e) {
    e.preventDefault();
    const overItem = e.target.closest('.preview-item');
    if (overItem) overItem.classList.add('drag-over');
}
function handleDragLeave(e) {
    const overItem = e.target.closest('.preview-item');
    if (overItem) overItem.classList.remove('drag-over');
}
function handleDrop(e) {
    e.preventDefault();
    const dropTarget = e.target.closest('.preview-item');
    if (!dropTarget) return;

    dropTarget.classList.remove('drag-over');
    const dragEndIndex = +dropTarget.dataset.index;

    const itemToMove = selectedFiles.splice(dragStartIndex, 1)[0];
    selectedFiles.splice(dragEndIndex, 0, itemToMove);
    
    renderPreviews();
}


// --- 3. API CALLS DENGAN TOKEN ---

async function addMenu(e) {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Harap upload minimal 1 foto produk!");

    const submitBtn = document.getElementById('submitMenuBtn');
    submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Mengupload...";
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('name', document.getElementById('menuName').value);
    formData.append('description', document.getElementById('menuDesc').value);
    formData.append('price', document.getElementById('menuPrice').value);
    formData.append('category', document.getElementById('catSelect').value);
    
    selectedFiles.forEach(file => formData.append('images', file));

    try {
        const res = await fetch(`${API_URL}/menus`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }, // INJEKSI TOKEN
            body: formData 
        });
        
        if(handleApiError(res)) return; 

        if(res.ok) {
            alert('Menu Berhasil Tersimpan!');
            document.getElementById('menuForm').reset();
            selectedFiles = []; 
            renderPreviews();
            loadMenus();
        } else {
            alert('Gagal menambah menu');
        }
    } catch(err) { 
        console.error(err); alert("Terjadi kesalahan jaringan.");
    } finally {
        submitBtn.innerHTML = "<i class='bx bx-save'></i> SAVE TO DATABASE";
        submitBtn.disabled = false;
    }
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`);
        const cats = await res.json();
        const list = document.getElementById('catList');
        list.innerHTML = cats.map(c => `<li>${c.name} <button type="button" onclick="deleteCategory('${c._id}')"><i class='bx bx-trash'></i></button></li>`).join('');
        document.getElementById('catSelect').innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    } catch(err) { console.error(err); }
}

async function addCategory(e) {
    e.preventDefault();
    const name = document.getElementById('catName').value;
    try {
        const res = await fetch(`${API_URL}/categories`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // INJEKSI TOKEN
            }, 
            body: JSON.stringify({name}) 
        });
        
        if(handleApiError(res)) return;
        
        document.getElementById('catName').value = '';
        loadCategories();
    } catch(err) { console.error(err); }
}

async function deleteCategory(id) {
    if(confirm("Yakin hapus kategori ini?")) {
        const res = await fetch(`${API_URL}/categories/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` } // INJEKSI TOKEN
        });
        if(handleApiError(res)) return;
        loadCategories();
    }
}

async function loadMenus() {
    try {
        const res = await fetch(`${API_URL}/menus?limit=100`);
        const data = await res.json();
        const tbody = document.getElementById('menuTableBody');
        tbody.innerHTML = data.menus.map(m => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${m.images[0] || ''}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
                        <div>
                            <strong>${m.name}</strong><br>
                            <small style="color:#888;">${m.description.substring(0,30)}...</small>
                        </div>
                    </div>
                </td>
                <td style="text-transform:capitalize;">${m.category}</td>
                <td>Rp ${m.price.toLocaleString('id-ID')}</td>
                <td><button class="btn-delete" onclick="deleteMenu('${m._id}')">Hapus</button></td>
            </tr>
        `).join('');
    } catch(err) { console.error(err); }
}

async function deleteMenu(id) {
    if(confirm("Yakin hapus menu beserta fotonya?")) {
        const res = await fetch(`${API_URL}/menus/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` } // INJEKSI TOKEN
        });
        if(handleApiError(res)) return;
        loadMenus();
    }
}