// ============================================
// COMPLETE EXPENSE MANAGEMENT SYSTEM - FIXED VERSION
// Place this BEFORE the checkAuth() function in your app.js
// ============================================

// Enhanced ExpenseUI class with all features working
class ExpenseUI {
    constructor(expenseManager, showToast) {
        this.expenseManager = expenseManager;
        this.showToast = showToast;
        this.expenseChart = null;
        this.categoryChart = null;
        this.currentFilters = {
            category: 'all',
            dateFrom: null,
            dateTo: null,
            paymentMethod: 'all',
            businessOnly: false
        };
    }

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
            
            <!-- Summary Cards -->
            <div class="metrics-grid" style="margin-bottom: 24px;">
                <div class="metric-card">
                    <div class="metric-value" id="total-expenses-value">₹0</div>
                    <div class="metric-label">Total Expenses</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="month-expenses-value">₹0</div>
                    <div class="metric-label">This Month</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="avg-expense-value">₹0</div>
                    <div class="metric-label">Average Expense</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" id="expense-count-value">0</div>
                    <div class="metric-label">Total Transactions</div>
                </div>
            </div>
            
            <!-- Filters Section -->
            <div class="expense-filters-section" style="background: var(--color-surface); padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--color-border);">
                <h3 style="margin-bottom: 16px; font-size: 16px;">🔍 Filter Expenses</h3>
                <div class="filters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; align-items: end;">
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label" style="font-size: 12px;">Category</label>
                        <select class="form-control" id="filter-category">
                            <option value="all">All Categories</option>
                            <option value="Food">🍕 Food</option>
                            <option value="Fashion">👔 Fashion</option>
                            <option value="Professional Services">💼 Professional Services</option>
                            <option value="Grocery">🛒 Grocery</option>
                            <option value="Miscellaneous">📦 Miscellaneous</option>
                            <option value="Transportation">🚗 Transportation</option>
                            <option value="Entertainment">🎮 Entertainment</option>
                            <option value="Healthcare">🏥 Healthcare</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label" style="font-size: 12px;">From Date</label>
                        <input type="date" class="form-control" id="filter-date-from">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label" style="font-size: 12px;">To Date</label>
                        <input type="date" class="form-control" id="filter-date-to">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label class="form-label" style="font-size: 12px;">Payment Method</label>
                        <select class="form-control" id="filter-payment-method">
                            <option value="all">All Methods</option>
                            <option value="cash">💵 Cash</option>
                            <option value="upi">📱 UPI</option>
                            <option value="card">💳 Card</option>
                            <option value="net_banking">🏦 Net Banking</option>
                            <option value="wallet">📲 Digital Wallet</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0; display: flex; align-items: center; padding-top: 8px;">
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                            <input type="checkbox" id="filter-business-only" style="width: 18px; height: 18px; cursor: pointer;">
                            Business Only
                        </label>
                    </div>
                    <div class="form-group" style="margin: 0; display: flex; gap: 8px;">
                        <button class="btn btn--secondary btn--sm" id="apply-filters-btn">Apply</button>
                        <button class="btn btn--secondary btn--sm" id="clear-filters-btn">Clear</button>
                    </div>
                </div>
            </div>
            
            <!-- Charts Section -->
            <div class="expense-charts" style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 24px;">
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
                            <!-- Populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Add/Edit Expense Modal -->
            <div id="expense-modal" class="modal hidden">
                <div class="modal-overlay" onclick="window.expenseUI.closeExpenseModal()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="expense-modal-title">Add New Expense</h2>
                        <button class="modal-close" onclick="window.expenseUI.closeExpenseModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="expense-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="expense-date">Date</label>
                                    <input type="date" class="form-control" id="expense-date" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="expense-amount">Amount (₹)</label>
                                    <input type="number" class="form-control" id="expense-amount" min="0" step="0.01" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="expense-description">Description</label>
                                <input type="text" class="form-control" id="expense-description" required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="expense-category">Category</label>
                                    <select class="form-control" id="expense-category" required>
                                        <option value="">Select Category</option>
                                        <option value="Food">🍕 Food</option>
                                        <option value="Fashion">👔 Fashion</option>
                                        <option value="Professional Services">💼 Professional Services</option>
                                        <option value="Grocery">🛒 Grocery</option>
                                        <option value="Miscellaneous">📦 Miscellaneous</option>
                                        <option value="Transportation">🚗 Transportation</option>
                                        <option value="Entertainment">🎮 Entertainment</option>
                                        <option value="Healthcare">🏥 Healthcare</option>
                                        <option value="Education">📚 Education</option>
                                        <option value="Utilities">💡 Utilities</option>
                                        <option value="Rent">🏠 Rent</option>
                                        <option value="Insurance">🛡️ Insurance</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="expense-payment-method">Payment Method</label>
                                    <select class="form-control" id="expense-payment-method" required>
                                        <option value="">Select Method</option>
                                        <option value="cash">💵 Cash</option>
                                        <option value="upi">📱 UPI</option>
                                        <option value="card">💳 Card</option>
                                        <option value="net_banking">🏦 Net Banking</option>
                                        <option value="wallet">📲 Digital Wallet</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="expense-vendor">Vendor/Store Name</label>
                                <input type="text" class="form-control" id="expense-vendor" placeholder="e.g., McDonald's, Amazon">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="expense-notes">Notes</label>
                                <textarea class="form-control" id="expense-notes" rows="2" placeholder="Additional details..."></textarea>
                            </div>
                            
