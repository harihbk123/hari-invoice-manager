// Supabase Configuration
const SUPABASE_URL = 'https://kgdewraoanlaqewpbdlo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZGV3cmFvYW5sYXFld3BiZGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTg3NDksImV4cCI6MjA2OTI5NDc0OX0.wBgDDHcdK0Q9mN6uEPQFEO8gXiJdnrntLJW3dUdh89M';

// Initialize Supabase client - Fixed
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application Data - Will be loaded from Supabase
let appData = {
    totalEarnings: 0,
    totalClients: 0,
    totalInvoices: 0,
    monthlyEarnings: [],
    clients: [],
    invoices: [],
    nextInvoiceNumber: 1,
    
    settings: {
        currency       : 'INR',
        taxRate        : 18,
        invoicePrefix  : 'HP-2526',
        profileName    : 'Hariprasad Sivakumar',
        profileEmail   : 'contact@hariprasadss.com',
        profilePhone   : '+91 9876543210',
        profileAddress : '6/91, Mahit Complex, Hosur Road, Attibele, Bengaluru, Karnataka – 562107',
        gstin          : '29GLOPS9921M1ZT',
        bankNameField  : 'Kotak Mahindra Bank',
        bankName       : 'Hariprasad Sivakumar',
        bankAccount    : '2049315152',
        bankIFSC       : 'KKBK0008068',
        bankSWIFT      : 'KKBKINBBCPC'
    }
};

// Global variables for editing
let editingInvoiceId = null;

// Charts
let monthlyChart, clientChart, analyticsChart;

// Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    initializeApp();
});

async function initializeApp() {
    try {
        // Load data from Supabase
        await loadDataFromSupabase();
        
        setupNavigation();
        setupModals();
        setupForms();
        setupAnalyticsFilters(); // Add this
        renderDashboard();
        renderInvoices();
        renderClients();
        renderAnalytics();
        renderSettings();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('Error loading data. Please refresh the page.', 'error');
    }
}

// FIXED: Add missing getNextInvoiceNumber function
async function getNextInvoiceNumber() {
    try {
        // Get the highest invoice number from database
        const { data: invoices, error } = await supabaseClient
            .from('invoices')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        if (invoices && invoices.length > 0) {
            // Extract number from invoice ID (e.g., "HP-2526-018" -> 18)
            const lastInvoiceId = invoices[0].id;
            const match = lastInvoiceId.match(/(\d+)$/);
            if (match) {
                return parseInt(match[1]) + 1;
            }
        }
        
        return 1; // Start from 1 if no invoices exist
    } catch (error) {
        console.error('Error getting next invoice number:', error);
        return Date.now(); // Fallback to timestamp
    }
}

