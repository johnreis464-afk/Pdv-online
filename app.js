// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let products = JSON.parse(localStorage.getItem('products')) || [];
let clients = JSON.parse(localStorage.getItem('clients')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let images = JSON.parse(localStorage.getItem('images')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];

const STORAGE_KEYS = {
    PRODUCTS: 'products',
    CLIENTS: 'clients',
    CART: 'cart',
    IMAGES: 'images',
    SALES: 'sales'
};

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateDashboard();
    renderProductsList();
    renderClientsList();
    renderImagesGallery();
});

function initializeEventListeners() {
    // Menu navigation
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            switchPage(page);
        });
    });

    // Sidebar toggle mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Logout button
    const btnLogout = document.querySelector('.btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }

    // Forms
    document.getElementById('formAddProduct').addEventListener('submit', handleAddProduct);
    document.getElementById('formAddClient').addEventListener('submit', handleAddClient);
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

    // Barcode input
    document.getElementById('barcodeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            scanBarcode();
        }
    });

    // Discount calculation
    document.getElementById('discount').addEventListener('change', updateCartTotal);

    // Image preview click
    document.getElementById('imagePreview').addEventListener('click', () => {
        document.getElementById('productImage').click();
    });

    // Drag and drop for images
    const imageUploadArea = document.querySelector('.image-upload-area');
    if (imageUploadArea) {
        imageUploadArea.addEventListener('click', () => {
            document.getElementById('imageUpload').click();
        });
    }
}

// ============================================
// NAVEGAÇÃO ENTRE PÁGINAS
// ============================================
function switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`page-${pageName}`).classList.add('active');

    // Update menu
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageName) {
            btn.classList.add('active');
        }
    });

    // Close sidebar on mobile
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    // Refresh data on page switch
    if (pageName === 'inicio') {
        updateDashboard();
    } else if (pageName === 'adicionar-produto') {
        renderProductsList();
    } else if (pageName === 'clientes') {
        renderClientsList();
    } else if (pageName === 'imagens') {
        renderImagesGallery();
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// ============================================
// LOGOUT / SAIR
// ============================================
function handleLogout() {
    const confirmLogout = confirm('Tem certeza que deseja sair do sistema DATACAIXA?');
    
    if (confirmLogout) {
        // Tentar fechar a aba (funciona em navegadores modernos se for aberta por script)
        if (window.opener) {
            // Se a página foi aberta por um script, fechar
            window.close();
        } else {
            // Se não conseguir fechar, redirecionar para Google
            const goToGoogle = confirm('Deseja ir para o Google ao sair?');
            if (goToGoogle) {
                window.location.href = 'https://www.google.com';
            } else {
                // Se o usuário não quiser ir para o Google, apenas recarregar
                window.location.href = 'about:blank';
            }
        }
    }
}

// ============================================
// PÁGINA: INÍCIO (Dashboard)
// ============================================
function updateDashboard() {
    const today = new Date().toDateString();
    const todaysSales = sales.filter(s => new Date(s.date).toDateString() === today);
    const totalSales = todaysSales.reduce((sum, s) => sum + s.total, 0);
    const totalClients = clients.length;
    const totalProducts = products.length;
    const ticketMedio = todaysSales.length > 0 ? totalSales / todaysSales.length : 0;

    document.getElementById('vendas-dia').textContent = `R$ ${totalSales.toFixed(2)}`;
    document.getElementById('total-clientes').textContent = totalClients;
    document.getElementById('total-produtos').textContent = totalProducts;
    document.getElementById('ticket-medio').textContent = `R$ ${ticketMedio.toFixed(2)}`;
}

// ============================================
// PÁGINA: CARRINHO - ABAS
// ============================================
function switchCarrinhoTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.carrinho-tab').forEach(t => {
        t.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');
}

// ============================================
// CÂMERA PARA ESCANEAR CÓDIGO DE BARRAS
// ============================================
let cameraStream = null;
let detectedBarcodeValue = null;
let barcodeDetected = false;

async function startCameraScanner() {
    const modal = document.getElementById('cameraModal');
    modal.style.display = 'flex';
    
    const video = document.getElementById('cameraVideo');
    
    try {
        // Solicitar acesso à câmera
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        video.srcObject = cameraStream;
        video.play();
        
        // Iniciar detecção de código de barras
        startBarcodeDetection(video);
        
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        alert('Erro ao acessar a câmera. Verifique as permissões.');
        closeCameraScanner();
    }
}

