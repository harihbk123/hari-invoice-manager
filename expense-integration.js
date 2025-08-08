// EXPENSE INTEGRATION SCRIPT - expense-integration.js
// This script integrates expense management with the existing invoice manager
// Updated to start balance tracking from 0 while preserving historical earnings

class ExpenseIntegration {
    constructor() {
        this.expenseManager = null;
        this.expenseUI = null;
        this.isInitialized = false;
        this.integrationEnabled = false;
    }

    // Initialize expense integration
    async initialize(supabaseClient, showToastFunction) {
        try {
            console.log('🔧 Initializing Expense Integration...');

            // Check if required classes are available
            if (typeof window.ExpenseManager === 'undefined') {
                console.warn('⚠️ ExpenseManager not loaded, expense features disabled');
                return false;
            }

            if (typeof window.ExpenseUI === 'undefined') {
                console.warn('⚠️ ExpenseUI not loaded, expense features disabled');
                return false;
            }

            // Initialize expense manager
            this.expenseManager = new window.ExpenseManager(supabaseClient);
            const managerInitialized = await this.expenseManager.initialize();

            if (!managerInitialized) {
                console.warn('⚠️ Failed to initialize expense manager, expense features disabled');
                return false;
            }

            // Initialize balance tracking (start from 0)
            await this.initializeBalanceTracking();

            // Initialize expense UI
            this.expenseUI = new window.ExpenseUI(this.expenseManager, showToastFunction);
            this.expenseUI.initializeUI();

            // Setup integration hooks
            this.setupIntegrationHooks();

            this.isInitialized = true;
            this.integrationEnabled = true;

            console.log('✅ Expense Integration initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Error initializing Expense Integration:', error);
            return false;
        }
    }

    // Initialize balance tracking to start from 0
    async initializeBalanceTracking() {
        try {
            const { data: balance, error } = await this.expenseManager.supabaseClient
                .from('balance_summary')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            // If no balance_start_date is set, initialize it
            if (!balance || !balance.balance_start_date) {
                console.log('🔄 Setting up balance tracking from today...');
                
                const currentEarnings = window.appData?.invoices ? 
                    window.appData.invoices
                        .filter(inv => inv.status === 'Paid')
                        .reduce((sum, inv) => sum + inv.amount, 0) : 0;

                const updateData = {
                    total_earnings: currentEarnings,
                    total_expenses: 0,
                    current_balance: 0, // Start tracking from 0
                    balance_start_date: new Date().toISOString(),
                    last_calculated_at: new Date().toISOString()
                };

                if (balance) {
                    // Update existing record
                    await this.expenseManager.supabaseClient
                        .from('balance_summary')
                        .update(updateData)
                        .eq('id', balance.id);
                } else {
                    // Insert new record
                    await this.expenseManager.supabaseClient
                        .from('balance_summary')
                        .insert([updateData]);
                }

                console.log('✅ Balance tracking initialized - starting from ₹0');
            }

            // Reload balance summary
            await this.expenseManager.loadBalanceSummary();

        } catch (error) {
            console.error('Error initializing balance tracking:', error);
            throw error;
        }
    }

    // Setup integration hooks with main app
    setupIntegrationHooks() {
        // Hook into invoice status changes to update balance
        this.hookInvoiceStatusChanges();
        
        // Add expense metrics to dashboard
        this.enhanceDashboard();
        
        // Setup periodic balance updates
        this.setupBalanceUpdates();
    }

    // Hook into invoice status changes
    hookInvoiceStatusChanges() {
        // Store original invoice save function
        if (typeof window.saveInvoiceToSupabase !== 'undefined') {
            const originalSaveInvoice = window.saveInvoiceToSupabase;
            
            window.saveInvoiceToSupabase = async (invoiceData) => {
                const result = await originalSaveInvoice(invoiceData);
                
                // Update expense manager balance when invoice is saved
                if (this.expenseManager && window.appData) {
                    await this.updateBalanceFromInvoices(window.appData.invoices);
                    this.updateDashboardMetrics();
                }
                
                return result;
            };
        }

        // Hook into invoice status change function if it exists
        if (typeof window.changeInvoiceStatus !== 'undefined') {
            const originalChangeStatus = window.changeInvoiceStatus;
            
            window.changeInvoiceStatus = async (invoiceId, newStatus) => {
                const result = await originalChangeStatus(invoiceId, newStatus);
                
                // Update balance when status changes
                if (this.expenseManager && window.appData) {
                    await this.updateBalanceFromInvoices(window.appData.invoices);
                    this.updateDashboardMetrics();
                }
                
                return result;
            };
        }
    }