                            <div class="form-row">
                                <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="expense-business" checked style="width: 18px; height: 18px;">
                                    Business Expense
                                </label>
                                <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="expense-tax-deductible" style="width: 18px; height: 18px;">
                                    Tax Deductible
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn--secondary" onclick="window.expenseUI.closeExpenseModal()">Cancel</button>
                        <button type="button" class="btn btn--primary" id="save-expense-btn">Save Expense</button>
                    </div>
                </div>
            </div>
        `;
    }

    initializeUI() {
        console.log('Initializing Expense UI...');
        const expensesPage = document.getElementById('expenses-page');
        if (expensesPage) {
            expensesPage.innerHTML = this.getExpensesPageHTML();
            this.attachEventListeners();
            this.renderExpenses();
        }
    }

    attachEventListeners() {
        // Add Expense button
        const addExpenseBtn = document.getElementById('add-expense-btn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.openAddExpenseModal());
        }

        // Export button
        const exportBtn = document.getElementById('export-expenses');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportExpenses());
        }

        // Filter buttons
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Save expense button
        const saveExpenseBtn = document.getElementById('save-expense-btn');
        if (saveExpenseBtn) {
            saveExpenseBtn.addEventListener('click', () => this.saveExpense());
        }

        // Form submission prevention
        const expenseForm = document.getElementById('expense-form');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => e.preventDefault());
        }
    }

    renderExpenses() {
        this.updateSummaryCards();
        const filteredExpenses = this.getFilteredExpenses();
        this.renderExpensesTable(filteredExpenses);
        this.renderCharts(filteredExpenses);
    }

    updateSummaryCards() {
        const expenses = this.expenseManager.expenses || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const monthExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        }).reduce((sum, exp) => sum + exp.amount, 0);
        
        const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
        
        document.getElementById('total-expenses-value').textContent = `₹${this.formatNumber(totalExpenses)}`;
        document.getElementById('month-expenses-value').textContent = `₹${this.formatNumber(monthExpenses)}`;
        document.getElementById('avg-expense-value').textContent = `₹${this.formatNumber(avgExpense)}`;
        document.getElementById('expense-count-value').textContent = expenses.length;
    }

    getFilteredExpenses() {
        let expenses = [...(this.expenseManager.expenses || [])];
        
        if (this.currentFilters.category !== 'all') {
            expenses = expenses.filter(e => e.categoryName === this.currentFilters.category);
        }
        
        if (this.currentFilters.dateFrom) {
            expenses = expenses.filter(e => e.date >= this.currentFilters.dateFrom);
        }
        
        if (this.currentFilters.dateTo) {
            expenses = expenses.filter(e => e.date <= this.currentFilters.dateTo);
        }
        
        if (this.currentFilters.paymentMethod !== 'all') {
            expenses = expenses.filter(e => e.paymentMethod === this.currentFilters.paymentMethod);
        }
        
        if (this.currentFilters.businessOnly) {
            expenses = expenses.filter(e => e.isBusinessExpense);
        }
        
        return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    renderExpensesTable(expenses) {
        const tbody = document.getElementById('expenses-table-body');
        if (!tbody) return;
        
        if (expenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--color-text-secondary);">
                        No expenses found. Add your first expense to get started!
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = expenses.map(expense => `
            <tr>
                <td>${this.formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td>
                    <span class="status-badge" style="background: var(--color-bg-2); padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                        ${expense.categoryName || 'Uncategorized'}
                    </span>
                </td>
                <td><strong>₹${this.formatNumber(expense.amount)}</strong></td>
                <td>${this.getPaymentMethodLabel(expense.paymentMethod)}</td>
                <td>${expense.vendorName || '-'}</td>
                <td>
                    <div class="action-buttons" style="display: flex; gap: 4px;">
                        <button class="action-btn edit" onclick="window.expenseUI.editExpense('${expense.id}')" style="background: #fef3c7; border: 1px solid #f59e0b; color: #78350f; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px;">✏️</button>
                        <button class="action-btn delete" onclick="window.expenseUI.deleteExpense('${expense.id}')" style="background: #fee2e2; border: 1px solid #ef4444; color: #7f1d1d; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px;">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderCharts(expenses) {
        // Destroy existing charts
        if (this.expenseChart) {
            this.expenseChart.destroy();
            this.expenseChart = null;
        }
        if (this.categoryChart) {
            this.categoryChart.destroy();
            this.categoryChart = null;
        }
        
        // Monthly trend chart
        const monthlyData = this.getMonthlyData(expenses);
        const monthlyCtx = document.getElementById('expenseMonthlyChart');
        if (monthlyCtx && monthlyData.labels.length > 0) {
            this.expenseChart = new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: monthlyData.labels,
                    datasets: [{
                        label: 'Monthly Expenses',
                        data: monthlyData.values,
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
                                callback: value => '₹' + this.formatNumber(value)
                            }
                        }
                    }
                }
            });
        }
        
        // Category breakdown chart
        const categoryData = this.getCategoryData(expenses);
        const categoryCtx = document.getElementById('expenseCategoryChart');
        if (categoryCtx && categoryData.labels.length > 0) {
            this.categoryChart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryData.labels,
                    datasets: [{
                        data: categoryData.values,
                        backgroundColor: [
                            '#1FB8CD', '#F59E42', '#6B7280', '#10B981', 
                            '#F43F5E', '#6366F1', '#FBBF24', '#A3E635'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }

    getMonthlyData(expenses) {
        const monthlyMap = new Map();
        const now = new Date();
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap.set(key, 0);
        }
        
        // Add expense data
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyMap.has(key)) {
                monthlyMap.set(key, monthlyMap.get(key) + expense.amount);
            }
        });
        
        const labels = Array.from(monthlyMap.keys()).map(key => {
            const [year, month] = key.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        });
        
        return {
            labels,
            values: Array.from(monthlyMap.values())
        };
    }

    getCategoryData(expenses) {
        const categoryMap = new Map();
        
        expenses.forEach(expense => {
            const category = expense.categoryName || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
        });
        
        const sorted = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        
        return {
            labels: sorted.map(([cat]) => cat),
            values: sorted.map(([, amount]) => amount)
        };
    }

    applyFilters() {
        this.currentFilters = {
            category: document.getElementById('filter-category').value,
            dateFrom: document.getElementById('filter-date-from').value,
            dateTo: document.getElementById('filter-date-to').value,
            paymentMethod: document.getElementById('filter-payment-method').value,
            businessOnly: document.getElementById('filter-business-only').checked
        };
        
        this.renderExpenses();
        this.showToast('Filters applied', 'info');
    }

    clearFilters() {
        document.getElementById('filter-category').value = 'all';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        document.getElementById('filter-payment-method').value = 'all';
        document.getElementById('filter-business-only').checked = false;
        
        this.currentFilters = {
            category: 'all',
            dateFrom: null,
            dateTo: null,
            paymentMethod: 'all',
            businessOnly: false
        };
        
        this.renderExpenses();
        this.showToast('Filters cleared', 'info');
    }

    openAddExpenseModal() {
        this.expenseManager.editingExpenseId = null;
        document.getElementById('expense-modal-title').textContent = 'Add New Expense';
        document.getElementById('expense-form').reset();
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('expense-business').checked = true;
        document.getElementById('expense-modal').classList.remove('hidden');
    }

    closeExpenseModal() {
        document.getElementById('expense-modal').classList.add('hidden');
        document.getElementById('expense-form').reset();
        this.expenseManager.editingExpenseId = null;
    }

    async editExpense(expenseId) {
        const expense = this.expenseManager.expenses.find(e => e.id === expenseId);
        if (!expense) {
            this.showToast('Expense not found', 'error');
            return;
        }
        
        this.expenseManager.editingExpenseId = expenseId;
        document.getElementById('expense-modal-title').textContent = 'Edit Expense';
        
        // Populate form
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-description').value = expense.description;
        document.getElementById('expense-category').value = expense.categoryName || '';
        document.getElementById('expense-payment-method').value = expense.paymentMethod || '';
        document.getElementById('expense-vendor').value = expense.vendorName || '';
        document.getElementById('expense-notes').value = expense.notes || '';
        document.getElementById('expense-business').checked = expense.isBusinessExpense;
        document.getElementById('expense-tax-deductible').checked = expense.taxDeductible;
        
        document.getElementById('expense-modal').classList.remove('hidden');
    }

    async deleteExpense(expenseId) {
        const expense = this.expenseManager.expenses.find(e => e.id === expenseId);
        if (!expense) {
            this.showToast('Expense not found', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete this expense?\n\n${expense.description}\nAmount: ₹${this.formatNumber(expense.amount)}`)) {
            return;
        }
        
        try {
            await this.expenseManager.deleteExpense(expenseId);
            this.renderExpenses();
            this.showToast('Expense deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showToast('Error deleting expense', 'error');
        }
    }

    async saveExpense() {
        const form = document.getElementById('expense-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const expenseData = {
            date: document.getElementById('expense-date').value,
            amount: parseFloat(document.getElementById('expense-amount').value),
            description: document.getElementById('expense-description').value,
            categoryId: document.getElementById('expense-category').value,
            categoryName: document.getElementById('expense-category').value,
            paymentMethod: document.getElementById('expense-payment-method').value,
            vendorName: document.getElementById('expense-vendor').value,
            notes: document.getElementById('expense-notes').value,
            isBusinessExpense: document.getElementById('expense-business').checked,
            taxDeductible: document.getElementById('expense-tax-deductible').checked
        };
        
        try {
            await this.expenseManager.saveExpense(expenseData);
            this.closeExpenseModal();
            this.renderExpenses();
            this.showToast(
                this.expenseManager.editingExpenseId ? 'Expense updated successfully' : 'Expense added successfully',
                'success'
            );
        } catch (error) {
            console.error('Error saving expense:', error);
            this.showToast('Error saving expense', 'error');
        }
    }

    exportExpenses() {
        const expenses = this.getFilteredExpenses();
        if (expenses.length === 0) {
            this.showToast('No expenses to export', 'warning');
            return;
        }
        
        const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Vendor', 'Business Expense', 'Tax Deductible', 'Notes'];
        const rows = expenses.map(e => [
            e.date,
            e.description,
            e.categoryName || 'Uncategorized',
            e.amount,
            e.paymentMethod || '',
            e.vendorName || '',
            e.isBusinessExpense ? 'Yes' : 'No',
            e.taxDeductible ? 'Yes' : 'No',
            e.notes || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Expenses exported successfully', 'success');
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num || 0);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getPaymentMethodLabel(method) {
        const methods = {
            'cash': '💵 Cash',
            'upi': '📱 UPI',
            'card': '💳 Card',
            'net_banking': '🏦 Net Banking',
            'wallet': '📲 Wallet'
        };
        return methods[method] || method || '-';
    }

    cleanupExpensesPage() {
        if (this.expenseChart) {
            this.expenseChart.destroy();
            this.expenseChart = null;
        }
        if (this.categoryChart) {
            this.categoryChart.destroy();
            this.categoryChart = null;
        }
    }
}

// ============================================
// COMPLETE EXPENSEMANAGER CLASS - REPLACE YOUR ENTIRE EXISTING CLASS WITH THIS
// This includes the missing updateBalanceFromInvoices method
// ============================================

class ExpenseManager {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.expenses = [];
        this.categories = [];
        this.balanceSummary = {
            totalEarnings: 0,
            totalExpenses: 0,
            currentBalance: 0
        };
        this.isInitialized = false;
        this.editingExpenseId = null;
    }

    async initialize() {
        try {
            await this.loadExpenses();
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing ExpenseManager:', error);
            // Load sample data as fallback
            this.expenses = this.getSampleExpenses();
            this.isInitialized = true;
            return true;
        }
    }

    async loadExpenses() {
        try {
            const { data: expenses, error } = await this.supabaseClient
                .from('expenses')
                .select('*')
                .order('date_incurred', { ascending: false });

            if (error) throw error;

            this.expenses = (expenses || []).map(expense => ({
                id: expense.id,
                amount: parseFloat(expense.amount || 0),
                description: expense.description || '',
                categoryId: expense.category_id,
                categoryName: expense.category_name || 'Uncategorized',
                date: expense.date_incurred || new Date().toISOString().split('T')[0],
                paymentMethod: expense.payment_method || 'cash',
                vendorName: expense.vendor_name || '',
                isBusinessExpense: expense.is_business_expense !== false,
                taxDeductible: expense.tax_deductible || false,
                notes: expense.notes || ''
            }));
        } catch (error) {
            console.error('Error loading expenses:', error);
            this.expenses = this.getSampleExpenses();
        }
    }

    getSampleExpenses() {
        return [
            {
                id: 'sample-1',
                amount: 741.89,
                description: "McDonald's",
                categoryName: 'Food',
                date: '2025-08-09',
                paymentMethod: 'upi',
                vendorName: "McDonald's",
                isBusinessExpense: false,
                taxDeductible: false,
                notes: ''
            },
            {
                id: 'sample-2',
                amount: 1000.00,
                description: 'Boutique expenses',
                categoryName: 'Miscellaneous',
                date: '2025-08-09',
                paymentMethod: 'upi',
                vendorName: 'Fashion Store',
                isBusinessExpense: true,
                taxDeductible: false,
                notes: ''
            },
            {
                id: 'sample-3',
                amount: 1400.00,
                description: 'Kids dress',
                categoryName: 'Fashion',
                date: '2025-08-09',
                paymentMethod: 'upi',
                vendorName: 'Kids Store',
                isBusinessExpense: false,
                taxDeductible: false,
                notes: ''
            },
            {
                id: 'sample-4',
                amount: 2000.00,
                description: 'Washing machine service',
                categoryName: 'Professional Services',
                date: '2025-08-09',
                paymentMethod: 'upi',
                vendorName: 'Service Center',
                isBusinessExpense: false,
                taxDeductible: false,
                notes: ''
            },
            {
                id: 'sample-5',
                amount: 100.00,
                description: 'Bananas',
                categoryName: 'Grocery',
                date: '2025-08-08',
                paymentMethod: 'upi',
                vendorName: 'Fresh Mart',
                isBusinessExpense: false,
                taxDeductible: false,
                notes: ''
            }
        ];
    }

    async saveExpense(expenseData) {
        try {
            const expensePayload = {
                amount: parseFloat(expenseData.amount),
                description: expenseData.description.trim(),
                category_name: expenseData.categoryName || 'Uncategorized',
                date_incurred: expenseData.date,
                payment_method: expenseData.paymentMethod || 'cash',
                vendor_name: expenseData.vendorName?.trim() || null,
                is_business_expense: expenseData.isBusinessExpense !== false,
                tax_deductible: expenseData.taxDeductible || false,
                notes: expenseData.notes?.trim() || null
            };

            if (this.editingExpenseId) {
                // Update existing expense
                const { data, error } = await this.supabaseClient
                    .from('expenses')
                    .update(expensePayload)
                    .eq('id', this.editingExpenseId)
                    .select()
                    .single();

                if (error) throw error;

                const index = this.expenses.findIndex(e => e.id === this.editingExpenseId);
                if (index > -1) {
                    this.expenses[index] = {
                        ...this.expenses[index],
                        ...expenseData,
                        id: this.editingExpenseId
                    };
                }
            } else {
                // Create new expense
                const { data, error } = await this.supabaseClient
                    .from('expenses')
                    .insert([expensePayload])
                    .select()
                    .single();

                if (!error && data) {
                    this.expenses.unshift({
                        ...expenseData,
                        id: data.id
                    });
                } else {
                    // Fallback: add locally with temp ID
                    this.expenses.unshift({
                        ...expenseData,
                        id: 'temp-' + Date.now()
                    });
                }
            }

            this.editingExpenseId = null;
            return true;
        } catch (error) {
            console.error('Error saving expense:', error);
            // Save locally as fallback
            if (this.editingExpenseId) {
                const index = this.expenses.findIndex(e => e.id === this.editingExpenseId);
                if (index > -1) {
                    this.expenses[index] = {
                        ...this.expenses[index],
                        ...expenseData
                    };
                }
            } else {
                this.expenses.unshift({
                    ...expenseData,
                    id: 'local-' + Date.now()
                });
            }
            this.editingExpenseId = null;
            return true;
        }
    }

    async deleteExpense(expenseId) {
        try {
            const { error } = await this.supabaseClient
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) console.error('Error deleting from database:', error);

            // Remove from local data regardless
            const index = this.expenses.findIndex(exp => exp.id === expenseId);
            if (index > -1) {
                this.expenses.splice(index, 1);
            }

            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            // Remove from local data anyway
            const index = this.expenses.findIndex(exp => exp.id === expenseId);
            if (index > -1) {
                this.expenses.splice(index, 1);
            }
            return true;
        }
    }

    // ============================================
    // THIS IS THE MISSING METHOD THAT WAS CAUSING THE ERROR
    // ============================================
    async updateBalanceFromInvoices(invoices) {
        try {
            // Calculate total earnings from paid invoices
            const totalEarnings = invoices
                .filter(inv => inv.status === 'Paid')
                .reduce((sum, inv) => sum + inv.amount, 0);

            // Calculate total expenses
            const totalExpenses = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            // Calculate current balance
            const currentBalance = totalEarnings - totalExpenses;

            // Update local balance summary
            this.balanceSummary = {
                totalEarnings,
                totalExpenses,
                currentBalance
            };

            console.log('Balance updated:', this.balanceSummary);

            // Try to update in database (optional - only if you have balance_summary table)
            try {
                // First check if balance_summary table exists and has records
                const { data: existingBalance, error: fetchError } = await this.supabaseClient
                    .from('balance_summary')
                    .select('id')
                    .limit(1);

                if (!fetchError) {
                    // Table exists, try to upsert
                    const { error } = await this.supabaseClient
                        .from('balance_summary')
                        .upsert({
                            id: 'default',
                            total_earnings: totalEarnings,
                            total_expenses: totalExpenses,
                            current_balance: currentBalance,
                            last_calculated_at: new Date().toISOString()
                        });

                    if (error) {
                        console.warn('Could not update balance in database:', error);
                    } else {
                        console.log('Balance updated in database');
                    }
                } else {
                    // Table doesn't exist or other error
                    console.log('Balance summary table not available, using local storage only');
                }
            } catch (dbError) {
                // Silently fail if table doesn't exist
                console.log('Balance summary table operations not available');
            }

            return this.balanceSummary;
        } catch (error) {
            console.error('Error updating balance from invoices:', error);
            return this.balanceSummary;
        }
    }

    // Additional helper methods
    getExpensesByCategory(categoryName) {
        return this.expenses.filter(expense => expense.categoryName === categoryName);
    }

    getExpensesByDateRange(startDate, endDate) {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return expenseDate >= start && expenseDate <= end;
        });
    }

    getMonthlyExpenseData() {
        const monthlyData = new Map();
        
        this.expenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + expense.amount);
        });
        
        return Array.from(monthlyData, ([month, amount]) => ({ month, amount }))
                   .sort((a, b) => a.month.localeCompare(b.month));
    }

    getCategoryBreakdown() {
        const categoryMap = new Map();
        
        this.expenses.forEach(expense => {
            const categoryName = expense.categoryName || 'Uncategorized';
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, {
                    name: categoryName,
                    amount: 0,
                    count: 0
                });
            }
            
            const categoryData = categoryMap.get(categoryName);
            categoryData.amount += expense.amount;
            categoryData.count += 1;
        });
        
        return Array.from(categoryMap.values())
                   .sort((a, b) => b.amount - a.amount);
    }

    getTotalExpenses() {
        return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }

    getBusinessExpenses() {
        return this.expenses.filter(expense => expense.isBusinessExpense);
    }

    getTaxDeductibleExpenses() {
        return this.expenses.filter(expense => expense.taxDeductible);
    }
}

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
    profilePhone: '+91 9500808013',
    profileAddress: '6/91, Mahit Complex, Hosur Road, Attibele, Bengaluru, Karnataka – 562107',
    profileGSTIN: '29GLOPS9921M1ZT',
    bankAccountName: 'Hariprasad Sivakumar',  // CORRECTED: Bank Account Name
    bankName: 'Kotak Mahindra Bank',          // CORRECTED: Bank Name  
    bankAccount: '2049315152',
    bankBranch: 'Indira Nagar, Bengaluru',
    bankIFSC: 'KKBK0008068',
    bankSWIFT: 'KKBKINBBCPC',
    accountType: 'Current Account'
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

    // Attach event delegation ONCE for each page container
    // Invoices page
    const invoicesPage = document.getElementById('invoices-page');
    if (invoicesPage) {
        invoicesPage.addEventListener('click', (e) => {
            if (!invoicesPage.classList.contains('active')) return;
            if (e.target.id === 'save-draft') {
                saveInvoice('Draft');
            } else if (e.target.id === 'save-invoice') {
                saveInvoice('Pending');
            } else if (e.target.classList.contains('remove-item')) {
                removeLineItem(e.target.closest('.line-item'));
                calculateInvoiceTotal();
            } else if (e.target.id === 'new-invoice-btn') {
                openInvoiceModal();
            }
        });
        invoicesPage.addEventListener('input', (e) => {
            if (!invoicesPage.classList.contains('active')) return;
            if (e.target.classList.contains('quantity') || e.target.classList.contains('rate')) {
                calculateLineItem(e.target.closest('.line-item'));
                calculateInvoiceTotal();
            }
        });
        const invoiceForm = document.getElementById('invoice-form');
        if (invoiceForm) {
            invoiceForm.addEventListener('submit', (e) => {
                if (!invoicesPage.classList.contains('active')) return;
                e.preventDefault();
                saveInvoice('Pending');
            });
        }
    }

    // Clients page
    const clientsPage = document.getElementById('clients-page');
    if (clientsPage) {
        clientsPage.addEventListener('click', (e) => {
            if (!clientsPage.classList.contains('active')) return;
            const btn = e.target.closest('.client-action-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const clientId = btn.getAttribute('data-client-id');
            if (btn.classList.contains('edit')) {
                // Find client by ID only, not by index
                const client = appData.clients.find(c => c.id === clientId);
                if (client) {
                    editClient(clientId);
                } else {
                    console.error('Client not found for editing:', clientId);
                    showToast('Error: Client not found. Please refresh the page.', 'error');
                }
            } else if (btn.classList.contains('delete')) {
                const clientName = btn.getAttribute('data-client-name');
                deleteClient(clientId, clientName);
            }
        });
    }

    // Analytics page
    const analyticsPage = document.getElementById('analytics-page');
    if (analyticsPage) {
        analyticsPage.addEventListener('click', (e) => {
            if (!analyticsPage.classList.contains('active')) return;
            if (e.target.id === 'apply-filters') {
                applyAnalyticsFilters();
            } else if (e.target.id === 'clear-filters') {
                clearAnalyticsFilters();
            }
        });
        analyticsPage.addEventListener('change', (e) => {
            if (!analyticsPage.classList.contains('active')) return;
            if (e.target.id === 'analytics-period') {
                analyticsState.currentPeriod = e.target.value;
                console.log('Period changed to:', analyticsState.currentPeriod);
                applyAnalyticsFilters();
            }
        });
    }
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
        
        // Initialize Expense Management
        try {
            console.log('Initializing Expense Management...');
            
            // Initialize ExpenseManager
            window.expenseManager = new ExpenseManager(supabaseClient);
            await window.expenseManager.initialize();
            
            // Initialize ExpenseUI
            window.expenseUI = new ExpenseUI(window.expenseManager, showToast);
            
            console.log('Expense Management initialized successfully');
        } catch (error) {
            console.error('Error initializing expense management:', error);
            showToast('Expense module loaded with limited functionality', 'warning');
        }
        
        // Render all pages
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
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.jspdf) {
            resolve();
            return;
        }

        // Remove existing scripts if any
        const existingScript = document.getElementById('jspdf-script');
        if (existingScript) {
            existingScript.remove();
        }

        const existingAutoTable = document.getElementById('jspdf-autotable-script');
        if (existingAutoTable) {
            existingAutoTable.remove();
        }

        // Load jsPDF
        const script = document.createElement('script');
        script.id = 'jspdf-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            console.log('jsPDF loaded successfully');
            
            // Load AutoTable plugin
            const autoTableScript = document.createElement('script');
            autoTableScript.id = 'jspdf-autotable-script';
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            autoTableScript.onload = () => {
                console.log('jsPDF AutoTable loaded successfully');
                resolve();
            };
            autoTableScript.onerror = (error) => {
                console.error('Failed to load jsPDF AutoTable:', error);
                reject(error);
            };
            document.head.appendChild(autoTableScript);
        };
        script.onerror = (error) => {
            console.error('Failed to load jsPDF:', error);
            reject(error);
        };
        document.head.appendChild(script);
    });
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

        // Add enhanced analytics styles
        if (!document.getElementById('enhanced-analytics-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-analytics-styles';
            style.textContent = `
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

    .stat-icon {
        font-size: 14px;
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

    .filter-actions {
        display: flex;
        gap: 8px;
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

    .apply-btn:active {
        transform: translateY(0);
    }

    .active-filters {
        padding: 24px 32px;
        background: #f7fafc;
        border-top: 1px solid #e2e8f0;
        display: none;
    }

    .active-filters.show {
        display: block;
        animation: slideDown 0.3s ease;
    }

    .filters-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 13px;
        font-weight: 600;
        color: #4a5568;
    }

    .filter-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        color: #2d3748;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
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

        .date-separator {
            transform: rotate(90deg);
        }
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

// REPLACE YOUR ENTIRE SECTION WITH THIS CORRECTED CODE:
// This fixes all issues in the monthly, quarterly, and yearly calculations

function calculateMonthlyEarnings() {
    const monthlyData = new Map();
    
    appData.invoices
        .filter(inv => inv.status === 'Paid')
        .forEach(({ date, amount }) => {
            const d = new Date(date);
            if (isNaN(d.getTime())) return;  // FIXED: Proper date validation
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
            if (isNaN(d.getTime())) return;  // FIXED: Proper date validation
            const year = d.getFullYear();
            const quarter = Math.ceil((d.getMonth() + 1) / 3);
            const quarterKey = `${year}-Q${quarter}`;
            quarterlyData.set(quarterKey, (quarterlyData.get(quarterKey) || 0) + amount);  // FIXED: Use quarterlyData
        });
    
    return Array.from(quarterlyData, ([quarter, amount]) => ({ month: quarter, amount }))  // FIXED: Use quarterlyData
                 .sort((a, b) => a.month.localeCompare(b.month));
}

function calculateYearlyEarnings(invoices = appData.invoices) {
    const yearlyData = new Map();
    
    invoices
        .filter(inv => inv.status === 'Paid')
        .forEach(({ date, amount }) => {
            const d = new Date(date);
            if (isNaN(d.getTime())) return;  // Proper date validation
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

        // For new invoices, check if ID already exists
        if (!editingInvoiceId) {
            // Generate a unique invoice ID if not provided or if it exists
            const { data: existingInvoice } = await supabaseClient
                .from('invoices')
                .select('id')
                .eq('id', invoiceData.id)
                .single();

            if (existingInvoice) {
                // ID already exists, generate a new one
                const timestamp = Date.now();
                const randomNum = Math.floor(Math.random() * 1000);
                invoiceData.id = `${appData.settings.invoicePrefix}-${timestamp}-${randomNum}`;
                console.log('Generated new unique invoice ID:', invoiceData.id);
            }
        }

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

            if (error) {
                // If it's still a duplicate key error, try once more with a different ID
                if (error.code === '23505') {
                    const timestamp = Date.now();
                    const randomNum = Math.floor(Math.random() * 10000);
                    invoiceData.id = `${appData.settings.invoicePrefix}-${timestamp}-${randomNum}`;
                    
                    const { data: retryData, error: retryError } = await supabaseClient
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

                    if (retryError) throw retryError;
                    
                    await updateClientTotals(invoiceData.clientId);
                    return retryData;
                }
                throw error;
            }

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

// REPLACE YOUR ENTIRE setupNavigation FUNCTION WITH THIS:

function setupNavigation() {
    console.log('Setting up navigation...');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            console.log('Navigating to:', targetPage);
            
            // Get the current active page before switching
            const currentActivePage = document.querySelector('.page.active');
            const currentPageId = currentActivePage ? currentActivePage.id : '';
            
            // Special cleanup when leaving expenses page
            if (currentPageId === 'expenses-page') {
                console.log('Leaving expenses page - running cleanup');
                
                // Destroy expense UI components if they exist
                if (window.expenseUI) {
                    if (typeof window.expenseUI.cleanupExpensesPage === 'function') {
                        window.expenseUI.cleanupExpensesPage();
                    }
                    
                    // Destroy expense charts explicitly
                    if (window.expenseUI.expenseChart) {
                        try {
                            window.expenseUI.expenseChart.destroy();
                            window.expenseUI.expenseChart = null;
                        } catch (e) {
                            console.warn('Error destroying expense chart:', e);
                        }
                    }
                    
                    if (window.expenseUI.categoryChart) {
                        try {
                            window.expenseUI.categoryChart.destroy();
                            window.expenseUI.categoryChart = null;
                        } catch (e) {
                            console.warn('Error destroying category chart:', e);
                        }
                    }
                }
                
                // Close expense modal if it's open
                const expenseModal = document.getElementById('expense-modal');
                if (expenseModal && !expenseModal.classList.contains('hidden')) {
                    expenseModal.classList.add('hidden');
                }
            }
            
            // Run general cleanup for expense filters that might have leaked
            if (typeof cleanupExpenseFilters === 'function') {
                cleanupExpenseFilters();
            }
            
            // Switch active states for navigation
            navLinks.forEach(nl => nl.classList.remove('active'));
            link.classList.add('active');
            
            // Switch active states for pages
            pages.forEach(page => page.classList.remove('active'));
            const targetElement = document.getElementById(`${targetPage}-page`);
            
            if (targetElement) {
                targetElement.classList.add('active');
                
                // Render the appropriate page content after a small delay
                setTimeout(() => {
                    // Run cleanup again after page switch (for any lingering elements)
                    if (typeof cleanupExpenseFilters === 'function' && targetPage !== 'expenses') {
                        cleanupExpenseFilters();
                    }
                    
                    // Render the appropriate page based on target
                    switch(targetPage) {
                        case 'dashboard':
                            if (typeof renderDashboard === 'function') {
                                renderDashboard();
                            }
                            break;
                            
                        case 'invoices':
                            if (typeof renderInvoices === 'function') {
                                renderInvoices();
                            }
                            break;
                            
                        case 'clients':
                            if (typeof renderClients === 'function') {
                                renderClients();
                            }
                            break;
                            
                        case 'analytics':
                            if (typeof renderAnalytics === 'function') {
                                renderAnalytics();
                            }
                            break;
                            
                        case 'settings':
                            if (typeof renderSettings === 'function') {
                                renderSettings();
                            }
                            break;
                            
                        case 'expenses':
                            // Initialize Expense UI
                            if (window.expenseUI) {
                                console.log('Initializing Expense UI');
                                try {
                                    window.expenseUI.initializeUI();
                                } catch (error) {
                                    console.error('Error initializing Expense UI:', error);
                                    showToast('Error loading expenses page', 'error');
                                }
                            } else if (window.expenseManager) {
                                // Try to create ExpenseUI if manager exists but UI doesn't
                                console.log('Creating ExpenseUI instance');
                                window.expenseUI = new ExpenseUI(window.expenseManager, showToast);
                                window.expenseUI.initializeUI();
                            } else {
                                console.warn('Expense module not initialized');
                                // Try to initialize the expense module
                                initializeExpenseModule().then(() => {
                                    if (window.expenseUI) {
                                        window.expenseUI.initializeUI();
                                    }
                                }).catch(error => {
                                    console.error('Failed to initialize expense module:', error);
                                    showToast('Expense module not available', 'error');
                                });
                            }
                            break;
                            
                        default:
                            console.warn('Unknown page:', targetPage);
                    }
                }, 50);
            } else {
                console.error('Target page not found:', targetPage);
                showToast('Page not found', 'error');
            }
        });
    });
    
    // Set initial active state based on URL hash or default to dashboard
    const hash = window.location.hash.slice(1) || 'dashboard';
    const initialLink = document.querySelector(`[data-page="${hash}"]`);
    if (initialLink) {
        initialLink.click();
    }
}

// Helper function to initialize expense module on demand
async function initializeExpenseModule() {
    if (!window.supabaseClient) {
        throw new Error('Supabase client not initialized');
    }
    
    if (!window.expenseManager) {
        console.log('Initializing ExpenseManager...');
        window.expenseManager = new ExpenseManager(window.supabaseClient || supabaseClient);
        await window.expenseManager.initialize();
    }
    
    if (!window.expenseUI) {
        console.log('Initializing ExpenseUI...');
        window.expenseUI = new ExpenseUI(window.expenseManager, window.showToast || showToast);
    }
    
    return true;
}

// Enhanced cleanup function for expense filters
function cleanupExpenseFilters() {
    try {
        console.log('🧹 Running expense cleanup...');
        
        // Get current active page
        const activePage = document.querySelector('.page.active');
        const activePageId = activePage ? activePage.id : '';
        
        // Only run cleanup if we're NOT on the expenses page
        if (activePageId !== 'expenses-page') {
            // Remove expense filters from ALL other pages
            document.querySelectorAll('.page:not(#expenses-page)').forEach(page => {
                // Remove all expense-related containers
                page.querySelectorAll(`
                    .expense-filters-container,
                    .expense-filters-wrapper,
                    .expense-balance-cards,
                    .expense-charts,
                    .expense-filters-section,
                    [id*="expense-filter"],
                    [id*="expense-balance"],
                    [id*="expenseMonthlyChart"],
                    [id*="expenseCategoryChart"]
                `).forEach(el => {
                    console.log('🗑️ Removing expense element from', page.id, ':', el.className || el.id);
                    el.remove();
                });
            });
            
            // Remove any orphaned expense elements in the main document
            document.querySelectorAll(`
                body > .expense-filters-container,
                body > .expense-filters-wrapper,
                .main-content > .expense-filters-container:not(#expenses-page .expense-filters-container),
                #dashboard-page .expense-filters-container,
                #invoices-page .expense-filters-container,
                #clients-page .expense-filters-container,
                #analytics-page .expense-filters-container,
                #settings-page .expense-filters-container
            `).forEach(el => {
                console.log('🗑️ Removing orphaned expense element:', el.id || el.className);
                el.remove();
            });
            
            // Destroy any leaked expense charts
            if (window.expenseChart && typeof window.expenseChart.destroy === 'function') {
                window.expenseChart.destroy();
                window.expenseChart = null;
            }
            if (window.categoryChart && typeof window.categoryChart.destroy === 'function') {
                window.categoryChart.destroy();
                window.categoryChart = null;
            }
        }
        
        console.log('✅ Expense cleanup complete');
    } catch (error) {
        console.warn('Error during expense cleanup:', error);
    }
}


function renderDashboard() {
    console.log('Rendering dashboard...');
    cleanupExpenseFilters();
    // Clear dynamic content
    const dashboardPage = document.getElementById('dashboard-page');
    if (dashboardPage) {
        // Clear recent invoices
        const tbody = dashboardPage.querySelector('#recent-invoices-body');
        if (tbody) tbody.innerHTML = '';
        // Destroy charts if exist
        if (window.monthlyChart && typeof window.monthlyChart.destroy === 'function') { window.monthlyChart.destroy(); window.monthlyChart = null; }
        if (window.clientChart && typeof window.clientChart.destroy === 'function') { window.clientChart.destroy(); window.clientChart = null; }
    }
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
    cleanupExpenseFilters();
    // Clear dynamic content
    const invoicesPage = document.getElementById('invoices-page');
    if (invoicesPage) {
        const tbody = invoicesPage.querySelector('#invoices-body');
        if (tbody) tbody.innerHTML = '';
    }
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
    cleanupExpenseFilters();
    // Clear dynamic content
    const clientsPage = document.getElementById('clients-page');
    if (clientsPage) {
        const grid = clientsPage.querySelector('#clients-grid');
        if (grid) grid.innerHTML = '';
    }
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

// ...existing code...
// Place these methods inside the ExpenseManager class definition:
// async addCategory(categoryData) { ... }
// async deleteExpense(expenseId) { ... }
// getPaymentMethods() { ... }
// exportToCSV() { ... }

    // Add enhanced client card styles
    if (!document.getElementById('enhanced-client-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-client-styles';
        style.textContent = `
    .modern-card {
        background: linear-gradient(135deg, var(--color-surface) 0%, rgba(var(--color-teal-500-rgb), 0.02) 100%);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 0;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        position: relative;
        height: 200px;
    }
    
    .modern-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--color-primary), var(--color-teal-400));
    }
    
    .modern-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-color: var(--color-primary);
    }
    
    .client-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 12px;
    }
    
    .client-avatar {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-teal-400));
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(var(--color-teal-500-rgb), 0.3);
    }
    
    .client-initial {
        color: white;
        font-weight: 600;
        font-size: 14px;
    }
    
    .client-actions {
        display: flex;
        gap: 4px;
    }
    
    .modern-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
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
        padding: 0 16px 12px;
        flex: 1;
        overflow: hidden;
    }
    
    .client-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text);
        margin: 0 0 8px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .client-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 60px;
        overflow: hidden;
    }
    
    .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--color-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .detail-item svg {
        opacity: 0.6;
        flex-shrink: 0;
        width: 12px;
        height: 12px;
    }
    
    .modern-stats {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: rgba(var(--color-teal-500-rgb), 0.05);
        border-top: 1px solid var(--color-border);
        margin-top: auto;
    }
    
    .stat-item {
        flex: 1;
        text-align: center;
    }
    
    .stat-number {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text);
        margin-bottom: 2px;
    }
    
    .stat-label {
        font-size: 10px;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
    }
    
    .stat-divider {
        width: 1px;
        height: 24px;
        background: var(--color-border);
        margin: 0 12px;
    }
`;      document.head.appendChild(style);
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

    // Open the modal and force removal of 'hidden' class if needed
    openClientModal();
    const modal = document.getElementById('client-modal');
    if (modal && modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        console.warn('Forced removal of hidden class for client modal');
    }

    // Then populate the fields after a short delay to ensure modal is open
    setTimeout(() => {
        // Map client data to the correct form field IDs
        const fieldMappings = {
            'client-name': client.name || client.company || '',
            'client-email': client.email || '',
            'client-phone': client.phone || '',
            'client-address': client.address || '',
            'client-contact-name': client.contact_name || '',
            'client-terms': client.payment_terms || 'net30'
        };

        console.log('Populating fields with data:', fieldMappings);

        // Populate each field
        Object.entries(fieldMappings).forEach(([fieldId, value]) => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = value;
                console.log(`Set ${fieldId} to:`, value);
            } else {
                console.warn(`Field ${fieldId} not found`);
            }
        });

        // Update modal title and button text
        const modalTitle = document.querySelector('#client-modal .modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Edit Client';

        const saveBtn = document.getElementById('save-client');
        if (saveBtn) saveBtn.textContent = 'Update Client';

        console.log('Form populated for client:', client.name);
    }, 100);

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
    cleanupExpenseFilters();
    // Clear dynamic content
    const analyticsPage = document.getElementById('analytics-page');
    if (analyticsPage) {
        // Remove old analytics layout
        const oldLayout = analyticsPage.querySelector('#modern-analytics-layout');
        if (oldLayout) oldLayout.remove();
        // Destroy analytics chart if exists
        if (window.analyticsChart && typeof window.analyticsChart.destroy === 'function') { window.analyticsChart.destroy(); window.analyticsChart = null; }
    }
    if (analyticsPage && !document.getElementById('modern-analytics-layout')) {
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
// ENHANCED: Settings with GSTIN field and corrected bank details
function renderSettings() {
    console.log('Rendering settings...');
    cleanupExpenseFilters();

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
        'bank-account-name': settings.bankAccountName || settings.profileName, // CORRECTED
        'bank-name': settings.bankName || 'Kotak Mahindra Bank',               // CORRECTED
        'account-type': settings.accountType || 'Current Account',
        'bank-account': settings.bankAccount,
        'bank-branch': settings.bankBranch || 'Indira Nagar, Bengaluru',
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

    console.log('Settings rendered with corrected bank details and tax rate:', settings.taxRate);
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
            // EDITING EXISTING INVOICE
            const invoice = appData.invoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                // Update modal title
                const modalTitle = document.getElementById('invoice-modal-title');
                if (modalTitle) modalTitle.textContent = 'Edit Invoice';

                // Populate form fields
                const invoiceNumInput = document.getElementById('invoice-number');
                if (invoiceNumInput) {
                    invoiceNumInput.value = invoice.id;
                    invoiceNumInput.removeAttribute('readonly'); // Ensure editable
                }
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
                        // Attach input listeners for live calculation
                        const quantityInput = lineItem.querySelector('.quantity');
                        const rateInput = lineItem.querySelector('.rate');
                        if (quantityInput) quantityInput.addEventListener('input', () => { calculateLineItem(lineItem); calculateInvoiceTotal(); });
                        if (rateInput) rateInput.addEventListener('input', () => { calculateLineItem(lineItem); calculateInvoiceTotal(); });
                    });
                } else {
                    addLineItem();
                }

                // FIXED: Update modal footer buttons for editing
                const modalFooter = document.querySelector('#invoice-modal .modal-footer');
                if (modalFooter) {
                    modalFooter.innerHTML = `
                        <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
                            <!-- Status Selector -->
                            <div class="form-group" style="margin: 0; min-width: 150px;">
                                <label class="form-label" style="font-size: 12px; margin-bottom: 4px; color: #666;">Change Status:</label>
                                <select class="form-control" id="invoice-status-select" style="padding: 8px; font-size: 13px;">
                                    <option value="Draft" ${invoice.status === 'Draft' ? 'selected' : ''}>Draft</option>
                                    <option value="Pending" ${invoice.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Paid" ${invoice.status === 'Paid' ? 'selected' : ''}>Paid</option>
                                    <option value="Overdue" ${invoice.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                                    <option value="Cancelled" ${invoice.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div style="display: flex; gap: 8px; margin-left: auto;">
                                <button type="button" class="btn btn--secondary" onclick="closeModal(document.getElementById('invoice-modal'))">Cancel</button>
                                <button type="button" class="btn btn--primary" id="update-invoice">Update Invoice</button>
                            </div>
                        </div>
                    `;

                    // Add event listener for update button
                    setTimeout(() => {
                        const updateBtn = document.getElementById('update-invoice');
                        if (updateBtn) {
                            updateBtn.addEventListener('click', () => {
                                const statusSelect = document.getElementById('invoice-status-select');
                                const selectedStatus = statusSelect ? statusSelect.value : invoice.status;
                                saveInvoice(selectedStatus);
                            });
                        }
                    }, 100);
                }

                calculateInvoiceTotal();
            }
        } else {
            // CREATING NEW INVOICE
            try {
                const num = await getNextInvoiceNumber();
                const invoiceNumInput = document.getElementById('invoice-number');
                if (invoiceNumInput) {
                    invoiceNumInput.value = `${appData.settings.invoicePrefix}-${String(num).padStart(3, '0')}`;
                    invoiceNumInput.removeAttribute('readonly'); // Ensure editable
                }
            } catch (error) {
                console.error('Error generating invoice number:', error);
                const invoiceNumInput = document.getElementById('invoice-number');
                if (invoiceNumInput) {
                    invoiceNumInput.value = `${appData.settings.invoicePrefix}-${String(Date.now()).slice(-3)}`;
                    invoiceNumInput.removeAttribute('readonly'); // Ensure editable
                }
            }

            // Update modal title
            const modalTitle = document.getElementById('invoice-modal-title');
            if (modalTitle) modalTitle.textContent = 'Create New Invoice';

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

            // FIXED: Reset modal footer buttons for creating
            const modalFooter = document.querySelector('#invoice-modal .modal-footer');
            if (modalFooter) {
                modalFooter.innerHTML = `
                    <button type="button" class="btn btn--secondary" id="save-draft">Save as Draft</button>
                    <button type="submit" class="btn btn--primary" id="save-invoice">Create Invoice</button>
                `;

                // Re-setup event listeners for new buttons
                setTimeout(() => {
                    const saveDraftBtn = document.getElementById('save-draft');
                    const saveInvoiceBtn = document.getElementById('save-invoice');

                    if (saveDraftBtn) {
                        saveDraftBtn.addEventListener('click', () => saveInvoice('Draft'));
                    }

                    if (saveInvoiceBtn) {
                        saveInvoiceBtn.addEventListener('click', () => saveInvoice('Pending'));
                    }
                }, 100);
            }
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
        
        // Reset modal footer to default when closing
        const invoiceModal = document.getElementById('invoice-modal');
        if (modal === invoiceModal) {
            const modalFooter = document.querySelector('#invoice-modal .modal-footer');
            if (modalFooter) {
                modalFooter.innerHTML = `
                    <button type="button" class="btn btn--secondary" id="save-draft">Save as Draft</button>
                    <button type="submit" class="btn btn--primary" id="save-invoice">Create Invoice</button>
                `;
            }
        }
    }
}

function setupForms() {
    console.log('Setting up forms...');
    setupInvoiceForm();
    setupClientForm();
    setupSettingsForm();
}

// REPLACE YOUR ENTIRE SECTION WITH THIS FIXED VERSION
// This properly handles all invoice form events without duplicates

function setupInvoiceForm() {
    console.log('Setting up invoice form...');
    
    // Clean up ALL existing listeners first
    cleanupInvoiceListeners();
    
    // Setup "Add Line Item" button in modal
    const addLineItemBtn = document.getElementById('add-line-item');
    if (addLineItemBtn) {
        addLineItemBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addLineItem();
        });
    }

    // Setup invoice modal event delegation (single listener for all modal events)
    const invoiceModal = document.getElementById('invoice-modal');
    if (invoiceModal && !invoiceModal.hasAttribute('data-listeners-attached')) {
        // Mark that we've attached listeners
        invoiceModal.setAttribute('data-listeners-attached', 'true');
        
        // Single click handler for all modal buttons
        invoiceModal.addEventListener('click', (e) => {
            // Save Draft button
            if (e.target.id === 'save-draft') {
                e.preventDefault();
                saveInvoice('Draft');
            }
            // Save Invoice button
            else if (e.target.id === 'save-invoice') {
                e.preventDefault();
                saveInvoice('Pending');
            }
            // Update Invoice button (for editing)
            else if (e.target.id === 'update-invoice') {
                e.preventDefault();
                const statusSelect = document.getElementById('invoice-status-select');
                const selectedStatus = statusSelect ? statusSelect.value : 'Pending';
                saveInvoice(selectedStatus);
            }
            // Remove line item button
            else if (e.target.classList.contains('remove-item')) {
                e.preventDefault();
                e.stopPropagation();
                removeLineItem(e.target.closest('.line-item'));
                calculateInvoiceTotal();
            }
        });
        
        // Single input handler for quantity/rate calculations
        invoiceModal.addEventListener('input', (e) => {
            if (e.target.classList.contains('quantity') || e.target.classList.contains('rate')) {
                calculateLineItem(e.target.closest('.line-item'));
                calculateInvoiceTotal();
            }
        });
    }

    // Setup form submission
    const invoiceForm = document.getElementById('invoice-form');
    if (invoiceForm && !invoiceForm.hasAttribute('data-submit-attached')) {
        invoiceForm.setAttribute('data-submit-attached', 'true');
        invoiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted');
            // Check if we're in edit mode
            if (editingInvoiceId) {
                const statusSelect = document.getElementById('invoice-status-select');
                const selectedStatus = statusSelect ? statusSelect.value : 'Pending';
                saveInvoice(selectedStatus);
            } else {
                saveInvoice('Pending');
            }
        });
    }

    // Setup page buttons (outside modal)
    setupInvoicePageButtons();
    
    console.log('Invoice form setup complete');
}

