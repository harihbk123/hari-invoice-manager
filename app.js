const issueDateInput = safeQuerySelector('#issue-date');
        const dueDateInput = safeQuerySelector('#due-date');

        const invoice = {
            id: invoiceNumber,
            clientId: clientId,
            client: client.name,
            amount: total,
            subtotal: subtotal,
            tax: tax,
            date: issueDateInput ? issueDateInput.value : new Date().toISOString().split('T')[0],
            dueDate: dueDateInput ? dueDateInput.value : new Date().toISOString().split('T')[0],
            status: status,
            items: lineItems
        };

        await saveInvoiceToSupabase(invoice);

        if (editingInvoiceId) {
            const index = appData.invoices.findIndex(inv => inv.id === editingInvoiceId);
            if (index > -1) {
                appData.invoices[index] = invoice;
            }
            showToast(`Invoice ${invoiceNumber} updated successfully`, 'success');
        } else {
            appData.invoices.unshift(invoice);
            appData.totalInvoices++;
            showToast(`Invoice ${invoiceNumber} ${status === 'Draft' ? 'saved as draft' : 'created'} successfully`, 'success');
        }

        const localClient = appData.clients.find(c => c.id === clientId);
        if (localClient) {
            const clientInvoices = appData.invoices.filter(inv => inv.clientId === clientId);
            localClient.total_invoices = clientInvoices.length;
            localClient.total_amount = clientInvoices
                .filter(inv => inv.status === 'Paid')
                .reduce((sum, inv) => sum + inv.amount, 0);
        }

        calculateMonthlyEarnings();

        renderInvoices();
        renderDashboard();
        renderClients();

        closeModal(safeQuerySelector('#invoice-modal'));
    } catch (error) {
        console.error('Error saving invoice:', error);
        showToast('Error saving invoice. Please try again.', 'error');
    }
}

function setupClientForm() {
    try {
        const saveClientBtn = safeQuerySelector('#save-client');
        const cancelClientBtn = safeQuerySelector('#cancel-client');

        if (saveClientBtn) {
            saveClientBtn.addEventListener('click', saveClient);
        }

        if (cancelClientBtn) {
            cancelClientBtn.addEventListener('click', () => closeModal(safeQuerySelector('#client-modal')));
        }
    } catch (error) {
        console.error('Error setting up client form:', error);
    }
}

async function saveClient() {
    try {
        console.log('Saving client... Editing ID:', editingClientId);

        const formFields = {
            company: safeQuerySelector('#client-company') || safeQuerySelector('#client-name'),
            email: safeQuerySelector('#client-email'),
            phone: safeQuerySelector('#client-phone'),
            address: safeQuerySelector('#client-address'),
            terms: safeQuerySelector('#client-terms'),
            contactName: safeQuerySelector('#client-contact-name') || safeQuerySelector('#client-contact'),
            companyName: safeQuerySelector('#client-company-name') || safeQuerySelector('#client-business-name')
        };

        console.log('Available form fields:', Object.keys(formFields).filter(key => formFields[key]));

        if (!formFields.company || !formFields.email) {
            showToast('Required form fields (company and email) are missing', 'error');
            return;
        }

        const clientData = {
            name: formFields.company.value.trim(),
            email: formFields.email.value.trim(),
            phone: formFields.phone ? formFields.phone.value.trim() : '',
            address: formFields.address ? formFields.address.value.trim() : '',
            paymentTerms: formFields.terms ? formFields.terms.value : 'net30',
            contactName: formFields.contactName ? formFields.contactName.value.trim() : '',
            company: formFields.companyName ? formFields.companyName.value.trim() : formFields.company.value.trim()
        };

        console.log('Client data being saved:', clientData);

        if (!clientData.name || !clientData.email) {
            showToast('Company name and email are required', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clientData.email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        const saveBtn = safeQuerySelector('#save-client');
        const originalText = saveBtn?.textContent || 'Save Client';
        if (saveBtn) {
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
        }

        console.log('Attempting to save client to Supabase...');
        const savedClient = await saveClientToSupabase(clientData);
        console.log('Client saved to Supabase successfully:', savedClient);

        if (editingClientId) {
            const index = appData.clients.findIndex(c => c.id === editingClientId);
            if (index > -1) {
                const oldClient = { ...appData.clients[index] };
                appData.clients[index] = {
                    ...appData.clients[index],
                    id: savedClient.id,
                    name: savedClient.name,
                    email: savedClient.email,
                    phone: savedClient.phone || '',
                    address: savedClient.address || '',
                    payment_terms: savedClient.payment_terms,
                    contact_name: savedClient.contact_name || '',
                    company: savedClient.company || savedClient.name || ''
                };
                console.log('Updated client:', {
                    before: oldClient,
                    after: appData.clients[index],
                    index: index
            },
        testClientEdit: (clientId) => {
            console.log('Testing client edit for ID:', clientId);
            editClient(clientId);
        },
        testInvoiceDownload: (invoiceId) => {
            console.log('Testing invoice download for ID:', invoiceId);
            downloadInvoice(invoiceId);
        },
        safeQuerySelector: safeQuerySelector,
        safeQuerySelectorAll: safeQuerySelectorAll
    };
    console.log('🔧 Debug helpers available: window.debugApp');
    console.log('🔍 Use debugApp.debugClients() to check client data');
    console.log('📥 Use debugApp.testInvoiceDownload("invoice-id") to test PDF download');
}

// Export functionality for data backup
function exportData(format = 'json') {
    try {
        const data = {
            clients: appData.clients,
            invoices: appData.invoices,
            settings: appData.settings,
            exportDate: new Date().toISOString()
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Data exported successfully', 'success');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Error exporting data', 'error');
    }
}

// Connection status monitoring
function monitorConnection() {
    try {
        const updateConnectionStatus = () => {
            const status = navigator.onLine ? 'online' : 'offline';
            if (status === 'offline') {
                showToast('You are offline. Some features may not work.', 'warning');
            } else {
                console.log('Connection restored');
            }
        };

        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
    } catch (error) {
        console.error('Error setting up connection monitoring:', error);
    }
}

// Initialize connection monitoring
monitorConnection();

// Log performance after initialization
setTimeout(() => {
    performanceMonitor.logTiming('Full app initialization');
    performanceMonitor.logMemory();
}, 1000);

// Add enhanced styles for client cards and modern components
const additionalStyles = `
.modern-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    transition: all var(--transition-normal);
    overflow: hidden;
    position: relative;
}

.modern-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.modern-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.modern-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modern-stats {
    display: flex;
    align-items: center;
}

.client-initial {
    font-weight: 600;
    font-size: 1.25rem;
}

/* Enhanced analytics styles */
.ultra-modern-analytics {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 24px;
    overflow: hidden;
    margin: 32px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
}

.analytics-hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 32px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.analytics-hero::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: url('data:image/svg+xml,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)" /></svg>');
    opacity: 0.3;
    pointer-events: none;
}

.hero-content {
    position: relative;
    z-index: 2;
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 16px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
    line-height: 1.2;
}

.hero-subtitle {
    font-size: 16px;
    opacity: 0.9;
    margin: 0;
    max-width: 500px;
    line-height: 1.5;
}

.hero-stats {
    display: flex;
    gap: 12px;
    position: relative;
    z-index: 2;
}

.stat-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.15);
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 500;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-section {
    padding: 32px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.section-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1a202c;
    margin: 0;
}

.filters-grid {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 24px;
    align-items: end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-label {
    font-size: 13px;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 4px;
}

.label-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.select-wrapper {
    position: relative;
}

.modern-select {
    width: 100%;
    padding: 12px 40px 12px 16px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #2d3748;
    appearance: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.modern-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.select-chevron {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
    pointer-events: none;
}

.date-inputs {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date-input-container {
    position: relative;
    flex: 1;
}

.date-input {
    width: 100%;
    padding: 12px 16px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #2d3748;
    cursor: pointer;
    transition: all 0.2s ease;
}

.date-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.floating-label {
    position: absolute;
    top: -8px;
    left: 12px;
    background: white;
    padding: 0 6px;
    font-size: 11px;
    font-weight: 600;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.date-separator {
    color: #667eea;
    margin: 0 4px;
}

.apply-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.apply-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.reset-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #4a5568;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.reset-btn:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
    color: #2d3748;
}

.analytics-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    margin-top: 20px;
}

.chart-container {
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;
}

.chart-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 8px;
}

.chart-subtitle {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
}

.insights-panel {
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.insight-item {
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
}

.insight-item:last-child {
    border-bottom: none;
}

.insight-label {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-bottom: 4px;
}

.insight-value {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
}

.insight-change {
    font-size: 11px;
    font-weight: 600;
    margin-top: 2px;
}

.insight-change.positive { 
    color: #059669; 
}

.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
}

.toast {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    pointer-events: auto;
    cursor: pointer;
    transform: translateX(100%);
    animation: slideIn 0.3s ease forwards;
    transition: all 0.3s ease;
}

.toast.removing {
    transform: translateX(100%);
    opacity: 0;
}

.toast.success {
    border-left: 4px solid #059669;
}

.toast.error {
    border-left: 4px solid #dc2626;
}

.toast.warning {
    border-left: 4px solid #d97706;
}

.toast.info {
    border-left: 4px solid #2563eb;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
    }
    to {
        transform: translateX(0);
    }
}

.action-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
}

.action-btn.view {
    background: #f0f9ff;
    color: #0ea5e9;
}

.action-btn.view:hover {
    background: #0ea5e9;
    color: white;
}

.action-btn.edit {
    background: #fef3c7;
    color: #d97706;
}

.action-btn.edit:hover {
    background: #d97706;
    color: white;
}

.action-btn.download {
    background: #f0fdf4;
    color: #059669;
}

.action-btn.download:hover {
    background: #059669;
    color: white;
}

.action-btn.delete {
    background: #fef2f2;
    color: #dc2626;
}

.action-btn.delete:hover {
    background: #dc2626;
    color: white;
}

.client-card {
    transition: all 0.3s ease;
}

.client-card:hover {
    transform: translateY(-2px);
}

.client-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.client-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 18px;
}

.client-actions {
    display: flex;
    gap: 8px;
}

.client-action-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.client-action-btn.edit {
    background: #f0f9ff;
    color: #0ea5e9;
}

.client-action-btn.edit:hover {
    background: #0ea5e9;
    color: white;
}

.client-action-btn.delete {
    background: #fef2f2;
    color: #dc2626;
}

.client-action-btn.delete:hover {
    background: #dc2626;
    color: white;
}

.client-info {
    margin-bottom: 16px;
}

.client-name {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 12px 0;
}

.client-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #64748b;
}

.detail-item svg {
    flex-shrink: 0;
}

.client-stats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
}

.stat-item {
    text-align: center;
}

.stat-number {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

.stat-divider {
    width: 1px;
    height: 32px;
    background: #f1f5f9;
}

@media (max-width: 768px) {
    .analytics-hero {
        flex-direction: column;
        text-align: center;
        gap: 20px;
    }

    .hero-stats {
        justify-content: center;
    }

    .filters-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .date-inputs {
        flex-direction: column;
        gap: 16px;
    }

    .analytics-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .action-buttons {
        flex-wrap: wrap;
        gap: 4px;
    }

    .action-btn {
        width: 28px;
        height: 28px;
        font-size: 12px;
    }

    .toast-container {
        left: 20px;
        right: 20px;
        top: 20px;
    }

    .toast {
        max-width: none;
    }
}

@media (max-width: 480px) {
    .client-card-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .client-actions {
        align-self: flex-end;
    }

    .client-stats {
        flex-direction: column;
        gap: 12px;
    }

    .stat-divider {
        width: 100%;
        height: 1px;
    }
}
`;

// Inject the additional styles
try {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
} catch (error) {
    console.error('Error injecting styles:', error);
}

console.log('🎯 Invoice Manager initialized successfully with modern UI!');
console.log('📱 Responsive design enabled');
console.log('🎨 Glassmorphism effects applied');
console.log('⚡ Performance optimizations active');
console.log('🔧 Full 3400+ lines of code loaded');

// End of app.js file
            }
            showToast(`Client "${savedClient.name}" updated successfully`, 'success');
        } else {
            const newClient = {
                id: savedClient.id,
                name: savedClient.name,
                email: savedClient.email,
                phone: savedClient.phone || '',
                address: savedClient.address || '',
                payment_terms: savedClient.payment_terms,
                contact_name: savedClient.contact_name || '',
                company: savedClient.company || savedClient.name || '',
                total_invoices: savedClient.total_invoices || 0,
                total_amount: savedClient.total_amount || 0
            };

            appData.clients.push(newClient);
            appData.totalClients++;
            console.log('Added new client:', newClient);
            showToast(`Client "${newClient.name}" added successfully`, 'success');
        }

        console.log('Refreshing client views...');
        renderClients();
        
        closeModal(safeQuerySelector('#client-modal'));

        const form = safeQuerySelector('#client-form');
        if (form) form.reset();
        editingClientId = null;

        if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }

    } catch (error) {
        console.error('Error saving client:', error);
        showToast(`Error saving client: ${error.message || 'Please try again'}`, 'error');

        const saveBtn = safeQuerySelector('#save-client');
        if (saveBtn) {
            saveBtn.textContent = editingClientId ? 'Update Client' : 'Save Client';
            saveBtn.disabled = false;
        }
    }
}