    // Enhanced balance update logic - starts tracking from 0
    async updateBalanceFromInvoices(invoices) {
        try {
            // Get current balance record to check start date
            const { data: balanceRecord, error: balanceError } = await this.expenseManager.supabaseClient
                .from('balance_summary')
                .select('*')
                .single();

            if (balanceError) throw balanceError;

            const balanceStartDate = balanceRecord.balance_start_date || new Date().toISOString();

            // Calculate total earnings (all-time)
            const totalEarnings = invoices
                .filter(inv => inv.status === 'Paid')
                .reduce((sum, inv) => sum + inv.amount, 0);

            // Calculate new earnings only from balance start date forward
            const newEarnings = invoices
                .filter(inv => 
                    inv.status === 'Paid' && 
                    new Date(inv.date) >= new Date(balanceStartDate)
                )
                .reduce((sum, inv) => sum + inv.amount, 0);

            // Get current expenses
            const currentExpenses = balanceRecord.total_expenses || 0;

            // Calculate current balance: new earnings - expenses
            const currentBalance = newEarnings - currentExpenses;

            // Update balance summary
            const { error: updateError } = await this.expenseManager.supabaseClient
                .from('balance_summary')
                .update({
                    total_earnings: totalEarnings, // Keep historical total
                    current_balance: currentBalance, // Tracking balance from start date
                    last_calculated_at: new Date().toISOString()
                })
                .eq('id', balanceRecord.id);

            if (updateError) throw updateError;

            // Reload balance summary in expense manager
            await this.expenseManager.loadBalanceSummary();

            console.log('💰 Balance updated:', {
                totalEarnings,
                newEarnings,
                currentExpenses,
                currentBalance
            });

        } catch (error) {
            console.error('Error updating balance from invoices:', error);
        }
    }

    // Enhance dashboard with expense metrics
    enhanceDashboard() {
        // Add expense summary to dashboard
        const originalRenderDashboard = window.renderDashboard;
        
        if (originalRenderDashboard) {
            window.renderDashboard = () => {
                originalRenderDashboard();
                this.addExpenseToDashboard();
            };
        }
    }

    // Add expense metrics to dashboard
    addExpenseToDashboard() {
        if (!this.expenseManager || !this.expenseManager.isInitialized) return;

        // Check if expense metrics already added
        if (document.getElementById('expense-dashboard-metrics')) return;

        const metricsGrid = document.querySelector('.metrics-grid');
        if (!metricsGrid) return;

        const balance = this.expenseManager.balanceSummary;
        const analytics = this.expenseManager.getExpenseAnalytics();

        // Add expense metrics cards
        const expenseMetrics = document.createElement('div');
        expenseMetrics.id = 'expense-dashboard-metrics';
        expenseMetrics.innerHTML = `
            <div class="metric-card expense-metric">
                <div class="metric-value" style="color: var(--color-error);">₹${this.formatNumber(balance.totalExpenses)}</div>
                <div class="metric-label">Total Expenses</div>
                <div class="metric-change ${balance.totalExpenses > 0 ? 'negative' : ''}">
                    ${analytics.expenseCount} transactions
                </div>
            </div>
            <div class="metric-card balance-metric">
                <div class="metric-value" style="color: ${balance.currentBalance >= 0 ? 'var(--color-success)' : 'var(--color-error)'};">
                    ₹${this.formatNumber(balance.currentBalance)}
                </div>
                <div class="metric-label">Current Balance</div>
                <div class="metric-change ${balance.currentBalance >= 0 ? 'positive' : 'negative'}">
                    ${balance.currentBalance >= 0 ? 'Profit' : 'Loss'}
                </div>
            </div>
        `;

        metricsGrid.appendChild(expenseMetrics);

        // Add expense vs earnings chart to dashboard
        this.addExpenseEarningsChart();
    }

    // Add expense vs earnings chart
    addExpenseEarningsChart() {
        const chartsSection = document.querySelector('.charts-section');
        if (!chartsSection || document.getElementById('expense-earnings-chart-container')) return;

        const chartContainer = document.createElement('div');
        chartContainer.id = 'expense-earnings-chart-container';
        chartContainer.className = 'chart-container full-width';
        chartContainer.innerHTML = `
            <h3>💰 Income vs Expenses</h3>
            <div style="position: relative; height: 300px;">
                <canvas id="expenseEarningsChart"></canvas>
            </div>
        `;

        chartsSection.appendChild(chartContainer);

        // Render the chart
        setTimeout(() => this.renderExpenseEarningsChart(), 100);
    }

