// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://mgzqdvqqncrhvikcpvrg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nenFkdnFxbmNyaHZpa2NwdnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI3MjksImV4cCI6MjA3MDIyODcyOX0.sIyva_Qh1wQapHbzYeuKHc7DfIQdgn5hMBCKBdb0Zgo';

// Global variables
let supabase = null
let clients = []
let expenses = []
let payments = []
let employees = []
let projects = []
let editingId = null
let currentProjectStatus = 'Current'

// ===== MOBILE MENU FUNCTIONS =====
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const toggle = document.getElementById('mobileMenuToggle');

    if (sidebar.classList.contains('open')) {
        closeMobileMenu();
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        toggle.innerHTML = '✕';
    }
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    const toggle = document.getElementById('mobileMenuToggle');

    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    toggle.innerHTML = '☰';
}

// Close mobile menu when window is resized to desktop
window.addEventListener('resize', function () {
    if (window.innerWidth > 767) {
        closeMobileMenu();
    }
});

// ===== UTILITY FUNCTIONS =====
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden')
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden')
}

function showButtonLoading(button) {
    const btnText = button.querySelector('.btn-text')
    const loading = button.querySelector('.loading')
    if (btnText) btnText.classList.add('hidden')
    if (loading) loading.classList.remove('hidden')
    button.disabled = true
}

function hideButtonLoading(button) {
    const btnText = button.querySelector('.btn-text')
    const loading = button.querySelector('.loading')
    if (btnText) btnText.classList.remove('hidden')
    if (loading) loading.classList.add('hidden')
    button.disabled = false
}

function showMessage(message, type = 'error') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error-message, .success-message')
    existingMessages.forEach(msg => msg.remove())

    // Create new message
    const messageDiv = document.createElement('div')
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message'
    messageDiv.textContent = message
    document.body.appendChild(messageDiv)

    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove()
    }, 5000)
}

function showError(message) {
    showMessage(message, 'error')
    console.error('Error:', message)
}

function showSuccess(message) {
    showMessage(message, 'success')
    console.log('Success:', message)
}

// ===== SUPABASE INITIALIZATION =====
function initializeSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase library not loaded')
        }

        if (SUPABASE_URL.includes('your-') || SUPABASE_ANON_KEY.includes('your-') ||
            !SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Please configure your Supabase credentials')
        }

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

        if (!supabase) {
            throw new Error('Failed to initialize Supabase client')
        }

        console.log('Supabase initialized successfully')
        return true
    } catch (error) {
        showError('Supabase initialization failed: ' + error.message)
        return false
    }
}

// ===== DATABASE FUNCTIONS =====
async function loadAllData() {
    if (!supabase) {
        showError('Supabase not initialized')
        return
    }

    showLoading()
    try {
        console.log('Loading data from Supabase...')

        const [clientsRes, expensesRes, paymentsRes, employeesRes, projectsRes] = await Promise.all([
            supabase.from('clients').select('*').order('created_at', { ascending: false }),
            supabase.from('expenses').select('*').order('created_at', { ascending: false }),
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('employees').select('*').order('created_at', { ascending: false }),
            supabase.from('projects').select('*').order('created_at', { ascending: false })
        ])

        // Check for errors
        if (clientsRes.error) throw new Error(`Clients: ${clientsRes.error.message}`)
        if (expensesRes.error) throw new Error(`Expenses: ${expensesRes.error.message}`)
        if (paymentsRes.error) throw new Error(`Payments: ${paymentsRes.error.message}`)
        if (employeesRes.error) throw new Error(`Employees: ${employeesRes.error.message}`)
        if (projectsRes.error) throw new Error(`Projects: ${projectsRes.error.message}`)

        // Process data
        clients = (clientsRes.data || []).map(client => ({
            id: client.id,
            name: client.name,
            company: client.company,
            email: client.email,
            phone: client.phone,
            address: client.address,
            serviceName: client.service_name,
            serviceCost: parseFloat(client.service_cost)
        }))

        expenses = (expensesRes.data || []).map(expense => ({
            id: expense.id,
            date: expense.date,
            description: expense.description,
            amount: parseFloat(expense.amount),
            category: expense.category
        }))

        payments = (paymentsRes.data || []).map(payment => ({
            id: payment.id,
            clientId: payment.client_id,
            clientName: payment.client_name,
            serviceName: payment.service_name,
            serviceCost: parseFloat(payment.service_cost),
            amountPaid: parseFloat(payment.amount_paid || 0),
            pendingAmount: parseFloat(payment.pending_amount || 0),
            status: payment.status,
            date: payment.date
        }))

        employees = (employeesRes.data || []).map(employee => ({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            skills: employee.skills || [],
            clientAssignments: employee.client_assignments || []
        }))

        projects = (projectsRes.data || []).map(project => ({
            id: project.id,
            clientId: project.client_id,
            clientName: project.client_name,
            serviceName: project.service_name,
            status: project.status,
            startDate: project.start_date,
            endDate: project.end_date,
            cost: parseFloat(project.cost)
        }))

        console.log('Data loaded successfully:', {
            clients: clients.length,
            expenses: expenses.length,
            payments: payments.length,
            employees: employees.length,
            projects: projects.length
        })

        showSuccess('Data loaded successfully!')
    } catch (error) {
        console.error('Error loading data:', error)
        showError('Failed to load data: ' + error.message)
    } finally {
        hideLoading()
    }
}

