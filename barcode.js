// barcode.js - Gerenciamento do leitor de código de barras
class BarcodeScanner {
    constructor() {
        this.barcodeInput = document.getElementById('barcodeInput');
        this.lastBarcode = '';
        this.barcodeTimeout = null;
        this.init();
    }

    init() {
        // Event listener para entrada de código de barras
        this.barcodeInput.addEventListener('input', (e) => {
            this.handleBarcodeInput(e.target.value);
        });

        // Event listener para tecla Enter
        this.barcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleManualBarcode();
            }
        });

        // Focar automaticamente no campo
        this.barcodeInput.focus();

        // Permitir colar código de barras
        this.barcodeInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.handleBarcodeInput(e.target.value);
            }, 100);
        });
    }

    handleBarcodeInput(value) {
        // Limpar timeout anterior
        if (this.barcodeTimeout) {
            clearTimeout(this.barcodeTimeout);
        }

        // Se o campo estiver vazio, resetar
        if (!value.trim()) {
            this.lastBarcode = '';
            return;
        }

        // Se for um código muito longo (provavelmente de leitor)
        if (value.length >= 8 && value !== this.lastBarcode) {
            this.lastBarcode = value;
            
            // Timeout para detectar fim da leitura
            this.barcodeTimeout = setTimeout(() => {
                this.processBarcode(value);
            }, 150);
        }
    }

    handleManualBarcode() {
        const value = this.barcodeInput.value.trim();
        if (value && value.length >= 3) { // Código mínimo de 3 caracteres
            this.processBarcode(value);
        }
    }

    async processBarcode(barcode) {
        try {
            // Mostrar loading
            this.showNotification('Buscando produto...', 'info');
            
            // Buscar produto na API
            const response = await fetch(`/api/products/barcode/${barcode}`);
            const data = await response.json();
            
            if (data.success) {
                this.onProductFound(data.product);
            } else {
                this.onProductNotFound(barcode, data.message);
            }
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            this.showNotification('Erro ao conectar com o servidor', 'error');
        } finally {
            // Limpar campo após processamento
            setTimeout(() => {
                this.barcodeInput.value = '';
                this.barcodeInput.focus();
            }, 500);
        }
    }

    onProductFound(product) {
        // Disparar evento customizado
        const event = new CustomEvent('productFound', { detail: product });
        document.dispatchEvent(event);
        
        this.showNotification(`Produto encontrado: ${product.name}`, 'success');
    }

    onProductNotFound(barcode, message) {
        this.showNotification(`Produto não encontrado: ${barcode}`, 'error');
        
        // Disparar evento para produto não encontrado
        const event = new CustomEvent('productNotFound', { 
            detail: { barcode, message } 
        });
        document.dispatchEvent(event);
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 
                    type === 'success' ? '✅' : 'ℹ️';
        
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        `;
        
        notifications.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Método para simular leitura de código de barras (para testes)
    simulateBarcode(barcode) {
        this.barcodeInput.value = barcode;
        this.processBarcode(barcode);
    }
}