// COMPLETE ENHANCED INVOICE MANAGER - ALL ISSUES FIXED

// --- AUTHENTICATION ---
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

if (!checkAuth()) {
    throw new Error("Authentication failed. Redirecting...");
}

// --- SUPABASE & APP STATE ---
const SUPABASE_URL = 'https://kgdewraoanlaqewpbdlo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZGV3cmFvYW5sYXFld3BiZGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTg3NDksImV4cCI6MjA2OTI5NDc0OX0.wBgDDHcdK0Q9mN6uEPQFEO8gXiJdnrntLJW3dUdh89M';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let appData = {
    clients: [],
    invoices: [],
    settings: {},
    dataLoaded: false,
};

let analyticsState = {
    currentPeriod: 'monthly',
    filteredData: null,
    dateRange: { from: null, to: null }
};

let editingInvoiceId = null;
let editingClientId = null;
let monthlyChart, clientChart, analyticsChart;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    showLoadingState(true);
    try {
        addLogoutButton();
        await loadDataFromSupabase();
        appData.dataLoaded = true;

        setupNavigation();
        setupEventListeners();
        setupAnalyticsControls(); // Setup new date pickers

        renderDashboard();
        renderInvoices();
        renderClients();
        renderAnalytics();
        renderSettings();

        showToast('Application loaded successfully', 'success');
    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('Error loading data. Please refresh.', 'error');
    } finally {
        showLoadingState(false);
    }
}

function showLoadingState(show) {
    let loader = document.getElementById('app-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.innerHTML = `<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center;"><div style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #1FB8CD; border-radius: 50%; animation: spin 1s linear infinite;"></div></div>`;
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
        logoutBtn.innerHTML = `👋 Logout, ${username}`;
        logoutBtn.style.marginTop = '10px';
        logoutBtn.onclick = logout;
        sidebarHeader.appendChild(logoutBtn);
    }
}

// --- DATA HANDLING (SUPABASE) ---
async function loadDataFromSupabase() {
    const [clientsRes, invoicesRes, settingsRes] = await Promise.all([
        supabaseClient.from('clients').select('*').order('name', { ascending: true }),
        supabaseClient.from('invoices').select('*').order('date_issued', { ascending: false }),
        supabaseClient.from('settings').select('*').eq('user_id', 'default').single()
    ]);

    if (clientsRes.error) throw clientsRes.error;
    appData.clients = clientsRes.data || [];

    if (invoicesRes.error) throw invoicesRes.error;
    appData.invoices = invoicesRes.data.map(inv => ({ ...inv, date: inv.date_issued, dueDate: inv.due_date, items: Array.isArray(inv.items) ? inv.items : [] })) || [];

    appData.settings = settingsRes.data || {
        currency: 'INR', taxRate: 18, invoicePrefix: 'HP-2526',
        profileName: 'Hariprasad Sivakumar', profileEmail: 'contact@hariprasadss.com',
        profilePhone: '+91 9876543210', profileAddress: 'Bengaluru, Karnataka', profileGSTIN: '',
        bankName: '', bankAccount: '', bankIFSC: '', bankSWIFT: ''
    };
    // Ensure taxRate is a number
    appData.settings.taxRate = parseFloat(appData.settings.taxRate || 0);
}

// --- UI RENDERING ---
function renderDashboard() {
    const totalEarnings = appData.invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
    const monthlyEarnings = calculateMonthlyEarnings(appData.invoices);
    const avgMonthly = monthlyEarnings.length > 0 ? monthlyEarnings.reduce((sum, m) => sum + m.amount, 0) / monthlyEarnings.length : 0;

    document.querySelector('.metrics-grid .metric-card:nth-child(1) .metric-value').textContent = `₹${formatNumber(totalEarnings)}`;
    document.querySelector('.metrics-grid .metric-card:nth-child(2) .metric-value').textContent = appData.clients.length;
    document.querySelector('.metrics-grid .metric-card:nth-child(3) .metric-value').textContent = appData.invoices.length;
    document.querySelector('.metrics-grid .metric-card:nth-child(4) .metric-value').textContent = `₹${formatNumber(avgMonthly)}`;

    renderRecentInvoices();
    renderDashboardCharts(monthlyEarnings);
}

