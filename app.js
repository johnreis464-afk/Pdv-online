// app.js - Aplicação principal do PDV
class PDVApp {
    constructor() {
        this.cart = [];
        this.currentProduct = null;
        this.scanner = new BarcodeScanner();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCartFromStorage();
        this.updateCartDisplay();
    }

    bindEvents() {
        // Eventos do scanner
        document.addEventListener('productFound', (e) => {
            this.showProductInfo(e.detail);
        });

        document.addEventListener('productNotFound', (e) => {
            console.log('Produto não encontrado:', e.detail);
        });

        // Botão de busca manual
        document.getElementById('btnScan').addEventListener('click', () => {
            this.scanner.handleManualBarcode();
        });

        // Botão adicionar ao carrinho
        document.getElementById('btnAddToCart').addEventListener('click', () => {
            this.addToCart();
        });

        // Botão fechar info do produto
        document.getElementById('btnCloseProduct').addEventListener('click', () => {
            this.hideProductInfo();
        });

        // Botão limpar carrinho
        document.getElementById('btnClearCart').addEventListener('click', () => {
            this.clearCart();
        });

        // Botão finalizar venda
        document.getElementById('btnCheckout').addEventListener('click', () => {
            this.showCheckoutModal();
        });

        // Modal de checkout
        document.getElementById('btnCloseModal').addEventListener('click', () => {
            this.hideCheckoutModal();
        });

        document.getElementById('btnCancelSale').addEventListener('click', () => {
            this.hideCheckoutModal();
        });

        document.getElementById('btnConfirmSale').addEventListener('click', () => {
            this.confirmSale();
        });

        // Calcular troco para pagamento em dinheiro
        document.getElementById('cashAmount').addEventListener('input', (e) => {
            this.calculateChange(e.target.value);
        });

        // Mudança no método de pagamento
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleCashPayment(e.target.value);
            });
        });

        // Botões de relatórios e produtos
        document.getElementById('btnReports').addEventListener('click', () => {
            this.showReports();
        });

        document.getElementById('btnProducts').addEventListener('click', () => {
            this.showProducts();
        });

        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    showProductInfo(product) {
        this.currentProduct = product;
        
        document.getElementById('productName').textContent = product.name;
        document.getElementById('productBarcode').textContent = `Código: ${product.barcode}`;
        document.getElementById('productPrice').textContent = `R$ ${product.price.toFixed(2)}`;
        document.getElementById('productStock').textContent = `Estoque: ${product.stock} unidades`;
        
        document.getElementById('productInfo').classList.remove('hidden');
        
        // Rollar para a seção do produto
        document.getElementById('productInfo').scrollIntoView({ 
            behavior: 'smooth',
            block: 'nearest'
        });
    }

    hideProductInfo() {
        document.getElementById('productInfo').classList.add('hidden');
        this.currentProduct = null;
    }

    addToCart() {
        if (!this.currentProduct) return;

        const existingItem = this.cart.find(item => item.product.id === this.currentProduct.id);
        
        if (existingItem) {
            // Verificar estoque
            if (existingItem.quantity >= this.currentProduct.stock) {
                this.showNotification('Estoque insuficiente!', 'error');
                return;
            }
            existingItem.quantity++;
            existingItem.subtotal = existingItem.quantity * existingItem.unitPrice;
        } else {
            // Verificar estoque para novo item
            if (this.currentProduct.stock < 1) {
                this.showNotification('Produto sem estoque!', 'error');
                return;
            }
            
            this.cart.push({
                product: this.currentProduct,
                productName: this.currentProduct.name,
                barcode: this.currentProduct.barcode,
                quantity: 1,
                unitPrice: this.currentProduct.price,
                subtotal: this.currentProduct.price
            });
        }

        this.updateCartDisplay();
        this.saveCartToStorage();
        this.showNotification('Produto adicionado ao carrinho!', 'success');
        this.hideProductInfo();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.updateCartDisplay();
        this.saveCartToStorage();
    }

    updateQuantity(index, newQuantity) {
        if (newQuantity < 1) {
            this.removeFromCart(index);
            return;
        }

        // Verificar estoque
        const product = this.cart[index].product;
        if (newQuantity > product.stock) {
            this.showNotification(`Estoque insuficiente! Disponível: ${product.stock}`, 'error');
            return;
        }

        this.cart[index].quantity = newQuantity;
        this.cart[index].subtotal = newQuantity * this.cart[index].unitPrice;
        
        this.updateCartDisplay();
        this.saveCartToStorage();
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        const cartTable = document.getElementById('cartTable');
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');

        if (this.cart.length === 0) {
            emptyCart.classList.remove('hidden');
            cartTable.classList.add('hidden');
            cartCount.textContent = '0 itens';
            cartTotal.textContent = '0,00';
            return;
        }

        emptyCart.classList.add('hidden');
        cartTable.classList.remove('hidden');

        // Calcular total
        const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
        
        cartCount.textContent = `${this.cart.length} ${this.cart.length === 1 ? 'item' : 'itens'}`;
        cartTotal.textContent = total.toFixed(2);

        // Atualizar itens
        cartItems.innerHTML = this.cart.map((item, index) => `
            <tr>
                <td>
                    <strong>${item.productName}</strong><br>
                    <small style="color: #666;">${item.barcode}</small>
                </td>
                <td>R$ ${item.unitPrice.toFixed(2)}</td>
                <td>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="pdvApp.updateQuantity(${index}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input 
                            type="number" 
                            class="quantity-input" 
                            value="${item.quantity}" 
                            min="1"
                            onchange="pdvApp.updateQuantity(${index}, parseInt(this.value))"
                        >
                        <button class="quantity-btn" onclick="pdvApp.updateQuantity(${index}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
                <td><strong>R$ ${item.subtotal.toFixed(2)}</strong></td>
                <td>
                    <button class="btn btn-danger" onclick="pdvApp.removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Tem certeza que deseja limpar o carrinho?')) {
            this.cart = [];
            this.updateCartDisplay();
            this.saveCartToStorage();
            this.showNotification('Carrinho limpo!', 'success');
        }
    }

    showCheckoutModal() {
        if (this.cart.length === 0) {
            this.showNotification('Carrinho vazio!', 'warning');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
        document.getElementById('checkoutTotal').textContent = total.toFixed(2);
        
        // Resetar modal
        document.getElementById('cashAmount').value = '';
        document.getElementById('cashChange').classList.add('hidden');
        document.querySelector('input[name="paymentMethod"][value="dinheiro"]').checked = true;
        this.toggleCashPayment('dinheiro');
        
        document.getElementById('checkoutModal').classList.remove('hidden');
    }

    hideCheckoutModal() {
        document.getElementById('checkoutModal').classList.add('hidden');
    }

    toggleCashPayment(paymentMethod) {
        const cashPayment = document.getElementById('cashPayment');
        if (paymentMethod === 'dinheiro') {
            cashPayment.classList.remove('hidden');
        } else {
            cashPayment.classList.add('hidden');
        }
    }

    calculateChange(cashAmount) {
        const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
        const change = parseFloat(cashAmount) - total;
        const cashChange = document.getElementById('cashChange');
        const changeAmount = document.getElementById('changeAmount');

        if (change >= 0) {
            cashChange.classList.remove('hidden');
            changeAmount.textContent = change.toFixed(2);
        } else {
            cashChange.classList.add('hidden');
        }
    }

    async confirmSale() {
        try {
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            const cashAmount = document.getElementById('cashAmount').value;
            const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0);

            // Validar pagamento em dinheiro
            if (paymentMethod === 'dinheiro' && (!cashAmount || parseFloat(cashAmount) < total)) {
                this.showNotification('Valor em dinheiro insuficiente!', 'error');
                return;
            }

            const saleData = {
                items: this.cart.map(item => ({
                    product: item.product.id,
                    productName: item.productName,
                    barcode: item.barcode,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal
                })),
                total: total,
                paymentMethod: paymentMethod,
                customerChange: paymentMethod === 'dinheiro' ? (parseFloat(cashAmount) - total) : 0
            };

            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saleData)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`Venda ${result.sale.saleNumber} registrada com sucesso!`, 'success');
                this.cart = [];
                this.updateCartDisplay();
                this.saveCartToStorage();
                this.hideCheckoutModal();
            } else {
                this.showNotification(`Erro: ${result.message}`, 'error');
            }

        } catch (error) {
            console.error('Erro ao registrar venda:', error);
            this.showNotification('Erro ao conectar com o servidor', 'error');
        }
    }

    showReports() {
        window.open('/reports.html', '_blank');
    }

    showProducts() {
        // Implementar tela de produtos
        this.showNotification('Funcionalidade em desenvolvimento', 'info');
    }

    handleKeyboardShortcuts(e) {
        // F1 - Focar no campo de código de barras
        if (e.key === 'F1') {
            e.preventDefault();
            document.getElementById('barcodeInput').focus();
        }
        
        // F2 - Finalizar venda
        if (e.key === 'F2' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            this.showCheckoutModal();
        }
        
        // F3 - Limpar carrinho
        if (e.key === 'F3' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            this.clearCart();
        }
        
        // ESC - Fechar modais
        if (e.key === 'Escape') {
            this.hideProductInfo();
            this.hideCheckoutModal();
        }
    }

    saveCartToStorage() {
        localStorage.setItem('pdv_cart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('pdv_cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            this.cart = [];
        }
    }

    showNotification(message, type = 'info') {
        this.scanner.showNotification(message, type);
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.pdvApp = new PDVApp();
    console.log('🛒 Sistema PDV inicializado!');
});

// Funções globais para acesso via HTML
window.addSampleProducts = async function() {
    try {
        const response = await fetch('/api/seed-products', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ ${result.count} produtos de exemplo inseridos!`);
        } else {
            alert('❌ Erro ao inserir produtos: ' + result.message);
        }
    } catch (error) {
        alert('❌ Erro ao conectar com o servidor');
    }
};