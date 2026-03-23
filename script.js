
let currentUser = null;

// Storage key for localStorage persistence
const STORAGE_KEY = 'ipt_demo_v1';




// CHANGES AND NEW CODE ADDED FOR THIS ACTIVITY 4


// Added this function just to show that the admin route works when being access by admin
async function loadAdminDashBoard() {
    const res = await fetch("http://localhost:3000/api/admin/dashbaord", {
        headers: getAuthHeader()
    })

    if (res.ok) {
        const data = await res.json()


        const dashboardHtml = `
            <div class="alert alert-success mt-3">
                <strong>Admin Dashboard</strong><br/>
                ${data.message}<br/>
                <small class="text-muted">${data.data}</small>
            </div>
        `;

        const homePage = document.getElementById('home-page');

        if (!homePage.querySelector('.alert-success')) {
            homePage.insertAdjacentHTML('beforeend', dashboardHtml);
        }



    } else {
        showToast(data.error || 'Failed to load dashboard', 'danger');
        return;
    }
}

// Added this new function to get the token from the localStorage
function getAuthHeader() {
    const token = sessionStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Main routing logic - decides which page to show based on URL hash
// Changed the home route "/" to handle the adminDashBoard
function handleRouting() {
    // Get current hash or default to home
    const hash = window.location.hash || '#/';
    const route = hash.substring(2); // Remove '#/' to get route name

    // Hide all pages first
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Define protected and admin-only routes
    const protectedRoutes = ['profile', 'employees', 'departments', 'accounts', 'requests'];
    const adminRoutes = ['employees', 'departments', 'accounts'];

    // Redirect unauthenticated users from protected routes
    if (protectedRoutes.includes(route) && !currentUser) {
        navigateTo('#/login');
        return;
    }

    // Block non-admin users from admin routes
    if (adminRoutes.includes(route) && (!currentUser || currentUser.role !== 'admin')) {
        showToast('Access denied. Admin only.', 'danger');
        navigateTo('#/');
        return;
    }

    // Map route to page ID and call render functions
    let pageId = '';
    switch (route) {
        case '':
        case '/':
            /// <<---------------------------THIS IS THE PART THAT WHERE CHANGED --------------------------->
            pageId = 'home-page';
            if (currentUser && currentUser.role === 'admin') {
                loadAdminDashBoard();
            }
            break;
        case 'register':
            pageId = 'register-page';
            break;
        case 'verify-email':
            pageId = 'verify-email-page';
            // Display email awaiting verification
            const unverifiedEmail = localStorage.getItem('unverified_email');
            if (unverifiedEmail) {
                document.getElementById('verify-email-display').textContent = unverifiedEmail;
            }
            break;
        case 'login':
            pageId = 'login-page';
            // Show success message if redirected from verification
            if (localStorage.getItem('email_verified') === 'true') {
                document.getElementById('login-success-alert').classList.remove('d-none');
                localStorage.removeItem('email_verified');
            }
            break;
        case 'profile':
            pageId = 'profile-page';
            renderProfile();  // Populate profile with user data
            break;
        case 'employees':
            pageId = 'employees-page';
            renderEmployeesList();  // Display employee table
            break;
        case 'departments':
            pageId = 'departments-page';
            renderDepartmentsList();  // Display department table
            break;
        case 'accounts':
            pageId = 'accounts-page';
            renderAccountsList();  // Display accounts table
            break;
        case 'requests':
            pageId = 'requests-page';
            renderRequestsList();  // Display user's requests
            break;
        default:
            pageId = 'home-page';
    }

    // Show the matched page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}


// Change the login logic to use the backend 
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'Invalid credentials', 'danger');

            console.log(`EMAIL: ${email}    PASSWORD: ${password}`)
            return;
        }

        sessionStorage.setItem("authToken", data.token);


        const user = {
            id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            role: data.user.role
        };

        setAuthState(true, user);
        showToast('Login successful!', 'success');
        navigateTo('#/profile');

    } catch (err) {
        showToast('Cannot reach server. Is it running on port 3000?', 'danger');
    }
}

// Processes user registration and creates new account
// Change the register functionality to use the backend 
async function handleRegister(e) {
    e.preventDefault();

    const firstName = document.getElementById('reg-firstname').value.trim()
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim()
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'Registration failed', 'danger');
            return;
        }

        showToast('Account created! You may now log in.', 'success');
        navigateTo('#/login');

    } catch (err) {
        showToast('Cannot reach server. Is it running on port 3000?', 'danger');
    }
}


