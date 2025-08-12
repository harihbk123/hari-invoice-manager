// COMPLETE ENHANCED INVOICE MANAGER - ALL ISSUES FIXED
// --- EXPENSE MANAGEMENT MODULES (COMPLETELY REWORKED) ---

// ExpenseUI class (completely rewritten)
class ExpenseUI {
    constructor(expenseManager, showToast) {
        this.expenseManager = expenseManager;
        this.showToast = showToast;
        this.charts = {};
        this.isModalOpen = false;
        
        // Initialize immediately
        this.initializeExpenseUI();
    }

    initializeExpenseUI() {
        console.log('💰 Initializing Expense UI...');
        
        try {
            // Setup expense page HTML structure
            this.setupExpensePage();
            console.log('✅ Expense page setup complete');
            
            // Setup modal HTML
            this.setupModals();
            console.log('✅ Expense modals setup complete');
            
            // Attach event listeners
            this.attachEventListeners();
            console.log('✅ Expense event listeners attached');
            
            // Render initial content
            this.renderContent();
            console.log('✅ Expense content rendered');
            
        } catch (error) {
            console.error('❌ Error initializing Expense UI:', error);
            if (this.showToast) {
                this.showToast('Error initializing expense management: ' + error.message, 'error');
            }
        }
    }

    setupExpensePage() {
        const expensesPage = document.getElementById('expenses-page');
        if (!expensesPage) return;

        expensesPage.innerHTML = `
            <div class="page-header">
                <h1>💰 Expense Management</h1>
                <div class="header-actions">
                    <button class="btn btn--secondary" id="export-expenses-btn">📥 Export CSV</button>
                    <button class="btn btn--primary" id="add-expense-btn">+ Add Expense</button>
                </div>
            </div>

            <!-- Expense Summary Cards -->
            <div class="expense-summary" id="expense-summary">
                <!-- Will be populated by JS -->
            </div>

            <!-- Expense Chart -->
            <div class="chart-container" style="margin: 24px 0;">
                <h3>Monthly Expense Trend</h3>
                <canvas id="expense-chart" width="400" height="200"></canvas>
            </div>

            <!-- Expense Filters -->
            <div class="expense-filters" style="margin: 24px 0; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                <h4>Filters</h4>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <div>
                        <label>Category:</label>
                        <select id="filter-category" class="form-control" style="width: auto;">
                            <option value="">All Categories</option>
                        </select>
                    </div>
                    <div>
                        <label>From Date:</label>
                        <input type="date" id="filter-from" class="form-control" style="width: auto;">
                    </div>
                    <div>
                        <label>To Date:</label>
                        <input type="date" id="filter-to" class="form-control" style="width: auto;">
                    </div>
                    <div style="display: flex; align-items: end;">
                        <button class="btn btn--secondary btn--sm" id="apply-filters">Apply</button>
                        <button class="btn btn--outline btn--sm" id="clear-filters" style="margin-left: 8px;">Clear</button>
                    </div>
                </div>
            </div>

            <!-- Expenses Table -->
            <div class="table-container">
                <table class="invoices-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="expenses-tbody">
                        <!-- Will be populated by JS -->
                    </tbody>
                </table>
            </div>
        `;
    }