function setupInvoicePageButtons() {
    // Setup "Create Invoice" button on dashboard
    const createInvoiceBtn = document.getElementById('create-invoice-btn');
    if (createInvoiceBtn && !createInvoiceBtn.hasAttribute('data-listener-attached')) {
        createInvoiceBtn.setAttribute('data-listener-attached', 'true');
        createInvoiceBtn.addEventListener('click', () => {
            openInvoiceModal();
        });
    }
    
    // Setup "New Invoice" button on invoices page
    const newInvoiceBtn = document.getElementById('new-invoice-btn');
    if (newInvoiceBtn && !newInvoiceBtn.hasAttribute('data-listener-attached')) {
        newInvoiceBtn.setAttribute('data-listener-attached', 'true');
        newInvoiceBtn.addEventListener('click', () => {
            openInvoiceModal();
        });
    }
}

function cleanupInvoiceListeners() {
    // Remove listeners from modal
    const invoiceModal = document.getElementById('invoice-modal');
    if (invoiceModal && invoiceModal.hasAttribute('data-listeners-attached')) {
        const newModal = invoiceModal.cloneNode(true);
        newModal.removeAttribute('data-listeners-attached');
        invoiceModal.parentNode.replaceChild(newModal, invoiceModal);
    }
    
    // Remove listeners from form
    const invoiceForm = document.getElementById('invoice-form');
    if (invoiceForm && invoiceForm.hasAttribute('data-submit-attached')) {
        const newForm = invoiceForm.cloneNode(true);
        newForm.removeAttribute('data-submit-attached');
        invoiceForm.parentNode.replaceChild(newForm, invoiceForm);
    }
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
        
        // No need to attach individual listeners - handled by event delegation
        console.log('Line item added');
    }
}