// Supabase Data Loading Functions - Fixed all supabase references
async function loadDataFromSupabase() {
    console.log('Loading data from Supabase...');
    
    try {
        // Load clients
        const { data: clients, error: clientsError } = await supabaseClient
            .from('clients')
            .select('*')
            .order('name', { ascending: true });
        
        if (clientsError) throw clientsError;
        appData.clients = clients || [];
        appData.totalClients = clients?.length || 0;

        // FIXED: Load invoices with correct sorting for recent invoices
        const { data: invoices, error: invoicesError } = await supabaseClient
            .from('invoices')
            .select('*')
            .order('date_issued', { ascending: false }); // Keep descending for recent invoices
        
        if (invoicesError) throw invoicesError;
        
        // Process invoices data
        appData.invoices = (invoices || []).map(invoice => ({
            id: invoice.id,
            clientId: invoice.client_id,
            client: invoice.client_name,
            amount: parseFloat(invoice.amount),
            subtotal: parseFloat(invoice.subtotal),
            tax: parseFloat(invoice.tax),
            date: invoice.date_issued,
            dueDate: invoice.due_date,
            status: invoice.status,
            items: invoice.items || []
        }));
        
        appData.totalInvoices = appData.invoices.length;
        
        // Calculate total earnings
        appData.totalEarnings = appData.invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

        // Calculate monthly earnings
        calculateMonthlyEarnings();

        // FIXED: Load settings with proper error handling
        const { data: settings, error: settingsError } = await supabaseClient
            .from('settings')
            .select('*')
            .eq('user_id', 'default')
            .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') {
            console.warn('Settings error:', settingsError);
            // Don't throw, just use defaults
        }
        
        if (settings) {
            appData.settings = {
                ...appData.settings, // Keep defaults
                currency: settings.currency || appData.settings.currency,
                taxRate: parseFloat(settings.tax_rate) || appData.settings.taxRate,
                invoicePrefix: settings.invoice_prefix || appData.settings.invoicePrefix,
                profileName: settings.profile_name || appData.settings.profileName,
                profileEmail: settings.profile_email || appData.settings.profileEmail,
                profilePhone: settings.profile_phone || appData.settings.profilePhone,
                bankName: settings.bank_name || appData.settings.bankName,
                bankAccount: settings.bank_account || appData.settings.bankAccount,
                bankIFSC: settings.bank_ifsc || appData.settings.bankIFSC,
                bankNameField: settings.bank_name_field || appData.settings.bankNameField
            };
        }

        console.log('Data loaded successfully from Supabase');
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
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

// FIXED: Analytics period filtering
function calculateQuarterlyEarnings() {
    const quarterlyData = new Map();
    
    appData.invoices
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

function calculateYearlyEarnings() {
    const yearlyData = new Map();
    
    appData.invoices
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

// Supabase Database Operations - Fixed all supabase references
async function saveClientToSupabase(clientData) {
    try {
        if (clientData.id && clientData.id !== Date.now()) {
            // Update existing client
            const { data, error } = await supabaseClient
                .from('clients')
                .update({
                    name: clientData.name,
                    email: clientData.email,
                    phone: clientData.phone || '',
                    address: clientData.address || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    updated_at: new Date().toISOString()
                })
                .eq('id', clientData.id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } else {
            // Insert new client
            const { data, error } = await supabaseClient
                .from('clients')
                .insert([{
                    name: clientData.name,
                    email: clientData.email,
                    phone: clientData.phone || '',
                    address: clientData.address || '',
                    payment_terms: clientData.paymentTerms || 'net30',
                    total_invoices: 0,
                    total_amount: 0
                }])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Error saving client to Supabase:', error);
        throw error;
    }
}

async function saveInvoiceToSupabase(invoiceData) {
    try {
        if (editingInvoiceId) {
            // Update existing invoice
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
            return data;
        } else {
            // Insert new invoice
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
            return data;
        }
        
        // Update client totals
        await updateClientTotals(invoiceData.clientId);
        
        return data;
    } catch (error) {
        console.error('Error saving invoice to Supabase:', error);
        throw error;
    }
}

async function updateClientTotals(clientId) {
    try {
        // Get all invoices for this client
        const { data: invoices, error: invoicesError } = await supabaseClient
            .from('invoices')
            .select('amount, status')
            .eq('client_id', clientId);
        
        if (invoicesError) throw invoicesError;
        
        const totalInvoices = invoices.length;
        const totalAmount = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        
        // Update client record
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
        // First get the invoice to know which client to update
        const { data: invoice, error: getError } = await supabaseClient
            .from('invoices')
            .select('client_id')
            .eq('id', invoiceId)
            .single();
        
        if (getError) throw getError;
        
        // Delete the invoice
        const { error: deleteError } = await supabaseClient
            .from('invoices')
            .delete()
            .eq('id', invoiceId);
        
        if (deleteError) throw deleteError;
        
        // Update client totals
        await updateClientTotals(invoice.client_id);
        
        return true;
    } catch (error) {
        console.error('Error deleting invoice from Supabase:', error);
        throw error;
    }
}

// FIXED: Settings save with proper upsert
async function saveSettingsToSupabase(settingsData) {
    try {
        // First check if settings exist
        const { data: existingSettings, error: checkError } = await supabaseClient
            .from('settings')
            .select('user_id')
            .eq('user_id', 'default')
            .single();
        
        if (existingSettings) {
            // Update existing settings
            const { data, error } = await supabaseClient
                .from('settings')
                .update({
                    currency: settingsData.currency,
                    tax_rate: settingsData.taxRate,
                    invoice_prefix: settingsData.invoicePrefix,
                    profile_name: settingsData.profileName,
                    profile_email: settingsData.profileEmail,
                    profile_phone: settingsData.profilePhone,
                    bank_name: settingsData.bankName,
                    bank_account: settingsData.bankAccount,
                    bank_ifsc: settingsData.bankIFSC,
                    bank_name_field: settingsData.bankNameField,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', 'default')
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } else {
            // Insert new settings
            const { data, error } = await supabaseClient
                .from('settings')
                .insert([{
                    user_id: 'default',
                    currency: settingsData.currency,
                    tax_rate: settingsData.taxRate,
                    invoice_prefix: settingsData.invoicePrefix,
                    profile_name: settingsData.profileName,
                    profile_email: settingsData.profileEmail,
                    profile_phone: settingsData.profilePhone,
                    bank_name: settingsData.bankName,
                    bank_account: settingsData.bankAccount,
                    bank_ifsc: settingsData.bankIFSC,
                    bank_name_field: settingsData.bankNameField,
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Error saving settings to Supabase:', error);
        throw error;
    }
}

// Navigation
function setupNavigation() {
    console.log('Setting up navigation...');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            console.log('Navigating to:', targetPage);
            
            // Update active nav link
            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');
            
            // Show target page  
            pages.forEach(page => page.classList.remove('active'));
            const targetElement = document.getElementById(`${targetPage}-page`);
            if (targetElement) {
                targetElement.classList.add('active');
                
                // Render page-specific content
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

// Dashboard Rendering
function renderDashboard() {
    console.log('Rendering dashboard...');
    updateDashboardMetrics();
    renderRecentInvoices();
    setTimeout(() => renderCharts(), 100);
}

// FIXED: Update dashboard metrics with real data
function updateDashboardMetrics() {
    const totalEarnings = appData.invoices
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + inv.amount, 0);
    
    const avgMonthly = appData.monthlyEarnings.length > 0 
        ? appData.monthlyEarnings.reduce((sum, m) => sum + m.amount, 0) / appData.monthlyEarnings.length 
        : 0;

    // Update metric cards
    const metricCards = document.querySelectorAll('.metric-value');
    if (metricCards.length >= 4) {
        metricCards[0].textContent = `₹${formatNumber(totalEarnings)}`;
        metricCards[1].textContent = appData.totalClients;
        metricCards[2].textContent = appData.totalInvoices;
        metricCards[3].textContent = `₹${formatNumber(avgMonthly)}`;
    }
}

// FIXED: Recent invoices now shows newest first
function renderRecentInvoices() {
    const tbody = document.getElementById('recent-invoices-body');
    if (!tbody) return;
    
    // Take first 5 invoices (already sorted newest first from database)
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
    
    // Get data based on period
    if (period === 'quarterly') {
        earningsData = calculateQuarterlyEarnings();
    } else if (period === 'yearly') {
        earningsData = calculateYearlyEarnings();
    }
    
    // Monthly Earnings Chart
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

    // Client Revenue Pie Chart
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

// FIXED: Analytics setup
function setupAnalyticsFilters() {
    const periodSelect = document.getElementById('analytics-period');
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            const period = e.target.value;
            renderAnalytics(period);
        });
    }
}

// Invoice Management
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

    // Setup filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        // Remove existing listeners
        tab.removeEventListener('click', handleFilterClick);
        // Add new listener
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

// Client Management
function renderClients() {
    console.log('Rendering clients...');
    const grid = document.getElementById('clients-grid');
    if (!grid) return;
    
    grid.innerHTML = appData.clients.map(client => `
        <div class="client-card">
            <h4>${client.name}</h4>
            <div class="client-email">${client.email}</div>
            <div class="client-stats">
                <div class="client-stat">
                    <div class="client-stat-value">${client.total_invoices || 0}</div>
                    <div class="client-stat-label">Invoices</div>
                </div>
                <div class="client-stat">
                    <div class="client-stat-value">₹${formatNumber(client.total_amount || 0)}</div>
                    <div class="client-stat-label">Total</div>
                </div>
            </div>
        </div>
    `).join('');
}

// FIXED: Analytics with period support
function renderAnalytics(period = 'monthly') {
    console.log('Rendering analytics for period:', period);
    
    setTimeout(() => {
        const analyticsCtx = document.getElementById('analyticsChart');
        if (analyticsCtx) {
            if (analyticsChart) {
                analyticsChart.destroy();
            }
            
            let earningsData = appData.monthlyEarnings;
            let label = 'Monthly Earnings';
            
            if (period === 'quarterly') {
                earningsData = calculateQuarterlyEarnings();
                label = 'Quarterly Earnings';
            } else if (period === 'yearly') {
                earningsData = calculateYearlyEarnings();
                label = 'Yearly Earnings';
            }
            
            analyticsChart = new Chart(analyticsCtx, {
                type: 'bar',
                data: {
                    labels: earningsData.map(m => m.month),
                    datasets: [{
                        label: label,
                        data: earningsData.map(m => m.amount),
                        backgroundColor: '#1FB8CD',
                        borderColor: '#1FB8CD',
                        borderWidth: 1,
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
                                }
                            }
                        }
                    }
                }
            });
        }
    }, 100);
}

// Settings
function renderSettings() {
    console.log('Rendering settings...');
    const settings = appData.settings;
    
    const elements = {
        'profile-name': settings.profileName,
        'profile-email': settings.profileEmail,
        'profile-phone': settings.profilePhone,
        'bank-name': settings.bankName,
        'bank-account': settings.bankAccount,
        'bank-ifsc': settings.bankIFSC,
        'bank-name-field': settings.bankNameField,
        'currency-setting': settings.currency,
        'tax-rate': settings.taxRate,
        'invoice-prefix': settings.invoicePrefix
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    });
}

// Modal Management
function setupModals() {
    console.log('Setting up modals...');
    
    // Invoice Modal
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

    // Client Modal
    const clientModal = document.getElementById('client-modal');
    const clientModalOverlay = document.getElementById('client-modal-overlay');
    const closeClientModal = document.getElementById('close-client-modal');
    const addClientBtn = document.getElementById('add-client-btn');

    if (addClientBtn) {
        addClientBtn.addEventListener('click', openClientModal);
    }

    if (clientModalOverlay) {
        clientModalOverlay.addEventListener('click', () => closeModal(clientModal));
    }
    if (closeClientModal) {
        closeClientModal.addEventListener('click', () => closeModal(clientModal));
    }
}

// FIXED: Invoice modal opening
async function openInvoiceModal(invoiceId = null) {
    console.log('Opening invoice modal...', invoiceId ? 'for editing' : 'for creation');
    const modal = document.getElementById('invoice-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        editingInvoiceId = invoiceId;
        
        if (invoiceId) {
            // Edit mode - populate with existing data
            const invoice = appData.invoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                document.getElementById('invoice-number').value = invoice.id;
                document.getElementById('issue-date').value = invoice.date;
                document.getElementById('due-date').value = invoice.dueDate;
                
                // Set client
                const clientSelect = document.getElementById('invoice-client');
                if (clientSelect) {
                    clientSelect.innerHTML = '<option value="">Select Client</option>' + 
                        appData.clients.map(client => 
                            `<option value="${client.id}" ${client.id === invoice.clientId ? 'selected' : ''}>${client.name}</option>`
                        ).join('');
                }
                
                // Populate line items
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
                    addLineItem(); // Add one empty line item
                }
                
                calculateInvoiceTotal();
            }
        } else {
            // Create mode - generate new invoice number
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
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            
            const issueDateField = document.getElementById('issue-date');
            const dueDateField = document.getElementById('due-date');
            
            if (issueDateField) issueDateField.value = today;
            if (dueDateField) dueDateField.value = dueDate.toISOString().split('T')[0];
            
            // Clear and populate client dropdown
            const clientSelect = document.getElementById('invoice-client');
            if (clientSelect) {
                clientSelect.innerHTML = '<option value="">Select Client</option>' + 
                    appData.clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
            }
            
            // Reset line items
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
        
        // Clear form fields
        const form = document.getElementById('client-form');
        if (form) {
            form.reset();
        }
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        editingInvoiceId = null; // Reset editing state
    }
}

// Rest of the functions remain the same...
// Form Management
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

    // Setup line item calculations
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity') || e.target.classList.contains('rate')) {
            calculateLineItem(e.target.closest('.line-item'));
            calculateInvoiceTotal();
        }
    });

    // Setup remove buttons
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
}

async function saveInvoice(status) {
    console.log('Saving invoice with status:', status);
    
    const invoiceNumberInput = document.getElementById('invoice-number');
    let invoiceNumber = invoiceNumberInput?.value;
    const clientSelect = document.getElementById('invoice-client');
    const clientId = clientSelect ? parseInt(clientSelect.value) : null;
    const client = appData.clients.find(c => c.id === clientId);
    
    if (!client) {
        showToast('Please select a client', 'error');
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
            const description = descInput.value;
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
        // Save to Supabase
        await saveInvoiceToSupabase(invoice);
        
        if (editingInvoiceId) {
            // Update existing invoice in local data
            const index = appData.invoices.findIndex(inv => inv.id === editingInvoiceId);
            if (index > -1) {
                appData.invoices[index] = invoice;
            }
            showToast(`Invoice ${invoiceNumber} updated successfully`, 'success');
        } else {
            // Add new invoice to local data
            appData.invoices.unshift(invoice); // Add to beginning for newest first
            appData.totalInvoices++;
            showToast(`Invoice ${invoiceNumber} ${status === 'Draft' ? 'saved as draft' : 'created'} successfully`, 'success');
        }
        
        // Update client totals in local data
        const localClient = appData.clients.find(c => c.id === clientId);
        if (localClient) {
            // Recalculate totals for this client
            const clientInvoices = appData.invoices.filter(inv => inv.clientId === clientId);
            localClient.total_invoices = clientInvoices.length;
            localClient.total_amount = clientInvoices
                .filter(inv => inv.status === 'Paid')
                .reduce((sum, inv) => sum + inv.amount, 0);
        }
        
        // Recalculate monthly earnings
        calculateMonthlyEarnings();
        
        // Refresh views
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
    console.log('Saving client...');
    
    const companyInput = document.getElementById('client-company');
    const emailInput = document.getElementById('client-email');
    const phoneInput = document.getElementById('client-phone');
    const addressInput = document.getElementById('client-address');
    const termsInput = document.getElementById('client-terms');
    
    if (!companyInput || !emailInput) {
        showToast('Required fields are missing', 'error');
        return;
    }
    
    const clientData = {
        name: companyInput.value,
        email: emailInput.value,
        phone: phoneInput ? phoneInput.value : '',
        address: addressInput ? addressInput.value : '',
        paymentTerms: termsInput ? termsInput.value : 'net30'
    };
    
    if (!clientData.name || !clientData.email) {
        showToast('Please fill in required fields', 'error');
        return;
    }
    
    try {
        // Save to Supabase
        const savedClient = await saveClientToSupabase(clientData);
        
        // Update local data
        const newClient = {
            id: savedClient.id,
            name: savedClient.name,
            email: savedClient.email,
            phone: savedClient.phone || '',
            address: savedClient.address || '',
            paymentTerms: savedClient.payment_terms,
            total_invoices: savedClient.total_invoices || 0,
            total_amount: savedClient.total_amount || 0
        };
        
        appData.clients.push(newClient);
        appData.totalClients++;
        
        renderClients();
        
        closeModal(document.getElementById('client-modal'));
        showToast(`Client ${newClient.name} added successfully`, 'success');
        
        // Reset form
        if (companyInput) companyInput.value = '';
        if (emailInput) emailInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (addressInput) addressInput.value = '';
    } catch (error) {
        console.error('Error saving client:', error);
        showToast('Error saving client. Please try again.', 'error');
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

async function saveSettings() {
    console.log('Saving settings...');
    
    const elements = {
        currency: document.getElementById('currency-setting'),
        taxRate: document.getElementById('tax-rate'),
        invoicePrefix: document.getElementById('invoice-prefix'),
        profileName: document.getElementById('profile-name'),
        profileEmail: document.getElementById('profile-email'),
        profilePhone: document.getElementById('profile-phone'),
        bankName: document.getElementById('bank-name'),
        bankAccount: document.getElementById('bank-account'),
        bankIFSC: document.getElementById('bank-ifsc'),
        bankNameField: document.getElementById('bank-name-field')
    };
    
    const settingsData = {};
    Object.entries(elements).forEach(([key, element]) => {
        if (element) {
            if (key === 'taxRate') {
                settingsData[key] = parseFloat(element.value) || 18;
            } else {
                settingsData[key] = element.value;
            }
        }
    });
    
    try {
        // Save to Supabase
        await saveSettingsToSupabase(settingsData);
        
        // Update local data
        Object.assign(appData.settings, settingsData);
        
        showToast('Settings saved successfully', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings. Please try again.', 'error');
    }
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        appData.settings = {
            currency: 'INR',
            taxRate: 18,
            invoicePrefix: 'HP-2526',
            profileName: 'Hariprasad Sivakumar',
            profileEmail: 'contact@hariprasadss.com',
            profilePhone: '+91 9876543210',
            bankName: 'HARIPRASAD SIVAKUMAR',
            bankAccount: '',
            bankIFSC: '',
            bankNameField: ''
        };
        renderSettings();
        showToast('Settings reset to default', 'success');
    }
}

// Invoice Actions
function viewInvoice(invoiceId) {
    console.log('Viewing invoice:', invoiceId);
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        showToast(`Viewing invoice ${invoiceId} - Amount: ₹${formatNumber(invoice.amount)}`, 'info');
    }
}

// FIXED: Edit invoice functionality
function editInvoice(invoiceId) {
    console.log('Editing invoice:', invoiceId);
    openInvoiceModal(invoiceId);
}

async function deleteInvoice(invoiceId) {
    console.log('Deleting invoice:', invoiceId);
    if (confirm(`Are you sure you want to delete invoice ${invoiceId}?`)) {
        try {
            // Delete from Supabase
            await deleteInvoiceFromSupabase(invoiceId);
            
            // Update local data
            const index = appData.invoices.findIndex(inv => inv.id === invoiceId);
            if (index > -1) {
                const invoice = appData.invoices[index];
                const client = appData.clients.find(c => c.id === invoice.clientId);
                
                // Update client totals
                if (client) {
                    client.total_invoices = Math.max(0, (client.total_invoices || 0) - 1);
                    if (invoice.status === 'Paid') {
                        client.total_amount = Math.max(0, (client.total_amount || 0) - invoice.amount);
                    }
                }
                
                appData.invoices.splice(index, 1);  
                appData.totalInvoices = Math.max(0, appData.totalInvoices - 1);
                
                // Recalculate monthly earnings
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
    return new Intl.NumberFormat('en-IN').format(num);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showToast(message, type = 'info') {
    console.log('Toast:', type, message);
    const container = document.getElementById('toast-container');
    if (container) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 4000);
    }
}