// ===== THEME MANAGEMENT =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    updateThemeToggle(savedTheme)
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'

    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    updateThemeToggle(newTheme)
}

function updateThemeToggle(theme) {
    const toggle = document.getElementById('themeToggle')
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙'
    toggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
}

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page
        showPage(page)

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'))
        item.classList.add('active')

        // Close mobile menu after navigation
        closeMobileMenu()
    })
})

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'))
    document.getElementById(pageId).classList.add('active')

    // Render page content
    switch (pageId) {
        case 'dashboard':
            renderDashboard()
            break
        case 'clients':
            renderClients()
            break
        case 'expenses':
            renderExpenses()
            break
        case 'payments':
            renderPayments()
            break
        case 'employees':
            renderEmployees()
            break
        case 'projects':
            renderProjects()
            break
    }
}

// ===== RENDER FUNCTIONS =====
function renderDashboard() {
    const totalIncome = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.serviceCost, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'

    document.getElementById('total-income').textContent = `$${totalIncome.toLocaleString()}`
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toLocaleString()}`
    document.getElementById('net-profit').textContent = `$${netProfit.toLocaleString()}`
    document.getElementById('profit-margin').textContent = `${profitMargin}%`

    // Recent payments
    const recentPayments = payments.slice(0, 5).map(payment => `
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <div class="font-medium">${payment.clientName}</div>
                        <div class="text-sm text-gray-600">${payment.serviceName}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-medium">$${payment.serviceCost.toLocaleString()}</div>
                        <span class="badge ${payment.status === 'Paid' ? 'badge-green' : 'badge-yellow'}">${payment.status}</span>
                    </div>
                </div>
            `).join('')
    document.getElementById('recent-payments').innerHTML = recentPayments || '<div class="text-gray-500">No payments yet</div>'

    // Recent expenses
    const recentExpenses = expenses.slice(0, 5).map(expense => `
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <div class="font-medium">${expense.description}</div>
                        <div class="text-sm text-gray-600">${expense.category}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-medium text-red-600">-$${expense.amount.toLocaleString()}</div>
                        <div class="text-xs text-gray-500">${expense.date}</div>
                    </div>
                </div>
            `).join('')
    document.getElementById('recent-expenses').innerHTML = recentExpenses || '<div class="text-gray-500">No expenses yet</div>'
}

function renderClients() {
    const clientsHtml = clients.map(client => `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="font-semibold">${client.name}</h3>
                            <p class="text-sm text-gray-600">${client.company}</p>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-sm btn-secondary" onclick="editClient('${client.id}')">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteClient('${client.id}')">🗑️</button>
                        </div>
                    </div>
                    <div class="text-sm space-y-1">
                        <div><strong>Email:</strong> ${client.email}</div>
                        <div><strong>Phone:</strong> ${client.phone}</div>
                        <div><strong>Address:</strong> ${client.address}</div>
                        <div><strong>Service:</strong> ${client.serviceName}</div>
                        <div><strong>Cost:</strong> $${client.serviceCost.toLocaleString()}</div>
                    </div>
                </div>
            `).join('')
    document.getElementById('clients-content').innerHTML = clientsHtml || '<div class="text-center py-8 text-gray-500">No clients yet. Add your first client!</div>'
}

function renderExpenses() {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    document.getElementById('expenses-total').textContent = `$${totalExpenses.toLocaleString()}`

    // Expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
    }, {})

    const categoriesHtml = Object.entries(expensesByCategory).map(([category, amount]) => `
                <div class="flex justify-between">
                    <span class="text-gray-600">${category}:</span>
                    <span class="font-medium">$${amount.toLocaleString()}</span>
                </div>
            `).join('')
    document.getElementById('expenses-by-category').innerHTML = categoriesHtml || '<div class="text-gray-500">No expenses yet</div>'

    // Expenses table
    const expensesTableHtml = expenses.map(expense => `
    <div class="expense-row same2">
        <div class="expense-cell">${expense.date}</div>
        <div class="expense-cell">${expense.description}</div>
        <div class="expense-cell amount">$${expense.amount.toLocaleString()}</div>
        <div class="expense-cell">${expense.category}</div>
        <div class="expense-cell actions">
            <button class="btn edit" onclick="editExpense('${expense.id}')">✏️</button>
            <button class="btn delete" onclick="deleteExpense('${expense.id}')">🗑️</button>
        </div>
    </div>
    <div class="line"></div>
    `).join('');

document.getElementById('expenses-table').innerHTML =
    expensesTableHtml || '<div class="no-expenses"><p>No expenses yet</p></div>';
}

function renderPayments() {
    const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
    const totalPending = payments.reduce((sum, p) => sum + (p.pendingAmount || 0), 0)

    document.getElementById('payments-paid').textContent = `$${totalPaid.toLocaleString()}`
    document.getElementById('payments-pending').textContent = `$${totalPending.toLocaleString()}`

    const paymentsTableHtml = payments.map(payment => `
    <div class="payment-row same2">
        <div class="payment-cell">${payment.clientName}</div>
        <div class="payment-cell">${payment.serviceName}</div>
        <div class="payment-cell amount">$${payment.serviceCost.toLocaleString()}</div>
        <div class="payment-cell">
            <span class="badge ${payment.status === 'Paid' ? 'badge-green' : 'badge-yellow'}">
                ${payment.status}
            </span>
        </div>
        <div class="payment-cell">${payment.date}</div>
        <div class="payment-cell actions">
            <button class="btn edit" onclick="editPayment('${payment.id}')">✏️</button>
            <button class="btn delete" onclick="deletePayment('${payment.id}')">🗑️</button>
        </div>
    </div>
    <div class="line"></div>
    `).join('');

    document.getElementById('payments-table').innerHTML = paymentsTableHtml || '<div class="no-expenses">No payments yet</div>';
}

function renderEmployees() {
    const employeesHtml = employees.map(employee => `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="font-semibold">${employee.name}</h3>
                            <p class="text-sm text-gray-600">${employee.email}</p>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-sm btn-secondary" onclick="editEmployee('${employee.id}')">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${employee.id}')">🗑️</button>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <h4 class="font-medium text-sm mb-2">Skills:</h4>
                            <div class="flex flex-wrap gap-1">
                                ${employee.skills.map(skill => `<span class="badge badge-blue">${skill}</span>`).join('')}
                            </div>
                        </div>
                        <div>
                            <h4 class="font-medium text-sm mb-2">Client Assignments:</h4>
                            <div class="space-y-1">
                                ${employee.clientAssignments.map(assignment => `<div class="text-sm text-gray-600">• ${assignment}</div>`).join('')}
                                ${employee.clientAssignments.length === 0 ? '<div class="text-sm text-gray-400">No assignments</div>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')
    document.getElementById('employees-content').innerHTML = employeesHtml || '<div class="text-center py-8 text-gray-500">No employees yet. Add your first employee!</div>'
}