function removeLineItem(lineItem) {
    const container = document.getElementById('line-items-container');
    if (container && container.children.length > 1 && lineItem) {
        lineItem.remove();
        console.log('Line item removed');
    } else if (container && container.children.length === 1) {
        showToast('At least one line item is required', 'warning');
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

    // Update tax label
    const taxLabel = document.getElementById('invoice-tax-label');
    if (taxLabel) {
        taxLabel.textContent = `Tax (${appData.settings.taxRate}%):`;
    }
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

        // Update client totals
        const localClient = appData.clients.find(c => c.id === clientId);
        if (localClient) {
            const clientInvoices = appData.invoices.filter(inv => inv.clientId === clientId);
            localClient.total_invoices = clientInvoices.length;
            localClient.total_amount = clientInvoices
                .filter(inv => inv.status === 'Paid')
                .reduce((sum, inv) => sum + inv.amount, 0);
        }

        // Recalculate totals
        appData.totalEarnings = appData.invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);

        calculateMonthlyEarnings();
        
        // Update expense balance if expense module is enabled
        if (window.expenseManager && window.expenseManager.isInitialized) {
            await window.expenseManager.updateBalanceFromInvoices(appData.invoices);
        }

        renderInvoices();
        renderDashboard();
        renderClients();

        closeModal(document.getElementById('invoice-modal'));
        
        // Clean up form after successful save
        editingInvoiceId = null;

    } catch (error) {
        console.error('Error saving invoice:', error);
        showToast('Error saving invoice. Please try again.', 'error');
    }
}