function setupSettingsForm() {
    try {
        const saveSettingsBtn = safeQuerySelector('#save-settings');
        const resetSettingsBtn = safeQuerySelector('#reset-settings');

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', saveSettings);
        }

        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', resetSettings);
        }
    } catch (error) {
        console.error('Error setting up settings form:', error);
    }
}

async function saveSettings() {
    try {
        console.log('Saving settings...');

        const elements = {
            currency: safeQuerySelector('#currency-setting'),
            taxRate: safeQuerySelector('#tax-rate'),
            invoicePrefix: safeQuerySelector('#invoice-prefix'),
            profileName: safeQuerySelector('#profile-name'),
            profileEmail: safeQuerySelector('#profile-email'),
            profilePhone: safeQuerySelector('#profile-phone'),
            profileAddress: safeQuerySelector('#profile-address'),
            profileGSTIN: safeQuerySelector('#profile-gstin'),
            bankName: safeQuerySelector('#bank-name'),
            bankAccount: safeQuerySelector('#bank-account'),
            bankIFSC: safeQuerySelector('#bank-ifsc'),
            bankSWIFT: safeQuerySelector('#bank-swift')
        };

        const missingElements = Object.entries(elements).filter(([key, element]) => !element);
        if (missingElements.length > 0) {
            console.error('Missing form elements:', missingElements.map(([key]) => key));
            if (!missingElements.every(([key]) => key === 'profileGSTIN')) {
                showToast(`Settings form is incomplete. Missing: ${missingElements.map(([key]) => key).join(', ')}`, 'error');
                return;
            }
        }

        const settingsData = {};
        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                if (key === 'taxRate') {
                    const value = parseFloat(element.value);
                    if (isNaN(value) || value < 0 || value > 100) {
                        showToast('Tax rate must be a number between 0 and 100 (0% is allowed)', 'error');
                        element.focus();
                        return;
                    }
                    settingsData[key] = value;
                } else {
                    settingsData[key] = element.value?.trim() || '';
                }
            }
        });

        if (settingsData.taxRate === undefined) {
            return;
        }

        if (!settingsData.profileName || !settingsData.profileEmail) {
            showToast('Profile name and email are required', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(settingsData.profileEmail)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        const saveBtn = safeQuerySelector('#save-settings');
        const originalText = saveBtn?.textContent || 'Save Settings';
        if (saveBtn) {
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
        }

        await saveSettingsToSupabase(settingsData);

        Object.assign(appData.settings, settingsData);

        console.log('Settings saved successfully, new tax rate:', appData.settings.taxRate);

        if (safeQuerySelector('#invoice-modal') && !safeQuerySelector('#invoice-modal').classList.contains('hidden')) {
            calculateInvoiceTotal();
        }

        showToast(`Settings saved successfully. Tax rate: ${appData.settings.taxRate}%`, 'success');

        if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }

    } catch (error) {
        console.error('Error saving settings:', error);
        showToast(`Error saving settings: ${error.message || 'Please try again'}`, 'error');

        const saveBtn = safeQuerySelector('#save-settings');
        if (saveBtn) {
            saveBtn.textContent = 'Save Settings';
            saveBtn.disabled = false;
        }
    }
}

function resetSettings() {
    try {
        if (confirm('Are you sure you want to reset all settings to default?')) {
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
            showToast('Settings reset to default (0% tax rate)', 'success');
        }
    } catch (error) {
        console.error('Error resetting settings:', error);
    }
}

function viewInvoice(invoiceId) {
    try {
        console.log('Viewing invoice:', invoiceId);
        const invoice = appData.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            showInvoiceModal(invoice);
        }
    } catch (error) {
        console.error('Error viewing invoice:', error);
    }
}

