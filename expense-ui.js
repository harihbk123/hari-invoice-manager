// EXPENSE MANAGEMENT UI COMPONENTS - expense-ui.js
// UI rendering and interaction logic for expense management

class ExpenseUI {
    constructor(expenseManager, showToast) {
        this.expenseManager = expenseManager;
        this.showToast = showToast || console.log;
        this.charts = {};
    }

    // Initialize UI components and event listeners
    initializeUI() {
        try {
            this.setupExpenseNavigation();
            this.setupExpenseModals();
            this.setupExpenseForms();
            this.setupExpenseFilters();
            console.log('Expense UI initialized successfully');
        } catch (error) {
            console.error('Error initializing Expense UI:', error);
        }
    }

    // Setup navigation for expenses page
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
            // Insert before analytics
            const analyticsItem = sidebarNav.querySelector('[data-page="analytics"]')?.parentElement;
            if (analyticsItem) {
                sidebarNav.insertBefore(expenseNavItem, analyticsItem);
            } else {
                sidebarNav.appendChild(expenseNavItem);
            }

            // Add click handler
            expenseNavItem.querySelector('.nav-link').addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToExpenses();
            });
        }

        // Add expenses page to main content if not exists
        const mainContent = document.querySelector('.main-content');
        if (mainContent && !document.getElementById('expenses-page')) {
            const expensesPage = document.createElement('div');
            expensesPage.id = 'expenses-page';
            expensesPage.className = 'page';
            expensesPage.innerHTML = this.getExpensesPageHTML();
            mainContent.appendChild(expensesPage);
        }
    }

    // Navigate to expenses page
   // Navigate to expenses page
    navigateToExpenses() {
        console.log('🏠 Navigating to expenses page...');
        
        // FIXED: First cleanup any leaked elements
        this.aggressiveCleanup();
        
        // Remove active class from all nav links and pages
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // Activate expenses nav and page
        const expensesNavLink = document.querySelector('[data-page="expenses"]');
        const expensesPage = document.getElementById('expenses-page');
        
        if (expensesNavLink) expensesNavLink.classList.add('active');
        if (expensesPage) {
            expensesPage.classList.add('active');
            console.log('✅ Expenses page activated');
        } else {
            console.error('❌ Expenses page not found in DOM');
            return;
        }

        // FIXED: Wait for page to be fully active before rendering
        setTimeout(() => {
            // Verify we're still on the expenses page before rendering
            const currentPage = document.querySelector('.page.active');
            if (currentPage && currentPage.id === 'expenses-page') {
                console.log('🎨 Rendering expenses content...');
                this.renderExpenses();
            } else {
                console.log('⚠️ Page changed during navigation - skipping render');
            }
        }, 100);
    }
   // Aggressive cleanup of expense elements from other pages
    aggressiveCleanup() {
        console.log('🧹 Starting aggressive cleanup of expense elements...');
        
        try {
            // FIXED: Clean up expense filter listeners first
            this.cleanupExpenseFilterListeners();
            
            // Remove ALL expense-related elements from non-expense pages
            const nonExpensePages = document.querySelectorAll('.page:not(#expenses-page)');
            
            nonExpensePages.forEach(page => {
                // Remove expense filters with more specific selectors
                page.querySelectorAll(`
                    .expense-filters-container, 
                    .expense-filters-wrapper, 
                    [id*="expense-filter"],
                    [id^="expenses-page-"],
                    #expenses-page-filters-wrapper,
                    #expenses-page-filters-container
                `).forEach(el => {
                    console.log('🗑️ Removing leaked element:', el.className || el.id);
                    el.remove();
                });
                
                // Remove expense charts
                page.querySelectorAll(`
                    [id*="expense"], 
                    [id*="Expense"],
                    #expenseMonthlyChart,
                    #expenseCategoryChart,
                    .expense-charts
                `).forEach(el => {
                    if (!el.closest('#expenses-page')) {
                        console.log('🗑️ Removing leaked expense element:', el.id);
                        el.remove();
                    }
                });
                
                // Remove expense balance cards (except from dashboard)
                if (!page.id.includes('dashboard')) {
                    page.querySelectorAll(`
                        .expense-balance-grid, 
                        .expense-balance-cards,
                        #expense-balance-cards
                    `).forEach(el => {
                        console.log('🗑️ Removing leaked balance element');
                        el.remove();
                    });
                }
            });

            // Remove any orphaned expense elements with specific selectors
            document.querySelectorAll(`
                [id^="expense-filter-"]:not(#expenses-page [id^="expense-filter-"]),
                [id^="expenses-page-"]:not(#expenses-page [id^="expenses-page-"]),
                .expense-filters-container:not(#expenses-page .expense-filters-container),
                .expense-filters-wrapper:not(#expenses-page .expense-filters-wrapper),
                #expenses-page-filters-wrapper:not(#expenses-page #expenses-page-filters-wrapper),
                #expenses-page-filters-container:not(#expenses-page #expenses-page-filters-container)
            `).forEach(el => {
                console.log('🗑️ Removing orphaned expense element:', el.id || el.className);
                el.remove();
            });

            console.log('✅ Aggressive cleanup completed');
            
        } catch (error) {
            console.error('❌ Error during aggressive cleanup:', error);
        }
    }
    // Get expenses page HTML template
    getExpensesPageHTML() {
        return `
            <!-- Expenses Page Header -->
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

            <!-- Balance Overview Cards -->
            <div class="expense-balance-cards" id="expense-balance-cards">
                <!-- Balance cards will be populated by JavaScript -->
            </div>

            <!-- Expense Filters - UNIQUE TO EXPENSES PAGE ONLY -->
            <div class="expense-filters-wrapper" id="expenses-page-filters-wrapper">
                <div class="expense-filters-container" id="expenses-page-filters-container">
                    <!-- Filters will be populated by JavaScript ONLY when on expenses page -->
                </div>
            </div>

            <!-- Expense Analytics Charts -->
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

            <!-- Expenses Table -->
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
                        <tbody id="expenses-table-body">
                            <!-- Expenses will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Setup expense modals
    setupExpenseModals() {
        // Check if modals already exist
        if (document.getElementById('expense-modal')) return;

        const modalHTML = `
            <!-- Add/Edit Expense Modal -->
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
                                        <!-- Categories populated by JavaScript -->
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="expense-payment-method">Payment Method</label>
                                    <select class="form-control" id="expense-payment-method">
                                        <!-- Payment methods populated by JavaScript -->
                                    </select>
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

            <!-- Add Category Modal -->
            <div id="category-modal" class="modal hidden">
                <div class="modal-overlay" id="category-modal-overlay"></div>
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Add New Category</h2>
                        <button class="modal-close" id="close-category-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="category-form">
                            <div class="form-group">
                                <label class="form-label" for="category-name">Category Name</label>
                                <input type="text" class="form-control" id="category-name" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="category-description">Description</label>
                                <textarea class="form-control" id="category-description" rows="2" placeholder="Optional"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="category-icon">Icon</label>
                                    <select class="form-control" id="category-icon">
                                        <option value="💰">💰 Money</option>
                                        <option value="🏢">🏢 Office</option>
                                        <option value="🚗">🚗 Transport</option>
                                        <option value="💻">💻 Technology</option>
                                        <option value="📱">📱 Communication</option>
                                        <option value="🍽️">🍽️ Food</option>
                                        <option value="⚡">⚡ Utilities</option>
                                        <option value="📚">📚 Education</option>
                                        <option value="🏥">🏥 Healthcare</option>
                                        <option value="📎">📎 Miscellaneous</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="category-color">Color</label>
                                    <input type="color" class="form-control" id="category-color" value="#6B7280">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn--secondary" onclick="this.closest('.modal').classList.add('hidden')">Cancel</button>
                        <button type="submit" class="btn btn--primary" id="save-category">Add Category</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add modal styles
        this.addExpenseModalStyles();
    }

    // Setup expense forms and event listeners
    setupExpenseForms() {
        // Add expense button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-expense-btn') {
                this.openExpenseModal();
            } else if (e.target.id === 'export-expenses') {
                this.exportExpenses();
            } else if (e.target.classList.contains('edit-expense-btn')) {
                const expenseId = e.target.getAttribute('data-expense-id');
                this.editExpense(expenseId);
            } else if (e.target.classList.contains('delete-expense-btn')) {
                const expenseId = e.target.getAttribute('data-expense-id');
                this.deleteExpense(expenseId);
            }
        });

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.id === 'expense-modal-overlay' || e.target.id === 'close-expense-modal' || e.target.id === 'cancel-expense') {
                this.closeExpenseModal();
            } else if (e.target.id === 'category-modal-overlay' || e.target.id === 'close-category-modal') {
                this.closeCategoryModal();
            }
        });

        // Form submission handlers
        document.addEventListener('click', (e) => {
            if (e.target.id === 'save-expense') {
                e.preventDefault();
                this.saveExpense();
            } else if (e.target.id === 'save-category') {
                e.preventDefault();
                this.saveCategory();
            }
        });

        // Category selection handler - show "Add New Category" option
        document.addEventListener('change', (e) => {
            if (e.target.id === 'expense-category' && e.target.value === 'add-new') {
                this.openCategoryModal();
            }
        });
    }

    // Setup expense filters
    setupExpenseFilters() {
        // Filters will be set up when expenses page is rendered
    }

    // Open expense modal
    openExpenseModal(expenseId = null) {
        const modal = document.getElementById('expense-modal');
        if (!modal) return;

        modal.classList.remove('hidden');
        this.expenseManager.editingExpenseId = expenseId;

        // Populate categories and payment methods
        this.populateExpenseFormSelects();

        if (expenseId) {
            // Edit mode
            document.getElementById('expense-modal-title').textContent = 'Edit Expense';
            document.getElementById('save-expense').textContent = 'Update Expense';
            this.populateExpenseForm(expenseId);
        } else {
            // Add mode
            document.getElementById('expense-modal-title').textContent = 'Add New Expense';
            document.getElementById('save-expense').textContent = 'Save Expense';
            document.getElementById('expense-form').reset();
            document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('expense-business').checked = true;
        }
    }

    // Close expense modal
    closeExpenseModal() {
        const modal = document.getElementById('expense-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.expenseManager.editingExpenseId = null;
        }
    }

    // Open category modal
    openCategoryModal() {
        const modal = document.getElementById('category-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('category-form').reset();
        }
    }

    // Close category modal
    closeCategoryModal() {
        const modal = document.getElementById('category-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Populate expense form selects
    populateExpenseFormSelects() {
        // Populate categories
        const categorySelect = document.getElementById('expense-category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            
            this.expenseManager.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.icon} ${category.name}`;
                categorySelect.appendChild(option);
            });

            // Add "Add New Category" option
            const addNewOption = document.createElement('option');
            addNewOption.value = 'add-new';
            addNewOption.textContent = '+ Add New Category';
            addNewOption.style.color = 'var(--color-primary)';
            categorySelect.appendChild(addNewOption);
        }

        // Populate payment methods
        const paymentSelect = document.getElementById('expense-payment-method');
        if (paymentSelect) {
            paymentSelect.innerHTML = '';
            
            this.expenseManager.getPaymentMethods().forEach(method => {
                const option = document.createElement('option');
                option.value = method.value;
                option.textContent = `${method.icon} ${method.label}`;
                paymentSelect.appendChild(option);
            });
        }
    }

    // Populate expense form for editing
    populateExpenseForm(expenseId) {
        const expense = this.expenseManager.expenses.find(exp => exp.id === expenseId);
        if (!expense) return;

        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-description').value = expense.description;
        document.getElementById('expense-category').value = expense.categoryId || '';
        document.getElementById('expense-payment-method').value = expense.paymentMethod;
        document.getElementById('expense-vendor').value = expense.vendorName;
        document.getElementById('expense-receipt').value = expense.receiptNumber;
        document.getElementById('expense-notes').value = expense.notes;
        document.getElementById('expense-business').checked = expense.isBusinessExpense;
        document.getElementById('expense-tax-deductible').checked = expense.taxDeductible;
    }

    // Save expense
    async saveExpense() {
        try {
            const form = document.getElementById('expense-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const expenseData = {
                amount: parseFloat(document.getElementById('expense-amount').value),
                date: document.getElementById('expense-date').value,
                description: document.getElementById('expense-description').value,
                categoryId: document.getElementById('expense-category').value,
                paymentMethod: document.getElementById('expense-payment-method').value,
                vendorName: document.getElementById('expense-vendor').value,
                receiptNumber: document.getElementById('expense-receipt').value,
                notes: document.getElementById('expense-notes').value,
                isBusinessExpense: document.getElementById('expense-business').checked,
                taxDeductible: document.getElementById('expense-tax-deductible').checked
            };

            await this.expenseManager.saveExpense(expenseData);
            
            this.closeExpenseModal();
            this.renderExpenses();
            
            const action = this.expenseManager.editingExpenseId ? 'updated' : 'added';
            this.showToast(`Expense ${action} successfully`, 'success');

        } catch (error) {
            console.error('Error saving expense:', error);
            this.showToast(`Error saving expense: ${error.message}`, 'error');
        }
    }

    // Save category
    async saveCategory() {
        try {
            const categoryData = {
                name: document.getElementById('category-name').value.trim(),
                description: document.getElementById('category-description').value.trim(),
                icon: document.getElementById('category-icon').value,
                color: document.getElementById('category-color').value
            };

            if (!categoryData.name) {
                this.showToast('Category name is required', 'error');
                return;
            }

            await this.expenseManager.addCategory(categoryData);
            
            this.closeCategoryModal();
            this.populateExpenseFormSelects();
            this.showToast('Category added successfully', 'success');

        } catch (error) {
            console.error('Error saving category:', error);
            this.showToast(`Error saving category: ${error.message}`, 'error');
        }
    }

    // Edit expense
    editExpense(expenseId) {
        this.openExpenseModal(expenseId);
    }

    // Delete expense
    async deleteExpense(expenseId) {
        const expense = this.expenseManager.expenses.find(exp => exp.id === expenseId);
        if (!expense) return;

        const confirmed = confirm(`Are you sure you want to delete this expense?\n\n${expense.description} - ${this.expenseManager.formatCurrency(expense.amount)}\n\nThis action cannot be undone.`);
        if (!confirmed) return;

        try {
            await this.expenseManager.deleteExpense(expenseId);
            this.renderExpenses();
            this.showToast('Expense deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showToast(`Error deleting expense: ${error.message}`, 'error');
        }
    }

    // Render expenses page
    renderExpenses() {
        if (!this.expenseManager.isInitialized) {
            console.log('Expense manager not initialized yet');
            return;
        }

        this.renderBalanceCards();
        this.renderExpenseFilters();
        this.renderExpenseCharts();
        this.renderExpensesTable();
    }

    // Render balance cards
    renderBalanceCards() {
        const container = document.getElementById('expense-balance-cards');
        if (!container) return;

        const balance = this.expenseManager.balanceSummary;
        const analytics = this.expenseManager.getExpenseAnalytics();

        container.innerHTML = `
            <div class="expense-balance-grid">
                <div class="balance-card earnings">
                    <div class="balance-card-icon">💰</div>
                    <div class="balance-card-content">
                        <div class="balance-card-label">Total Earnings</div>
                        <div class="balance-card-value">${this.expenseManager.formatCurrency(balance.totalEarnings)}</div>
                    </div>
                </div>
                <div class="balance-card expenses">
                    <div class="balance-card-icon">💸</div>
                    <div class="balance-card-content">
                        <div class="balance-card-label">Total Expenses</div>
                        <div class="balance-card-value">${this.expenseManager.formatCurrency(balance.totalExpenses)}</div>
                    </div>
                </div>
                <div class="balance-card balance ${balance.currentBalance >= 0 ? 'positive' : 'negative'}">
                    <div class="balance-card-icon">${balance.currentBalance >= 0 ? '📈' : '📉'}</div>
                    <div class="balance-card-content">
                        <div class="balance-card-label">Current Balance</div>
                        <div class="balance-card-value">${this.expenseManager.formatCurrency(balance.currentBalance)}</div>
                    </div>
                </div>
                <div class="balance-card insights">
                    <div class="balance-card-icon">📊</div>
                    <div class="balance-card-content">
                        <div class="balance-card-label">Top Category</div>
                        <div class="balance-card-value" style="font-size: 14px;">${analytics.topCategory.name}</div>
                        <div class="balance-card-subtitle">${this.expenseManager.formatCurrency(analytics.topCategory.amount)}</div>
                    </div>
                </div>
            </div>
        `;

        // Add balance card styles if not already added
        this.addBalanceCardStyles();
    }

    // Render expense filters
   // Render expense filters
    renderExpenseFilters() {
        console.log('🔍 Starting expense filter render...');
        
        // CRITICAL: Only render filters if we're actually on the expenses page
        const expensesPage = document.getElementById('expenses-page');
        const currentActivePage = document.querySelector('.page.active');
        
        if (!expensesPage || !expensesPage.classList.contains('active')) {
            console.log('❌ Not on expenses page - aborting filter render');
            return;
        }
        
        if (!currentActivePage || currentActivePage.id !== 'expenses-page') {
            console.log('❌ Active page is not expenses page - aborting filter render');
            return;
        }

        console.log('✅ Confirmed on expenses page - proceeding with filter render');

        // FIXED: Use more specific container targeting
        const container = expensesPage.querySelector('#expenses-page-filters-container');
        if (!container) {
            console.error('❌ Expense filter container not found on expenses page');
            return;
        }

        // Clear any existing filters first to prevent duplicates
        container.innerHTML = '';

        const categories = this.expenseManager.categories;
        const paymentMethods = this.expenseManager.getPaymentMethods();

        // FIXED: Create filters with expense-page-specific IDs
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

     // FIXED: Setup expense filter listeners with proper scoping
    setupExpenseFilterListeners() {
        // Only setup listeners if we're on the expenses page
        const expensesPage = document.getElementById('expenses-page');
        if (!expensesPage || !expensesPage.classList.contains('active')) {
            console.log('❌ Not on expenses page - skipping filter listener setup');
            return;
        }

       // FIXED: Cleanup expense filter listeners
    cleanupExpenseFilterListeners() {
        if (!this._expenseFilterListenersActive) {
            return; // No listeners to clean up
        }

        console.log('🧹 Cleaning up expense filter listeners...');

        // Remove specific event listeners using stored references
        const applyBtn = document.getElementById('expenses-page-apply-filters');
        const clearBtn = document.getElementById('expenses-page-clear-filters');
        
        if (applyBtn && this._applyFiltersHandler) {
            applyBtn.removeEventListener('click', this._applyFiltersHandler);
            this._applyFiltersHandler = null;
            console.log('✅ Apply filters listener removed');
        }
        
        if (clearBtn && this._clearFiltersHandler) {
            clearBtn.removeEventListener('click', this._clearFiltersHandler);
            this._clearFiltersHandler = null;
            console.log('✅ Clear filters listener removed');
        }

        // Mark listeners as inactive
        this._expenseFilterListenersActive = false;
        console.log('✅ Expense filter listeners cleanup complete');
    }

        // FIXED: Use expense-page-specific selectors and store references for cleanup
        const applyBtn = document.getElementById('expenses-page-apply-filters');
        const clearBtn = document.getElementById('expenses-page-clear-filters');
        
        if (applyBtn) {
            // Store the bound function for later cleanup
            this._applyFiltersHandler = () => {
                console.log('🔍 Apply filters clicked');
                this.applyExpenseFilters();
            };
            applyBtn.addEventListener('click', this._applyFiltersHandler);
            console.log('✅ Apply filters listener added');
        } else {
            console.warn('⚠️ Apply filters button not found');
        }
        
        if (clearBtn) {
            // Store the bound function for later cleanup
            this._clearFiltersHandler = () => {
                console.log('🧹 Clear filters clicked');
                this.clearExpenseFilters();
            };
            clearBtn.addEventListener('click', this._clearFiltersHandler);
            console.log('✅ Clear filters listener added');
        } else {
            console.warn('⚠️ Clear filters button not found');
        }

        // Mark listeners as active
        this._expenseFilterListenersActive = true;
        console.log('✅ Expense filter listeners setup complete');
    }
// Apply expense filters
    applyExpenseFilters() {
        // FIXED: Only apply filters if we're on the expenses page
        const expensesPage = document.getElementById('expenses-page');
        if (!expensesPage || !expensesPage.classList.contains('active')) {
            console.log('❌ Not on expenses page - skipping filter application');
            return;
        }

        console.log('🔍 Applying expense filters...');

        // FIXED: Use expense-page-specific selectors
        const categorySelect = document.getElementById('expenses-page-category-filter');
        const paymentSelect = document.getElementById('expenses-page-payment-filter');
        const dateFromInput = document.getElementById('expenses-page-date-from');
        const dateToInput = document.getElementById('expenses-page-date-to');
        const businessCheckbox = document.getElementById('expenses-page-business-only');

        // Validate all elements exist
        if (!categorySelect || !paymentSelect || !dateFromInput || !dateToInput || !businessCheckbox) {
            console.error('❌ Some filter elements not found - cannot apply filters');
            return;
        }

        const filters = {
            category: categorySelect.value,
            paymentMethod: paymentSelect.value,
            dateRange: {
                from: dateFromInput.value,
                to: dateToInput.value
            },
            businessOnly: businessCheckbox.checked
        };

        console.log('🔍 Filter values:', filters);

        // Apply filters through expense manager
        this.expenseManager.applyFilters(filters);
        
        // Re-render table and charts with filtered data
        this.renderExpensesTable();
        this.renderExpenseCharts();
        
        this.showToast('Filters applied successfully', 'info');
        console.log('✅ Expense filters applied successfully');
    }

    // Clear expense filters
   // Clear expense filters
    clearExpenseFilters() {
        // FIXED: Only clear filters if we're on the expenses page
        const expensesPage = document.getElementById('expenses-page');
        if (!expensesPage || !expensesPage.classList.contains('active')) {
            console.log('❌ Not on expenses page - skipping filter clear');
            return;
        }

        console.log('🧹 Clearing expense filters...');

        // FIXED: Use expense-page-specific selectors
        const categorySelect = document.getElementById('expenses-page-category-filter');
        const paymentSelect = document.getElementById('expenses-page-payment-filter');
        const dateFromInput = document.getElementById('expenses-page-date-from');
        const dateToInput = document.getElementById('expenses-page-date-to');
        const businessCheckbox = document.getElementById('expenses-page-business-only');

        // Reset all filter values
        if (categorySelect) categorySelect.value = 'all';
        if (paymentSelect) paymentSelect.value = 'all';
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
        if (businessCheckbox) businessCheckbox.checked = false;

        // Clear filtered data in expense manager
        this.expenseManager.expenseState.filteredData = null;
        
        // Re-render table and charts with unfiltered data
        this.renderExpensesTable();
        this.renderExpenseCharts();
        
        this.showToast('Filters cleared', 'info');
        console.log('✅ Expense filters cleared successfully');
    }
    // Render expense charts
    renderExpenseCharts() {
        setTimeout(() => {
            this.renderMonthlyExpenseChart();
            this.renderCategoryChart();
        }, 100);
    }

    // Render monthly expense chart
    renderMonthlyExpenseChart() {
        const ctx = document.getElementById('expenseMonthlyChart');
        if (!ctx) return;

        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        const data = this.expenseManager.getMonthlyExpenseData();
        const filteredData = this.expenseManager.expenseState.filteredData;
        
        let chartData = data;
        if (filteredData) {
            // Calculate monthly data for filtered expenses
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
                    legend: {
                        display: false
                    }
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

    // Render category chart
    renderCategoryChart() {
        const ctx = document.getElementById('expenseCategoryChart');
        if (!ctx) return;

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const categoryData = this.expenseManager.getCategoryBreakdown();
        const filteredData = this.expenseManager.expenseState.filteredData;
        
        let chartData = categoryData;
        if (filteredData) {
            // Calculate category data for filtered expenses
            const categoryMap = new Map();
            filteredData.forEach(expense => {
                const categoryName = expense.categoryName || 'Uncategorized';
                const category = this.expenseManager.categories.find(cat => cat.name === categoryName);
                
                if (!categoryMap.has(categoryName)) {
                    categoryMap.set(categoryName, {
                        name: categoryName,
                        amount: 0,
                        color: category?.color || '#6B7280'
                    });
                }
                categoryMap.get(categoryName).amount += expense.amount;
            });
            chartData = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
        }

        if (chartData.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.map(item => item.name),
                datasets: [{
                    data: chartData.map(item => item.amount),
                    backgroundColor: chartData.map(item => item.color),
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
                            usePointStyle: true,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ₹${new Intl.NumberFormat('en-IN').format(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Render expenses table
    renderExpensesTable() {
        const tbody = document.getElementById('expenses-table-body');
        if (!tbody) return;

        const expenses = this.expenseManager.expenseState.filteredData || this.expenseManager.expenses;

        if (expenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--color-text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">💸</div>
                        <h3>No expenses found</h3>
                        <p>Add your first expense to get started</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = expenses.map(expense => {
            const category = this.expenseManager.categories.find(cat => cat.id === expense.categoryId);
            const paymentMethod = this.expenseManager.getPaymentMethods().find(method => method.value === expense.paymentMethod);

            return `
                <tr>
                    <td>${this.expenseManager.formatDate(expense.date)}</td>
                    <td>
                        <div style="font-weight: 500;">${expense.description}</div>
                        ${expense.vendorName ? `<div style="font-size: 12px; color: var(--color-text-secondary);">Vendor: ${expense.vendorName}</div>` : ''}
                    </td>
                    <td>
                        <span style="display: inline-flex; align-items: center; gap: 6px;">
                            ${category ? category.icon : '💰'} ${expense.categoryName}
                        </span>
                    </td>
                    <td style="font-weight: 600; color: var(--color-error);">
                        ${this.expenseManager.formatCurrency(expense.amount)}
                    </td>
                    <td>
                        <span style="display: inline-flex; align-items: center; gap: 6px;">
                            ${paymentMethod ? paymentMethod.icon : '💳'} ${paymentMethod ? paymentMethod.label : expense.paymentMethod}
                        </span>
                    </td>
                    <td>${expense.vendorName || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit edit-expense-btn" data-expense-id="${expense.id}" title="Edit expense">✏️</button>
                            <button class="action-btn delete delete-expense-btn" data-expense-id="${expense.id}" title="Delete expense">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Export expenses
    exportExpenses() {
        try {
            this.expenseManager.exportToCSV();
            this.showToast('Expenses exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting expenses:', error);
            this.showToast('Error exporting expenses', 'error');
        }
    }

    // Add balance card styles
    addBalanceCardStyles() {
        if (document.getElementById('expense-balance-styles')) return;

        const style = document.createElement('style');
        style.id = 'expense-balance-styles';
        style.textContent = `
            .expense-balance-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
            }

            .balance-card {
                background: var(--color-surface);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid var(--color-border);
                box-shadow: var(--shadow-sm);
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.2s ease;
            }

            .balance-card:hover {
                box-shadow: var(--shadow-md);
                transform: translateY(-1px);
            }

            .balance-card-icon {
                font-size: 32px;
                width: 56px;
                height: 56px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .balance-card.earnings .balance-card-icon {
                background: rgba(var(--color-success-rgb), 0.1);
            }

            .balance-card.expenses .balance-card-icon {
                background: rgba(var(--color-error-rgb), 0.1);
            }

            .balance-card.balance.positive .balance-card-icon {
                background: rgba(var(--color-success-rgb), 0.1);
            }

            .balance-card.balance.negative .balance-card-icon {
                background: rgba(var(--color-error-rgb), 0.1);
            }

            .balance-card.insights .balance-card-icon {
                background: rgba(var(--color-primary-rgb, 33, 128, 141), 0.1);
            }

            .balance-card-content {
                flex: 1;
            }

            .balance-card-label {
                font-size: 12px;
                color: var(--color-text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .balance-card-value {
                font-size: 20px;
                font-weight: 700;
                color: var(--color-text);
                margin-bottom: 2px;
            }

            .balance-card.balance.negative .balance-card-value {
                color: var(--color-error);
            }

            .balance-card-subtitle {
                font-size: 11px;
                color: var(--color-text-secondary);
            }
        `;
        document.head.appendChild(style);
    }

    // Add expense modal styles
    addExpenseModalStyles() {
        if (document.getElementById('expense-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'expense-modal-styles';
        style.textContent = `
            .expense-filters-container {
                background: var(--color-surface);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid var(--color-border);
                margin-bottom: 24px;
            }

            .filters-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                align-items: end;
            }

            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .filter-label {
                font-size: 12px;
                font-weight: 600;
                color: var(--color-text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .filter-select {
                font-size: 13px;
                padding: 8px 12px;
            }

            .date-range-inputs {
                display: flex;
                gap: 8px;
            }

            .date-range-inputs input {
                flex: 1;
                font-size: 13px;
                padding: 8px 12px;
            }

            .filter-checkboxes {
                display: flex;
                align-items: center;
                padding: 8px 0;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: var(--color-text);
                cursor: pointer;
            }

            .checkbox-label input[type="checkbox"] {
                width: 16px;
                height: 16px;
                accent-color: var(--color-primary);
            }

            @media (max-width: 768px) {
                .filters-row {
                    grid-template-columns: 1fr;
                }
                
                .expense-balance-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpenseUI;
} else if (typeof window !== 'undefined') {
    window.ExpenseUI = ExpenseUI;
}