    // Render expense vs earnings chart
    renderExpenseEarningsChart() {
        const ctx = document.getElementById('expenseEarningsChart');
        if (!ctx || !window.Chart) return;

        const monthlyExpenses = this.expenseManager.getMonthlyExpenseData();
        const monthlyEarnings = window.appData?.monthlyEarnings || [];

        // Combine data by month
        const monthlyData = new Map();

        // Add earnings data
        monthlyEarnings.forEach(item => {
            monthlyData.set(item.month, {
                month: item.month,
                earnings: item.amount,
                expenses: 0
            });
        });

        // Add expenses data
        monthlyExpenses.forEach(item => {
            if (monthlyData.has(item.month)) {
                monthlyData.get(item.month).expenses = item.amount;
            } else {
                monthlyData.set(item.month, {
                    month: item.month,
                    earnings: 0,
                    expenses: item.amount
                });
            }
        });

        const combinedData = Array.from(monthlyData.values())
                                 .sort((a, b) => a.month.localeCompare(b.month));

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: combinedData.map(item => item.month),
                datasets: [
                    {
                        label: 'Earnings',
                        data: combinedData.map(item => item.earnings),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: combinedData.map(item => item.expenses),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ₹' + 
                                       new Intl.NumberFormat('en-IN').format(context.raw);
                            }
                        }
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

    // Enhance analytics with expense insights
    enhanceAnalytics() {
        const originalRenderAnalytics = window.renderAnalytics;
        
        if (originalRenderAnalytics) {
            window.renderAnalytics = (period = 'monthly') => {
                originalRenderAnalytics(period);
                this.addExpenseAnalytics();
            };
        }
    }

    // Add expense analytics to analytics page
    addExpenseAnalytics() {
        if (!this.expenseManager || !this.expenseManager.isInitialized) return;

        const analyticsPage = document.getElementById('analytics-page');
        if (!analyticsPage || document.getElementById('expense-analytics-section')) return;

        const analytics = this.expenseManager.getExpenseAnalytics();
        const categoryBreakdown = analytics.categoryBreakdown.slice(0, 5); // Top 5 categories

        const expenseSection = document.createElement('div');
        expenseSection.id = 'expense-analytics-section';
        expenseSection.innerHTML = `
            <div class="analytics-grid" style="margin-top: 32px;">
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title">💸 Expense Insights</div>
                    </div>
                    <div class="expense-insights-grid">
                        <div class="insight-item">
                            <div class="insight-label">Total Expenses</div>
                            <div class="insight-value">₹${this.formatNumber(analytics.totalExpenses)}</div>
                        </div>
                        <div class="insight-item">
                            <div class="insight-label">Average Expense</div>
                            <div class="insight-value">₹${this.formatNumber(analytics.averageExpense)}</div>
                        </div>
                        <div class="insight-item">
                            <div class="insight-label">Business Expenses</div>
                            <div class="insight-value">₹${this.formatNumber(analytics.totalBusinessExpenses)}</div>
                        </div>
                        <div class="insight-item">
                            <div class="insight-label">Tax Deductible</div>
                            <div class="insight-value">₹${this.formatNumber(analytics.totalTaxDeductible)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <div class="chart-title">🏆 Top Categories</div>
                    </div>
                    <div class="top-categories">
                        ${categoryBreakdown.map((category, index) => `
                            <div class="category-item">
                                <div class="category-rank">${index + 1}</div>
                                <div class="category-info">
                                    <div class="category-name">
                                        ${category.icon} ${category.name}
                                    </div>
                                    <div class="category-amount">₹${this.formatNumber(category.amount)}</div>
                                </div>
                                <div class="category-count">${category.count} expenses</div>
                            </div>
                        `).join('')}
                        ${categoryBreakdown.length === 0 ? '<div style="text-align: center; color: var(--color-text-secondary); padding: 20px;">No expenses yet</div>' : ''}
                    </div>
                </div>
            </div>
        `;

        analyticsPage.appendChild(expenseSection);

        // Add styles for expense analytics
        this.addExpenseAnalyticsStyles();
    }

    // Setup periodic balance updates
    setupBalanceUpdates() {
        // Update balance every 5 minutes
        setInterval(async () => {
            if (this.expenseManager && this.expenseManager.isInitialized) {
                try {
                    await this.expenseManager.loadBalanceSummary();
                    this.updateDashboardMetrics();
                } catch (error) {
                    console.error('Error updating balance:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    // Update dashboard metrics
    updateDashboardMetrics() {
        if (!this.expenseManager || !this.expenseManager.isInitialized) return;

        const balance = this.expenseManager.balanceSummary;
        
        // Update expense metric card
        const expenseMetricCard = document.querySelector('.expense-metric .metric-value');
        if (expenseMetricCard) {
            expenseMetricCard.textContent = `₹${this.formatNumber(balance.totalExpenses)}`;
        }

        // Update balance metric card
        const balanceMetricCard = document.querySelector('.balance-metric .metric-value');
        if (balanceMetricCard) {
            balanceMetricCard.textContent = `₹${this.formatNumber(balance.currentBalance)}`;
            balanceMetricCard.style.color = balance.currentBalance >= 0 ? 'var(--color-success)' : 'var(--color-error)';
        }

        const balanceChangeCard = document.querySelector('.balance-metric .metric-change');
        if (balanceChangeCard) {
            balanceChangeCard.textContent = balance.currentBalance >= 0 ? 'Profit' : 'Loss';
            balanceChangeCard.className = `metric-change ${balance.currentBalance >= 0 ? 'positive' : 'negative'}`;
        }
    }

    // Format number for display
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return new Intl.NumberFormat('en-IN').format(num);
    }

    // Get expense manager instance
    getExpenseManager() {
        return this.expenseManager;
    }

    // Get expense UI instance
    getExpenseUI() {
        return this.expenseUI;
    }

    // Check if integration is enabled
    isEnabled() {
        return this.integrationEnabled;
    }

    // Graceful error handling for expense features
    handleExpenseError(error, context = 'Expense operation') {
        console.error(`${context}:`, error);
        
        // Don't break the main app, just log and continue
        if (typeof window.showToast === 'function') {
            window.showToast(`${context} failed. Main app functionality continues.`, 'warning');
        }
    }

    // Update expense balance when invoices change (called from main app)
    async updateExpenseBalance(invoices) {
        if (!this.expenseManager || !this.expenseManager.isInitialized) return;

        try {
            await this.updateBalanceFromInvoices(invoices);
            this.updateDashboardMetrics();
        } catch (error) {
            this.handleExpenseError(error, 'Balance update');
        }
    }

    // Navigate to expenses page (public method)
    navigateToExpenses() {
        if (this.expenseUI) {
            this.expenseUI.navigateToExpenses();
        }
    }

    // Reset balance to zero (utility method)
    async resetBalanceToZero() {
        try {
            const { data: balanceRecord } = await this.expenseManager.supabaseClient
                .from('balance_summary')
                .select('id')
                .single();

            await this.expenseManager.supabaseClient
                .from('balance_summary')
                .update({
                    current_balance: 0,
                    total_expenses: 0,
                    balance_start_date: new Date().toISOString(),
                    last_calculated_at: new Date().toISOString()
                })
                .eq('id', balanceRecord.id);

            await this.expenseManager.loadBalanceSummary();
            this.updateDashboardMetrics();

            console.log('✅ Balance reset to zero');
            return true;
        } catch (error) {
            console.error('❌ Error resetting balance:', error);
            return false;
        }
    }
}

// Global expense integration instance
let globalExpenseIntegration = null;

// Initialize expense integration (called from main app)
async function initializeExpenseIntegration(supabaseClient, showToastFunction) {
    try {
        globalExpenseIntegration = new ExpenseIntegration();
        const success = await globalExpenseIntegration.initialize(supabaseClient, showToastFunction);
        
        if (success) {
            // Make it globally accessible
            window.expenseIntegration = globalExpenseIntegration;
            
            // Add success notification with features
            if (showToastFunction) {
                showToastFunction('💰 Expense Management enabled! Balance tracking starts from ₹0. Historical earnings preserved.', 'success');
            }
            
            console.log('🎉 Expense Integration ready! Balance tracking starts fresh.');
            return true;
        } else {
            console.log('⚠️ Expense Integration disabled - features not available');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to initialize expense integration:', error);
        if (showToastFunction) {
            showToastFunction('Expense features could not be loaded. Main app continues normally.', 'warning');
        }
        return false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExpenseIntegration, initializeExpenseIntegration };
} else if (typeof window !== 'undefined') {
    window.ExpenseIntegration = ExpenseIntegration;
    window.initializeExpenseIntegration = initializeExpenseIntegration;
}
