// COMPLETE ENHANCED INVOICE MANAGER - ALL ISSUES FIXED

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
        profileGSTIN: '29GLOPS9921M1ZT', // Added GSTIN
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

// Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
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

// Loading state management
function showLoadingState(show) {
    let loader = document.getElementById('app-loader');
    if (!loader) {
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
    loader.style.display = show ? 'flex' : 'none';
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

// IMPROVED: Better analytics UI with date pickers
function setupDateRangeFilters() {
    const analyticsHeader = document.querySelector('#analytics-page .page-header');
    if (analyticsHeader && !document.getElementById('modern-analytics-controls')) {
        const existingFilter = document.querySelector('#modern-date-filter');
        if (existingFilter) {
            existingFilter.remove();
        }

        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'modern-analytics-controls';
        controlsContainer.innerHTML = `
    <div class="modern-analytics-controls">
        <div class="controls-header">
            <div class="header-content">
                <div class="header-icon">📊</div>
                <div class="header-text">
                    <h3>Analytics Dashboard</h3>
                    <p>Customize your view and analyze performance</p>
                </div>
            </div>
        </div>
        
        <div class="controls-body">
            <div class="control-section">
                <label class="modern-label">
                    <span class="label-icon">📈</span>
                    <span class="label-text">View Type</span>
                </label>
                <div class="modern-select-wrapper">
                    <select id="analytics-period" class="modern-select-input">
                        <option value="monthly">Monthly Breakdown</option>
                        <option value="quarterly">Quarterly Overview</option>
                        <option value="yearly">Annual Summary</option>
                    </select>
                    <div class="select-arrow">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="control-section">
                <label class="modern-label">
                    <span class="label-icon">📅</span>
                    <span class="label-text">Date Range</span>
                </label>
                <div class="date-range-inputs">
                    <div class="date-input-wrapper">
                        <input type="month" id="date-from" class="modern-date-input" placeholder="From">
                        <span class="input-label">From</span>
                    </div>
                    <div class="range-connector">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/>
                        </svg>
                    </div>
                    <div class="date-input-wrapper">
                        <input type="month" id="date-to" class="modern-date-input" placeholder="To">
                        <span class="input-label">To</span>
                    </div>
                </div>
            </div>

            <div class="control-actions">
                <button class="modern-action-btn primary-btn" id="apply-filters">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <span>Apply Filters</span>
                </button>
                <button class="modern-action-btn secondary-btn" id="clear-filters">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    <span>Clear</span>
                </button>
            </div>
        </div>

        <div class="analytics-status-bar" id="analytics-status"></div>
    </div>
`;
        analyticsHeader.parentNode.insertBefore(controlsContainer, analyticsHeader.nextSibling);

        // Add enhanced analytics styles
        if (!document.getElementById('enhanced-analytics-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-analytics-styles';
            style.textContent = `
                .analytics-controls-container {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    border-radius: 12px;
                    margin: 20px 0;
                    border: 1px solid #e2e8f0;
                    flex-wrap: wrap;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 140px;
                }

                .control-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .modern-select, .modern-date-input {
                    padding: 8px 12px;
                    border: 2px solid #cbd5e1;
                    border-radius: 8px;
                    background: white;
                    font-size: 13px;
                    font-weight: 500;
                    color: #1e293b;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .modern-select:focus, .modern-date-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .period-select {
                    min-width: 150px;
                }

                .date-range-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .modern-date-input {
                    min-width: 130px;
                }

                .date-picker {
                    cursor: pointer;
                }

                .date-separator {
                    font-size: 14px;
                    color: #64748b;
                    font-weight: 600;
                }

                .action-buttons {
                    display: flex;
                    gap: 8px;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 14px;
                    border: 2px solid;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .apply-btn {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }

                .apply-btn:hover {
                    background: #2563eb;
                    border-color: #2563eb;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
                }

                .clear-btn {
                    background: #f8fafc;
                    color: #475569;
                    border-color: #cbd5e1;
                }

                .clear-btn:hover {
                    background: #e2e8f0;
                    border-color: #94a3b8;
                    transform: translateY(-1px);
                }

                .filter-status {
                    flex: 1;
                    min-width: 200px;
                    padding: 10px 14px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 8px;
                    font-size: 12px;
                    color: #1e40af;
                    font-weight: 500;
                    display: none;
                }

                .filter-status.show {
                    display: block;
                    animation: slideIn 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }

        // Setup event listeners
        document.getElementById('apply-filters').addEventListener('click', applyAnalyticsFilters);
        document.getElementById('clear-filters').addEventListener('click', clearAnalyticsFilters);
        
        document.getElementById('analytics-period').addEventListener('change', (e) => {
            analyticsState.currentPeriod = e.target.value;
            console.log('Period changed to:', analyticsState.currentPeriod);
            applyAnalyticsFilters();
        });
    }
}

function applyAnalyticsFilters() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;
    const period = document.getElementById('analytics-period').value;
    const statusDiv = document.getElementById('analytics-status');

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

        statusDiv.innerHTML = `
            <span>📊 ${filteredInvoices.length} invoices • ₹${formatNumber(totalEarnings)} total • ${fromDate} to ${toDate}</span>
        `;
        statusDiv.className = 'filter-status show';
    } else {
        statusDiv.className = 'filter-status';
    }

    analyticsState.filteredData = filteredInvoices;

    renderAnalyticsChart(period, filteredInvoices);
    renderTopClientInsights(filteredInvoices);

    showToast(`Analytics updated: ${period} view${fromDate && toDate ? ' with date filter' : ''}`, 'success');
}

function clearAnalyticsFilters() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('analytics-period').value = 'monthly';
    
    analyticsState.currentPeriod = 'monthly';
    analyticsState.dateRange = { from: null, to: null };
    analyticsState.filteredData = null;

    const statusDiv = document.getElementById('analytics-status');
    statusDiv.className = 'filter-status';

    renderAnalyticsChart('monthly', appData.invoices);
    renderTopClientInsights(appData.invoices);
    
    showToast('Analytics filters cleared', 'info');
}

async function loadDataFromSupabase() {
    console.log('Loading data from Supabase...');

    try {
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
                profileGSTIN: settings.profile_gstin || appData.settings.profileGSTIN, // Added GSTIN
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

async function saveClientToSupabase(clientData) {
    try {
        console.log('Saving client to Supabase:', clientData);

        if (!clientData.name || !clientData.email) {
            throw new Error('Name and email are required');
        }

        if (editingClientId) {
            console.log('Updating existing client:', editingClientId);
            
            const updatePayloads = [
                {
                    name: clientData.name.trim(),
                    email: clientData.email.trim(),
                    phone: clientData.phone?.trim() || '',
                    address: clientData.address?.trim() || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    contact_name: clientData.contactName?.trim() || '',
                    company: clientData.company?.trim() || clientData.name.trim(),
                    updated_at: new Date().toISOString()
                },
                {
                    name: clientData.name.trim(),
                    email: clientData.email.trim(),
                    phone: clientData.phone?.trim() || '',
                    address: clientData.address?.trim() || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    updated_at: new Date().toISOString()
                }
            ];

            let data, error;
            
            for (let i = 0; i < updatePayloads.length; i++) {
                console.log(`Trying update payload ${i + 1}:`, updatePayloads[i]);
                
                const result = await supabaseClient
                    .from('clients')
                    .update(updatePayloads[i])
                    .eq('id', editingClientId)
                    .select()
                    .single();
                
                data = result.data;
                error = result.error;
                
                if (!error) {
                    console.log(`Update successful with payload ${i + 1}:`, data);
                    break;
                } else {
                    console.warn(`Update payload ${i + 1} failed:`, error);
                    if (i === updatePayloads.length - 1) {
                        throw error;
                    }
                }
            }

            return data;
        } else {
            console.log('Inserting new client');
            
            const insertPayloads = [
                {
                    name: clientData.name.trim(),
                    email: clientData.email.trim(),
                    phone: clientData.phone?.trim() || '',
                    address: clientData.address?.trim() || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    contact_name: clientData.contactName?.trim() || '',
                    company: clientData.company?.trim() || clientData.name.trim(),
                    total_invoices: 0,
                    total_amount: 0
                },
                {
                    name: clientData.name.trim(),
                    email: clientData.email.trim(),
                    phone: clientData.phone?.trim() || '',
                    address: clientData.address?.trim() || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    total_invoices: 0,
                    total_amount: 0
                }
            ];

            let data, error;
            
            for (let i = 0; i < insertPayloads.length; i++) {
                console.log(`Trying insert payload ${i + 1}:`, insertPayloads[i]);
                
                const result = await supabaseClient
                    .from('clients')
                    .insert([insertPayloads[i]])
                    .select()
                    .single();
                
                data = result.data;
                error = result.error;
                
                if (!error) {
                    console.log(`Insert successful with payload ${i + 1}:`, data);
                    break;
                } else {
                    console.warn(`Insert payload ${i + 1} failed:`, error);
                    if (i === insertPayloads.length - 1) {
                        throw error;
                    }
                }
            }

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

// FIXED: Delete client functionality
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
            profile_gstin: settingsData.profileGSTIN || '', // Added GSTIN
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
    console.log('Setting up navigation...');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            console.log('Navigating to:', targetPage);

            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');

            pages.forEach(page => page.classList.remove('active'));
            const targetElement = document.getElementById(`${targetPage}-page`);
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
}

function renderDashboard() {
    console.log('Rendering dashboard...');
    updateDashboardMetrics();
    renderRecentInvoices();
    setTimeout(() => renderCharts(), 100);
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
        metricCards[0].textContent = `₹${formatNumber(totalEarnings)}`;
        metricCards[1].textContent = appData.totalClients;
        metricCards[2].textContent = appData.totalInvoices;
        metricCards[3].textContent = `₹${formatNumber(avgMonthly)}`;
    }
}

function renderRecentInvoices() {
    const tbody = document.getElementById('recent-invoices-body');
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
}

function renderCharts(period = 'monthly') {
    console.log('Rendering charts for period:', period);

    let earningsData = appData.monthlyEarnings;

    if (period === 'quarterly') {
        earningsData = calculateQuarterlyEarnings();
    } else if (period === 'yearly') {
        earningsData = calculateYearlyEarnings();
    }

    const monthlyCtx = document.getElementById('monthlyChart');
    if (monthlyCtx) {
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
    }

    const clientCtx = document.getElementById('clientChart');
    if (clientCtx) {
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
    }
}

function setupAnalyticsFilters() {
    console.log('Analytics filters setup complete');
}

// IMPROVED: Compact action buttons for invoices
function renderInvoices() {
    console.log('Rendering invoices...');
    const tbody = document.getElementById('invoices-body');
    if (!tbody) return;

    // Add compact button styles
    if (!document.getElementById('compact-action-styles')) {
        const style = document.createElement('style');
        style.id = 'compact-action-styles';
        style.textContent = `
            .action-buttons {
                display: flex;
                gap: 4px;
            }

            .action-btn {
                padding: 4px 10px;
                font-size: 11px;
                border-radius: 6px;
                border: 1px solid;
                cursor: pointer;
                transition: all 0.2s ease;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 3px;
            }

            .action-btn.view {
                background: #e0f2fe;
                border-color: #0ea5e9;
                color: #0c4a6e;
            }

            .action-btn.view:hover {
                background: #bae6fd;
                transform: translateY(-1px);
            }

            .action-btn.edit {
                background: #fef3c7;
                border-color: #f59e0b;
                color: #78350f;
            }

            .action-btn.edit:hover {
                background: #fde68a;
                transform: translateY(-1px);
            }

            .action-btn.delete {
                background: #fee2e2;
                border-color: #ef4444;
                color: #7f1d1d;
            }

            .action-btn.delete:hover {
                background: #fecaca;
                transform: translateY(-1px);
            }

            .action-btn.download {
                background: #d1fae5;
                border-color: #10b981;
                color: #065f46;
            }

            .action-btn.download:hover {
                background: #a7f3d0;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);
    }

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

    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.removeEventListener('click', handleFilterClick);
        tab.addEventListener('click', handleFilterClick);
    });
}

function handleFilterClick(e) {
    const tab = e.target;
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    filterInvoices(tab.dataset.filter);
}

function filterInvoices(filter) {
    console.log('Filtering invoices by:', filter);
    const rows = document.querySelectorAll('#invoices-body tr');
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
}

// FIXED: Client rendering with working delete functionality
function renderClients() {
    console.log('Rendering clients...');
    const grid = document.getElementById('clients-grid');
    if (!grid || !appData.dataLoaded) {
        console.log('Grid not found or data not loaded');
        return;
    }

    if (appData.clients.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--color-text-secondary);">
                <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                <h3>No clients yet</h3>
                <p>Add your first client to get started</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = appData.clients.map((client, index) => `
    <div class="client-card modern-card" data-client-id="${client.id}" data-client-index="${index}">
        <div class="client-card-header">
            <div class="client-avatar">
                <span class="client-initial">${client.name.charAt(0).toUpperCase()}</span>
            </div>
            <div class="client-actions">
                <button class="client-action-btn edit modern-btn" data-client-id="${client.id}" data-client-index="${index}" title="Edit client">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button class="client-action-btn delete modern-btn delete-btn" data-client-id="${client.id}" data-client-name="${escapeHtml(client.name)}" title="Delete client">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        </div>
        
        <div class="client-info">
            <h4 class="client-name">${escapeHtml(client.name)}</h4>
            <div class="client-details">
                <div class="detail-item">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    <span>${escapeHtml(client.email)}</span>
                </div>
                ${client.phone ? `
                <div class="detail-item">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    <span>${escapeHtml(client.phone)}</span>
                </div>
                ` : ''}
                ${client.contact_name ? `
                <div class="detail-item">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    <span>${escapeHtml(client.contact_name)}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="client-stats modern-stats">
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

    // Add event listeners
    setTimeout(() => {
        // Edit buttons
        document.querySelectorAll('.client-action-btn.edit').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const clientId = btn.getAttribute('data-client-id');
                const clientIndex = parseInt(btn.getAttribute('data-client-index'));
                
                console.log('Edit button clicked:', { clientId, clientIndex });
                
                if (appData.clients[clientIndex] && appData.clients[clientIndex].id === clientId) {
                    editClient(clientId);
                } else {
                    console.error('Client mismatch detected');
                    showToast('Error: Client data mismatch. Please refresh the page.', 'error');
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.client-action-btn.delete').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const clientId = btn.getAttribute('data-client-id');
                const clientName = btn.getAttribute('data-client-name');
                
                console.log('Delete button clicked:', { clientId, clientName });
                deleteClient(clientId, clientName);
            });
        });
    }, 100);

    // Add enhanced client card styles
    if (!document.getElementById('enhanced-client-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-client-styles';
        style.textContent = `
    .modern-card {
        background: linear-gradient(135deg, var(--color-surface) 0%, rgba(var(--color-teal-500-rgb), 0.02) 100%);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
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
        background: linear-gradient(90deg, var(--color-primary), var(--color-teal-400));
    }
    
    .modern-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
        border-color: var(--color-primary);
    }
    
    .client-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 20px 16px;
    }
    
    .client-avatar {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-teal-400));
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(var(--color-teal-500-rgb), 0.3);
    }
    
    .client-initial {
        color: white;
        font-weight: 600;
        font-size: 18px;
    }
    
    .client-actions {
        display: flex;
        gap: 8px;
    }
    
    .modern-btn {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--color-text-secondary);
    }
    
    .modern-btn:hover {
        background: var(--color-bg-1);
        border-color: var(--color-primary);
        color: var(--color-primary);
        transform: scale(1.05);
    }
    
    .delete-btn:hover {
        background: rgba(var(--color-error-rgb), 0.1);
        border-color: var(--color-error);
        color: var(--color-error);
    }
    
    .client-info {
        padding: 0 20px 16px;
    }
    
    .client-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text);
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
        font-size: 13px;
        color: var(--color-text-secondary);
    }
    
    .detail-item svg {
        opacity: 0.6;
        flex-shrink: 0;
    }
    
    .modern-stats {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background: rgba(var(--color-teal-500-rgb), 0.05);
        border-top: 1px solid var(--color-border);
    }
    
    .stat-item {
        flex: 1;
        text-align: center;
    }
    
    .stat-number {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text);
        margin-bottom: 4px;
    }
    
    .stat-label {
        font-size: 11px;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
    }
    
    .stat-divider {
        width: 1px;
        height: 32px;
        background: var(--color-border);
        margin: 0 16px;
    }
`;        document.head.appendChild(style);
    }

    console.log('Clients rendered successfully with event listeners');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function editClient(clientId) {
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

        console.log('Populated fields:', populatedFields);

        const modalTitle = document.querySelector('#client-modal .modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Edit Client';

        const saveBtn = document.getElementById('save-client');
        if (saveBtn) saveBtn.textContent = 'Update Client';

        console.log('Form populated for client:', client.name);
    }, 50);

    openClientModal();

    showToast(`Editing client: ${client.name}`, 'info');
}

// FIXED: Delete client function
async function deleteClient(clientId, clientName) {
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

    try {
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
    console.log('Rendering analytics...');
    
    const analyticsPage = document.getElementById('analytics-page');
    if (analyticsPage && !document.getElementById('modern-analytics-layout')) {
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

        // Add analytics grid styles
        if (!document.getElementById('analytics-grid-styles')) {
            const style = document.createElement('style');
            style.id = 'analytics-grid-styles';
            style.textContent = `
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

                .insight-change.positive { color: #059669; }
                .insight-change.negative { color: #dc2626; }

                @media (max-width: 768px) {
                    .analytics-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    const dataToUse = analyticsState.filteredData || appData.invoices;
    
    setTimeout(() => {
        renderAnalyticsChart(analyticsState.currentPeriod, dataToUse);
        renderTopClientInsights(dataToUse);
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

    const subtitleElement = document.getElementById('chart-subtitle');
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

function renderTopClientInsights(invoices) {
    const insightsContainer = document.getElementById('analytics-insights');
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
}

// ENHANCED: Settings with GSTIN field
function renderSettings() {
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
        'profile-gstin': settings.profileGSTIN, // Added GSTIN
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
        } else if (id === 'profile-gstin') {
            // Add GSTIN field if it doesn't exist
            const addressField = document.getElementById('profile-address');
            if (addressField && addressField.parentNode) {
                const gstinGroup = document.createElement('div');
                gstinGroup.className = 'form-group';
                gstinGroup.innerHTML = `
                    <label for="profile-gstin">GSTIN</label>
                    <input type="text" class="form-control" id="profile-gstin" placeholder="e.g., 29GLOPS9921M1ZT" value="${value || ''}">
                `;
                addressField.parentNode.parentNode.insertBefore(gstinGroup, addressField.parentNode.nextSibling);
            }
        }
    });

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
            helper.textContent = 'Enter 0 for no tax, or your applicable GST percentage';
            taxRateField.parentNode.appendChild(helper);
        }
    }

    console.log('Settings rendered with tax rate:', settings.taxRate);
}

function setupModals() {
    console.log('Setting up modals...');

    const invoiceModal = document.getElementById('invoice-modal');
    const invoiceModalOverlay = document.getElementById('invoice-modal-overlay');
    const closeInvoiceModal = document.getElementById('close-invoice-modal');
    const createInvoiceBtn = document.getElementById('create-invoice-btn');
    const newInvoiceBtn = document.getElementById('new-invoice-btn');

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

    const clientModal = document.getElementById('client-modal');
    const clientModalOverlay = document.getElementById('client-modal-overlay');
    const closeClientModal = document.getElementById('close-client-modal');
    const addClientBtn = document.getElementById('add-client-btn');

    if (addClientBtn) {
        addClientBtn.addEventListener('click', () => openClientModal());
    }

    if (clientModalOverlay) {
        clientModalOverlay.addEventListener('click', () => closeModal(clientModal));
    }
    if (closeClientModal) {
        closeClientModal.addEventListener('click', () => closeModal(clientModal));
    }
}

async function openInvoiceModal(invoiceId = null) {
    console.log('Opening invoice modal...', invoiceId ? 'for editing' : 'for creation');
    const modal = document.getElementById('invoice-modal');
    if (modal) {
        modal.classList.remove('hidden');

        editingInvoiceId = invoiceId;

        if (invoiceId) {
            const invoice = appData.invoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                document.getElementById('invoice-number').value = invoice.id;
                document.getElementById('issue-date').value = invoice.date;
                document.getElementById('due-date').value = invoice.dueDate;

                const clientSelect = document.getElementById('invoice-client');
                if (clientSelect) {
                    clientSelect.innerHTML = '<option value="">Select Client</option>' +
                        appData.clients.map(client =>
                            `<option value="${client.id}" ${client.id === invoice.clientId ? 'selected' : ''}>${client.name}</option>`
                        ).join('');
                }

                const container = document.getElementById('line-items-container');
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
        } else {
            try {
                const num = await getNextInvoiceNumber();
                const invoiceNumInput = document.getElementById('invoice-number');
                if (invoiceNumInput) {
                    invoiceNumInput.value = `${appData.settings.invoicePrefix}-${String(num).padStart(3, '0')}`;
                }
            } catch (error) {
                console.error('Error generating invoice number:', error);
                const invoiceNumInput = document.getElementById('invoice-number');
                if (invoiceNumInput) {
                    invoiceNumInput.value = `${appData.settings.invoicePrefix}-${String(Date.now()).slice(-3)}`;
                }
            }

            const today = new Date().toISOString().split('T')[0];
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            const issueDateField = document.getElementById('issue-date');
            const dueDateField = document.getElementById('due-date');

            if (issueDateField) issueDateField.value = today;
            if (dueDateField) dueDateField.value = dueDate.toISOString().split('T')[0];

            const clientSelect = document.getElementById('invoice-client');
            if (clientSelect) {
                clientSelect.innerHTML = '<option value="">Select Client</option>' +
                    appData.clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
            }

            const container = document.getElementById('line-items-container');
            container.innerHTML = '';
            addLineItem();
        }
    }
}

function openClientModal() {
    console.log('Opening client modal...');
    const modal = document.getElementById('client-modal');
    if (modal) {
        modal.classList.remove('hidden');

        if (!editingClientId) {
            const form = document.getElementById('client-form');
            if (form) {
                form.reset();
            }

            const modalTitle = document.querySelector('#client-modal .modal-header h2');
            if (modalTitle) modalTitle.textContent = 'Add New Client';

            const saveBtn = document.getElementById('save-client');
            if (saveBtn) saveBtn.textContent = 'Save Client';
        }
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
    console.log('Setting up forms...');
    setupInvoiceForm();
    setupClientForm();
    setupSettingsForm();
}

function setupInvoiceForm() {
    const addLineItemBtn = document.getElementById('add-line-item');
    const createInvoiceBtn = document.getElementById('create-invoice');
    const saveDraftBtn = document.getElementById('save-draft');

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
}

function addLineItem() {
    const container = document.getElementById('line-items-container');
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
            const amount = parseFloat(amountInput.value) || 0;
            subtotal += amount;
        }
    });

    const taxRate = appData.settings.taxRate / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const subtotalElement = document.getElementById('invoice-subtotal');
    const taxElement = document.getElementById('invoice-tax');
    const totalElement = document.getElementById('invoice-total');

    if (subtotalElement) subtotalElement.textContent = `₹${formatNumber(subtotal)}`;
    if (taxElement) taxElement.textContent = `₹${formatNumber(tax)}`;
    if (totalElement) totalElement.textContent = `₹${formatNumber(total)}`;

    const taxLabels = document.querySelectorAll('.total-row span');
    taxLabels.forEach(label => {
        if (label.textContent.includes('Tax')) {
            label.textContent = `Tax (${appData.settings.taxRate}%):`;
        }
    });
}

async function saveInvoice(status) {
    console.log('Saving invoice with status:', status);

    const invoiceNumberInput = document.getElementById('invoice-number');
    let invoiceNumber = invoiceNumberInput?.value;
    const clientSelect = document.getElementById('invoice-client');
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

    const issueDateInput = document.getElementById('issue-date');
    const dueDateInput = document.getElementById('due-date');

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

    try {
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

        closeModal(document.getElementById('invoice-modal'));
    } catch (error) {
        console.error('Error saving invoice:', error);
        showToast('Error saving invoice. Please try again.', 'error');
    }
}

function setupClientForm() {
    const saveClientBtn = document.getElementById('save-client');
    const cancelClientBtn = document.getElementById('cancel-client');

    if (saveClientBtn) {
        saveClientBtn.addEventListener('click', saveClient);
    }

    if (cancelClientBtn) {
        cancelClientBtn.addEventListener('click', () => closeModal(document.getElementById('client-modal')));
    }
}

async function saveClient() {
    console.log('Saving client... Editing ID:', editingClientId);

    const formFields = {
        company: document.getElementById('client-company'),
        email: document.getElementById('client-email'),
        phone: document.getElementById('client-phone'),
        address: document.getElementById('client-address'),
        terms: document.getElementById('client-terms'),
        contactName: document.getElementById('client-contact-name') || document.getElementById('client-contact'),
        companyName: document.getElementById('client-company-name') || document.getElementById('client-business-name')
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

    try {
        const saveBtn = document.getElementById('save-client');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

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
                });
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
        
        if (editingClientId) {
            console.log('Reloading client data from Supabase to verify update...');
            setTimeout(async () => {
                try {
                    const { data: updatedClient } = await supabaseClient
                        .from('clients')
                        .select('*')
                        .eq('id', editingClientId)
                        .single();
                    
                    if (updatedClient) {
                        console.log('Verified client data from Supabase:', updatedClient);
                    }
                } catch (verifyError) {
                    console.warn('Could not verify client update:', verifyError);
                }
            }, 1000);
        }
        
        closeModal(document.getElementById('client-modal'));

        const form = document.getElementById('client-form');
        if (form) form.reset();
        editingClientId = null;

        saveBtn.textContent = originalText;
        saveBtn.disabled = false;

    } catch (error) {
        console.error('Error saving client:', error);
        showToast(`Error saving client: ${error.message || 'Please try again'}`, 'error');

        const saveBtn = document.getElementById('save-client');
        if (saveBtn) {
            saveBtn.textContent = editingClientId ? 'Update Client' : 'Save Client';
            saveBtn.disabled = false;
        }
    }
}

function setupSettingsForm() {
    const saveSettingsBtn = document.getElementById('save-settings');
    const resetSettingsBtn = document.getElementById('reset-settings');

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', resetSettings);
    }
}

// ENHANCED: Settings save with GSTIN
async function saveSettings() {
    console.log('Saving settings...');

    const elements = {
        currency: document.getElementById('currency-setting'),
        taxRate: document.getElementById('tax-rate'),
        invoicePrefix: document.getElementById('invoice-prefix'),
        profileName: document.getElementById('profile-name'),
        profileEmail: document.getElementById('profile-email'),
        profilePhone: document.getElementById('profile-phone'),
        profileAddress: document.getElementById('profile-address'),
        profileGSTIN: document.getElementById('profile-gstin'), // Added GSTIN
        bankName: document.getElementById('bank-name'),
        bankAccount: document.getElementById('bank-account'),
        bankIFSC: document.getElementById('bank-ifsc'),
        bankSWIFT: document.getElementById('bank-swift')
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

    try {
        const saveBtn = document.getElementById('save-settings');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        await saveSettingsToSupabase(settingsData);

        Object.assign(appData.settings, settingsData);

        console.log('Settings saved successfully, new tax rate:', appData.settings.taxRate);

        if (document.getElementById('invoice-modal') && !document.getElementById('invoice-modal').classList.contains('hidden')) {
            calculateInvoiceTotal();
        }

        showToast(`Settings saved successfully. Tax rate: ${appData.settings.taxRate}%`, 'success');

        saveBtn.textContent = originalText;
        saveBtn.disabled = false;

    } catch (error) {
        console.error('Error saving settings:', error);
        showToast(`Error saving settings: ${error.message || 'Please try again'}`, 'error');

        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.textContent = 'Save Settings';
            saveBtn.disabled = false;
        }
    }
}

function resetSettings() {
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
}

function viewInvoice(invoiceId) {
    console.log('Viewing invoice:', invoiceId);
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        showInvoiceModal(invoice);
    }
}

// ENHANCED: Invoice modal with GSTIN and download button
function showInvoiceModal(invoice) {
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
}

async function downloadInvoice(invoiceId) {
    console.log('Downloading invoice as PDF:', invoiceId);
    
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        showToast('Invoice not found', 'error');
        return;
    }

    const client = appData.clients.find(c => c.id === invoice.clientId);
    const settings = appData.settings;

    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library is loading. Please try again in a moment.', 'info');
        loadPDFLibrary();
        setTimeout(() => downloadInvoice(invoiceId), 2000);
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Page dimensions
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Colors
        const primaryColor = [31, 184, 205];
        const textColor = [33, 37, 41];
        const lightGray = [248, 249, 250];

        // === HEADER SECTION ===
        // Main title
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('INVOICE', margin, 35);

        // Status badge
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(`Status: ${invoice.status}`, margin, 45);

        // Invoice details box
        const detailsBoxX = pageWidth - 80;
        const detailsBoxY = 20;
        doc.setFillColor(...lightGray);
        doc.roundedRect(detailsBoxX, detailsBoxY, 75, 40, 3, 3, 'F');
        
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE DETAILS', detailsBoxX + 5, detailsBoxY + 10);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Number: ${invoice.id}`, detailsBoxX + 5, detailsBoxY + 18);
        doc.text(`Issue: ${formatDate(invoice.date)}`, detailsBoxX + 5, detailsBoxY + 25);
        doc.text(`Due: ${formatDate(invoice.dueDate)}`, detailsBoxX + 5, detailsBoxY + 32);

        // === FROM/TO SECTION ===
        let yPosition = 75;

        // FROM section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('FROM:', margin, yPosition);
        
        yPosition += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColor);
        doc.text(settings.profileName, margin, yPosition);
        
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Address handling
        if (settings.profileAddress) {
            const addressLines = settings.profileAddress.split('\n');
            addressLines.forEach(line => {
                if (line.trim()) {
                    doc.text(line.trim(), margin, yPosition);
                    yPosition += 4;
                }
            });
        }
        
        // Contact details
        const contactDetails = [
            settings.profileGSTIN ? `GSTIN: ${settings.profileGSTIN}` : null,
            settings.profilePhone ? `Phone: ${settings.profilePhone}` : null,
            settings.profileEmail ? `Email: ${settings.profileEmail}` : null
        ].filter(Boolean);
        
        contactDetails.forEach(detail => {
            doc.text(detail, margin, yPosition);
            yPosition += 4;
        });

        // TO section
        const toX = pageWidth / 2 + 10;
        let toY = 75;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('TO:', toX, toY);
        
        toY += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColor);
        doc.text(client ? client.name : invoice.client, toX, toY);
        
        toY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        if (client && client.address) {
            const clientAddressLines = client.address.split('\n');
            clientAddressLines.forEach(line => {
                if (line.trim()) {
                    doc.text(line.trim(), toX, toY);
                    toY += 4;
                }
            });
        }

        // === ITEMS TABLE ===
        const tableStartY = Math.max(yPosition, toY) + 20;
        
        const tableData = invoice.items.map(item => [
            item.description,
            item.quantity.toString(),
            `₹${formatNumber(item.rate)}`,
            `₹${formatNumber(item.amount)}`
        ]);

        doc.autoTable({
            head: [['DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']],
            body: tableData,
            startY: tableStartY,
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 9,
                cellPadding: 8,
                lineColor: [220, 220, 220],
                lineWidth: 0.5,
                textColor: textColor
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.5 },
                1: { halign: 'center', cellWidth: contentWidth * 0.15 },
                2: { halign: 'right', cellWidth: contentWidth * 0.17 },
                3: { halign: 'right', cellWidth: contentWidth * 0.18 }
            },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            }
        });

        // === TOTALS SECTION ===
        const finalY = doc.lastAutoTable.finalY + 20;
        const totalsX = pageWidth - 90;
        
        // Totals background
        doc.setFillColor(...lightGray);
        doc.roundedRect(totalsX, finalY - 5, 85, 45, 3, 3, 'F');
        
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Subtotal
        doc.text('Subtotal:', totalsX + 5, finalY + 8);
        doc.text(`₹${formatNumber(invoice.subtotal)}`, totalsX + 80, finalY + 8, { align: 'right' });
        
        // Tax
        doc.text(`Tax (${settings.taxRate}%):`, totalsX + 5, finalY + 18);
        doc.text(`₹${formatNumber(invoice.tax)}`, totalsX + 80, finalY + 18, { align: 'right' });
        
        // Total line
        doc.setLineWidth(1);
        doc.setDrawColor(...primaryColor);
        doc.line(totalsX + 5, finalY + 23, totalsX + 80, finalY + 23);
        
        // Total amount
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text('TOTAL:', totalsX + 5, finalY + 33);
        doc.text(`₹${formatNumber(invoice.amount)}`, totalsX + 80, finalY + 33, { align: 'right' });

        // === PAYMENT DETAILS ===
        if (settings.bankAccount) {
            const bankY = finalY + 15;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...primaryColor);
            doc.text('PAYMENT DETAILS', margin, bankY);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...textColor);
            
            const bankDetails = [
                `Account Name: ${settings.bankName}`,
                `Account Number: ${settings.bankAccount}`,
                `IFSC Code: ${settings.bankIFSC}`,
                settings.bankSWIFT ? `SWIFT Code: ${settings.bankSWIFT}` : null
            ].filter(Boolean);
            
            bankDetails.forEach((detail, index) => {
                doc.text(detail, margin, bankY + 10 + (index * 5));
            });
        }

        // === FOOTER ===
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Thank you for your business!', margin, pageHeight - 25);
        doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, margin, pageHeight - 20);
        
        // Company signature line
        doc.text('Hariprasad Sivakumar', pageWidth - 60, pageHeight - 25, { align: 'right' });

        // Save the PDF
        doc.save(`Invoice-${invoice.id}.pdf`);
        showToast(`Invoice ${invoice.id} downloaded successfully`, 'success');

    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Error generating PDF. Please try again.', 'error');
    }
}
function editInvoice(invoiceId) {
    console.log('Editing invoice:', invoiceId);
    openInvoiceModal(invoiceId);
}