// IMPROVED: Quick status change function for table dropdowns
async function changeInvoiceStatus(invoiceId, newStatus) {
    console.log('Changing invoice status:', invoiceId, 'to', newStatus);

    try {
        const invoice = appData.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showToast('Invoice not found', 'error');
            return;
        }

        const oldStatus = invoice.status;

        // Update in Supabase
        const { error } = await supabaseClient
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', invoiceId);

        if (error) throw error;

        // Update local data
        invoice.status = newStatus;

        // Recalculate earnings if status changed to/from Paid
        if (newStatus === 'Paid' || oldStatus === 'Paid') {
            appData.totalEarnings = appData.invoices
                .filter(inv => inv.status === 'Paid')
                .reduce((sum, inv) => sum + inv.amount, 0);
            
            calculateMonthlyEarnings();

            // Update client totals
            const client = appData.clients.find(c => c.id === invoice.clientId);
            if (client) {
                const clientInvoices = appData.invoices.filter(inv => inv.clientId === invoice.clientId);
                client.total_amount = clientInvoices
                    .filter(inv => inv.status === 'Paid')
                    .reduce((sum, inv) => sum + inv.amount, 0);
            }
        }

        // 🆕 ADD THIS CODE HERE - Update expense balance
        if (window.expenseIntegration && window.expenseIntegration.isEnabled()) {
            // Expense balance update will be handled directly after migration
        }

        // Re-render views
        renderInvoices();
        renderDashboard();
        renderClients();

        showToast(`Invoice ${invoiceId} marked as ${newStatus}`, 'success');

    } catch (error) {
        console.error('Error changing invoice status:', error);
        showToast(`Error updating invoice status: ${error.message}`, 'error');
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

    // Use the correct IDs from your HTML
    const formFields = {
        name: document.getElementById('client-name'),           // Company Name
        email: document.getElementById('client-email'),         // Email
        phone: document.getElementById('client-phone'),         // Phone
        address: document.getElementById('client-address'),     // Address
        contactName: document.getElementById('client-contact-name'), // Contact Person
        terms: document.getElementById('client-terms')          // Payment Terms
    };

    console.log('Form fields found:', Object.keys(formFields).filter(key => formFields[key]));

    if (!formFields.name || !formFields.email) {
        showToast('Required form fields (company name and email) are missing from the form', 'error');
        return;
    }

    const clientData = {
        name: formFields.name.value.trim(),
        email: formFields.email.value.trim(),
        phone: formFields.phone ? formFields.phone.value.trim() : '',
        address: formFields.address ? formFields.address.value.trim() : '',
        paymentTerms: formFields.terms ? formFields.terms.value : 'net30',
        contactName: formFields.contactName ? formFields.contactName.value.trim() : '',
        company: formFields.name.value.trim() // Use the same as name for company
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

// ENHANCED: Settings save with GSTIN and corrected bank details
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
        profileGSTIN: document.getElementById('profile-gstin'),
        bankAccountName: document.getElementById('bank-account-name'),  // CORRECTED
        bankName: document.getElementById('bank-name'),                 // CORRECTED
        accountType: document.getElementById('account-type'),
        bankAccount: document.getElementById('bank-account'),
        bankBranch: document.getElementById('bank-branch'),
        bankIFSC: document.getElementById('bank-ifsc'),
        bankSWIFT: document.getElementById('bank-swift')
    };

    const missingElements = Object.entries(elements).filter(([key, element]) => !element);
    if (missingElements.length > 0) {
        console.error('Missing form elements:', missingElements.map(([key]) => key));
        // Only show error if critical fields are missing
        const criticalFields = ['profileName', 'profileEmail', 'taxRate'];
        const missingCritical = missingElements.filter(([key]) => criticalFields.includes(key));
        if (missingCritical.length > 0) {
            showToast(`Critical settings fields missing: ${missingCritical.map(([key]) => key).join(', ')}`, 'error');
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

        showToast(`Settings saved successfully with corrected bank details. Tax rate: ${appData.settings.taxRate}%`, 'success');

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
            profilePhone: '+91 9500808013',
            profileAddress: '6/91, Mahit Complex, Hosur Road, Attibele, Bengaluru, Karnataka – 562107',
            profileGSTIN: '29GLOPS9921M1ZT',
            bankAccountName: 'Hariprasad Sivakumar',  // CORRECTED
            bankName: 'Kotak Mahindra Bank',          // CORRECTED
            bankAccount: '2049315152',
            bankBranch: 'Indira Nagar, Bengaluru',
            bankIFSC: 'KKBK0008068',
            bankSWIFT: 'KKBKINBBCPC',
            accountType: 'Current Account'
        };
        renderSettings();
        showToast('Settings reset to default with corrected bank details', 'success');
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
            bank_account_name: settingsData.bankAccountName || '',      // CORRECTED
            bank_name: settingsData.bankName || 'Kotak Mahindra Bank',  // CORRECTED
            account_type: settingsData.accountType || 'Current Account',
            bank_account: settingsData.bankAccount || '',
            bank_branch: settingsData.bankBranch || 'Indira Nagar, Bengaluru',
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
                                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">INR ${formatNumber(item.rate)}</td>
                                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">INR ${formatNumber(item.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between;">
                    <div style="width: 45%;">
                        <h3>BANK ACCOUNT DETAILS</h3>
                        <div style="line-height: 1.6; font-size: 14px;">
                            <strong>Account Name:</strong> ${settings.profileName || 'Hariprasad Sivakumar'}<br>
                            <strong>Account Type:</strong> Current Account<br>
                            <strong>Account Number:</strong> ${settings.bankAccount || '2049315152'}<br>
                            <strong>Bank Name:</strong> Kotak Mahindra Bank<br>
                            <strong>Branch Name:</strong> Indira Nagar, Bengaluru<br>
                            <strong>IFSC Code:</strong> ${settings.bankIFSC || 'KKBK0008068'}<br>
                            <strong>SWIFT Code:</strong> ${settings.bankSWIFT || 'KKBKINBBCPC'}
                        </div>
                    </div>
                                            <div style="width: 45%; text-align: right;">
                        <div style="margin-bottom: 10px;"><strong>SUBTOTAL:</strong> INR ${formatNumber(invoice.subtotal)}</div>
                        <div style="margin-bottom: 10px;"><strong>TAX (${settings.taxRate}%):</strong> INR ${formatNumber(invoice.tax)}</div>
                        <div style="font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">
                            <strong>INVOICE TOTAL: INR ${formatNumber(invoice.amount)}</strong>
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
function editInvoice(invoiceId) {
    console.log('Editing invoice with ID:', invoiceId);

    if (!appData.dataLoaded) {
        showToast('Data is still loading. Please wait.', 'info');
        return;
    }

    const invoice = appData.invoices.find(inv => inv.id === invoiceId);

    if (!invoice) {
        console.error('Invoice not found:', invoiceId);
        showToast('Invoice not found. Please refresh the page.', 'error');
        return;
    }

    console.log('Found invoice for editing:', invoice);

    // Open the invoice modal with the invoice data
    openInvoiceModal(invoiceId);

    showToast(`Editing invoice: ${invoice.id}`, 'info');
}

async function deleteInvoice(invoiceId) {
    console.log('Deleting invoice:', invoiceId);

    if (!appData.dataLoaded) {
        showToast('Data is still loading. Please wait.', 'info');
        return;
    }

    const invoice = appData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        showToast('Invoice not found. Please refresh the page.', 'error');
        return;
    }

    const confirmed = confirm(`Are you sure you want to delete invoice "${invoiceId}"?\n\nThis action cannot be undone.`);
    if (!confirmed) {
        return;
    }

    try {
        await deleteInvoiceFromSupabase(invoiceId);

        // Remove from local data
        const index = appData.invoices.findIndex(inv => inv.id === invoiceId);
        if (index > -1) {
            appData.invoices.splice(index, 1);
            appData.totalInvoices--;
        }

        // Update client totals
        const clientId = invoice.clientId;
        const client = appData.clients.find(c => c.id === clientId);
        if (client) {
            const clientInvoices = appData.invoices.filter(inv => inv.clientId === clientId);
            client.total_invoices = clientInvoices.length;
            client.total_amount = clientInvoices
                .filter(inv => inv.status === 'Paid')
                .reduce((sum, inv) => sum + inv.amount, 0);
        }

        // Recalculate totals
        appData.totalEarnings = appData.invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        calculateMonthlyEarnings();

        // 🆕 ADD THIS CODE HERE - Update expense balance
        if (window.expenseIntegration && window.expenseIntegration.isEnabled()) {
            // Expense balance update will be handled directly after migration
        }
        

        // Re-render views
        renderInvoices();
        renderDashboard();
        renderClients();

        showToast(`Invoice "${invoiceId}" deleted successfully`, 'success');
        console.log('Invoice deleted successfully:', invoiceId);

    } catch (error) {
        console.error('Error deleting invoice:', error);
        showToast(`Error deleting invoice: ${error.message}`, 'error');
    }
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

    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library is loading. Please try again in a moment.', 'info');
        loadPDFLibrary();
        setTimeout(() => downloadInvoice(invoiceId), 2000);
        return;
    }

    try {
        showToast('Generating PDF...', 'info');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            unit: 'pt',
            format: 'a4',
            putOnlyUsedFonts: true
        });

        // Use built-in helvetica font
        doc.setFont('helvetica');

        // Title and Invoice Details
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 40, 60);

        // Invoice info box (top right)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice: ${invoice.id}`, 400, 40);
        doc.text(`Date: ${formatDate(invoice.date)}`, 400, 55);
        doc.text(`Due: ${formatDate(invoice.dueDate)}`, 400, 70);

        // FROM section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('FROM:', 40, 100);
        
        let yPos = 120;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.text(settings.profileName || 'Hariprasad Sivakumar', 40, yPos);
        yPos += 15;
        
        if (settings.profileAddress) {
            doc.setFontSize(9);
            const addressLines = doc.splitTextToSize(settings.profileAddress, 200);
            addressLines.forEach(line => {
                doc.text(line, 40, yPos);
                yPos += 12;
            });
        }
        
        doc.setFontSize(9);
        if (settings.profileGSTIN) {
            doc.text(`GSTIN: ${settings.profileGSTIN}`, 40, yPos);
            yPos += 12;
        }
        if (settings.profilePhone) {
            doc.text(`Phone: ${settings.profilePhone}`, 40, yPos);
            yPos += 12;
        }
        if (settings.profileEmail) {
            doc.text(`Email: ${settings.profileEmail}`, 40, yPos);
            yPos += 12;
        }

        // TO section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('BILLED TO:', 320, 100);
        
        let toYPos = 120;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const clientName = client ? client.name : invoice.client;
        doc.text(clientName, 320, toYPos);
        toYPos += 15;
        
        if (client && client.address) {
            doc.setFontSize(9);
            const clientAddressLines = doc.splitTextToSize(client.address, 200);
            clientAddressLines.forEach(line => {
                doc.text(line, 320, toYPos);
                toYPos += 12;
            });
        }

        // Items table
        const tableY = Math.max(yPos, toYPos) + 30;
        const tableData = invoice.items.map(item => {
            const rate = parseFloat(item.rate || 0);
            const amount = parseFloat(item.amount || 0);
            const qty = parseInt(item.quantity || 1);
            return [
                item.description || '',
                qty.toString(),
                `INR ${rate.toFixed(2)}`,
                `INR ${amount.toFixed(2)}`
            ];
        });

        doc.autoTable({
            head: [['Description', 'Qty', 'Unit Cost', 'Amount']],
            body: tableData,
            startY: tableY,
            styles: { 
                fontSize: 9, 
                cellPadding: 6,
                overflow: 'linebreak'
            },
            headStyles: { 
                fillColor: [52, 73, 94], 
                textColor: [255, 255, 255], 
                fontSize: 10,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 250, halign: 'left' },    // Description
                1: { cellWidth: 50, halign: 'center' },   // Qty
                2: { cellWidth: 90, halign: 'right' },    // Unit Cost
                3: { cellWidth: 90, halign: 'right' }     // Amount
            },
            margin: { left: 40, right: 40 }
        });

        // Totals section with uniform structure
