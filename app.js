calculateLineItem(e.target.closest('.line-item'));
            calculateInvoiceTotal();
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item')) {
            removeLineItem(e.target.closest('.line-item'));
            calculateInvoiceTotal();
        }
    });
}

function addLineItem(item = null) {
    const container = document.getElementById('line-items-container');
    if (!container) return;

    const lineItem = document.createElement('div');
    lineItem.className = 'line-item';
    lineItem.innerHTML = `
        <div class="form-row">
            <div class="form-group" style="grid-column: span 2;">
                <input type="text" class="form-control" placeholder="Description" value="${item ? item.description : ''}" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-control quantity" placeholder="Qty" min="1" value="${item ? item.quantity : 1}" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-control rate" placeholder="Rate" min="0" step="0.01" value="${item ? item.rate : ''}" required>
            </div>
            <div class="form-group">
                <input type="number" class="form-control amount" placeholder="Amount" value="${item ? item.amount : ''}" readonly>
            </div>
            <div style="display: flex; align-items: end;">
                <button type="button" class="btn btn--secondary btn--sm remove-item">🗑️ Remove</button>
            </div>
        </div>
    `;
    container.appendChild(lineItem);

    if (item) {
        calculateLineItem(lineItem);
    }
}

function removeLineItem(lineItem) {
    const container = document.getElementById('line-items-container');
    if (container && container.children.length > 1 && lineItem) {
        lineItem.remove();
    }
}