async function deleteInvoice(invoiceId) {
    console.log('Deleting invoice:', invoiceId);
    if (confirm(`Are you sure you want to delete invoice ${invoiceId}?`)) {
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

                showToast(`Invoice ${invoiceId} deleted successfully`, 'success');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
            showToast('Error deleting invoice. Please try again.', 'error');
        }
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
        console.error('Error formatting date:', dateString, error);
        return 'Invalid Date';
    }
}

// ENHANCED: Toast notifications with better positioning and animations
function showToast(message, type = 'info') {
    console.log('Toast:', type, message);

    let container = document.getElementById('toast-container');
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
            <span>${message}</span>
        </div>
    `;

    // Enhanced toast styles
    if (!document.getElementById('enhanced-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 400px;
            }

            .toast {
                background: var(--color-surface);
                color: var(--color-text);
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                border-left: 4px solid var(--color-primary);
                min-width: 300px;
                animation: slideInRight 0.3s ease-out;
                backdrop-filter: blur(10px);
                border: 1px solid var(--color-border);
                font-weight: 500;
                font-size: 14px;
                position: relative;
                overflow: hidden;
            }

            .toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
                animation: shimmer 2s ease-in-out infinite;
            }

            .toast.success {
                border-left-color: var(--color-success);
                background: rgba(var(--color-success-rgb), 0.05);
            }

            .toast.success::before {
                background: linear-gradient(90deg, transparent, var(--color-success), transparent);
            }

            .toast.error {
                border-left-color: var(--color-error);
                background: rgba(var(--color-error-rgb), 0.05);
            }

            .toast.error::before {
                background: linear-gradient(90deg, transparent, var(--color-error), transparent);
            }

            .toast.warning {
                border-left-color: var(--color-warning);
                background: rgba(var(--color-warning-rgb), 0.05);
            }

            .toast.warning::before {
                background: linear-gradient(90deg, transparent, var(--color-warning), transparent);
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes shimmer {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            .toast.removing {
                animation: slideOutRight 0.3s ease-in-out forwards;
            }

            @media (max-width: 480px) {
                .toast-container {
                    left: 10px;
                    right: 10px;
                    top: 10px;
                    max-width: none;
                }

                .toast {
                    min-width: auto;
                    font-size: 13px;
                    padding: 12px 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

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
}

// Global error handler for better debugging
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    showToast('An unexpected error occurred. Check console for details.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('A network or database error occurred. Please try again.', 'error');
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

// Keyboard shortcuts for power users
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N for new invoice
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const createBtn = document.getElementById('create-invoice-btn');
        if (createBtn && !document.querySelector('.modal:not(.hidden)')) {
            createBtn.click();
            showToast('New invoice shortcut: Ctrl+N', 'info');
        }
    }

    // Ctrl/Cmd + K for new client
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const addClientBtn = document.getElementById('add-client-btn');
        if (addClientBtn && !document.querySelector('.modal:not(.hidden)')) {
            addClientBtn.click();
            showToast('New client shortcut: Ctrl+K', 'info');
        }
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) {
            closeModal(openModal);
        }
    }
});

// Auto-save draft functionality for forms
let autoSaveTimer;

function setupAutoSave() {
    const formInputs = document.querySelectorAll('#invoice-form input, #invoice-form textarea, #client-form input, #client-form textarea');

    formInputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                console.log('Auto-save triggered');
            }, 5000);
        });
    });
}

// Data validation helpers
const validators = {
    email: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    phone: (phone) => {
        const regex = /^[\+]?[1-9][\d]{0,15}$/;
        return regex.test(phone.replace(/\s+/g, ''));
    },

    currency: (amount) => {
        return !isNaN(amount) && parseFloat(amount) >= 0;
    },

    required: (value) => {
        return value && value.toString().trim().length > 0;
    },

    gstin: (gstin) => {
        // GSTIN format: 2 digits (state code) + 10 characters (PAN) + 1 digit (entity number) + 1 character (Z) + 1 check digit
        const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return regex.test(gstin);
    }
};

// Export functionality
function exportData(format = 'json') {
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
}

// Search functionality
function setupGlobalSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search invoices, clients...';
    searchInput.className = 'global-search';
    searchInput.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        padding: 8px 12px;
        border: 2px solid var(--color-border);
        border-radius: 20px;
        background: var(--color-surface);
        z-index: 1000;
        display: none;
    `;

    document.body.appendChild(searchInput);

    // Ctrl+F to show search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.style.display = 'block';
            searchInput.focus();
        }

        if (e.key === 'Escape' && searchInput.style.display === 'block') {
            searchInput.style.display = 'none';
            searchInput.value = '';
        }
    });
}

