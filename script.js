// ============================================
// DATACAIXA - Sistema PDV Completo
// ============================================

// Storage Keys
const STORAGE_KEYS = {
    PRODUCTS: 'pdv_products',
    CLIENTS: 'pdv_clients',
    CART: 'pdv_cart',
    IMAGES: 'pdv_images',
    SALES: 'pdv_sales'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupMenuListeners();
});

function initializeApp() {
    // Load initial data
    renderProductsList();
    renderClientsList();
    renderImagesGallery();
    renderCart();
    
    // Initialize sidebar
    setupSidebarToggle();
}

// ============================================
// SIDEBAR & NAVIGATION
// ============================================

function setupSidebarToggle() {
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function setupMenuListeners() {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchPage(e.target.closest('.menu-btn').dataset.page);
        });
    });
}

function switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(`page-${pageName}`);
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    // Add active class to button
    const selectedBtn = document.querySelector(`[data-page="${pageName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Close sidebar on mobile
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth < 768) {
        sidebar.classList.remove('active');
    }
}

function switchCarrinhoTab(tabName) {
    document.querySelectorAll('.carrinho-tab').forEach(tab => {
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Storage error:', e);
        return false;
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Storage error:', e);
        return [];
    }
}

// ============================================
// PRODUTOS
// ============================================

function handleAddProduct() {
    const name = document.getElementById('product-name').value.trim();
    const code = document.getElementById('product-code').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    
    if (!name || !code || !price) {
        alert('Preencha todos os campos!');
        return;
    }
    
    const products = getFromLocalStorage(STORAGE_KEYS.PRODUCTS);
    const product = {
        id: Date.now(),
        name,
        code,
        price,
        image: null,
        createdAt: new Date().toISOString()
    };
    
    // Handle image upload if present
    const imageInput = document.getElementById('product-image');
    if (imageInput && imageInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            product.image = e.target.result;
            products.push(product);
            saveToLocalStorage(STORAGE_KEYS.PRODUCTS, products);
            renderProductsList();
            resetProductForm();
            alert('Produto adicionado com sucesso!');
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        products.push(product);
        saveToLocalStorage(STORAGE_KEYS.PRODUCTS, products);
        renderProductsList();
        resetProductForm();
        alert('Produto adicionado com sucesso!');
    }
}

function resetProductForm() {
    document.getElementById('product-name').value = '';
    document.getElementById('product-code').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-image').value = '';
}

function deleteProduct(id) {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
        let products = getFromLocalStorage(STORAGE_KEYS.PRODUCTS);
        products = products.filter(p => p.id !== id);
        saveToLocalStorage(STORAGE_KEYS.PRODUCTS, products);
        renderProductsList();
    }
}

function renderProductsList() {
    const products = getFromLocalStorage(STORAGE_KEYS.PRODUCTS);
    const container = document.getElementById('products-list');
    
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum produto cadastrado</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-image">` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
            <h3>${product.name}</h3>
            <p class="code">Código: ${product.code}</p>
            <p class="price">R$ ${product.price.toFixed(2)}</p>
            <button onclick="deleteProduct(${product.id})" class="btn-delete">
                <i class="fas fa-trash"></i> Deletar
            </button>
        </div>
    `).join('');
}

// ============================================
// CARRINHO
// ============================================

function scanBarcode() {
    const barcodeInput = document.getElementById('barcode-input');
    const code = barcodeInput.value.trim();
    
    if (!code) {
        alert('Digite um código de barras!');
        return;
    }
    
    const products = getFromLocalStorage(STORAGE_KEYS.PRODUCTS);
    const product = products.find(p => p.code === code);
    
    if (!product) {
        alert('Produto não encontrado!');
        barcodeInput.value = '';
        return;
    }
    
    addToCart(product);
    barcodeInput.value = '';
}

function addToCart(product) {
    let cart = getFromLocalStorage(STORAGE_KEYS.CART);
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
    }
    
    saveToLocalStorage(STORAGE_KEYS.CART, cart);
    renderCart();
}

function updateQuantity(cartItemId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(cartItemId);
        return;
    }
    
    let cart = getFromLocalStorage(STORAGE_KEYS.CART);
    const item = cart.find(i => i.id === cartItemId);
    if (item) {
        item.quantity = newQuantity;
    }
    saveToLocalStorage(STORAGE_KEYS.CART, cart);
    renderCart();
}

function removeFromCart(cartItemId) {
    let cart = getFromLocalStorage(STORAGE_KEYS.CART);
    cart = cart.filter(item => item.id !== cartItemId);
    saveToLocalStorage(STORAGE_KEYS.CART, cart);
    renderCart();
}

function renderCart() {
    const cart = getFromLocalStorage(STORAGE_KEYS.CART);
    const cartContainer = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-state">Carrinho vazio</p>';
        if (totalContainer) totalContainer.innerHTML = 'R$ 0,00';
        return;
    }
    
    let total = 0;
    cartContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="cart-item-image">` : ''}
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" onchange="updateQuantity(${item.id}, parseInt(this.value))">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-total">
                    <p>R$ ${itemTotal.toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${item.id})" class="btn-remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    if (totalContainer) {
        totalContainer.innerHTML = `R$ ${total.toFixed(2)}`;
    }
}