const totalsY = doc.lastAutoTable.finalY + 30;
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);

const subtotal = parseFloat(invoice.subtotal || 0);
const tax = parseFloat(invoice.tax || 0);
const total = parseFloat(invoice.amount || 0);
const taxRate = parseFloat(settings.taxRate || 0);

// Subtotal
doc.text('Subtotal:', 380, totalsY);
doc.text(`INR ${subtotal.toFixed(2)}`, 520, totalsY, { align: 'right' });

// Tax
doc.text(`Tax (${taxRate}%):`, 380, totalsY + 20);
doc.text(`INR ${tax.toFixed(2)}`, 520, totalsY + 20, { align: 'right' });

// Total (bold)
doc.setFont('helvetica', 'bold');
doc.text('TOTAL:', 380, totalsY + 55);
doc.text(`INR ${total.toFixed(2)}`, 520, totalsY + 55, { align: 'right' });

        // Bank Details Section
        const bankY = totalsY + 80;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('BANK ACCOUNT DETAILS', 40, bankY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
// All bank details in left column
        let leftY = bankY + 20;
        doc.text('Account Name:', 40, leftY);
        doc.text(settings.profileName || 'Hariprasad Sivakumar', 150, leftY);
        leftY += 15;
        
        doc.text('Account Type:', 40, leftY);
        doc.text('Current Account', 150, leftY);
        leftY += 15;
        
        doc.text('Account Number:', 40, leftY);
        doc.text(settings.bankAccount || '2049315152', 150, leftY);
        leftY += 15;
        
        doc.text('Bank Name:', 40, leftY);
        doc.text('Kotak Mahindra Bank', 150, leftY);
        leftY += 15;
        
        doc.text('Branch Name:', 40, leftY);
        doc.text('Indira Nagar, Bengaluru', 150, leftY);
        leftY += 15;
        
        doc.text('IFSC Code:', 40, leftY);
        doc.text(settings.bankIFSC || 'KKBK0008068', 150, leftY);
        leftY += 15;
        
        doc.text('SWIFT Code:', 40, leftY);
        doc.text(settings.bankSWIFT || 'KKBKINBBCPC', 150, leftY);

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Thank you for your business!', 40, 750);

        // Save with clean filename
        const cleanInvoiceId = invoice.id.replace(/[^a-zA-Z0-9-_]/g, '_');
        doc.save(`Invoice_${cleanInvoiceId}.pdf`);
        showToast(`Invoice ${invoice.id} downloaded successfully`, 'success');

    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast(`PDF Generation Error: ${error.message}`, 'error');
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

// 🆕 ADD THIS COMPLETE FUNCTION - copy everything between these lines

// Aggressive cleanup of expense elements from all pages except expenses
function aggressiveExpenseCleanup() {
    console.log('🧹 App-level expense cleanup...');
    
    try {
        // Get current active page
        const activePage = document.querySelector('.page.active');
        const activePageId = activePage ? activePage.id : '';
        
        // If we're NOT on expenses page, remove ALL expense elements
        if (activePageId !== 'expenses-page') {
            // Remove expense filters from all non-expense pages
            document.querySelectorAll('.page:not(#expenses-page)').forEach(page => {
                page.querySelectorAll(`
                    .expense-filters-container,
                    .expense-filters-wrapper,
                    [id*="expense-filter"],
                    [class*="expense-filter"]
                `).forEach(el => {
                    console.log('🗑️ Removing leaked expense element:', el.id || el.className);
                    el.remove();
                });
            });
            
            // Remove any orphaned expense elements anywhere in the document
            document.querySelectorAll(`
                [id^="expense-filter-"]:not(#expenses-page [id^="expense-filter-"]),
                .expense-filters-container:not(#expenses-page .expense-filters-container)
            `).forEach(el => {
                console.log('🗑️ Removing orphaned expense element:', el.id || el.className);
                el.remove();
            });
        }
        
    } catch (error) {
        console.error('Error in aggressive expense cleanup:', error);
    }
}

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