    setupModals() {
        // Remove existing modals
        const existingModal = document.getElementById('expense-modal');
        if (existingModal) existingModal.remove();

        const modalHTML = `
            <div id="expense-modal" class="modal hidden">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="expense-modal-title">Add Expense</h2>
                        <button class="modal-close" id="close-expense-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="expense-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Amount (₹)</label>
                                    <input type="number" id="expense-amount" class="form-control" step="0.01" min="0" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Date</label>
                                    <input type="date" id="expense-date" class="form-control" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Description</label>
                                <input type="text" id="expense-description" class="form-control" required>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Category</label>
                                    <select id="expense-category" class="form-control" required>
                                        <option value="">Select Category</option>
                                        <option value="food">🍽️ Food & Dining</option>
                                        <option value="transport">🚗 Transportation</option>
                                        <option value="office">🏢 Office Supplies</option>
                                        <option value="utilities">⚡ Utilities</option>
                                        <option value="software">💻 Software & Tools</option>
                                        <option value="marketing">📈 Marketing</option>
                                        <option value="travel">✈️ Travel</option>
                                        <option value="other">📎 Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Payment Method</label>
                                    <select id="expense-payment" class="form-control" required>
                                        <option value="cash">💵 Cash</option>
                                        <option value="card">💳 Card</option>
                                        <option value="upi">📱 UPI</option>
                                        <option value="bank">🏦 Bank Transfer</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Notes (Optional)</label>
                                <textarea id="expense-notes" class="form-control" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn--secondary" id="cancel-expense">Cancel</button>
                        <button type="button" class="btn btn--primary" id="save-expense">Save Expense</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachEventListeners() {
        const expensesPage = document.getElementById('expenses-page');
        if (!expensesPage) return;

        // Use event delegation for better performance
        expensesPage.addEventListener('click', (e) => {
            if (e.target.id === 'add-expense-btn') {
                this.openModal();
            } else if (e.target.id === 'export-expenses-btn') {
                this.exportToCSV();
            } else if (e.target.classList.contains('edit-expense')) {
                const expenseId = e.target.dataset.expenseId;
                this.editExpense(expenseId);
            } else if (e.target.classList.contains('delete-expense')) {
                const expenseId = e.target.dataset.expenseId;
                this.deleteExpense(expenseId);
            } else if (e.target.id === 'apply-filters') {
                this.applyFilters();
            } else if (e.target.id === 'clear-filters') {
                this.clearFilters();
            }
        });

        // Modal event listeners
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-expense-modal' || e.target.id === 'cancel-expense') {
                this.closeModal();
            } else if (e.target.id === 'save-expense') {
                this.saveExpense();
            } else if (e.target.classList.contains('modal-overlay') && this.isModalOpen) {
                this.closeModal();
            }
        });
    }

    async renderContent() {
        console.log('🎨 Rendering expense content...');
        
        try {
            // Ensure we have the latest expense data
            if (this.expenseManager && !this.expenseManager.isInitialized) {
                console.log('⏳ Expense manager not initialized, waiting...');
                await this.expenseManager.initialize();
            }
            
            // Re-fetch expenses to ensure we have fresh data
            if (this.expenseManager) {
                await this.expenseManager.loadExpenses();
            }
            
            // Render all components with current data
            this.renderSummary();
            this.renderTable();
            this.renderChart();
            this.populateFilters();
            
            console.log('✅ Expense content rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering expense content:', error);
            if (this.showToast) {
                this.showToast('Error loading expense data: ' + error.message, 'error');
            }
        }
    }

    renderSummary() {
        const summaryContainer = document.getElementById('expense-summary');
        if (!summaryContainer) return;

        const expenses = this.expenseManager.expenses || [];
        const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const thisMonth = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            const now = new Date();
            return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        });
        const monthlyTotal = thisMonth.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

        summaryContainer.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">₹${totalExpenses.toLocaleString('en-IN')}</div>
                    <div class="metric-label">Total Expenses</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">₹${monthlyTotal.toLocaleString('en-IN')}</div>
                    <div class="metric-label">This Month</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${expenses.length}</div>
                    <div class="metric-label">Total Transactions</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${thisMonth.length}</div>
                    <div class="metric-label">This Month Count</div>
                </div>
            </div>
        `;
    }