function checkout() {
    const cart = getFromLocalStorage(STORAGE_KEYS.CART);
    
    if (cart.length === 0) {
        alert('Carrinho vazio!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const sale = {
        id: Date.now(),
        items: cart,
        total: total,
        date: new Date().toISOString()
    };
    
    let sales = getFromLocalStorage(STORAGE_KEYS.SALES);
    sales.push(sale);
    saveToLocalStorage(STORAGE_KEYS.SALES, sales);
    saveToLocalStorage(STORAGE_KEYS.CART, []);
    
    alert(`Venda realizada com sucesso!\nTotal: R$ ${total.toFixed(2)}`);
    renderCart();
}

// ============================================
// CLIENTES
// ============================================

function handleAddClient() {
    const name = document.getElementById('client-name').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    
    if (!name) {
        alert('Digite o nome do cliente!');
        return;
    }
    
    let clients = getFromLocalStorage(STORAGE_KEYS.CLIENTS);
    const client = {
        id: Date.now(),
        name,
        email,
        phone,
        totalSpent: 0,
        purchases: [],
        createdAt: new Date().toISOString()
    };
    
    clients.push(client);
    saveToLocalStorage(STORAGE_KEYS.CLIENTS, clients);
    renderClientsList();
    
    document.getElementById('client-name').value = '';
    document.getElementById('client-email').value = '';
    document.getElementById('client-phone').value = '';
    
    alert('Cliente adicionado com sucesso!');
}

function deleteClient(id) {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
        let clients = getFromLocalStorage(STORAGE_KEYS.CLIENTS);
        clients = clients.filter(c => c.id !== id);
        saveToLocalStorage(STORAGE_KEYS.CLIENTS, clients);
        renderClientsList();
    }
}

function renderClientsList() {
    const clients = getFromLocalStorage(STORAGE_KEYS.CLIENTS);
    const container = document.getElementById('clients-list');
    
    if (!container) return;
    
    if (clients.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum cliente cadastrado</p>';
        return;
    }
    
    container.innerHTML = clients.map(client => `
        <div class="client-card">
            <div class="client-info">
                <h3>${client.name}</h3>
                <p>${client.email || 'Sem email'}</p>
                <p>${client.phone || 'Sem telefone'}</p>
            </div>
            <div class="client-stats">
                <p class="total-spent">Total gasto: R$ ${client.totalSpent.toFixed(2)}</p>
                <p class="purchases">Compras: ${client.purchases.length}</p>
            </div>
            <button onclick="deleteClient(${client.id})" class="btn-delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// ============================================
// IMAGENS
// ============================================

function handleImageUpload() {
    const input = document.getElementById('image-file');
    const files = input.files;
    
    if (files.length === 0) {
        alert('Selecione uma imagem!');
        return;
    }
    
    let images = getFromLocalStorage(STORAGE_KEYS.IMAGES);
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = {
                id: Date.now() + Math.random(),
                src: e.target.result,
                name: file.name,
                uploadedAt: new Date().toISOString()
            };
            images.push(image);
            saveToLocalStorage(STORAGE_KEYS.IMAGES, images);
            renderImagesGallery();
        };
        reader.readAsDataURL(file);
    });
    
    input.value = '';
}

function deleteImage(id) {
    if (confirm('Tem certeza que deseja deletar esta imagem?')) {
        let images = getFromLocalStorage(STORAGE_KEYS.IMAGES);
        images = images.filter(img => img.id !== id);
        saveToLocalStorage(STORAGE_KEYS.IMAGES, images);
        renderImagesGallery();
    }
}

function renderImagesGallery() {
    const images = getFromLocalStorage(STORAGE_KEYS.IMAGES);
    const container = document.getElementById('images-gallery');
    
    if (!container) return;
    
    if (images.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma imagem cadastrada</p>';
        return;
    }
    
    container.innerHTML = images.map(image => `
        <div class="image-card">
            <img src="${image.src}" alt="${image.name}">
            <div class="image-overlay">
                <button onclick="deleteImage(${image.id})" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// LOGOUT
// ============================================

function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar dados locais (opcional)
        // localStorage.clear();
        
        // Redirecionar para Google
        window.location.href = 'https://www.google.com';
    }
}

// ============================================
// EVENTOS DE TECLADO
// ============================================

document.addEventListener('keypress', (e) => {
    // Enter no campo de barcode
    if (e.target && e.target.id === 'barcode-input' && e.key === 'Enter') {
        scanBarcode();
    }
});

function startBarcodeScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-container'),
            constraints: {
                facingMode: "environment" // Usar câmera traseira
            }
        },
        decoder: {
            readers: ["ean_reader", "ean_8_reader", "code_128_reader"]
        }
    }, function(err) {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        document.getElementById('barcode-input').value = code;
        scanBarcode();
        Quagga.stop();
    });
}