function renderRecentInvoices() {
    const tbody = document.getElementById('recent-invoices-body');
    tbody.innerHTML = appData.invoices.slice(0, 5).map(invoice => `
        <tr>
            <td><strong>${invoice.id}</strong></td>
            <td>${escapeHtml(invoice.client_name)}</td>
            <td><strong>₹${formatNumber(invoice.amount)}</strong></td>
            <td>${formatDate(invoice.date)}</td>
            <td><span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span></td>
        </tr>
    `).join('');
}

function renderInvoices() {
    const tbody = document.getElementById('invoices-body');
    tbody.innerHTML = appData.invoices.map(invoice => `
        <tr>
            <td><strong>${invoice.id}</strong></td>
            <td>${escapeHtml(invoice.client_name)}</td>
            <td><strong>₹${formatNumber(invoice.amount)}</strong></td>
            <td>${formatDate(invoice.date)}</td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td><span class="status-badge ${invoice.status.toLowerCase()}">${invoice.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewInvoice('${invoice.id}')" title="View">👁️</button>
                    <button class="action-btn edit" onclick="openInvoiceModal('${invoice.id}')" title="Edit">✏️</button>
                    <button class="action-btn download" onclick="downloadInvoice('${invoice.id}')" title="Download PDF">📥</button>
                    <button class="action-btn delete" onclick="deleteInvoice('${invoice.id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderClients() {
    const grid = document.getElementById('clients-grid');
    if (appData.clients.length === 0) {
        grid.innerHTML = `<p>No clients yet. Add one to get started!</p>`;
        return;
    }
    grid.innerHTML = appData.clients.map(client => {
        const clientInvoices = appData.invoices.filter(inv => inv.client_id === client.id);
        const totalPaid = clientInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
        return `
        <div class="client-card">
            <div class="client-header">
                <h4 class="client-name">${escapeHtml(client.name)}</h4>
                <div class="client-actions">
                    <button class="client-action-btn" onclick="openClientModal('${client.id}')" title="Edit client">✏️</button>
                    <button class="client-action-btn" onclick="deleteClient('${client.id}', '${escapeHtml(client.name)}')" title="Delete client">🗑️</button>
                </div>
            </div>
            <div class="client-details">
                <div class="client-email">📧 ${escapeHtml(client.email)}</div>
                ${client.phone ? `<div class="client-phone">📞 ${escapeHtml(client.phone)}</div>` : ''}
                ${client.contact_name ? `<div class="client-contact-name">👤 ${escapeHtml(client.contact_name)}</div>` : ''}
            </div>
            <div class="client-stats">
                <div class="client-stat">
                    <div class="client-stat-value">${clientInvoices.length}</div>
                    <div class="client-stat-label">Invoices</div>
                </div>
                <div class="client-stat">
                    <div class="client-stat-value">₹${formatNumber(totalPaid)}</div>
                    <div class="client-stat-label">Total Paid</div>
                </div>
            </div>
        </div>
    `}).join('');
}

function renderSettings() {
    const settings = appData.settings;
    document.getElementById('profile-name').value = settings.profileName || '';
    document.getElementById('profile-email').value = settings.profileEmail || '';
    document.getElementById('profile-phone').value = settings.profilePhone || '';
    document.getElementById('profile-address').value = settings.profileAddress || '';
    document.getElementById('profile-gstin').value = settings.profileGSTIN || '';
    document.getElementById('bank-name').value = settings.bankName || '';
    document.getElementById('bank-account').value = settings.bankAccount || '';
    document.getElementById('bank-ifsc').value = settings.bankIFSC || '';
    document.getElementById('bank-swift').value = settings.bankSWIFT || '';
    document.getElementById('currency-setting').value = settings.currency || 'INR';
    document.getElementById('tax-rate').value = settings.taxRate;
    document.getElementById('invoice-prefix').value = settings.invoicePrefix || '';
}

function renderAnalytics() {
    const analyticsPage = document.getElementById('analytics-page');
    if (!document.getElementById('analytics-layout')) {
        const layout = document.createElement('div');
        layout.id = 'analytics-layout';
        layout.innerHTML = `
            <div class="analytics-grid">
                <div class="chart-container">
                    <h3 id="analytics-chart-title">Earnings Trend Analysis</h3>
                    <div style="height: 300px; position: relative;"><canvas id="analyticsChart"></canvas></div>
                </div>
                <div class="insights-panel">
                    <h3>Key Insights</h3>
                    <div id="analytics-insights"></div>
                </div>
            </div>
        `;
        analyticsPage.appendChild(layout);
    }
    const dataToUse = analyticsState.filteredData || appData.invoices;
    renderAnalyticsChart(analyticsState.currentPeriod, dataToUse);
    renderAnalyticsInsights(dataToUse);
}


// --- CHARTS ---
function renderDashboardCharts(monthlyEarnings) {
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: monthlyEarnings.map(m => m.month),
            datasets: [{
                label: 'Earnings',
                data: monthlyEarnings.map(m => m.amount),
                borderColor: 'var(--color-primary)',
                backgroundColor: 'rgba(var(--color-teal-500-rgb), 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const clientCtx = document.getElementById('clientChart').getContext('2d');
    const clientData = appData.clients.map(c => ({
        name: c.name,
        total_amount: appData.invoices.filter(inv => inv.client_id === c.id && inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0)
    })).filter(c => c.total_amount > 0).sort((a,b) => b.total_amount - a.total_amount).slice(0, 5);

    if (clientChart) clientChart.destroy();
    clientChart = new Chart(clientCtx, {
        type: 'doughnut',
        data: {
            labels: clientData.map(c => c.name),
            datasets: [{
                data: clientData.map(c => c.total_amount),
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F', '#DB4545'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderAnalyticsChart(period, invoices) {
    const ctx = document.getElementById('analyticsChart')?.getContext('2d');
    if (!ctx) return;

    let earningsData, label;
    if (period === 'quarterly') {
        earningsData = calculateQuarterlyEarnings(invoices);
        label = 'Quarterly Earnings';
    } else if (period === 'yearly') {
        earningsData = calculateYearlyEarnings(invoices);
        label = 'Yearly Earnings';
    } else {
        earningsData = calculateMonthlyEarnings(invoices);
        label = 'Monthly Earnings';
    }
    document.getElementById('analytics-chart-title').textContent = label;

    if (analyticsChart) analyticsChart.destroy();
    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: earningsData.map(m => m.month),
            datasets: [{
                label: label,
                data: earningsData.map(m => m.amount),
                backgroundColor: 'rgba(var(--color-teal-500-rgb), 0.8)',
                borderColor: 'var(--color-primary)',
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderAnalyticsInsights(invoices) {
    const insightsContainer = document.getElementById('analytics-insights');
    if (!insightsContainer) return;

    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalEarnings = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const averageInvoice = paidInvoices.length > 0 ? totalEarnings / paidInvoices.length : 0;
    
    const clientEarnings = new Map();
    paidInvoices.forEach(inv => {
        clientEarnings.set(inv.client_name, (clientEarnings.get(inv.client_name) || 0) + inv.amount);
    });
    const topClient = [...clientEarnings.entries()].sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    insightsContainer.innerHTML = `
        <div class="insight-item">
            <div class="insight-label">Total Earnings</div>
            <div class="insight-value">₹${formatNumber(totalEarnings)}</div>
        </div>
        <div class="insight-item">
            <div class="insight-label">Average Invoice Value</div>
            <div class="insight-value">₹${formatNumber(averageInvoice)}</div>
        </div>
        <div class="insight-item">
            <div class="insight-label">Top Client</div>
            <div class="insight-value">${escapeHtml(topClient[0])}</div>
            <div class="insight-change positive">₹${formatNumber(topClient[1])}</div>
        </div>
    `;
}

// --- EVENT LISTENERS & NAVIGATION ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(`${targetPage}-page`).classList.add('active');
            
            // Re-render on page navigation
            if (targetPage === 'analytics') renderAnalytics();
        });
    });
}

function setupEventListeners() {
    // Modals
    document.getElementById('create-invoice-btn').addEventListener('click', () => openInvoiceModal());
    document.getElementById('new-invoice-btn').addEventListener('click', () => openInvoiceModal());
    document.getElementById('add-client-btn').addEventListener('click', () => openClientModal());

    // Invoice Form
    document.getElementById('invoice-form').addEventListener('submit', (e) => { e.preventDefault(); saveInvoice('Pending'); });
    document.getElementById('save-draft').addEventListener('click', () => saveInvoice('Draft'));
    document.getElementById('add-line-item').addEventListener('click', () => addLineItem());
    document.getElementById('line-items-container').addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity') || e.target.classList.contains('rate')) {
            calculateLineItemTotal(e.target.closest('.line-item'));
            calculateInvoiceTotals();
        }
    });
    document.getElementById('line-items-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item')) {
            removeLineItem(e.target.closest('.line-item'));
            calculateInvoiceTotals();
        }
    });

    // Client Form
    document.getElementById('client-form').addEventListener('submit', (e) => { e.preventDefault(); saveClient(); });
    
    // Settings Form
    document.getElementById('settings-form').addEventListener('submit', (e) => { e.preventDefault(); saveSettings(); });
    document.getElementById('reset-settings').addEventListener('click', resetSettings);

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            filterInvoices(e.target.dataset.filter);
        });
    });

    // Modal closing
    document.querySelectorAll('.modal-overlay, .modal-close, #cancel-client').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            editingClientId = null;
            editingInvoiceId = null;
        });
    });
}

// --- ANALYTICS UI (IMPROVED) ---
function setupAnalyticsControls() {
    const analyticsPage = document.getElementById('analytics-page');
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'modern-analytics-controls';
    controlsContainer.className = 'analytics-controls-container';
    controlsContainer.innerHTML = `
        <div class="control-group">
            <label class="control-label">View Type</label>
            <select id="analytics-period" class="modern-select">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
            </select>
        </div>
        <div class="control-group">
            <label class="control-label">Filter by Date Range</label>
            <div class="date-range-container">
                <input type="text" id="date-from" class="modern-date-input" placeholder="From...">
                <span class="date-separator">→</span>
                <input type="text" id="date-to" class="modern-date-input" placeholder="To...">
            </div>
        </div>
        <div class="action-buttons-group">
            <button class="btn btn--secondary btn--sm" id="clear-filters">Clear</button>
        </div>
        <div class="filter-status" id="analytics-status"></div>
    `;
    analyticsPage.insertBefore(controlsContainer, analyticsPage.children[1]);

    const commonOptions = {
        plugins: [new monthSelectPlugin({
            shorthand: true,
            dateFormat: "Y-m",
            altFormat: "F Y",
        })],
        onChange: applyAnalyticsFilters
    };

    flatpickr("#date-from", commonOptions);
    flatpickr("#date-to", commonOptions);

    document.getElementById('analytics-period').addEventListener('change', applyAnalyticsFilters);
    document.getElementById('clear-filters').addEventListener('click', clearAnalyticsFilters);
}

function applyAnalyticsFilters() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;
    const period = document.getElementById('analytics-period').value;
    const statusDiv = document.getElementById('analytics-status');

    analyticsState.currentPeriod = period;
    analyticsState.dateRange = { from: fromDate, to: toDate };

    let filteredInvoices = appData.invoices;
    if (fromDate && toDate) {
        if (fromDate > toDate) {
            showToast('"From" date cannot be after "To" date.', 'warning');
            return;
        }
        filteredInvoices = appData.invoices.filter(invoice => {
            const invoiceMonth = invoice.date.substring(0, 7);
            return invoiceMonth >= fromDate && invoiceMonth <= toDate;
        });
        const totalEarnings = filteredInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
        statusDiv.innerHTML = `Displaying ${filteredInvoices.length} invoices (₹${formatNumber(totalEarnings)}) from ${fromDate} to ${toDate}`;
        statusDiv.classList.add('show');
    } else {
        statusDiv.classList.remove('show');
    }
    
    analyticsState.filteredData = (fromDate && toDate) ? filteredInvoices : null;
    renderAnalytics();
}

function clearAnalyticsFilters() {
    flatpickr("#date-from").clear();
    flatpickr("#date-to").clear();
    document.getElementById('analytics-period').value = 'monthly';
    document.getElementById('analytics-status').classList.remove('show');
    
    analyticsState.filteredData = null;
    analyticsState.currentPeriod = 'monthly';
    analyticsState.dateRange = { from: null, to: null };
    renderAnalytics();
    showToast('Analytics filters cleared', 'info');
}

// --- MODALS & FORMS ---
async function openInvoiceModal(invoiceId = null) {
    editingInvoiceId = invoiceId;
    const modal = document.getElementById('invoice-modal');
    const form = document.getElementById('invoice-form');
    form.reset();
    document.getElementById('line-items-container').innerHTML = '';

    const title = document.getElementById('invoice-modal-title');
    const saveBtn = document.getElementById('save-invoice');

    const clientSelect = document.getElementById('invoice-client');
    clientSelect.innerHTML = '<option value="">Select Client</option>' + appData.clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    if (invoiceId) {
        title.textContent = 'Edit Invoice';
        saveBtn.textContent = 'Update Invoice';
        const invoice = appData.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            document.getElementById('invoice-number').value = invoice.id;
            document.getElementById('issue-date').value = invoice.date;
            document.getElementById('due-date').value = invoice.dueDate;
            clientSelect.value = invoice.client_id;
            invoice.items.forEach(item => addLineItem(item));
        }
    } else {
        title.textContent = 'Create New Invoice';
        saveBtn.textContent = 'Create Invoice';
        const nextNum = (appData.invoices.length > 0 ? Math.max(...appData.invoices.map(i => parseInt(i.id.split('-').pop()) || 0)) : 0) + 1;
        document.getElementById('invoice-number').value = `${appData.settings.invoicePrefix}-${String(nextNum).padStart(4, '0')}`;
        const today = new Date();
        document.getElementById('issue-date').value = today.toISOString().split('T')[0];
        today.setDate(today.getDate() + 30);
        document.getElementById('due-date').value = today.toISOString().split('T')[0];
        addLineItem();
    }
    calculateInvoiceTotals();
    modal.classList.remove('hidden');
}

function openClientModal(clientId = null) {
    editingClientId = clientId;
    const modal = document.getElementById('client-modal');
    const form = document.getElementById('client-form');
    form.reset();
    
    const title = document.getElementById('client-modal-title');
    const saveBtn = document.getElementById('save-client');

    if (clientId) {
        title.textContent = 'Edit Client';
        saveBtn.textContent = 'Update Client';
        const client = appData.clients.find(c => c.id === clientId);
        if (client) {
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-contact-name').value = client.contact_name || '';
            document.getElementById('client-email').value = client.email;
            document.getElementById('client-phone').value = client.phone || '';
            document.getElementById('client-address').value = client.address || '';
            document.getElementById('client-terms').value = client.payment_terms || 'net30';
        }
    } else {
        title.textContent = 'Add New Client';
        saveBtn.textContent = 'Save Client';
    }
    modal.classList.remove('hidden');
}

// --- CRUD OPERATIONS ---
async function saveInvoice(status) {
    const clientId = document.getElementById('invoice-client').value;
    if (!clientId) {
        showToast('Please select a client.', 'error');
        return;
    }
    const client = appData.clients.find(c => c.id === clientId);

    const lineItems = [...document.querySelectorAll('#line-items-container .line-item')].map(itemEl => ({
        description: itemEl.querySelector('.description').value,
        quantity: parseFloat(itemEl.querySelector('.quantity').value),
        rate: parseFloat(itemEl.querySelector('.rate').value),
        amount: parseFloat(itemEl.querySelector('.amount').value),
    })).filter(item => item.description && item.quantity > 0 && item.rate >= 0);

    if (lineItems.length === 0) {
        showToast('Please add at least one valid line item.', 'error');
        return;
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (appData.settings.taxRate / 100);
    const total = subtotal + tax;

    const invoiceData = {
        id: document.getElementById('invoice-number').value,
        client_id: clientId,
        client_name: client.name,
        amount: total,
        subtotal: subtotal,
        tax: tax,
        date_issued: document.getElementById('issue-date').value,
        due_date: document.getElementById('due-date').value,
        status: status,
        items: lineItems
    };

    try {
        let savedInvoice;
        if (editingInvoiceId) {
            const { data, error } = await supabaseClient.from('invoices').update(invoiceData).eq('id', editingInvoiceId).select().single();
            if (error) throw error;
            savedInvoice = data;
            const index = appData.invoices.findIndex(inv => inv.id === editingInvoiceId);
            appData.invoices[index] = { ...savedInvoice, date: savedInvoice.date_issued, dueDate: savedInvoice.due_date };
        } else {
            const { data, error } = await supabaseClient.from('invoices').insert(invoiceData).select().single();
            if (error) throw error;
            savedInvoice = data;
            appData.invoices.unshift({ ...savedInvoice, date: savedInvoice.date_issued, dueDate: savedInvoice.due_date });
        }
        showToast(`Invoice ${savedInvoice.id} saved successfully.`, 'success');
        document.getElementById('invoice-modal').classList.add('hidden');
        renderInvoices();
        renderDashboard();
    } catch (error) {
        showToast(`Error saving invoice: ${error.message}`, 'error');
    }
}

async function deleteInvoice(invoiceId) {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceId}? This cannot be undone.`)) return;
    try {
        const { error } = await supabaseClient.from('invoices').delete().eq('id', invoiceId);
        if (error) throw error;
        appData.invoices = appData.invoices.filter(inv => inv.id !== invoiceId);
        showToast(`Invoice ${invoiceId} deleted.`, 'success');
        renderInvoices();
        renderDashboard();
    } catch (error) {
        showToast(`Error deleting invoice: ${error.message}`, 'error');
    }
}