function startBarcodeDetection(videoElement) {
    const canvas = document.getElementById('barcodeCanvas');
    const canvasContext = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    
    // Ajustar tamanho do canvas
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    canvasContainer.style.display = 'block';
    
    // Usar Quagga para detecção contínua
    Quagga.init({
        inputStream: {
            type: "LiveStream",
            constraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            target: videoElement
        },
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "upc_reader",
                "upce_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_ean_reader"
            ],
            debug: {
                showCanvas: false,
                showPatternInternal: false
            }
        }
    }, function(err) {
        if (err) {
            console.error('Erro ao inicializar Quagga:', err);
            return;
        }
        
        Quagga.onDetected(function(data) {
            if (data.codeResult.code) {
                detectedBarcodeValue = data.codeResult.code;
                barcodeDetected = true;
                document.getElementById('detectedBarcode').textContent = detectedBarcodeValue;
                document.getElementById('detectedBarcode').style.color = 'var(--secondary)';
                
                // Som de sucesso (opcional)
                playSuccessSound();
            }
        });
        
        Quagga.start();
    });
}

function closeCameraScanner() {
    // Parar a câmera
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    // Parar Quagga
    try {
        Quagga.stop();
    } catch (e) {
        console.log('Quagga já foi parado');
    }
    
    // Fechar modal
    document.getElementById('cameraModal').style.display = 'none';
    document.getElementById('cameraVideo').srcObject = null;
    document.getElementById('canvas-container').style.display = 'none';
    
    // Reset
    detectedBarcodeValue = null;
    barcodeDetected = false;
    document.getElementById('detectedBarcode').textContent = '-';
    document.getElementById('detectedBarcode').style.color = 'var(--dark)';
}

function confirmCameraBarcode() {
    if (!detectedBarcodeValue) {
        alert('Nenhum código de barras foi detectado ainda. Tente novamente.');
        return;
    }
    
    // Fechar câmera e passar código para input
    closeCameraScanner();
    document.getElementById('barcodeInput').value = detectedBarcodeValue;
    document.getElementById('barcodeInput').focus();
    
    // Processar imediatamente
    setTimeout(() => {
        scanBarcode();
    }, 100);
}

// Som de sucesso ao detectar código
function playSuccessSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// ============================================
// RECONHECIMENTO DE IMAGEM COM ml5.js
// ============================================
let classifier = null;

// Inicializar classificador quando a página carregar
async function initializeImageClassifier() {
    try {
        classifier = await ml5.imageClassifier('MobileNet', () => {
            console.log('Classificador carregado!');
        });
    } catch (error) {
        console.error('Erro ao carregar classificador:', error);
    }
}

// Chamar ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    initializeImageClassifier();
});

function handleProductImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        recognizeProductImage(imageData);
    };
    reader.readAsDataURL(file);
}

async function recognizeProductImage(imageData) {
    if (!classifier) {
        alert('Classificador ainda está carregando. Aguarde um momento...');
        return;
    }

    // Mostrar loading
    document.getElementById('recognitionLoading').style.display = 'flex';
    document.getElementById('imageRecognitionResult').style.display = 'none';

    try {
        // Criar elemento img temporário para classificação
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            // Fazer predição
            const results = await classifier.predict(img);
            
            // Pegar resultado com maior confiança
            const topResult = results[0];
            
            // Exibir resultado
            displayRecognitionResult(imageData, topResult.label);
            
            document.getElementById('recognitionLoading').style.display = 'none';
        };
        img.src = imageData;
    } catch (error) {
        console.error('Erro ao reconhecer imagem:', error);
        alert('Erro ao processar imagem. Tente novamente.');
        document.getElementById('recognitionLoading').style.display = 'none';
    }
}

function displayRecognitionResult(imageData, productName) {
    document.getElementById('recognizedImage').src = imageData;
    document.getElementById('recognizedProductName').value = productName;
    document.getElementById('recognizedBarcode').value = '';
    document.getElementById('recognizedQuantity').value = '1';
    document.getElementById('recognizedPrice').value = '';
    document.getElementById('recognizedExpiry').value = '';
    
    document.getElementById('imageRecognitionResult').style.display = 'flex';
}