// Changed the logout logic to remove the token from the localStorage does logging out the user
function handleLogout(e) {
    e.preventDefault();
    sessionStorage.removeItem('authToken');
    setAuthState(false);
    showToast('Logged out successfully', 'info');
    navigateTo('#/');
}













/// PREVIEWS CODE IN ACTIVITY 2

window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};


document.addEventListener('DOMContentLoaded', async () => {
    initializeEventListeners();

    if (!window.location.hash) {
        window.location.hash = '#/';
    }


    const token = sessionStorage.getItem('authToken');
    if (token) {
        try {
            const response = await fetch("http://localhost:3000/api/profile", {
                headers: getAuthHeader()
            });

            if (response.ok) {
                const data = await response.json();
                const user = {
                    id: data.user.id,
                    firstName: data.user.firstName || data.user.username,
                    lastName: data.user.lastName || '',
                    email: data.user.email || '',
                    role: data.user.role
                };
                setAuthState(true, user);
            } else {

                sessionStorage.removeItem('authToken');
            }
        } catch (err) {
            sessionStorage.removeItem('authToken');
        }
    }

    handleRouting();
    window.addEventListener('hashchange', handleRouting);
});



function loadFromStorage() {
    try {
        // Retrieve stored data
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            // Parse JSON string into JavaScript object
            window.db = JSON.parse(stored);
        } else {
            // Initialize with default data if none exists
            seedDatabase();
        }
    } catch (e) {
        // Handle corrupted data by reseeding
        console.error('Storage load error:', e);
        seedDatabase();
    }
}


function saveToStorage() {
    try {
        // Convert database object to JSON string and store
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
    } catch (e) {
        // Handle storage quota exceeded errors
        console.error('Storage save error:', e);
        showToast('Error saving data', 'danger');
    }
}

function seedDatabase() {
    window.db = {
        accounts: [
            {
                id: generateId(),
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'Admin',
                verified: true  // Admin is pre-verified for immediate use
            }
        ],
        departments: [
            { id: generateId(), name: 'Engineering', description: 'Software team' },
            { id: generateId(), name: 'HR', description: 'Human Resources' }
        ],
        employees: [],   // Start with no employees
        requests: []     // Start with no requests
    };
    // Persist seeded data
    saveToStorage();
}


// Changes URL hash to navigate between pages without reloading
function navigateTo(hash) {
    // Updates hash which triggers hashchange event
    window.location.hash = hash;
}






// Updates global state and UI based on authentication status
function setAuthState(isAuth, user = null) {
    // Update global current user
    currentUser = user;
    const body = document.body;

    if (isAuth && user) {
        // Remove logged-out class, add logged-in class
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');

        // Add admin class if user has admin role
        if (user.role === 'admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }

        // Display user's full name in navbar dropdown
        document.getElementById('username-display').textContent = user.firstName + ' ' + user.lastName;
    } else {
        // Reset to logged-out state
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
        currentUser = null;
    }
}


// Centralizes all event listener initialization
function initializeEventListeners() {
    // Registration form submission
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Login form submission
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Logout button click
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Email verification simulation button
    document.getElementById('simulate-verify-btn').addEventListener('click', handleVerifyEmail);

    // Employee management buttons
    document.getElementById('add-employee-btn').addEventListener('click', showEmployeeForm);
    document.getElementById('cancel-employee-btn').addEventListener('click', hideEmployeeForm);
    document.getElementById('employee-form').addEventListener('submit', handleEmployeeSubmit);

    // Department add button (placeholder functionality)
    document.getElementById('add-department-btn').addEventListener('click', () => {
        alert('Department creation not fully implemented in this prototype');
    });

    // Account management buttons
    document.getElementById('add-account-btn').addEventListener('click', showAccountForm);
    document.getElementById('cancel-account-btn').addEventListener('click', hideAccountForm);
    document.getElementById('account-form').addEventListener('submit', handleAccountSubmit);

    // Request management buttons
    document.getElementById('new-request-btn').addEventListener('click', showRequestModal);
    document.getElementById('add-item-btn').addEventListener('click', addRequestItem);
    document.getElementById('request-form').addEventListener('submit', handleRequestSubmit);
}



function handleVerifyEmail() {
    // Retrieve pending verification email
    const email = localStorage.getItem('unverified_email');
    if (!email) {
        showToast('No pending verification', 'warning');
        return;
    }

    // Find account with pending verification
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
        // Update verified status
        account.verified = true;
        saveToStorage();

        // Clean up localStorage
        localStorage.removeItem('unverified_email');

        // Set flag for login page to show success message
        localStorage.setItem('email_verified', 'true');

        // Notify user and redirect to login
        showToast('Email verified successfully!', 'success');
        navigateTo('#/login');
    } else {
        showToast('Account not found', 'danger');
    }
}



