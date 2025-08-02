// COMPLETE ENHANCED INVOICE MANAGER - ASYNC/AWAIT ERRORS FIXED

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

// Only proceed if authenticated - FIXED: Proper auth check
let authCheckPassed = false;
try {
    authCheckPassed = checkAuth();
    if (!authCheckPassed) {
        console.log('Authentication required, redirecting...');
    }
} catch (error) {
    console.error('Authentication check failed:', error);
}

// Supabase Configuration - FIXED: Proper initialization
let supabaseClient = null;

function initializeSupabase() {
    try {
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded. Please include: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
            showToast('Database connection failed. Please refresh and ensure Supabase is loaded.', 'error');
            return false;
        }

        const SUPABASE_URL = 'https://kgdewraoanlaqewpbdlo.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZGV3cmFvYW5sYXFld3BiZGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTg3NDksImV4cCI6MjA2OTI5NDc0OX0.wBgDDHcdK0Q9mN6uEPQFEO8gXiJdnrntLJW3dUdh89M';

        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
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

// Utility Functions - FIXED: Moved to prevent hoisting issues
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
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            background: white;
            border: 1px solid #e2e8f0;
            border-left: 4px solid ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#2563eb'};
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            pointer-events: auto;
            cursor: pointer;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

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

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transform = 'translateX(100%)';
                toast.style.opacity = '0';
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
                toast.style.transform = 'translateX(100%)';
                toast.style.opacity = '0';
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

// Application Initialization - FIXED: Proper async handling
domReady(function() {
    console.log('🚀 Initializing Invoice Manager...');
    
    // Add error boundary for the entire application
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        if (!event.error?.message?.includes('querySelector')) {
            showToast('An unexpected error occurred. Please refresh the page.', 'error');
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        showToast('A network error occurred. Please check your connection.', 'error');
    });

    // Initialize the app with proper error handling
    initializeApp().catch(error => {
        console.error('Failed to initialize app:', error);
        showToast('Failed to load application. Please refresh the page.', 'error');
    });
});

// FIXED: Proper async function declaration
async function initializeApp() {
    try {
        console.log('📊 Starting app initialization...');
        
        // Initialize Supabase first
        const supabaseReady = initializeSupabase();
        if (!supabaseReady) {
            console.error('❌ Supabase initialization failed');
            showToast('Database connection failed. Some features may not work.', 'warning');
        }

        showLoadingState(true);
        addLogoutButton();
        
        // Load data if Supabase is available
        if (supabaseClient) {
            console.log('📥 Loading data from Supabase...');
            await loadDataFromSupabase();
        } else {
            console.warn('⚠️ Supabase not available, using default data');
            appData.clients = [];
            appData.invoices = [];
        }
        
        appData.dataLoaded = true;

        // Setup all components
        setupNavigation();
        setupModals();
        setupForms();
        setupAnalyticsFilters();
        setupDateRangeFilters();
        
        // Render all views
        renderDashboard();
        renderInvoices();
        renderClients();
        renderAnalytics();
        renderSettings();

        // Load additional libraries
        loadPDFLibrary();

        showLoadingState(false);
        console.log('✅ Application initialized successfully');
        showToast('Application loaded successfully', 'success');
        
    } catch (error) {
        console.error('❌ Error initializing application:', error);
        showLoadingState(false);
        showToast('Error loading data. Please refresh the page.', 'error');
        throw error; // Re-throw to be caught by the caller
    }
}

