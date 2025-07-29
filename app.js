// FULLY DEBUGGED INVOICE MANAGER - ALL CRITICAL ISSUES FIXED

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
        taxRate: 0, // FIXED: Default to 0%
        invoicePrefix: 'HP-2526',
        profileName: 'Hariprasad Sivakumar',
        profileEmail: 'contact@hariprasadss.com',
        profilePhone: '+91 9876543210',
        profileAddress: '6/91, Mahit Complex, Hosur Road, Attibele, Bengaluru, Karnataka – 562107',
        gstin: '29GLOPS9921M1ZT',
        bankNameField: 'Kotak Mahindra Bank',
        bankName: 'Hariprasad Sivakumar',
        bankAccount: '2049315152',
        bankIFSC: 'KKBK0008068',
        bankSWIFT: 'KKBKINBBCPC'
    }
};

// ADDED: Analytics state for filters
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

        // Add logout button to header
        addLogoutButton();

        // Load data from Supabase
        await loadDataFromSupabase();

        // Mark data as loaded
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

        showLoadingState(false);
        console.log('Application initialized successfully');
        showToast('Application loaded successfully', 'success');
    } catch (error) {
        console.error('Error initializing application:', error);
        showLoadingState(false);
        showToast('Error loading data. Please refresh the page.', 'error');
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

// COMPLETELY REDESIGNED: Modern, compact analytics UI
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
            <div class="analytics-controls-container">
                <!-- Period Selection -->
                <div class="control-group">
                    <label class="control-label">📊 View</label>
                    <select id="analytics-period" class="modern-select period-select">
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <!-- Date Range -->
                <div class="control-group">
                    <label class="control-label">📅 Period</label>
                    <div class="date-range-container">
                        <input type="month" id="date-from" class="modern-date-input" placeholder="From">
                        <span class="date-separator">to</span>
                        <input type="month" id="date-to" class="modern-date-input" placeholder="To">
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="control-group">
                    <div class="action-buttons">
                        <button class="action-btn primary" id="apply-filters">
                            🔍 Apply
                        </button>
                        <button class="action-btn secondary" id="clear-filters">
                            🗑️ Clear
                        </button>
                    </div>
                </div>

                <!-- Status -->
                <div class="filter-status" id="analytics-status"></div>
            </div>
        `;

        analyticsHeader.parentNode.insertBefore(controlsContainer, analyticsHeader.nextSibling);

        // Add modern analytics styles
        if (!document.getElementById('modern-analytics-styles')) {
            const style = document.createElement('style');
            style.id = 'modern-analytics-styles';
            style.textContent = `
                .analytics-controls-container {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    border-radius: 12px;
                    margin: 16px 0;
                    border: 1px solid #e2e8f0;
                    flex-wrap: wrap;
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 120px;
                }

                .control-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .modern-select, .modern-date-input {
                    padding: 8px 12px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    background: white;
                    font-size: 13px;
                    font-weight: 500;
                    color: #1e293b;
                    transition: all 0.2s ease;
                    min-width: 0;
                }

                .modern-select:focus, .modern-date-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .period-select {
                    min-width: 100px;
                }

                .date-range-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .date-separator {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 500;
                    white-space: nowrap;
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
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .action-btn.primary {
                    background: #3b82f6;
                    color: white;
                }

                .action-btn.primary:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }

                .action-btn.secondary {
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                }

                .action-btn.secondary:hover {
                    background: #e2e8f0;
                }

                .filter-status {
                    flex: 1;
                    min-width: 200px;
                    padding: 8px 12px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 6px;
                    font-size: 12px;
                    color: #1e40af;
                    font-weight: 500;
                    display: none;
                }

                .filter-status.show {
                    display: block;
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

                .insight-change.positive { color: #059669; }
                .insight-change.negative { color: #dc2626; }

                @media (max-width: 768px) {
                    .analytics-controls-container {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }

                    .control-group {
                        min-width: auto;
                    }

                    .action-buttons {
                        justify-content: center;
                    }

                    .analytics-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Setup event listeners
        document.getElementById('apply-filters').addEventListener('click', applyAnalyticsFilters);
        document.getElementById('clear-filters').addEventListener('click', clearAnalyticsFilters);
        
        // FIXED: Period selection event listener
        document.getElementById('analytics-period').addEventListener('change', (e) => {
            analyticsState.currentPeriod = e.target.value;
            console.log('Period changed to:', analyticsState.currentPeriod);
            applyAnalyticsFilters();
        });
    }
}

// FIXED: Apply analytics filters with proper period handling
function applyAnalyticsFilters() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;
    const period = document.getElementById('analytics-period').value;
    const statusDiv = document.getElementById('analytics-status');

    analyticsState.currentPeriod = period;
    analyticsState.dateRange = { from: fromDate, to: toDate };

    console.log('Applying analytics filters:', { period, fromDate, toDate });

    // Filter invoices based on date range if specified
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

    // Re-render analytics with new filters
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

// FIXED: Comprehensive data loading with proper error handling
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

        // Calculate total earnings
        appData.totalEarnings = appData.invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

        // Calculate monthly earnings
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
                taxRate: settings.tax_rate !== null && settings.tax_rate !== undefined ? parseFloat(settings.tax_rate) : appData.settings.taxRate, // FIXED: Allow 0%
                invoicePrefix: settings.invoice_prefix || appData.settings.invoicePrefix,
                profileName: settings.profile_name || appData.settings.profileName,
                profileEmail: settings.profile_email || appData.settings.profileEmail,
                profilePhone: settings.profile_phone || appData.settings.profilePhone,
                profileAddress: settings.profile_address || appData.settings.profileAddress,
                gstin: settings.gstin || appData.settings.gstin,
                bankName: settings.bank_name || appData.settings.bankName,
                bankAccount: settings.bank_account || appData.settings.bankAccount,
                bankIFSC: settings.bank_ifsc || appData.settings.bankIFSC,
                bankNameField: settings.bank_name_field || appData.settings.bankNameField,
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

// FIXED: Client saving with comprehensive error handling and proper ID handling
async function saveClientToSupabase(clientData) {
    try {
        console.log('Saving client to Supabase:', clientData);

        if (!clientData.name || !clientData.email) {
            throw new Error('Name and email are required');
        }

        if (editingClientId) {
            console.log('Updating existing client:', editingClientId);
            const { data, error } = await supabaseClient
                .from('clients')
                .update({
                    name: clientData.name.trim(),
                    email: clientData.email.trim(),
                    phone: clientData.phone?.trim() || '',
                    address: clientData.address?.trim() || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingClientId)
                .select()
                .single();

            if (error) {
                console.error('Update client error:', error);
                throw error;
            }
            console.log('Client updated successfully:', data);
            return data;
        } else {
            console.log('Inserting new client');
            const { data, error } = await supabaseClient
                .from('clients')
                .insert([{
                    name: clientData.name.trim(),
                    email: clientData.email.trim(),
                    phone: clientData.phone?.trim() || '',
                    address: clientData.address?.trim() || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    total_invoices: 0,
                    total_amount: 0
                }])
                .select()
                .single();

            if (error) {
                console.error('Insert client error:', error);
                throw error;
            }
            console.log('Client inserted successfully:', data);
            return data;
        }
    } catch (error) {
        console.error('Error saving client to Supabase:', error);
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

// FIXED: Settings save with proper 0% tax rate handling
async function saveSettingsToSupabase(settingsData) {
    try {
        console.log('Saving settings to Supabase:', settingsData);

        if (!settingsData.profileName || !settingsData.profileEmail) {
            throw new Error('Profile name and email are required');
        }

        // FIXED: Allow 0% tax rate
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
            tax_rate: parseFloat(settingsData.taxRate), // FIXED: Properly handle 0
            invoice_prefix: settingsData.invoicePrefix || 'HP-2526',
            profile_name: settingsData.profileName || '',
            profile_email: settingsData.profileEmail || '',
            profile_phone: settingsData.profilePhone || '',
            profile_address: settingsData.profileAddress || '',
            gstin: settingsData.gstin || '',
            bank_name: settingsData.bankName || '',
            bank_account: settingsData.bankAccount || '',
            bank_ifsc: settingsData.bankIFSC || '',
            bank_name_field: settingsData.bankNameField || '',
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
    // This will be handled by setupDateRangeFilters
    console.log('Analytics filters setup complete');
}

function renderInvoices() {
    console.log('Rendering invoices...');
    const tbody = document.getElementById('invoices-body');
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
                    <button class="action-btn view" onclick="viewInvoice('${invoice.id}')">View</button>
                    <button class="action-btn edit" onclick="editInvoice('${invoice.id}')">Edit</button>
                    <button class="action-btn delete" onclick="deleteInvoice('${invoice.id}')">Delete</button>
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

// COMPLETELY FIXED: Client rendering with proper individual data handling
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

    // FIXED: Create unique cards with proper data binding
    grid.innerHTML = appData.clients.map((client, index) => `
        <div class="client-card" data-client-id="${client.id}" data-client-index="${index}">
            <div class="client-header">
                <h4 class="client-name">${escapeHtml(client.name)}</h4>
                <button
                    class="client-edit-btn"
                    data-client-id="${client.id}"
                    data-client-index="${index}"
                    title="Edit client"
                >
                    <span>✏️</span> Edit
                </button>
            </div>
            <div class="client-details">
                <div class="client-email">📧 ${escapeHtml(client.email)}</div>
                ${client.phone ? `<div class="client-phone">📞 ${escapeHtml(client.phone)}</div>` : ''}
                ${client.address ? `<div class="client-address">📍 ${escapeHtml(client.address)}</div>` : ''}
            </div>
            <div class="client-stats">
                <div class="client-stat">
                    <div class="client-stat-value">${client.total_invoices || 0}</div>
                    <div class="client-stat-label">Invoices</div>
                </div>
                <div class="client-stat">
                    <div class="client-stat-value">₹${formatNumber(client.total_amount || 0)}</div>
                    <div class="client-stat-label">Total Paid</div>
                </div>
            </div>
        </div>
    `).join('');

    // FIXED: Add event listeners with proper data isolation
    setTimeout(() => {
        document.querySelectorAll('.client-edit-btn').forEach((btn, btnIndex) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const clientId = btn.getAttribute('data-client-id');
                const clientIndex = parseInt(btn.getAttribute('data-client-index'));
                
                console.log('Edit button clicked:', { clientId, clientIndex, client: appData.clients[clientIndex] });
                
                // Verify client exists and ID matches
                if (appData.clients[clientIndex] && appData.clients[clientIndex].id === clientId) {
                    editClient(clientId);
                } else {
                    console.error('Client mismatch detected');
                    showToast('Error: Client data mismatch. Please refresh the page.', 'error');
                }
            });
        });
    }, 100);

    // Add enhanced client card styles
    if (!document.getElementById('enhanced-client-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-client-styles';
        style.textContent = `
            .client-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
            }

            .client-name {
                margin: 0;
                color: var(--color-text);
                font-size: 18px;
                font-weight: 600;
                flex: 1;
                margin-right: 12px;
                word-break: break-word;
            }

            .client-edit-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                background: var(--color-bg-2);
                border: 1px solid rgba(var(--color-warning-rgb), 0.3);
                border-radius: 6px;
                color: var(--color-warning);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
                flex-shrink: 0;
            }

            .client-edit-btn:hover {
                background: rgba(var(--color-warning-rgb), 0.1);
                border-color: rgba(var(--color-warning-rgb), 0.5);
                transform: translateY(-1px);
            }

            .client-details {
                margin-bottom: 16px;
            }

            .client-email, .client-phone, .client-address {
                font-size: 13px;
                color: var(--color-text-secondary);
                margin-bottom: 4px;
                display: flex;
                align-items: flex-start;
                gap: 6px;
                word-break: break-all;
            }

            .client-stats {
                display: flex;
                justify-content: space-between;
                padding-top: 16px;
                border-top: 1px solid var(--color-border);
            }

            .client-stat {
                text-align: center;
                flex: 1;
            }

            .client-stat-value {
                font-size: 16px;
                font-weight: 600;
                color: var(--color-text);
                margin-bottom: 4px;
            }

            .client-stat-label {
                font-size: 11px;
                color: var(--color-text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('Clients rendered successfully with isolated event listeners');
}

// ADDED: HTML escaping utility for security
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// COMPLETELY FIXED: Edit client function with proper data isolation
function editClient(clientId) {
    console.log('Editing client with ID:', clientId);

    if (!appData.dataLoaded) {
        showToast('Data is still loading. Please wait.', 'info');
        return;
    }

    // Find client with exact ID match
    const client = appData.clients.find(c => c.id === clientId);

    if (!client) {
        console.error('Client not found:', clientId);
        console.log('Available clients:', appData.clients.map(c => ({ id: c.id, name: c.name })));
        showToast('Client not found. Please refresh the page.', 'error');
        return;
    }

    console.log('Found client for editing:', client);

    // FIXED: Set editing state properly
    editingClientId = clientId;

    // FIXED: Clear form first to prevent data contamination
    const form = document.getElementById('client-form');
    if (form) {
        form.reset();
    }

    // FIXED: Populate form with specific client data
    setTimeout(() => {
        const fields = {
            'client-company': client.name || '',
            'client-email': client.email || '',
            'client-phone': client.phone || '',
            'client-address': client.address || '',
            'client-terms': client.payment_terms || 'net30'
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = value;
                console.log(`Set ${fieldId} to:`, value);
            } else {
                console.warn(`Field ${fieldId} not found`);
            }
        });

        // Update modal UI
        const modalTitle = document.querySelector('#client-modal .modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Edit Client';

        const saveBtn = document.getElementById('save-client');
        if (saveBtn) saveBtn.textContent = 'Update Client';

        console.log('Form populated for client:', client.name);
    }, 50);

    // Open modal
    openClientModal();

    showToast(`Editing client: ${client.name}`, 'info');
}

// COMPLETELY REDESIGNED: Modern Analytics with better layout and dynamic top client
function renderAnalytics(period = 'monthly') {
    console.log('Rendering analytics...');
    
    // Create modern analytics layout if it doesn't exist
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
    }

    // Use filtered data if available, otherwise use all data
    const dataToUse = analyticsState.filteredData || appData.invoices;
    
    // Render chart and insights
    setTimeout(() => {
        renderAnalyticsChart(analyticsState.currentPeriod, dataToUse);
        renderTopClientInsights(dataToUse);
    }, 100);
}

// NEW: Render analytics chart based on period and data
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

    // Update subtitle
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

// NEW: Calculate monthly earnings for specific dataset
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

// NEW: Dynamic top client insights based on filtered data
function renderTopClientInsights(invoices) {
    const insightsContainer = document.getElementById('analytics-insights');
    if (!insightsContainer) return;

    // Calculate client earnings from provided invoices
    const clientEarnings = new Map();
    const clientInvoiceCounts = new Map();

    invoices.forEach(invoice => {
        const clientId = invoice.clientId;
        const clientName = invoice.client;
        
        if (invoice.status === 'Paid') {
            clientEarnings.set(clientId, (clientEarnings.get(clientId) || 0) + invoice.amount);
        }
        clientInvoiceCounts.set(clientId, (clientInvoiceCounts.get(clientId) || 0) + 1);
        
        // Store client name for display
        if (!clientEarnings.has(clientId + '_name')) {
            clientEarnings.set(clientId + '_name', clientName);
        }
    });

    // Find top client
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

    // Calculate total stats
    const totalPaidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalEarnings = totalPaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const averageInvoice = totalPaidInvoices.length > 0 ? totalEarnings / totalPaidInvoices.length : 0;
    const totalInvoices = invoices.length;

    // Calculate period info
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

// FIXED: Settings rendering with improved tax rate handling
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
        'profile-gstin': settings.gstin,
        'bank-name': settings.bankName,
        'bank-account': settings.bankAccount,
        'bank-ifsc': settings.bankIFSC,
        'bank-name-field': settings.bankNameField,
        'bank-swift': settings.bankSWIFT,
        'currency-setting': settings.currency,
        'tax-rate': settings.taxRate, // FIXED: Properly handle 0%
        'invoice-prefix': settings.invoicePrefix
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = (value !== null && value !== undefined) ? value : '';
        } else {
            console.warn(`Settings field ${id} not found in DOM`);
        }
    });

    // ADDED: Enhance tax rate field with better UX
    const taxRateField = document.getElementById('tax-rate');
    if (taxRateField) {
        // Add common tax rates as datalist
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
        
        // Add helper text
        if (!document.getElementById('tax-rate-helper')) {
            const helper = document.createElement('small');
            helper.id = 'tax-rate-helper';
            helper.style.cssText = 'display: block; margin-top: 4px; color: #64748b; font-size: 11px;';
            helper.textContent = 'Enter 0 for no tax, or your applicable tax percentage';
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

// FIXED: Tax calculation using current settings (including 0%)
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

    // Use current tax rate from loaded settings (can be 0)
    const taxRate = appData.settings.taxRate / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const subtotalElement = document.getElementById('invoice-subtotal');
    const taxElement = document.getElementById('invoice-tax');
    const totalElement = document.getElementById('invoice-total');

    if (subtotalElement) subtotalElement.textContent = `₹${formatNumber(subtotal)}`;
    if (taxElement) taxElement.textContent = `₹${formatNumber(tax)}`;
    if (totalElement) totalElement.textContent = `₹${formatNumber(total)}`;

    // Update the tax rate display
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

// COMPLETELY FIXED: Client saving with proper data isolation
async function saveClient() {
    console.log('Saving client... Editing ID:', editingClientId);

    const companyInput = document.getElementById('client-company');
    const emailInput = document.getElementById('client-email');
    const phoneInput = document.getElementById('client-phone');
    const addressInput = document.getElementById('client-address');
    const termsInput = document.getElementById('client-terms');

    if (!companyInput || !emailInput) {
        showToast('Required form fields are missing', 'error');
        return;
    }

    const clientData = {
        name: companyInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput ? phoneInput.value.trim() : '',
        address: addressInput ? addressInput.value.trim() : '',
        paymentTerms: termsInput ? termsInput.value : 'net30'
    };

    // Validate required fields
    if (!clientData.name || !clientData.email) {
        showToast('Company name and email are required', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    try {
        // Show loading state
        const saveBtn = document.getElementById('save-client');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        // Save to database
        const savedClient = await saveClientToSupabase(clientData);

        if (editingClientId) {
            // FIXED: Update only the specific client being edited
            const index = appData.clients.findIndex(c => c.id === editingClientId);
            if (index > -1) {
                // Preserve existing statistics and update only the edited fields
                appData.clients[index] = {
                    ...appData.clients[index], // Keep existing data
                    id: savedClient.id,
                    name: savedClient.name,
                    email: savedClient.email,
                    phone: savedClient.phone || '',
                    address: savedClient.address || '',
                    payment_terms: savedClient.payment_terms
                };
                console.log('Updated client at index:', index, appData.clients[index]);
            }
            showToast(`Client "${savedClient.name}" updated successfully`, 'success');
        } else {
            // Add new client to local data
            const newClient = {
                id: savedClient.id,
                name: savedClient.name,
                email: savedClient.email,
                phone: savedClient.phone || '',
                address: savedClient.address || '',
                payment_terms: savedClient.payment_terms,
                total_invoices: savedClient.total_invoices || 0,
                total_amount: savedClient.total_amount || 0
            };

            appData.clients.push(newClient);
            appData.totalClients++;
            showToast(`Client "${newClient.name}" added successfully`, 'success');
        }

        // Refresh views
        renderClients();
        closeModal(document.getElementById('client-modal'));

        // Reset form and editing state
        const form = document.getElementById('client-form');
        if (form) form.reset();
        editingClientId = null;

        // Reset button state
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;

    } catch (error) {
        console.error('Error saving client:', error);
        showToast(`Error saving client: ${error.message || 'Please try again'}`, 'error');

        // Reset button state
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

// COMPLETELY FIXED: Settings save with proper 0% tax rate validation
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
        gstin: document.getElementById('profile-gstin'),
        bankName: document.getElementById('bank-name'),
        bankAccount: document.getElementById('bank-account'),
        bankIFSC: document.getElementById('bank-ifsc'),
        bankNameField: document.getElementById('bank-name-field'),
        bankSWIFT: document.getElementById('bank-swift')
    };

    // Check for missing elements
    const missingElements = Object.entries(elements).filter(([key, element]) => !element);
    if (missingElements.length > 0) {
        console.error('Missing form elements:', missingElements.map(([key]) => key));
        showToast(`Settings form is incomplete. Missing: ${missingElements.map(([key]) => key).join(', ')}`, 'error');
        return;
    }

    const settingsData = {};
    Object.entries(elements).forEach(([key, element]) => {
        if (key === 'taxRate') {
            const value = parseFloat(element.value);
            // FIXED: Allow 0% and properly validate
            if (isNaN(value) || value < 0 || value > 100) {
                showToast('Tax rate must be a number between 0 and 100 (0% is allowed)', 'error');
                element.focus();
                return;
            }
            settingsData[key] = value;
        } else {
            settingsData[key] = element.value?.trim() || '';
        }
    });

    // Check if tax rate validation failed
    if (settingsData.taxRate === undefined) {
        return; // Tax rate validation failed, don't proceed
    }

    // Validate required fields
    if (!settingsData.profileName || !settingsData.profileEmail) {
        showToast('Profile name and email are required', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settingsData.profileEmail)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    try {
        // Show loading state
        const saveBtn = document.getElementById('save-settings');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        // Save to database
        await saveSettingsToSupabase(settingsData);

        // Update local data immediately
        Object.assign(appData.settings, settingsData);

        console.log('Settings saved successfully, new tax rate:', appData.settings.taxRate);

        // Recalculate any open invoice totals
        if (document.getElementById('invoice-modal') && !document.getElementById('invoice-modal').classList.contains('hidden')) {
            calculateInvoiceTotal();
        }

        showToast(`Settings saved successfully. Tax rate: ${appData.settings.taxRate}%`, 'success');

        // Reset button state
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;

    } catch (error) {
        console.error('Error saving settings:', error);
        showToast(`Error saving settings: ${error.message || 'Please try again'}`, 'error');

        // Reset button state
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
            taxRate: 0, // FIXED: Default to 0%
            invoicePrefix: 'HP-2526',
            profileName: 'Hariprasad Sivakumar',
            profileEmail: 'contact@hariprasadss.com',
            profilePhone: '+91 9876543210',
            profileAddress: '6/91, Mahit Complex, Hosur Road, Attibele, Bengaluru, Karnataka – 562107',
            gstin: '29GLOPS9921M1ZT',
            bankName: 'HARIPRASAD SIVAKUMAR',
            bankAccount: '',
            bankIFSC: '',
            bankNameField: '',
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
            <div class="modal-body" style="padding: 40px; background: white; color: black;">
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
                            <br>
                            ${settings.gstin ? `GSTIN: ${settings.gstin}` : ''}
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
                <button class="btn btn--primary" onclick="window.print()">Print</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
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
        }
    };
    console.log('🔧 Debug helpers available: window.debugApp');
}