function clearRecognitionResult() {
    document.getElementById('imageRecognitionResult').style.display = 'none';
    document.getElementById('productImageUpload').value = '';
}

function addRecognizedProduct() {
    const name = document.getElementById('recognizedProductName').value;
    const code = document.getElementById('recognizedBarcode').value;
    const quantity = parseInt(document.getElementById('recognizedQuantity').value) || 1;
    const price = parseFloat(document.getElementById('recognizedPrice').value);
    const expiry = document.getElementById('recognizedExpiry').value;
    const image = document.getElementById('recognizedImage').src;

    if (!code) {
        alert('Por favor, digite o código de barras!');
        document.getElementById('recognizedBarcode').focus();
        return;
    }

    if (!price || price <= 0) {
        alert('Por favor, digite um preço válido!');
        document.getElementById('recognizedPrice').focus();
        return;
    }

    // Criar produto
    const product = {
        id: Date.now(),
        code,
        name,
        price,
        quantity,
        expiry,
        image,
        category: 'manual'
    };

    // Adicionar ao carrinho
    const cartItem = cart.find(item => item.code === code);
    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        cart.push(product);
    }

    saveToLocalStorage(STORAGE_KEYS.CART, cart);
    renderCart();
    clearRecognitionResult();
    
    // Voltar para aba de código de barras
    document.querySelector('[onclick="switchCarrinhoTab(\'barcode\')"]').click();
    alert('Produto adicionado ao carrinho com sucesso!');
}
function scanBarcode() {
    const barcode = document.getElementById('barcodeInput').value.trim();
    if (!barcode) return;

    const product = products.find(p => p.code === barcode);
    if (!product) {
        alert('Produto não encontrado!');
        document.getElementById('barcodeInput').value = '';
        return;
    }

    // Add to cart or increase quantity
    const cartItem = cart.find(item => item.id === product.id);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveToLocalStorage(STORAGE_KEYS.CART, cart);
    renderCart();
    document.getElementById('barcodeInput').value = '';
    document.getElementById('barcodeInput').focus();
}

function renderCart() {
    const cartContainer = document.getElementById('cartItems');

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-message">Carrinho vazio. Adicione produtos escaneando o código de barras.</p>';
        updateCartTotal();
        return;
    }

    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>Código: ${item.code}</p>
                <p>Quantidade: 
                    <button type="button" onclick="updateQuantity(${index}, -1)" style="width: 30px; cursor: pointer;">-</button>
                    ${item.quantity}
                    <button type="button" onclick="updateQuantity(${index}, 1)" style="width: 30px; cursor: pointer;">+</button>
                </p>
            </div>
            <div class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2)}</div>
            <button type="button" onclick="removeFromCart(${index})" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    updateCartTotal();
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        renderCart();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveToLocalStorage(STORAGE_KEYS.CART, cart);
    renderCart();
}

function updateCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = subtotal - discount;

    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
}

function clearCart() {
    if (confirm('Deseja cancelar a venda?')) {
        cart = [];
        saveToLocalStorage(STORAGE_KEYS.CART, cart);
        renderCart();
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('Carrinho vazio!');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = subtotal - discount;

    sales.push({
        date: new Date().toISOString(),
        items: [...cart],
        total: total
    });

    saveToLocalStorage(STORAGE_KEYS.SALES, sales);
    alert(`Venda finalizada! Total: R$ ${total.toFixed(2)}`);
    clearCart();
    updateDashboard();
}

// ============================================
// PÁGINA: ADICIONAR PRODUTO
// ============================================
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            preview.dataset.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function handleAddProduct(event) {
    event.preventDefault();

    const code = document.getElementById('productCode').value;
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const imageData = document.getElementById('imagePreview').dataset.imageData || '';

    if (!code || !name || !price) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }

    const product = {
        id: Date.now(),
        code,
        name,
        price,
        category,
        image: imageData
    };

    products.push(product);
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, products);

    // Reset form
    event.target.reset();
    document.getElementById('imagePreview').innerHTML = '<i class="fas fa-image"></i><p>Selecione uma imagem</p>';
    delete document.getElementById('imagePreview').dataset.imageData;

    renderProductsList();
    updateDashboard();
    alert('Produto adicionado com sucesso!');
}