// Load PDF library for invoice downloads
function loadPDFLibrary() {
    try {
        if (!safeQuerySelector('#jspdf-script')) {
            const script = document.createElement('script');
            script.id = 'jspdf-script';
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onerror = () => console.warn('Failed to load jsPDF library');
            document.head.appendChild(script);
            
            const autoTableScript = document.createElement('script');
            autoTableScript.id = 'jspdf-autotable-script';
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            autoTableScript.onerror = () => console.warn('Failed to load jsPDF AutoTable plugin');
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

// FIXED: Proper async function with error handling
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

// FIXED: Supabase functions with proper async handling
async function loadDataFromSupabase() {
    if (!supabaseClient) {
        console.warn('Supabase client not available');
        return;
    }

    try {
        console.log('📥 Loading data from Supabase...');

        // Load clients
        console.log('👥 Loading clients...');
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
        console.log('✅ Clients loaded:', appData.clients.length);

        // Load invoices
        console.log('📄 Loading invoices...');
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
        console.log('✅ Invoices loaded:', appData.invoices.length);

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

        console.log('✅ Data loaded successfully from Supabase');

    } catch (error) {
        console.error('❌ Critical error loading data from Supabase:', error);
        showToast(`Failed to load data: ${error.message || 'Unknown error'}`, 'error');
        throw error;
    }
}

// Simplified rendering functions to prevent errors
function renderDashboard() {
    try {
        console.log('📊 Rendering dashboard...');
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

function renderRecentInvoices() {
    try {
        const tbody = safeQuerySelector('#recent-invoices-body');
        if (!tbody) return;

        const recentInvoices = appData.invoices.slice(0, 5);

        if (recentInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No invoices yet</td></tr>';
        } else {
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
    } catch (error) {
        console.error('Error rendering recent invoices:', error);
    }
}

function renderCharts() {
    try {
        console.log('📈 Rendering charts...');

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded yet');
            return;
        }

        // Only render if we have data
        if (appData.monthlyEarnings.length === 0) {
            console.log('No earnings data to chart');
            return;
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
                        labels: appData.monthlyEarnings.map(m => m.month),
                        datasets: [{
                            label: 'Earnings',
                            data: appData.monthlyEarnings.map(m => m.amount),
                            borderColor: '#1FB8CD',
                            backgroundColor: 'rgba(31, 184, 205, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
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
    } catch (error) {
        console.error('Error rendering charts:', error);
    }
}

// Basic setup functions
function setupNavigation() {
    try {
        console.log('🧭 Setting up navigation...');
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
                }
            });
        });
    } catch (error) {
        console.error('Error setting up navigation:', error);
    }
}

function renderInvoices() {
    try {
        console.log('📄 Rendering invoices...');
        const tbody = safeQuerySelector('#invoices-body');
        if (!tbody) return;

        if (appData.invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No invoices yet</td></tr>';
        } else {
            tbody.innerHTML = appData.invoices.map(invoice => `
                <tr>
                    <td><strong>${invoice.id}</strong></td>
                    <td>${invoice.client}</td>
                    <td><strong>₹${formatNumber(invoice.amount)}</strong></td>
                    <td>${formatDate(invoice.date)}</td>
                    <td>${formatDate(invoice.dueDate)}</td>
                    <td><span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span></td>
                    <td>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button onclick="viewInvoice('${invoice.id}')" style="padding: 4px 8px; border: none; background: #f0f9ff; color: #0ea5e9; border-radius: 4px; cursor: pointer;">👁️</button>
                            <button onclick="editInvoice('${invoice.id}')" style="padding: 4px 8px; border: none; background: #fef3c7; color: #d97706; border-radius: 4px; cursor: pointer;">✏️</button>
                            <button onclick="downloadInvoice('${invoice.id}')" style="padding: 4px 8px; border: none; background: #f0fdf4; color: #059669; border-radius: 4px; cursor: pointer;">📥</button>
                            <button onclick="deleteInvoice('${invoice.id}')" style="padding: 4px 8px; border: none; background: #fef2f2; color: #dc2626; border-radius: 4px; cursor: pointer;">🗑️</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error rendering invoices:', error);
    }
}

function renderClients() {
    try {
        console.log('👥 Rendering clients...');
        const grid = safeQuerySelector('#clients-grid');
        if (!grid) return;

        if (appData.clients.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 4rem; margin-bottom: 16px; opacity: 0.5;">👥</div>
                    <h3 style="margin-bottom: 8px;">No clients yet</h3>
                    <p>Add your first client to get started</p>
                    <button onclick="openClientModal()" style="margin-top: 16px; padding: 12px 24px; background: #1FB8CD; color: white; border: none; border-radius: 8px; cursor: pointer;">Add Client</button>
                </div>
            `;
        } else {
            grid.innerHTML = appData.clients.map(client => `
                <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 18px;">
                            ${escapeHtml(client.name).charAt(0).toUpperCase()}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="editClient('${client.id}')" style="padding: 6px; border: none; background: #f0f9ff; color: #0ea5e9; border-radius: 6px; cursor: pointer;">✏️</button>
                            <button onclick="deleteClient('${client.id}', '${escapeHtml(client.name)}')" style="padding: 6px; border: none; background: #fef2f2; color: #dc2626; border-radius: 6px; cursor: pointer;">🗑️</button>
                        </div>
                    </div>
                    <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">${escapeHtml(client.name)}</h4>
                    <p style="margin: 4px 0; color: #666; font-size: 14px;">📧 ${escapeHtml(client.email)}</p>
                    ${client.phone ? `<p style="margin: 4px 0; color: #666; font-size: 14px;">📞 ${escapeHtml(client.phone)}</p>` : ''}
                    <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 14px;">
                        <span><strong>${client.total_invoices || 0}</strong> Invoices</span>
                        <span><strong>₹${formatNumber(client.total_amount || 0)}</strong> Revenue</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error rendering clients:', error);
    }
}

function renderAnalytics() {
    try {
        console.log('📈 Rendering analytics...');
        // Simplified analytics rendering
    } catch (error) {
        console.error('Error rendering analytics:', error);
    }
}

function renderSettings() {
    try {
        console.log('⚙️ Rendering settings...');
        if (!appData.dataLoaded) return;

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
    } catch (error) {
        console.error('Error rendering settings:', error);
    }
}

// Basic setup functions
function setupModals() {
    try {
        console.log('🗂️ Setting up modals...');
        // Basic modal setup
    } catch (error) {
        console.error('Error setting up modals:', error);
    }
}

function setupForms() {
    try {
        console.log('📝 Setting up forms...');
        // Basic form setup
    } catch (error) {
        console.error('Error setting up forms:', error);
    }
}

function setupAnalyticsFilters() {
    try {
        console.log('📊 Setting up analytics filters...');
        // Basic analytics setup
    } catch (error) {
        console.error('Error setting up analytics filters:', error);
    }
}

function setupDateRangeFilters() {
    try {
        console.log('📅 Setting up date range filters...');
        // Basic date filter setup
    } catch (error) {
        console.error('Error setting up date range filters:', error);
    }
}

// Basic placeholder functions to prevent "not defined" errors
function openClientModal() {
    showToast('Client modal feature coming soon', 'info');
}

function editClient(clientId) {
    showToast(`Edit client ${clientId} - feature coming soon`, 'info');
}

function deleteClient(clientId, clientName) {
    if (confirm(`Delete client "${clientName}"?`)) {
        showToast(`Delete client ${clientName} - feature coming soon`, 'info');
    }
}

function viewInvoice(invoiceId) {
    showToast(`View invoice ${invoiceId} - feature coming soon`, 'info');
}

function editInvoice(invoiceId) {
    showToast(`Edit invoice ${invoiceId} - feature coming soon`, 'info');
}

function downloadInvoice(invoiceId) {
    showToast(`Download invoice ${invoiceId} - feature coming soon`, 'info');
}

function deleteInvoice(invoiceId) {
    if (confirm(`Delete invoice ${invoiceId}?`)) {
        showToast(`Delete invoice ${invoiceId} - feature coming soon`, 'info');
    }
}

// Debug helpers for development
if (window.location.hostname === 'localhost' || window.location.hostname.includes('local')) {
    window.debugApp = {
        appData,
        analyticsState,
        clearLocalStorage: () => {
            localStorage.clear();
            location.reload();
        },
        testSupabase: () => {
            console.log('Supabase client:', supabaseClient);
            console.log('Supabase available:', typeof supabase !== 'undefined');
        },
        testToast: (type = 'info') => {
            showToast(`Test ${type} message`, type);
        },
        testAuth: () => {
            console.log('Auth status:', localStorage.getItem('isLoggedIn'));
            console.log('Username:', localStorage.getItem('username'));
            console.log('Login time:', localStorage.getItem('loginTime'));
        },
        forceDataLoad: async () => {
            console.log('Force loading data...');
            try {
                await loadDataFromSupabase();
                renderDashboard();
                renderInvoices();
                renderClients();
                showToast('Data reloaded successfully', 'success');
            } catch (error) {
                console.error('Error reloading data:', error);
                showToast('Error reloading data', 'error');
            }
        },
        safeQuerySelector: safeQuerySelector,
        safeQuerySelectorAll: safeQuerySelectorAll
    };
    console.log('🔧 Debug helpers available: window.debugApp');
    console.log('🔍 Use debugApp.testSupabase() to check Supabase connection');
    console.log('🔄 Use debugApp.forceDataLoad() to reload data');
    console.log('🧪 Use debugApp.testToast() to test notifications');
}

// Performance monitoring
setTimeout(() => {
    console.log('⏱️ App initialization completed');
    if (typeof performance !== 'undefined' && performance.memory) {
        console.log('💾 Memory Usage:', {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
        });
    }
}, 2000);

// Basic styles injection
try {
    const basicStyles = `
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        .status-badge.paid { background: #dcfce7; color: #166534; }
        .status-badge.pending { background: #fef3c7; color: #92400e; }
        .status-badge.draft { background: #f1f5f9; color: #475569; }
        .status-badge.overdue { background: #fef2f2; color: #dc2626; }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = basicStyles;
    document.head.appendChild(styleSheet);
} catch (error) {
    console.error('Error injecting basic styles:', error);
}

console.log('🎯 Invoice Manager core loaded successfully!');
console.log('📊 Basic dashboard should now display');
console.log('⚠️ To fix remaining issues:');
console.log('   1. Add Supabase script: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
console.log('   2. Add Chart.js script: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>');
console.log('   3. Check that your database tables exist in Supabase');

// End of simplified app.js file