async function saveClient() {
    const clientData = {
        name: document.getElementById('client-name').value.trim(),
        contact_name: document.getElementById('client-contact-name').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        address: document.getElementById('client-address').value.trim(),
        payment_terms: document.getElementById('client-terms').value,
    };

    if (!clientData.name || !clientData.email) {
        showToast('Company name and email are required.', 'error');
        return;
    }

    try {
        let savedClient;
        if (editingClientId) {
            const { data, error } = await supabaseClient.from('clients').update(clientData).eq('id', editingClientId).select().single();
            if (error) throw error;
            savedClient = data;
            const index = appData.clients.findIndex(c => c.id === editingClientId);
            appData.clients[index] = savedClient;
        } else {
            const { data, error } = await supabaseClient.from('clients').insert(clientData).select().single();
            if (error) throw error;
            savedClient = data;
            appData.clients.push(savedClient);
        }
        showToast(`Client "${savedClient.name}" saved successfully.`, 'success');
        document.getElementById('client-modal').classList.add('hidden');
        renderClients();
    } catch (error) {
        showToast(`Error saving client: ${error.message}`, 'error');
    }
}

async function deleteClient(clientId, clientName) {
    const clientInvoices = appData.invoices.filter(inv => inv.client_id === clientId);
    if (clientInvoices.length > 0) {
        showToast(`Cannot delete "${clientName}". They have ${clientInvoices.length} associated invoice(s).`, 'error');
        return;
    }
    if (!confirm(`Are you sure you want to delete client "${clientName}"?`)) return;

    try {
        const { error } = await supabaseClient.from('clients').delete().eq('id', clientId);
        if (error) throw error;
        appData.clients = appData.clients.filter(c => c.id !== clientId);
        showToast(`Client "${clientName}" deleted.`, 'success');
        renderClients();
        renderDashboard();
    } catch (error) {
        showToast(`Error deleting client: ${error.message}`, 'error');
    }
}

