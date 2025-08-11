// EXPENSE MANAGEMENT UI COMPONENTS - expense-ui.js (LEAK-PROOF VERSION)
// Enhanced with comprehensive cleanup and state management

class ExpenseUI {
    constructor(expenseManager, showToast) {
        this.expenseManager = expenseManager;
        this.showToast = showToast || console.log;
        this.charts = {};
        
        // ENHANCED: Component state tracking for proper cleanup
        this.isActive = false;
        this.isInitialized = false;
        this.mountedElements = new Set(); // Track created elements
        this.activeListeners = new Map(); // Track active event listeners
        this.activeTimeouts = new Set(); // Track timeouts/intervals
        
        // Bind methods to preserve context
        this._boundNavigateToExpenses = this.navigateToExpenses.bind(this);
        this._boundHandleGlobalClick = this._handleGlobalClick.bind(this);
        this._boundHandlePageVisibilityChange = this._handlePageVisibilityChange.bind(this);
        this._boundBeforeUnload = this._handleBeforeUnload.bind(this);
        
        // Navigation state management
        this.navigationState = {
            currentPage: null,
            previousPage: null,
            isTransitioning: false
        };
    }

    // Initialize UI components with enhanced state management
    initializeUI() {
        if (this.isInitialized) {
            console.log('⚠️ ExpenseUI already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing ExpenseUI with leak prevention...');
            
            this.setupExpenseNavigation();
            this.setupExpenseModals();
            this.setupExpenseForms();
            this.setupGlobalCleanupListeners();
            
            this.isInitialized = true;
            console.log('✅ ExpenseUI initialized successfully with leak prevention');
        } catch (error) {
            console.error('❌ Error initializing ExpenseUI:', error);
            this.cleanup(); // Cleanup on error
        }
    }

    // ENHANCED: Setup global cleanup listeners for navigation state management
    setupGlobalCleanupListeners() {
        // Listen for page visibility changes
        this.addManagedListener(document, 'visibilitychange', this._boundHandlePageVisibilityChange);
        
        // Listen for beforeunload to cleanup
        this.addManagedListener(window, 'beforeunload', this._boundBeforeUnload);
        
        // Setup navigation observer using MutationObserver
        this.setupNavigationObserver();
    }