function renderProjects() {
    // Setup tab functionality
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'))
            button.classList.add('active')
            currentProjectStatus = button.dataset.status
            renderProjectsContent()
        })
    })
    renderProjectsContent()
}

function renderProjectsContent() {
    const filteredProjects = projects.filter(project => project.status === currentProjectStatus)

    const projectsHtml = filteredProjects.map(project => `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="font-semibold">${project.serviceName}</h3>
                            <p class="text-sm text-gray-600">${project.clientName}</p>
                        </div>
                        <span class="badge ${getStatusBadgeClass(project.status)}">${project.status}</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Start Date:</span>
                            <span>${project.startDate}</span>
                        </div>
                        ${project.endDate ? `
                            <div class="flex justify-between">
                                <span class="text-gray-600">End Date:</span>
                                <span>${project.endDate}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between">
                            <span class="text-gray-600">Cost:</span>
                            <span class="font-medium">$${project.cost.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button class="btn btn-sm btn-secondary" onclick="editProject('${project.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.id}')">Delete</button>
                    </div>
                </div>
            `).join('')

    document.getElementById('projects-content').innerHTML = projectsHtml || '<div class="text-center py-8 text-gray-500">No projects found</div>'
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Current': return 'badge-blue'
        case 'Pending': return 'badge-yellow'
        case 'Complete': return 'badge-green'
        case 'Cancelled': return 'badge-red'
        default: return 'badge-gray'
    }
}

// ===== MODAL FUNCTIONS =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active')
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active')
    editingId = null
    // Reset forms
    document.querySelectorAll('form').forEach(form => form.reset())
}

function openClientModal() {
    populateClientSelect()
    openModal('clientModal')
}

function openExpenseModal() {
    openModal('expenseModal')
}

function openPaymentModal() {
    populatePaymentClientSelect()
    setupPaymentCalculation()
    openModal('paymentModal')
}

function openEmployeeModal() {
    populateEmployeeClientAssignments()
    openModal('employeeModal')
}

function openProjectModal() {
    populateProjectClientSelect()
    openModal('projectModal')
}

// ===== POPULATE SELECT OPTIONS =====
function populateClientSelect() {
    const select = document.getElementById('paymentClient')
    select.innerHTML = '<option value="">Select Client</option>' +
        clients.map(client => `<option value="${client.id}">${client.name} - ${client.company}</option>`).join('')
}

function populatePaymentClientSelect() {
    const select = document.getElementById('paymentClient')
    select.innerHTML = '<option value="">Select Client</option>' +
        clients.map(client => `<option value="${client.id}">${client.name} - ${client.company}</option>`).join('')

    select.addEventListener('change', function () {
        const selectedClient = clients.find(c => c.id === this.value)
        if (selectedClient) {
            document.getElementById('paymentService').value = selectedClient.serviceName
            document.getElementById('paymentCost').value = selectedClient.serviceCost
            document.getElementById('paymentAmountPaid').value = 0
            calculatePendingAmount()
        }
    })
}

// Add event listeners for real-time calculation of pending amount
function setupPaymentCalculation() {
    const costInput = document.getElementById('paymentCost')
    const amountPaidInput = document.getElementById('paymentAmountPaid')
    
    costInput.addEventListener('input', calculatePendingAmount)
    amountPaidInput.addEventListener('input', calculatePendingAmount)
}

// Calculate pending amount based on total cost and amount paid
function calculatePendingAmount() {
    const totalCost = parseFloat(document.getElementById('paymentCost').value) || 0
    const amountPaid = parseFloat(document.getElementById('paymentAmountPaid').value) || 0
    
    // Ensure amount paid doesn't exceed total cost
    if (amountPaid > totalCost) {
        document.getElementById('paymentAmountPaid').value = totalCost
        document.getElementById('paymentPendingAmount').value = 0
        // Update payment status to Paid if amount paid equals total cost
        document.getElementById('paymentStatus').value = 'Paid'
    } else {
        const pendingAmount = totalCost - amountPaid
        document.getElementById('paymentPendingAmount').value = pendingAmount.toFixed(2)
        // Update payment status based on pending amount
        document.getElementById('paymentStatus').value = pendingAmount > 0 ? 'Pending' : 'Paid'
    }
}

function populateProjectClientSelect() {
    const select = document.getElementById('projectClient')
    select.innerHTML = '<option value="">Select Client</option>' +
        clients.map(client => `<option value="${client.id}">${client.name} - ${client.company}</option>`).join('')

    // Remove any existing event listeners to prevent duplicates
    const newSelect = select.cloneNode(true)
    select.parentNode.replaceChild(newSelect, select)

    // Add the change event listener
    newSelect.addEventListener('change', function () {
        const selectedClient = clients.find(c => c.id === this.value)
        if (selectedClient) {
            document.getElementById('projectService').value = selectedClient.serviceName
            document.getElementById('projectCost').value = selectedClient.serviceCost
        } else {
            document.getElementById('projectService').value = ''
            document.getElementById('projectCost').value = ''
        }
    })
}

function populateEmployeeClientAssignments() {
    const container = document.getElementById('clientAssignments')
    container.innerHTML = clients.map(client => `
                <label class="flex items-center space-x-2 mb-2">
                    <input type="checkbox" value="${client.company}" name="clientAssignment">
                    <span>${client.company} (${client.name})</span>
                </label>
            `).join('')
}

// ===== FORM SUBMISSIONS =====
document.getElementById('clientForm').addEventListener('submit', async function (e) {
    e.preventDefault()
    const button = e.target.querySelector('button[type="submit"]')
    showButtonLoading(button)

    try {
        const clientData = {
            name: document.getElementById('clientName').value,
            company: document.getElementById('clientCompany').value,
            email: document.getElementById('clientEmail').value,
            phone: document.getElementById('clientPhone').value,
            address: document.getElementById('clientAddress').value,
            service_name: document.getElementById('clientService').value,
            service_cost: parseFloat(document.getElementById('clientCost').value)
        }

        let result
        if (editingId) {
            result = await supabase
                .from('clients')
                .update(clientData)
                .eq('id', editingId)
                .select()
        } else {
            result = await supabase
                .from('clients')
                .insert([clientData])
                .select()
        }

        if (result.error) throw result.error

        await loadAllData()
        renderClients()
        closeModal('clientModal')
        showSuccess('Client saved successfully')
    } catch (error) {
        console.error('Error saving client:', error)
        showError('Failed to save client: ' + error.message)
    } finally {
        hideButtonLoading(button)
    }
})

document.getElementById('expenseForm').addEventListener('submit', async function (e) {
    e.preventDefault()
    const button = e.target.querySelector('button[type="submit"]')
    showButtonLoading(button)

    try {
        const expenseData = {
            date: document.getElementById('expenseDate').value,
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            category: document.getElementById('expenseCategory').value
        }

        let result
        if (editingId) {
            result = await supabase
                .from('expenses')
                .update(expenseData)
                .eq('id', editingId)
                .select()
        } else {
            result = await supabase
                .from('expenses')
                .insert([expenseData])
                .select()
        }

        if (result.error) throw result.error

        await loadAllData()
        renderExpenses()
        closeModal('expenseModal')
        showSuccess('Expense saved successfully')
    } catch (error) {
        console.error('Error saving expense:', error)
        showError('Failed to save expense: ' + error.message)
    } finally {
        hideButtonLoading(button)
    }
})

document.getElementById('paymentForm').addEventListener('submit', async function (e) {
    e.preventDefault()
    const button = e.target.querySelector('button[type="submit"]')
    showButtonLoading(button)

    try {
        const clientId = document.getElementById('paymentClient').value
        const selectedClient = clients.find(c => c.id === clientId)
        const totalCost = parseFloat(document.getElementById('paymentCost').value)
        const amountPaid = parseFloat(document.getElementById('paymentAmountPaid').value) || 0
        
        // The database trigger will calculate these values, but we set them here for UI consistency
        const pendingAmount = totalCost - amountPaid
        const status = pendingAmount <= 0 ? 'Paid' : 'Pending'

        const paymentData = {
            client_id: clientId,
            client_name: selectedClient ? selectedClient.name : '',
            service_name: document.getElementById('paymentService').value,
            total_cost: totalCost,
            amount_paid: amountPaid,
            pending_amount: pendingAmount,
            status: status,
            date: document.getElementById('paymentDate').value
        }

        let result
        if (editingId) {
            result = await supabase
                .from('payments')
                .update(paymentData)
                .eq('id', editingId)
                .select()
        } else {
            result = await supabase
                .from('payments')
                .insert([paymentData])
                .select()
        }

        if (result.error) throw result.error

        await loadAllData()
        renderPayments()
        closeModal('paymentModal')
        showSuccess('Payment saved successfully')
    } catch (error) {
        console.error('Error saving payment:', error)
        showError('Failed to save payment: ' + error.message)
    } finally {
        hideButtonLoading(button)
    }
})

document.getElementById('employeeForm').addEventListener('submit', async function (e) {
    e.preventDefault()
    const button = e.target.querySelector('button[type="submit"]')
    showButtonLoading(button)

    try {
        const skills = document.getElementById('employeeSkills').value
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill)

        const assignments = Array.from(document.querySelectorAll('input[name="clientAssignment"]:checked'))
            .map(checkbox => checkbox.value)

        const employeeData = {
            name: document.getElementById('employeeName').value,
            email: document.getElementById('employeeEmail').value,
            skills: skills,
            client_assignments: assignments
        }

        let result
        if (editingId) {
            result = await supabase
                .from('employees')
                .update(employeeData)
                .eq('id', editingId)
                .select()
        } else {
            result = await supabase
                .from('employees')
                .insert([employeeData])
                .select()
        }

        if (result.error) throw result.error

        await loadAllData()
        renderEmployees()
        closeModal('employeeModal')
        showSuccess('Employee saved successfully')
    } catch (error) {
        console.error('Error saving employee:', error)
        showError('Failed to save employee: ' + error.message)
    } finally {
        hideButtonLoading(button)
    }
})

document.getElementById('projectForm').addEventListener('submit', async function (e) {
    e.preventDefault()
    const button = e.target.querySelector('button[type="submit"]')
    showButtonLoading(button)

    try {
        const clientId = document.getElementById('projectClient').value
        const selectedClient = clients.find(c => c.id === clientId)

        const projectData = {
            client_id: clientId,
            client_name: selectedClient ? selectedClient.name : '',
            service_name: document.getElementById('projectService').value,
            status: document.getElementById('projectStatus').value,
            start_date: document.getElementById('projectStartDate').value,
            end_date: document.getElementById('projectEndDate').value || null,
            cost: parseFloat(document.getElementById('projectCost').value)
        }

        let result
        if (editingId) {
            result = await supabase
                .from('projects')
                .update(projectData)
                .eq('id', editingId)
                .select()
        } else {
            result = await supabase
                .from('projects')
                .insert([projectData])
                .select()
        }

        if (result.error) throw result.error

        await loadAllData()
        renderProjects()
        closeModal('projectModal')
        showSuccess('Project saved successfully')
    } catch (error) {
        console.error('Error saving project:', error)
        showError('Failed to save project: ' + error.message)
    } finally {
        hideButtonLoading(button)
    }
})

// ===== EDIT FUNCTIONS =====
function editClient(id) {
    const client = clients.find(c => c.id === id)
    if (client) {
        editingId = id
        document.getElementById('clientModalTitle').textContent = 'Edit Client'
        document.getElementById('clientName').value = client.name
        document.getElementById('clientCompany').value = client.company
        document.getElementById('clientEmail').value = client.email
        document.getElementById('clientPhone').value = client.phone
        document.getElementById('clientAddress').value = client.address
        document.getElementById('clientService').value = client.serviceName
        document.getElementById('clientCost').value = client.serviceCost
        openClientModal()
    }
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id)
    if (expense) {
        editingId = id
        document.getElementById('expenseModalTitle').textContent = 'Edit Expense'
        document.getElementById('expenseDate').value = expense.date
        document.getElementById('expenseDescription').value = expense.description
        document.getElementById('expenseAmount').value = expense.amount
        document.getElementById('expenseCategory').value = expense.category
        openExpenseModal()
    }
}

function editPayment(id) {
    const payment = payments.find(p => p.id === id)
    if (payment) {
        editingId = id
        document.getElementById('paymentModalTitle').textContent = 'Edit Payment'
        populatePaymentClientSelect()
        setupPaymentCalculation()
        document.getElementById('paymentClient').value = payment.clientId
        document.getElementById('paymentService').value = payment.serviceName
        document.getElementById('paymentCost').value = payment.serviceCost
        document.getElementById('paymentAmountPaid').value = payment.amountPaid || 0
        document.getElementById('paymentPendingAmount').value = payment.pendingAmount || (payment.serviceCost - (payment.amountPaid || 0))
        document.getElementById('paymentStatus').value = payment.status
        document.getElementById('paymentDate').value = payment.date
        openPaymentModal()
    }
}

function editEmployee(id) {
    const employee = employees.find(e => e.id === id)
    if (employee) {
        editingId = id
        document.getElementById('employeeModalTitle').textContent = 'Edit Employee'
        document.getElementById('employeeName').value = employee.name
        document.getElementById('employeeEmail').value = employee.email
        document.getElementById('employeeSkills').value = employee.skills.join(', ')
        populateEmployeeClientAssignments()
        // Check assigned clients
        setTimeout(() => {
            employee.clientAssignments.forEach(assignment => {
                const checkbox = document.querySelector(`input[value="${assignment}"]`)
                if (checkbox) checkbox.checked = true
            })
        }, 100)
        openEmployeeModal()
    }
}

function editProject(id) {
    const project = projects.find(p => p.id === id)
    if (project) {
        editingId = id
        document.getElementById('projectModalTitle').textContent = 'Edit Project'
        populateProjectClientSelect()

        // Set values after populating the select
        setTimeout(() => {
            document.getElementById('projectClient').value = project.clientId
            document.getElementById('projectService').value = project.serviceName
            document.getElementById('projectStatus').value = project.status
            document.getElementById('projectStartDate').value = project.startDate
            document.getElementById('projectEndDate').value = project.endDate || ''
            document.getElementById('projectCost').value = project.cost
        }, 100)

        openModal('projectModal')
    }
}

// ===== DELETE FUNCTIONS =====
async function deleteClient(id) {
    if (confirm('Are you sure you want to delete this client?')) {
        showLoading()
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id)

            if (error) throw error

            await loadAllData()
            renderClients()
            showSuccess('Client deleted successfully')
        } catch (error) {
            console.error('Error deleting client:', error)
            showError('Failed to delete client: ' + error.message)
        } finally {
            hideLoading()
        }
    }
}

async function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        showLoading()
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)

            if (error) throw error

            await loadAllData()
            renderExpenses()
            showSuccess('Expense deleted successfully')
        } catch (error) {
            console.error('Error deleting expense:', error)
            showError('Failed to delete expense: ' + error.message)
        } finally {
            hideLoading()
        }
    }
}

async function deletePayment(id) {
    if (confirm('Are you sure you want to delete this payment?')) {
        showLoading()
        try {
            const { error } = await supabase
                .from('payments')
                .delete()
                .eq('id', id)

            if (error) throw error

            await loadAllData()
            renderPayments()
            showSuccess('Payment deleted successfully')
        } catch (error) {
            console.error('Error deleting payment:', error)
            showError('Failed to delete payment: ' + error.message)
        } finally {
            hideLoading()
        }
    }
}

async function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        showLoading()
        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id)

            if (error) throw error

            await loadAllData()
            renderEmployees()
            showSuccess('Employee deleted successfully')
        } catch (error) {
            console.error('Error deleting employee:', error)
            showError('Failed to delete employee: ' + error.message)
        } finally {
            hideLoading()
        }
    }
}

async function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        showLoading()
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id)

            if (error) throw error

            await loadAllData()
            renderProjects()
            showSuccess('Project deleted successfully')
        } catch (error) {
            console.error('Error deleting project:', error)
            showError('Failed to delete project: ' + error.message)
        } finally {
            hideLoading()
        }
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM loaded, initializing app...')

    // Initialize theme
    initTheme()

    // Initialize Supabase
    if (initializeSupabase()) {
        // Load data if Supabase is initialized successfully
        await loadAllData()
        renderDashboard()
    } else {
        // Show error message if Supabase initialization failed
        showError('Please configure your Supabase credentials to use the app')
    }
})

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal(modal.id)
        }
    })
})