async function saveSettings() {
    const settingsData = {
        profileName: document.getElementById('profile-name').value,
        profileEmail: document.getElementById('profile-email').value,
        profilePhone: document.getElementById('profile-phone').value,
        profileAddress: document.getElementById('profile-address').value,
        profileGSTIN: document.getElementById('profile-gstin').value,
        bankName: document.getElementById('bank-name').value,
        bankAccount: document.getElementById('bank-account').value,
        bankIFSC: document.getElementById('bank-ifsc').value,
        bankSWIFT: document.getElementById('bank-swift').value,
        currency: document.getElementById('currency-setting').value,
        taxRate: parseFloat(document.getElementById('tax-rate').value),
        invoicePrefix: document.getElementById('invoice-prefix').value,
    };

    try {
        const { data, error } = await supabaseClient.from('settings').upsert({ user_id: 'default', ...settingsData }).select().single();
        if (error) throw error;
        appData.settings = data;
        showToast('Settings saved successfully.', 'success');
    } catch (error) {
        showToast(`Error saving settings: ${error.message}`, 'error');
    }
}

function resetSettings() {
    if (confirm('Are you sure you want to reset settings to default?')) {
        renderSettings(); // Re-renders with default values from initial load
        showToast('Settings reset. Click "Save" to confirm.', 'info');
    }
}