function showInvoiceModal(invoice) {
    try {
        const client = appData.clients.find(c => c.id === invoice.clientId);
        const settings = appData.settings;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Invoice ${invoice.id}</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" id="invoice-content-${invoice.id}" style="padding: 40px; background: white; color: black;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                        <div>
                            <h1 style="font-size: 36px; color: #333; margin: 0;">Invoice</h1>
                        </div>
                        <div style="text-align: right;">
                            <div style="margin-bottom: 10px;"><strong>INVOICE NUMBER:</strong> ${invoice.id}</div>
                            <div style="margin-bottom: 10px;"><strong>DATE OF ISSUE:</strong> ${formatDate(invoice.date)}</div>
                            <div><strong>DUE DATE:</strong> ${formatDate(invoice.dueDate)}</div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 10px;">BILLED TO:</div>
                            <div style="line-height: 1.6;">
                                ${client ? client.name : invoice.client}<br>
                                ${client && client.address ? client.address.replace(/\n/g, '<br>') : ''}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; margin-bottom: 10px;">FROM:</div>
                            <div style="line-height: 1.6;">
                                ${settings.profileName}<br>
                                ${settings.profileAddress ? settings.profileAddress.replace(/\n/g, '<br>') : ''}<br>
                                ${settings.profileGSTIN ? `GSTIN: ${settings.profileGSTIN}<br>` : ''}
                                ${settings.profilePhone ? `Phone: ${settings.profilePhone}` : ''}
                                ${settings.profileEmail ? `<br>Email: ${settings.profileEmail}` : ''}
                            </div>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Description</th>
                                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Unit Cost</th>
                                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">QTY</th>
                                <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td style="padding: 12px; border: 1px solid #ddd;">${item.description}</td>
                                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">₹${formatNumber(item.rate)}</td>
                                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">₹${formatNumber(item.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="display: flex; justify-content: space-between;">
                        <div style="width: 45%;">
                            <h3>BANK ACCOUNT DETAILS</h3>
                            <div style="line-height: 1.6; font-size: 14px;">
                                Account Name: ${settings.bankName}<br>
                                Account Number: ${settings.bankAccount}<br>
                                IFSC Code: ${settings.bankIFSC}<br>
                                ${settings.bankSWIFT ? `SWIFT Code: ${settings.bankSWIFT}` : ''}
                            </div>
                        </div>
                        <div style="width: 45%; text-align: right;">
                            <div style="margin-bottom: 10px;"><strong>SUBTOTAL:</strong> ₹${formatNumber(invoice.subtotal)}</div>
                            <div style="margin-bottom: 10px;"><strong>TAX (${settings.taxRate}%):</strong> ₹${formatNumber(invoice.tax)}</div>
                            <div style="font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">
                                <strong>INVOICE TOTAL: ₹${formatNumber(invoice.amount)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn--secondary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn btn--primary" onclick="downloadInvoice('${invoice.id}')">📥 Download PDF</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error showing invoice modal:', error);
    }
}

async function downloadInvoice(invoiceId) {
    try {
        console.log('Downloading invoice as PDF:', invoiceId);
        
        const invoice = appData.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showToast('Invoice not found', 'error');
            return;
        }

        const client = appData.clients.find(c => c.id === invoice.clientId);
        const settings = appData.settings;

        if (typeof window.jspdf === 'undefined') {
            showToast('PDF library is loading. Please try again in a moment.', 'info');
            loadPDFLibrary();
            setTimeout(() => downloadInvoice(invoiceId), 2000);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Set font
        doc.setFont('helvetica');

        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 20, 25);

        // Invoice details (top right)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice: ${invoice.id}`, 140, 20);
        doc.text(`Date: ${invoice.date}`, 140, 26);
        doc.text(`Due: ${invoice.dueDate}`, 140, 32);

        // FROM section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('FROM:', 20, 45);
        
        let yPos = 52;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Profile name
        doc.text(settings.profileName, 20, yPos);
        yPos += 6;
        
        // Address with proper wrapping
        if (settings.profileAddress) {
            doc.setFontSize(8);
            const addressLines = doc.splitTextToSize(settings.profileAddress, 80);
            addressLines.forEach(line => {
                doc.text(line, 20, yPos);
                yPos += 4;
            });
        }
        
        // Contact details
        doc.setFontSize(8);
        if (settings.profileGSTIN) {
            doc.text(`GSTIN: ${settings.profileGSTIN}`, 20, yPos);
            yPos += 4;
        }
        if (settings.profilePhone) {
            doc.text(`Ph: ${settings.profilePhone}`, 20, yPos);
            yPos += 4;
        }
        if (settings.profileEmail) {
            doc.text(`Email: ${settings.profileEmail}`, 20, yPos);
        }

        // TO section
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('TO:', 110, 45);
        
        let toYPos = 52;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Client name
        doc.text(client ? client.name : invoice.client, 110, toYPos);
        toYPos += 6;
        
        // Client address with proper wrapping
        if (client && client.address) {
            doc.setFontSize(8);
            const clientAddressLines = doc.splitTextToSize(client.address, 80);
            clientAddressLines.forEach(line => {
                doc.text(line, 110, toYPos);
                toYPos += 4;
            });
        }

        // Items table
        const tableY = 95;
        
        const tableData = invoice.items.map(item => {
            const rate = parseFloat(item.rate || 0);
            const amount = parseFloat(item.amount || 0);
            const qty = parseInt(item.quantity || 1);
            
            return [
                item.description || '',
                qty.toString(),
                `₹${rate.toFixed(2)}`,
                `₹${amount.toFixed(2)}`
            ];
        });

        doc.autoTable({
            head: [['Description', 'Qty', 'Rate', 'Amount']],
            body: tableData,
            startY: tableY,
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [200, 200, 200],
                textColor: [0, 0, 0],
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 35, halign: 'right' }
            }
        });

        // Totals
        const totalsY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(9);
        
        const subtotal = parseFloat(invoice.subtotal || 0);
        const tax = parseFloat(invoice.tax || 0);
        const total = parseFloat(invoice.amount || 0);
        const taxRate = parseFloat(settings.taxRate || 0);
        
        doc.text('Subtotal:', 140, totalsY);
        doc.text(`₹${subtotal.toFixed(2)}`, 185, totalsY, { align: 'right' });
        
        doc.text(`Tax (${taxRate}%):`, 140, totalsY + 6);
        doc.text(`₹${tax.toFixed(2)}`, 185, totalsY + 6, { align: 'right' });
        
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 140, totalsY + 15);
        doc.text(`₹${total.toFixed(2)}`, 185, totalsY + 15, { align: 'right' });

        // Bank details
        if (settings.bankAccount) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const bankY = totalsY + 10;
            
            doc.text('Bank Details:', 20, bankY);
            doc.text(`Account: ${settings.bankName}`, 20, bankY + 6);
            doc.text(`Number: ${settings.bankAccount}`, 20, bankY + 12);
            doc.text(`IFSC: ${settings.bankIFSC}`, 20, bankY + 18);
            if (settings.bankSWIFT) {
                doc.text(`SWIFT: ${settings.bankSWIFT}`, 20, bankY + 24);
            }
        }

        // Footer
        doc.setFontSize(7);
        doc.text('Thank you for your business!', 20, 270);

        // Save with clean filename
        doc.save(`Invoice-${invoice.id}.pdf`);
        showToast(`Invoice ${invoice.id} downloaded successfully`, 'success');

    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Error generating PDF. Please try again.', 'error');
    }
}

// Additional utility functions for invoice and client management
function editInvoice(invoiceId) {
    try {
        console.log('Editing invoice:', invoiceId);
        openInvoiceModal(invoiceId);
    } catch (error) {
        console.error('Error editing invoice:', error);
    }
}

async function deleteInvoice(invoiceId) {
    try {
        const invoice = appData.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showToast('Invoice not found', 'error');
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete invoice ${invoiceId}?\n\nThis action cannot be undone.`);
        if (!confirmed) {
            return;
        }

        await deleteInvoiceFromSupabase(invoiceId);

        const index = appData.invoices.findIndex(inv => inv.id === invoiceId);
        if (index > -1) {
            appData.invoices.splice(index, 1);
            appData.totalInvoices--;
        }

        renderInvoices();
        renderDashboard();
        renderClients();

        showToast(`Invoice ${invoiceId} deleted successfully`, 'success');

    } catch (error) {
        console.error('Error deleting invoice:', error);
        showToast(`Error deleting invoice: ${error.message}`, 'error');
    }
}

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

// Keyboard shortcuts for power users
document.addEventListener('keydown', (e) => {
    try {
        // Ctrl/Cmd + N for new invoice
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const createBtn = safeQuerySelector('#create-invoice-btn');
            if (createBtn && !safeQuerySelector('.modal:not(.hidden)')) {
                createBtn.click();
                showToast('New invoice shortcut: Ctrl+N', 'info');
            }
        }

        // Ctrl/Cmd + K for new client
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const addClientBtn = safeQuerySelector('#add-client-btn');
            if (addClientBtn && !safeQuerySelector('.modal:not(.hidden)')) {
                addClientBtn.click();
                showToast('New client shortcut: Ctrl+K', 'info');
            }
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            const openModal = safeQuerySelector('.modal:not(.hidden)');
            if (openModal) {
                closeModal(openModal);
            }
        }
    } catch (error) {
        console.error('Error handling keyboard shortcut:', error);
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
            showToast(`Test ${type} message`, type);
        },
        testAnalytics: () => {
            console.log('Analytics State:', analyticsState);
            console.log('Current period:', analyticsState.currentPeriod);
            console.log('Filtered data:', analyticsState.filteredData?.length || 0, 'invoices');
        },
        debugClients: () => {
            console.log('All clients:', appData.clients);
            console.log('Editing client ID:', editingClientId);
            appData.clients.forEach((client, index) => {
                console.log(`Client ${index}:`, {
                    id: client.id,
                    name: client.name,
                    email: client.email,
                    contact_name: client.contact_name,
                    company: client.company
                });
            });                <div class="client-stats modern-stats">
                    <div class="stat-item">
                        <div class="stat-number">${client.total_invoices || 0}</div>
                        <div class="stat-label">Invoices</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-number">₹${formatNumber(client.total_amount || 0)}</div>
                        <div class="stat-label">Revenue</div>
                    </div>
                </div>
            </div>
        `).join('');

        console.log('Clients rendered successfully');
    } catch (error) {
        console.error('Error rendering clients:', error);
    }
}

function editClient(clientId) {
    try {
        console.log('Editing client with ID:', clientId);

        if (!appData.dataLoaded) {
            showToast('Data is still loading. Please wait.', 'info');
            return;
        }

        const client = appData.clients.find(c => c.id === clientId);

        if (!client) {
            console.error('Client not found:', clientId);
            console.log('Available clients:', appData.clients.map(c => ({ id: c.id, name: c.name })));
            showToast('Client not found. Please refresh the page.', 'error');
            return;
        }

        console.log('Found client for editing:', client);

        editingClientId = clientId;

        const form = safeQuerySelector('#client-form');
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
                    const element = safeQuerySelector(`#${fieldId}`);
                    if (element) {
                        element.value = value;
                        populatedFields[fieldId] = value;
                        console.log(`Set ${fieldId} to:`, value);
                        break;
                    }
                }
            });

            console.log('Populated fields:', populatedFields);

            const modalTitle = safeQuerySelector('#client-modal .modal-header h2');
            if (modalTitle) modalTitle.textContent = 'Edit Client';

            const saveBtn = safeQuerySelector('#save-client');
            if (saveBtn) saveBtn.textContent = 'Update Client';

            console.log('Form populated for client:', client.name);
        }, 50);

        openClientModal();

        showToast(`Editing client: ${client.name}`, 'info');
    } catch (error) {
        console.error('Error editing client:', error);
    }
}