function renderProductsList() {
    const container = document.getElementById('productsList');

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum produto cadastrado ainda.</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<i class="fas fa-image" style="font-size: 48px; color: #ddd;"></i>'}
            <h4>${product.name}</h4>
            <p>${product.code}</p>
            <p>R$ ${product.price.toFixed(2)}</p>
            <p>${product.category}</p>
            <button type="button" onclick="deleteProduct(${product.id})" class="btn-delete" style="width: 100%; margin-top: 10px;">
                <i class="fas fa-trash"></i> Deletar
            </button>
        </div>
    `).join('');
}

function deleteProduct(id) {
    if (confirm('Deseja deletar este produto?')) {
        products = products.filter(p => p.id !== id);
        saveToLocalStorage(STORAGE_KEYS.PRODUCTS, products);
        renderProductsList();
        updateDashboard();
    }
}

// ============================================
// PÁGINA: CLIENTES
// ============================================
function handleAddClient(event) {
    event.preventDefault();

    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const email = document.getElementById('clientEmail').value;
    const address = document.getElementById('clientAddress').value;

    const client = {
        id: Date.now(),
        name,
        phone,
        email,
        address,
        totalSpent: 0
    };

    clients.push(client);
    saveToLocalStorage(STORAGE_KEYS.CLIENTS, clients);

    event.target.reset();
    renderClientsList();
    updateDashboard();
    alert('Cliente adicionado com sucesso!');
}

function renderClientsList() {
    const tbody = document.getElementById('clientsTableBody');

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Nenhum cliente cadastrado.</td></tr>';
        return;
    }

    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.phone || '-'}</td>
            <td>${client.email || '-'}</td>
            <td>R$ ${client.totalSpent.toFixed(2)}</td>
            <td>
                <button type="button" onclick="deleteClient(${client.id})" class="btn-delete">
                    <i class="fas fa-trash"></i> Deletar
                </button>
            </td>
        </tr>
    `).join('');
}

function deleteClient(id) {
    if (confirm('Deseja deletar este cliente?')) {
        clients = clients.filter(c => c.id !== id);
        saveToLocalStorage(STORAGE_KEYS.CLIENTS, clients);
        renderClientsList();
        updateDashboard();
    }
}

// ============================================
// PÁGINA: GERENCIAR IMAGENS
// ============================================
function handleImageUpload(event) {
    const files = event.target.files;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = {
                id: Date.now() + Math.random(),
                data: e.target.result,
                name: file.name
            };
            images.push(image);
            saveToLocalStorage(STORAGE_KEYS.IMAGES, images);
            renderImagesGallery();
        };
        reader.readAsDataURL(file);
    });

    event.target.value = '';
}

function renderImagesGallery() {
    const gallery = document.getElementById('imagesGallery');

    if (images.length === 0) {
        gallery.innerHTML = '<p class="empty-message">Nenhuma imagem cadastrada.</p>';
        return;
    }

    gallery.innerHTML = images.map(image => `
        <div class="image-item">
            <img src="${image.data}" alt="${image.name}">
            <div class="image-item-overlay">
                <button type="button" onclick="deleteImage(${image.id})" class="image-item-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function deleteImage(id) {
    if (confirm('Deseja deletar esta imagem?')) {
        images = images.filter(img => img.id !== id);
        saveToLocalStorage(STORAGE_KEYS.IMAGES, images);
        renderImagesGallery();
    }
}

// ============================================
// UTILITÁRIOS
// ============================================
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Exposição de funções globais
window.switchPage = switchPage;
window.handleLogout = handleLogout;
window.switchCarrinhoTab = switchCarrinhoTab;
window.startCameraScanner = startCameraScanner;
window.closeCameraScanner = closeCameraScanner;
window.confirmCameraBarcode = confirmCameraBarcode;
window.scanBarcode = scanBarcode;
window.handleProductImageUpload = handleProductImageUpload;
window.addRecognizedProduct = addRecognizedProduct;
window.clearRecognitionResult = clearRecognitionResult;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.checkout = checkout;
window.previewImage = previewImage;
window.deleteProduct = deleteProduct;
window.deleteClient = deleteClient;
window.deleteImage = deleteImage;
window.handleImageUpload = handleImageUpload;