// --- PDF DOWNLOAD (IMPROVED LAYOUT) ---
function downloadInvoice(invoiceId) {
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return showToast('Invoice not found.', 'error');

    const client = appData.clients.find(c => c.id === invoice.client_id);
    const settings = appData.settings;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    const primaryColor = '#217C8D'; // Teal color from your CSS
    const secondaryColor = '#626C71'; // Slate color
    const borderColor = '#E2E8F0';
    const pageMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- PDF Header ---
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('INVOICE', pageMargin, 25);

    // --- Invoice Details (Right Aligned) ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    const invoiceDetailsY = 15;
    doc.text(`Invoice Number:`, pageWidth - pageMargin, invoiceDetailsY, { align: 'right' });
    doc.text(`Date of Issue:`, pageWidth - pageMargin, invoiceDetailsY + 6, { align: 'right' });
    doc.text(`Due Date:`, pageWidth - pageMargin, invoiceDetailsY + 12, { align: 'right' });

    doc.setTextColor('#000000');
    doc.text(`${invoice.id}`, pageWidth - pageMargin - 1, invoiceDetailsY + 3, { align: 'right' });
    doc.text(`${formatDate(invoice.date)}`, pageWidth - pageMargin - 1, invoiceDetailsY + 9, { align: 'right' });
    doc.text(`${formatDate(invoice.dueDate)}`, pageWidth - pageMargin - 1, invoiceDetailsY + 15, { align: 'right' });

    // --- From/To Addresses ---
    const addressY = 40;
    doc.setLineWidth(0.5);
    doc.setDrawColor(borderColor);
    doc.line(pageMargin, addressY - 5, pageWidth - pageMargin, addressY - 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor);
    doc.text('FROM:', pageMargin, addressY);
    doc.text('TO:', pageWidth / 2 + 10, addressY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');
    
    // Using text with options for potential line breaks
    const fromAddress = doc.splitTextToSize(
        `${settings.profileName}\n${settings.profileAddress}\n${settings.profileEmail}\n${settings.profilePhone}${settings.profileGSTIN ? `\nGSTIN: ${settings.profileGSTIN}` : ''}`,
        (pageWidth / 2) - pageMargin - 5
    );
    doc.text(fromAddress, pageMargin, addressY + 6);

    const toAddress = doc.splitTextToSize(
        `${client ? client.name : invoice.client_name}\n${client ? client.address : ''}`,
        (pageWidth / 2) - pageMargin - 15
    );
    doc.text(toAddress, pageWidth / 2 + 10, addressY + 6);
    
    // --- Items Table ---
    const tableData = invoice.items.map(item => [
        item.description,
        item.quantity,
        formatNumber(item.rate),
        formatNumber(item.amount)
    ]);

    doc.autoTable({
        head: [['Description', 'Qty', 'Rate', 'Amount']],
        body: tableData,
        startY: addressY + 40,
        margin: { left: pageMargin, right: pageMargin },
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            textColor: '#FFFFFF',
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
        },
        didDrawPage: (data) => {
            // --- Footer ---
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setLineWidth(0.5);
            doc.setDrawColor(borderColor);
            doc.line(pageMargin, pageHeight - 35, pageWidth - pageMargin, pageHeight - 35);

            doc.setFontSize(9);
            doc.setTextColor(secondaryColor);
            doc.text('Bank Details:', pageMargin, pageHeight - 30);
            doc.setTextColor('#000000');
            doc.text(`Account Name: ${settings.bankName}`, pageMargin, pageHeight - 25);
            doc.text(`Account Number: ${settings.bankAccount}`, pageMargin, pageHeight - 20);
            doc.text(`IFSC: ${settings.bankIFSC}`, pageMargin, pageHeight - 15);

            doc.setTextColor(secondaryColor);
            doc.text('Thank you for your business!', pageWidth - pageMargin, pageHeight - 15, { align: 'right' });
        }
    });

    // --- Totals Section ---
    let finalY = doc.lastAutoTable.finalY;
    const totalsX = pageWidth - pageMargin;
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text('Subtotal:', totalsX - 30, finalY + 10, { align: 'left' });
    doc.text(`Tax (${settings.taxRate}%):`, totalsX - 30, finalY + 16, { align: 'left' });
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('Total:', totalsX - 30, finalY + 24, { align: 'left' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');
    doc.text(`₹${formatNumber(invoice.subtotal)}`, totalsX, finalY + 10, { align: 'right' });
    doc.text(`₹${formatNumber(invoice.tax)}`, totalsX, finalY + 16, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.setFontSize(12);
    doc.text(`₹${formatNumber(invoice.amount)}`, totalsX, finalY + 24, { align: 'right' });

    // --- Save the PDF ---
    doc.save(`Invoice-${invoice.id}.pdf`);
    showToast('Invoice downloaded.', 'success');
}


// --- UTILITY & HELPER FUNCTIONS ---
function addLineItem(item = { description: '', quantity: 1, rate: 0, amount: 0 }) {
    const container = document.getElementById('line-items-container');
    const div = document.createElement('div');
    div.className = 'line-item';
    div.innerHTML = `
        <div class="form-row">
            <div class="form-group" style="flex: 3;">
                <input type="text" class="form-control description" placeholder="Item Description" value="${escapeHtml(item.description)}" required>
            </div>
            <div class="form-group" style="flex: 1;">
                <input type="number" class="form-control quantity" placeholder="Qty" min="1" value="${item.quantity}" required>
            </div>
            <div class="form-group" style="flex: 1;">
                <input type="number" class="form-control rate" placeholder="Rate" min="0" step="0.01" value="${item.rate}" required>
            </div>
            <div class="form-group" style="flex: 1;">
                <input type="text" class="form-control amount" value="${item.amount.toFixed(2)}" readonly>
            </div>
            <button type="button" class="btn btn--secondary btn--sm remove-item">X</button>
        </div>
    `;
    container.appendChild(div);
}

function removeLineItem(itemEl) {
    if (document.querySelectorAll('#line-items-container .line-item').length > 1) {
        itemEl.remove();
        calculateInvoiceTotals();
    } else {
        showToast("You must have at least one line item.", "warning");
    }
}

function calculateLineItemTotal(itemEl) {
    const qty = parseFloat(itemEl.querySelector('.quantity').value) || 0;
    const rate = parseFloat(itemEl.querySelector('.rate').value) || 0;
    itemEl.querySelector('.amount').value = (qty * rate).toFixed(2);
}

function calculateInvoiceTotals() {
    const items = [...document.querySelectorAll('#line-items-container .line-item')];
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.querySelector('.amount').value) || 0), 0);
    const taxRate = parseFloat(appData.settings.taxRate || 0) / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    document.getElementById('invoice-subtotal').textContent = `₹${formatNumber(subtotal)}`;
    document.getElementById('invoice-tax-label').textContent = `Tax (${(taxRate * 100).toFixed(2)}%):`;
    document.getElementById('invoice-tax').textContent = `₹${formatNumber(tax)}`;
    document.getElementById('invoice-total').textContent = `₹${formatNumber(total)}`;
}

