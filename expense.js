// EXPENSE MANAGEMENT MODULE - expense.js
// Independent module for expense tracking and management

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
        
        // Expense state for filters
        this.expenseState = {
            currentPeriod: 'monthly',
            selectedCategory: 'all',
            dateRange: { from: null, to: null },
            filteredData: null
        };
    }

    // Initialize the expense manager
    async initialize() {
        try {
            console.log('Initializing Expense Manager...');
            await this.loadExpenseCategories();
            await this.loadExpenses();
            await this.loadBalanceSummary();
            this.isInitialized = true;
            console.log('Expense Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Expense Manager:', error);
            return false;
        }
    }

    // Load expense categories from Supabase
    async loadExpenseCategories() {
        try {
            const { data: categories, error } = await this.supabaseClient
                .from('expense_categories')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            this.categories = (categories || []).map(cat => ({
                id: cat.id,
                name: cat.name,
                description: cat.description || '',
                icon: cat.icon || '💰',
                color: cat.color || '#6B7280',
                isDefault: cat.is_default || false
            }));

            console.log('Expense categories loaded:', this.categories.length);
        } catch (error) {
            console.error('Error loading expense categories:', error);
            throw error;
        }
    }

    // Load expenses from Supabase
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
                receiptNumber: expense.receipt_number || '',
                isBusinessExpense: expense.is_business_expense || true,
                taxDeductible: expense.tax_deductible || false,
                notes: expense.notes || '',
                tags: expense.tags || []
            }));

            console.log('Expenses loaded:', this.expenses.length);
        } catch (error) {
            console.error('Error loading expenses:', error);
            throw error;
        }
    }

    // Load balance summary from Supabase
    async loadBalanceSummary() {
        try {
            const { data: balance, error } = await this.supabaseClient
                .from('balance_summary')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (balance) {
                this.balanceSummary = {
                    totalEarnings: parseFloat(balance.total_earnings || 0),
                    totalExpenses: parseFloat(balance.total_expenses || 0),
                    currentBalance: parseFloat(balance.current_balance || 0)
                };
            }

            console.log('Balance summary loaded:', this.balanceSummary);
        } catch (error) {
            console.error('Error loading balance summary:', error);
            throw error;
        }
    }

    // Save expense to Supabase
    async saveExpense(expenseData) {
        try {
            console.log('Saving expense:', expenseData);

            const category = this.categories.find(cat => cat.id === expenseData.categoryId);
            
            const expensePayload = {
                amount: parseFloat(expenseData.amount),
                description: expenseData.description.trim(),
                category_id: expenseData.categoryId || null,
                category_name: category ? category.name : 'Uncategorized',
                date_incurred: expenseData.date,
                payment_method: expenseData.paymentMethod || 'cash',
                vendor_name: expenseData.vendorName?.trim() || null,
                receipt_number: expenseData.receiptNumber?.trim() || null,
                is_business_expense: expenseData.isBusinessExpense || true,
                tax_deductible: expenseData.taxDeductible || false,
                notes: expenseData.notes?.trim() || null,
                tags: expenseData.tags || []
            };

            let savedExpense;

            if (this.editingExpenseId) {
                // Update existing expense
                const { data, error } = await this.supabaseClient
                    .from('expenses')
                    .update(expensePayload)
                    .eq('id', this.editingExpenseId)
                    .select()
                    .single();

                if (error) throw error;
                savedExpense = data;
            } else {
                // Insert new expense
                const { data, error } = await this.supabaseClient
                    .from('expenses')
                    .insert([expensePayload])
                    .select()
                    .single();

                if (error) throw error;
                savedExpense = data;
            }

            // Update local expenses array
            const formattedExpense = {
                id: savedExpense.id,
                amount: parseFloat(savedExpense.amount),
                description: savedExpense.description,
                categoryId: savedExpense.category_id,
                categoryName: savedExpense.category_name,
                date: savedExpense.date_incurred,
                paymentMethod: savedExpense.payment_method,
                vendorName: savedExpense.vendor_name || '',
                receiptNumber: savedExpense.receipt_number || '',
                isBusinessExpense: savedExpense.is_business_expense,
                taxDeductible: savedExpense.tax_deductible,
                notes: savedExpense.notes || '',
                tags: savedExpense.tags || []
            };

            if (this.editingExpenseId) {
                const index = this.expenses.findIndex(exp => exp.id === this.editingExpenseId);
                if (index > -1) {
                    this.expenses[index] = formattedExpense;
                }
            } else {
                this.expenses.unshift(formattedExpense);
            }

            // Refresh balance summary
            await this.loadBalanceSummary();

            return savedExpense;
        } catch (error) {
            console.error('Error saving expense:', error);
            throw error;
        }
    }

    // Delete expense from Supabase
    async deleteExpense(expenseId) {
        try {
            const { error } = await this.supabaseClient
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) throw error;

            // Remove from local array
            const index = this.expenses.findIndex(exp => exp.id === expenseId);
            if (index > -1) {
                this.expenses.splice(index, 1);
            }

            // Refresh balance summary
            await this.loadBalanceSummary();

            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    // Add new expense category
    async addCategory(categoryData) {
        try {
            const { data, error } = await this.supabaseClient
                .from('expense_categories')
                .insert([{
                    name: categoryData.name.trim(),
                    description: categoryData.description?.trim() || null,
                    icon: categoryData.icon || '💰',
                    color: categoryData.color || '#6B7280',
                    is_default: false
                }])
                .select()
                .single();

            if (error) throw error;

            const newCategory = {
                id: data.id,
                name: data.name,
                description: data.description || '',
                icon: data.icon,
                color: data.color,
                isDefault: false
            };

            this.categories.push(newCategory);
            return newCategory;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    }

    // Get expenses by category
    getExpensesByCategory(categoryId = null) {
        if (!categoryId || categoryId === 'all') {
            return this.expenses;
        }
        return this.expenses.filter(expense => expense.categoryId === categoryId);
    }

    // Get expenses by date range
    getExpensesByDateRange(startDate, endDate) {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return expenseDate >= start && expenseDate <= end;
        });
    }

    // Get monthly expense data for charts
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

    // Get category-wise expense breakdown
    getCategoryBreakdown() {
        const categoryMap = new Map();

        this.expenses.forEach(expense => {
            const categoryName = expense.categoryName || 'Uncategorized';
            const category = this.categories.find(cat => cat.name === categoryName);
            
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, {
                    name: categoryName,
                    amount: 0,
                    count: 0,
                    color: category?.color || '#6B7280',
                    icon: category?.icon || '💰'
                });
            }

            const categoryData = categoryMap.get(categoryName);
            categoryData.amount += expense.amount;
            categoryData.count += 1;
        });

        return Array.from(categoryMap.values())
                   .sort((a, b) => b.amount - a.amount);
    }

    // Get expense analytics
    getExpenseAnalytics(dateRange = null) {
        let expensesToAnalyze = this.expenses;

        if (dateRange && dateRange.from && dateRange.to) {
            expensesToAnalyze = this.getExpensesByDateRange(dateRange.from, dateRange.to);
        }

        const totalExpenses = expensesToAnalyze.reduce((sum, exp) => sum + exp.amount, 0);
        const averageExpense = expensesToAnalyze.length > 0 ? totalExpenses / expensesToAnalyze.length : 0;
        const businessExpenses = expensesToAnalyze.filter(exp => exp.isBusinessExpense);
        const taxDeductibleExpenses = expensesToAnalyze.filter(exp => exp.taxDeductible);
        const topCategory = this.getCategoryBreakdown()[0];

        return {
            totalExpenses,
            averageExpense,
            totalBusinessExpenses: businessExpenses.reduce((sum, exp) => sum + exp.amount, 0),
            totalTaxDeductible: taxDeductibleExpenses.reduce((sum, exp) => sum + exp.amount, 0),
            expenseCount: expensesToAnalyze.length,
            topCategory: topCategory || { name: 'No expenses', amount: 0 },
            categoryBreakdown: this.getCategoryBreakdown(),
            monthlyData: this.getMonthlyExpenseData()
        };
    }

    // Apply filters to expenses
    applyFilters(filters) {
        let filteredExpenses = [...this.expenses];

        // Category filter
        if (filters.category && filters.category !== 'all') {
            filteredExpenses = filteredExpenses.filter(exp => exp.categoryId === filters.category);
        }

        // Date range filter
        if (filters.dateRange && filters.dateRange.from && filters.dateRange.to) {
            filteredExpenses = this.getExpensesByDateRange(filters.dateRange.from, filters.dateRange.to);
        }

        // Payment method filter
        if (filters.paymentMethod && filters.paymentMethod !== 'all') {
            filteredExpenses = filteredExpenses.filter(exp => exp.paymentMethod === filters.paymentMethod);
        }

        // Business expense filter
        if (filters.businessOnly) {
            filteredExpenses = filteredExpenses.filter(exp => exp.isBusinessExpense);
        }

        this.expenseState.filteredData = filteredExpenses;
        return filteredExpenses;
    }

    // Export expenses to CSV
    exportToCSV() {
        const expenses = this.expenseState.filteredData || this.expenses;
        const headers = [
            'Date', 'Description', 'Category', 'Amount', 'Payment Method', 
            'Vendor', 'Receipt Number', 'Business Expense', 'Tax Deductible', 'Notes'
        ];

        const csvContent = [
            headers.join(','),
            ...expenses.map(exp => [
                exp.date,
                `"${exp.description}"`,
                `"${exp.categoryName}"`,
                exp.amount,
                exp.paymentMethod,
                `"${exp.vendorName}"`,
                exp.receiptNumber,
                exp.isBusinessExpense ? 'Yes' : 'No',
                exp.taxDeductible ? 'Yes' : 'No',
                `"${exp.notes}"`
            ].join(','))
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
    }

    // Get payment method options (India-specific)
    getPaymentMethods() {
        return [
            { value: 'cash', label: 'Cash', icon: '💸' },
            { value: 'upi', label: 'UPI', icon: '📱' },
            { value: 'card', label: 'Debit/Credit Card', icon: '💳' },
            { value: 'net_banking', label: 'Net Banking', icon: '🏦' },
            { value: 'bank_transfer', label: 'Bank Transfer', icon: '🔄' },
            { value: 'wallet', label: 'Digital Wallet', icon: '📲' },
            { value: 'cheque', label: 'Cheque', icon: '📄' },
            { value: 'other', label: 'Other', icon: '🔗' }
        ];
    }

    // Format currency for display
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }

    // Format date for display
    formatDate(dateString) {
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

    // Update balance when invoice status changes (to be called from main app)
    async updateBalanceFromInvoices(invoices) {
        try {
            const totalEarnings = invoices
                .filter(inv => inv.status === 'Paid')
                .reduce((sum, inv) => sum + inv.amount, 0);

            // Update balance summary in database
            const { error } = await this.supabaseClient
                .from('balance_summary')
                .update({
                    total_earnings: totalEarnings,
                    last_calculated_at: new Date().toISOString()
                })
                .eq('id', (await this.supabaseClient.from('balance_summary').select('id').single()).data.id);

            if (error) throw error;

            // Reload balance summary
            await this.loadBalanceSummary();
        } catch (error) {
            console.error('Error updating balance from invoices:', error);
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpenseManager;
} else if (typeof window !== 'undefined') {
    window.ExpenseManager = ExpenseManager;
}