async function deleteClient(clientId, clientName) {
    try {
        console.log('Deleting client:', { clientId, clientName });

        if (!appData.dataLoaded) {
            showToast('Data is still loading. Please wait.', 'info');
            return;
        }

        const client = appData.clients.find(c => c.id === clientId);
        if (!client) {
            showToast('Client not found. Please refresh the page.', 'error');
            return;
        }

        const clientInvoices = appData.invoices.filter(inv => inv.clientId === clientId);
        if (clientInvoices.length > 0) {
            showToast(`Cannot delete client "${clientName}" - they have ${clientInvoices.length} invoices. Delete invoices first.`, 'error');
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete client "${clientName}"?\n\nThis action cannot be undone.`);
        if (!confirmed) {
            return;
        }

        await deleteClientFromSupabase(clientId);

        const index = appData.clients.findIndex(c => c.id === clientId);
        if (index > -1) {
            appData.clients.splice(index, 1);
            appData.totalClients--;
        }

        renderClients();

        showToast(`Client "${clientName}" deleted successfully`, 'success');
        console.log('Client deleted successfully:', clientName);

    } catch (error) {
        console.error('Error deleting client:', error);
        showToast(`Error deleting client: ${error.message}`, 'error');
    }
}

function renderAnalytics(period = 'monthly') {
    try {
        console.log('Rendering analytics...');
        
        const analyticsPage = safeQuerySelector('#analytics-page');
        if (analyticsPage && !safeQuerySelector('#modern-analytics-layout')) {
            const existingContent = analyticsPage.querySelector('#analyticsChart')?.parentElement;
            if (existingContent) {
                existingContent.remove();
            }

            const analyticsLayout = document.createElement('div');
            analyticsLayout.id = 'modern-analytics-layout';
            analyticsLayout.innerHTML = `
                <div class="analytics-grid">
                    <div class="chart-container">
                        <div class="chart-header">
                            <div>
                                <div class="chart-title">📊 Earnings Trend Analysis</div>
                                <div class="chart-subtitle" id="chart-subtitle">Monthly earnings overview</div>
                            </div>
                        </div>
                        <div style="height: 300px; position: relative;">
                            <canvas id="analyticsChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="insights-panel">
                        <div class="chart-header">
                            <div class="chart-title">💡 Key Insights</div>
                        </div>
                        <div id="analytics-insights"></div>
                    </div>
                </div>
            `;
            analyticsPage.appendChild(analyticsLayout);
        }

        const dataToUse = analyticsState.filteredData || appData.invoices;
        
        setTimeout(() => {
            renderAnalyticsChart(analyticsState.currentPeriod, dataToUse);
            renderTopClientInsights(dataToUse);
        }, 100);
    } catch (error) {
        console.error('Error rendering analytics:', error);
    }
}

function renderAnalyticsChart(period, invoices) {
    try {
        const analyticsCtx = safeQuerySelector('#analyticsChart');
        if (!analyticsCtx) return;

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, retrying in 1 second...');
            setTimeout(() => renderAnalyticsChart(period, invoices), 1000);
            return;
        }

        if (analyticsChart) {
            analyticsChart.destroy();
        }

        let earningsData = [];
        let label = '';
        let subtitle = '';

        if (period === 'quarterly') {
            earningsData = calculateQuarterlyEarnings(invoices);
            label = 'Quarterly Earnings';
            subtitle = 'Quarterly earnings breakdown';
        } else if (period === 'yearly') {
            earningsData = calculateYearlyEarnings(invoices);
            label = 'Yearly Earnings';
            subtitle = 'Annual earnings comparison';
        } else {
            earningsData = calculateMonthlyEarningsForData(invoices);
            label = 'Monthly Earnings';
            subtitle = 'Monthly earnings overview';
        }

        const subtitleElement = safeQuerySelector('#chart-subtitle');
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
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + formatNumber(value);
                            },
                            color: '#64748b'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#64748b'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering analytics chart:', error);
    }
}

function calculateMonthlyEarningsForData(invoices) {
    try {
        const monthlyData = new Map();

        invoices
            .filter(inv => inv.status === 'Paid')
            .forEach(({ date, amount }) => {
                const d = new Date(date);
                if (!isNaN(d.getTime())) {
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + amount);
                }
            });

        return Array.from(monthlyData, ([month, amount]) => ({ month, amount }))
                     .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
        console.error('Error calculating monthly earnings for data:', error);
        return [];
    }
}

function renderTopClientInsights(invoices) {
    try {
        const insightsContainer = safeQuerySelector('#analytics-insights');
        if (!insightsContainer) return;

        const clientEarnings = new Map();
        const clientInvoiceCounts = new Map();

        invoices.forEach(invoice => {
            const clientId = invoice.clientId;
            const clientName = invoice.client;
            
            if (invoice.status === 'Paid') {
                clientEarnings.set(clientId, (clientEarnings.get(clientId) || 0) + invoice.amount);
            }
            clientInvoiceCounts.set(clientId, (clientInvoiceCounts.get(clientId) || 0) + 1);
            
            if (!clientEarnings.has(clientId + '_name')) {
                clientEarnings.set(clientId + '_name', clientName);
            }
        });

        let topClientId = null;
        let topClientEarnings = 0;
        let topClientName = 'N/A';

        for (const [clientId, earnings] of clientEarnings.entries()) {
            if (typeof clientId === 'string' && !clientId.endsWith('_name') && earnings > topClientEarnings) {
                topClientEarnings = earnings;
                topClientId = clientId;
                topClientName = clientEarnings.get(clientId + '_name') || 'Unknown';
            }
        }

        const totalPaidInvoices = invoices.filter(inv => inv.status === 'Paid');
        const totalEarnings = totalPaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const averageInvoice = totalPaidInvoices.length > 0 ? totalEarnings / totalPaidInvoices.length : 0;
        const totalInvoices = invoices.length;

        let periodInfo = '';
        if (analyticsState.dateRange.from && analyticsState.dateRange.to) {
            periodInfo = `${analyticsState.dateRange.from} to ${analyticsState.dateRange.to}`;
        } else {
            periodInfo = 'All time';
        }

        insightsContainer.innerHTML = `
            <div class="insight-item">
                <div class="insight-label">🏆 Top Client${periodInfo !== 'All time' ? ` (${periodInfo})` : ''}</div>
                <div class="insight-value">${topClientName}</div>
                <div class="insight-change positive">₹${formatNumber(topClientEarnings)} earned</div>
            </div>
            
            <div class="insight-item">
                <div class="insight-label">💰 Total Earnings</div>
                <div class="insight-value">₹${formatNumber(totalEarnings)}</div>
                <div class="insight-change">${totalPaidInvoices.length} paid invoices</div>
            </div>
            
            <div class="insight-item">
                <div class="insight-label">📊 Average Invoice</div>
                <div class="insight-value">₹${formatNumber(averageInvoice)}</div>
                <div class="insight-change">${totalInvoices} total invoices</div>
            </div>
            
            <div class="insight-item">
                <div class="insight-label">🎯 Period</div>
                <div class="insight-value">${analyticsState.currentPeriod.charAt(0).toUpperCase() + analyticsState.currentPeriod.slice(1)}</div>
                <div class="insight-change">${periodInfo}</div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering top client insights:', error);
    }
}

function renderSettings() {
    try {
        console.log('Rendering settings...');

        if (!appData.dataLoaded) {
            console.log('Data not loaded yet, skipping settings render');
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
            const element = safeQuerySelector(`#${id}`);
            if (element) {
                element.value = (value !== null && value !== undefined) ? value : '';
            }
        });

        const taxRateField = safeQuerySelector('#tax-rate');
        if (taxRateField) {
            let datalist = safeQuerySelector('#tax-rate-options');
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
            
            if (!safeQuerySelector('#tax-rate-helper')) {
                const helper = document.createElement('small');
                helper.id = 'tax-rate-helper';
                helper.style.cssText = 'display: block; margin-top: 4px; color: #64748b; font-size: 11px;';
                helper.textContent = 'Enter 0 for no tax, or your applicable GST percentage';
                taxRateField.parentNode.appendChild(helper);
            }
        }

        console.log('Settings rendered with tax rate:', settings.taxRate);
    } catch (error) {
        console.error('Error rendering settings:', error);
    }
}