function filterInvoices(filter) {
    const rows = document.querySelectorAll('#invoices-body tr');
    rows.forEach(row => {
        if (filter === 'all') {
            row.style.display = '';
        } else {
            const status = row.querySelector('.status-badge').textContent.toLowerCase();
            row.style.display = status === filter ? '' : 'none';
        }
    });
}

function calculateMonthlyEarnings(invoices) {
    const monthlyData = new Map();
    invoices.filter(inv => inv.status === 'Paid').forEach(({ date, amount }) => {
        const monthKey = date.substring(0, 7); // YYYY-MM
        monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + amount);
    });
    return Array.from(monthlyData, ([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
}

function calculateQuarterlyEarnings(invoices) {
    const quarterlyData = new Map();
    invoices.filter(inv => inv.status === 'Paid').forEach(({ date, amount }) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const quarter = `Q${Math.floor(d.getMonth() / 3) + 1}`;
        const key = `${year}-${quarter}`;
        quarterlyData.set(key, (quarterlyData.get(key) || 0) + amount);
    });
    return Array.from(quarterlyData, ([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
}

function calculateYearlyEarnings(invoices) {
    const yearlyData = new Map();
    invoices.filter(inv => inv.status === 'Paid').forEach(({ date, amount }) => {
        const year = date.substring(0, 4);
        yearlyData.set(year, (yearlyData.get(year) || 0) + amount);
    });
    return Array.from(yearlyData, ([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month));
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function viewInvoice(invoiceId) {
    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        openInvoiceModal(invoiceId);
    }
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return text.toString().replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match]));
}