async function renderProfile() {
    if (!currentUser) return;

    try {
        const response = await fetch("http://localhost:3000/api/profile", {
            headers: getAuthHeader()
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'Failed to load profile', 'danger');
            return;
        }

        const user = data.user;
        document.getElementById('profile-content').innerHTML = `
            <div class="mb-3">
                <h4>${currentUser.firstName} ${currentUser.lastName}</h4>
            </div>
            <div class="mb-2">
                <strong>Email:</strong> ${currentUser.email}
            </div>
            <div class="mb-2">
                <strong>Role:</strong> ${user.role}
            </div>
            <div class="mb-2">
                <strong>ID:</strong> ${user.id}
            </div>
        `;
    } catch (err) {
        showToast('Cannot reach server.', 'danger');
    }
}

function renderEmployeesList() {
    const employees = window.db.employees;
    let html = '';

    // Show message if no employees exist
    if (employees.length === 0) {
        html = '<div class="alert alert-info">No employees.</div>';
    } else {
        // Build table with headers
        html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Dept</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Generate row for each employee
        employees.forEach(emp => {
            // Look up linked user account by email
            const user = window.db.accounts.find(acc => acc.email === emp.userEmail);
            // Look up linked department by ID
            const dept = window.db.departments.find(d => d.id === emp.departmentId);

            html += `
                <tr>
                    <td>${emp.employeeId}</td>
                    <td>${user ? user.firstName + ' ' + user.lastName : emp.userEmail}</td>
                    <td>${emp.position}</td>
                    <td>${dept ? dept.name : 'N/A'}</td>
                    <td class="table-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="editEmployee('${emp.id}')">Edit</button>
                        <button class="btn btn-outline-danger" onclick="deleteEmployee('${emp.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
    }

    // Inject table into container
    document.getElementById('employees-list').innerHTML = html;
}


function showEmployeeForm(employeeId = null) {
    const container = document.getElementById('employee-form-container');
    const form = document.getElementById('employee-form');

    // Populate department dropdown from database
    const deptSelect = document.getElementById('emp-department');
    deptSelect.innerHTML = window.db.departments.map(dept =>
        `<option value="${dept.id}">${dept.name}</option>`
    ).join('');

    if (employeeId) {
        // Edit mode: pre-fill form with existing employee data
        const emp = window.db.employees.find(e => e.id === employeeId);
        if (emp) {
            document.getElementById('emp-id').value = emp.employeeId;
            document.getElementById('emp-email').value = emp.userEmail;
            document.getElementById('emp-position').value = emp.position;
            document.getElementById('emp-department').value = emp.departmentId;
            document.getElementById('emp-hiredate').value = emp.hireDate;
            // Store ID in form to track edit mode
            form.dataset.editId = employeeId;
        }
    } else {
        // Create mode: clear form
        form.reset();
        delete form.dataset.editId;
    }

    // Show form container
    container.classList.remove('d-none');
}


function hideEmployeeForm() {
    document.getElementById('employee-form-container').classList.add('d-none');
    document.getElementById('employee-form').reset();
}

function handleEmployeeSubmit(e) {
    // Prevent form from reloading page
    e.preventDefault();

    // Capture form values
    const employeeId = document.getElementById('emp-id').value.trim();
    const userEmail = document.getElementById('emp-email').value.trim().toLowerCase();
    const position = document.getElementById('emp-position').value.trim();
    const departmentId = document.getElementById('emp-department').value;
    const hireDate = document.getElementById('emp-hiredate').value;

    // Validate that user email exists in accounts table
    const user = window.db.accounts.find(acc => acc.email === userEmail);
    if (!user) {
        showToast('User email not found in accounts', 'danger');
        return;
    }

    const form = document.getElementById('employee-form');
    const editId = form.dataset.editId;

    if (editId) {
        // Update existing employee
        const emp = window.db.employees.find(e => e.id === editId);
        if (emp) {
            emp.employeeId = employeeId;
            emp.userEmail = userEmail;
            emp.position = position;
            emp.departmentId = departmentId;
            emp.hireDate = hireDate;
        }
        showToast('Employee updated', 'success');
    } else {
        // Create new employee
        const newEmployee = {
            id: generateId(),
            employeeId,
            userEmail,          // Links to account
            position,
            departmentId,       // Links to department
            hireDate
        };
        window.db.employees.push(newEmployee);
        showToast('Employee added', 'success');
    }

    // Persist changes and refresh display
    saveToStorage();
    hideEmployeeForm();
    renderEmployeesList();
}

function editEmployee(id) {
    showEmployeeForm(id);
}


function deleteEmployee(id) {
    if (confirm('Delete this employee?')) {
        // Filter out employee with matching ID
        window.db.employees = window.db.employees.filter(e => e.id !== id);
        saveToStorage();
        showToast('Employee deleted', 'info');
        renderEmployeesList();
    }
}

function renderDepartmentsList() {
    const departments = window.db.departments;
    let html = '';

    // Show message if no departments exist
    if (departments.length === 0) {
        html = '<div class="alert alert-info">No departments.</div>';
    } else {
        // Build table with department data
        html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        departments.forEach(dept => {
            html += `
                <tr>
                    <td>${dept.name}</td>
                    <td>${dept.description}</td>
                    <td class="table-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="alert('Edit not implemented')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="alert('Delete not implemented')">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
    }

    // Inject table into container
    document.getElementById('departments-list').innerHTML = html;
}


function renderAccountsList() {
    const accounts = window.db.accounts;
    let html = '';

    // Show message if no accounts exist
    if (accounts.length === 0) {
        html = '<div class="alert alert-info">No accounts.</div>';
    } else {
        // Build table with account data
        html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Verified</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        accounts.forEach(acc => {
            html += `
                <tr>
                    <td>${acc.firstName} ${acc.lastName}</td>
                    <td>${acc.email}</td>
                    <td>${acc.role}</td>
                    <td>${acc.verified ? '✅' : '—'}</td>
                    <td class="table-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="editAccount('${acc.id}')">Edit</button>
                        <button class="btn btn-outline-warning" onclick="resetPassword('${acc.id}')">Reset Password</button>
                        <button class="btn btn-outline-danger" onclick="deleteAccount('${acc.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
    }

    // Inject table into container
    document.getElementById('accounts-list').innerHTML = html;
}


function showAccountForm(accountId = null) {
    const container = document.getElementById('account-form-container');
    const form = document.getElementById('account-form');

    if (accountId) {
        // Edit mode: pre-fill form with existing account data
        const acc = window.db.accounts.find(a => a.id === accountId);
        if (acc) {
            document.getElementById('acc-firstname').value = acc.firstName;
            document.getElementById('acc-lastname').value = acc.lastName;
            document.getElementById('acc-email').value = acc.email;
            document.getElementById('acc-password').value = acc.password;
            document.getElementById('acc-role').value = acc.role;
            document.getElementById('acc-verified').checked = acc.verified;
            // Store ID in form to track edit mode
            form.dataset.editId = accountId;
        }
    } else {
        // Create mode: clear form
        form.reset();
        delete form.dataset.editId;
    }

    // Show form container
    container.classList.remove('d-none');
}


function hideAccountForm() {
    document.getElementById('account-form-container').classList.add('d-none');
    document.getElementById('account-form').reset();
}


function handleAccountSubmit(e) {
    // Prevent form from reloading page
    e.preventDefault();

    // Capture form values
    const firstName = document.getElementById('acc-firstname').value.trim();
    const lastName = document.getElementById('acc-lastname').value.trim();
    const email = document.getElementById('acc-email').value.trim().toLowerCase();
    const password = document.getElementById('acc-password').value;
    const role = document.getElementById('acc-role').value;
    const verified = document.getElementById('acc-verified').checked;

    // Validate password length
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }

    const form = document.getElementById('account-form');
    const editId = form.dataset.editId;

    if (editId) {
        // Update existing account
        const acc = window.db.accounts.find(a => a.id === editId);
        if (acc) {
            // Check email uniqueness (excluding current account)
            const existingEmail = window.db.accounts.find(a => a.email === email && a.id !== editId);
            if (existingEmail) {
                showToast('Email already in use', 'danger');
                return;
            }

            // Update all fields
            acc.firstName = firstName;
            acc.lastName = lastName;
            acc.email = email;
            acc.password = password;
            acc.role = role;
            acc.verified = verified;
        }
        showToast('Account updated', 'success');
    } else {
        // Create new account
        // Check email uniqueness
        if (window.db.accounts.find(a => a.email === email)) {
            showToast('Email already exists', 'danger');
            return;
        }

        const newAccount = {
            id: generateId(),
            firstName,
            lastName,
            email,
            password,
            role,
            verified
        };
        window.db.accounts.push(newAccount);
        showToast('Account created', 'success');
    }

    // Persist changes and refresh display
    saveToStorage();
    hideAccountForm();
    renderAccountsList();
}


function editAccount(id) {
    showAccountForm(id);
}

function resetPassword(id) {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (newPassword && newPassword.length >= 6) {
        const acc = window.db.accounts.find(a => a.id === id);
        if (acc) {
            acc.password = newPassword;
            saveToStorage();
            showToast('Password reset successfully', 'success');
        }
    } else if (newPassword !== null) {
        // User didn't cancel but password too short
        showToast('Password must be at least 6 characters', 'danger');
    }
}

function deleteAccount(id) {
    // Prevent user from deleting their own account
    if (currentUser && currentUser.id === id) {
        showToast('Cannot delete your own account', 'danger');
        return;
    }

    if (confirm('Delete this account? This cannot be undone.')) {
        // Filter out account with matching ID
        window.db.accounts = window.db.accounts.filter(a => a.id !== id);
        saveToStorage();
        showToast('Account deleted', 'info');
        renderAccountsList();
    }
}


function renderRequestsList() {
    // Filter to show only current user's requests (data privacy)
    const requests = window.db.requests.filter(req => req.employeeEmail === currentUser.email);
    let html = '';

    // Show empty state if no requests exist
    if (requests.length === 0) {
        html = `
            <div class="alert alert-info">
                You have no requests yet.
                <br>
                <button class="btn btn-success mt-2" onclick="showRequestModal()">Create One</button>
            </div>
        `;
    } else {
        // Build table with request data
        html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Items</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        requests.forEach(req => {
            // Map status to Bootstrap badge color
            const statusClass =
                req.status === 'Approved' ? 'success' :   // Green
                    req.status === 'Rejected' ? 'danger' :    // Red
                        'warning';                                 // Yellow for Pending

            // Format items as comma-separated list with quantities
            const itemsList = req.items.map(item => `${item.name} (${item.qty})`).join(', ');

            html += `
                <tr>
                    <td>${req.date}</td>
                    <td>${req.type}</td>
                    <td>${itemsList}</td>
                    <td><span class="badge bg-${statusClass}">${req.status}</span></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
    }

    // Inject table into container
    document.getElementById('requests-list').innerHTML = html;
}


function showRequestModal() {
    // Create Bootstrap modal instance
    const modal = new bootstrap.Modal(document.getElementById('requestModal'));

    // Reset form to clean state
    document.getElementById('request-form').reset();

    // Reset to single item row (removes any extras from previous use)
    document.getElementById('request-items').innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control item-name" placeholder="Item name" required>
            <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" required>
            <button type="button" class="btn btn-danger remove-item" disabled>×</button>
        </div>
    `;

    // Display modal
    modal.show();
}

function addRequestItem() {
    const container = document.getElementById('request-items');

    // Create new item row
    const newItem = document.createElement('div');
    newItem.className = 'input-group mb-2';
    newItem.innerHTML = `
        <input type="text" class="form-control item-name" placeholder="Item name" required>
        <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" required>
        <button type="button" class="btn btn-danger remove-item">×</button>
    `;

    // Attach remove handler to delete button
    newItem.querySelector('.remove-item').addEventListener('click', function () {
        newItem.remove();
    });

    // Add row to container
    container.appendChild(newItem);
}

function handleRequestSubmit(e) {
    // Prevent form from reloading page
    e.preventDefault();

    // Capture request type
    const type = document.getElementById('req-type').value;

    // Collect all item rows
    const itemInputs = document.querySelectorAll('#request-items .input-group');
    const items = [];

    // Extract name and quantity from each item row
    itemInputs.forEach(input => {
        const name = input.querySelector('.item-name').value.trim();
        const qty = parseInt(input.querySelector('.item-qty').value);
        if (name && qty > 0) {
            items.push({ name, qty });
        }
    });

    // Validate at least one item exists
    if (items.length === 0) {
        showToast('Please add at least one item', 'danger');
        return;
    }

    // Create new request object
    const newRequest = {
        id: generateId(),
        type,
        items,
        status: 'Pending',                               // Default status
        date: new Date().toISOString().split('T')[0],    // Current date in YYYY-MM-DD
        employeeEmail: currentUser.email                 // Link to current user
    };

    // Add to database and persist
    window.db.requests.push(newRequest);
    saveToStorage();

    // Notify user and close modal
    showToast('Request submitted successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();

    // Refresh requests list
    renderRequestsList();
}


function generateId() {
    // Combines timestamp (base36) with random string for uniqueness
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}


function showToast(message, type = 'info') {
    // Create container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast alert
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to container
    container.appendChild(toast);

    // Auto-remove after 3 seconds with fade animation
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 150);
    }, 3000);
}