function setupModals() {
    try {
        console.log('Setting up modals...');

        const invoiceModal = safeQuerySelector('#invoice-modal');
        const invoiceModalOverlay = safeQuerySelector('#invoice-modal-overlay');
        const closeInvoiceModal = safeQuerySelector('#close-invoice-modal');
        const createInvoiceBtn = safeQuerySelector('#create-invoice-btn');
        const newInvoiceBtn = safeQuerySelector('#new-invoice-btn');

        if (createInvoiceBtn) {
            createInvoiceBtn.addEventListener('click', () => openInvoiceModal());
        }
        if (newInvoiceBtn) {
            newInvoiceBtn.addEventListener('click', () => openInvoiceModal());
        }

        if (invoiceModalOverlay) {
            invoiceModalOverlay.addEventListener('click', () => closeModal(invoiceModal));
        }
        if (closeInvoiceModal) {
            closeInvoiceModal.addEventListener('click', () => closeModal(invoiceModal));
        }

        const clientModal = safeQuerySelector('#client-modal');
        const clientModalOverlay = safeQuerySelector('#client-modal-overlay');
        const closeClientModal = safeQuerySelector('#close-client-modal');
        const addClientBtn = safeQuerySelector('#add-client-btn');

        if (addClientBtn) {
            addClientBtn.addEventListener('click', () => openClientModal());
        }

        if (clientModalOverlay) {
            clientModalOverlay.addEventListener('click', () => closeModal(clientModal));
        }
        if (closeClientModal) {
            closeClientModal.addEventListener('click', () => closeModal(clientModal));
        }
    } catch (error) {
        console.error('Error setting up modals:', error);
    }
}

async function openInvoiceModal(invoiceId = null) {
    try {
        console.log('Opening invoice modal...', invoiceId ? 'for editing' : 'for creation');
        const modal = safeQuerySelector('#invoice-modal');
        if (modal) {
            modal.classList.remove('hidden');

            editingInvoiceId = invoiceId;

            if (invoiceId) {
                const invoice = appData.invoices.find(inv => inv.id === invoiceId);
                if (invoice) {
                    const invoiceNumber = safeQuerySelector('#invoice-number');
                    const issueDate = safeQuerySelector('#issue-date');
                    const dueDate = safeQuerySelector('#due-date');
                    
                    if (invoiceNumber) invoiceNumber.value = invoice.id;
                    if (issueDate) issueDate.value = invoice.date;
                    if (dueDate) dueDate.value = invoice.dueDate;

                    const clientSelect = safeQuerySelector('#invoice-client');
                    if (clientSelect) {
                        clientSelect.innerHTML = '<option value="">Select Client</option>' +
                            appData.clients.map(client =>
                                `<option value="${client.id}" ${client.id === invoice.clientId ? 'selected' : ''}>${client.name}</option>`
                            ).join('');
                    }

                    const container = safeQuerySelector('#line-items-container');
                    if (container) {
                        container.innerHTML = '';

                        if (invoice.items && invoice.items.length > 0) {
                            invoice.items.forEach(item => {
                                const lineItem = document.createElement('div');
                                lineItem.className = 'line-item';
                                lineItem.innerHTML = `
                                    <div class="form-row">
                                        <div class="form-group flex-2">
                                            <input type="text" class="form-control" placeholder="Description" value="${item.description}" required>
                                        </div>
                                        <div class="form-group">
                                            <input type="number" class="form-control quantity" placeholder="Qty" min="1" value="${item.quantity}" required>
                                        </div>
                                        <div class="form-group">
                                            <input type="number" class="form-control rate" placeholder="Rate" min="0" step="0.01" value="${item.rate}" required>
                                        </div>
                                        <div class="form-group">
                                            <input type="number" class="form-control amount" placeholder="Amount" value="${item.amount}" readonly>
                                        </div>
                                        <button type="button" class="btn btn--secondary remove-item">Remove</button>
                                    </div>
                                `;
                                container.appendChild(lineItem);
                            });
                        } else {
                            addLineItem();
                        }

                        calculateInvoiceTotal();
                    }
                }
            } else {
                try {
                    const num = await getNextInvoiceNumber();
                    const invoiceNumInput = safeQuerySelector('#invoice-number');
                    if (invoiceNumInput) {
                        invoiceNumInput.value = `${appData.settings.invoicePrefix}-${String(num).padStart(3, '0')}`;
                    }
                } catch (error) {
                    console.error('Error generating invoice number:', error);
                    const invoiceNumInput = safeQuerySelector('#invoice-number');
                    if (invoiceNumInput) {
                        invoiceNumInput.value = `${appData.settings.invoicePrefix}-${String(Date.now()).slice(-3)}`;
                    }
                }

                const today = new Date().toISOString().split('T')[0];
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);

                const issueDateField = safeQuerySelector('#issue-date');
                const dueDateField = safeQuerySelector('#due-date');

                if (issueDateField) issueDateField.value = today;
                if (dueDateField) dueDateField.value = dueDate.toISOString().split('T')[0];

                const clientSelect = safeQuerySelector('#invoice-client');
                if (clientSelect) {
                    clientSelect.innerHTML = '<option value="">Select Client</option>' +
                        appData.clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
                }

                const container = safeQuerySelector('#line-items-container');
                if (container) {
                    container.innerHTML = '';
                    addLineItem();
                }
            }
        }
    } catch (error) {
        console.error('Error opening invoice modal:', error);
    }
}

function openClientModal() {
    try {
        console.log('Opening client modal...');
        const modal = safeQuerySelector('#client-modal');
        if (modal) {
            modal.classList.remove('hidden');

            if (!editingClientId) {
                const form = safeQuerySelector('#client-form');
                if (form) {
                    form.reset();
                }

                const modalTitle = safeQuerySelector('#client-modal .modal-header h2');
                if (modalTitle) modalTitle.textContent = 'Add New Client';

                const saveBtn = safeQuerySelector('#save-client');
                if (saveBtn) saveBtn.textContent = 'Save Client';
            }
        }
    } catch (error) {
        console.error('Error opening client modal:', error);
    }
}

function closeModal(modal) {
    try {
        if (modal) {
            modal.classList.add('hidden');
            editingInvoiceId = null;
            editingClientId = null;
        }
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

function setupForms() {
    try {
        console.log('Setting up forms...');
        setupInvoiceForm();
        setupClientForm();
        setupSettingsForm();
    } catch (error) {
        console.error('Error setting up forms:', error);
    }
}

function setupInvoiceForm() {
    try {
        const addLineItemBtn = safeQuerySelector('#add-line-item');
        const createInvoiceBtn = safeQuerySelector('#create-invoice');
        const saveDraftBtn = safeQuerySelector('#save-draft');

        if (addLineItemBtn) {
            addLineItemBtn.addEventListener('click', addLineItem);
        }

        if (createInvoiceBtn) {
            createInvoiceBtn.addEventListener('click', () => saveInvoice('Pending'));
        }

        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => saveInvoice('Draft'));
        }

        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('quantity') || e.target.classList.contains('rate')) {
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
    } catch (error) {
        console.error('Error setting up invoice form:', error);
    }
}

function addLineItem() {
    try {
        const container = safeQuerySelector('#line-items-container');
        if (container) {
            const lineItem = document.createElement('div');
            lineItem.className = 'line-item';
            lineItem.innerHTML = `
                <div class="form-row">
                    <div class="form-group flex-2">
                        <input type="text" class="form-control" placeholder="Description" required>
                    </div>
                    <div class="form-group">
                        <input type="number" class="form-control quantity" placeholder="Qty" min="1" value="1" required>
                    </div>
                    <div class="form-group">
                        <input type="number" class="form-control rate" placeholder="Rate" min="0" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <input type="number" class="form-control amount" placeholder="Amount" readonly>
                    </div>
                    <button type="button" class="btn btn--secondary remove-item">Remove</button>
                </div>
            `;
            container.appendChild(lineItem);
        }
    } catch (error) {
        console.error('Error adding line item:', error);
    }
}

function removeLineItem(lineItem) {
    try {
        const container = safeQuerySelector('#line-items-container');
        if (container && container.children.length > 1 && lineItem) {
            lineItem.remove();
        }
    } catch (error) {
        console.error('Error removing line item:', error);
    }
}

function calculateLineItem(lineItem) {
    try {
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
    } catch (error) {
        console.error('Error calculating line item:', error);
    }
}

function calculateInvoiceTotal() {
    try {
        const lineItems = safeQuerySelectorAll('.line-item');
        let subtotal = 0;

        lineItems.forEach(item => {
            const amountInput = item.querySelector('.amount');
            if (amountInput) {
                const amount = parseFloat(amountInput.value) || 0;
                subtotal += amount;
            }
        });

        const taxRate = appData.settings.taxRate / 100;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        const subtotalElement = safeQuerySelector('#invoice-subtotal');
        const taxElement = safeQuerySelector('#invoice-tax');
        const totalElement = safeQuerySelector('#invoice-total');

        if (subtotalElement) subtotalElement.textContent = `₹${formatNumber(subtotal)}`;
        if (taxElement) taxElement.textContent = `₹${formatNumber(tax)}`;
        if (totalElement) totalElement.textContent = `₹${formatNumber(total)}`;

        const taxLabels = safeQuerySelectorAll('.total-row span');
        taxLabels.forEach(label => {
            if (label.textContent.includes('Tax')) {
                label.textContent = `Tax (${appData.settings.taxRate}%):`;
            }
        });
    } catch (error) {
        console.error('Error calculating invoice total:', error);
    }
}