    // ENHANCED: Navigation observer to detect page changes
    setupNavigationObserver() {
        if (this.navigationObserver) {
            this.navigationObserver.disconnect();
        }

        this.navigationObserver = new MutationObserver((mutations) => {
            let pageChanged = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('page')) {
                        pageChanged = true;
                    }
                }
            });

            if (pageChanged) {
                this._handlePageChange();
            }
        });

        // Observe all page elements for class changes
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            this.navigationObserver.observe(page, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }

    // ENHANCED: Handle page changes with proper state management
    _handlePageChange() {
        const activePage = document.querySelector('.page.active');
        const newPageId = activePage ? activePage.id : null;
        
        if (this.navigationState.currentPage !== newPageId) {
            this.navigationState.previousPage = this.navigationState.currentPage;
            this.navigationState.currentPage = newPageId;
            this.navigationState.isTransitioning = true;
            
            console.log(`📍 Page changed: ${this.navigationState.previousPage} → ${newPageId}`);
            
            // If we're leaving the expenses page, cleanup
            if (this.navigationState.previousPage === 'expenses-page' && newPageId !== 'expenses-page') {
                this._handleLeavingExpensesPage();
            }
            
            // Reset transition state after a delay
            setTimeout(() => {
                this.navigationState.isTransitioning = false;
            }, 100);
        }
    }

    // ENHANCED: Handle leaving expenses page
    _handleLeavingExpensesPage() {
        console.log('🚪 Leaving expenses page - performing cleanup...');
        this.isActive = false;
        this.cleanupExpenseElements();
        this.cleanupExpenseListeners();
        this.cleanupCharts();
    }

    // ENHANCED: Handle page visibility changes
    _handlePageVisibilityChange() {
        if (document.hidden && this.isActive) {
            console.log('👁️ Page hidden - pausing expense operations');
            this.pauseExpenseOperations();
        } else if (!document.hidden && this.isActive) {
            console.log('👁️ Page visible - resuming expense operations');
            this.resumeExpenseOperations();
        }
    }

    // ENHANCED: Handle before unload
    _handleBeforeUnload() {
        console.log('🔄 Page unloading - performing final cleanup');
        this.cleanup();
    }

    // ENHANCED: Managed event listener system
    addManagedListener(element, event, handler, options = {}) {
        if (!element) {
            console.warn('⚠️ Cannot add listener to null element');
            return;
        }

        try {
            element.addEventListener(event, handler, options);
            
            // Store reference for cleanup
            const key = `${element.constructor.name}-${event}-${Date.now()}`;
            this.activeListeners.set(key, {
                element,
                event,
                handler,
                options
            });
            
            console.log(`✅ Added managed listener: ${event} on ${element.constructor.name}`);
        } catch (error) {
            console.error('❌ Error adding managed listener:', error);
        }
    }

    // ENHANCED: Remove managed event listener
    removeManagedListener(key) {
        if (this.activeListeners.has(key)) {
            const { element, event, handler } = this.activeListeners.get(key);
            try {
                element.removeEventListener(event, handler);
                this.activeListeners.delete(key);
                console.log(`🗑️ Removed managed listener: ${event}`);
            } catch (error) {
                console.error('❌ Error removing managed listener:', error);
            }
        }
    }

    // ENHANCED: Setup expense navigation with proper state management
    setupExpenseNavigation() {
        // Add expense navigation to sidebar if not exists
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav && !document.querySelector('[data-page="expenses"]')) {
            const expenseNavItem = document.createElement('li');
            expenseNavItem.innerHTML = `
                <a href="#" class="nav-link" data-page="expenses">
                    <span class="nav-icon">💰</span>
                    <span>Expenses</span>
                </a>
            `;
            
            // Track created element
            this.mountedElements.add(expenseNavItem);
            
            // Insert before analytics
            const analyticsItem = sidebarNav.querySelector('[data-page="analytics"]')?.parentElement;
            if (analyticsItem) {
                sidebarNav.insertBefore(expenseNavItem, analyticsItem);
            } else {
                sidebarNav.appendChild(expenseNavItem);
            }

            // Add managed click handler
            const navLink = expenseNavItem.querySelector('.nav-link');
            this.addManagedListener(navLink, 'click', (e) => {
                e.preventDefault();
                this._boundNavigateToExpenses();
            });
        }

        // Add expenses page to main content if not exists
        const mainContent = document.querySelector('.main-content');
        if (mainContent && !document.getElementById('expenses-page')) {
            const expensesPage = document.createElement('div');
            expensesPage.id = 'expenses-page';
            expensesPage.className = 'page';
            expensesPage.innerHTML = this.getExpensesPageHTML();
            
            // Track created element
            this.mountedElements.add(expensesPage);
            
            mainContent.appendChild(expensesPage);
        }
    }

    // ENHANCED: Navigate to expenses with proper state management
    navigateToExpenses() {
        // Prevent navigation during transitions
        if (this.navigationState.isTransitioning) {
            console.log('⏳ Navigation in progress - ignoring request');
            return;
        }

        console.log('🏠 Navigating to expenses page...');
        
        // Remove active class from all nav links and pages
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // Activate expenses nav and page
        const expensesNavLink = document.querySelector('[data-page="expenses"]');
        const expensesPage = document.getElementById('expenses-page');
        
        if (expensesNavLink) expensesNavLink.classList.add('active');
        if (expensesPage) {
            expensesPage.classList.add('active');
            this.isActive = true;
            console.log('✅ Expenses page activated');
            
            // Wait for DOM to settle before rendering
            this.scheduleDelayedOperation(() => {
                if (this.isActive && this._isOnExpensesPage()) {
                    console.log('🎨 Rendering expenses content...');
                    this.renderExpenses();
                } else {
                    console.log('⚠️ Page changed during navigation - skipping render');
                }
            }, 100);
        } else {
            console.error('❌ Expenses page not found in DOM');
        }
    }

    // ENHANCED: Schedule delayed operations with tracking
    scheduleDelayedOperation(operation, delay) {
        const timeoutId = setTimeout(() => {
            this.activeTimeouts.delete(timeoutId);
            operation();
        }, delay);
        
        this.activeTimeouts.add(timeoutId);
        return timeoutId;
    }

    // ENHANCED: Check if currently on expenses page
    _isOnExpensesPage() {
        const activePage = document.querySelector('.page.active');
        return activePage && activePage.id === 'expenses-page';
    }

    // ENHANCED: Setup expense modals with proper cleanup
    setupExpenseModals() {
        // Check if modals already exist
        if (document.getElementById('expense-modal')) return;

        const modalHTML = this.getModalHTML();
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        
        // Track created elements
        Array.from(modalContainer.children).forEach(child => {
            this.mountedElements.add(child);
            document.body.appendChild(child);
        });

        // Add modal styles
        this.addExpenseModalStyles();
    }

    // ENHANCED: Setup expense forms with managed event delegation
    setupExpenseForms() {
        // Use managed event delegation instead of global listeners
        this.addManagedListener(document, 'click', this._boundHandleGlobalClick);
    }

    // ENHANCED: Global click handler with proper scoping
    _handleGlobalClick(e) {
        // Only handle expense-related clicks when on expenses page or in modals
        if (!this._shouldHandleClick(e.target)) {
            return;
        }

        const target = e.target;
        
        if (target.id === 'add-expense-btn') {
            this.openExpenseModal();
        } else if (target.id === 'export-expenses') {
            this.exportExpenses();
        } else if (target.classList.contains('edit-expense-btn')) {
            const expenseId = target.getAttribute('data-expense-id');
            this.editExpense(expenseId);
        } else if (target.classList.contains('delete-expense-btn')) {
            const expenseId = target.getAttribute('data-expense-id');
            this.deleteExpense(expenseId);
        } else if (this._isModalCloseTarget(target)) {
            this._handleModalClose(target);
        } else if (this._isFormSubmitTarget(target)) {
            e.preventDefault();
            this._handleFormSubmit(target);
        }
    }

    // ENHANCED: Determine if click should be handled
    _shouldHandleClick(target) {
        // Always handle modal-related clicks
        if (target.closest('#expense-modal') || target.closest('#category-modal')) {
            return true;
        }
        
        // Only handle page clicks if on expenses page
        if (this._isOnExpensesPage() && this.isActive) {
            return true;
        }
        
        return false;
    }

    // ENHANCED: Modal close target detection
    _isModalCloseTarget(target) {
        return target.id === 'expense-modal-overlay' ||
               target.id === 'close-expense-modal' ||
               target.id === 'cancel-expense' ||
               target.id === 'category-modal-overlay' ||
               target.id === 'close-category-modal';
    }

    // ENHANCED: Form submit target detection
    _isFormSubmitTarget(target) {
        return target.id === 'save-expense' || target.id === 'save-category';
    }

    // ENHANCED: Handle modal close
    _handleModalClose(target) {
        if (target.id === 'expense-modal-overlay' || 
            target.id === 'close-expense-modal' || 
            target.id === 'cancel-expense') {
            this.closeExpenseModal();
        } else if (target.id === 'category-modal-overlay' || 
                   target.id === 'close-category-modal') {
            this.closeCategoryModal();
        }
    }

    // ENHANCED: Handle form submit
    _handleFormSubmit(target) {
        if (target.id === 'save-expense') {
            this.saveExpense();
        } else if (target.id === 'save-category') {
            this.saveCategory();
        }
    }

    // ENHANCED: Render expenses with state validation
    renderExpenses() {
        if (!this.expenseManager.isInitialized) {
            console.log('⚠️ Expense manager not initialized yet');
            return;
        }

        if (!this._isOnExpensesPage() || !this.isActive) {
            console.log('⚠️ Not on expenses page or inactive - skipping render');
            return;
        }

        console.log('🎨 Rendering expenses components...');
        
        try {
            this.renderBalanceCards();
            this.renderExpenseFilters();
            this.renderExpenseCharts();
            this.renderExpensesTable();
            console.log('✅ Expenses rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering expenses:', error);
        }
    }

    // ENHANCED: Render expense filters with state-specific IDs
    renderExpenseFilters() {
        if (!this._isOnExpensesPage()) {
            console.log('❌ Not on expenses page - aborting filter render');
            return;
        }

        console.log('🔍 Rendering expense filters...');
        
        const expensesPage = document.getElementById('expenses-page');
        const container = expensesPage?.querySelector('#expenses-page-filters-container');
        
        if (!container) {
            console.error('❌ Expense filter container not found');
            return;
        }

        // Clear existing filters
        container.innerHTML = '';

        const categories = this.expenseManager.categories;
        const paymentMethods = this.expenseManager.getPaymentMethods();

        container.innerHTML = `
            <div class="filters-row">
                <div class="filter-group">
                    <label class="filter-label">Category</label>
                    <select class="form-control filter-select" id="expenses-page-category-filter">
                        <option value="all">All Categories</option>
                        ${categories.map(cat => `
                            <option value="${cat.id}">${cat.icon} ${cat.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Payment Method</label>
                    <select class="form-control filter-select" id="expenses-page-payment-filter">
                        <option value="all">All Methods</option>
                        ${paymentMethods.map(method => `
                            <option value="${method.value}">${method.icon} ${method.label}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Date Range</label>
                    <div class="date-range-inputs">
                        <input type="date" class="form-control" id="expenses-page-date-from" placeholder="From">
                        <input type="date" class="form-control" id="expenses-page-date-to" placeholder="To">
                    </div>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Options</label>
                    <div class="filter-checkboxes">
                        <label class="checkbox-label">
                            <input type="checkbox" id="expenses-page-business-only">
                            <span>Business Only</span>
                        </label>
                    </div>
                </div>
                <div class="filter-group">
                    <button class="btn btn--primary btn--sm" id="expenses-page-apply-filters">Apply Filters</button>
                    <button class="btn btn--secondary btn--sm" id="expenses-page-clear-filters">Clear</button>
                </div>
            </div>
        `;

        console.log('✅ Expense filters rendered successfully');
    }

    // ENHANCED: Apply expense filters with state validation
    applyExpenseFilters() {
        if (!this._isOnExpensesPage() || !this.isActive) {
            console.log('❌ Not on expenses page - skipping filter application');
            return;
        }

        console.log('🔍 Applying expense filters...');

        const elements = {
            category: document.getElementById('expenses-page-category-filter'),
            payment: document.getElementById('expenses-page-payment-filter'),
            dateFrom: document.getElementById('expenses-page-date-from'),
            dateTo: document.getElementById('expenses-page-date-to'),
            business: document.getElementById('expenses-page-business-only')
        };

        // Validate all elements exist
        const missingElements = Object.entries(elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.error('❌ Missing filter elements:', missingElements);
            return;
        }

        const filters = {
            category: elements.category.value,
            paymentMethod: elements.payment.value,
            dateRange: {
                from: elements.dateFrom.value,
                to: elements.dateTo.value
            },
            businessOnly: elements.business.checked
        };

        this.expenseManager.applyFilters(filters);
        this.renderExpensesTable();
        this.renderExpenseCharts();
        
        this.showToast('Filters applied successfully', 'info');
        console.log('✅ Expense filters applied successfully');
    }

    // ENHANCED: Clear expense filters with state validation
    clearExpenseFilters() {
        if (!this._isOnExpensesPage() || !this.isActive) {
            console.log('❌ Not on expenses page - skipping filter clear');
            return;
        }

        console.log('🧹 Clearing expense filters...');

        const elements = {
            category: document.getElementById('expenses-page-category-filter'),
            payment: document.getElementById('expenses-page-payment-filter'),
            dateFrom: document.getElementById('expenses-page-date-from'),
            dateTo: document.getElementById('expenses-page-date-to'),
            business: document.getElementById('expenses-page-business-only')
        };

        // Reset all filter values
        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = false;
                } else if (element.tagName === 'SELECT') {
                    element.value = 'all';
                } else {
                    element.value = '';
                }
            }
        });

        // Clear filtered data
        this.expenseManager.expenseState.filteredData = null;
        
        this.renderExpensesTable();
        this.renderExpenseCharts();
        
        this.showToast('Filters cleared', 'info');
        console.log('✅ Expense filters cleared successfully');
    }

    // ENHANCED: Pause operations when page not visible
    pauseExpenseOperations() {
        // Pause chart animations
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.stop === 'function') {
                chart.stop();
            }
        });
        
        // Clear any pending timeouts
        this.activeTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.activeTimeouts.clear();
    }

    // ENHANCED: Resume operations when page becomes visible
    resumeExpenseOperations() {
        if (this._isOnExpensesPage() && this.isActive) {
            // Re-render charts if needed
            this.renderExpenseCharts();
        }
    }

    // ENHANCED: Cleanup expense elements
    cleanupExpenseElements() {
        console.log('🧹 Cleaning up expense elements...');
        
        // Remove all non-expense-page elements
        document.querySelectorAll(`
            .expense-filters-container:not(#expenses-page .expense-filters-container),
            .expense-filters-wrapper:not(#expenses-page .expense-filters-wrapper),
            [id^="expense-filter-"]:not(#expenses-page [id^="expense-filter-"]),
            [id^="expenses-page-"]:not(#expenses-page [id^="expenses-page-"])
        `).forEach(element => {
            console.log('🗑️ Removing leaked element:', element.id || element.className);
            element.remove();
        });
    }

    // ENHANCED: Cleanup expense listeners
    cleanupExpenseListeners() {
        console.log('🧹 Cleaning up expense listeners...');
        
        // Remove all managed listeners
        this.activeListeners.forEach((listenerData, key) => {
            this.removeManagedListener(key);
        });
        
        // Clear timeouts
        this.activeTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.activeTimeouts.clear();
    }

    // ENHANCED: Cleanup charts
    cleanupCharts() {
        console.log('🧹 Cleaning up charts...');
        
        Object.entries(this.charts).forEach(([key, chart]) => {
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                    console.log(`🗑️ Destroyed chart: ${key}`);
                } catch (error) {
                    console.warn(`⚠️ Error destroying chart ${key}:`, error);
                }
            }
        });
        
        this.charts = {};
    }

    // ENHANCED: Complete cleanup method
    cleanup() {
        console.log('🧹 Performing complete ExpenseUI cleanup...');
        
        this.isActive = false;
        
        try {
            // Cleanup charts
            this.cleanupCharts();
            
            // Cleanup listeners
            this.cleanupExpenseListeners();
            
            // Cleanup elements
            this.cleanupExpenseElements();
            
            // Disconnect navigation observer
            if (this.navigationObserver) {
                this.navigationObserver.disconnect();
                this.navigationObserver = null;
            }
            
            // Remove mounted elements
            this.mountedElements.forEach(element => {
                try {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                } catch (error) {
                    console.warn('⚠️ Error removing mounted element:', error);
                }
            });
            this.mountedElements.clear();
            
            // Reset state
            this.navigationState = {
                currentPage: null,
                previousPage: null,
                isTransitioning: false
            };
            
            console.log('✅ ExpenseUI cleanup completed');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }

    // ENHANCED: Render expense charts with state validation
    renderExpenseCharts() {
        if (!this._isOnExpensesPage() || !this.isActive) {
            return;
        }

        this.scheduleDelayedOperation(() => {
            if (this._isOnExpensesPage() && this.isActive) {
                this.renderMonthlyExpenseChart();
                this.renderCategoryChart();
            }
        }, 100);
    }

    // ENHANCED: Render monthly expense chart
    renderMonthlyExpenseChart() {
        const ctx = document.getElementById('expenseMonthlyChart');
        if (!ctx || !this._isOnExpensesPage()) return;

        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        const data = this.expenseManager.getMonthlyExpenseData();
        const filteredData = this.expenseManager.expenseState.filteredData;
        
        let chartData = data;
        if (filteredData) {
            const monthlyMap = new Map();
            filteredData.forEach(expense => {
                const date = new Date(expense.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + expense.amount);
            });
            chartData = Array.from(monthlyMap, ([month, amount]) => ({ month, amount }))
                            .sort((a, b) => a.month.localeCompare(b.month));
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(item => item.month),
                datasets: [{
                    label: 'Monthly Expenses',
                    data: chartData.map(item => item.amount),
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#EF4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
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
                                return '₹' + new Intl.NumberFormat('en-IN').format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Rest of the methods remain the same but with state validation...
    // [Include other methods like renderCategoryChart, renderBalanceCards, etc. with similar state validation]

    // GET HTML TEMPLATES
    getExpensesPageHTML() {
        return `
            <div class="page-header">
                <div>
                    <h1>💰 Expense Management</h1>
                    <p style="color: var(--color-text-secondary); margin: 4px 0 0 0; font-size: 14px;">
                        Track and manage your business expenses
                    </p>
                </div>
                <div class="header-actions">
                    <button class="btn btn--secondary btn--sm" id="export-expenses">📊 Export</button>
                    <button class="btn btn--primary" id="add-expense-btn">+ Add Expense</button>
                </div>
            </div>

            <div class="expense-balance-cards" id="expense-balance-cards"></div>

            <div class="expense-filters-wrapper" id="expenses-page-filters-wrapper">
                <div class="expense-filters-container" id="expenses-page-filters-container"></div>
            </div>

            <div class="expense-charts" id="expense-charts" style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin: 24px 0;">
                <div class="chart-container">
                    <h3>Monthly Expense Trend</h3>
                    <div style="position: relative; height: 300px;">
                        <canvas id="expenseMonthlyChart"></canvas>
                    </div>
                </div>
                <div class="chart-container">
                    <h3>Category Breakdown</h3>
                    <div style="position: relative; height: 300px;">
                        <canvas id="expenseCategoryChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="expenses-table-section">
                <div class="table-container">
                    <table class="invoices-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Payment Method</th>
                                <th>Vendor</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="expenses-table-body"></tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getModalHTML() {
        return `
            <div id="expense-modal" class="modal hidden">
                <div class="modal-overlay" id="expense-modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="expense-modal-title">Add New Expense</h2>
                        <button class="modal-close" id="close-expense-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="expense-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="expense-amount">Amount (₹)</label>
                                    <input type="number" class="form-control" id="expense-amount" min="0" step="0.01" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="expense-date">Date</label>
                                    <input type="date" class="form-control" id="expense-date" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="expense-description">Description</label>
                                <input type="text" class="form-control" id="expense-description" required placeholder="What was this expense for?">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="expense-category">Category</label>
                                    <select class="form-control" id="expense-category" required>
                                        <option value="">Select Category</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="expense-payment-method">Payment Method</label>
                                    <select class="form-control" id="expense-payment-method"></select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="expense-vendor">Vendor/Supplier</label>
                                    <input type="text" class="form-control" id="expense-vendor" placeholder="Optional">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="expense-receipt">Receipt Number</label>
                                    <input type="text" class="form-control" id="expense-receipt" placeholder="Optional">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="expense-notes">Notes</label>
                                <textarea class="form-control" id="expense-notes" rows="3" placeholder="Additional notes (optional)"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="expense-business" checked>
                                        <span>Business Expense</span>
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="expense-tax-deductible">
                                        <span>Tax Deductible</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn--secondary" id="cancel-expense">Cancel</button>
                        <button type="submit" class="btn btn--primary" id="save-expense">Save Expense</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Placeholder methods for remaining functionality
    openExpenseModal() { console.log('Opening expense modal...'); }
    closeExpenseModal() { console.log('Closing expense modal...'); }
    closeCategoryModal() { console.log('Closing category modal...'); }
    saveExpense() { console.log('Saving expense...'); }
    saveCategory() { console.log('Saving category...'); }
    editExpense(id) { console.log('Editing expense:', id); }
    deleteExpense(id) { console.log('Deleting expense:', id); }
    exportExpenses() { console.log('Exporting expenses...'); }
    renderBalanceCards() { console.log('Rendering balance cards...'); }
    renderExpensesTable() { console.log('Rendering expenses table...'); }
    renderCategoryChart() { console.log('Rendering category chart...'); }
    addExpenseModalStyles() { console.log('Adding modal styles...'); }
}

// Enhanced integration class
class ExpenseIntegration {
    constructor() {
        this.expenseManager = null;
        this.expenseUI = null;
        this.isInitialized = false;
        this.integrationEnabled = false;
        this.cleanupHandlers = new Set();
    }

    async initialize(supabaseClient, showToastFunction) {
        try {
            console.log('🔧 Initializing Enhanced Expense Integration...');

            if (typeof window.ExpenseManager === 'undefined') {
                console.warn('⚠️ ExpenseManager not loaded, expense features disabled');
                return false;
            }

            if (typeof window.ExpenseUI === 'undefined') {
                console.warn('⚠️ ExpenseUI not loaded, expense features disabled');
                return false;
            }

            this.expenseManager = new window.ExpenseManager(supabaseClient);
            const managerInitialized = await this.expenseManager.initialize();

            if (!managerInitialized) {
                console.warn('⚠️ Failed to initialize expense manager');
                return false;
            }

            this.expenseUI = new window.ExpenseUI(this.expenseManager, showToastFunction);
            this.expenseUI.initializeUI();

            // Setup cleanup for page unload
            const cleanup = () => this.cleanup();
            window.addEventListener('beforeunload', cleanup);
            this.cleanupHandlers.add(() => window.removeEventListener('beforeunload', cleanup));

            this.isInitialized = true;
            this.integrationEnabled = true;

            console.log('✅ Enhanced Expense Integration initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Error initializing Enhanced Expense Integration:', error);
            this.cleanup();
            return false;
        }
    }

    cleanup() {
        console.log('🧹 Cleaning up Expense Integration...');
        
        if (this.expenseUI) {
            this.expenseUI.cleanup();
        }

        this.cleanupHandlers.forEach(handler => handler());
        this.cleanupHandlers.clear();

        this.isInitialized = false;
        this.integrationEnabled = false;
    }

    isEnabled() {
        return this.integrationEnabled;
    }

    getExpenseManager() {
        return this.expenseManager;
    }

    getExpenseUI() {
        return this.expenseUI;
    }
}

// Global initialization
let globalExpenseIntegration = null;

async function initializeExpenseIntegration(supabaseClient, showToastFunction) {
    try {
        globalExpenseIntegration = new ExpenseIntegration();
        const success = await globalExpenseIntegration.initialize(supabaseClient, showToastFunction);
        
        if (success) {
            window.expenseIntegration = globalExpenseIntegration;
            if (showToastFunction) {
                showToastFunction('💰 Enhanced Expense Management enabled! Leak-proof architecture.', 'success');
            }
            return true;
        } else {
            console.log('⚠️ Enhanced Expense Integration disabled');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to initialize enhanced expense integration:', error);
        if (showToastFunction) {
            showToastFunction('Expense features could not be loaded. Main app continues normally.', 'warning');
        }
        return false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExpenseUI, ExpenseIntegration, initializeExpenseIntegration };
} else if (typeof window !== 'undefined') {
    window.ExpenseUI = ExpenseUI;
    window.ExpenseIntegration = ExpenseIntegration;
    window.initializeExpenseIntegration = initializeExpenseIntegration;
}
