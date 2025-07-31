/**
 * Modern Invoice Management Application
 * ES6+ JavaScript with Supabase Integration and Demo Mode
 */

class InvoiceManager {
  constructor() {
    this.supabase = null;
    this.user = null;
    this.clients = [];
    this.invoices = [];
    this.settings = {};
    this.charts = {};
    this.demoMode = false;
    
    this.init();
  }

  async init() {
    try {
      // Initialize Supabase
      const { createClient } = supabase;
      this.supabase = createClient(
        'https://kgdewraoanlaqewpbdlo.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZGV3cmFvYW5sYXFld3BiZGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTg3NDksImV4cCI6MjA2OTI5NDc0OX0.wBgDDHcdK0Q9mN6uEPQFEO8gXiJdnrntLJW3dUdh89M'
      );

      // Check authentication
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session) {
        this.user = session.user;
        await this.showApp();
      } else {
        this.showLogin();
      }
      
      this.setupEventListeners();
      this.hideLoadingScreen();
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.showToast('Failed to initialize application', 'error');
      this.hideLoadingScreen();
    }
  }

  // Authentication Methods
  async login(email, password) {
    try {
      // Demo mode for testing
      if (email === 'test@example.com' && password === 'password123') {
        this.demoMode = true;
        this.user = {
          id: 'demo-user',
          email: 'test@example.com',
          user_metadata: { name: 'Demo User' }
        };
        await this.loadDemoData();
        await this.showApp();
        this.showToast('Welcome to Demo Mode!', 'success');
        return;
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      this.user = data.user;
      await this.showApp();
      this.showToast('Welcome back!', 'success');
      
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async logout() {
    try {
      if (!this.demoMode) {
        await this.supabase.auth.signOut();
      }
      this.user = null;
      this.demoMode = false;
      this.clients = [];
      this.invoices = [];
      this.settings = {};
      this.showLogin();
      this.showToast('Logged out successfully', 'info');
    } catch (error) {
      this.showToast('Logout failed', 'error');
    }
  }

  // Demo Data
  async loadDemoData() {
    this.settings = this.getDefaultSettings();
    
    this.clients = [
      {
        id: 'client-1',
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+91 9876543210',
        address: '123 Business Street, Mumbai, Maharashtra 400001',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'client-2',
        name: 'Tech Solutions Ltd',
        email: 'info@techsolutions.com',
        phone: '+91 9876543211',
        address: '456 Innovation Hub, Bangalore, Karnataka 560001',
        created_at: '2024-02-01T10:00:00Z'
      },
      {
        id: 'client-3',
        name: 'Digital Marketing Pro',
        email: 'hello@digitalmarketing.com',
        phone: '+91 9876543212',
        address: '789 Creative Plaza, Hyderabad, Telangana 500001',
        created_at: '2024-02-15T10:00:00Z'
      },
      {
        id: 'client-4',
        name: 'StartUp Inc',
        email: 'team@startup.com',
        phone: '+91 9876543213',
        address: '321 Entrepreneur Lane, Pune, Maharashtra 411001',
        created_at: '2024-03-01T10:00:00Z'
      }
    ];
    
    this.invoices = [
      {
        id: 'invoice-1',
        invoice_number: 'HP-2526-0001',
        client_id: 'client-1',
        invoice_date: '2024-07-01',
        due_date: '2024-07-31',
        status: 'paid',
        line_items: [
          { description: 'Website Development', quantity: 1, rate: 50000, amount: 50000 },
          { description: 'SEO Optimization', quantity: 1, rate: 15000, amount: 15000 }
        ],
        subtotal: 65000,
        tax_amount: 0,
        total: 65000,
        created_at: '2024-07-01T10:00:00Z',
        clients: { name: 'Acme Corporation', email: 'contact@acme.com' }
      },
      {
        id: 'invoice-2',
        invoice_number: 'HP-2526-0002',
        client_id: 'client-2',
        invoice_date: '2024-07-15',
        due_date: '2024-08-15',
        status: 'pending',
        line_items: [
          { description: 'Mobile App Development', quantity: 1, rate: 75000, amount: 75000 },
          { description: 'API Integration', quantity: 1, rate: 25000, amount: 25000 }
        ],
        subtotal: 100000,
        tax_amount: 0,
        total: 100000,
        created_at: '2024-07-15T10:00:00Z',
        clients: { name: 'Tech Solutions Ltd', email: 'info@techsolutions.com' }
      },
      {
        id: 'invoice-3',
        invoice_number: 'HP-2526-0003',
        client_id: 'client-3',
        invoice_date: '2024-06-01',
        due_date: '2024-06-30',
        status: 'overdue',
        line_items: [
          { description: 'Digital Marketing Strategy', quantity: 1, rate: 30000, amount: 30000 }
        ],
        subtotal: 30000,
        tax_amount: 0,
        total: 30000,
        created_at: '2024-06-01T10:00:00Z',
        clients: { name: 'Digital Marketing Pro', email: 'hello@digitalmarketing.com' }
      },
      {
        id: 'invoice-4',
        invoice_number: 'HP-2526-0004',
        client_id: 'client-4',
        invoice_date: '2024-07-20',
        due_date: '2024-08-20',
        status: 'paid',
        line_items: [
          { description: 'E-commerce Platform', quantity: 1, rate: 80000, amount: 80000 },
          { description: 'Payment Gateway Setup', quantity: 1, rate: 20000, amount: 20000 }
        ],
        subtotal: 100000,
        tax_amount: 0,
        total: 100000,
        created_at: '2024-07-20T10:00:00Z',
        clients: { name: 'StartUp Inc', email: 'team@startup.com' }
      },
      {
        id: 'invoice-5',
        invoice_number: 'HP-2526-0005',
        client_id: 'client-1',
        invoice_date: '2024-05-15',
        due_date: '2024-06-15',
        status: 'paid',
        line_items: [
          { description: 'Website Maintenance', quantity: 3, rate: 5000, amount: 15000 }
        ],
        subtotal: 15000,
        tax_amount: 0,
        total: 15000,
        created_at: '2024-05-15T10:00:00Z',
        clients: { name: 'Acme Corporation', email: 'contact@acme.com' }
      }
    ];
  }

  // UI Management
  showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  async showApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    // Load initial data
    if (!this.demoMode) {
      await Promise.all([
        this.loadClients(),
        this.loadInvoices(),
        this.loadSettings()
      ]);
    }
    
    this.updateDashboard();
    this.initializeCharts();
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 300);
  }

  // Event Listeners
  setupEventListeners() {
    // Authentication
    this.setupAuthListeners();
    
    // Navigation
    this.setupNavigationListeners();
    
    // Theme toggle
    this.setupThemeListeners();
    
    // Modals
    this.setupModalListeners();
    
    // Forms
    this.setupFormListeners();
    
    // Search and filters
    this.setupSearchListeners();
    
    // Responsive
    this.setupResponsiveListeners();
  }

  setupAuthListeners() {
    const loginForm = document.getElementById('loginForm');
    const passwordToggle = document.querySelector('.password-toggle');
    
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(e);
      });
    }
    
    if (passwordToggle) {
      passwordToggle.addEventListener('click', this.togglePasswordVisibility);
    }
    
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Add demo login button
    this.addDemoLoginButton();
  }

  addDemoLoginButton() {
    const loginFooter = document.querySelector('.login-footer');
    if (loginFooter && !document.getElementById('demoLoginBtn')) {
      const demoBtn = document.createElement('button');
      demoBtn.id = 'demoLoginBtn';
      demoBtn.className = 'btn btn--outline btn--full-width';
      demoBtn.style.marginTop = '16px';
      demoBtn.textContent = 'Try Demo Mode';
      demoBtn.addEventListener('click', () => {
        document.getElementById('email').value = 'test@example.com';
        document.getElementById('password').value = 'password123';
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
      });
      loginFooter.appendChild(demoBtn);
    }
  }

  setupNavigationListeners() {
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.navigateToSection(section);
      });
    });
    
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', this.toggleSidebar);
    }
  }

  setupThemeListeners() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', this.toggleTheme);
    }
    
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-color-scheme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  setupModalListeners() {
    // Invoice modal
    const newInvoiceBtn = document.getElementById('newInvoiceBtn');
    const invoiceModal = document.getElementById('invoiceModal');
    const cancelInvoice = document.getElementById('cancelInvoice');
    
    if (newInvoiceBtn) {
      newInvoiceBtn.addEventListener('click', () => this.openInvoiceModal());
    }
    
    if (cancelInvoice) {
      cancelInvoice.addEventListener('click', () => this.closeModal('invoiceModal'));
    }
    
    // Client modal
    const newClientBtn = document.getElementById('newClientBtn');
    const clientModal = document.getElementById('clientModal');
    const cancelClient = document.getElementById('cancelClient');
    
    if (newClientBtn) {
      newClientBtn.addEventListener('click', () => this.openClientModal());
    }
    
    if (cancelClient) {
      cancelClient.addEventListener('click', () => this.closeModal('clientModal'));
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        this.closeModal(modal.id);
      });
    });
    
    // Modal backdrop clicks
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        this.closeModal(modal.id);
      });
    });
  }

  setupFormListeners() {
    // Invoice form
    const invoiceForm = document.getElementById('invoiceForm');
    if (invoiceForm) {
      invoiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleInvoiceSubmit(e);
      });
    }
    
    // Client form
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
      clientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleClientSubmit(e);
      });
    }
    
    // Settings forms
    const settingsForms = ['profileForm', 'bankingForm', 'preferencesForm'];
    settingsForms.forEach(formId => {
      const form = document.getElementById(formId);
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSettingsSubmit(e, formId);
        });
      }
    });
    
    // Add line item
    const addLineItemBtn = document.getElementById('addLineItem');
    if (addLineItemBtn) {
      addLineItemBtn.addEventListener('click', () => this.addLineItem());
    }
    
    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchSettingsTab(tabName);
      });
    });
  }

  setupSearchListeners() {
    const invoiceSearch = document.getElementById('invoiceSearch');
    const clientSearch = document.getElementById('clientSearch');
    const statusFilter = document.getElementById('statusFilter');
    
    if (invoiceSearch) {
      invoiceSearch.addEventListener('input', debounce(() => {
        this.filterInvoices();
      }, 300));
    }
    
    if (clientSearch) {
      clientSearch.addEventListener('input', debounce(() => {
        this.filterClients();
      }, 300));
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterInvoices());
    }
  }

  setupResponsiveListeners() {
    window.addEventListener('resize', debounce(() => {
      this.handleResize();
    }, 250));
  }

  // Authentication Handlers
  async handleLogin(e) {
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');
    
    try {
      // Validate form
      this.validateLoginForm(email, password);
      
      // Show loading state
      loginBtn.disabled = true;
      btnText.classList.add('hidden');
      btnSpinner.classList.remove('hidden');
      
      await this.login(email, password);
      
    } catch (error) {
      this.showFormError('email', error.message);
      this.showToast(error.message, 'error');
    } finally {
      loginBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
    }
  }

  validateLoginForm(email, password) {
    this.clearFormErrors();
    
    if (!email) throw new Error('Email is required');
    if (!this.isValidEmail(email)) throw new Error('Please enter a valid email');
    if (!password) throw new Error('Password is required');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
  }

  // Navigation
  navigateToSection(section) {
    // Update active nav item
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Show section
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(`${section}Section`).classList.add('active');
    
    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      invoices: 'Invoices',
      clients: 'Clients',
      analytics: 'Analytics',
      settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    // Load section-specific data
    this.loadSectionData(section);
  }

  async loadSectionData(section) {
    switch (section) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'invoices':
        this.renderInvoices();
        break;
      case 'clients':
        this.renderClients();
        break;
      case 'analytics':
        this.updateAnalytics();
        break;
      case 'settings':
        this.loadSettingsData();
        break;
    }
  }

  // Data Loading
  async loadClients() {
    if (this.demoMode) return;
    
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      this.clients = data || [];
      this.updateClientSelect();
      
    } catch (error) {
      console.error('Error loading clients:', error);
      this.showToast('Failed to load clients', 'error');
    }
  }

  async loadInvoices() {
    if (this.demoMode) return;
    
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select(`
          *,
          clients (
            name,
            email
          )
        `)
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      this.invoices = data || [];
      
    } catch (error) {
      console.error('Error loading invoices:', error);
      this.showToast('Failed to load invoices', 'error');
    }
  }

  async loadSettings() {
    if (this.demoMode) return;
    
    try {
      const { data, error } = await this.supabase
        .from('settings')
        .select('*')
        .eq('user_id', this.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      this.settings = data || this.getDefaultSettings();
      
      if (!data) {
        await this.saveSettings();
      }
      
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
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
    };
  }

  // Dashboard
  updateDashboard() {
    this.updateStats();
    this.updateRecentInvoices();
    this.updateClientSelect();
    
    // Update charts after a short delay to ensure canvas is rendered
    setTimeout(() => {
      this.updateCharts();
    }, 100);
  }

  updateStats() {
    const totalEarnings = this.invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    const pendingAmount = this.invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    const totalInvoices = this.invoices.length;
    const totalClients = this.clients.length;
    
    document.getElementById('totalEarnings').textContent = this.formatCurrency(totalEarnings);
    document.getElementById('totalInvoices').textContent = totalInvoices;
    document.getElementById('pendingAmount').textContent = this.formatCurrency(pendingAmount);
    document.getElementById('totalClients').textContent = totalClients;
  }

  updateRecentInvoices() {
    const container = document.getElementById('recentInvoices');
    const recent = this.invoices.slice(0, 5);
    
    if (recent.length === 0) {
      container.innerHTML = '<p class="text-muted">No invoices yet</p>';
      return;
    }
    
    container.innerHTML = recent.map(invoice => `
      <div class="recent-item">
        <div class="recent-item-info">
          <div class="recent-item-title">${invoice.invoice_number}</div>
          <div class="recent-item-subtitle">${invoice.clients?.name || 'Unknown Client'}</div>
        </div>
        <div class="recent-item-amount">${this.formatCurrency(invoice.total)}</div>
      </div>
    `).join('');
  }

  // Charts
  initializeCharts() {
    this.initRevenueChart();
    this.initStatusChart();
    this.initTrendChart();
    this.initClientChart();
  }

  initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const monthlyData = this.getMonthlyRevenue(6);
    
    if (this.charts.revenue) {
      this.charts.revenue.destroy();
    }
    
    this.charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyData.labels,
        datasets: [{
          label: 'Revenue',
          data: monthlyData.data,
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          fill: true,
          tension: 0.4
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
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  }

  initStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const statusData = this.getInvoiceStatusData();
    
    if (this.charts.status) {
      this.charts.status.destroy();
    }
    
    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: statusData.labels,
        datasets: [{
          data: statusData.data,
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  initTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    const trendData = this.getMonthlyRevenue(12);
    
    if (this.charts.trend) {
      this.charts.trend.destroy();
    }
    
    this.charts.trend = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: trendData.labels,
        datasets: [{
          label: 'Revenue',
          data: trendData.data,
          backgroundColor: '#1FB8CD',
          borderRadius: 8
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
              callback: (value) => this.formatCurrency(value)
            }
          }
        }
      }
    });
  }

  initClientChart() {
    const ctx = document.getElementById('clientChart');
    if (!ctx) return;
    
    const clientData = this.getTopClients(5);
    
    if (this.charts.client) {
      this.charts.client.destroy();
    }
    
    this.charts.client = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: clientData.labels,
        datasets: [{
          data: clientData.data,
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  updateCharts() {
    this.initializeCharts();
  }

  getMonthlyRevenue(months) {
    const now = new Date();
    const labels = [];
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      labels.push(monthName);
      
      const monthRevenue = this.invoices
        .filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate.getMonth() === date.getMonth() && 
                 invDate.getFullYear() === date.getFullYear() &&
                 inv.status === 'paid';
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      data.push(monthRevenue);
    }
    
    return { labels, data };
  }

  getInvoiceStatusData() {
    const statusCounts = this.invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});
    
    return {
      labels: ['Paid', 'Pending', 'Overdue'],
      data: [
        statusCounts.paid || 0,
        statusCounts.pending || 0,
        statusCounts.overdue || 0
      ]
    };
  }

  getTopClients(limit) {
    const clientRevenue = this.invoices
      .filter(inv => inv.status === 'paid')
      .reduce((acc, inv) => {
        const clientName = inv.clients?.name || 'Unknown';
        acc[clientName] = (acc[clientName] || 0) + (inv.total || 0);
        return acc;
      }, {});
    
    const sorted = Object.entries(clientRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
    
    return {
      labels: sorted.map(([name]) => name),
      data: sorted.map(([,revenue]) => revenue)
    };
  }

  // Invoice Management
  renderInvoices() {
    const container = document.getElementById('invoicesGrid');
    const filteredInvoices = this.getFilteredInvoices();
    
    if (filteredInvoices.length === 0) {
      container.innerHTML = '<p class="text-muted">No invoices found</p>';
      return;
    }
    
    container.innerHTML = filteredInvoices.map(invoice => this.createInvoiceCard(invoice)).join('');
    
    // Add event listeners to action buttons
    this.setupInvoiceActions();
  }

  createInvoiceCard(invoice) {
    const statusClass = invoice.status;
    const dueDate = new Date(invoice.due_date);
    const isOverdue = dueDate < new Date() && invoice.status === 'pending';
    
    return `
      <div class="invoice-card ${statusClass}" data-invoice-id="${invoice.id}">
        <div class="card-header">
          <div>
            <div class="card-title">${invoice.invoice_number}</div>
            <div class="card-subtitle">${invoice.clients?.name || 'Unknown Client'}</div>
          </div>
          <div class="card-amount">${this.formatCurrency(invoice.total)}</div>
        </div>
        
        <div class="card-details">
          <p><strong>Date:</strong> ${this.formatDate(invoice.invoice_date)}</p>
          <p><strong>Due:</strong> ${this.formatDate(invoice.due_date)} ${isOverdue ? '(Overdue)' : ''}</p>
          <p><strong>Status:</strong> <span class="status status--${invoice.status}">${this.capitalizeFirst(invoice.status)}</span></p>
        </div>
        
        <div class="card-footer">
          <div class="card-actions">
            <button class="card-action" data-action="edit" data-invoice-id="${invoice.id}">Edit</button>
            <button class="card-action" data-action="pdf" data-invoice-id="${invoice.id}">PDF</button>
            <button class="card-action danger" data-action="delete" data-invoice-id="${invoice.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  getFilteredInvoices() {
    let filtered = [...this.invoices];
    
    const searchTerm = document.getElementById('invoiceSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchTerm) ||
        (invoice.clients?.name || '').toLowerCase().includes(searchTerm)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    return filtered;
  }

  setupInvoiceActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const invoiceId = e.target.dataset.invoiceId;
        
        switch (action) {
          case 'edit':
            this.editInvoice(invoiceId);
            break;
          case 'pdf':
            this.generatePDF(invoiceId);
            break;
          case 'delete':
            this.confirmDeleteInvoice(invoiceId);
            break;
        }
      });
    });
  }

  // Client Management
  renderClients() {
    const container = document.getElementById('clientsGrid');
    const filteredClients = this.getFilteredClients();
    
    if (filteredClients.length === 0) {
      container.innerHTML = '<p class="text-muted">No clients found</p>';
      return;
    }
    
    container.innerHTML = filteredClients.map(client => this.createClientCard(client)).join('');
    
    // Add event listeners
    this.setupClientActions();
  }

  createClientCard(client) {
    const invoiceCount = this.invoices.filter(inv => inv.client_id === client.id).length;
    const totalRevenue = this.invoices
      .filter(inv => inv.client_id === client.id && inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    return `
      <div class="client-card" data-client-id="${client.id}">
        <div class="card-header">
          <div>
            <div class="card-title">${client.name}</div>
            <div class="card-subtitle">${client.email}</div>
          </div>
        </div>
        
        <div class="card-details">
          <p><strong>Phone:</strong> ${client.phone || 'N/A'}</p>
          <p><strong>Invoices:</strong> ${invoiceCount}</p>
          <p><strong>Revenue:</strong> ${this.formatCurrency(totalRevenue)}</p>
        </div>
        
        <div class="card-footer">
          <div class="card-actions">
            <button class="card-action" data-action="edit-client" data-client-id="${client.id}">Edit</button>
            <button class="card-action" data-action="new-invoice" data-client-id="${client.id}">New Invoice</button>
            <button class="card-action danger" data-action="delete-client" data-client-id="${client.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  getFilteredClients() {
    let filtered = [...this.clients];
    
    const searchTerm = document.getElementById('clientSearch')?.value.toLowerCase() || '';
    
    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }

  setupClientActions() {
    document.querySelectorAll('[data-action^="edit-client"], [data-action^="new-invoice"], [data-action^="delete-client"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const clientId = e.target.dataset.clientId;
        
        switch (action) {
          case 'edit-client':
            this.editClient(clientId);
            break;
          case 'new-invoice':
            this.openInvoiceModal(clientId);
            break;
          case 'delete-client':
            this.confirmDeleteClient(clientId);
            break;
        }
      });
    });
  }

  // Modal Management
  openInvoiceModal(clientId = null) {
    const modal = document.getElementById('invoiceModal');
    const form = document.getElementById('invoiceForm');
    const title = document.getElementById('invoiceModalTitle');
    
    title.textContent = 'Create Invoice';
    form.reset();
    form.dataset.mode = 'create';
    
    // Set current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Set due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
    
    // Pre-select client if provided
    if (clientId) {
      document.getElementById('clientSelect').value = clientId;
    }
    
    // Clear line items and add one empty item
    this.clearLineItems();
    this.addLineItem();
    
    this.showModal('invoiceModal');
  }

  openClientModal(clientId = null) {
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const title = document.getElementById('clientModalTitle');
    
    if (clientId) {
      title.textContent = 'Edit Client';
      form.dataset.mode = 'edit';
      form.dataset.clientId = clientId;
      this.populateClientForm(clientId);
    } else {
      title.textContent = 'Add Client';
      form.dataset.mode = 'create';
      form.reset();
    }
    
    this.showModal('clientModal');
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    
    // Focus first input
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
  }

  // Form Handlers
  async handleInvoiceSubmit(e) {
    const formData = new FormData(e.target);
    const lineItems = this.getLineItems();
    
    try {
      this.validateInvoiceForm(formData, lineItems);
      
      const invoice = {
        user_id: this.user.id,
        client_id: formData.get('clientSelect'),
        invoice_date: formData.get('invoiceDate'),
        due_date: formData.get('dueDate'),
        status: formData.get('invoiceStatus'),
        line_items: lineItems,
        subtotal: this.calculateSubtotal(lineItems),
        tax_amount: this.calculateTax(lineItems),
        total: this.calculateTotal(lineItems)
      };
      
      const mode = e.target.dataset.mode;
      
      if (mode === 'edit') {
        await this.updateInvoice(e.target.dataset.invoiceId, invoice);
      } else {
        invoice.invoice_number = await this.generateInvoiceNumber();
        await this.createInvoice(invoice);
      }
      
      this.closeModal('invoiceModal');
      if (!this.demoMode) {
        await this.loadInvoices();
      }
      this.renderInvoices();
      this.updateDashboard();
      
      this.showToast(`Invoice ${mode === 'edit' ? 'updated' : 'created'} successfully`, 'success');
      
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async handleClientSubmit(e) {
    const formData = new FormData(e.target);
    
    try {
      this.validateClientForm(formData);
      
      const client = {
        user_id: this.user.id,
        name: formData.get('clientName'),
        email: formData.get('clientEmail'),
        phone: formData.get('clientPhone'),
        address: formData.get('clientAddress')
      };
      
      const mode = e.target.dataset.mode;
      
      if (mode === 'edit') {
        await this.updateClient(e.target.dataset.clientId, client);
      } else {
        await this.createClient(client);
      }
      
      this.closeModal('clientModal');
      if (!this.demoMode) {
        await this.loadClients();
      }
      this.renderClients();
      this.updateDashboard();
      
      this.showToast(`Client ${mode === 'edit' ? 'updated' : 'created'} successfully`, 'success');
      
    } catch (error) {
      this.showToast(error.message, 'error');
    }
  }

  async handleSettingsSubmit(e, formType) {
    const formData = new FormData(e.target);
    
    try {
      // Update settings object
      for (const [key, value] of formData.entries()) {
        this.settings[key] = value;
      }
      
      if (!this.demoMode) {
        await this.saveSettings();
      }
      this.showToast('Settings saved successfully', 'success');
      
    } catch (error) {
      this.showToast('Failed to save settings', 'error');
    }
  }

  // Database Operations (Demo Mode Handlers)
  async createInvoice(invoice) {
    if (this.demoMode) {
      invoice.id = 'invoice-' + Date.now();
      invoice.created_at = new Date().toISOString();
      invoice.clients = this.clients.find(c => c.id === invoice.client_id);
      this.invoices.unshift(invoice);
      return invoice;
    }
    
    const { data, error } = await this.supabase
      .from('invoices')
      .insert([invoice])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async updateInvoice(id, invoice) {
    if (this.demoMode) {
      const index = this.invoices.findIndex(inv => inv.id === id);
      if (index !== -1) {
        this.invoices[index] = { ...this.invoices[index], ...invoice };
        return this.invoices[index];
      }
      throw new Error('Invoice not found');
    }
    
    const { data, error } = await this.supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async deleteInvoice(id) {
    if (this.demoMode) {
      const index = this.invoices.findIndex(inv => inv.id === id);
      if (index !== -1) {
        this.invoices.splice(index, 1);
        return;
      }
      throw new Error('Invoice not found');
    }
    
    const { error } = await this.supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async createClient(client) {
    if (this.demoMode) {
      client.id = 'client-' + Date.now();
      client.created_at = new Date().toISOString();
      this.clients.unshift(client);
      this.updateClientSelect();
      return client;
    }
    
    const { data, error } = await this.supabase
      .from('clients')
      .insert([client])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async updateClient(id, client) {
    if (this.demoMode) {
      const index = this.clients.findIndex(c => c.id === id);
      if (index !== -1) {
        this.clients[index] = { ...this.clients[index], ...client };
        this.updateClientSelect();
        return this.clients[index];
      }
      throw new Error('Client not found');
    }
    
    const { data, error } = await this.supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  async deleteClient(id) {
    if (this.demoMode) {
      const index = this.clients.findIndex(c => c.id === id);
      if (index !== -1) {
        this.clients.splice(index, 1);
        this.updateClientSelect();
        return;
      }
      throw new Error('Client not found');
    }
    
    const { error } = await this.supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async saveSettings() {
    if (this.demoMode) return;
    
    const { data, error } = await this.supabase
      .from('settings')
      .upsert([{ ...this.settings, user_id: this.user.id }]);
    
    if (error) throw error;
  }

  // Utility Methods
  formatCurrency(amount) {
    const currency = this.settings.currency || 'INR';
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    return `${symbols[currency] || '₹'}${amount.toFixed(2)}`;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const id = Date.now();
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in-out forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  async generateInvoiceNumber() {
    const prefix = this.settings.invoicePrefix || 'HP-2526';
    const count = this.invoices.length + 1;
    return `${prefix}-${String(count).padStart(4, '0')}`;
  }

  // Line Items Management
  addLineItem() {
    const container = document.getElementById('lineItems');
    const itemCount = container.children.length;
    
    const lineItem = document.createElement('div');
    lineItem.className = 'line-item';
    lineItem.innerHTML = `
      <input type="text" placeholder="Description" class="form-control item-description" required>
      <input type="number" placeholder="Quantity" class="form-control item-quantity" min="1" value="1" required>
      <input type="number" placeholder="Rate" class="form-control item-rate" min="0" step="0.01" required>
      <input type="number" placeholder="Amount" class="form-control item-amount" readonly>
      <button type="button" class="line-item-remove" ${itemCount === 0 ? 'disabled' : ''}>×</button>
    `;
    
    container.appendChild(lineItem);
    
    // Add event listeners
    const inputs = lineItem.querySelectorAll('.item-quantity, .item-rate');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.calculateLineItemTotal(lineItem));
    });
    
    const removeBtn = lineItem.querySelector('.line-item-remove');
    removeBtn.addEventListener('click', () => {
      if (container.children.length > 1) {
        lineItem.remove();
        this.updateInvoiceTotals();
      }
    });
    
    // Focus description field
    lineItem.querySelector('.item-description').focus();
  }

  calculateLineItemTotal(lineItem) {
    const quantity = parseFloat(lineItem.querySelector('.item-quantity').value) || 0;
    const rate = parseFloat(lineItem.querySelector('.item-rate').value) || 0;
    const amount = quantity * rate;
    
    lineItem.querySelector('.item-amount').value = amount.toFixed(2);
    this.updateInvoiceTotals();
  }

  updateInvoiceTotals() {
    const lineItems = this.getLineItems();
    const subtotal = this.calculateSubtotal(lineItems);
    const taxAmount = this.calculateTax(lineItems);
    const total = this.calculateTotal(lineItems);
    
    document.getElementById('subtotal').textContent = this.formatCurrency(subtotal);
    document.getElementById('taxAmount').textContent = this.formatCurrency(taxAmount);
    document.getElementById('totalAmount').textContent = this.formatCurrency(total);
  }

  getLineItems() {
    const items = [];
    document.querySelectorAll('.line-item').forEach(item => {
      const description = item.querySelector('.item-description').value;
      const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
      const rate = parseFloat(item.querySelector('.item-rate').value) || 0;
      
      if (description && quantity > 0 && rate >= 0) {
        items.push({
          description,
          quantity,
          rate,
          amount: quantity * rate
        });
      }
    });
    return items;
  }

  calculateSubtotal(lineItems) {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  }

  calculateTax(lineItems) {
    const subtotal = this.calculateSubtotal(lineItems);
    const taxRate = parseFloat(this.settings.taxRate) || 0;
    return subtotal * (taxRate / 100);
  }

  calculateTotal(lineItems) {
    return this.calculateSubtotal(lineItems) + this.calculateTax(lineItems);
  }

  clearLineItems() {
    document.getElementById('lineItems').innerHTML = '';
  }

  // Additional Methods
  togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle-icon');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleIcon.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      toggleIcon.textContent = '👁️';
    }
  }

  toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
  }

  toggleTheme() {
    const currentTheme = document.body.getAttribute('data-color-scheme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-color-scheme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeIcon(newTheme);
    
    // Update charts with new theme
    setTimeout(() => this.updateCharts(), 100);
  }

  updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  filterInvoices() {
    this.renderInvoices();
  }

  filterClients() {
    this.renderClients();
  }

  handleResize() {
    // Handle responsive changes
    if (window.innerWidth <= 768) {
      document.querySelector('.sidebar').classList.remove('open');
    }
    
    // Resize charts
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.resize) {
        chart.resize();
      }
    });
  }

  // Form validation helpers
  clearFormErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
      el.classList.remove('show');
    });
  }

  showFormError(fieldName, message) {
    const errorEl = document.getElementById(`${fieldName}Error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('show');
    }
  }

  validateInvoiceForm(formData, lineItems) {
    if (!formData.get('clientSelect')) throw new Error('Please select a client');
    if (!formData.get('invoiceDate')) throw new Error('Invoice date is required');
    if (!formData.get('dueDate')) throw new Error('Due date is required');
    if (lineItems.length === 0) throw new Error('At least one line item is required');
  }

  validateClientForm(formData) {
    if (!formData.get('clientName')) throw new Error('Client name is required');
    if (!formData.get('clientEmail')) throw new Error('Email is required');
    if (!this.isValidEmail(formData.get('clientEmail'))) throw new Error('Please enter a valid email');
  }

  updateClientSelect() {
    const select = document.getElementById('clientSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a client</option>';
    this.clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      select.appendChild(option);
    });
  }

  loadSettingsData() {
    // Populate settings forms
    Object.keys(this.settings).forEach(key => {
      const input = document.getElementById(key);
      if (input) {
        input.value = this.settings[key];
      }
    });
  }

  switchSettingsTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update panels
    document.querySelectorAll('.settings-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
  }

  updateAnalytics() {
    setTimeout(() => {
      this.initTrendChart();
      this.initClientChart();
    }, 100);
  }

  // PDF Generation
  generatePDF(invoiceId) {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add content to PDF
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 50);
    doc.text(`Date: ${this.formatDate(invoice.invoice_date)}`, 20, 60);
    doc.text(`Due Date: ${this.formatDate(invoice.due_date)}`, 20, 70);
    
    // Add client info
    doc.text('Bill To:', 20, 90);
    doc.text(invoice.clients?.name || 'Unknown Client', 20, 100);
    
    // Add line items
    let yPos = 130;
    doc.text('Description', 20, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Rate', 140, yPos);
    doc.text('Amount', 170, yPos);
    
    yPos += 10;
    (invoice.line_items || []).forEach(item => {
      doc.text(item.description, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(this.formatCurrency(item.rate), 140, yPos);
      doc.text(this.formatCurrency(item.amount), 170, yPos);
      yPos += 10;
    });
    
    // Add totals
    yPos += 10;
    doc.text(`Total: ${this.formatCurrency(invoice.total)}`, 170, yPos);
    
    // Save PDF
    doc.save(`${invoice.invoice_number}.pdf`);
    this.showToast('PDF generated successfully', 'success');
  }

  // Delete confirmations
  confirmDeleteInvoice(invoiceId) {
    this.showConfirmModal(
      'Delete Invoice',
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      async () => {
        try {
          await this.deleteInvoice(invoiceId);
          if (!this.demoMode) {
            await this.loadInvoices();
          }
          this.renderInvoices();
          this.updateDashboard();
          this.showToast('Invoice deleted successfully', 'success');
        } catch (error) {
          this.showToast('Failed to delete invoice', 'error');
        }
      }
    );
  }

  confirmDeleteClient(clientId) {
    const clientInvoices = this.invoices.filter(inv => inv.client_id === clientId);
    if (clientInvoices.length > 0) {
      this.showToast('Cannot delete client with existing invoices', 'error');
      return;
    }
    
    this.showConfirmModal(
      'Delete Client',
      'Are you sure you want to delete this client? This action cannot be undone.',
      async () => {
        try {
          await this.deleteClient(clientId);
          if (!this.demoMode) {
            await this.loadClients();
          }
          this.renderClients();
          this.updateDashboard();
          this.showToast('Client deleted successfully', 'success');
        } catch (error) {
          this.showToast('Failed to delete client', 'error');
        }
      }
    );
  }

  showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    
    const confirmBtn = document.getElementById('confirmAction');
    const cancelBtn = document.getElementById('confirmCancel');
    
    // Remove existing listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
      this.closeModal('confirmModal');
      onConfirm();
    });
    
    document.getElementById('confirmCancel').addEventListener('click', () => {
      this.closeModal('confirmModal');
    });
    
    this.showModal('confirmModal');
  }

  editInvoice(invoiceId) {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const modal = document.getElementById('invoiceModal');
    const form = document.getElementById('invoiceForm');
    const title = document.getElementById('invoiceModalTitle');
    
    title.textContent = 'Edit Invoice';
    form.dataset.mode = 'edit';
    form.dataset.invoiceId = invoiceId;
    
    // Populate form
    document.getElementById('clientSelect').value = invoice.client_id;
    document.getElementById('invoiceDate').value = invoice.invoice_date;
    document.getElementById('dueDate').value = invoice.due_date;
    document.getElementById('invoiceStatus').value = invoice.status;
    
    // Populate line items
    this.clearLineItems();
    (invoice.line_items || []).forEach(item => {
      this.addLineItem();
      const lastItem = document.querySelector('.line-item:last-child');
      lastItem.querySelector('.item-description').value = item.description;
      lastItem.querySelector('.item-quantity').value = item.quantity;
      lastItem.querySelector('.item-rate').value = item.rate;
      lastItem.querySelector('.item-amount').value = item.amount;
    });
    
    this.updateInvoiceTotals();
    this.showModal('invoiceModal');
  }

  editClient(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;
    
    this.openClientModal(clientId);
  }

  populateClientForm(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;
    
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientEmail').value = client.email;
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientAddress').value = client.address || '';
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.invoiceManager = new InvoiceManager();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + N for new invoice
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    document.getElementById('newInvoiceBtn')?.click();
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal:not(.hidden)');
    if (openModal) {
      window.invoiceManager.closeModal(openModal.id);
    }
  }
});

// Handle service worker for PWA (if needed)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