function calculateLineItem(lineItem) {
    if (!lineItem) return;

    const quantityInput = lineItem.querySelector('.quantity');
    const rateInput = lineItem.querySelector('.rate');
    const amountInput = lineItem.querySelector('.amount');

    if (quantityInput && rateInput && amountInput) {
        const quantity = parseFloat(quantityInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const amount = quantity * rate;
        amountInput.value = amount.toFixed(2);
    }
}

function calculateInvoiceTotal() {
    const lineItems = document.querySelectorAll('.line-item');
    let subtotal = 0;

    lineItems.forEach(item => {
        const amountInput = item.querySelector('.amount');
        if (amountInput) {
            subtotal += parseFloat(amountInput.value) || 0;
        }
    });

    const taxRate = appData.settings.taxRate / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    document.getElementById('invoice-subtotal').textContent = `₹${formatNumber(subtotal)}`;
    document.getElementById('invoice-tax').textContent = `₹${formatNumber(tax)}`;
    document.getElementById('invoice-total').textContent = `₹${formatNumber(total)}`;
    document.getElementById('invoice-tax-label').textContent = `Tax (${appData.settings.taxRate}%):`;
}

async function saveInvoice(status) {
    console.log('💾 Saving enhanced invoice with status:', status);

    const invoiceNumber = document.getElementById('invoice-number').value;
    const clientId = document.getElementById('invoice-client').value;

    if (!clientId) {
        showToast('❌ Please select a client', 'error');
        return;
    }

    const client = appData.clients.find(c => c.id === clientId);
    if (!client) {
        showToast('❌ Selected client not found', 'error');
        return;
    }

    const lineItems = [];
    const lineItemElements = document.querySelectorAll('.line-item');

    lineItemElements.forEach(item => {
        const descInput = item.querySelector('input[placeholder="Description"]');
        const quantityInput = item.querySelector('.quantity');
        const rateInput = item.querySelector('.rate');
        const amountInput = item.querySelector('.amount');

        if (descInput && quantityInput && rateInput && amountInput) {
            const description = descInput.value.trim();
            const quantity = parseFloat(quantityInput.value);
            const rate = parseFloat(rateInput.value);
            const amount = parseFloat(amountInput.value);

            if (description && quantity && rate) {
                lineItems.push({ description, quantity, rate, amount });
            }
        }
    });

    if (lineItems.length === 0) {
        showToast('❌ Please add at least one line item', 'error');
        return;
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (appData.settings.taxRate / 100);
    const total = subtotal + tax;

    const invoice = {
        id: invoiceNumber,
        clientId: clientId,
        client: client.name,
        amount: total,
        subtotal: subtotal,
        tax: tax,
        date: document.getElementById('issue-date').value,
        dueDate: document.getElementById('due-date').value,
        status: status,
        items: lineItems
    };

    try {
        const createBtn = document.getElementById('create-invoice');
        const originalHTML = createBtn.innerHTML;
        createBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
        createBtn.disabled = true;

        await saveInvoiceToSupabase(invoice);

        if (editingInvoiceId) {
            const index = appData.invoices.findIndex(inv => inv.id === editingInvoiceId);
            if (index > -1) {
                appData.invoices[index] = invoice;
            }
            showToast(`✅ Invoice ${invoiceNumber} updated successfully! 🎉`, 'success');
        } else {
            appData.invoices.unshift(invoice);
            appData.totalInvoices++;
            showToast(`🎉 Invoice ${invoiceNumber} ${status === 'Draft' ? 'saved as draft' : 'created'} successfully!`, 'success');
        }

        calculateMonthlyEarnings();
        renderInvoices();
        renderDashboard();
        renderClients();
        closeModal(document.getElementById('invoice-modal'));

        createBtn.innerHTML = originalHTML;
        createBtn.disabled = false;
    } catch (error) {
        console.error('❌ Error saving invoice:', error);
        showToast('❌ Error saving invoice. Please try again.', 'error');
        
        const createBtn = document.getElementById('create-invoice');
        createBtn.innerHTML = editingInvoiceId ? '<span>💾</span> Update Invoice' : '<span>🚀</span> Create Invoice';
        createBtn.disabled = false;
    }
}

function setupClientForm() {
    document.getElementById('save-client')?.addEventListener('click', saveClient);
    document.getElementById('cancel-client')?.addEventListener('click', () => closeModal(document.getElementById('client-modal')));
}

async function saveClient() {
    console.log('💾 Saving enhanced client... Editing ID:', editingClientId);

    const formFields = {
        company: document.getElementById('client-company'),
        email: document.getElementById('client-email'),
        phone: document.getElementById('client-phone'),
        address: document.getElementById('client-address'),
        terms: document.getElementById('client-terms'),
        contactName: document.getElementById('client-contact-name')
    };

    if (!formFields.company || !formFields.email) {
        showToast('❌ Company name and email are required', 'error');
        return;
    }

    const clientData = {
        name: formFields.company.value.trim(),
        email: formFields.email.value.trim(),
        phone: formFields.phone ? formFields.phone.value.trim() : '',
        address: formFields.address ? formFields.address.value.trim() : '',
        paymentTerms: formFields.terms ? formFields.terms.value : 'net30',
        contactName: formFields.contactName ? formFields.contactName.value.trim() : '',
        company: formFields.company.value.trim()
    };

    if (!clientData.name || !clientData.email) {
        showToast('❌ Company name and email are required', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
        showToast('❌ Please enter a valid email address', 'error');
        return;
    }

    try {
        const saveBtn = document.getElementById('save-client');
        const spinner = saveBtn.querySelector('.loading-spinner');
        const text = saveBtn.querySelector('span:last-child');
        
        spinner.classList.remove('hidden');
        text.textContent = 'Saving...';
        saveBtn.disabled = true;

        const savedClient = await saveClientToSupabase(clientData);

        if (editingClientId) {
            const index = appData.clients.findIndex(c => c.id === editingClientId);
            if (index > -1) {
                appData.clients[index] = {
                    ...appData.clients[index],
                    ...savedClient,
                    total_invoices: appData.clients[index].total_invoices,
                    total_amount: appData.clients[index].total_amount
                };
            }
            showToast(`🎉 Client "${savedClient.name}" updated successfully!`, 'success');
        } else {
            const newClient = {
                ...savedClient,
                total_invoices: 0,
                total_amount: 0
            };
            appData.clients.push(newClient);
            appData.totalClients++;
            showToast(`🎉 Client "${newClient.name}" added successfully!`, 'success');
        }

        renderClients();
        closeModal(document.getElementById('client-modal'));
        editingClientId = null;

    } catch (error) {
        console.error('❌ Error saving client:', error);
        showToast(`❌ Error saving client: ${error.message}`, 'error');
    } finally {
        const saveBtn = document.getElementById('save-client');
        const spinner = saveBtn.querySelector('.loading-spinner');
        const text = saveBtn.querySelector('span:last-child');
        
        spinner.classList.add('hidden');
        text.textContent = editingClientId ? 'Update Client' : 'Save Client';
        saveBtn.disabled = false;
    }
}

function setupSettingsForm() {
    document.getElementById('save-settings')?.addEventListener('click', saveSettings);
    document.getElementById('reset-settings')?.addEventListener('click', resetSettings);
}

async function saveSettings() {
    console.log('⚙️ Saving enhanced settings...');

    const elements = {
        currency: document.getElementById('currency-setting'),
        taxRate: document.getElementById('tax-rate'),
        invoicePrefix: document.getElementById('invoice-prefix'),
        profileName: document.getElementById('profile-name'),
        profileEmail: document.getElementById('profile-email'),
        profilePhone: document.getElementById('profile-phone'),
        profileAddress: document.getElementById('profile-address'),
        profileGSTIN: document.getElementById('profile-gstin'),
        bankName: document.getElementById('bank-name'),
        bankAccount: document.getElementById('bank-account'),
        bankIFSC: document.getElementById('bank-ifsc'),
        bankSWIFT: document.getElementById('bank-swift')
    };

    const settingsData = {};
    Object.entries(elements).forEach(([key, element]) => {
        if (element) {
            if (key === 'taxRate') {
                const value = parseFloat(element.value);
                if (isNaN(value) || value < 0 || value > 100) {
                    showToast('❌ Tax rate must be between 0 and 100', 'error');
                    element.focus();
                    return;
                }
                settingsData[key] = value;
            } else {
                settingsData[key] = element.value?.trim() || '';
            }
        }
    });

    if (!settingsData.profileName || !settingsData.profileEmail) {
        showToast('❌ Profile name and email are required', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settingsData.profileEmail)) {
        showToast('❌ Please enter a valid email address', 'error');
        return;
    }

    try {
        const saveBtn = document.getElementById('save-settings');
        const spinner = saveBtn.querySelector('.loading-spinner');
        const text = saveBtn.querySelector('span:last-child');
        
        spinner.classList.remove('hidden');
        text.textContent = 'Saving...';
        saveBtn.disabled = true;

        await saveSettingsToSupabase(settingsData);
        Object.assign(appData.settings, settingsData);

        showToast(`🎉 Settings saved successfully! Tax rate: ${appData.settings.taxRate}%`, 'success');

    } catch (error) {
        console.error('❌ Error saving settings:', error);
        showToast(`❌ Error saving settings: ${error.message}`, 'error');
    } finally {
        const saveBtn = document.getElementById('save-settings');
        const spinner = saveBtn.querySelector('.loading-spinner');
        const text = saveBtn.querySelector('span:last-child');
        
        spinner.classList.add('hidden');
        text.textContent = 'Save Settings';
        saveBtn.disabled = false;
    }
}

function resetSettings() {
    if (confirm('🔄 Are you sure you want to reset all settings to default?')) {
        appData.settings = {
            currency: 'INR',
            taxRate: 0,
            invoicePrefix: 'HP-2526',
            profileName: 'Hariprasad Sivakumar',
            profileEmail: 'contact@hariprasadss.com',
            profilePhone: '+91 9876543210',
            profileAddress: '6/91, Mahit Complex, Hosur Road, Attibele, Bengaluru, Karnataka – 562107',
            profileGSTIN: '29GLOPS9921M1ZT',
            bankName: 'HARIPRASAD SIVAKUMAR',
            bankAccount: '',
            bankIFSC: '',
            bankSWIFT: ''
        };
        renderSettings();
        showToast('🔄 Settings reset to default successfully!', 'success');
    }
}

// Utility Functions
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('❌ Error formatting date:', dateString, error);
        return 'Invalid Date';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ENHANCED: Professional toast notifications with modern animations
function showToast(message, type = 'info') {
    console.log('🍞 Enhanced Toast:', type, message);

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `enhanced-toast ${type}`;

    // Enhanced icons with better visual design
    const icons = {
        success: '🎉',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };

    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon" style="color: ${colors[type]};">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.closest('.enhanced-toast').remove()">&times;</button>
        </div>
        <div class="toast-progress" style="background: ${colors[type]};"></div>
    `;

    // Enhanced toast styles
    if (!document.getElementById('enhanced-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 420px;
                pointer-events: none;
            }

            .enhanced-toast {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                border: 1px solid #e5e7eb;
                min-width: 320px;
                animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
                position: relative;
                overflow: hidden;
                pointer-events: auto;
                transform-origin: right center;
            }

            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                position: relative;
                z-index: 2;
            }

            .toast-icon {
                font-size: 24px;
                flex-shrink: 0;
                animation: bounceIn 0.6s ease-out;
            }

            .toast-message {
                flex: 1;
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                line-height: 1.4;
            }

            .toast-close {
                background: none;
                border: none;
                font-size: 20px;
                color: #9ca3af;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .toast-close:hover {
                background: #f3f4f6;
                color: #6b7280;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                width: 100%;
                transform-origin: left;
                animation: progressBar 4s linear forwards;
            }

            .enhanced-toast.success {
                border-left: 4px solid #10B981;
            }

            .enhanced-toast.error {
                border-left: 4px solid #EF4444;
            }

            .enhanced-toast.warning {
                border-left: 4px solid #F59E0B;
            }

            .enhanced-toast.info {
                border-left: 4px solid #3B82F6;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%) scale(0.9);
                    opacity: 0;
                }
                to {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%) scale(0.9);
                    opacity: 0;
                }
            }

            @keyframes bounceIn {
                0% {
                    transform: scale(0.3);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.1);
                }
                70% {
                    transform: scale(0.9);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes progressBar {
                from {
                    transform: scaleX(1);
                }
                to {
                    transform: scaleX(0);
                }
            }

            .enhanced-toast.removing {
                animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
            }

            @media (max-width: 480px) {
                .toast-container {
                    left: 12px;
                    right: 12px;
                    top: 12px;
                    max-width: none;
                }

                .enhanced-toast {
                    min-width: auto;
                }

                .toast-content {
                    padding: 14px 16px;
                }

                .toast-message {
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    container.appendChild(toast);

    // Auto remove with enhanced animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 4000);

    // Click to dismiss
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    });
}

// Global error handler for better debugging
window.addEventListener('error', (event) => {
    console.error('💥 Global error caught:', event.error);
    showToast('❌ An unexpected error occurred. Check console for details.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled promise rejection:', event.reason);
    showToast('❌ A network or database error occurred. Please try again.', 'error');
});

// Performance monitoring
const performanceMonitor = {
    startTime: Date.now(),

    logTiming(label) {
        const currentTime = Date.now();
        const elapsed = currentTime - this.startTime;
        console.log(`⏱️ ${label}: ${elapsed}ms`);
    },

    logMemory() {
        if (performance.memory) {
            console.log('💾 Memory Usage:', {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
            });
        }
    }
};

// Enhanced keyboard shortcuts for power users
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N for new invoice
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const createBtn = document.getElementById('create-invoice-btn');
        if (createBtn && !document.querySelector('.modal:not(.hidden)')) {
            createBtn.click();
            showToast('⚡ Quick shortcut: Ctrl+N for new invoice', 'info');
        }
    }

    // Ctrl/Cmd + K for new client
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const addClientBtn = document.getElementById('add-client-btn');
        if (addClientBtn && !document.querySelector('.modal:not(.hidden)')) {
            addClientBtn.click();
            showToast('⚡ Quick shortcut: Ctrl+K for new client', 'info');
        }
    }

    // Ctrl/Cmd + S for save (in modals)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) {
            e.preventDefault();
            const saveBtn = openModal.querySelector('#save-client, #create-invoice');
            if (saveBtn && !saveBtn.disabled) {
                saveBtn.click();
                showToast('⚡ Quick save: Ctrl+S', 'info');
            }
        }
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) {
            closeModal(openModal);
        }
        
        // Also close confirmation dialogs
        const confirmDialog = document.querySelector('.enhanced-confirmation-overlay');
        if (confirmDialog) {
            confirmDialog.remove();
        }
    }
});

// Debug helpers for development
if (window.location.hostname === 'localhost' || window.location.hostname.includes('local')) {
    window.debugApp = {
        appData,
        analyticsState,
        clearLocalStorage: () => {
            localStorage.clear();
            location.reload();
        },
        exportDebugData: () => exportData('json'),
        simulateError: () => {
            throw new Error('Simulated error for testing');
        },
        testToast: (type = 'info') => {
            showToast(`🧪 Test ${type} message with enhanced styling`, type);
        },
        testAnalytics: () => {
            console.log('📊 Analytics State:', analyticsState);
            console.log('📈 Current period:', analyticsState.currentPeriod);
            console.log('🔍 Filtered data:', analyticsState.filteredData?.length || 0, 'invoices');
        },
        debugClients: () => {
            console.log('👥 All clients:', appData.clients);
            console.log('✏️ Editing client ID:', editingClientId);
        },
        testEnhancedPDF: (invoiceId) => {
            console.log('📄 Testing enhanced PDF for:', invoiceId);
            downloadEnhancedInvoice(invoiceId);
        },
        validateGSTIN: (gstin) => {
            const isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
            console.log('🏦 GSTIN validation:', gstin, isValid ? '✅ Valid' : '❌ Invalid');
        },
        performanceStats: () => {
            performanceMonitor.logTiming('Current session');
            performanceMonitor.logMemory();
        }
    };
    
    console.log('🔧 Enhanced Debug helpers available: window.debugApp');
    console.log('🎯 Key functions:');
    console.log('  • debugApp.testEnhancedPDF("invoice-id") - Test PDF generation');
    console.log('  • debugApp.testToast("success") - Test toast notifications');
    console.log('  • debugApp.validateGSTIN("gstin") - Validate GSTIN format');
    console.log('  • debugApp.performanceStats() - Show performance metrics');
}

// Final initialization message
console.log(`
🎉 Enhanced Invoice Manager Loaded Successfully!
✨ Features: Professional PDFs, Modern Analytics, Enhanced UX
⚡ Shortcuts: Ctrl+N (New Invoice), Ctrl+K (New Client), Ctrl+S (Save)
🔧 Debug tools available in development mode
`);

// Export functionality for data backup
function exportData(format = 'json') {
    const data = {
        clients: appData.clients,
        invoices: appData.invoices,
        settings: appData.settings,
        exportDate: new Date().toISOString(),
        version: '2.0-enhanced'
    };

    if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-invoice-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📊 Enhanced data exported successfully!', 'success');
    }
}        // TO SECTION - Enhanced client information
        doc.setFillColor(16, 185, 129);
        doc.rect(120, 115, 4, 25, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text('BILL TO:', 130, 125);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(client ? client.name : invoice.client, 130, 135);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        
        if (client && client.contact_name) {
            doc.text(`Contact: ${client.contact_name}`, 130, 143);
        }
        
        if (client && client.address) {
            const clientAddressLines = client.address.split('\n');
            let clientYPos = client.contact_name ? 149 : 143;
            clientAddressLines.forEach(line => {
                doc.text(line.trim(), 130, clientYPos);
                clientYPos += 5;
            });
        }

        // ITEMS TABLE - Professional design with enhanced styling
        const tableStartY = 180;
        const tableData = invoice.items.map((item, index) => [
            `${index + 1}. ${item.description}`,
            item.quantity.toString(),
            `₹${formatNumber(item.rate)}`,
            `₹${formatNumber(item.amount)}`
        ]);

        doc.autoTable({
            head: [['DESCRIPTION', 'QTY', 'UNIT PRICE', 'AMOUNT']],
            body: tableData,
            startY: tableStartY,
            theme: 'grid',
            headStyles: { 
                fillColor: [31, 184, 205],
                textColor: [255, 255, 255],
                fontSize: 11,
                fontStyle: 'bold',
                halign: 'center',
                cellPadding: 12,
                lineColor: [255, 255, 255],
                lineWidth: 2
            },
            bodyStyles: {
                fontSize: 10,
                cellPadding: 10,
                lineColor: [226, 232, 240],
                lineWidth: 1
            },
            columnStyles: {
                0: { 
                    cellWidth: 90, 
                    halign: 'left',
                    fontStyle: 'normal'
                },
                1: { 
                    cellWidth: 25, 
                    halign: 'center',
                    fontStyle: 'bold'
                },
                2: { 
                    cellWidth: 35, 
                    halign: 'right',
                    fontStyle: 'normal'
                },
                3: { 
                    cellWidth: 40, 
                    halign: 'right', 
                    fontStyle: 'bold',
                    textColor: [16, 185, 129]
                }
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            styles: {
                overflow: 'linebreak',
                cellWidth: 'wrap'
            }
        });

        // TOTALS SECTION - Enhanced professional design
        const finalY = doc.lastAutoTable.finalY + 20;
        const totalsX = 135;
        
        // Totals background with subtle gradient effect
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(totalsX - 10, finalY - 10, 80, 50, 8, 8, 'F');
        doc.setDrawColor(31, 184, 205);
        doc.setLineWidth(2);
        doc.roundedRect(totalsX - 10, finalY - 10, 80, 50, 8, 8, 'S');
        
        // Subtotal
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Subtotal:', totalsX, finalY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`₹${formatNumber(invoice.subtotal)}`, totalsX + 35, finalY);
        
        // Tax
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Tax (${settings.taxRate}%):`, totalsX, finalY + 8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`₹${formatNumber(invoice.tax)}`, totalsX + 35, finalY + 8);
        
        // Total with emphasis
        doc.setDrawColor(31, 184, 205);
        doc.setLineWidth(2);
        doc.line(totalsX, finalY + 15, totalsX + 60, finalY + 15);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(31, 184, 205);
        doc.text('TOTAL:', totalsX, finalY + 25);
        doc.setFontSize(16);
        doc.text(`₹${formatNumber(invoice.amount)}`, totalsX + 35, finalY + 25);

        // PAYMENT DETAILS SECTION - Enhanced bank information
        if (settings.bankAccount) {
            const bankY = finalY - 5;
            
            // Background for bank details
            doc.setFillColor(16, 185, 129);
            doc.rect(15, bankY, 4, 35, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(16, 185, 129);
            doc.text('PAYMENT DETAILS', 25, bankY + 8);
            
            // Bank details background
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(20, bankY + 12, 100, 25, 6, 6, 'F');
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(1);
            doc.roundedRect(20, bankY + 12, 100, 25, 6, 6, 'S');
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            
            doc.text(`Account Name: ${settings.bankName}`, 25, bankY + 18);
            doc.text(`Account Number: ${settings.bankAccount}`, 25, bankY + 24);
            doc.text(`IFSC Code: ${settings.bankIFSC}`, 25, bankY + 30);
            if (settings.bankSWIFT) {
                doc.text(`SWIFT Code: ${settings.bankSWIFT}`, 25, bankY + 36);
            }
        }

        // FOOTER SECTION - Professional finishing touches
        const footerY = 270;
        
        // Footer line with gradient effect
        doc.setDrawColor(31, 184, 205);
        doc.setLineWidth(3);
        doc.line(20, footerY, 190, footerY);
        
        // Thank you note
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 184, 205);
        doc.text('Thank you for your business! 🙏', 20, footerY + 10);
        
        // Generation timestamp and footer info
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 20, footerY + 18);
        doc.text('This is a computer-generated invoice and does not require a signature.', 20, footerY + 24);
        
        // Add page number
        doc.text('Page 1 of 1', 170, footerY + 18);

        // Save with enhanced filename including date
        const dateString = new Date().toISOString().split('T')[0];
        const clientNameSafe = (client ? client.name : invoice.client).replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Invoice_${invoice.id}_${clientNameSafe}_${dateString}.pdf`;
        
        doc.save(filename);
        
        showToast(`📄 Professional invoice ${invoice.id} downloaded successfully!`, 'success');
        console.log('✅ Enhanced PDF generated successfully:', filename);

    } catch (error) {
        console.error('❌ Error generating enhanced PDF:', error);
        showToast('❌ Error generating PDF. Please try again.', 'error');
    }
}

// Enhanced confirmation for invoice deletion
function confirmDeleteInvoice(invoiceId) {
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    const dialog = document.createElement('div');
    dialog.className = 'enhanced-confirmation-overlay';
    dialog.innerHTML = `
        <div class="enhanced-confirmation-dialog">
            <div class="confirmation-icon-container">
                <div class="confirmation-icon danger">🗑️</div>
            </div>
            
            <div class="confirmation-content">
                <h3 class="confirmation-title">Delete Invoice</h3>
                
                <div class="confirmation-message">
                    <p>Are you sure you want to permanently delete invoice <strong>"${invoiceId}"</strong>?</p>
                    <div class="invoice-details">
                        <div><strong>Client:</strong> ${invoice.client}</div>
                        <div><strong>Amount:</strong> ₹${formatNumber(invoice.amount)}</div>
                        <div><strong>Status:</strong> <span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span></div>
                    </div>
                    <p class="warning-text">⚠️ This action cannot be undone.</p>
                </div>
                
                <div class="confirmation-actions">
                    <button class="modern-btn secondary" onclick="this.closest('.enhanced-confirmation-overlay').remove()">
                        <span>↩️</span> Cancel
                    </button>
                    <button class="modern-btn danger" onclick="executeDeleteInvoice('${invoiceId}'); this.closest('.enhanced-confirmation-overlay').remove();">
                        <span>🗑️</span> Delete Invoice
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Close on outside click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

async function executeDeleteInvoice(invoiceId) {
    try {
        await deleteInvoiceFromSupabase(invoiceId);

        const index = appData.invoices.findIndex(inv => inv.id === invoiceId);
        if (index > -1) {
            const invoice = appData.invoices[index];
            const client = appData.clients.find(c => c.id === invoice.clientId);

            if (client) {
                client.total_invoices = Math.max(0, (client.total_invoices || 0) - 1);
                if (invoice.status === 'Paid') {
                    client.total_amount = Math.max(0, (client.total_amount || 0) - invoice.amount);
                }
            }

            appData.invoices.splice(index, 1);
            appData.totalInvoices = Math.max(0, appData.totalInvoices - 1);

            calculateMonthlyEarnings();

            renderInvoices();
            renderDashboard();
            renderClients();

            showToast(`✅ Invoice ${invoiceId} deleted successfully`, 'success');
        }
    } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        showToast('❌ Error deleting invoice. Please try again.', 'error');
    }
}

// Enhanced invoice viewing with modern modal
function viewInvoice(invoiceId) {
    console.log('👁️ Viewing invoice:', invoiceId);
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        showEnhancedInvoiceModal(invoice);
    }
}