async function saveInvoice(status) {
    try {
        console.log('Saving invoice with status:', status);

        const invoiceNumberInput = safeQuerySelector('#invoice-number');
        let invoiceNumber = invoiceNumberInput?.value;
        const clientSelect = safeQuerySelector('#invoice-client');
        const clientId = clientSelect ? clientSelect.value : null;

        if (!clientId) {
            showToast('Please select a client', 'error');
            clientSelect?.focus();
            return;
        }

        const client = appData.clients.find(c => c.id === clientId);
        if (!client) {
            showToast('Selected client not found', 'error');
            return;
        }

        const lineItems = [];
        const lineItemElements = safeQuerySelectorAll('.line-item');

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
                    lineItems.push({description, quantity, rate, amount});
                }
            }
        });

        if (lineItems.length === 0) {
            showToast('Please add at least one line item', 'error');
            return;
        }

        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const tax = subtotal * (appData.settings.taxRate / 100);
        const total = subtotal + tax;

        // COMPLETE ENHANCED INVOICE MANAGER - ALL ISSUES FIXED (FULL VERSION)

// ============================================
// ERROR HANDLING AND DOM UTILITIES
// ============================================

// Enhanced error handling for DOM operations
function safeQuerySelector(selector, context = document) {
    try {
        if (!selector || typeof selector !== 'string') {
            console.warn('Invalid selector provided:', selector);
            return null;
        }
        
        // Escape special characters in selector if needed
        const escapedSelector = selector.replace(/[#;]/g, '\\$&');
        return context.querySelector(escapedSelector);
    } catch (error) {
        console.warn(`Error with selector "${selector}":`, error);
        return null;
    }
}

function safeQuerySelectorAll(selector, context = document) {
    try {
        if (!selector || typeof selector !== 'string') {
            console.warn('Invalid selector provided:', selector);
            return [];
        }
        
        const escapedSelector = selector.replace(/[#;]/g, '\\$&');
        return context.querySelectorAll(escapedSelector);
    } catch (error) {
        console.warn(`Error with selector "${selector}":`, error);
        return [];
    }
}

// Enhanced error handling for async operations
async function withErrorHandling(asyncFn, fallbackFn = null) {
    try {
        return await asyncFn();
    } catch (error) {
        console.error('Async operation failed:', error);
        if (fallbackFn) {
            return fallbackFn(error);
        }
        showToast('An error occurred. Please try again.', 'error');
        return null;
    }
}

// Enhanced DOM ready check
function domReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// Check authentication first
function checkAuth() {
    try {
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
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

// Logout function
function logout() {
    try {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Only proceed if authenticated - FIXED: Wrapped in try-catch
try {
    if (!checkAuth()) {
        console.log('Authentication required, redirecting...');
    }
} catch (error) {
    console.error('Authentication check failed:', error);
}

// Supabase Configuration - FIXED: Added availability check
let supabaseClient = null;

function initializeSupabase() {
    try {
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded. Please include the Supabase CDN script.');
            showToast('Database connection failed. Please refresh the page.', 'error');
            return false;
        }

        const SUPABASE_URL = 'https://kgdewraoanlaqewpbdlo.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZGV3cmFvYW5sYXFld3BiZGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTg3NDksImV4cCI6MjA2OTI5NDc0OX0.wBgDDHcdK0Q9mN6uEPQFEO8gXiJdnrntLJW3dUdh89M';

        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        showToast('Database initialization failed. Please refresh the page.', 'error');
        return false;
    }
}

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

// Analytics state for filters
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

// Utility Functions - FIXED: Moved to prevent illegal return errors
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    try {
        return new Intl.NumberFormat('en-IN').format(num);
    } catch (error) {
        console.error('Error formatting number:', error);
        return String(num || 0);
    }
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
        console.error('Error formatting date:', dateString, error);
        return 'Invalid Date';
    }
}

function escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    try {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    } catch (error) {
        console.error('Error escaping HTML:', error);
        return String(text || '');
    }
}

function showToast(message, type = 'info') {
    try {
        console.log('Toast:', type, message);

        let container = safeQuerySelector('#toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Add icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${icons[type] || icons.info}</span>
                <span>${escapeHtml(message)}</span>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove with animation
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
    } catch (error) {
        console.error('Error showing toast:', error);
    }
}

// Application Initialization
domReady(function() {
    console.log('Initializing application...');
    
    // Add error boundary for the entire application
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        
        // Don't show toast for selector errors as they're handled gracefully
        if (!event.error?.message?.includes('querySelector')) {
            showToast('An unexpected error occurred. Please refresh the page.', 'error');
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        showToast('A network error occurred. Please check your connection.', 'error');
    });

    // Initialize the app with error handling
    withErrorHandling(initializeApp, (error) => {
        console.error('Failed to initialize app:', error);
        showToast('Failed to load application. Please refresh the page.', 'error');
    });
});

async function initializeApp() {
    try {
        console.log('Starting app initialization...');
        
        // Initialize Supabase first
        if (!initializeSupabase()) {
            console.error('Supabase initialization failed');
            showToast('Database connection failed. Some features may not work.', 'warning');
        }

        showLoadingState(true);
        addLogoutButton();
        
        // Only load data if Supabase is available
        if (supabaseClient) {
            await loadDataFromSupabase();
        } else {
            console.warn('Supabase not available, using default data');
            // Set some default data to prevent errors
            appData.clients = [];
            appData.invoices = [];
        }
        
        appData.dataLoaded = true;

        setupNavigation();
        setupModals();
        setupForms();
        setupAnalyticsFilters();
        setupDateRangeFilters();
        renderDashboard();
        renderInvoices();
        renderClients();
        renderAnalytics();
        renderSettings();

        // Add PDF library for invoice downloads
        loadPDFLibrary();

        showLoadingState(false);
        console.log('Application initialized successfully');
        showToast('Application loaded successfully', 'success');
    } catch (error) {
        console.error('Error initializing application:', error);
        showLoadingState(false);
        showToast('Error loading data. Please refresh the page.', 'error');
    }
}

// Load PDF library for invoice downloads
function loadPDFLibrary() {
    try {
        if (!safeQuerySelector('#jspdf-script')) {
            const script = document.createElement('script');
            script.id = 'jspdf-script';
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onerror = () => {
                console.warn('Failed to load jsPDF library');
            };
            document.head.appendChild(script);
            
            const autoTableScript = document.createElement('script');
            autoTableScript.id = 'jspdf-autotable-script';
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            autoTableScript.onerror = () => {
                console.warn('Failed to load jsPDF AutoTable plugin');
            };
            document.head.appendChild(autoTableScript);
        }
    } catch (error) {
        console.error('Error loading PDF library:', error);
    }
}

// Loading state management
function showLoadingState(show) {
    try {
        let loader = safeQuerySelector('#app-loader');
        if (!loader && show) {
            loader = document.createElement('div');
            loader.id = 'app-loader';
            loader.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                    <div style="text-align: center;">
                        <div style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #1FB8CD; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                        <div style="color: #666; font-weight: 500;">Loading...</div>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loader);
        }
        
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error managing loading state:', error);
    }
}

function addLogoutButton() {
    try {
        const sidebarHeader = safeQuerySelector('.sidebar-header');
        if (sidebarHeader && !safeQuerySelector('#logout-btn')) {
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
    } catch (error) {
        console.error('Error adding logout button:', error);
    }
}

async function getNextInvoiceNumber() {
    try {
        if (!supabaseClient) {
            console.warn('Supabase client not available, using timestamp');
            return Date.now() % 1000;
        }

        const { data: invoices, error } = await supabaseClient
            .from('invoices')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error getting next invoice number:', error);
            return Date.now() % 1000;
        }

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
        return Date.now() % 1000;
    }
}

// IMPROVED: Better analytics UI with date pickers
function setupDateRangeFilters() {
    try {
        const analyticsHeader = safeQuerySelector('#analytics-page .page-header');
        if (analyticsHeader && !safeQuerySelector('#modern-analytics-controls')) {
            const existingFilter = safeQuerySelector('#modern-date-filter');
            if (existingFilter) {
                existingFilter.remove();
            }

            const controlsContainer = document.createElement('div');
            controlsContainer.id = 'modern-analytics-controls';
            controlsContainer.innerHTML = `
        <div class="ultra-modern-analytics">
            <!-- Header Section -->
            <div class="analytics-hero">
                <div class="hero-content">
                    <div class="hero-badge">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                        </svg>
                        Analytics Dashboard
                    </div>
                    <h2 class="hero-title">Revenue & Performance Insights</h2>
                    <p class="hero-subtitle">Analyze trends, filter data, and make informed decisions with real-time analytics</p>
                </div>
                <div class="hero-stats">
                    <div class="stat-pill">
                        <span class="stat-icon">📈</span>
                        <span>Live Data</span>
                    </div>
                    <div class="stat-pill">
                        <span class="stat-icon">⚡</span>
                        <span>Real-time</span>
                    </div>
                </div>
            </div>

            <!-- Filter Controls -->
            <div class="filter-section">
                <div class="section-header">
                    <h3>Data Filters</h3>
                    <div class="filter-actions">
                        <button class="action-btn reset-btn" id="clear-filters">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                            Reset
                        </button>
                    </div>
                </div>

                <div class="filters-grid">
                    <!-- Time Period Filter -->
                    <div class="filter-group">
                        <label class="filter-label">
                            <div class="label-content">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H18V1h-2v1H8V1H6v1H4.5C3.11 2 2 3.11 2 4.5v15C2 20.89 3.11 22 4.5 22h15c1.39 0 2.5-1.11 2.5-2.5v-15C22 3.11 20.89 2 19.5 2z"/>
                                </svg>
                                <span>Time Period</span>
                            </div>
                        </label>
                        <div class="select-wrapper">
                            <select id="analytics-period" class="modern-select">
                                <option value="monthly">📊 Monthly View</option>
                                <option value="quarterly">📈 Quarterly View</option>
                                <option value="yearly">📅 Yearly View</option>
                            </select>
                            <div class="select-chevron">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M7 10l5 5 5-5z"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Date Range Filter -->
                    <div class="filter-group date-range-group">
                        <label class="filter-label">
                            <div class="label-content">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H18V1h-2v1H8V1H6v1H4.5C3.11 2 2 3.11 2 4.5v15C2 20.89 3.11 22 4.5 22h15c1.39 0 2.5-1.11 2.5-2.5v-15C22 3.11 20.89 2 19.5 2z"/>
                                </svg>
                                <span>Date Range</span>
                            </div>
                        </label>
                        <div class="date-inputs">
                            <div class="date-input-container">
                                <input type="month" id="date-from" class="date-input">
                                <label class="floating-label">From</label>
                            </div>
                            <div class="date-separator">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                                </svg>
                            </div>
                            <div class="date-input-container">
                                <input type="month" id="date-to" class="date-input">
                                <label class="floating-label">To</label>
                            </div>
                        </div>
                    </div>

                    <!-- Apply Button -->
                    <div class="filter-group apply-group">
                        <button class="apply-btn" id="apply-filters">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>Apply Filters</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Active Filters Display -->
            <div class="active-filters" id="analytics-status">
                <div class="filters-header">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"/>
                    </svg>
                    <span>Active Filters</span>
                </div>
                <div class="filter-chips"></div>
            </div>
        </div>
    `;
            analyticsHeader.parentNode.insertBefore(controlsContainer, analyticsHeader.nextSibling);

            // Setup event listeners
            const applyFiltersBtn = safeQuerySelector('#apply-filters');
            const clearFiltersBtn = safeQuerySelector('#clear-filters');
            const analyticsPeriod = safeQuerySelector('#analytics-period');
            
            if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyAnalyticsFilters);
            if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAnalyticsFilters);
            
            if (analyticsPeriod) {
                analyticsPeriod.addEventListener('change', (e) => {
                    analyticsState.currentPeriod = e.target.value;
                    console.log('Period changed to:', analyticsState.currentPeriod);
                    applyAnalyticsFilters();
                });
            }
        }
    } catch (error) {
        console.error('Error setting up date range filters:', error);
    }
}

function applyAnalyticsFilters() {
    try {
        const fromDate = safeQuerySelector('#date-from')?.value;
        const toDate = safeQuerySelector('#date-to')?.value;
        const period = safeQuerySelector('#analytics-period')?.value || 'monthly';
        const statusDiv = safeQuerySelector('#analytics-status');

        analyticsState.currentPeriod = period;
        analyticsState.dateRange = { from: fromDate, to: toDate };

        console.log('Applying analytics filters:', { period, fromDate, toDate });

        let filteredInvoices = appData.invoices;
        if (fromDate && toDate) {
            if (fromDate > toDate) {
                showToast('From date should be earlier than to date', 'error');
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

            if (statusDiv) {
                statusDiv.innerHTML = `
                    <span>📊 ${filteredInvoices.length} invoices • ₹${formatNumber(totalEarnings)} total • ${fromDate} to ${toDate}</span>
                `;
                statusDiv.className = 'filter-status show';
            }
        } else {
            if (statusDiv) {
                statusDiv.className = 'filter-status';
            }
        }

        analyticsState.filteredData = filteredInvoices;

        renderAnalyticsChart(period, filteredInvoices);
        renderTopClientInsights(filteredInvoices);

        showToast(`Analytics updated: ${period} view${fromDate && toDate ? ' with date filter' : ''}`, 'success');
    } catch (error) {
        console.error('Error applying analytics filters:', error);
    }
}

function clearAnalyticsFilters() {
    try {
        const dateFrom = safeQuerySelector('#date-from');
        const dateTo = safeQuerySelector('#date-to');
        const analyticsPeriod = safeQuerySelector('#analytics-period');
        
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        if (analyticsPeriod) analyticsPeriod.value = 'monthly';
        
        analyticsState.currentPeriod = 'monthly';
        analyticsState.dateRange = { from: null, to: null };
        analyticsState.filteredData = null;

        const statusDiv = safeQuerySelector('#analytics-status');
        if (statusDiv) {
            statusDiv.className = 'filter-status';
        }

        renderAnalyticsChart('monthly', appData.invoices);
        renderTopClientInsights(appData.invoices);
        
        showToast('Analytics filters cleared', 'info');
    } catch (error) {
        console.error('Error clearing analytics filters:', error);
    }
}

// FIXED: Supabase functions with proper error handling
async function loadDataFromSupabase() {
    if (!supabaseClient) {
        console.warn('Supabase client not available');
        return;
    }

    try {
        console.log('Loading data from Supabase...');

        // Load clients
        console.log('Loading clients...');
        const { data: clients, error: clientsError } = await supabaseClient
            .from('clients')
            .select('*')
            .order('name', { ascending: true });

        if (clientsError) {
            console.error('Clients error:', clientsError);
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
        console.log('Clients loaded:', appData.clients.length);

        // Load invoices
        console.log('Loading invoices...');
        const { data: invoices, error: invoicesError } = await supabaseClient
            .from('invoices')
            .select('*')
            .order('date_issued', { ascending: false });

        if (invoicesError) {
            console.error('Invoices error:', invoicesError);
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
        console.log('Invoices loaded:', appData.invoices.length);

        appData.totalEarnings = appData.invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

        calculateMonthlyEarnings();

        // Load settings
        console.log('Loading settings...');
        const { data: settings, error: settingsError } = await supabaseClient
            .from('settings')
            .select('*')
            .eq('user_id', 'default')
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.warn('Settings error (non-critical):', settingsError);
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

        console.log('Data loaded successfully from Supabase');

    } catch (error) {
        console.error('Critical error loading data from Supabase:', error);
        showToast(`Failed to load data: ${error.message || 'Unknown error'}`, 'error');
        throw error;
    }
}

function calculateMonthlyEarnings() {
    try {
        const monthlyData = new Map();

        appData.invoices
            .filter(inv => inv.status === 'Paid')
            .forEach(({ date, amount }) => {
                const d = new Date(date);
                if (!isNaN(d.getTime())) {
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + amount);
                }
            });

        appData.monthlyEarnings = Array.from(monthlyData, ([month, amount]) => ({ month, amount }))
                                       .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
        console.error('Error calculating monthly earnings:', error);
        appData.monthlyEarnings = [];
    }
}

function calculateQuarterlyEarnings(invoices = appData.invoices) {
    try {
        const quarterlyData = new Map();

        invoices
            .filter(inv => inv.status === 'Paid')
            .forEach(({ date, amount }) => {
                const d = new Date(date);
                if (!isNaN(d.getTime())) {
                    const year = d.getFullYear();
                    const quarter = Math.ceil((d.getMonth() + 1) / 3);
                    const quarterKey = `${year}-Q${quarter}`;
                    quarterlyData.set(quarterKey, (quarterlyData.get(quarterKey) || 0) + amount);
                }
            });

        return Array.from(quarterlyData, ([quarter, amount]) => ({ month: quarter, amount }))
                     .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
        console.error('Error calculating quarterly earnings:', error);
        return [];
    }
}

function calculateYearlyEarnings(invoices = appData.invoices) {
    try {
        const yearlyData = new Map();

        invoices
            .filter(inv => inv.status === 'Paid')
            .forEach(({ date, amount }) => {
                const d = new Date(date);
                if (!isNaN(d.getTime())) {
                    const year = d.getFullYear().toString();
                    yearlyData.set(year, (yearlyData.get(year) || 0) + amount);
                }
            });

        return Array.from(yearlyData, ([year, amount]) => ({ month: year, amount }))
                     .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
        console.error('Error calculating yearly earnings:', error);
        return [];
    }
}

async function saveClientToSupabase(clientData) {
    try {
        console.log('Saving client to Supabase:', clientData);

        if (!clientData.name || !clientData.email) {
            throw new Error('Name and email are required');
        }

        if (editingClientId) {
            console.log('Updating existing client:', editingClientId);
            
            const updatePayload = {
                name: clientData.name.trim(),
                email: clientData.email.trim(),
                phone: clientData.phone?.trim() || '',
                address: clientData.address?.trim() || '',
                payment_terms: clientData.paymentTerms || 'net30',
                contact_name: clientData.contactName?.trim() || '',
                company: clientData.company?.trim() || clientData.name.trim(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabaseClient
                .from('clients')
                .update(updatePayload)
                .eq('id', editingClientId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            console.log('Inserting new client');
            
            const insertPayload = {
                name: clientData.name.trim(),
                email: clientData.email.trim(),
                phone: clientData.phone?.trim() || '',
                address: clientData.address?.trim() || '',
                payment_terms: clientData.paymentTerms || 'net30',
                contact_name: clientData.contactName?.trim() || '',
                company: clientData.company?.trim() || clientData.name.trim(),
                total_invoices: 0,
                total_amount: 0
            };

            const { data, error } = await supabaseClient
                .from('clients')
                .insert([insertPayload])
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Error saving client to Supabase:', error);
        
        if (error.message && error.message.includes('column')) {
            console.error('Schema mismatch detected. Available columns might be different.');
            throw new Error(`Database schema issue: ${error.message}. Please check if all client fields exist in your Supabase table.`);
        }
        
        throw error;
    }
}

async function saveInvoiceToSupabase(invoiceData) {
    try {
        console.log('Saving invoice to Supabase:', invoiceData);

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
        console.error('Error saving invoice to Supabase:', error);
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
        console.error('Error updating client totals:', error);
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
        console.error('Error deleting invoice from Supabase:', error);
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
        console.error('Error deleting client from Supabase:', error);
        throw error;
    }
}

async function saveSettingsToSupabase(settingsData) {
    try {
        console.log('Saving settings to Supabase:', settingsData);

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

        console.log('Settings payload:', settingsPayload);

        if (existingSettings) {
            console.log('Updating existing settings');
            const { data, error } = await supabaseClient
                .from('settings')
                .update(settingsPayload)
                .eq('user_id', 'default')
                .select()
                .single();

            if (error) {
                console.error('Settings update error:', error);
                throw error;
            }
            console.log('Settings updated successfully:', data);
            return data;
        } else {
            console.log('Inserting new settings');
            const { data, error } = await supabaseClient
                .from('settings')
                .insert([{
                    user_id: 'default',
                    ...settingsPayload
                }])
                .select()
                .single();

            if (error) {
                console.error('Settings insert error:', error);
                throw error;
            }
            console.log('Settings inserted successfully:', data);
            return data;
        }
    } catch (error) {
        console.error('Critical error saving settings to Supabase:', error);
        throw error;
    }
}

function setupNavigation() {
    try {
        console.log('Setting up navigation...');
        const navLinks = safeQuerySelectorAll('.nav-link');
        const pages = safeQuerySelectorAll('.page');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.dataset.page;
                console.log('Navigating to:', targetPage);

                navLinks.forEach(nl => nl.classList.remove('active'));
                link.classList.add('active');

                pages.forEach(page => page.classList.remove('active'));
                const targetElement = safeQuerySelector(`#${targetPage}-page`);
                if (targetElement) {
                    targetElement.classList.add('active');

                    if (targetPage === 'dashboard') renderDashboard();
                    else if (targetPage === 'invoices') renderInvoices();
                    else if (targetPage === 'clients') renderClients();
                    else if (targetPage === 'analytics') renderAnalytics();
                    else if (targetPage === 'settings') renderSettings();
                } else {
                    console.error('Target page not found:', targetPage);
                }
            });
        });
    } catch (error) {
        console.error('Error setting up navigation:', error);
    }
}

function renderDashboard() {
    try {
        console.log('Rendering dashboard...');
        updateDashboardMetrics();
        renderRecentInvoices();
        setTimeout(() => renderCharts(), 100);
    } catch (error) {
        console.error('Error rendering dashboard:', error);
    }
}

function updateDashboardMetrics() {
    try {
        const totalEarnings = appData.invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

        const avgMonthly = appData.monthlyEarnings.length > 0
            ? appData.monthlyEarnings.reduce((sum, m) => sum + m.amount, 0) / appData.monthlyEarnings.length
            : 0;

        const metricCards = safeQuerySelectorAll('.metric-value');
        if (metricCards.length >= 4) {
            metricCards[0].textContent = `₹${formatNumber(totalEarnings)}`;
            metricCards[1].textContent = appData.totalClients;
            metricCards[2].textContent = appData.totalInvoices;
            metricCards[3].textContent = `₹${formatNumber(avgMonthly)}`;
        }
    } catch (error) {
        console.error('Error updating dashboard metrics:', error);
    }
}

function renderRecentInvoices() {
    try {
        const tbody = safeQuerySelector('#recent-invoices-body');
        if (!tbody) return;

        const recentInvoices = appData.invoices.slice(0, 5);

        tbody.innerHTML = recentInvoices.map(invoice => `
            <tr>
                <td><strong>${invoice.id}</strong></td>
                <td>${invoice.client}</td>
                <td><strong>₹${formatNumber(invoice.amount)}</strong></td>
                <td>${formatDate(invoice.date)}</td>
                <td><span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error rendering recent invoices:', error);
    }
}

function renderCharts(period = 'monthly') {
    try {
        console.log('Rendering charts for period:', period);

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, retrying in 1 second...');
            setTimeout(() => renderCharts(period), 1000);
            return;
        }

        let earningsData = appData.monthlyEarnings;

        if (period === 'quarterly') {
            earningsData = calculateQuarterlyEarnings();
        } else if (period === 'yearly') {
            earningsData = calculateYearlyEarnings();
        }

        const monthlyCtx = safeQuerySelector('#monthlyChart');
        if (monthlyCtx) {
            try {
                if (monthlyChart) {
                    monthlyChart.destroy();
                }

                monthlyChart = new Chart(monthlyCtx, {
                    type: 'line',
                    data: {
                        labels: earningsData.map(m => m.month),
                        datasets: [{
                            label: 'Earnings',
                            data: earningsData.map(m => m.amount),
                            borderColor: '#1FB8CD',
                            backgroundColor: 'rgba(31, 184, 205, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#1FB8CD',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + formatNumber(value);
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error rendering monthly chart:', error);
            }
        }

        const clientCtx = safeQuerySelector('#clientChart');
        if (clientCtx && appData.clients.length > 0) {
            try {
                if (clientChart) {
                    clientChart.destroy();
                }

                const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325'];

                clientChart = new Chart(clientCtx, {
                    type: 'pie',
                    data: {
                        labels: appData.clients.map(c => c.name),
                        datasets: [{
                            data: appData.clients.map(c => c.total_amount || 0),
                            backgroundColor: colors,
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                        return `${label}: ₹${formatNumber(value)} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error rendering client chart:', error);
            }
        }
    } catch (error) {
        console.error('Error rendering charts:', error);
    }
}

function setupAnalyticsFilters() {
    try {
        console.log('Analytics filters setup complete');
    } catch (error) {
        console.error('Error setting up analytics filters:', error);
    }
}

function renderInvoices() {
    try {
        console.log('Rendering invoices...');
        const tbody = safeQuerySelector('#invoices-body');
        if (!tbody) return;

        tbody.innerHTML = appData.invoices.map(invoice => `
            <tr>
                <td><strong>${invoice.id}</strong></td>
                <td>${invoice.client}</td>
                <td><strong>₹${formatNumber(invoice.amount)}</strong></td>
                <td>${formatDate(invoice.date)}</td>
                <td>${formatDate(invoice.dueDate)}</td>
                <td><span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewInvoice('${invoice.id}')">👁️</button>
                        <button class="action-btn edit" onclick="editInvoice('${invoice.id}')">✏️</button>
                        <button class="action-btn download" onclick="downloadInvoice('${invoice.id}')" title="Download PDF">📥</button>
                        <button class="action-btn delete" onclick="deleteInvoice('${invoice.id}')">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');

        const filterTabs = safeQuerySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.removeEventListener('click', handleFilterClick);
            tab.addEventListener('click', handleFilterClick);
        });
    } catch (error) {
        console.error('Error rendering invoices:', error);
    }
}

function handleFilterClick(e) {
    try {
        const tab = e.target;
        const filterTabs = safeQuerySelectorAll('.filter-tab');

        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        filterInvoices(tab.dataset.filter);
    } catch (error) {
        console.error('Error handling filter click:', error);
    }
}

function filterInvoices(filter) {
    try {
        console.log('Filtering invoices by:', filter);
        const rows = safeQuerySelectorAll('#invoices-body tr');
        rows.forEach(row => {
            const statusElement = row.querySelector('.status-badge');
            if (statusElement) {
                const status = statusElement.textContent.toLowerCase();
                if (filter === 'all' || status === filter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    } catch (error) {
        console.error('Error filtering invoices:', error);
    }
}

function renderClients() {
    try {
        console.log('Rendering clients...');
        const grid = safeQuerySelector('#clients-grid');
        if (!grid || !appData.dataLoaded) {
            console.log('Grid not found or data not loaded');
            return;
        }

        if (appData.clients.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-16); color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 4rem; margin-bottom: var(--space-4); opacity: 0.5;">👥</div>
                    <h3 style="color: white; margin-bottom: var(--space-2);">No clients yet</h3>
                    <p style="margin-bottom: var(--space-6);">Add your first client to get started</p>
                    <button class="btn btn--primary" onclick="openClientModal()">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 0.5rem;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Your First Client
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = appData.clients.map((client, index) => `
            <div class="client-card modern-card" data-client-id="${client.id}" data-client-index="${index}">
                <div class="client-card-header">
                    <div class="client-avatar">
                        <span class="client-initial">${escapeHtml(client.name).charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="client-actions">
                        <button class="client-action-btn edit modern-btn" 
                                data-client-id="${client.id}" 
                                data-client-index="${index}" 
                                title="Edit client"
                                onclick="editClient('${client.id}')">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="client-action-btn delete modern-btn delete-btn" 
                                data-client-id="${client.id}" 
                                data-client-name="${escapeHtml(client.name)}" 
                                title="Delete client"
                                onclick="deleteClient('${client.id}', '${escapeHtml(client.name)}')">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="client-info">
                    <h4 class="client-name">${escapeHtml(client.name)}</h4>
                    <div class="client-details">
                        <div class="detail-item">
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                            <span>${escapeHtml(client.email)}</span>
                        </div>
                        ${client.phone ? `
                            <div class="detail-item">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                </svg>
                                <span>${escapeHtml(client.phone)}</span>
                            </div>
                        ` : ''}
                        ${client.contact_name || client.contactName ? `
                            <div class="detail-item">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                <span>${escapeHtml(client.contact_name || client.contactName || '')}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="client-stats modern-stats">
                    <div