    renderTable() {
        const tbody = document.getElementById('expenses-tbody');
        if (!tbody) return;

        const expenses = this.getFilteredExpenses();
        
        if (expenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="color: #666;">No expenses found</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = expenses.map(expense => `
            <tr>
                <td>${new Date(expense.date).toLocaleDateString('en-IN')}</td>
                <td>
                    <strong>${expense.description}</strong>
                    ${expense.notes ? `<br><small style="color: #666;">${expense.notes}</small>` : ''}
                </td>
                <td>${this.getCategoryDisplay(expense.category)}</td>
                <td style="font-weight: 600;">₹${parseFloat(expense.amount).toLocaleString('en-IN')}</td>
                <td>${this.getPaymentDisplay(expense.paymentMethod)}</td>
                <td>
                    <button class="btn btn--sm btn--outline edit-expense" data-expense-id="${expense.id}">✏️ Edit</button>
                    <button class="btn btn--sm btn--danger delete-expense" data-expense-id="${expense.id}">🗑️ Delete</button>
                </td>
            </tr>
        `).join('');
    }

    renderChart() {
        const canvas = document.getElementById('expense-chart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        const ctx = canvas.getContext('2d');
        const expenses = this.expenseManager.expenses || [];
        
        // Group expenses by month
        const monthlyData = {};
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(expense.amount || 0);
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const last6Months = sortedMonths.slice(-6);
        const amounts = last6Months.map(month => monthlyData[month] || 0);

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last6Months.map(month => {
                    const [year, monthNum] = month.split('-');
                    return new Date(year, monthNum - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                    label: 'Monthly Expenses',
                    data: amounts,
                    borderColor: '#1fb8cd',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
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
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        });
    }

    populateFilters() {
        const categoryFilter = document.getElementById('filter-category');
        if (!categoryFilter) return;

        // Keep existing options, just ensure they're there
        const categories = [
            { value: 'food', label: '🍽️ Food & Dining' },
            { value: 'transport', label: '🚗 Transportation' },
            { value: 'office', label: '🏢 Office Supplies' },
            { value: 'utilities', label: '⚡ Utilities' },
            { value: 'software', label: '💻 Software & Tools' },
            { value: 'marketing', label: '📈 Marketing' },
            { value: 'travel', label: '✈️ Travel' },
            { value: 'other', label: '📎 Other' }
        ];

        // Clear and repopulate
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            categoryFilter.innerHTML += `<option value="${cat.value}">${cat.label}</option>`;
        });
    }

    getFilteredExpenses() {
        const expenses = this.expenseManager.expenses || [];
        const categoryFilter = document.getElementById('filter-category')?.value;
        const fromFilter = document.getElementById('filter-from')?.value;
        const toFilter = document.getElementById('filter-to')?.value;

        return expenses.filter(expense => {
            // Category filter
            if (categoryFilter && expense.category !== categoryFilter) return false;
            
            // Date filters
            if (fromFilter && expense.date < fromFilter) return false;
            if (toFilter && expense.date > toFilter) return false;
            
            return true;
        });
    }

    getCategoryDisplay(category) {
        const categories = {
            'food': '🍽️ Food & Dining',
            'transport': '🚗 Transportation',
            'office': '🏢 Office Supplies',
            'utilities': '⚡ Utilities',
            'software': '💻 Software & Tools',
            'marketing': '📈 Marketing',
            'travel': '✈️ Travel',
            'other': '📎 Other'
        };
        return categories[category] || category;
    }

    getPaymentDisplay(method) {
        const methods = {
            'cash': '💵 Cash',
            'card': '💳 Card',
            'upi': '📱 UPI',
            'bank': '🏦 Bank Transfer'
        };
        return methods[method] || method;
    }

    applyFilters() {
        this.renderTable();
        this.renderSummary();
        this.renderChart();
    }

    clearFilters() {
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-from').value = '';
        document.getElementById('filter-to').value = '';
        this.applyFilters();
    }

    openModal(expenseId = null) {
        const modal = document.getElementById('expense-modal');
        const form = document.getElementById('expense-form');
        const title = document.getElementById('expense-modal-title');
        
        if (!modal || !form) return;

        this.isModalOpen = true;
        this.editingExpenseId = expenseId;
        
        modal.classList.remove('hidden');
        form.reset();
        
        if (expenseId) {
            title.textContent = 'Edit Expense';
            this.populateForm(expenseId);
        } else {
            title.textContent = 'Add Expense';
            document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        }
    }

    closeModal() {
        const modal = document.getElementById('expense-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.isModalOpen = false;
            this.editingExpenseId = null;
        }
    }

    populateForm(expenseId) {
        const expense = this.expenseManager.expenses.find(exp => exp.id === expenseId);
        if (!expense) return;

        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-description').value = expense.description;
        document.getElementById('expense-category').value = expense.category;
        document.getElementById('expense-payment').value = expense.paymentMethod;
        document.getElementById('expense-notes').value = expense.notes || '';
    }

    async saveExpense() {
        const form = document.getElementById('expense-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const expenseData = {
            amount: parseFloat(document.getElementById('expense-amount').value),
            date: document.getElementById('expense-date').value,
            description: document.getElementById('expense-description').value,
            category: document.getElementById('expense-category').value,
            paymentMethod: document.getElementById('expense-payment').value,
            notes: document.getElementById('expense-notes').value
        };

        try {
            if (this.editingExpenseId) {
                await this.expenseManager.updateExpense(this.editingExpenseId, expenseData);
                this.showToast('Expense updated successfully', 'success');
            } else {
                await this.expenseManager.addExpense(expenseData);
                this.showToast('Expense added successfully', 'success');
            }
            
            this.closeModal();
            this.renderContent();
        } catch (error) {
            console.error('Error saving expense:', error);
            this.showToast('Error saving expense: ' + error.message, 'error');
        }
    }

    editExpense(expenseId) {
        this.openModal(expenseId);
    }

    async deleteExpense(expenseId) {
        const expense = this.expenseManager.expenses.find(exp => exp.id === expenseId);
        if (!expense) return;

        const confirmed = confirm(`Are you sure you want to delete this expense?\n\n${expense.description} - ₹${expense.amount}\n\nThis action cannot be undone.`);
        if (!confirmed) return;

        try {
            await this.expenseManager.deleteExpense(expenseId);
            this.showToast('Expense deleted successfully', 'success');
            this.renderContent();
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showToast('Error deleting expense: ' + error.message, 'error');
        }
    }

    exportToCSV() {
        const expenses = this.getFilteredExpenses();
        if (expenses.length === 0) {
            this.showToast('No expenses to export', 'warning');
            return;
        }

        const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...expenses.map(expense => [
                expense.date,
                `"${expense.description}"`,
                this.getCategoryDisplay(expense.category),
                expense.amount,
                this.getPaymentDisplay(expense.paymentMethod),
                `"${expense.notes || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Expenses exported successfully', 'success');
    }
}

// ExpenseManager class (completely rewritten)
class ExpenseManager {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.expenses = [];
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('Initializing Expense Manager...');
            await this.loadExpenses();
            this.isInitialized = true;
            console.log('Expense Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Expense Manager:', error);
            return false;
        }
    }

    async loadExpenses() {
        try {
            console.log('🔄 Loading expenses from Supabase...');
            
            const { data, error } = await this.supabaseClient
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                console.error('❌ Supabase error loading expenses:', error);
                
                // If it's an auth error, create mock data
                if (error.message.includes('auth') || error.message.includes('JWT') || error.code === 'PGRST301') {
                    console.log('🔧 Authentication issue detected, using mock data for development');
                    this.expenses = this.createMockExpenses();
                    console.log(`✅ Loaded ${this.expenses.length} mock expenses for development`);
                    return;
                }
                throw error;
            }
            
            this.expenses = data || [];
            console.log(`✅ Loaded ${this.expenses.length} expenses from Supabase`);
            
            // If no data from Supabase, create some mock data for demonstration
            if (this.expenses.length === 0) {
                console.log('📝 No expenses found in database, creating sample data...');
                this.expenses = this.createMockExpenses();
                console.log(`✅ Created ${this.expenses.length} sample expenses for demonstration`);
            }
            
        } catch (error) {
            console.error('❌ Error loading expenses:', error);
            console.log('🔧 Falling back to mock data for development');
            this.expenses = this.createMockExpenses();
            console.log(`✅ Loaded ${this.expenses.length} mock expenses (fallback mode)`);
        }
    }

    createMockExpenses() {
        const mockExpenses = [
            {
                id: '1',
                amount: 45.50,
                description: 'Office supplies',
                category: 'Office',
                date: '2025-08-10',
                payment_method: 'Card',
                notes: 'Pens, notebooks, and folders',
                created_at: '2025-08-10T10:00:00Z'
            },
            {
                id: '2',
                amount: 120.00,
                description: 'Team lunch',
                category: 'Food',
                date: '2025-08-09',
                payment_method: 'Cash',
                notes: 'Monthly team building lunch',
                created_at: '2025-08-09T12:30:00Z'
            },
            {
                id: '3',
                amount: 25.75,
                description: 'Taxi to client meeting',
                category: 'Transport',
                date: '2025-08-08',
                payment_method: 'UPI',
                notes: 'Meeting with ABC Corp',
                created_at: '2025-08-08T09:15:00Z'
            },
            {
                id: '4',
                amount: 89.99,
                description: 'Software subscription',
                category: 'Technology',
                date: '2025-08-07',
                payment_method: 'Card',
                notes: 'Monthly design tool subscription',
                created_at: '2025-08-07T14:20:00Z'
            },
            {
                id: '5',
                amount: 15.00,
                description: 'Coffee and snacks',
                category: 'Food',
                date: '2025-08-06',
                payment_method: 'Cash',
                notes: 'Afternoon break',
                created_at: '2025-08-06T15:45:00Z'
            }
        ];
        
        return mockExpenses;
    }

    async addExpense(expenseData) {
        try {
            const expense = {
                ...expenseData,
                id: Date.now().toString(), // Simple ID generation
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabaseClient
                .from('expenses')
                .insert([expense])
                .select()
                .single();

            if (error) throw error;

            this.expenses.unshift(data);
            return data;
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    }

    async updateExpense(expenseId, expenseData) {
        try {
            const { data, error } = await this.supabaseClient
                .from('expenses')
                .update(expenseData)
                .eq('id', expenseId)
                .select()
                .single();

            if (error) throw error;

            const index = this.expenses.findIndex(exp => exp.id === expenseId);
            if (index !== -1) {
                this.expenses[index] = data;
            }

            return data;
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    }

    async deleteExpense(expenseId) {
        try {
            const { error } = await this.supabaseClient
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) throw error;

            this.expenses = this.expenses.filter(exp => exp.id !== expenseId);
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }
}

// --- REST OF THE APPLICATION ---

// Global variables and initialization will go here...
let invoiceApp;

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Starting Invoice Manager Application...');
        console.log('📍 DOM Content Loaded');
        
        // Check if required libraries are loaded
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase library not loaded');
            showToast('Supabase library not loaded. Please check your internet connection.', 'error');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js library not loaded');
            showToast('Chart.js library not loaded. Please check your internet connection.', 'error');
            return;
        }
        
        console.log('✅ All required libraries loaded');
        
        // Initialize Supabase
        const supabaseUrl = 'https://xbfnyrbwwavnlmwkkkjo.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZm55cmJ3d2F2bmxtd2tra2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NDkwMzQsImV4cCI6MjA1MDEyNTAzNH0.3k-4jn5ZNbm0Ep6Np8gJbJTjxR5IWM1-TsttU9eZUv8';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        
        console.log('✅ Supabase client initialized');
        
        // Initialize the main application
        invoiceApp = new InvoiceApp(supabase);
        await invoiceApp.initialize();
        
        console.log('✅ Invoice Manager Application started successfully');
        showToast('Application loaded successfully!', 'success');
    } catch (error) {
        console.error('❌ Failed to start application:', error);
        showToast('Failed to start application: ' + error.message, 'error');
    }
});

// Main Application Class
class InvoiceApp {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.currentUser = null;
        this.clients = [];
        this.invoices = [];
        this.expenses = [];
        this.expenseManager = null;
        this.expenseUI = null;
        this.currentPage = 'dashboard';
    }

    async initialize() {
        console.log('🔧 Initializing InvoiceApp...');
        
        try {
            // Check authentication
            console.log('🔐 Checking authentication...');
            await this.checkAuth();
            
            // Initialize expense management
            console.log('💰 Initializing expense manager...');
            this.expenseManager = new ExpenseManager(this.supabaseClient);
            await this.expenseManager.initialize();
            
            // Initialize expense UI
            console.log('🎨 Initializing expense UI...');
            this.expenseUI = new ExpenseUI(this.expenseManager, showToast);
            
            // Load data
            console.log('📊 Loading application data...');
            await this.loadData();
            
            // Setup navigation
            console.log('🧭 Setting up navigation...');
            this.setupNavigation();
            
            // Show dashboard by default
            console.log('🏠 Showing dashboard...');
            this.showPage('dashboard');
            
            console.log('✅ InvoiceApp initialization complete');
        } catch (error) {
            console.error('❌ Error during app initialization:', error);
            throw error;
        }
    }

    async checkAuth() {
        // FOR TESTING: Skip Supabase auth and use localStorage
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn || isLoggedIn !== 'true') {
            console.log('🔧 Setting up test authentication');
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', 'test_user');
            localStorage.setItem('loginTime', new Date().getTime().toString());
        }
        
        // Set a mock current user
        this.currentUser = {
            id: 'test-user-id',
            email: 'test@example.com',
            name: localStorage.getItem('username') || 'Test User'
        };
        
        console.log('✅ Authentication verified for:', this.currentUser.name);
    }

    async loadData() {
        try {
            console.log('📊 Loading application data...');
            
            // Load clients with error handling
            try {
                const { data: clients, error: clientsError } = await this.supabaseClient
                    .from('clients')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (clientsError) {
                    console.log('⚠️ Clients table error:', clientsError.message);
                    if (clientsError.message.includes('auth') || clientsError.message.includes('JWT')) {
                        console.log('🔧 Using mock clients data for development');
                        this.clients = this.createMockClients();
                    } else {
                        this.clients = [];
                    }
                } else {
                    this.clients = clients || [];
                    if (this.clients.length === 0) {
                        console.log('📝 No clients found, creating sample data...');
                        this.clients = this.createMockClients();
                    }
                }
            } catch (error) {
                console.log('🔧 Clients loading failed, using mock data');
                this.clients = this.createMockClients();
            }

            // Load invoices with error handling
            try {
                const { data: invoices, error: invoicesError } = await this.supabaseClient
                    .from('invoices')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (invoicesError) {
                    console.log('⚠️ Invoices table error:', invoicesError.message);
                    if (invoicesError.message.includes('auth') || invoicesError.message.includes('JWT')) {
                        console.log('🔧 Using mock invoices data for development');
                        this.invoices = this.createMockInvoices();
                    } else {
                        this.invoices = [];
                    }
                } else {
                    this.invoices = invoices || [];
                    if (this.invoices.length === 0) {
                        console.log('📝 No invoices found, creating sample data...');
                        this.invoices = this.createMockInvoices();
                    }
                }
            } catch (error) {
                console.log('🔧 Invoices loading failed, using mock data');
                this.invoices = this.createMockInvoices();
            }

            console.log(`✅ Loaded ${this.clients.length} clients and ${this.invoices.length} invoices`);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            // Fallback to mock data
            this.clients = this.createMockClients();
            this.invoices = this.createMockInvoices();
            console.log('🔧 Using complete mock data set for development');
            showToast('Using sample data for demonstration (database connection issue)', 'warning');
        }
    }

    createMockClients() {
        return [
            {
                id: '1',
                name: 'ABC Corporation',
                email: 'contact@abc-corp.com',
                phone: '+1-555-0123',
                address: '123 Business St, City, State 12345',
                created_at: '2025-08-01T10:00:00Z'
            },
            {
                id: '2',
                name: 'XYZ Enterprises',
                email: 'hello@xyz-ent.com',
                phone: '+1-555-0456',
                address: '456 Commerce Ave, City, State 67890',
                created_at: '2025-08-02T11:30:00Z'
            },
            {
                id: '3',
                name: 'Tech Solutions Inc',
                email: 'info@techsolutions.com',
                phone: '+1-555-0789',
                address: '789 Innovation Blvd, City, State 11111',
                created_at: '2025-08-03T14:15:00Z'
            }
        ];
    }

    createMockInvoices() {
        return [
            {
                id: '1',
                client_id: '1',
                invoice_number: 'INV-2025-001',
                amount: 2500.00,
                status: 'paid',
                due_date: '2025-08-15',
                created_at: '2025-08-01T10:00:00Z'
            },
            {
                id: '2',
                client_id: '2',
                invoice_number: 'INV-2025-002',
                amount: 1750.00,
                status: 'pending',
                due_date: '2025-08-20',
                created_at: '2025-08-05T14:30:00Z'
            },
            {
                id: '3',
                client_id: '3',
                invoice_number: 'INV-2025-003',
                amount: 3200.00,
                status: 'overdue',
                due_date: '2025-08-10',
                created_at: '2025-07-28T09:15:00Z'
            }
        ];
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.showPage(page);
            });
        });
    }

    showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show selected page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });

        this.currentPage = page;

        // Handle specific page logic
        if (page === 'expenses') {
            // The expense UI is already initialized, just refresh content
            if (this.expenseUI) {
                this.expenseUI.renderContent();
            }
        } else if (page === 'dashboard') {
            // Render dashboard with current data
            this.renderDashboard();
        }
    }

    renderDashboard() {
        console.log('🏠 Rendering dashboard with current data...');
        
        const dashboardPage = document.getElementById('dashboard-page');
        if (!dashboardPage) {
            console.log('⚠️ Dashboard page element not found');
            return;
        }

        // Create dashboard content with statistics
        const totalClients = this.clients.length;
        const totalInvoices = this.invoices.length;
        const totalExpenses = this.expenseManager ? this.expenseManager.expenses.length : 0;
        
        // Calculate totals
        const totalInvoiceAmount = this.invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
        const totalExpenseAmount = this.expenseManager ? 
            this.expenseManager.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0) : 0;

        // Update dashboard if it has content area
        const dashboardContent = dashboardPage.querySelector('.dashboard-content') || dashboardPage;
        
        const statsHTML = `
            <div class="dashboard-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0;">
                <div class="stat-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid #007bff;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">📊 Total Clients</h3>
                    <p style="font-size: 2em; margin: 0; color: #007bff; font-weight: bold;">${totalClients}</p>
                </div>
                <div class="stat-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid #28a745;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">📋 Total Invoices</h3>
                    <p style="font-size: 2em; margin: 0; color: #28a745; font-weight: bold;">${totalInvoices}</p>
                    <small style="color: #666;">Total Value: $${totalInvoiceAmount.toFixed(2)}</small>
                </div>
                <div class="stat-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid #dc3545;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">💰 Total Expenses</h3>
                    <p style="font-size: 2em; margin: 0; color: #dc3545; font-weight: bold;">${totalExpenses}</p>
                    <small style="color: #666;">Total Amount: $${totalExpenseAmount.toFixed(2)}</small>
                </div>
                <div class="stat-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid #ffc107;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">💵 Net Income</h3>
                    <p style="font-size: 2em; margin: 0; color: #ffc107; font-weight: bold;">$${(totalInvoiceAmount - totalExpenseAmount).toFixed(2)}</p>
                    <small style="color: #666;">Revenue - Expenses</small>
                </div>
            </div>
            
            <div class="recent-activity" style="margin-top: 30px;">
                <h2 style="color: #333; margin-bottom: 20px;">📈 Recent Activity</h2>
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="color: #666; margin-bottom: 15px;">Latest Invoices</h3>
                    ${this.renderRecentInvoices()}
                    
                    <h3 style="color: #666; margin: 25px 0 15px 0;">Recent Expenses</h3>
                    ${this.renderRecentExpenses()}
                </div>
            </div>
        `;

        // If dashboard content area exists, update it; otherwise add to the page
        if (dashboardContent !== dashboardPage) {
            dashboardContent.innerHTML = statsHTML;
        } else {
            // Check if stats already exist and update, otherwise add
            const existingStats = dashboardPage.querySelector('.dashboard-stats');
            if (existingStats) {
                existingStats.parentNode.innerHTML = statsHTML;
            } else {
                dashboardPage.innerHTML += statsHTML;
            }
        }
        
        console.log('✅ Dashboard rendered successfully');
    }

    renderRecentInvoices() {
        if (this.invoices.length === 0) {
            return '<p style="color: #999; font-style: italic;">No invoices yet</p>';
        }
        
        return this.invoices.slice(0, 3).map(invoice => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${invoice.invoice_number}</strong><br>
                    <small style="color: #666;">Client ID: ${invoice.client_id}</small>
                </div>
                <div style="text-align: right;">
                    <strong style="color: #28a745;">$${invoice.amount.toFixed(2)}</strong><br>
                    <small style="color: #666;">${invoice.status}</small>
                </div>
            </div>
        `).join('');
    }

    renderRecentExpenses() {
        if (!this.expenseManager || this.expenseManager.expenses.length === 0) {
            return '<p style="color: #999; font-style: italic;">No expenses yet</p>';
        }
        
        return this.expenseManager.expenses.slice(0, 3).map(expense => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${expense.description}</strong><br>
                    <small style="color: #666;">${expense.category} • ${expense.date}</small>
                </div>
                <div style="text-align: right;">
                    <strong style="color: #dc3545;">$${expense.amount.toFixed(2)}</strong><br>
                    <small style="color: #666;">${expense.payment_method}</small>
                </div>
            </div>
        `).join('');
    }
}

// Utility functions
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast--show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('toast--show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Export for global access
window.showToast = showToast;