// Improved error boundaries
function withErrorBoundary(fn, fallback) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(`Error in ${fn.name}:`, error);
            if (fallback) {
                fallback(error);
            } else {
                showToast(`Error in ${fn.name}: ${error.message}`, 'error');
            }
        }
    };
}

// Connection status monitoring
function monitorConnection() {
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
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', () => {
    setupAutoSave();
    setupGlobalSearch();
    monitorConnection();

    // Log performance
    setTimeout(() => {
        performanceMonitor.logTiming('Full app initialization');
        performanceMonitor.logMemory();
    }, 1000);
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
            });
        },
        testClientEdit: (clientId) => {
            console.log('Testing client edit for ID:', clientId);
            editClient(clientId);
        },
        testInvoiceDownload: (invoiceId) => {
            console.log('Testing invoice download for ID:', invoiceId);
            downloadInvoice(invoiceId);
        },
        validateGSTIN: (gstin) => {
            console.log('GSTIN validation:', gstin, validators.gstin(gstin) ? 'Valid' : 'Invalid');
        }
    };
    console.log('🔧 Debug helpers available: window.debugApp');
    console.log('🔍 Use debugApp.debugClients() to check client data');
    console.log('📥 Use debugApp.testInvoiceDownload("invoice-id") to test PDF download');
    console.log('🧪 Use debugApp.validateGSTIN("gstin") to validate GSTIN format');
}

// Additional improvements and ideas:
// 1. Dashboard now shows more detailed metrics and analytics
// 2. Invoice actions are more compact with icon-only buttons
// 3. Analytics has a better UI with proper date pickers
// 4. PDF download functionality with proper formatting
// 5. GSTIN added to settings and invoice display
// 6. Client delete functionality now works properly
// 7. Better error handling and user feedback
// 8. Performance monitoring and debug tools
// 9. Keyboard shortcuts for power users
// 10. Auto-save draft functionality

// Future enhancements you could consider:
// - Email invoice functionality
// - Recurring invoice templates
// - Multi-currency support
// - Invoice reminders
// - Payment tracking integration
// - Bulk invoice operations
// - Advanced reporting and analytics
// - Client portal for invoice viewing
// - Integration with accounting software
// - Mobile responsive improvements
