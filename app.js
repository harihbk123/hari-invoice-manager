// INVOICE MANAGER - CLEAN WORKING VERSION
// Simplified and functional implementation

class InvoiceApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.expenses = [];
        this.clients = [];
        this.invoices = [];
        this.currentExpenseId = null;
        
        // Initialize Supabase with modern syntax
        const supabaseUrl = 'https://xbfnyrbwwavnlmwkkkjo.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZm55cmJ3d2F2bmxtd2tra2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NDkwMzQsImV4cCI6MjA1MDEyNTAzNH0.3k-4jn5ZNbm0Ep6Np8gJbJTjxR5IWM1-TsttU9eZUv8';
        
        if (window.supabase && window.supabase.createClient) {
            try {
                this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                });
            } catch (error) {
                console.warn('Supabase initialization failed:', error);
                this.supabase = null;
            }
        }
    }

    async initialize() {
        console.log('Initializing Invoice Manager...');
        
        // Load sample data
        this.loadSampleData();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show dashboard
        this.showPage('dashboard');
        
        console.log('Invoice Manager initialized successfully');
    }

    loadSampleData() {
        // Sample expenses
        this.expenses = [
            {
                id: '1',
                amount: 45.50,
                description: 'Office supplies',
                category: 'Office',
                date: '2025-08-10',
                payment_method: 'Card'
            },
            {
                id: '2',
                amount: 120.00,
                description: 'Team lunch',
                category: 'Food',
                date: '2025-08-09',
                payment_method: 'Cash'
            },
            {
                id: '3',
                amount: 25.75,
                description: 'Taxi to client meeting',
                category: 'Transport',
                date: '2025-08-08',
                payment_method: 'UPI'
            }
        ];

        // Sample clients
        this.clients = [
            {
                id: '1',
                name: 'ABC Corporation',
                email: 'contact@abc-corp.com',
                phone: '+1-555-0123'
            },
            {
                id: '2',
                name: 'XYZ Enterprises',
                email: 'hello@xyz-ent.com',
                phone: '+1-555-0456'
            }
        ];

        // Sample invoices
        this.invoices = [
            {
                id: '1',
                client_id: '1',
                invoice_number: 'INV-2025-001',
                amount: 2500.00,
                status: 'paid',
                due_date: '2025-08-15'
            },
            {
                id: '2',
                client_id: '2',
                invoice_number: 'INV-2025-002',
                amount: 1750.00,
                status: 'pending',
                due_date: '2025-08-20'
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

    setupEventListeners() {
        // Add expense button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-expense-btn') {
                this.openAddExpenseModal();
            }
            
            if (e.target.classList.contains('edit-expense-btn')) {
                const expenseId = e.target.dataset.id;
                this.openEditExpenseModal(expenseId);
            }
            
            if (e.target.classList.contains('delete-expense-btn')) {
                const expenseId = e.target.dataset.id;
                this.deleteExpense(expenseId);
            }
            
            if (e.target.id === 'export-expenses-btn') {
                this.exportExpensesToCSV();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'expense-form') {
                e.preventDefault();
                this.handleExpenseSubmit();
            }
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
                this.closeModal();
            }
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

        // Render page content
        if (page === 'dashboard') {
            this.renderDashboard();
        } else if (page === 'expenses') {
            this.renderExpensesPage();
        } else if (page === 'invoices') {
            this.renderInvoicesPage();
        } else if (page === 'clients') {
            this.renderClientsPage();
        }
    }

    renderDashboard() {
        const dashboardPage = document.getElementById('dashboard-page');
        if (!dashboardPage) return;

        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalInvoices = this.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

        dashboardPage.innerHTML = `
            <div class="page-header">
                <h1>📊 Dashboard</h1>
            </div>
            
            <div class="dashboard-stats">
                <div class="stat-card">
                    <h3>Total Clients</h3>
                    <div class="stat-value">${this.clients.length}</div>
                </div>
                <div class="stat-card">
                    <h3>Total Invoices</h3>
                    <div class="stat-value">${this.invoices.length}</div>
                    <div class="stat-detail">$${totalInvoices.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <h3>Total Expenses</h3>
                    <div class="stat-value">${this.expenses.length}</div>
                    <div class="stat-detail">$${totalExpenses.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <h3>Net Income</h3>
                    <div class="stat-value">$${(totalInvoices - totalExpenses).toFixed(2)}</div>
                </div>
            </div>
            
            <div class="recent-activity">
                <h2>Recent Activity</h2>
                <div class="activity-grid">
                    <div class="activity-section">
                        <h3>Latest Expenses</h3>
                        <div class="activity-list">
                            ${this.expenses.slice(0, 3).map(expense => `
                                <div class="activity-item">
                                    <span>${expense.description}</span>
                                    <span>$${expense.amount.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="activity-section">
                        <h3>Latest Invoices</h3>
                        <div class="activity-list">
                            ${this.invoices.slice(0, 3).map(invoice => `
                                <div class="activity-item">
                                    <span>${invoice.invoice_number}</span>
                                    <span>$${invoice.amount.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderExpensesPage() {
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

            <div class="expenses-summary">
                <div class="summary-card">
                    <h3>Total Expenses</h3>
                    <div class="summary-value">$${this.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <h3>This Month</h3>
                    <div class="summary-value">${this.expenses.length}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
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
                    <tbody>
                        ${this.expenses.map(expense => `
                            <tr>
                                <td>${expense.date}</td>
                                <td>${expense.description}</td>
                                <td>${expense.category}</td>
                                <td>$${expense.amount.toFixed(2)}</td>
                                <td>${expense.payment_method}</td>
                                <td>
                                    <button class="btn btn--sm edit-expense-btn" data-id="${expense.id}">Edit</button>
                                    <button class="btn btn--sm btn--danger delete-expense-btn" data-id="${expense.id}">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Add/Edit Expense Modal -->
            <div id="expense-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modal-title">Add Expense</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <form id="expense-form">
                        <div class="form-group">
                            <label for="expense-amount">Amount *</label>
                            <input type="number" id="expense-amount" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="expense-description">Description *</label>
                            <input type="text" id="expense-description" required>
                        </div>
                        <div class="form-group">
                            <label for="expense-category">Category *</label>
                            <select id="expense-category" required>
                                <option value="">Select Category</option>
                                <option value="Office">Office</option>
                                <option value="Food">Food</option>
                                <option value="Transport">Transport</option>
                                <option value="Technology">Technology</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="expense-date">Date *</label>
                            <input type="date" id="expense-date" required>
                        </div>
                        <div class="form-group">
                            <label for="expense-payment">Payment Method *</label>
                            <select id="expense-payment" required>
                                <option value="">Select Payment Method</option>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="UPI">UPI</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn--secondary close-modal">Cancel</button>
                            <button type="submit" class="btn btn--primary">Save Expense</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    renderInvoicesPage() {
        const invoicesPage = document.getElementById('invoices-page');
        if (!invoicesPage) return;

        invoicesPage.innerHTML = `
            <div class="page-header">
                <h1>📋 Invoice Management</h1>
                <button class="btn btn--primary">+ Create Invoice</button>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Client</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.invoices.map(invoice => {
                            const client = this.clients.find(c => c.id === invoice.client_id);
                            return `
                                <tr>
                                    <td>${invoice.invoice_number}</td>
                                    <td>${client ? client.name : 'Unknown'}</td>
                                    <td>$${invoice.amount.toFixed(2)}</td>
                                    <td><span class="status status--${invoice.status}">${invoice.status}</span></td>
                                    <td>${invoice.due_date}</td>
                                    <td>
                                        <button class="btn btn--sm">View</button>
                                        <button class="btn btn--sm">Edit</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderClientsPage() {
        const clientsPage = document.getElementById('clients-page');
        if (!clientsPage) return;

        clientsPage.innerHTML = `
            <div class="page-header">
                <h1>👥 Client Management</h1>
                <button class="btn btn--primary">+ Add Client</button>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.clients.map(client => `
                            <tr>
                                <td>${client.name}</td>
                                <td>${client.email}</td>
                                <td>${client.phone}</td>
                                <td>
                                    <button class="btn btn--sm">Edit</button>
                                    <button class="btn btn--sm btn--danger">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    openAddExpenseModal() {
        this.currentExpenseId = null;
        document.getElementById('modal-title').textContent = 'Add Expense';
        document.getElementById('expense-form').reset();
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('expense-modal').style.display = 'block';
    }

    openEditExpenseModal(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) return;

        this.currentExpenseId = expenseId;
        document.getElementById('modal-title').textContent = 'Edit Expense';
        
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-description').value = expense.description;
        document.getElementById('expense-category').value = expense.category;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-payment').value = expense.payment_method;
        
        document.getElementById('expense-modal').style.display = 'block';
    }

    handleExpenseSubmit() {
        const formData = {
            amount: parseFloat(document.getElementById('expense-amount').value),
            description: document.getElementById('expense-description').value,
            category: document.getElementById('expense-category').value,
            date: document.getElementById('expense-date').value,
            payment_method: document.getElementById('expense-payment').value
        };

        if (this.currentExpenseId) {
            // Update existing expense
            const index = this.expenses.findIndex(e => e.id === this.currentExpenseId);
            if (index !== -1) {
                this.expenses[index] = { ...this.expenses[index], ...formData };
                showToast('Expense updated successfully!', 'success');
            }
        } else {
            // Add new expense
            const newExpense = {
                id: Date.now().toString(),
                ...formData
            };
            this.expenses.unshift(newExpense);
            showToast('Expense added successfully!', 'success');
        }

        this.closeModal();
        this.renderExpensesPage();
    }

    deleteExpense(expenseId) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(e => e.id !== expenseId);
            showToast('Expense deleted successfully!', 'success');
            this.renderExpensesPage();
        }
    }

    closeModal() {
        const modal = document.getElementById('expense-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentExpenseId = null;
    }

    exportExpensesToCSV() {
        const csvContent = [
            ['Date', 'Description', 'Category', 'Amount', 'Payment Method'],
            ...this.expenses.map(expense => [
                expense.date,
                expense.description,
                expense.category,
                expense.amount,
                expense.payment_method
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showToast('Expenses exported successfully!', 'success');
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
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Starting Invoice Manager Application...');
        
        // Suppress browser extension warnings
        if (window.chrome && window.chrome.runtime) {
            window.chrome.runtime.onMessage = window.chrome.runtime.onMessage || (() => {});
        }
        
        const app = new InvoiceApp();
        await app.initialize();
        
        // Make app globally available
        window.invoiceApp = app;
        
        console.log('Invoice Manager Application started successfully');
        showToast('Application loaded successfully!', 'success');
    } catch (error) {
        console.error('Failed to start application:', error);
        showToast('Failed to start application: ' + error.message, 'error');
    }
});