function showEnhancedInvoiceModal(invoice) {
    const client = appData.clients.find(c => c.id === invoice.clientId);
    const settings = appData.settings;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header" style="background: linear-gradient(135deg, #1FB8CD 0%, #10B981 100%); color: white; border-radius: 12px 12px 0 0;">
                <h2 style="display: flex; align-items: center; gap: 0.5rem;">📄 Invoice ${invoice.id}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3);">&times;</button>
            </div>
            <div class="modal-body" style="padding: 0; background: white; color: black;">
                <!-- Enhanced Professional Invoice Preview -->
                <div style="background: linear-gradient(135deg, #1FB8CD 0%, #10B981 100%); color: white; padding: 2.5rem; position: relative; overflow: hidden;">
                    <!-- Background pattern -->
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.1"><circle cx="30" cy="30" r="2"/></g></svg>'); opacity: 0.3;"></div>
                    
                    <div style="position: relative; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h1 style="font-size: 3rem; margin: 0; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">INVOICE</h1>
                            <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 1.1rem;">Professional Invoice Document</p>
                        </div>
                        <div style="text-align: right; background: rgba(255,255,255,0.15); padding: 1.5rem; border-radius: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                            <div style="margin-bottom: 0.5rem; font-size: 0.9rem; opacity: 0.8;">INVOICE NUMBER</div>
                            <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">${invoice.id}</div>
                            <div style="margin-bottom: 0.5rem;"><strong>ISSUED:</strong> ${formatDate(invoice.date)}</div>
                            <div><strong>DUE:</strong> ${formatDate(invoice.dueDate)}</div>
                        </div>
                    </div>
                </div>

                <div style="padding: 2.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem;">
                        <div>
                            <div style="background: linear-gradient(135deg, rgba(31, 184, 205, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #1FB8CD;">
                                <h3 style="color: #1FB8CD; font-size: 1.2rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">🏢 FROM</h3>
                                <div style="line-height: 1.8; color: #374151;">
                                    <div style="font-weight: 700; font-size: 1.1rem; color: #1e293b; margin-bottom: 0.5rem;">${settings.profileName}</div>
                                    ${settings.profileAddress ? settings.profileAddress.replace(/\n/g, '<br>') + '<br>' : ''}
                                    ${settings.profileGSTIN ? `<div style="margin-top: 0.5rem;"><strong>GSTIN:</strong> ${settings.profileGSTIN}</div>` : ''}
                                    ${settings.profilePhone ? `<div style="margin-top: 0.25rem;">📞 ${settings.profilePhone}</div>` : ''}
                                    ${settings.profileEmail ? `<div style="margin-top: 0.25rem;">📧 ${settings.profileEmail}</div>` : ''}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #10B981;">
                                <h3 style="color: #10B981; font-size: 1.2rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">👤 BILL TO</h3>
                                <div style="line-height: 1.8; color: #374151;">
                                    <div style="font-weight: 700; font-size: 1.1rem; color: #1e293b; margin-bottom: 0.5rem;">${client ? client.name : invoice.client}</div>
                                    ${client && client.contact_name ? `<div>Contact: ${client.contact_name}</div>` : ''}
                                    ${client && client.address ? client.address.replace(/\n/g, '<br>') : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Enhanced Items Table -->
                    <div style="margin-bottom: 3rem;">
                        <h3 style="color: #1e293b; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">📋 Invoice Items</h3>
                        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: linear-gradient(135deg, #1FB8CD 0%, #10B981 100%); color: white;">
                                        <th style="padding: 1rem; text-align: left; font-weight: 600;">DESCRIPTION</th>
                                        <th style="padding: 1rem; text-align: center; font-weight: 600;">QTY</th>
                                        <th style="padding: 1rem; text-align: right; font-weight: 600;">UNIT PRICE</th>
                                        <th style="padding: 1rem; text-align: right; font-weight: 600;">AMOUNT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${invoice.items.map((item, index) => `
                                        <tr style="border-bottom: 1px solid #f3f4f6; ${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                                            <td style="padding: 1rem; color: #374151;">${item.description}</td>
                                            <td style="padding: 1rem; text-align: center; font-weight: 600; color: #1f2937;">${item.quantity}</td>
                                            <td style="padding: 1rem; text-align: right; color: #374151;">₹${formatNumber(item.rate)}</td>
                                            <td style="padding: 1rem; text-align: right; font-weight: 700; color: #10B981;">₹${formatNumber(item.amount)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;">
                        <!-- Payment Details -->
                        ${settings.bankAccount ? `
                            <div>
                                <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #F59E0B;">
                                    <h3 style="color: #F59E0B; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">🏦 PAYMENT DETAILS</h3>
                                    <div style="line-height: 1.6; font-size: 0.9rem; color: #374151;">
                                        <div><strong>Account Name:</strong> ${settings.bankName}</div>
                                        <div><strong>Account Number:</strong> ${settings.bankAccount}</div>
                                        <div><strong>IFSC Code:</strong> ${settings.bankIFSC}</div>
                                        ${settings.bankSWIFT ? `<div><strong>SWIFT Code:</strong> ${settings.bankSWIFT}</div>` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Totals -->
                        <div>
                            <div style="background: linear-gradient(135deg, rgba(31, 184, 205, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); padding: 1.5rem; border-radius: 12px; border: 2px solid rgba(31, 184, 205, 0.2);">
                                <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; color: #374151;">
                                    <span>Subtotal:</span>
                                    <span style="font-weight: 600;">₹${formatNumber(invoice.subtotal)}</span>
                                </div>
                                <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; color: #374151;">
                                    <span>Tax (${settings.taxRate}%):</span>
                                    <span style="font-weight: 600;">₹${formatNumber(invoice.tax)}</span>
                                </div>
                                <hr style="border: none; height: 2px; background: linear-gradient(90deg, #1FB8CD, #10B981); margin: 1rem 0;">
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.25rem; font-weight: 700; color: #1e293b;">
                                    <span>TOTAL:</span>
                                    <span style="color: #1FB8CD;">₹${formatNumber(invoice.amount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="background: #f9fafb; border-top: 1px solid #e5e7eb;">
                <button class="btn btn--secondary" onclick="this.closest('.modal').remove()">Close</button>
                <button class="btn btn--primary" onclick="downloadEnhancedInvoice('${invoice.id}')" style="background: linear-gradient(135deg, #1FB8CD, #10B981);">
                    📥 Download Enhanced PDF
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function editInvoice(invoiceId) {
    console.log('✏️ Editing invoice:', invoiceId);
    openInvoiceModal(invoiceId);
}

// Enhanced modal and form setup functions
function setupModals() {
    console.log('🔧 Setting up enhanced modals...');

    // Invoice modal
    const invoiceModal = document.getElementById('invoice-modal');
    const invoiceModalOverlay = document.getElementById('invoice-modal-overlay');
    const closeInvoiceModal = document.getElementById('close-invoice-modal');

    document.getElementById('create-invoice-btn')?.addEventListener('click', () => openInvoiceModal());
    document.getElementById('new-invoice-btn')?.addEventListener('click', () => openInvoiceModal());

    invoiceModalOverlay?.addEventListener('click', () => closeModal(invoiceModal));
    closeInvoiceModal?.addEventListener('click', () => closeModal(invoiceModal));

    // Client modal
    const clientModal = document.getElementById('client-modal');
    const clientModalOverlay = document.getElementById('client-modal-overlay');
    const closeClientModal = document.getElementById('close-client-modal');

    document.getElementById('add-client-btn')?.addEventListener('click', () => openClientModal());
    clientModalOverlay?.addEventListener('click', () => closeModal(clientModal));
    closeClientModal?.addEventListener('click', () => closeModal(clientModal));
}

async function openInvoiceModal(invoiceId = null) {
    console.log('📝 Opening enhanced invoice modal...', invoiceId ? 'for editing' : 'for creation');
    const modal = document.getElementById('invoice-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    editingInvoiceId = invoiceId;

    if (invoiceId) {
        const invoice = appData.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            document.getElementById('invoice-modal-title').textContent = '✏️ Edit Invoice';
            document.getElementById('create-invoice').innerHTML = '<span>💾</span> Update Invoice';
            
            // Populate form fields
            document.getElementById('invoice-number').value = invoice.id;
            document.getElementById('issue-date').value = invoice.date;
            document.getElementById('due-date').value = invoice.dueDate;

            // Populate client dropdown
            const clientSelect = document.getElementById('invoice-client');
            clientSelect.innerHTML = '<option value="">Select Client</option>' +
                appData.clients.map(client =>
                    `<option value="${client.id}" ${client.id === invoice.clientId ? 'selected' : ''}>${client.name}</option>`
                ).join('');

            // Populate line items
            const container = document.getElementById('line-items-container');
            container.innerHTML = '';
            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach(item => addLineItem(item));
            } else {
                addLineItem();
            }
            calculateInvoiceTotal();
        }
    } else {
        document.getElementById('invoice-modal-title').textContent = '✨ Create New Invoice';
        document.getElementById('create-invoice').innerHTML = '<span>🚀</span> Create Invoice';
        
        // Generate new invoice number
        try {
            const num = await getNextInvoiceNumber();
            document.getElementById('invoice-number').value = `${appData.settings.invoicePrefix}-${String(num).padStart(3, '0')}`;
        } catch (error) {
            document.getElementById('invoice-number').value = `${appData.settings.invoicePrefix}-${String(Date.now()).slice(-3)}`;
        }

        // Set dates
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        document.getElementById('issue-date').value = today;
        document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];

        // Populate clients
        const clientSelect = document.getElementById('invoice-client');
        clientSelect.innerHTML = '<option value="">Select Client</option>' +
            appData.clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');

        // Reset line items
        const container = document.getElementById('line-items-container');
        container.innerHTML = '';
        addLineItem();
    }
}

function openClientModal() {
    console.log('👥 Opening enhanced client modal...');
    const modal = document.getElementById('client-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    
    if (!editingClientId) {
        document.getElementById('client-modal-title').textContent = '✨ Add New Client';
        const saveBtn = document.getElementById('save-client');
        if (saveBtn) {
            saveBtn.innerHTML = '<span class="loading-spinner hidden"></span><span>💾 Save Client</span>';
        }
        const form = document.getElementById('client-form');
        if (form) form.reset();
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        editingInvoiceId = null;
        editingClientId = null;
    }
}

function setupForms() {
    setupInvoiceForm();
    setupClientForm();
    setupSettingsForm();
}

function setupInvoiceForm() {
    document.getElementById('add-line-item')?.addEventListener('click', () => addLineItem());
    document.getElementById('create-invoice')?.addEventListener('click', () => saveInvoice('Pending'));
    document.getElementById('save-draft')?.addEventListener('click', () => saveInvoice('Draft'));

    // Handle line item calculations
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity') || e.target.classList.contains('rate')) {
            calculateLineItem(e.target.                .legend-color {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .chart-canvas-container {
                    position: relative;
                    height: 400px;
                    background: rgba(31, 184, 205, 0.02);
                    border-radius: 1rem;
                    padding: 1rem;
                }

                .enhanced-insights-panel {
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    padding: 2rem;
                    border-radius: 1.5rem;
                    border: 2px solid #e2e8f0;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .enhanced-insights-panel::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 6px;
                    background: linear-gradient(90deg, #F59E0B 0%, #EF4444 50%, #8B5CF6 100%);
                }

                .enhanced-insights-panel:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 64px rgba(0,0,0,0.15);
                }

                .insights-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #f1f5f9;
                }

                .insights-title-section h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .insights-subtitle {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin: 0;
                }

                .insights-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .enhanced-insight-card {
                    background: linear-gradient(135deg, rgba(31, 184, 205, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
                    padding: 1.5rem;
                    border-radius: 1rem;
                    border: 1px solid rgba(31, 184, 205, 0.1);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .enhanced-insight-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: linear-gradient(180deg, #1FB8CD, #10B981);
                    transition: width 0.3s ease;
                }

                .enhanced-insight-card:hover::before {
                    width: 8px;
                }

                .enhanced-insight-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(31, 184, 205, 0.15);
                    border-color: rgba(31, 184, 205, 0.2);
                }

                .insight-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .insight-icon {
                    font-size: 1.5rem;
                    padding: 0.5rem;
                    background: rgba(31, 184, 205, 0.1);
                    border-radius: 0.5rem;
                    border: 1px solid rgba(31, 184, 205, 0.2);
                }

                .insight-label {
                    font-size: 0.875rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                    margin: 0;
                }

                .insight-main-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .insight-description {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .insight-metrics {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
                    gap: 1rem;
                }

                .insight-metric {
                    text-align: center;
                    padding: 0.75rem;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 0.5rem;
                    border: 1px solid rgba(31, 184, 205, 0.1);
                }

                .insight-metric-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1FB8CD;
                    margin-bottom: 0.25rem;
                }

                .insight-metric-label {
                    font-size: 0.75rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                }

                @media (max-width: 1024px) {
                    .enhanced-analytics-grid {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }
                }

                @media (max-width: 768px) {
                    .analytics-chart-header {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .insight-metrics {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    const dataToUse = analyticsState.filteredData || appData.invoices;
    
    setTimeout(() => {
        renderAnalyticsChart(analyticsState.currentPeriod, dataToUse);
        renderEnhancedTopClientInsights(dataToUse);
    }, 100);
}

function renderAnalyticsChart(period, invoices) {
    const analyticsCtx = document.getElementById('analyticsChart');
    if (!analyticsCtx) return;

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    let earningsData = [];
    let label = '';
    let subtitle = '';

    if (period === 'quarterly') {
        earningsData = calculateQuarterlyEarnings(invoices);
        label = 'Quarterly Earnings';
        subtitle = 'Comprehensive quarterly performance analysis with growth trends';
    } else if (period === 'yearly') {
        earningsData = calculateYearlyEarnings(invoices);
        label = 'Yearly Earnings';
        subtitle = 'Annual revenue comparison with year-over-year insights';
    } else {
        earningsData = calculateMonthlyEarningsForData(invoices);
        label = 'Monthly Earnings';
        subtitle = 'Month-by-month revenue tracking with detailed breakdowns';
    }

    const subtitleElement = document.getElementById('dynamic-chart-subtitle');
    if (subtitleElement) {
        subtitleElement.textContent = subtitle;
    }

    analyticsChart = new Chart(analyticsCtx, {
        type: 'bar',
        data: {
            labels: earningsData.map(m => m.month),
            datasets: [{
                label: label,
                data: earningsData.map(m => m.amount),
                backgroundColor: (ctx) => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(31, 184, 205, 0.8)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
                    return gradient;
                },
                borderColor: '#1FB8CD',
                borderWidth: 3,
                borderRadius: {
                    topLeft: 8,
                    topRight: 8
                },
                borderSkipped: false,
                hoverBackgroundColor: (ctx) => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(31, 184, 205, 1)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 1)');
                    return gradient;
                },
                hoverBorderColor: '#0891B2',
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#1FB8CD',
                    borderWidth: 2,
                    cornerRadius: 12,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13,
                        weight: '500'
                    },
                    callbacks: {
                        title: function(context) {
                            return `📅 ${context[0].label}`;
                        },
                        label: function(context) {
                            return `💰 Revenue: ₹${formatNumber(context.raw)}`;
                        },
                        afterLabel: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                            return `📊 ${percentage}% of total`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + formatNumber(value);
                        },
                        color: '#64748b',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        maxRotation: 45
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function calculateMonthlyEarningsForData(invoices) {
    const monthlyData = new Map();

    invoices
        .filter(inv => inv.status === 'Paid')
        .forEach(({ date, amount }) => {
            const d = new Date(date);
            if (Number.isNaN(d)) return;
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + amount);
        });

    return Array.from(monthlyData, ([month, amount]) => ({ month, amount }))
                 .sort((a, b) => a.month.localeCompare(b.month));
}

function renderEnhancedTopClientInsights(invoices) {
    const insightsContainer = document.getElementById('enhanced-analytics-insights');
    if (!insightsContainer) return;

    const clientEarnings = new Map();
    const clientInvoiceCounts = new Map();
    const clientNames = new Map();

    invoices.forEach(invoice => {
        const clientId = invoice.clientId;
        const clientName = invoice.client;
        
        clientNames.set(clientId, clientName);
        
        if (invoice.status === 'Paid') {
            clientEarnings.set(clientId, (clientEarnings.get(clientId) || 0) + invoice.amount);
        }
        clientInvoiceCounts.set(clientId, (clientInvoiceCounts.get(clientId) || 0) + 1);
    });

    // Find top client
    let topClientId = null;
    let topClientEarnings = 0;
    let topClientName = 'N/A';

    for (const [clientId, earnings] of clientEarnings.entries()) {
        if (earnings > topClientEarnings) {
            topClientEarnings = earnings;
            topClientId = clientId;
            topClientName = clientNames.get(clientId) || 'Unknown';
        }
    }

    const totalPaidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalEarnings = totalPaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const averageInvoice = totalPaidInvoices.length > 0 ? totalEarnings / totalPaidInvoices.length : 0;
    const totalInvoices = invoices.length;

    // Calculate period info
    let periodInfo = 'All time';
    if (analyticsState.dateRange.from && analyticsState.dateRange.to) {
        periodInfo = `${analyticsState.dateRange.from} to ${analyticsState.dateRange.to}`;
    }

    // Calculate some additional metrics
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const draftInvoices = invoices.filter(inv => inv.status === 'Draft');
    
    // Calculate growth rate (simplified)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && 
               invDate.getFullYear() === currentYear && 
               inv.status === 'Paid';
    });
    const currentMonthEarnings = currentMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === lastMonth && 
               invDate.getFullYear() === lastMonthYear && 
               inv.status === 'Paid';
    });
    const lastMonthEarnings = lastMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const growthRate = lastMonthEarnings > 0 ? 
        ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100) : 0;

    insightsContainer.innerHTML = `
        <!-- Top Performance Card -->
        <div class="enhanced-insight-card">
            <div class="insight-header">
                <div class="insight-icon">🏆</div>
                <div class="insight-label">Top Performing Client</div>
            </div>
            <div class="insight-main-value">
                <span>👤</span> ${topClientName}
            </div>
            <div class="insight-description">
                Leading revenue contributor generating the highest income for your business
            </div>
            <div class="insight-metrics">
                <div class="insight-metric">
                    <div class="insight-metric-value">₹${formatNumber(topClientEarnings)}</div>
                    <div class="insight-metric-label">Revenue</div>
                </div>
                <div class="insight-metric">
                    <div class="insight-metric-value">${clientInvoiceCounts.get(topClientId) || 0}</div>
                    <div class="insight-metric-label">Invoices</div>
                </div>
            </div>
        </div>

        <!-- Revenue Overview Card -->
        <div class="enhanced-insight-card">
            <div class="insight-header">
                <div class="insight-icon">💰</div>
                <div class="insight-label">Revenue Overview</div>
            </div>
            <div class="insight-main-value">
                <span>📈</span> ₹${formatNumber(totalEarnings)}
            </div>
            <div class="insight-description">
                Total revenue generated from ${totalPaidInvoices.length} paid invoices
            </div>
            <div class="insight-metrics">
                <div class="insight-metric">
                    <div class="insight-metric-value">₹${formatNumber(averageInvoice)}</div>
                    <div class="insight-metric-label">Avg Invoice</div>
                </div>
                <div class="insight-metric">
                    <div class="insight-metric-value">${((totalPaidInvoices.length / totalInvoices) * 100).toFixed(1)}%</div>
                    <div class="insight-metric-label">Success Rate</div>
                </div>
            </div>
        </div>

        <!-- Business Health Card -->
        <div class="enhanced-insight-card">
            <div class="insight-header">
                <div class="insight-icon">📊</div>
                <div class="insight-label">Business Health</div>
            </div>
            <div class="insight-main-value">
                <span>${growthRate >= 0 ? '📈' : '📉'}</span> ${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%
            </div>
            <div class="insight-description">
                Month-over-month growth rate showing business trajectory
            </div>
            <div class="insight-metrics">
                <div class="insight-metric">
                    <div class="insight-metric-value">₹${formatNumber(pendingAmount)}</div>
                    <div class="insight-metric-label">Pending</div>
                </div>
                <div class="insight-metric">
                    <div class="insight-metric-value">${draftInvoices.length}</div>
                    <div class="insight-metric-label">Drafts</div>
                </div>
            </div>
        </div>

        <!-- Period Summary Card -->
        <div class="enhanced-insight-card">
            <div class="insight-header">
                <div class="insight-icon">🗓️</div>
                <div class="insight-label">Analysis Period</div>
            </div>
            <div class="insight-main-value">
                <span>📅</span> ${analyticsState.currentPeriod.charAt(0).toUpperCase() + analyticsState.currentPeriod.slice(1)}
            </div>
            <div class="insight-description">
                ${periodInfo} • ${totalInvoices} total invoices analyzed
            </div>
            <div class="insight-metrics">
                <div class="insight-metric">
                    <div class="insight-metric-value">${appData.clients.length}</div>
                    <div class="insight-metric-label">Clients</div>
                </div>
                <div class="insight-metric">
                    <div class="insight-metric-value">${new Set(invoices.map(inv => inv.clientId)).size}</div>
                    <div class="insight-metric-label">Active</div>
                </div>
            </div>
        </div>
    `;
}

// Enhanced settings rendering with better UX
function renderSettings() {
    console.log('⚙️ Rendering enhanced settings...');

    if (!appData.dataLoaded) {
        console.log('⚠️ Data not loaded yet, skipping settings render');
        return;
    }

    const settings = appData.settings;

    const elements = {
        'profile-name': settings.profileName,
        'profile-email': settings.profileEmail,
        'profile-phone': settings.profilePhone,
        'profile-address': settings.profileAddress,
        'profile-gstin': settings.profileGSTIN,
        'bank-name': settings.bankName,
        'bank-account': settings.bankAccount,
        'bank-ifsc': settings.bankIFSC,
        'bank-swift': settings.bankSWIFT,
        'currency-setting': settings.currency,
        'tax-rate': settings.taxRate,
        'invoice-prefix': settings.invoicePrefix
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = (value !== null && value !== undefined) ? value : '';
            
            // Add enhanced visual feedback
            element.addEventListener('focus', () => {
                element.style.transform = 'translateY(-2px)';
                element.style.boxShadow = '0 8px 25px rgba(31, 184, 205, 0.15)';
            });
            
            element.addEventListener('blur', () => {
                element.style.transform = 'translateY(0)';
                element.style.boxShadow = '';
            });
        } else if (id === 'profile-gstin') {
            // Add GSTIN field if it doesn't exist
            const addressField = document.getElementById('profile-address');
            if (addressField && addressField.parentNode) {
                const gstinGroup = document.createElement('div');
                gstinGroup.className = 'form-group';
                gstinGroup.innerHTML = `
                    <label for="profile-gstin" class="form-label">GSTIN</label>
                    <input type="text" class="form-control" id="profile-gstin" placeholder="e.g., 29GLOPS9921M1ZT" value="${value || ''}">
                `;
                addressField.parentNode.parentNode.insertBefore(gstinGroup, addressField.parentNode.nextSibling);
            }
        }
    });

    // Enhanced tax rate field with suggestions
    const taxRateField = document.getElementById('tax-rate');
    if (taxRateField) {
        let datalist = document.getElementById('tax-rate-options');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'tax-rate-options';
            datalist.innerHTML = `
                <option value="0">0% - No Tax</option>
                <option value="5">5% - Reduced Rate</option>
                <option value="12">12% - Standard Rate</option>
                <option value="18">18% - Higher Rate</option>
                <option value="28">28% - Luxury Rate</option>
            `;
            taxRateField.parentNode.appendChild(datalist);
        }
        taxRateField.setAttribute('list', 'tax-rate-options');
        taxRateField.setAttribute('placeholder', 'e.g., 0, 18');
        
        if (!document.getElementById('tax-rate-helper')) {
            const helper = document.createElement('small');
            helper.id = 'tax-rate-helper';
            helper.style.cssText = 'display: block; margin-top: 4px; color: #64748b; font-size: 11px;';
            helper.textContent = '💡 Enter 0 for no tax, or your applicable GST percentage';
            taxRateField.parentNode.appendChild(helper);
        }
    }

    console.log('✅ Enhanced settings rendered with tax rate:', settings.taxRate);
}

// ENHANCED: Professional PDF invoice generator with modern design
async function downloadEnhancedInvoice(invoiceId) {
    console.log('📥 Generating enhanced professional PDF for invoice:', invoiceId);
    
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        showToast('❌ Invoice not found', 'error');
        return;
    }

    const client = appData.clients.find(c => c.id === invoice.clientId);
    const settings = appData.settings;

    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
        showToast('📄 PDF library is loading. Please try again in a moment.', 'info');
        
        // Try to load it again
        loadPDFLibrary();
        
        // Wait and retry
        setTimeout(() => downloadEnhancedInvoice(invoiceId), 2000);
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // PROFESSIONAL HEADER DESIGN
        // Gradient header background
        doc.setFillColor(31, 184, 205);
        doc.rect(0, 0, 220, 50, 'F');
        
        // Add subtle pattern overlay
        doc.setFillColor(255, 255, 255);
        doc.setGState(new doc.GState({opacity: 0.1}));
        for (let i = 0; i < 220; i += 20) {
            doc.circle(i, 25, 15, 'F');
        }
        doc.setGState(new doc.GState({opacity: 1}));

        // Main invoice title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 20, 30);
        
        // Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Professional Invoice Document', 20, 40);

        // BRAND SECTION - Modern company branding
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(140, 10, 70, 30, 8, 8, 'F');
        
        // Company name in brand box
        doc.setTextColor(31, 184, 205);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('HARIPRASAD', 145, 22);
        doc.text('SIVAKUMAR', 145, 32);
        
        // Add a subtle border
        doc.setDrawColor(31, 184, 205);
        doc.setLineWidth(2);
        doc.roundedRect(140, 10, 70, 30, 8, 8, 'S');

        // Reset colors and add spacing
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);

        // INVOICE DETAILS SECTION - Modern card design
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(130, 60, 75, 45, 8, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(130, 60, 75, 45, 8, 8, 'S');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('INVOICE DETAILS', 135, 70);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        
        doc.text('Invoice Number:', 135, 78);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.id, 135, 84);
        
        doc.setFont('helvetica', 'normal');
        doc.text('Date of Issue:', 135, 92);
        doc.setFont('helvetica', 'bold');
        doc.text(formatDate(invoice.date), 135, 98);
        
        doc.setFont('helvetica', 'normal');
        doc.text('Due Date:', 160, 92);
        doc.setFont('helvetica', 'bold');
        doc.text(formatDate(invoice.dueDate), 160, 98);

        // FROM SECTION - Enhanced layout
        doc.setFillColor(31, 184, 205);
        doc.rect(15, 115, 4, 25, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(31, 184, 205);
        doc.text('FROM:', 25, 125);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(settings.profileName, 25, 135);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        
        let yPos = 143;
        const addressLines = settings.profileAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line.trim(), 25, yPos);
            yPos += 5;
        });
        
        if (settings.profileGSTIN) {
            doc.setFont('helvetica', 'bold');
            doc.text('GSTIN: ', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(settings.profileGSTIN, 45, yPos);
            yPos += 6;
        }
        
        if (settings.profilePhone) {
            doc.text(`📞 ${settings.profilePhone}`, 25, yPos);
            yPos += 5;
        }
        
        if (settings.profileEmail) {
            doc.text(`📧 ${settings.profileEmail}`, 25, yPos);
        }

        // TO SECTION - Enhanced client information
        doc.setFillColor(    showToast(`📊 Showing ${visibleCount} ${filter === 'all' ? '' : filter} invoices`, 'info');
}

// ENHANCED: Modern client cards with animations and better UX
function renderClients() {
    console.log('👥 Rendering enhanced modern client cards...');
    const grid = document.getElementById('clients-grid');
    if (!grid || !appData.dataLoaded) {
        console.log('⚠️ Grid not found or data not loaded');
        return;
    }

    // Add enhanced client card styles
    if (!document.getElementById('modern-client-styles')) {
        const style = document.createElement('style');
        style.id = 'modern-client-styles';
        style.textContent = `
            .clients-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 1.5rem;
                animation: fadeInUp 0.6s ease-out;
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .modern-client-card {
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                border-radius: 1.5rem;
                border: 2px solid #e2e8f0;
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }

            .modern-client-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 6px;
                background: linear-gradient(90deg, #1FB8CD 0%, #10B981 50%, #F59E0B 100%);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .modern-client-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                border-color: #1FB8CD;
            }

            .modern-client-card:hover::before {
                opacity: 1;
            }

            .client-card-header {
                padding: 1.5rem;
                background: linear-gradient(135deg, rgba(31, 184, 205, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
                border-bottom: 1px solid #f1f5f9;
            }

            .client-main-info {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
            }

            .client-identity {
                flex: 1;
            }

            .client-name {
                font-size: 1.5rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 0.5rem;
                line-height: 1.2;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .client-name::before {
                content: '🏢';
                font-size: 1.25rem;
            }

            .client-email {
                font-size: 0.875rem;
                color: #64748b;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
            }

            .client-actions {
                display: flex;
                gap: 0.5rem;
                flex-shrink: 0;
            }

            .modern-action-btn {
                width: 44px;
                height: 44px;
                border-radius: 12px;
                border: 2px solid;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 1.25rem;
                position: relative;
                overflow: hidden;
            }

            .modern-action-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                transition: all 0.3s ease;
                transform: translate(-50%, -50%);
            }

            .modern-action-btn:hover::before {
                width: 100%;
                height: 100%;
            }

            .modern-action-btn.edit {
                border-color: #F59E0B;
                color: #F59E0B;
            }

            .modern-action-btn.edit::before {
                background: rgba(245, 158, 11, 0.1);
            }

            .modern-action-btn.edit:hover {
                transform: translateY(-3px) scale(1.1);
                box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
                border-color: #D97706;
                color: #D97706;
            }

            .modern-action-btn.delete {
                border-color: #EF4444;
                color: #EF4444;
            }

            .modern-action-btn.delete::before {
                background: rgba(239, 68, 68, 0.1);
            }

            .modern-action-btn.delete:hover {
                transform: translateY(-3px) scale(1.1);
                box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
                border-color: #DC2626;
                color: #DC2626;
            }

            .client-details-section {
                padding: 1.5rem;
            }

            .client-detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .client-detail-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                background: rgba(31, 184, 205, 0.05);
                border-radius: 0.75rem;
                border: 1px solid rgba(31, 184, 205, 0.1);
                font-size: 0.875rem;
                color: #374151;
                transition: all 0.2s ease;
            }

            .client-detail-item:hover {
                background: rgba(31, 184, 205, 0.1);
                transform: translateY(-1px);
            }

            .client-detail-icon {
                font-size: 1.25rem;
                flex-shrink: 0;
            }

            .client-stats-section {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
                padding: 1.5rem;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-top: 1px solid #e2e8f0;
            }

            .client-stat-card {
                text-align: center;
                padding: 1rem;
                background: white;
                border-radius: 1rem;
                border: 1px solid #e2e8f0;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .client-stat-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #1FB8CD, #10B981);
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }

            .client-stat-card:hover::before {
                transform: scaleX(1);
            }

            .client-stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }

            .client-stat-value {
                font-size: 1.75rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 0.25rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }

            .client-stat-label {
                font-size: 0.75rem;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: 600;
            }

            .empty-state {
                grid-column: 1 / -1;
                text-align: center;
                padding: 4rem 2rem;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 1.5rem;
                border: 2px dashed #cbd5e1;
                animation: fadeInUp 0.6s ease-out;
            }

            .empty-state-icon {
                font-size: 4rem;
                margin-bottom: 1.5rem;
                opacity: 0.7;
            }

            .empty-state-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: #374151;
                margin-bottom: 0.5rem;
            }

            .empty-state-subtitle {
                color: #6b7280;
                margin-bottom: 1.5rem;
            }

            .empty-state-action {
                background: linear-gradient(135deg, #1FB8CD, #10B981);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }

            .empty-state-action:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(31, 184, 205, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    if (appData.clients.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3 class="empty-state-title">No clients yet</h3>
                <p class="empty-state-subtitle">Add your first client to start creating professional invoices</p>
                <button class="empty-state-action" onclick="openClientModal()">
                    <span>✨</span> Add Your First Client
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = appData.clients.map((client, index) => `
        <div class="modern-client-card" style="animation-delay: ${index * 0.1}s;">
            <div class="client-card-header">
                <div class="client-main-info">
                    <div class="client-identity">
                        <div class="client-name">${escapeHtml(client.name)}</div>
                        <div class="client-email">
                            <span class="client-detail-icon">📧</span>
                            ${escapeHtml(client.email)}
                        </div>
                    </div>
                    <div class="client-actions">
                        <button class="modern-action-btn edit" onclick="editClient('${client.id}')" title="Edit Client">
                            ✏️
                        </button>
                        <button class="modern-action-btn delete" onclick="showEnhancedDeleteConfirmation('${client.id}', '${escapeHtml(client.name)}')" title="Delete Client">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="client-details-section">
                <div class="client-detail-grid">
                    ${client.phone ? `
                        <div class="client-detail-item">
                            <span class="client-detail-icon">📞</span>
                            <span>${escapeHtml(client.phone)}</span>
                        </div>
                    ` : ''}
                    ${client.contact_name ? `
                        <div class="client-detail-item">
                            <span class="client-detail-icon">👤</span>
                            <span>${escapeHtml(client.contact_name)}</span>
                        </div>
                    ` : ''}
                    ${client.address ? `
                        <div class="client-detail-item" style="grid-column: 1 / -1;">
                            <span class="client-detail-icon">📍</span>
                            <span>${escapeHtml(client.address)}</span>
                        </div>
                    ` : ''}
                    <div class="client-detail-item">
                        <span class="client-detail-icon">⏰</span>
                        <span>Payment: ${client.payment_terms || 'Net 30 days'}</span>
                    </div>
                </div>
            </div>
            
            <div class="client-stats-section">
                <div class="client-stat-card">
                    <div class="client-stat-value">
                        <span>📄</span>
                        ${client.total_invoices || 0}
                    </div>
                    <div class="client-stat-label">Invoices</div>
                </div>
                <div class="client-stat-card">
                    <div class="client-stat-value">
                        <span>💰</span>
                        ₹${formatNumber(client.total_amount || 0)}
                    </div>
                    <div class="client-stat-label">Revenue</div>
                </div>
            </div>
        </div>
    `).join('');

    console.log('✅ Enhanced client cards rendered successfully');
}

// ENHANCED: Professional confirmation dialog with animations
function showEnhancedDeleteConfirmation(clientId, clientName) {
    const clientInvoices = appData.invoices.filter(inv => inv.clientId === clientId);
    
    const dialog = document.createElement('div');
    dialog.className = 'enhanced-confirmation-overlay';
    dialog.innerHTML = `
        <div class="enhanced-confirmation-dialog">
            <div class="confirmation-icon-container">
                <div class="confirmation-icon ${clientInvoices.length > 0 ? 'warning' : 'danger'}">
                    ${clientInvoices.length > 0 ? '⚠️' : '🗑️'}
                </div>
            </div>
            
            <div class="confirmation-content">
                <h3 class="confirmation-title">
                    ${clientInvoices.length > 0 ? 'Cannot Delete Client' : 'Delete Client'}
                </h3>
                
                <div class="confirmation-message">
                    ${clientInvoices.length > 0 ? 
                        `<p><strong>"${clientName}"</strong> cannot be deleted because they have <strong>${clientInvoices.length} active invoice(s)</strong>.</p>
                         <p class="suggestion">💡 <em>Delete their invoices first, then you can remove this client.</em></p>` :
                        `<p>Are you sure you want to permanently delete <strong>"${clientName}"</strong>?</p>
                         <p class="warning-text">⚠️ This action cannot be undone.</p>`
                    }
                </div>
                
                <div class="confirmation-actions">
                    <button class="modern-btn secondary" onclick="this.closest('.enhanced-confirmation-overlay').remove()">
                        <span>↩️</span> Cancel
                    </button>
                    ${clientInvoices.length === 0 ? 
                        `<button class="modern-btn danger" onclick="executeDeleteClient('${clientId}', '${clientName}'); this.closest('.enhanced-confirmation-overlay').remove();">
                            <span>🗑️</span> Delete Client
                        </button>` :
                        `<button class="modern-btn secondary" onclick="this.closest('.enhanced-confirmation-overlay').remove();" style="opacity: 0.6;" disabled>
                            <span>🚫</span> Cannot Delete
                        </button>`
                    }
                </div>
            </div>
        </div>
    `;

    // Add enhanced confirmation styles
    if (!document.getElementById('enhanced-confirmation-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-confirmation-styles';
        style.textContent = `
            .enhanced-confirmation-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .enhanced-confirmation-dialog {
                background: white;
                border-radius: 1.5rem;
                padding: 2rem;
                max-width: 480px;
                width: 90%;
                text-align: center;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2px solid #e2e8f0;
            }

            @keyframes scaleIn {
                from {
                    transform: scale(0.9);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            .confirmation-icon-container {
                margin-bottom: 1.5rem;
            }

            .confirmation-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: bounce 0.6s ease-out;
            }

            .confirmation-icon.warning {
                color: #F59E0B;
            }

            .confirmation-icon.danger {
                color: #EF4444;
            }

            @keyframes bounce {
                0%, 20%, 53%, 80%, 100% {
                    transform: translate3d(0,0,0);
                }
                40%, 43% {
                    transform: translate3d(0, -20px, 0);
                }
                70% {
                    transform: translate3d(0, -10px, 0);
                }
                90% {
                    transform: translate3d(0, -4px, 0);
                }
            }

            .confirmation-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 1rem;
            }

            .confirmation-message {
                color: #64748b;
                margin-bottom: 2rem;
                line-height: 1.6;
            }

            .confirmation-message p {
                margin-bottom: 0.75rem;
            }

            .suggestion {
                background: rgba(16, 185, 129, 0.1);
                padding: 0.75rem;
                border-radius: 0.75rem;
                border: 1px solid rgba(16, 185, 129, 0.2);
                color: #065f46;
                font-size: 0.875rem;
            }

            .warning-text {
                color: #dc2626;
                font-weight: 500;
                font-size: 0.875rem;
            }

            .confirmation-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }

            .modern-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                border-radius: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid;
                font-size: 0.875rem;
            }

            .modern-btn.secondary {
                background: #f8fafc;
                color: #64748b;
                border-color: #cbd5e1;
            }

            .modern-btn.secondary:hover {
                background: #e2e8f0;
                border-color: #94a3b8;
                transform: translateY(-2px);
            }

            .modern-btn.danger {
                background: linear-gradient(135deg, #EF4444, #DC2626);
                color: white;
                border-color: #EF4444;
            }

            .modern-btn.danger:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(dialog);

    // Close on outside click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            dialog.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

async function executeDeleteClient(clientId, clientName) {
    try {
        await deleteClientFromSupabase(clientId);

        const index = appData.clients.findIndex(c => c.id === clientId);
        if (index > -1) {
            appData.clients.splice(index, 1);
            appData.totalClients--;
        }

        renderClients();
        showToast(`✅ Client "${clientName}" deleted successfully`, 'success');
        console.log('✅ Client deleted successfully:', clientName);

    } catch (error) {
        console.error('❌ Error deleting client:', error);
        showToast(`❌ Error deleting client: ${error.message}`, 'error');
    }
}

function editClient(clientId) {
    console.log('✏️ Editing client with ID:', clientId);

    if (!appData.dataLoaded) {
        showToast('⏳ Data is still loading. Please wait.', 'info');
        return;
    }

    const client = appData.clients.find(c => c.id === clientId);

    if (!client) {
        console.error('❌ Client not found:', clientId);
        showToast('❌ Client not found. Please refresh the page.', 'error');
        return;
    }

    console.log('✅ Found client for editing:', client);

    editingClientId = clientId;

    const form = document.getElementById('client-form');
    if (form) {
        form.reset();
    }

    setTimeout(() => {
        const fieldMappings = {
            name: ['client-company', 'client-name', 'company-name'],
            email: ['client-email', 'email'],
            phone: ['client-phone', 'phone'],
            address: ['client-address', 'address'],
            payment_terms: ['client-terms', 'payment-terms', 'terms'],
            contact_name: ['client-contact-name', 'client-contact', 'contact-name', 'contact', 'client-contact-person'],
            company: ['client-company-name', 'client-business-name', 'business-name']
        };

        const populatedFields = {};

        Object.entries(fieldMappings).forEach(([dataKey, possibleIds]) => {
            const value = client[dataKey] || '';
            
            for (const fieldId of possibleIds) {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.value = value;
                    populatedFields[fieldId] = value;
                    console.log(`Set ${fieldId} to:`, value);
                    break;
                }
            }
        });

        console.log('✅ Populated fields:', populatedFields);

        const modalTitle = document.querySelector('#client-modal .modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Edit Client';

        const saveBtn = document.getElementById('save-client');
        if (saveBtn) saveBtn.textContent = 'Update Client';

        console.log('✅ Form populated for client:', client.name);
    }, 50);

    openClientModal();
    showToast(`✏️ Editing client: ${client.name}`, 'info');
}

// ENHANCED: Modern Analytics UI with professional charts
function setupAnalyticsFilters() {
    console.log('📊 Setting up enhanced analytics filters...');
}

function renderAnalytics(period = 'monthly') {
    console.log('📈 Rendering enhanced analytics dashboard...');
    
    const analyticsPage = document.getElementById('analytics-page');
    if (analyticsPage && !document.getElementById('enhanced-analytics-layout')) {
        const existingContent = analyticsPage.querySelector('#analyticsChart')?.parentElement;
        if (existingContent) {
            existingContent.remove();
        }

        const analyticsLayout = document.createElement('div');
        analyticsLayout.id = 'enhanced-analytics-layout';
        analyticsLayout.innerHTML = `
            <div class="enhanced-analytics-grid">
                <div class="analytics-chart-container">
                    <div class="analytics-chart-header">
                        <div class="chart-title-section">
                            <h3 class="chart-title">📊 Advanced Earnings Analysis</h3>
                            <p class="chart-subtitle" id="dynamic-chart-subtitle">Interactive earnings trends with detailed insights</p>
                        </div>
                        <div class="chart-controls">
                            <div class="chart-legend" id="chart-legend">
                                <div class="legend-item">
                                    <div class="legend-color" style="background: #1FB8CD;"></div>
                                    <span>Revenue Trend</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-canvas-container">
                        <canvas id="analyticsChart"></canvas>
                    </div>
                </div>
                
                <div class="enhanced-insights-panel">
                    <div class="insights-header">
                        <div class="insights-title-section">
                            <h3 class="insights-title">💡 Business Intelligence</h3>
                            <p class="insights-subtitle">Key performance indicators and actionable insights</p>
                        </div>
                    </div>
                    <div class="insights-content" id="enhanced-analytics-insights">
                        <!-- Populated by JavaScript -->
                    </div>
                </div>
            </div>
        `;
        analyticsPage.appendChild(analyticsLayout);

        // Add enhanced analytics grid styles
        if (!document.getElementById('enhanced-analytics-grid-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-analytics-grid-styles';
            style.textContent = `
                .enhanced-analytics-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 2rem;
                    margin-top: 2rem;
                    animation: fadeInUp 0.6s ease-out;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .analytics-chart-container {
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    padding: 2rem;
                    border-radius: 1.5rem;
                    border: 2px solid #e2e8f0;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .analytics-chart-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 6px;
                    background: linear-gradient(90deg, #1FB8CD 0%, #10B981 50%, #F59E0B 100%);
                }

                .analytics-chart-container:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 64px rgba(0,0,0,0.15);
                }

                .analytics-chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #f1f5f9;
                }

                .chart-title-section h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .chart-subtitle {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin: 0;
                }

                .chart-controls {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .chart-legend {
                    display: flex;
                    gap: 1rem;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .legend-color {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);// ENHANCED INVOICE MANAGER - COMPLETE APPLICATION WITH ALL IMPROVEMENTS

// Check authentication first
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');

    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }

    // Check if login is expired (24 hours)
    if (loginTime) {
        const now = new Date().getTime();
        const loginTimestamp = parseInt(loginTime);
        const hoursDiff = (now - loginTimestamp) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('loginTime');
            window.location.href = 'login.html';
            return false;
        }
    }

    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

// Only proceed if authenticated
if (!checkAuth()) {
    throw new Error('Authentication required');
}

// Supabase Configuration
const SUPABASE_URL = 'https://kgdewraoanlaqewpbdlo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZGV3cmFvYW5sYXFld3BiZGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTg3NDksImV4cCI6MjA2OTI5NDc0OX0.wBgDDHcdK0Q9mN6uEPQFEO8gXiJdnrntLJW3dUdh89M';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application Data
let appData = {
    totalEarnings: 0,
    totalClients: 0,
    totalInvoices: 0,
    monthlyEarnings: [],
    clients: [],
    invoices: [],
    nextInvoiceNumber: 1,
    dataLoaded: false,

    settings: {
        currency: 'INR',
        taxRate: 0,
        invoicePrefix: 'HP-2526',
        profileName: 'Hariprasad Sivakumar',
        profileEmail: 'contact@hariprasadss.com',
        profilePhone: '+91 9876543210',
        profileAddress: '6/91, Mahit Complex, Hosur Road, Attibele, Bengaluru, Karnataka – 562107',
        profileGSTIN: '29GLOPS9921M1ZT',
        bankName: 'Hariprasad Sivakumar',
        bankAccount: '2049315152',
        bankIFSC: 'KKBK0008068',
        bankSWIFT: 'KKBKINBBCPC'
    }
};

// Enhanced analytics state for filters
let analyticsState = {
    currentPeriod: 'monthly',
    filteredData: null,
    dateRange: { from: null, to: null }
};

// Global variables for editing
let editingInvoiceId = null;
let editingClientId = null;

// Charts
let monthlyChart, clientChart, analyticsChart;

// Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Enhanced Invoice Manager...');
    initializeApp();
});

async function initializeApp() {
    try {
        showLoadingState(true);
        addLogoutButton();
        await loadDataFromSupabase();
        appData.dataLoaded = true;

        setupNavigation();
        setupModals();
        setupForms();
        setupAnalyticsFilters();
        setupEnhancedDateRangeFilters();
        renderDashboard();
        renderInvoices();
        renderClients();
        renderAnalytics();
        renderSettings();

        // Add PDF library for invoice downloads
        loadPDFLibrary();

        showLoadingState(false);
        console.log('✅ Application initialized successfully');
        showToast('🎉 Enhanced Invoice Manager loaded successfully!', 'success');
    } catch (error) {
        console.error('❌ Error initializing application:', error);
        showLoadingState(false);
        showToast('Error loading data. Please refresh the page.', 'error');
    }
}

// Enhanced loading state with modern design
function showLoadingState(show) {
    let loader = document.getElementById('app-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.95); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <div style="text-align: center; padding: 2.5rem; background: white; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #e2e8f0;">
                    <div style="width: 60px; height: 60px; border: 4px solid #f1f5f9; border-top: 4px solid #1FB8CD; border-radius: 50%; animation: modernSpin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite; margin: 0 auto 1.5rem;"></div>
                    <div style="color: #1e293b; font-weight: 700; font-size: 1.25rem; margin-bottom: 0.5rem;">Loading Invoice Manager</div>
                    <div style="color: #64748b; font-size: 0.875rem;">Preparing your data...</div>
                </div>
            </div>
            <style>
                @keyframes modernSpin {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.1); }
                    100% { transform: rotate(360deg) scale(1); }
                }
            </style>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = show ? 'flex' : 'none';
}

// Load PDF library for invoice downloads
function loadPDFLibrary() {
    if (!document.getElementById('jspdf-script')) {
        const script = document.createElement('script');
        script.id = 'jspdf-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
        
        const autoTableScript = document.createElement('script');
        autoTableScript.id = 'jspdf-autotable-script';
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
        document.head.appendChild(autoTableScript);
    }
}

function addLogoutButton() {
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader && !document.getElementById('logout-btn')) {
        const username = localStorage.getItem('username') || 'User';
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.className = 'btn btn--sm btn--secondary';
        logoutBtn.innerHTML = `👋 ${username} | Logout`;
        logoutBtn.style.cssText = `
            margin-top: 10px;
            width: 100%;
            font-size: 12px;
            padding: 6px 10px;
        `;
        logoutBtn.onclick = logout;
        sidebarHeader.appendChild(logoutBtn);
    }
}

async function getNextInvoiceNumber() {
    try {
        const { data: invoices, error } = await supabaseClient
            .from('invoices')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (invoices && invoices.length > 0) {
            const lastInvoiceId = invoices[0].id;
            const match = lastInvoiceId.match(/(\d+)$/);
            if (match) {
                return parseInt(match[1]) + 1;
            }
        }

        return 1;
    } catch (error) {
        console.error('Error getting next invoice number:', error);
        return Date.now();
    }
}

// ENHANCED: Modern Analytics UI with professional date pickers
function setupEnhancedDateRangeFilters() {
    const analyticsHeader = document.querySelector('#analytics-page .page-header');
    if (analyticsHeader && !document.getElementById('modern-analytics-controls')) {
        const existingFilter = document.querySelector('#modern-date-filter');
        if (existingFilter) {
            existingFilter.remove();
        }

        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'modern-analytics-controls';
        controlsContainer.innerHTML = `
            <div class="enhanced-analytics-container">
                <!-- Header -->
                <div class="analytics-header-section">
                    <div class="analytics-icon">📊</div>
                    <div>
                        <h3 class="analytics-title">Advanced Analytics Dashboard</h3>
                        <p class="analytics-subtitle">Analyze your business performance with powerful insights</p>
                    </div>
                </div>

                <!-- Controls Grid -->
                <div class="analytics-controls-grid">
                    <!-- Period Selection -->
                    <div class="control-card">
                        <div class="control-header">
                            <span class="control-icon">📈</span>
                            <label class="control-label">Analysis Period</label>
                        </div>
                        <select id="analytics-period" class="modern-select">
                            <option value="monthly">📅 Monthly Analysis</option>
                            <option value="quarterly">📊 Quarterly Overview</option>
                            <option value="yearly">🗓️ Yearly Summary</option>
                        </select>
                    </div>

                    <!-- Date Range -->
                    <div class="control-card">
                        <div class="control-header">
                            <span class="control-icon">🗓️</span>
                            <label class="control-label">Date Range Filter</label>
                        </div>
                        <div class="date-range-inputs">
                            <div class="date-input-group">
                                <label class="date-label">From</label>
                                <input type="month" id="date-from" class="modern-date-input">
                            </div>
                            <div class="date-separator">→</div>
                            <div class="date-input-group">
                                <label class="date-label">To</label>
                                <input type="month" id="date-to" class="modern-date-input">
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="control-card">
                        <div class="control-header">
                            <span class="control-icon">⚡</span>
                            <label class="control-label">Quick Actions</label>
                        </div>
                        <div class="action-buttons-group">
                            <button class="modern-btn primary" id="apply-filters">
                                <span class="btn-icon">🔍</span>
                                Apply Filters
                            </button>
                            <button class="modern-btn secondary" id="clear-filters">
                                <span class="btn-icon">🔄</span>
                                Reset
                            </button>
                        </div>
                    </div>

                    <!-- Status Display -->
                    <div class="control-card status-card" id="analytics-status-card" style="display: none;">
                        <div class="control-header">
                            <span class="control-icon">ℹ️</span>
                            <label class="control-label">Filter Status</label>
                        </div>
                        <div id="analytics-status" class="status-content"></div>
                    </div>
                </div>
            </div>
        `;

        analyticsHeader.parentNode.insertBefore(controlsContainer, analyticsHeader.nextSibling);

        // Add enhanced analytics styles
        if (!document.getElementById('enhanced-analytics-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-analytics-styles';
            style.textContent = `
                .enhanced-analytics-container {
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    margin: 1.5rem 0;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }

                .analytics-header-section {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e2e8f0;
                }

                .analytics-icon {
                    font-size: 2.5rem;
                    background: linear-gradient(135deg, #1FB8CD, #10B981);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .analytics-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }

                .analytics-subtitle {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin: 0.25rem 0 0 0;
                }

                .analytics-controls-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1rem;
                }

                .control-card {
                    background: white;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }

                .control-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }

                .control-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                }

                .control-icon {
                    font-size: 1.25rem;
                }

                .control-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .modern-select, .modern-date-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.5rem;
                    background: white;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    transition: all 0.3s ease;
                }

                .modern-select:focus, .modern-date-input:focus {
                    outline: none;
                    border-color: #1FB8CD;
                    box-shadow: 0 0 0 3px rgba(31, 184, 205, 0.1);
                    transform: translateY(-1px);
                }

                .date-range-inputs {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .date-input-group {
                    flex: 1;
                }

                .date-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #64748b;
                    margin-bottom: 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .date-separator {
                    font-size: 1.25rem;
                    color: #1FB8CD;
                    font-weight: 700;
                    margin-top: 1rem;
                }

                .action-buttons-group {
                    display: flex;
                    gap: 0.5rem;
                }

                .modern-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid;
                }

                .modern-btn.primary {
                    background: linear-gradient(135deg, #1FB8CD, #10B981);
                    color: white;
                    border-color: transparent;
                }

                .modern-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(31, 184, 205, 0.3);
                }

                .modern-btn.secondary {
                    background: white;
                    color: #64748b;
                    border-color: #d1d5db;
                }

                .modern-btn.secondary:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                    transform: translateY(-1px);
                }

                .btn-icon {
                    font-size: 1rem;
                }

                .status-card {
                    grid-column: 1 / -1;
                    background: linear-gradient(135deg, rgba(31, 184, 205, 0.05), rgba(16, 185, 129, 0.05));
                    border-color: rgba(31, 184, 205, 0.2);
                }

                .status-content {
                    background: rgba(31, 184, 205, 0.1);
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1e40af;
                }

                @media (max-width: 768px) {
                    .analytics-controls-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .date-range-inputs {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    
                    .date-separator {
                        transform: rotate(90deg);
                        margin: 0;
                    }
                    
                    .action-buttons-group {
                        flex-direction: column;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Setup event listeners with enhanced functionality
        document.getElementById('apply-filters').addEventListener('click', applyEnhancedAnalyticsFilters);
        document.getElementById('clear-filters').addEventListener('click', clearAnalyticsFilters);
        
        document.getElementById('analytics-period').addEventListener('change', (e) => {
            analyticsState.currentPeriod = e.target.value;
            console.log('📊 Period changed to:', analyticsState.currentPeriod);
            applyEnhancedAnalyticsFilters();
        });
    }
}

function applyEnhancedAnalyticsFilters() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;
    const period = document.getElementById('analytics-period').value;
    const statusDiv = document.getElementById('analytics-status');
    const statusCard = document.getElementById('analytics-status-card');

    analyticsState.currentPeriod = period;
    analyticsState.dateRange = { from: fromDate, to: toDate };

    console.log('🔍 Applying enhanced analytics filters:', { period, fromDate, toDate });

    let filteredInvoices = appData.invoices;
    if (fromDate && toDate) {
        if (fromDate > toDate) {
            showToast('❌ From date should be earlier than to date', 'error');
            return;
        }

        filteredInvoices = appData.invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.date);
            const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
            return invoiceMonth >= fromDate && invoiceMonth <= toDate;
        });

        const totalEarnings = filteredInvoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

        const paidCount = filteredInvoices.filter(inv => inv.status === 'Paid').length;
        const avgInvoice = paidCount > 0 ? totalEarnings / paidCount : 0;

        statusDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-weight: 700;">📊 Filtered Results</span>
                <span style="background: rgba(16, 185, 129, 0.2); color: #065f46; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">${fromDate} → ${toDate}</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; margin-top: 0.75rem;">
                <div style="text-align: center;">
                    <div style="font-size: 1.25rem; font-weight: 700; color: #1FB8CD;">${filteredInvoices.length}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">Invoices</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.25rem; font-weight: 700; color: #10B981;">₹${formatNumber(totalEarnings)}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">Revenue</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.25rem; font-weight: 700; color: #F59E0B;">₹${formatNumber(avgInvoice)}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">Avg Invoice</div>
                </div>
            </div>
        `;
        statusCard.style.display = 'block';
    } else {
        statusCard.style.display = 'none';
    }

    analyticsState.filteredData = filteredInvoices;

    renderAnalyticsChart(period, filteredInvoices);
    renderEnhancedTopClientInsights(filteredInvoices);

    showToast(`📊 Analytics updated: ${period} view${fromDate && toDate ? ' with date filter applied' : ''}`, 'success');
}

function clearAnalyticsFilters() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('analytics-period').value = 'monthly';
    
    analyticsState.currentPeriod = 'monthly';
    analyticsState.dateRange = { from: null, to: null };
    analyticsState.filteredData = null;

    const statusCard = document.getElementById('analytics-status-card');
    statusCard.style.display = 'none';

    renderAnalyticsChart('monthly', appData.invoices);
    renderEnhancedTopClientInsights(appData.invoices);
    
    showToast('🔄 Analytics filters cleared successfully', 'info');
}

// Enhanced data loading with better error handling and progress feedback
async function loadDataFromSupabase() {
    console.log('📊 Loading data from Supabase...');

    try {
        // Load clients with progress feedback
        console.log('👥 Loading clients...');
        const { data: clients, error: clientsError } = await supabaseClient
            .from('clients')
            .select('*')
            .order('name', { ascending: true });

        if (clientsError) {
            console.error('❌ Clients error:', clientsError);
            throw clientsError;
        }

        appData.clients = (clients || []).map(client => ({
            id: client.id,
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            payment_terms: client.payment_terms || 'net30',
            contact_name: client.contact_name || '',
            company: client.company || client.name || '',
            total_invoices: parseInt(client.total_invoices || 0),
            total_amount: parseFloat(client.total_amount || 0)
        }));
        appData.totalClients = appData.clients.length;
        console.log(`✅ Clients loaded: ${appData.clients.length}`);

        // Load invoices
        console.log('📄 Loading invoices...');
        const { data: invoices, error: invoicesError } = await supabaseClient
            .from('invoices')
            .select('*')
            .order('date_issued', { ascending: false });

        if (invoicesError) {
            console.error('❌ Invoices error:', invoicesError);
            throw invoicesError;
        }

        appData.invoices = (invoices || []).map(invoice => ({
            id: invoice.id || '',
            clientId: invoice.client_id,
            client: invoice.client_name || '',
            amount: parseFloat(invoice.amount || 0),
            subtotal: parseFloat(invoice.subtotal || 0),
            tax: parseFloat(invoice.tax || 0),
            date: invoice.date_issued || new Date().toISOString().split('T')[0],
            dueDate: invoice.due_date || new Date().toISOString().split('T')[0],
            status: invoice.status || 'Draft',
            items: Array.isArray(invoice.items) ? invoice.items : []
        }));

        appData.totalInvoices = appData.invoices.length;
        console.log(`✅ Invoices loaded: ${appData.invoices.length}`);

        appData.totalEarnings = appData.invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

        calculateMonthlyEarnings();

        // Load settings
        console.log('⚙️ Loading settings...');
        const { data: settings, error: settingsError } = await supabaseClient
            .from('settings')
            .select('*')
            .eq('user_id', 'default')
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.warn('⚠️ Settings error (non-critical):', settingsError);
        }

        if (settings) {
            appData.settings = {
                ...appData.settings,
                currency: settings.currency || appData.settings.currency,
                taxRate: settings.tax_rate !== null && settings.tax_rate !== undefined ? parseFloat(settings.tax_rate) : appData.settings.taxRate,
                invoicePrefix: settings.invoice_prefix || appData.settings.invoicePrefix,
                profileName: settings.profile_name || appData.settings.profileName,
                profileEmail: settings.profile_email || appData.settings.profileEmail,
                profilePhone: settings.profile_phone || appData.settings.profilePhone,
                profileAddress: settings.profile_address || appData.settings.profileAddress,
                profileGSTIN: settings.profile_gstin || appData.settings.profileGSTIN,
                bankName: settings.bank_name || appData.settings.bankName,
                bankAccount: settings.bank_account || appData.settings.bankAccount,
                bankIFSC: settings.bank_ifsc || appData.settings.bankIFSC,
                bankSWIFT: settings.bank_swift || appData.settings.bankSWIFT
            };
        }

        console.log('✅ Data loaded successfully from Supabase');

    } catch (error) {
        console.error('💥 Critical error loading data from Supabase:', error);
        showToast(`❌ Failed to load data: ${error.message || 'Unknown error'}`, 'error');
        throw error;
    }
}

function calculateMonthlyEarnings() {
    const monthlyData = new Map();

    appData.invoices
        .filter(inv => inv.status === 'Paid')
        .forEach(({ date, amount }) => {
            const d = new Date(date);
            if (Number.isNaN(d)) return;
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + amount);
        });

    appData.monthlyEarnings = Array.from(monthlyData, ([month, amount]) => ({ month, amount }))
                                   .sort((a, b) => a.month.localeCompare(b.month));
}

function calculateQuarterlyEarnings(invoices = appData.invoices) {
    const quarterlyData = new Map();

    invoices
        .filter(inv => inv.status === 'Paid')
        .forEach(({ date, amount }) => {
            const d = new Date(date);
            if (Number.isNaN(d)) return;
            const year = d.getFullYear();
            const quarter = Math.ceil((d.getMonth() + 1) / 3);
            const quarterKey = `${year}-Q${quarter}`;
            quarterlyData.set(quarterKey, (quarterlyData.get(quarterKey) || 0) + amount);
        });

    return Array.from(quarterlyData, ([quarter, amount]) => ({ month: quarter, amount }))
                 .sort((a, b) => a.month.localeCompare(b.month));
}

function calculateYearlyEarnings(invoices = appData.invoices) {
    const yearlyData = new Map();

    invoices
        .filter(inv => inv.status === 'Paid')
        .forEach(({ date, amount }) => {
            const d = new Date(date);
            if (Number.isNaN(d)) return;
            const year = d.getFullYear().toString();
            yearlyData.set(year, (yearlyData.get(year) || 0) + amount);
        });

    return Array.from(yearlyData, ([year, amount]) => ({ month: year, amount }))
                 .sort((a, b) => a.month.localeCompare(b.month));
}

// Enhanced Supabase operations with better error handling
async function saveClientToSupabase(clientData) {
    try {
        console.log('💾 Saving client to Supabase:', clientData);

        if (!clientData.name || !clientData.email) {
            throw new Error('Name and email are required');
        }

        if (editingClientId) {
            console.log('✏️ Updating existing client:', editingClientId);
            
            const { data, error } = await supabaseClient
                .from('clients')
                .update({
                    name: clientData.name.trim(),
                    email: clientData.email.trim(),
                    phone: clientData.phone?.trim() || '',
                    address: clientData.address?.trim() || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    contact_name: clientData.contactName?.trim() || '',
                    company: clientData.company?.trim() || clientData.name.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingClientId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            console.log('➕ Inserting new client');
            
            const { data, error } = await supabaseClient
                .from('clients')
                .insert([{
                    name: clientData.name.trim(),
                    email: clientData.email.trim(),
                    phone: clientData.phone?.trim() || '',
                    address: clientData.address?.trim() || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    contact_name: clientData.contactName?.trim() || '',
                    company: clientData.company?.trim() || clientData.name.trim(),
                    total_invoices: 0,
                    total_amount: 0
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('❌ Error saving client to Supabase:', error);
        throw error;
    }
}

async function saveInvoiceToSupabase(invoiceData) {
    try {
        console.log('💾 Saving invoice to Supabase:', invoiceData);

        if (editingInvoiceId) {
            const { data, error } = await supabaseClient
                .from('invoices')
                .update({
                    client_id: invoiceData.clientId,
                    client_name: invoiceData.client,
                    amount: invoiceData.amount,
                    subtotal: invoiceData.subtotal,
                    tax: invoiceData.tax,
                    date_issued: invoiceData.date,
                    due_date: invoiceData.dueDate,
                    status: invoiceData.status,
                    items: invoiceData.items
                })
                .eq('id', editingInvoiceId)
                .select()
                .single();

            if (error) throw error;
            await updateClientTotals(invoiceData.clientId);
            return data;
        } else {
            const { data, error } = await supabaseClient
                .from('invoices')
                .insert([{
                    id: invoiceData.id,
                    client_id: invoiceData.clientId,
                    client_name: invoiceData.client,
                    amount: invoiceData.amount,
                    subtotal: invoiceData.subtotal,
                    tax: invoiceData.tax,
                    date_issued: invoiceData.date,
                    due_date: invoiceData.dueDate,
                    status: invoiceData.status,
                    items: invoiceData.items
                }])
                .select()
                .single();

            if (error) throw error;
            await updateClientTotals(invoiceData.clientId);
            return data;
        }
    } catch (error) {
        console.error('❌ Error saving invoice to Supabase:', error);
        throw error;
    }
}

async function updateClientTotals(clientId) {
    try {
        const { data: invoices, error: invoicesError } = await supabaseClient
            .from('invoices')
            .select('amount, status')
            .eq('client_id', clientId);

        if (invoicesError) throw invoicesError;

        const totalInvoices = invoices.length;
        const totalAmount = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

        const { error: updateError } = await supabaseClient
            .from('clients')
            .update({
                total_invoices: totalInvoices,
                total_amount: totalAmount,
                updated_at: new Date().toISOString()
            })
            .eq('id', clientId);

        if (updateError) throw updateError;
    } catch (error) {
        console.error('❌ Error updating client totals:', error);
        throw error;
    }
}

async function deleteInvoiceFromSupabase(invoiceId) {
    try {
        const { data: invoice, error: getError } = await supabaseClient
            .from('invoices')
            .select('client_id')
            .eq('id', invoiceId)
            .single();

        if (getError) throw getError;

        const { error: deleteError } = await supabaseClient
            .from('invoices')
            .delete()
            .eq('id', invoiceId);

        if (deleteError) throw deleteError;

        await updateClientTotals(invoice.client_id);
        return true;
    } catch (error) {
        console.error('❌ Error deleting invoice from Supabase:', error);
        throw error;
    }
}

async function deleteClientFromSupabase(clientId) {
    try {
        const { error } = await supabaseClient
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting client from Supabase:', error);
        throw error;
    }
}

async function saveSettingsToSupabase(settingsData) {
    try {
        console.log('💾 Saving settings to Supabase:', settingsData);

        if (!settingsData.profileName || !settingsData.profileEmail) {
            throw new Error('Profile name and email are required');
        }

        if (settingsData.taxRate < 0 || settingsData.taxRate > 100) {
            throw new Error('Tax rate must be between 0 and 100');
        }

        const { data: existingSettings, error: checkError } = await supabaseClient
            .from('settings')
            .select('user_id')
            .eq('user_id', 'default')
            .maybeSingle();

        const settingsPayload = {
            currency: settingsData.currency || 'INR',
            tax_rate: parseFloat(settingsData.taxRate),
            invoice_prefix: settingsData.invoicePrefix || 'HP-2526',
            profile_name: settingsData.profileName || '',
            profile_email: settingsData.profileEmail || '',
            profile_phone: settingsData.profilePhone || '',
            profile_address: settingsData.profileAddress || '',
            profile_gstin: settingsData.profileGSTIN || '',
            bank_name: settingsData.bankName || '',
            bank_account: settingsData.bankAccount || '',
            bank_ifsc: settingsData.bankIFSC || '',
            bank_swift: settingsData.bankSWIFT || '',
            updated_at: new Date().toISOString()
        };

        console.log('⚙️ Settings payload:', settingsPayload);

        if (existingSettings) {
            console.log('✏️ Updating existing settings');
            const { data, error } = await supabaseClient
                .from('settings')
                .update(settingsPayload)
                .eq('user_id', 'default')
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            console.log('➕ Inserting new settings');
            const { data, error } = await supabaseClient
                .from('settings')
                .insert([{
                    user_id: 'default',
                    ...settingsPayload
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('❌ Critical error saving settings to Supabase:', error);
        throw error;
    }
}

// Enhanced navigation with smooth transitions
function setupNavigation() {
    console.log('🧭 Setting up enhanced navigation...');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            console.log(`🔄 Navigating to: ${targetPage}`);

            // Add loading effect
            link.style.opacity = '0.7';
            setTimeout(() => {
                link.style.opacity = '1';
            }, 150);

            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');

            pages.forEach(page => page.classList.remove('active'));
            const targetElement = document.getElementById(`${targetPage}-page`);
            if (targetElement) {
                targetElement.classList.add('active');

                // Enhanced page rendering with analytics
                if (targetPage === 'dashboard') {
                    renderDashboard();
                    showToast('📊 Dashboard loaded', 'info');
                } else if (targetPage === 'invoices') {
                    renderInvoices();
                    showToast('📄 Invoices loaded', 'info');
                } else if (targetPage === 'clients') {
                    renderClients();
                    showToast('👥 Clients loaded', 'info');
                } else if (targetPage === 'analytics') {
                    renderAnalytics();
                    showToast('📈 Analytics loaded', 'info');
                } else if (targetPage === 'settings') {
                    renderSettings();
                    showToast('⚙️ Settings loaded', 'info');
                }
            } else {
                console.error('❌ Target page not found:', targetPage);
            }
        });
    });
}

// Enhanced dashboard rendering with modern metrics
function renderDashboard() {
    console.log('📊 Rendering enhanced dashboard...');
    updateDashboardMetrics();
    renderRecentInvoices();
    setTimeout(() => renderEnhancedCharts(), 100);
}

function updateDashboardMetrics() {
    const totalEarnings = appData.invoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + inv.amount, 0);

    const avgMonthly = appData.monthlyEarnings.length > 0
        ? appData.monthlyEarnings.reduce((sum, m) => sum + m.amount, 0) / appData.monthlyEarnings.length
        : 0;

    const metricCards = document.querySelectorAll('.metric-value');
    if (metricCards.length >= 4) {
        // Add animated number counting effect
        animateNumber(metricCards[0], totalEarnings, '₹');
        animateNumber(metricCards[1], appData.totalClients);
        animateNumber(metricCards[2], appData.totalInvoices);
        animateNumber(metricCards[3], avgMonthly, '₹');
    }
}

function animateNumber(element, targetValue, prefix = '') {
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = startValue + (targetValue - startValue) * easeOutCubic(progress);
        
        if (prefix === '₹') {
            element.textContent = `${prefix}${formatNumber(Math.floor(currentValue))}`;
        } else {
            element.textContent = Math.floor(currentValue).toString();
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function renderRecentInvoices() {
    const tbody = document.getElementById('recent-invoices-body');
    if (!tbody) return;

    const recentInvoices = appData.invoices.slice(0, 5);

    tbody.innerHTML = recentInvoices.map(invoice => `
        <tr style="transition: all 0.2s ease;">
            <td><strong style="color: var(--color-primary);">${invoice.id}</strong></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">👤</span>
                    ${invoice.client}
                </div>
            </td>
            <td><strong style="color: var(--color-success);">₹${formatNumber(invoice.amount)}</strong></td>
            <td style="color: var(--color-text-secondary);">${formatDate(invoice.date)}</td>
            <td><span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span></td>
        </tr>
    `).join('');

    // Add hover effects
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = 'var(--color-surface-hover)';
            row.style.transform = 'translateX(4px)';
        });
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
            row.style.transform = 'translateX(0)';
        });
    });
}

// Enhanced chart rendering with modern styling and animations
function renderEnhancedCharts() {
    console.log('📈 Rendering enhanced charts...');
    renderMonthlyChart();
    renderClientChart();
}

function renderMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: appData.monthlyEarnings.map(m => m.month),
            datasets: [{
                label: 'Monthly Earnings',
                data: appData.monthlyEarnings.map(m => m.amount),
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                borderWidth: 4,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#1FB8CD',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3,
                pointRadius: 8,
                pointHoverRadius: 12,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#1FB8CD',
                pointHoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#1FB8CD',
                    borderWidth: 2,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return `📅 ${context[0].label}`;
                        },
                        label: function(context) {
                            return `💰 Earnings: ₹${formatNumber(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + formatNumber(value);
                        },
                        color: '#64748b',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function renderClientChart() {
    const ctx = document.getElementById('clientChart');
    if (!ctx) return;

    if (clientChart) {
        clientChart.destroy();
    }

    const colors = [
        '#1FB8CD', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];

    const hoverColors = [
        '#26A0AD', '#059669', '#D97706', '#DC2626', '#7C3AED',
        '#0891B2', '#65A30D', '#EA580C', '#DB2777', '#4F46E5'
    ];

    clientChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: appData.clients.map(c => c.name),
            datasets: [{
                data: appData.clients.map(c => c.total_amount || 0),
                backgroundColor: colors,
                hoverBackgroundColor: hoverColors,
                borderWidth: 4,
                borderColor: '#ffffff',
                hoverOffset: 15,
                hoverBorderWidth: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = chart.getDatasetMeta(0).total > 0 ? 
                                        ((value / chart.getDatasetMeta(0).total) * 100).toFixed(1) : 0;
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].backgroundColor[i],
                                        pointStyle: 'circle',
                                        hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#1FB8CD',
                    borderWidth: 2,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return `👤 ${context[0].label}`;
                        },
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `💰 Revenue: ₹${formatNumber(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Enhanced invoice rendering with modern action buttons
function renderInvoices() {
    console.log('📄 Rendering enhanced invoices...');
    const tbody = document.getElementById('invoices-body');
    if (!tbody) return;

    // Add enhanced action button styles
    if (!document.getElementById('enhanced-action-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-action-styles';
        style.textContent = `
            .action-buttons {
                display: flex;
                gap: 6px;
                justify-content: center;
            }

            .action-btn {
                padding: 8px;
                font-size: 14px;
                border-radius: 8px;
                border: 2px solid;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                position: relative;
                overflow: hidden;
            }

            .action-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                transition: all 0.3s ease;
                transform: translate(-50%, -50%);
            }

            .action-btn:hover::before {
                width: 100%;
                height: 100%;
            }

            .action-btn.view {
                background: linear-gradient(135deg, #3B82F6, #1D4ED8);
                border-color: #2563EB;
                color: white;
            }

            .action-btn.view:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
            }

            .action-btn.edit {
                background: linear-gradient(135deg, #F59E0B, #D97706);
                border-color: #F59E0B;
                color: white;
            }

            .action-btn.edit:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
            }

            .action-btn.download {
                background: linear-gradient(135deg, #10B981, #059669);
                border-color: #10B981;
                color: white;
            }

            .action-btn.download:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
            }

            .action-btn.delete {
                background: linear-gradient(135deg, #EF4444, #DC2626);
                border-color: #EF4444;
                color: white;
            }

            .action-btn.delete:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
            }

            .action-btn:active {
                transform: translateY(0) scale(0.95);
            }

            /* Enhanced invoice table rows */
            #invoices-body tr {
                transition: all 0.3s ease;
                border-left: 4px solid transparent;
            }

            #invoices-body tr:hover {
                background: linear-gradient(135deg, rgba(31, 184, 205, 0.05), rgba(16, 185, 129, 0.05));
                border-left-color: #1FB8CD;
                transform: translateX(4px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    tbody.innerHTML = appData.invoices.map(invoice => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">📄</span>
                    <strong style="color: var(--color-primary);">${invoice.id}</strong>
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">👤</span>
                    ${invoice.client}
                </div>
            </td>
            <td><strong style="color: var(--color-success); font-size: 1.1rem;">₹${formatNumber(invoice.amount)}</strong></td>
            <td style="color: var(--color-text-secondary);">${formatDate(invoice.date)}</td>
            <td style="color: var(--color-text-secondary);">${formatDate(invoice.dueDate)}</td>
            <td><span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewInvoice('${invoice.id}')" title="View Invoice">👁️</button>
                    <button class="action-btn edit" onclick="editInvoice('${invoice.id}')" title="Edit Invoice">✏️</button>
                    <button class="action-btn download" onclick="downloadEnhancedInvoice('${invoice.id}')" title="Download PDF">📥</button>
                    <button class="action-btn delete" onclick="confirmDeleteInvoice('${invoice.id}')" title="Delete Invoice">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');

    setupFilterTabs();
}

function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterInvoices(tab.dataset.filter);
        });
    });
}

function filterInvoices(filter) {
    console.log('🔍 Filtering invoices by:', filter);
    const rows = document.querySelectorAll('#invoices-body tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const statusElement = row.querySelector('.status-badge');
        if (statusElement) {
            const status = statusElement.textContent.toLowerCase();
            const shouldShow = filter === 'all' || status === filter;
            row.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        }
    });

    showToast(`📊 Showing ${visibleCount} ${filter === 'all' ? '' : filter} invoices
