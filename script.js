// Global variables
let currentUser = null;
let users = [];
let trips = [];
let expenses = [];
let currentTripId = null; // Reset to null to avoid stale references
let currentUpdateExpenseId = null; // For expense editing
let budgetChart = null;
let cashFlowChart = null; // New chart variable
let currentSection = 'home';
let currentTripData = null; // Store current trip data for validation

// --- Helper Functions for Date Validation ---
function getCurrentTripData() {
    if (!currentTripId) return null;
    
    // Try to get from cached currentTripData first
    if (currentTripData && currentTripData.id == currentTripId) {
        return currentTripData;
    }
    
    // If not cached, try to find in trips array
    const trip = trips.find(t => t.id == currentTripId);
    if (trip) {
        currentTripData = trip;
        return trip;
    }
    
    return null;
}

function validateExpenseDate(expenseDate) {
    const tripData = getCurrentTripData();
    if (!tripData || !tripData.start_date || !tripData.end_date) {
        console.warn('Trip data not available for date validation');
        return { isValid: true, message: '' }; // Allow if trip data not available
    }
    
    const expenseDateTime = new Date(expenseDate);
    const tripStartDate = new Date(tripData.start_date);
    const tripEndDate = new Date(tripData.end_date);
    
    // Normalize dates to midnight for comparison
    expenseDateTime.setHours(0, 0, 0, 0);
    tripStartDate.setHours(0, 0, 0, 0);
    tripEndDate.setHours(0, 0, 0, 0);
    
    if (expenseDateTime < tripStartDate || expenseDateTime > tripEndDate) {
        const formatDate = (date) => date.toISOString().split('T')[0];
        return {
            isValid: false,
            message: `Expense date must be between ${formatDate(tripStartDate)} and ${formatDate(tripEndDate)} (trip duration).`
        };
    }
    
    return { isValid: true, message: '' };
}

function showDateValidationWarning(message, inputElement) {
    // Remove any existing warning
    const existingWarning = document.querySelector('.date-validation-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    // Create warning element
    const warning = document.createElement('div');
    warning.className = 'date-validation-warning';
    warning.style.cssText = `
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 4px;
        padding: 8px;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        display: flex;
        align-items: center;
    `;
    warning.innerHTML = `
        <span style="margin-right: 8px;">⚠️</span>
        <span>${message}</span>
    `;
    
    // Insert warning after the input element
    if (inputElement && inputElement.parentNode) {
        inputElement.parentNode.insertBefore(warning, inputElement.nextSibling);
    }
    
    // Auto-remove warning after 10 seconds
    setTimeout(() => {
        if (warning && warning.parentNode) {
            warning.remove();
        }
    }, 10000);
}

function clearDateValidationWarning() {
    const existingWarning = document.querySelector('.date-validation-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
}

function showDateValidationSuccess(message, inputElement) {
    // Remove any existing success message
    clearDateValidationSuccess();
    
    // Create success element
    const success = document.createElement('div');
    success.className = 'date-validation-success';
    success.style.cssText = `
        color: #28a745;
        font-size: 0.875rem;
        margin-top: 4px;
        padding: 6px;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 4px;
        display: flex;
        align-items: center;
    `;
    success.innerHTML = `
        <span style="margin-right: 8px;">✓</span>
        <span>${message}</span>
    `;
    
    // Insert success message after the input element
    if (inputElement && inputElement.parentNode) {
        inputElement.parentNode.insertBefore(success, inputElement.nextSibling);
    }
    
    // Auto-remove success message after 3 seconds
    setTimeout(() => {
        if (success && success.parentNode) {
            success.remove();
        }
    }, 3000);
}

function clearDateValidationSuccess() {
    const existingSuccess = document.querySelector('.date-validation-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
}

// Event handlers for real-time date validation
function handleExpenseDateChange(event) {
    const dateInput = event.target;
    const dateValue = dateInput.value;
    
    clearDateValidationWarning();
    clearDateValidationSuccess();
    
    if (dateValue) {
        const validation = validateExpenseDate(dateValue);
        if (!validation.isValid) {
            showDateValidationWarning(validation.message, dateInput);
        } else {
            showDateValidationSuccess('Date is within trip duration', dateInput);
        }
    }
}

function handleUpdateExpenseDateChange(event) {
    const dateInput = event.target;
    const dateValue = dateInput.value;
    
    clearDateValidationWarning();
    clearDateValidationSuccess();
    
    if (dateValue) {
        const validation = validateExpenseDate(dateValue);
        if (!validation.isValid) {
            showDateValidationWarning(validation.message, dateInput);
        } else {
            showDateValidationSuccess('Date is within trip duration', dateInput);
        }
    }
}

function updateDateHelperText(helperId) {
    const helperElement = document.getElementById(helperId);
    if (!helperElement) return;
    
    const tripData = getCurrentTripData();
    if (tripData && tripData.start_date && tripData.end_date) {
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        };
        
        helperElement.textContent = `Valid date range: ${formatDate(tripData.start_date)} - ${formatDate(tripData.end_date)}`;
        helperElement.style.color = '#28a745';
    } else {
        helperElement.textContent = 'Enter the date when this expense occurred';
        helperElement.style.color = '#666';
    }
}

// Function to clear user data when switching users
function clearUserData() {
    // Clear global variables
    trips = [];
    expenses = [];
    currentTripId = null;
    currentUpdateExpenseId = null;
    currentTripData = null;
    
    // Clear dashboard elements
    const tripsList = document.getElementById('tripsList');
    const expensesList = document.getElementById('expensesList');
    const budgetOverview = document.getElementById('budgetOverview');
    const transactionDetails = document.getElementById('transactionDetails');
    const groupOverview = document.getElementById('groupOverview');
    const participantsList = document.getElementById('participantsList');
    const tipsContainer = document.getElementById('tipsContainer');
    
    if (tripsList) tripsList.innerHTML = '';
    if (expensesList) expensesList.innerHTML = '';
    if (budgetOverview) budgetOverview.innerHTML = '';
    if (transactionDetails) transactionDetails.innerHTML = '';
    if (groupOverview) groupOverview.innerHTML = '';
    if (participantsList) participantsList.innerHTML = '';
    if (tipsContainer) tipsContainer.innerHTML = '';
    
    // Clear charts
    if (budgetChart) {
        budgetChart.destroy();
        budgetChart = null;
    }
    if (cashFlowChart) {
        cashFlowChart.destroy();
        cashFlowChart = null;
    }
    
    console.log('User data cleared including group travel data');
}

// Function to ensure data isolation between users
function enforceUserDataIsolation() {
    // Additional measure: Clear any localStorage or sessionStorage that might persist
    try {
        // Clear any application-specific storage
        localStorage.removeItem('wisetravel_currentTrip');
        localStorage.removeItem('wisetravel_userData');
        sessionStorage.clear();
        
        // Clear any cached API data
        if (window.WiseTravel2API) {
            // Force a fresh session check
            window.WiseTravel2API.currentUser = null;
        }
        
        console.log('User data isolation enforced');
    } catch (error) {
        console.log('Could not clear storage:', error.message);
    }
}

// --- API Integration: Listen for user session ready ---
document.addEventListener('userSessionReady', function(event) {
    const user = event.detail.user;
    if (user) {
        // Clear previous user data before loading new user data
        clearUserData();
        
        // Enforce strict data isolation
        enforceUserDataIsolation();
        
        currentUser = user;
        // Hide auth section and show user content with null checks
        const authSection = document.getElementById('authSection');
        const userInfo = document.getElementById('userInfo');
        const currentUserElement = document.getElementById('currentUser');
        const bestServices = document.getElementById('bestServices');
        
        if (authSection) authSection.style.display = 'none';
        if (userInfo) userInfo.classList.remove('hidden');
        if (currentUserElement) currentUserElement.textContent = user.name;
        updateNavbar();
        navigateToSection('home');
        if (bestServices) bestServices.style.display = 'block';
        loadUserData();
    } else {
        console.log('No user session found, please login manually');
        // Show auth section with null checks
        const authSection = document.getElementById('authSection');
        const home = document.getElementById('home');
        const dashboard = document.getElementById('dashboard');
        const about = document.getElementById('about');
        const profile = document.getElementById('profile');
        const userInfo = document.getElementById('userInfo');
        const bestServices = document.getElementById('bestServices');
        
        if (authSection) authSection.style.display = 'block';
        if (home) home.style.display = 'none';
        if (dashboard) dashboard.style.display = 'none';
        if (about) about.style.display = 'none';
        if (profile) profile.style.display = 'none';
        if (userInfo) userInfo.classList.add('hidden');
        if (bestServices) bestServices.style.display = 'none';
        
        // Update navbar to show unauthenticated state
        updateNavbar();
        
        // Auto-login disabled for manual testing
    }
});

// Auto-login function for testing purposes
async function autoLoginForTesting() {
    try {
        // Try to register a test user first
        const testUser = {
            name: 'Test User',
            email: 'test@wisetravel.local',
            password: 'test123',
            preferred_currency: 'MYR'
        };
        
        console.log('Attempting auto-login...');
        
        // Try to login first, if that fails, try to register
        try {
            const loginResponse = await window.WiseTravel2API.login({
                email: testUser.email,
                password: testUser.password
            });
            
            if (loginResponse.success) {
                // Clear previous user data before loading new user data
                clearUserData();
                
                // Enforce strict data isolation
                enforceUserDataIsolation();
                
                currentUser = loginResponse.data;
                console.log('Auto-login successful:', currentUser);
                
                // Hide auth section and show user content
                const authSection = document.getElementById('authSection');
                const userInfo = document.getElementById('userInfo');
                const currentUserElement = document.getElementById('currentUser');
                const bestServices = document.getElementById('bestServices');
                
                if (authSection) authSection.style.display = 'none';
                if (userInfo) userInfo.classList.remove('hidden');
                if (currentUserElement) currentUserElement.textContent = currentUser.name;
                if (bestServices) bestServices.style.display = 'block';
                
                updateNavbar();
                navigateToSection('home');
                loadUserData();
                return;
            }
        } catch (loginError) {
            console.log('Login failed, trying to register test user...');
        }
        
        // If login failed, try to register
        const registerResponse = await window.WiseTravel2API.register(testUser);
        
        if (registerResponse.success) {
            // Clear previous user data before loading new user data
            clearUserData();
            
            // Enforce strict data isolation
            enforceUserDataIsolation();
            
            currentUser = registerResponse.data;
            console.log('Auto-registration successful:', currentUser);
            
            // Hide auth section and show user content
            const authSection = document.getElementById('authSection');
            const userInfo = document.getElementById('userInfo');
            const currentUserElement = document.getElementById('currentUser');
            const bestServices = document.getElementById('bestServices');
            
            if (authSection) authSection.style.display = 'none';
            if (userInfo) userInfo.classList.remove('hidden');
            if (currentUserElement) currentUserElement.textContent = currentUser.name;
            if (bestServices) bestServices.style.display = 'block';
            
            updateNavbar();
            navigateToSection('home');
            loadUserData();
        }
    } catch (error) {
        console.error('Auto-login failed:', error);
        console.log('Please login manually using the form');
    }
}

// Create a default trip for testing
async function createDefaultTrip() {
    try {
        const defaultTripData = {
            name: 'Test Trip to Kuala Lumpur',
            destination_id: 1, // Assuming Kuala Lumpur is destination ID 1
            start_date: '2025-09-01',
            end_date: '2025-09-07',
            budget: 2000.00
        };
        
        console.log('Creating default trip:', defaultTripData);
        
        const response = await window.WiseTravel2API.createTrip(defaultTripData);
        
        if (response.success) {
            console.log('Default trip created successfully:', response.data);
            // Reload the trips list
            await loadUserData();
            
            // Auto-select the new trip
            if (response.data && response.data.id) {
                setTimeout(() => {
                    selectTrip(response.data.id);
                }, 500);
            }
        } else {
            console.error('Failed to create default trip:', response);
        }
    } catch (error) {
        console.error('Error creating default trip:', error);
    }
}

// Debug function to manually create a trip (can be called from console)
window.createTestTrip = createDefaultTrip;

// --- NEW: Run this when the DOM is fully loaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Night mode functionality
    const nightModeToggle = document.getElementById('night-mode-toggle');
    const body = document.body;

    // Function to set the theme
    const setNightMode = (isNight) => {
        if (isNight) {
            body.classList.add('night-mode');
        } else {
            body.classList.remove('night-mode');
        }
    };

    // Toggle button event
    nightModeToggle.addEventListener('click', () => {
        const isNight = body.classList.toggle('night-mode');
        localStorage.setItem('nightMode', isNight);
        
        // Refresh charts and text when night mode is toggled
        if (currentTripId) {
            updateBudgetOverview();
            updateCashFlowChart();
        }
    });

    // Check localStorage for saved preference
    const savedNightMode = localStorage.getItem('nightMode') === 'true';
    setNightMode(savedNightMode);

    // Load destinations for trip creation form
    loadDestinationsForTripCreation();

    // If no user is logged in, show the auth section and hide the main content
    if (!currentUser) {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('home').style.display = 'none';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('about').style.display = 'none';
        if (document.getElementById('profile')) document.getElementById('profile').style.display = 'none';
        
        // Update navbar to hide protected navigation links
        updateNavbar();
    }
    
    // Listen for currency updates to refresh trips display
    document.addEventListener('userCurrencyUpdated', async (event) => {
        console.log('Currency updated event detected:', event.detail.currency);
        await loadUserData(); // Refresh trips display with the new currency
    });
});

// --- Destination Emoji Function ---
function getDestinationEmoji() {
    return {
        'Kuala Lumpur': '🏙️',
        'George Town, Penang': '🏝️',
        'Langkawi': '🌊',
        'Melaka': '🏛️',
        'Kota Kinabalu': '🌅',
        'Kuching': '🐱',
        'Johor Bahru': '🌃',
        'Cameron Highlands': '🍃',
        'Genting Highlands': '🎰',
        'Tioman Island': '🐠',
        'Ipoh': '🍜',
        'Redang Island': '🏖️',
        'Perhentian Islands': '🤿',
        'Taman Negara': '🌳',
        'Putrajaya': '🏛️'
    };
}

// --- Destination Name Mapping Function ---
function mapDestinationName(destinationName) {
    // Map database destination names to destinationsData keys
    const nameMapping = {
        'Kuala Lumpur': 'Kuala Lumpur',
        'George Town, Penang': 'Penang',
        'Langkawi': 'Langkawi',
        'Melaka': 'Malacca',
        'Kota Kinabalu': 'Kota Kinabalu',
        'Kuching': 'Sarawak',
        'Johor Bahru': 'Johor Bahru',
        'Cameron Highlands': 'Cameron Highlands',
        'Genting Highlands': 'Genting Highlands',
        'Tioman Island': 'Tioman Island',
        'Ipoh': 'Ipoh',
        'Redang Island': 'Redang Island',
        'Perhentian Islands': 'Perhentian Islands',
        'Taman Negara': 'Taman Negara',
        'Putrajaya': 'Putrajaya'
    };
    
    return nameMapping[destinationName] || destinationName;
}

// --- NEW: Detailed Destination Data ---
const destinationsData = {
    "Kuala Lumpur": {
        attractions: [
            { name: "Petronas Twin Towers", avgExpense: 80, operatingHours: "10:00 - 18:00", operatingDays: "Tuesday - Sunday", rating: 4.7 },
            { name: "Batu Caves", avgExpense: 5, operatingHours: "07:00 - 20:00", operatingDays: "Daily", rating: 3.0 },
            { name: "Menara KL Tower", avgExpense: 52, operatingHours: "09:00 - 22:00", operatingDays: "Daily", rating: 4.4 },
        ],
        cuisine: [
            { name: "Jalan Alor Food Street", avgExpense: 30, operatingHours: "17:00 - Late", operatingDays: "Daily", rating: 4.6 },
            { name: "Nasi Lemak Antarabangsa", avgExpense: 15, operatingHours: "18:00 - 05:00", operatingDays: "Daily", rating: 4.3 },
        ],
        activities: [
            { name: "Aquaria KLCC", avgExpense: 75, operatingHours: "10:00 - 20:00", operatingDays: "Daily", rating: 4.5 },
            { name: "KL Bird Park", avgExpense: 63, operatingHours: "09:00 - 18:00", operatingDays: "Daily", rating: 4.4 },
        ],
        shopping: [
            { name: "Suria KLCC", avgExpense: 200, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.6 },
            { name: "Central Market", avgExpense: 50, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.3 },
        ],
        accommodation: [
            { name: "Budget Hostels (Chinatown)", avgExpense: 60, operatingHours: "24/7", operatingDays: "Daily", rating: 2.0 },
            { name: "Mid-range Hotels (Bukit Bintang)", avgExpense: 250, operatingHours: "24/7", operatingDays: "Daily", rating: 4.5 },
        ]
    },
    "Penang": {
        attractions: [
            { name: "Penang Hill", avgExpense: 30, operatingHours: "06:30 - 22:00", operatingDays: "Daily", rating: 4.6 },
            { name: "Kek Lok Si Temple", avgExpense: 0, operatingHours: "08:30 - 17:30", operatingDays: "Daily", rating: 2.7 },
        ],
        cuisine: [
            { name: "Gurney Drive Hawker Centre", avgExpense: 25, operatingHours: "16:30 - 23:00", operatingDays: "Daily", rating: 4.2 },
            { name: "Penang Road Famous Teochew Chendul", avgExpense: 5, operatingHours: "10:30 - 19:00", operatingDays: "Daily", rating: 3.5 },
        ],
        activities: [
            { name: "ESCAPE Theme Park", avgExpense: 147, operatingHours: "10:00 - 18:00", operatingDays: "Tuesday - Sunday", rating: 3.6 },
            { name: "Explore George Town Street Art", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.8 },
        ],
        shopping: [
            { name: "Gurney Plaza", avgExpense: 150, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 2.4 },
        ],
         accommodation: [
            { name: "Heritage Hotels (George Town)", avgExpense: 300, operatingHours: "24/7", operatingDays: "Daily", rating: 4.6 },
            { name: "Beach Resorts (Batu Ferringhi)", avgExpense: 400, operatingHours: "24/7", operatingDays: "Daily", rating: 3.3 },
        ]
    },
    "Langkawi": {
        attractions: [
            { name: "Langkawi Sky Bridge & Cable Car", avgExpense: 85, operatingHours: "09:30 - 19:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Tanjung Rhu Beach", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.6 },
        ],
        cuisine: [
            { name: "Wonderland Food Store (Seafood)", avgExpense: 60, operatingHours: "18:00 - 23:00", operatingDays: "Daily", rating: 4.3 },
            { name: "Nasi Dagang Pak Malau", avgExpense: 15, operatingHours: "08:00 - 14:00", operatingDays: "Daily", rating: 3.5 },
        ],
        activities: [
            { name: "Island Hopping (Tasik Dayang Bunting)", avgExpense: 45, operatingHours: "09:00 - 16:00", operatingDays: "Daily", rating: 4.5 },
            { name: "Mangrove Forest & Cave Tour", avgExpense: 120, operatingHours: "09:00 - 17:00", operatingDays: "Daily", rating: 2.8 },
        ],
        shopping: [
            { name: "The Zon Duty Free", avgExpense: 100, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 2.1 },
        ],
        accommodation: [
            { name: "Beach Chalets (Pantai Cenang)", avgExpense: 150, operatingHours: "24/7", operatingDays: "Daily", rating: 3.2 },
            { name: "Luxury Resorts (Datai Bay)", avgExpense: 1500, operatingHours: "24/7", operatingDays: "Daily", rating: 4.8 },
        ]
    },
    "Malacca": {
        attractions: [
            { name: "Jonker Street Night Market", avgExpense: 0, operatingHours: "18:00 - 00:00", operatingDays: "Friday - Sunday", rating: 4.4 },
            { name: "A Famosa Fort", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.3 },
        ],
        cuisine: [
            { name: "Capitol Satay Celup", avgExpense: 40, operatingHours: "16:00 - 01:00", operatingDays: "Daily", rating: 4.2 },
            { name: "Jonker 88 (Cendol & Laksa)", avgExpense: 20, operatingHours: "09:30 - 18:00", operatingDays: "Daily", rating: 4.4 },
        ],
        activities: [
            { name: "Melaka River Cruise", avgExpense: 30, operatingHours: "09:00 - 23:30", operatingDays: "Daily", rating: 4.4 },
            { name: "Trishaw Ride", avgExpense: 40, operatingHours: "Varies", operatingDays: "Daily", rating: 4.1 },
        ],
        shopping: [
            { name: "Dataran Pahlawan Melaka Megamall", avgExpense: 120, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.3 },
        ],
        accommodation: [
            { name: "Guesthouses (Jonker Street)", avgExpense: 100, operatingHours: "24/7", operatingDays: "Daily", rating: 4.3 },
            { name: "Riverside Hotels", avgExpense: 250, operatingHours: "24/7", operatingDays: "Daily", rating: 4.5 },
        ]
    },
    "Kota Kinabalu": {
        attractions: [
            { name: "Mount Kinabalu National Park", avgExpense: 15, operatingHours: "07:00 - 17:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Kota Kinabalu City Mosque", avgExpense: 5, operatingHours: "08:00 - 17:00", operatingDays: "Daily (check prayer times)", rating: 4.6 },
        ],
        cuisine: [
            { name: "Welcome Seafood Restaurant", avgExpense: 70, operatingHours: "12:00 - 00:00", operatingDays: "Daily", rating: 4.4 },
            { name: "Yee Fung Laksa", avgExpense: 15, operatingHours: "06:30 - 17:00", operatingDays: "Daily", rating: 4.5 },
        ],
        activities: [
            { name: "Island Hopping (Tunku Abdul Rahman Park)", avgExpense: 60, operatingHours: "08:30 - 17:00", operatingDays: "Daily", rating: 4.6 },
            { name: "Klias River Cruise (Proboscis Monkeys)", avgExpense: 180, operatingHours: "13:00 - 20:00", operatingDays: "Daily", rating: 4.5 },
        ],
        shopping: [
            { name: "Imago Shopping Mall", avgExpense: 150, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.5 },
            { name: "Filipino Market (Handicrafts)", avgExpense: 40, operatingHours: "09:00 - 22:00", operatingDays: "Daily", rating: 4.2 },
        ],
        accommodation: [
            { name: "City Centre Hotels", avgExpense: 200, operatingHours: "24/7", operatingDays: "Daily", rating: 4.4 },
            { name: "Seaside Resorts", avgExpense: 450, operatingHours: "24/7", operatingDays: "Daily", rating: 4.6 },
        ]
    },
     "Kuching": {
        attractions: [
            { name: "Semenggoh Wildlife Centre", avgExpense: 10, operatingHours: "08:00-10:00, 14:00-16:00", operatingDays: "Daily", rating: 4.6 },
            { name: "Sarawak Cultural Village", avgExpense: 60, operatingHours: "09:00 - 17:00", operatingDays: "Daily", rating: 4.5 },
        ],
        cuisine: [
            { name: "Chong Choon Cafe (Sarawak Laksa)", avgExpense: 15, operatingHours: "06:30 - 12:30", operatingDays: "Wednesday - Monday", rating: 4.5 },
            { name: "Top Spot Food Court (Seafood)", avgExpense: 50, operatingHours: "17:00 - 00:00", operatingDays: "Daily", rating: 4.4 },
        ],
        activities: [
            { name: "Bako National Park Day Trip", avgExpense: 40, operatingHours: "08:00 - 17:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Kuching Waterfront Stroll", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.5 },
        ],
        shopping: [
            { name: "Main Bazaar (Antiques & Crafts)", avgExpense: 50, operatingHours: "09:00 - 18:00", operatingDays: "Daily", rating: 4.3 },
        ],
        accommodation: [
            { name: "Waterfront Hotels", avgExpense: 220, operatingHours: "24/7", operatingDays: "Daily", rating: 4.4 },
            { name: "Boutique Guesthouses", avgExpense: 120, operatingHours: "24/7", operatingDays: "Daily", rating: 4.6 },
        ]
    },
    "Johor Bahru": {
        attractions: [
            { name: "Legoland Malaysia", avgExpense: 189, operatingHours: "10:00 - 18:00", operatingDays: "Daily", rating: 4.4 },
            { name: "Arulmigu Sri Rajakaliamman Glass Temple", avgExpense: 10, operatingHours: "07:00 - 22:00", operatingDays: "Daily", rating: 4.3 },
        ],
        cuisine: [
            { name: "Restoran Ya Wang (Duck)", avgExpense: 45, operatingHours: "08:00 - 18:00", operatingDays: "Daily", rating: 4.4 },
            { name: "Hiap Joo Bakery & Biscuit Factory", avgExpense: 12, operatingHours: "07:30 - 17:00", operatingDays: "Monday - Saturday", rating: 4.6 },
        ],
        activities: [
            { name: "Angry Birds Activity Park", avgExpense: 75, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.0 },
        ],
        shopping: [
            { name: "Johor Bahru City Square", avgExpense: 130, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.4 },
            { name: "Johor Premium Outlets", avgExpense: 300, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.4 },
        ],
        accommodation: [
            { name: "City Centre Hotels", avgExpense: 180, operatingHours: "24/7", operatingDays: "Daily", rating: 4.2 },
            { name: "Apartments near Legoland", avgExpense: 250, operatingHours: "24/7", operatingDays: "Daily", rating: 4.5 },
        ]
    },
    "Cameron Highlands": {
        attractions: [
            { name: "BOH Tea Plantation Sungai Palas", avgExpense: 0, operatingHours: "08:30 - 16:30", operatingDays: "Tuesday - Sunday", rating: 4.6 },
            { name: "Mossy Forest", avgExpense: 30, operatingHours: "08:00 - 16:00", operatingDays: "Daily", rating: 4.5 },
        ],
        cuisine: [
            { name: "Steamboat Dinner", avgExpense: 40, operatingHours: "17:00 - 23:00", operatingDays: "Daily", rating: 4.3 },
            { name: "Scones & Tea at The Lord's Cafe", avgExpense: 20, operatingHours: "10:00 - 18:00", operatingDays: "Monday - Saturday", rating: 4.5 },
        ],
        activities: [
            { name: "Strawberry Picking (Big Red Strawberry Farm)", avgExpense: 15, operatingHours: "08:30 - 18:00", operatingDays: "Daily", rating: 4.2 },
            { name: "Hiking Trail No. 10", avgExpense: 0, operatingHours: "Daylight Hours", operatingDays: "Daily", rating: 4.4 },
        ],
        shopping: [
            { name: "Kea Farm Market", avgExpense: 25, operatingHours: "08:00 - 18:00", operatingDays: "Daily", rating: 4.1 },
        ],
        accommodation: [
            { name: "Tudor-style Hotels", avgExpense: 250, operatingHours: "24/7", operatingDays: "Daily", rating: 4.3 },
            { name: "Guesthouses in Tanah Rata", avgExpense: 100, operatingHours: "24/7", operatingDays: "Daily", rating: 4.1 },
        ]
    },
    "Genting Highlands": {
        attractions: [
            { name: "Genting SkyWorlds Theme Park", avgExpense: 151, operatingHours: "11:00 - 18:00", operatingDays: "Daily", rating: 4.2 },
            { name: "Chin Swee Caves Temple", avgExpense: 0, operatingHours: "09:00 - 18:00", operatingDays: "Daily", rating: 4.6 },
        ],
        cuisine: [
            { name: "Burger & Lobster", avgExpense: 150, operatingHours: "12:00 - 22:00", operatingDays: "Daily", rating: 4.4 },
            { name: "Malaysian Food Street", avgExpense: 35, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.1 },
        ],
        activities: [
            { name: "Awana SkyWay Cable Car", avgExpense: 18, operatingHours: "07:00 - 00:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Skytropolis Indoor Theme Park", avgExpense: 62, operatingHours: "14:00 - 21:00", operatingDays: "Daily", rating: 4.3 },
        ],
        shopping: [
            { name: "Genting Highlands Premium Outlets", avgExpense: 250, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.4 },
            { name: "SkyAvenue Mall", avgExpense: 200, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.5 },
        ],
        accommodation: [
            { name: "First World Hotel", avgExpense: 200, operatingHours: "24/7", operatingDays: "Daily", rating: 3.8 },
            { name: "Crockfords Hotel", avgExpense: 1200, operatingHours: "24/7", operatingDays: "Daily", rating: 4.7 },
        ]
    },
    "Ipoh": {
        attractions: [
            { name: "Concubine Lane", avgExpense: 0, operatingHours: "09:00 - 18:00", operatingDays: "Daily", rating: 4.3 },
            { name: "Kek Lok Tong Cave Temple", avgExpense: 0, operatingHours: "07:00 - 17:30", operatingDays: "Daily", rating: 4.6 },
        ],
        cuisine: [
            { name: "Restoran Tauge Ayam Lou Wong", avgExpense: 25, operatingHours: "10:30 - 21:00", operatingDays: "Daily", rating: 4.2 },
            { name: "Nam Heong White Coffee", avgExpense: 15, operatingHours: "07:00 - 17:30", operatingDays: "Daily", rating: 3.1 },
        ],
        activities: [
            { name: "Lost World of Tambun", avgExpense: 117, operatingHours: "11:00 - 18:00", operatingDays: "Monday - Sunday (Closed Tuesdays)", rating: 4.3 },
            { name: "Ipoh Mural Art Trail", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 2.4 },
        ],
        shopping: [
            { name: "Ipoh Parade", avgExpense: 100, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 1.2 },
        ],
        accommodation: [
            { name: "Boutique Hotels (Old Town)", avgExpense: 180, operatingHours: "24/7", operatingDays: "Daily", rating: 4.5 },
            { name: "Modern City Hotels", avgExpense: 220, operatingHours: "24/7", operatingDays: "Daily", rating: 3.3 },
        ]
    },
    "Tioman Island": {
        attractions: [
            { name: "Juara Turtle Project", avgExpense: 10, operatingHours: "10:00 - 16:00", operatingDays: "Daily (Seasonal)", rating: 4.7 },
        ],
        cuisine: [
            { name: "Riverside Cafe", avgExpense: 40, operatingHours: "08:00 - 22:00", operatingDays: "Daily (Seasonal)", rating: 4.4 },
        ],
        activities: [
            { name: "Snorkeling at Renggis Island", avgExpense: 80, operatingHours: "Daylight Hours", operatingDays: "Daily (Mar - Oct)", rating: 2.8 },
            { name: "Scuba Diving", avgExpense: 250, operatingHours: "08:00 - 17:00", operatingDays: "Daily (Mar - Oct)", rating: 4.7 },
            { name: "Jungle Trekking to Asah Waterfall", avgExpense: 0, operatingHours: "Daylight Hours", operatingDays: "Daily (Mar - Oct)", rating: 4.5 },
        ],
        shopping: [
            { name: "Vision Commerce (Duty-Free)", avgExpense: 70, operatingHours: "10:00 - 21:00", operatingDays: "Daily (Seasonal)", rating: 3.9 },
        ],
        accommodation: [
            { name: "Beachfront Chalets", avgExpense: 200, operatingHours: "24/7", operatingDays: "Daily (Mar - Oct)", rating: 4.1 },
            { name: "Dive Resorts", avgExpense: 400, operatingHours: "24/7", operatingDays: "Daily (Mar - Oct)", rating: 4.6 },
        ]
    },
    "Perhentian Islands": {
        attractions: [
            { name: "Turtle Beach", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily (Mar - Oct)", rating: 4.8 },
            { name: "Shark Point", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily (Mar - Oct)", rating: 4.6 },
        ],
        cuisine: [
            { name: "BBQ Dinner on Long Beach", avgExpense: 50, operatingHours: "18:00 - 22:00", operatingDays: "Daily (Mar - Oct)", rating: 4.4 },
        ],
        activities: [
            { name: "Snorkeling Trip (3 Points)", avgExpense: 40, operatingHours: "09:00 - 16:00", operatingDays: "Daily (Mar - Oct)", rating: 4.7 },
            { name: "Kayaking", avgExpense: 30, operatingHours: "Daylight Hours", operatingDays: "Daily (Mar - Oct)", rating: 4.5 },
            { name: "Discover Scuba Diving (DSD)", avgExpense: 220, operatingHours: "09:00 - 17:00", operatingDays: "Daily (Mar - Oct)", rating: 4.8 },
        ],
        shopping: [
            { name: "Local village shops", avgExpense: 20, operatingHours: "Varies", operatingDays: "Daily (Mar - Oct)", rating: 3.5 },
        ],
        accommodation: [
            { name: "Basic Chalets (Long Beach)", avgExpense: 100, operatingHours: "24/7", operatingDays: "Daily (Mar - Oct)", rating: 3.9 },
            { name: "Seaview Resorts (Perhentian Besar)", avgExpense: 350, operatingHours: "24/7", operatingDays: "Daily (Mar - Oct)", rating: 4.3 },
        ]
    },
     "Redang Island": {
        attractions: [
            { name: "Pasir Panjang (Long Beach)", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily (Mar - Oct)", rating: 4.7 },
        ],
        cuisine: [
            { name: "Resort Buffet Dinner", avgExpense: 80, operatingHours: "19:00 - 21:00", operatingDays: "Daily (Mar - Oct)", rating: 3.0 },
        ],
        activities: [
            { name: "Open Water Dive Course", avgExpense: 1200, operatingHours: "09:00 - 17:00", operatingDays: "Daily (Mar - Oct)", rating: 4.8 },
            { name: "Snorkeling at Marine Park Centre", avgExpense: 5, operatingHours: "09:00 - 17:00", operatingDays: "Daily (Mar - Oct)", rating: 4.6 },
            { name: "Sunset Watching", avgExpense: 0, operatingHours: "18:00 - 19:30", operatingDays: "Daily (Mar - Oct)", rating: 4.8 },
        ],
        shopping: [
             { name: "Resort Souvenir Shops", avgExpense: 50, operatingHours: "09:00 - 20:00", operatingDays: "Daily (Mar - Oct)", rating: 3.8 },
        ],
        accommodation: [
            { name: "All-Inclusive Resorts", avgExpense: 600, operatingHours: "24/7", operatingDays: "Daily (Mar - Oct)", rating: 4.5 },
        ]
    },
    "Sabah": {
        attractions: [
            { name: "Signal Hill Observatory Platform", avgExpense: 5, operatingHours: "06:00 - 22:00", operatingDays: "Daily", rating: 4.2 },
            { name: "Atkinson Clock Tower", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 2.0 }
        ],
        cuisine: [
            { name: "Welcome Seafood Restaurant", avgExpense: 70, operatingHours: "12:00 - 00:00", operatingDays: "Daily", rating: 4.4 },
            { name: "Fook Yuen Cafe & Bakery (Gaya St)", avgExpense: 15, operatingHours: "06:30 - 01:00", operatingDays: "Daily", rating: 4.3 }
        ],
        activities: [
            { name: "Island Hopping from Jesselton Point", avgExpense: 60, operatingHours: "08:00 - 17:00", operatingDays: "Daily", rating: 4.6 },
            { name: "Stroll along KK Waterfront", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 2.4 }
        ],
        shopping: [
            { name: "Gaya Street Sunday Market", avgExpense: 50, operatingHours: "06:00 - 13:00", operatingDays: "Sunday", rating: 4.5 },
            { name: "Imago Shopping Mall", avgExpense: 150, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.5 }
        ],
        accommodation: [
            { name: "Downtown Hotels (Gaya Street area)", avgExpense: 200, operatingHours: "24/7", operatingDays: "Daily", rating: 4.3 },
            { name: "Backpacker Hostels", avgExpense: 70, operatingHours: "24/7", operatingDays: "Daily", rating: 3.1 }
        ]
    },
    "Sarawak": {
        attractions: [
            { name: "Kuching Waterfront", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.5 },
            { name: "Darul Hana Bridge", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.6 }
        ],
        cuisine: [
            { name: "Top Spot Food Court (Seafood)", avgExpense: 50, operatingHours: "17:00 - 00:00", operatingDays: "Daily", rating: 4.4 },
            { name: "James Brooke Bistro & Cafe", avgExpense: 60, operatingHours: "10:00 - 00:00", operatingDays: "Daily", rating: 2.3 }
        ],
        activities: [
            { name: "Sampan Ride across Sarawak River", avgExpense: 1, operatingHours: "07:00 - 22:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Explore Main Bazaar & Carpenter St", avgExpense: 0, operatingHours: "Daylight Hours", operatingDays: "Daily", rating: 3.4 }
        ],
        shopping: [
            { name: "Main Bazaar (Souvenirs & Antiques)", avgExpense: 50, operatingHours: "09:00 - 18:00", operatingDays: "Daily", rating: 4.3 },
            { name: "Plaza Merdeka", avgExpense: 120, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.2 }
        ],
        accommodation: [
            { name: "Hotels along Kuching Waterfront", avgExpense: 250, operatingHours: "24/7", operatingDays: "Daily", rating: 4.5 },
            { name: "Guesthouses near Main Bazaar", avgExpense: 120, operatingHours: "24/7", operatingDays: "Daily", rating: 3.4 }
        ]
    },
    "Johor Bahru": {
        attractions: [
            { name: "Sultan Abu Bakar State Mosque", avgExpense: 0, operatingHours: "09:00 - 17:00", operatingDays: "Daily (except prayer times)", rating: 4.5 },
            { name: "Johor Bahru Old Chinese Temple", avgExpense: 0, operatingHours: "07:00 - 19:00", operatingDays: "Daily", rating: 4.2 }
        ],
        cuisine: [
            { name: "Hiap Joo Bakery & Biscuit Factory", avgExpense: 15, operatingHours: "07:00 - 19:00", operatingDays: "Daily", rating: 4.3 },
            { name: "Restoran Ya Wang", avgExpense: 25, operatingHours: "11:00 - 22:00", operatingDays: "Daily", rating: 4.1 }
        ],
        activities: [
            { name: "Legoland Malaysia", avgExpense: 180, operatingHours: "10:00 - 18:00", operatingDays: "Daily", rating: 4.4 },
            { name: "Johor Bahru City Square", avgExpense: 50, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.0 }
        ],
        shopping: [
            { name: "KSL City Mall", avgExpense: 100, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.2 }
        ],
        accommodation: [
            { name: "City Center Hotels", avgExpense: 150, operatingHours: "24/7", operatingDays: "Daily", rating: 4.0 }
        ]
    },
    "Cameron Highlands": {
        attractions: [
            { name: "BOH Tea Plantation", avgExpense: 10, operatingHours: "08:30 - 16:30", operatingDays: "Daily", rating: 4.6 },
            { name: "Strawberry Farm", avgExpense: 5, operatingHours: "08:00 - 18:00", operatingDays: "Daily", rating: 4.0 }
        ],
        cuisine: [
            { name: "Steamboat restaurants", avgExpense: 40, operatingHours: "18:00 - 22:00", operatingDays: "Daily", rating: 4.2 },
            { name: "Fresh strawberries", avgExpense: 15, operatingHours: "08:00 - 18:00", operatingDays: "Daily", rating: 4.5 }
        ],
        activities: [
            { name: "Mossy Forest Trek", avgExpense: 25, operatingHours: "08:00 - 17:00", operatingDays: "Daily", rating: 4.3 },
            { name: "Butterfly Garden", avgExpense: 8, operatingHours: "08:30 - 18:00", operatingDays: "Daily", rating: 3.8 }
        ],
        shopping: [
            { name: "Kea Farm Market", avgExpense: 30, operatingHours: "08:00 - 18:00", operatingDays: "Daily", rating: 4.1 }
        ],
        accommodation: [
            { name: "Hill Station Hotels", avgExpense: 200, operatingHours: "24/7", operatingDays: "Daily", rating: 4.0 }
        ]
    },
    "Genting Highlands": {
        attractions: [
            { name: "Genting SkyWorlds Theme Park", avgExpense: 180, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.5 },
            { name: "Resorts World Genting Casino", avgExpense: 100, operatingHours: "24/7", operatingDays: "Daily", rating: 4.2 }
        ],
        cuisine: [
            { name: "Theme park restaurants", avgExpense: 50, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 3.8 },
            { name: "Food court", avgExpense: 25, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 3.5 }
        ],
        activities: [
            { name: "Genting Skyway Cable Car", avgExpense: 15, operatingHours: "07:30 - 24:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Casino gaming", avgExpense: 200, operatingHours: "24/7", operatingDays: "Daily", rating: 4.0 }
        ],
        shopping: [
            { name: "Genting Premium Outlets", avgExpense: 150, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.3 }
        ],
        accommodation: [
            { name: "Resort hotels", avgExpense: 300, operatingHours: "24/7", operatingDays: "Daily", rating: 4.2 }
        ]
    },
    "Ipoh": {
        attractions: [
            { name: "Sam Poh Tong Cave Temple", avgExpense: 0, operatingHours: "08:00 - 17:00", operatingDays: "Daily", rating: 4.3 },
            { name: "Kellie's Castle", avgExpense: 5, operatingHours: "09:00 - 18:00", operatingDays: "Daily", rating: 4.1 }
        ],
        cuisine: [
            { name: "Ipoh White Coffee", avgExpense: 8, operatingHours: "08:00 - 18:00", operatingDays: "Daily", rating: 4.5 },
            { name: "Bean Sprout Chicken", avgExpense: 15, operatingHours: "11:00 - 20:00", operatingDays: "Daily", rating: 4.4 }
        ],
        activities: [
            { name: "Ipoh Heritage Walk", avgExpense: 0, operatingHours: "Daylight hours", operatingDays: "Daily", rating: 4.2 },
            { name: "Lost World of Tambun", avgExpense: 90, operatingHours: "10:00 - 18:00", operatingDays: "Daily", rating: 4.0 }
        ],
        shopping: [
            { name: "Ipoh Parade", avgExpense: 80, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.0 }
        ],
        accommodation: [
            { name: "Old Town Hotels", avgExpense: 120, operatingHours: "24/7", operatingDays: "Daily", rating: 4.1 }
        ]
    },
    "Tioman Island": {
        attractions: [
            { name: "Monkey Beach", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.6 },
            { name: "Dragon Horns (Batu Sirau)", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.4 }
        ],
        cuisine: [
            { name: "Beachside seafood", avgExpense: 60, operatingHours: "12:00 - 22:00", operatingDays: "Daily", rating: 4.3 },
            { name: "Local fish curry", avgExpense: 25, operatingHours: "12:00 - 21:00", operatingDays: "Daily", rating: 4.1 }
        ],
        activities: [
            { name: "Snorkeling", avgExpense: 40, operatingHours: "09:00 - 17:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Diving", avgExpense: 150, operatingHours: "08:00 - 17:00", operatingDays: "Daily", rating: 4.8 }
        ],
        shopping: [
            { name: "Duty-free items", avgExpense: 50, operatingHours: "09:00 - 20:00", operatingDays: "Daily", rating: 3.8 }
        ],
        accommodation: [
            { name: "Beach chalets", avgExpense: 180, operatingHours: "24/7", operatingDays: "Daily", rating: 3.9 }
        ]
    },
    "Redang Island": {
        attractions: [
            { name: "Marine Park Crystal Beach", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.8 },
            { name: "Turtle watching", avgExpense: 25, operatingHours: "20:00 - 06:00", operatingDays: "Seasonal", rating: 4.6 }
        ],
        cuisine: [
            { name: "Resort buffets", avgExpense: 80, operatingHours: "07:00 - 21:00", operatingDays: "Daily", rating: 4.0 },
            { name: "Local seafood", avgExpense: 50, operatingHours: "12:00 - 20:00", operatingDays: "Daily", rating: 4.2 }
        ],
        activities: [
            { name: "Snorkeling tours", avgExpense: 60, operatingHours: "09:00 - 16:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Diving", avgExpense: 180, operatingHours: "08:00 - 17:00", operatingDays: "Daily", rating: 4.9 }
        ],
        shopping: [
            { name: "Resort shops", avgExpense: 40, operatingHours: "08:00 - 22:00", operatingDays: "Daily", rating: 3.5 }
        ],
        accommodation: [
            { name: "Beach resorts", avgExpense: 400, operatingHours: "24/7", operatingDays: "Daily", rating: 4.3 }
        ]
    },
    "Perhentian Islands": {
        attractions: [
            { name: "Turtle Beach", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.7 },
            { name: "Coral Bay", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.5 }
        ],
        cuisine: [
            { name: "Beach barbecues", avgExpense: 35, operatingHours: "18:00 - 22:00", operatingDays: "Daily", rating: 4.2 },
            { name: "Local fish curry", avgExpense: 20, operatingHours: "12:00 - 21:00", operatingDays: "Daily", rating: 4.0 }
        ],
        activities: [
            { name: "Snorkeling", avgExpense: 35, operatingHours: "09:00 - 17:00", operatingDays: "Daily", rating: 4.8 },
            { name: "Island hopping", avgExpense: 50, operatingHours: "09:00 - 16:00", operatingDays: "Daily", rating: 4.5 }
        ],
        shopping: [
            { name: "Beach shops", avgExpense: 30, operatingHours: "09:00 - 20:00", operatingDays: "Daily", rating: 3.6 }
        ],
        accommodation: [
            { name: "Beach chalets", avgExpense: 120, operatingHours: "24/7", operatingDays: "Daily", rating: 3.8 }
        ]
    },
    "Taman Negara": {
        attractions: [
            { name: "Canopy Walk", avgExpense: 5, operatingHours: "09:00 - 15:00", operatingDays: "Daily", rating: 4.6 },
            { name: "Lata Berkoh Rapids", avgExpense: 40, operatingHours: "09:00 - 16:00", operatingDays: "Daily", rating: 4.4 }
        ],
        cuisine: [
            { name: "Resort restaurants", avgExpense: 30, operatingHours: "07:00 - 22:00", operatingDays: "Daily", rating: 3.8 },
            { name: "Local village food", avgExpense: 15, operatingHours: "08:00 - 20:00", operatingDays: "Daily", rating: 4.1 }
        ],
        activities: [
            { name: "Jungle trekking", avgExpense: 60, operatingHours: "08:00 - 17:00", operatingDays: "Daily", rating: 4.7 },
            { name: "Night walk", avgExpense: 25, operatingHours: "20:00 - 22:00", operatingDays: "Daily", rating: 4.5 }
        ],
        shopping: [
            { name: "Nature center", avgExpense: 20, operatingHours: "08:00 - 17:00", operatingDays: "Daily", rating: 3.7 }
        ],
        accommodation: [
            { name: "Jungle lodges", avgExpense: 150, operatingHours: "24/7", operatingDays: "Daily", rating: 3.9 }
        ]
    },
    "Putrajaya": {
        attractions: [
            { name: "Putra Mosque", avgExpense: 0, operatingHours: "09:00 - 17:00", operatingDays: "Daily (except prayer times)", rating: 4.7 },
            { name: "Millennium Monument", avgExpense: 0, operatingHours: "24/7", operatingDays: "Daily", rating: 4.3 }
        ],
        cuisine: [
            { name: "Alamanda Shopping Centre food court", avgExpense: 25, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.0 },
            { name: "Lakeside restaurants", avgExpense: 45, operatingHours: "11:00 - 22:00", operatingDays: "Daily", rating: 4.2 }
        ],
        activities: [
            { name: "Putrajaya Lake Cruise", avgExpense: 20, operatingHours: "09:00 - 18:00", operatingDays: "Daily", rating: 4.4 },
            { name: "Botanical Garden", avgExpense: 0, operatingHours: "07:00 - 19:00", operatingDays: "Daily", rating: 4.5 }
        ],
        shopping: [
            { name: "IOI City Mall", avgExpense: 100, operatingHours: "10:00 - 22:00", operatingDays: "Daily", rating: 4.3 }
        ],
        accommodation: [
            { name: "Government quarter hotels", avgExpense: 200, operatingHours: "24/7", operatingDays: "Daily", rating: 4.1 }
        ]
    },
    // Default fallback for destinations not in the data
    default: {
        attractions: [],
        cuisine: [],
        activities: [],
        shopping: [],
        accommodation: []
    }
};
// --- MODIFIED: Navigation Function ---
// Helper function to check if user is authenticated
function isUserAuthenticated() {
    return currentUser !== null && window.WiseTravel2API && window.WiseTravel2API.currentUser !== null;
}

// Helper function to show authentication required message
function showAuthenticationRequired(sectionName) {
    // Create a more user-friendly message
    const message = `🔒 Authentication Required\n\nTo access ${sectionName}, please login or register for a WiseTravel account.\n\nClick OK to go to the login page.`;
    
    if (confirm(message)) {
        // Show the auth section and hide other sections
        const authSection = document.getElementById('authSection');
        const home = document.getElementById('home');
        const dashboard = document.getElementById('dashboard');
        const about = document.getElementById('about');
        const profile = document.getElementById('profile');
        
        if (authSection) authSection.style.display = 'block';
        if (home) home.style.display = 'none';
        if (dashboard) dashboard.style.display = 'none';
        if (about) about.style.display = 'none';
        if (profile) profile.style.display = 'none';
        
        // Update navbar to show no active section
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        
        // Focus on the email input for better UX
        setTimeout(() => {
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) {
                emailInput.focus();
            }
        }, 100);
    }
}

function navigateToSection(section, elementId) {
    // Define protected sections that require authentication
    const protectedSections = ['home', 'dashboard', 'about'];
    
    // Check if the section requires authentication
    if (protectedSections.includes(section)) {
        if (!isUserAuthenticated()) {
            const sectionNames = {
                'home': 'Home page',
                'dashboard': 'Services',
                'about': 'About Us page'
            };
            showAuthenticationRequired(sectionNames[section] || section);
            return; // Prevent navigation
        }
    }
    
    const sections = ['home', 'dashboard', 'about', 'profile', 'settings'];
    sections.forEach(s => {
        const element = document.getElementById(s);
        if (element) {
            element.style.display = 'none';
        }
    });

    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[href="#${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // If an elementId is provided, scroll to it
    if(elementId) {
        const targetElement = document.getElementById(elementId);
        if(targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    currentSection = section;
    closeMobileMenu();
}

// Navbar dropdown functions (no major changes)
function toggleDropdown(event) {
    event.preventDefault();
    if (window.innerWidth <= 860) {
        const dropdown = event.currentTarget.parentElement;
        const content = dropdown.querySelector('.dropdown-content');
        content.style.position = 'static';
        content.style.opacity = content.style.opacity === '1' ? '0' : '1';
        content.style.visibility = content.style.visibility === 'visible' ? 'hidden' : 'visible';
    }
}

function toggleUserDropdown(event) {
    event.preventDefault();
    if (window.innerWidth <= 860) {
        const dropdown = event.currentTarget.parentElement;
        const content = dropdown.querySelector('.user-dropdown-content');
        content.style.position = 'static';
        content.style.opacity = content.style.opacity === '1' ? '0' : '1';
        content.style.visibility = content.style.visibility === 'visible' ? 'hidden' : 'visible';
    }
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const navRight = document.getElementById('navRight');
    const navToggle = document.getElementById('navToggle');
    
    if (navToggle) navToggle.classList.toggle('active');
    if (navMenu) navMenu.classList.toggle('active');
    if (navRight) navRight.classList.toggle('active');
}

function closeMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const navRight = document.getElementById('navRight');
    const navToggle = document.getElementById('navToggle');
    
    if (navMenu) navMenu.classList.remove('active');
    if (navRight) navRight.classList.remove('active');
    if (navToggle) navToggle.classList.remove('active');
}

function showProfile() { 
    navigateToSection('profile');
    loadProfileData();
    closeMobileMenu(); 
}

function showSettings() { 
    navigateToSection('settings');
    loadFeedbackHistory();
    setupFeedbackFormListeners();
    closeMobileMenu(); 
}

// Profile Management Functions
function loadProfileData() {
    if (currentUser) {
        // Update profile display fields
        document.getElementById('profileUsername').textContent = currentUser.name || 'N/A';
        document.getElementById('profileEmail').textContent = currentUser.email || 'N/A';
        document.getElementById('profilePassword').textContent = '••••••••';
        document.getElementById('profileCurrency').textContent = currentUser.preferred_currency || 'MYR';
        
        // Pre-fill edit form fields
        document.getElementById('editUsername').value = currentUser.name || '';
        document.getElementById('editEmail').value = currentUser.email || '';
        document.getElementById('editCurrency').value = currentUser.preferred_currency || 'MYR';
        
        // Clear password fields
        document.getElementById('editPassword').value = '';
        document.getElementById('editPasswordConfirm').value = '';
    }
}

function showEditProfile() {
    document.getElementById('profileEditSection').style.display = 'block';
    // Scroll to edit section
    document.getElementById('profileEditSection').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditProfile() {
    document.getElementById('profileEditSection').style.display = 'none';
    // Reset form to current user data
    loadProfileData();
}

async function updateProfile() {
    const username = document.getElementById('editUsername').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const password = document.getElementById('editPassword').value;
    const passwordConfirm = document.getElementById('editPasswordConfirm').value;
    const currency = document.getElementById('editCurrency').value;

    // Validation
    if (!username) {
        alert('Username is required!');
        return;
    }

    if (!email) {
        alert('Email is required!');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address!');
        return;
    }

    // Password validation (only if password is being changed)
    if (password || passwordConfirm) {
        if (password !== passwordConfirm) {
            alert('Passwords do not match!');
            return;
        }
        if (password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }
    }

    try {
        // Prepare update data
        const updateData = {
            name: username,
            email: email,
            preferred_currency: currency
        };

        // Only include password if it's being changed
        if (password) {
            updateData.password = password;
        }

        // Call API to update user profile
        const response = await window.WiseTravel2API.updateUser(updateData);
        
        if (response.success) {
            // Debug: Check what data we received
            console.log('API Response data:', response.data);
            console.log('Updated name:', response.data.name);
            
            // Update current user object with the response data
            currentUser = response.data;
            
            // Update the API client's currentUser object to ensure currency functions work
            if (window.WiseTravel2API) {
                window.WiseTravel2API.currentUser = currentUser;
                console.log('Updated API client currentUser currency:', currentUser.preferred_currency);
            }
            
            // Debug: Check currentUser after update
            console.log('currentUser after update:', currentUser);
            console.log('currentUser.name:', currentUser.name);
            
            // Dispatch currency updated event
            if (updateData.preferred_currency) {
                const currencyEvent = new CustomEvent('userCurrencyUpdated', {
                    detail: { currency: updateData.preferred_currency }
                });
                document.dispatchEvent(currencyEvent);
            }
            
            // Update navbar and welcome message
            updateNavbar();
            
            // Refresh profile display
            loadProfileData();
            
            // Refresh all currency-dependent displays
            await loadUserData(); // Refresh all trips to show with updated currency
            if (currentTripId) {
                await updateBudgetOverview();
                await selectTrip(currentTripId); // This will refresh all trip data with new currency
            }
            
            // Hide edit section
            document.getElementById('profileEditSection').style.display = 'none';
            
            alert('Profile updated successfully!');
        } else {
            alert('Failed to update profile: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating your profile. Please try again.');
    }
}

function updateNavbar() {
    console.log('updateNavbar called with currentUser:', currentUser);
    const navUser = document.getElementById('navUser');
    const navUsername = document.getElementById('navUsername');
    const currentUserElement = document.getElementById('currentUser');
    
    // Get navigation elements that should be hidden/shown based on auth status
    const homeLink = document.querySelector('.nav-link[href="#home"]');
    const servicesDropdown = document.querySelector('.nav-dropdown');
    const aboutLink = document.querySelector('.nav-link[href="#about"]');
    const servicesLink = document.querySelector('.nav-dropdown .nav-link');
    
    console.log('Elements found:', {
        navUser: !!navUser,
        navUsername: !!navUsername,
        currentUserElement: !!currentUserElement,
        homeLink: !!homeLink,
        servicesDropdown: !!servicesDropdown,
        aboutLink: !!aboutLink,
        servicesLink: !!servicesLink
    });
    
    if (currentUser && navUser && navUsername) {
        // User is authenticated - show user info and enable navigation links
        navUser.style.display = 'block';
        navUsername.textContent = currentUser.name;
        console.log('Updated navUsername to:', currentUser.name);
        
        // Enable protected navigation links
        if (homeLink) {
            homeLink.style.display = 'block';
            homeLink.classList.remove('auth-required');
            homeLink.style.opacity = '1';
            homeLink.style.cursor = 'pointer';
        }
        if (servicesDropdown) {
            servicesDropdown.style.display = 'block';
            if (servicesLink) {
                servicesLink.classList.remove('auth-required');
                servicesLink.style.opacity = '1';
                servicesLink.style.cursor = 'pointer';
            }
        }
        if (aboutLink) {
            aboutLink.style.display = 'block';
            aboutLink.classList.remove('auth-required');
            aboutLink.style.opacity = '1';
            aboutLink.style.cursor = 'pointer';
        }
        
        // Also update the welcome message in the dashboard
        if (currentUserElement) {
            currentUserElement.textContent = currentUser.name;
            console.log('Updated currentUser welcome message to:', currentUser.name);
        }
    } else {
        // User is not authenticated - show visual indicators for protected links
        if (navUser) navUser.style.display = 'none';
        
        // Show protected navigation links but disable them visually
        if (homeLink) {
            homeLink.style.display = 'block';
            homeLink.classList.add('auth-required');
        }
        if (servicesDropdown) {
            servicesDropdown.style.display = 'block';
            if (servicesLink) {
                servicesLink.classList.add('auth-required');
            }
        }
        if (aboutLink) {
            aboutLink.style.display = 'block';
            aboutLink.classList.add('auth-required');
        }
        
        console.log('Added auth-required styling to navigation links for unauthenticated user');
    }
}

// Authentication functions
function switchAuthTab(tab) {
    const authTabs = document.querySelectorAll('.auth-tab');
    const targetTab = document.querySelector(`[onclick="switchAuthTab('${tab}')"]`);
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    authTabs.forEach(t => t.classList.remove('active'));
    if (targetTab) targetTab.classList.add('active');
    
    if (tab === 'login') {
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
    } else {
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
    }
}

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    try {
        const response = await window.WiseTravel2API.login({
            email: email,
            password: password
        });

        if (response.success) {
            // Clear previous user data before loading new user data
            clearUserData();
            
            // Enforce strict data isolation
            enforceUserDataIsolation();
            
            currentUser = response.data;
            
            // Log currency information to help debug
            console.log('Login successful - User preferred currency:', currentUser.preferred_currency);
            
            // Make sure the API client has the current user with currency set
            if (window.WiseTravel2API) {
                console.log('Setting API client currentUser with currency:', currentUser.preferred_currency);
                window.WiseTravel2API.currentUser = currentUser;
            }
            
            const authSection = document.getElementById('authSection');
            const userInfo = document.getElementById('userInfo');
            const currentUserElement = document.getElementById('currentUser');
            const bestServices = document.getElementById('bestServices');
            
            if (authSection) authSection.style.display = 'none';
            if (userInfo) userInfo.classList.remove('hidden');
            if (currentUserElement) currentUserElement.textContent = currentUser.name;
            
            updateNavbar();
            navigateToSection('home');
            if (bestServices) bestServices.style.display = 'block';
            
            loadUserData();
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Logout function
async function logout() {
    try {
        await window.WiseTravel2API.logout();
        
        // Clear all user data
        clearUserData();
        
        // Enforce strict data isolation
        enforceUserDataIsolation();
        
        // Reset user and trip info
        currentUser = null;

        // Hide all main content sections with null checks
        const home = document.getElementById('home');
        const dashboard = document.getElementById('dashboard');
        const about = document.getElementById('about');
        const profile = document.getElementById('profile');
        const userInfo = document.getElementById('userInfo');
        const bestServices = document.getElementById('bestServices');
        const authSection = document.getElementById('authSection');
        const currentUserElement = document.getElementById('currentUser');
        
        if (home) home.style.display = 'none';
        if (dashboard) dashboard.style.display = 'none';
        if (about) about.style.display = 'none';
        if (profile) profile.style.display = 'none';
        if (userInfo) userInfo.classList.add('hidden');
        if (bestServices) bestServices.style.display = 'none';
        if (authSection) authSection.style.display = 'block';
        if (currentUserElement) currentUserElement.textContent = '';

        // Update navbar to logged-out state
        updateNavbar();
        
        // Force a page reload to ensure complete session clearing
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API call fails with null checks
        clearUserData();
        currentUser = null;
        const authSection = document.getElementById('authSection');
        const userInfo = document.getElementById('userInfo');
        
        if (authSection) authSection.style.display = 'block';
        if (userInfo) userInfo.classList.add('hidden');
        
        // Force a page reload even on error to ensure clean state
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
    
    // Hide buttons that need a trip selection
    ['addExpenseBtn', 'manageGroupBtn', 'exportPdfBtn', 'exportCsvBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.style.display = 'none';
    });

    // Clear login form fields
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    
    // Close any open modals
    closeModal('tripModal');
    closeModal('expenseModal');
    closeModal('participantsModal');
    
    // Close mobile menu if open
    closeMobileMenu();
}

// Register function
async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const currency = document.getElementById('registerCurrency').value;

    console.log('Register function called with:', { name, email, currency });

    if (!name || !email || !password) {
        alert('Please fill in all required fields');
        return;
    }

    // Basic frontend validation
    if (name.length < 2) {
        alert('Name must be at least 2 characters long');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    // Check if API client is available
    if (!window.WiseTravel2API) {
        console.error('WiseTravel2API not available');
        alert('Application not properly loaded. Please refresh the page.');
        return;
    }

    try {
        console.log('Calling WiseTravel2API.register...');
        const response = await window.WiseTravel2API.register({
            name: name,
            email: email,
            password: password,
            preferred_currency: currency
        });

        console.log('Register response:', response);

        if (response.success) {
            // Clear previous user data before loading new user data
            clearUserData();
            
            // Enforce strict data isolation
            enforceUserDataIsolation();
            
            currentUser = response.data;
            alert('Registration successful!');
            
            const authSection = document.getElementById('authSection');
            const userInfo = document.getElementById('userInfo');
            const currentUserElement = document.getElementById('currentUser');
            const bestServices = document.getElementById('bestServices');
            
            if (authSection) authSection.style.display = 'none';
            if (userInfo) userInfo.classList.remove('hidden');
            if (currentUserElement) currentUserElement.textContent = currentUser.name;
            updateNavbar();
            navigateToSection('home');
            if (bestServices) bestServices.style.display = 'block';
            loadUserData();
        }
    } catch (error) {
        console.error('Registration error details:', error);
        alert('Registration failed: ' + error.message);
    }
}

// Trip management - API Integrated
async function createTrip() {
    const name = document.getElementById('tripName').value;
    const destinationId = document.getElementById('tripDestination').value;
    const startDate = document.getElementById('tripStartDate').value;
    const endDate = document.getElementById('tripEndDate').value;
    const budget = parseFloat(document.getElementById('tripBudget').value);
    
    if (!name || !destinationId || !startDate || !endDate || !budget) { 
        alert('Please fill all fields'); 
        return; 
    }
    
    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
        alert('End date must be after start date');
        return;
    }

    try {
        const response = await window.WiseTravel2API.createTrip({
            name: name,
            destination_id: parseInt(destinationId),
            start_date: startDate,
            end_date: endDate,
            budget: budget
        });

        if (response.success) {
            closeModal('tripModal');
            await loadUserData();
            
            // Clear form
            ['tripName', 'tripStartDate', 'tripEndDate', 'tripBudget'].forEach(id => 
                document.getElementById(id).value = '');
            
            alert('Trip created successfully!');
        }
    } catch (error) {
        alert('Failed to create trip: ' + error.message);
    }
}

async function selectTrip(tripId) {
    try {
        currentTripId = tripId;
        
        // Get trip details from API
        const response = await window.WiseTravel2API.getTrip(tripId);
        
        if (!response.success) {
            console.error('Failed to load trip:', response);
            alert('Failed to load trip details. The trip may no longer exist.');
            currentTripId = null;
            currentTripData = null; // Clear trip data
            return;
        }
        
        if (response.success) {
            const trip = response.data;
            currentTripData = trip; // Store trip data for validation
            
            document.querySelectorAll('.trip-item').forEach(item => item.classList.remove('active'));
            const tripElement = document.querySelector(`[onclick="selectTrip(${tripId})"]`);
            if (tripElement) tripElement.classList.add('active');
            
            document.getElementById('currentTripInfo').innerHTML = `
                <h4>${trip.name}</h4>
                <p>📍 ${trip.destination_name || 'Unknown Destination'}</p>
                <p>📅 ${trip.start_date} to ${trip.end_date}</p>
                <p>💰 Budget: ${window.WiseTravel2API.formatCurrency(trip.budget, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
            `;
            
            ['addExpenseBtn', 'manageGroupBtn', 'exportPdfBtn', 'exportCsvBtn'].forEach(id => 
                document.getElementById(id).style.display = 'inline-block');
            
            // Load all data for the selected trip
            await loadExpenses();
            await updateBudgetOverview();
            await updateGroupOverview();
            // Use destination ID to get travel tips from database
            await renderTipsFromAPI(trip.destination_id, trip.destination_name);
            await updateCashFlowChart();
        }
    } catch (error) {
        console.error('Failed to select trip:', error);
        alert('Failed to load trip details');
    }
}

// Expense management - API Integrated
async function addExpense() {
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value || new Date().toISOString().split('T')[0];
    const category = document.getElementById('expenseCategory').value;
    let paidBy = document.getElementById('expensePaidBy').value;
    
    // Debug the dropdown value
    console.log('Paid By value from dropdown:', paidBy);
    console.log('Dropdown element:', document.getElementById('expensePaidBy'));
    
    // If no paidBy selected, use current user as fallback
    if (!paidBy) {
        paidBy = window.WiseTravel2API && window.WiseTravel2API.getCurrentUserId() ? 
                 window.WiseTravel2API.getCurrentUserId() : '1';
        console.log('Using fallback paidBy:', paidBy);
    }
    
    if (!description || !amount) { 
        alert('Please fill description and amount'); 
        return; 
    }
    
    if (!currentTripId) {
        alert('Please select a trip first');
        return;
    }

    // Validate expense date against trip date range
    const dateValidation = validateExpenseDate(date);
    if (!dateValidation.isValid) {
        const expenseDateInput = document.getElementById('expenseDate');
        showDateValidationWarning(dateValidation.message, expenseDateInput);
        
        // Show confirmation dialog to allow user to proceed anyway
        const userConfirm = confirm(
            `${dateValidation.message}\n\nDo you want to add this expense anyway?`
        );
        
        if (!userConfirm) {
            return; // User chose not to proceed
        }
        
        clearDateValidationWarning();
    }

    try {
        // Map category names to IDs (you may need to adjust this based on your categories)
        let categoryId = 1; // Default to Food & Dining
        switch(category) {
            case 'Food': categoryId = 1; break;
            case 'Transportation': categoryId = 2; break;
            case 'Accommodation': categoryId = 3; break;
            case 'Activities': categoryId = 4; break;
            case 'Shopping': categoryId = 5; break;
            case 'Entertainment': categoryId = 6; break;
            case 'Health': categoryId = 7; break;
            case 'Miscellaneous': categoryId = 8; break;
            case 'Other': categoryId = 8; break; // Map "Other" to Miscellaneous
        }

        const response = await window.WiseTravel2API.createExpense(currentTripId, {
            description: description,
            amount: amount,
            category_id: categoryId,
            paid_by: paidBy,
            expense_date: date,
            notes: document.getElementById('expenseNotes').value
        });

        if (response.success) {
            closeModal('expenseModal');
            await loadExpenses();
            await updateBudgetOverview();
            await updateGroupOverview();
            await updateCashFlowChart();
            await loadUserData(); // Refresh trip list to show updated totals
            
            // Clear form
            ['expenseDescription', 'expenseAmount', 'expenseNotes', 'expenseDate'].forEach(id => 
                document.getElementById(id).value = '');
            
            clearDateValidationWarning(); // Clear any remaining warnings
            clearDateValidationSuccess(); // Clear any remaining success messages
            alert('Expense added successfully!');
        }
    } catch (error) {
        alert('Failed to add expense: ' + error.message);
    }
}

async function loadExpenses() {
    if (!currentTripId) return;
    
    try {
        const response = await window.WiseTravel2API.getExpenses(currentTripId);
        
        if (response.success) {
            const tripExpenses = response.data;
            const expensesList = document.getElementById('expensesList');
            
            if (tripExpenses.length === 0) {
                expensesList.innerHTML = '<p>No expenses yet for this trip.</p>';
                return;
            }
            
            expensesList.innerHTML = tripExpenses.map(expense => `
                <div class="expense-item">
                    <div class="expense-details">
                        <strong>${expense.description}</strong>
                        <div>
                            <span class="expense-category">${expense.category_name || expense.category}</span>
                            <small>Paid by ${expense.paid_by_name} on ${expense.expense_date}</small>
                        </div>
                        ${expense.notes ? `<small>📝 ${expense.notes}</small>` : ''}
                    </div>
                    <div class="expense-amount">${window.WiseTravel2API.formatCurrency(expense.amount, expense.currency || window.WiseTravel2API.getCurrentUserCurrency())}</div>
                    <div class="expense-actions">
                        <button class="update-expense" onclick="openUpdateExpenseModal(${expense.id})" title="Edit expense">
                            <span class="update-icon">✏️</span>
                        </button>
                        <button class="delete-expense" onclick="deleteExpense(${expense.id})" title="Delete expense">
                            <span class="delete-icon">🗑️</span>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load expenses:', error);
        document.getElementById('expensesList').innerHTML = '<p>Failed to load expenses.</p>';
    }
}
//         </div>`).join('');
// }

// Budget monitoring - API Integrated
async function updateBudgetOverview() {
    if (!currentTripId) return;
    
    try {
        const tripResponse = await window.WiseTravel2API.getTrip(currentTripId);
        const expensesResponse = await window.WiseTravel2API.getExpenses(currentTripId);
        
        if (tripResponse.success && expensesResponse.success) {
            const trip = tripResponse.data;
            const tripExpenses = expensesResponse.data;
            const totalSpent = tripExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const remaining = trip.budget - totalSpent;
            const percentage = (totalSpent / trip.budget) * 100;

            // Check night mode for text colors
            const isNightMode = document.body.classList.contains('night-mode');
            const textColor = isNightMode ? '#e2e8f0' : '#333';
            const strongColor = isNightMode ? '#f7fafc' : '#333';

            document.getElementById('budgetOverview').innerHTML = `
                <div style="color: ${textColor};">
                    <p><strong style="color: ${strongColor};">Budget:</strong> ${window.WiseTravel2API.formatCurrency(trip.budget, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
                    <p><strong style="color: ${strongColor};">Spent:</strong> ${window.WiseTravel2API.formatCurrency(totalSpent, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
                    <p><strong style="color: ${strongColor};">Remaining:</strong> ${window.WiseTravel2API.formatCurrency(remaining, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
                </div>
                <div class="budget-bar">
                    <div class="budget-fill ${percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : ''}" 
                         style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <p style="color: ${textColor};"><small>${percentage.toFixed(1)}% of budget used</small></p>
                ${percentage > 100 ? '<div class="warning-text danger">⚠️ Over Budget!</div>' : 
                  percentage > 80 ? '<div class="warning-text warning">⚠️ Approaching Budget Limit</div>' : ''}
            `;
            updateBudgetChart(tripExpenses);
        }
    } catch (error) {
        console.error('Failed to update budget overview:', error);
        const isNightMode = document.body.classList.contains('night-mode');
        const textColor = isNightMode ? '#e2e8f0' : '#333';
        document.getElementById('budgetOverview').innerHTML = `<p style="color: ${textColor};">Failed to load budget data.</p>`;
    }
}

function updateBudgetChart(tripExpenses) {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    const isNightMode = document.body.classList.contains('night-mode');
    const legendColor = isNightMode ? '#e2e8f0' : '#333';

    const categoryTotals = tripExpenses.reduce((acc, exp) => {
        const category = exp.category_name || exp.category;
        acc[category] = (acc[category] || 0) + parseFloat(exp.amount);
        return acc;
    }, {});
    
    if (budgetChart) {
        budgetChart.destroy();
        budgetChart = null;
    }
    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{ 
                data: Object.values(categoryTotals), 
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#ffeaa7', '#fab1a0'] 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: {
                        color: legendColor
                    }
                } 
            } 
        }
    });
}

// --- API INTEGRATED: Cash Flow Chart ---
async function updateCashFlowChart() {
    if (!currentTripId) {
        console.log('No current trip ID, skipping cash flow chart update');
        return;
    }

    try {
        console.log('Fetching cash flow data for trip:', currentTripId);
        
        // Get current trip data to access currency
        const currentTrip = getCurrentTripData();
        if (!currentTrip) {
            console.log('Could not get current trip data');
            return;
        }
        
        // First, let's check if we have any expenses at all
        const expensesResponse = await window.WiseTravel2API.getExpenses(currentTripId);
        console.log('Basic expenses response:', expensesResponse);
        
        if (!expensesResponse.success || !expensesResponse.data || expensesResponse.data.length === 0) {
            console.log('No expenses found for this trip');
            const transactionDetails = document.getElementById('transactionDetails');
            const isNightMode = document.body.classList.contains('night-mode');
            const textColor = isNightMode ? '#e2e8f0' : '#333';
            transactionDetails.innerHTML = `<p style="color: ${textColor};">No expenses recorded yet. Add some expenses to see the cash flow chart.</p>`;
            if (cashFlowChart) {
                cashFlowChart.destroy();
                cashFlowChart = null;
            }
            return;
        }
        
        console.log(`Found ${expensesResponse.data.length} expenses, now trying cash flow endpoint...`);
        
        const cashFlowResponse = await window.WiseTravel2API.getCashFlowData(currentTripId);
        console.log('Cash flow response:', cashFlowResponse);
        
        const transactionDetails = document.getElementById('transactionDetails');

        if (!cashFlowResponse.success) {
            console.error('Cash flow API call failed:', cashFlowResponse.message || 'Unknown error');
            // Fallback: show basic expense info instead of cash flow chart
            const isNightMode = document.body.classList.contains('night-mode');
            const fallbackBg = isNightMode ? '#2d3748' : '#fff3cd';
            const fallbackBorder = isNightMode ? '#4a5568' : '#ffeaa7';
            const warningColor = isNightMode ? '#fbb040' : '#856404';
            const textColor = isNightMode ? '#e2e8f0' : '#333';
            const mutedColor = isNightMode ? '#a0aec0' : '#666';
            
            const fallbackMessage = `
                <div style="background: ${fallbackBg}; border: 1px solid ${fallbackBorder}; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <h4 style="color: ${warningColor}; margin: 0 0 10px 0;">⚠️ Cash Flow Chart Temporarily Unavailable</h4>
                    <p style="margin: 5px 0; color: ${warningColor};">The cash flow endpoint is currently experiencing issues.</p>
                    <h4 style="color: ${textColor}; margin: 15px 0 5px 0;">Basic Expense Summary</h4>
                    <p style="margin: 5px 0; color: ${textColor};"><strong>Total Expenses:</strong> ${expensesResponse.data.length}</p>
                    <p style="margin: 5px 0; color: ${textColor};"><strong>Total Amount:</strong> ${window.WiseTravel2API.formatCurrency(expensesResponse.data.reduce((sum, exp) => sum + parseFloat(exp.amount), 0), trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
                    <p style="margin: 10px 0 0 0; font-size: 0.9em; color: ${mutedColor};">You can still add, edit, and delete expenses normally. The chart will return once the backend issue is resolved.</p>
                </div>
            `;
            transactionDetails.innerHTML = fallbackMessage;
            console.log('Fallback message set:', fallbackMessage);
            if (cashFlowChart) cashFlowChart.destroy();
            return;
        }

        if (!cashFlowResponse.data || !cashFlowResponse.data.cash_flow || !cashFlowResponse.data.cash_flow.length) {
            console.log('No cash flow data available, showing empty state');
            const isNightMode = document.body.classList.contains('night-mode');
            const textColor = isNightMode ? '#e2e8f0' : '#333';
            transactionDetails.innerHTML = `<p style="color: ${textColor};">No cash flow data available to create a chart.</p>`;
            if (cashFlowChart) cashFlowChart.destroy();
            return;
        }

        const isNightMode = document.body.classList.contains('night-mode');
        const gridColor = isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isNightMode ? '#e2e8f0' : '#333';

        const ctx = document.getElementById('cashFlowChart').getContext('2d');
        if (!ctx) {
            console.error('Could not get cashFlowChart canvas context');
            return;
        }
        
        if (cashFlowChart) {
            cashFlowChart.destroy();
            cashFlowChart = null;
        }
        
        const cashFlowData = cashFlowResponse.data.cash_flow;
        const dates = cashFlowData.map(item => item.date);
        const cumulativeTotals = cashFlowData.map(item => parseFloat(item.cumulative_total));
        const dailyTotals = cashFlowData.map(item => parseFloat(item.daily_total));

        const datasets = [
            {
                label: 'Cumulative Spending',
                data: cumulativeTotals,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                fill: true,
                tension: 0.1
            },
            {
                label: 'Daily Spending',
                data: dailyTotals,
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.2)',
                fill: false,
                tension: 0.1
            }
        ];

        try {
            cashFlowChart = new Chart(ctx, {
                type: 'line',
                data: { labels: dates, datasets: datasets },
                options: {
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            position: 'bottom', 
                            labels: { color: textColor } 
                        }, 
                        title: { 
                            display: true, 
                            text: 'Spending Over Time', 
                            color: textColor 
                        } 
                    },
                    scales: {
                        x: { 
                            grid: { color: gridColor }, 
                            ticks: { color: textColor } 
                        },
                        y: { 
                            grid: { color: gridColor }, 
                            ticks: { 
                                color: textColor,
                                callback: function(value) {
                                    try {
                                        return window.WiseTravel2API.formatCurrency(value, currentTrip.currency || window.WiseTravel2API.getCurrentUserCurrency());
                                    } catch (err) {
                                        console.error('Error formatting currency in chart:', err);
                                        return value;
                                    }
                                }
                            } 
                        }
                    }
                }
            });
        } catch (chartError) {
            console.error('Error creating cash flow chart:', chartError);
            const transactionDetails = document.getElementById('transactionDetails');
            if (transactionDetails) {
                transactionDetails.innerHTML = `<p style="color: ${textColor};">Error creating cash flow chart. Please try refreshing the page.</p>`;
            }
            return;
        }

        // Update transaction details
        transactionDetails.innerHTML = `
            <h4 style="color: ${textColor};">Cash Flow Summary</h4>
            <p style="color: ${textColor};">Total Days: ${cashFlowData.length}</p>
            <p style="color: ${textColor};">Total Transactions: ${cashFlowData.reduce((sum, item) => sum + parseInt(item.transaction_count), 0)}</p>
            <p style="color: ${textColor};">Average Daily Spending: ${window.WiseTravel2API.formatCurrency(cumulativeTotals[cumulativeTotals.length - 1] / cashFlowData.length, currentTrip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
        `;
    } catch (error) {
        console.error('Failed to update cash flow chart:', error);
        const transactionDetails = document.getElementById('transactionDetails');
        if (transactionDetails) {
            const isNightMode = document.body.classList.contains('night-mode');
            const textColor = isNightMode ? '#e2e8f0' : '#333';
            transactionDetails.innerHTML = `<p style="color: ${textColor};">Failed to load cash flow data. Please try refreshing the page.</p>`;
        }
    }
}

// Group management - API Integrated
async function addParticipant() {
    const name = document.getElementById('participantName').value.trim();
    if (!name || !currentTripId) return;
    
    // SECURITY CHECK: Ensure we have a valid current user and trip
    const currentUserId = window.WiseTravel2API.getCurrentUserId();
    if (!currentUserId) {
        alert('Please login to add participants.');
        return;
    }
    
    try {
        console.log('Adding participant:', name);
        console.log('Current trip ID:', currentTripId);
        console.log('Current user ID:', currentUserId);
        
        // First, let's check the current trip details to see who owns it
        const tripResponse = await window.WiseTravel2API.getTrip(currentTripId);
        console.log('Trip details:', tripResponse);
        
        if (!tripResponse.success) {
            if (tripResponse.message && tripResponse.message.includes('not found')) {
                alert('The selected trip no longer exists. Please select a different trip or create a new one.');
                currentTripId = null;
                return;
            } else {
                alert('Unable to access trip details. Please try again.');
                return;
            }
        }
        
        if (tripResponse.success) {
            const trip = tripResponse.data;
            console.log('Trip owner ID:', trip.user_id, 'Current user ID:', currentUserId);
            
            // STRICT OWNERSHIP CHECK: Only trip owner can add participants
            if (parseInt(trip.user_id) !== parseInt(currentUserId)) {
                alert('SECURITY ERROR: Only the trip owner can add participants. This trip belongs to another user.');
                console.error('Unauthorized participant addition attempt:', {
                    tripOwner: trip.user_id,
                    currentUser: currentUserId,
                    tripId: currentTripId
                });
                return;
            }
        }
        
        // Add the participant by name (guest participant)
        const participantData = { 
            participant_name: name,
            role: 'participant'
        };
        
        console.log('Adding participant to trip with data:', participantData);
        
        const response = await window.WiseTravel2API.addTripParticipant(currentTripId, participantData);
        
        console.log('Add participant response:', response);
        
        if (response.success) {
            document.getElementById('participantName').value = '';
            console.log('Participant added successfully, refreshing UI...');
            
            // Add a small delay to ensure database is updated
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Refresh all UI components
            await updateParticipantsList();
            await updateExpenseModal();
            await updateGroupOverview();
            
            alert(`Participant "${name}" added successfully!`);
        } else {
            console.error('Failed to add participant:', response);
            alert('Failed to add participant: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error adding participant:', error);
        alert('Failed to add participant: ' + error.message);
    }
}

async function removeParticipant(participantId) {
    if (!currentTripId) return;
    
    try {
        console.log('Removing participant with ID:', participantId);
        
        const response = await window.WiseTravel2API.removeTripParticipant(currentTripId, participantId);
        
        if (response.success) {
            await updateParticipantsList();
            await updateExpenseModal();
            await updateGroupOverview();
        } else {
            alert('Failed to remove participant: ' + (response.message || 'Unknown error'));
            console.error('API response:', response);
        }
    } catch (error) {
        console.error('Error removing participant:', error);
        alert('Failed to remove participant: ' + error.message);
    }
}

async function editParticipant(participantId, currentName) {
    if (!currentTripId) return;
    
    // Prompt for new name
    const newName = prompt(`Edit participant name:`, currentName);
    
    if (newName === null) {
        // User cancelled
        return;
    }
    
    if (newName.trim() === '') {
        alert('Participant name cannot be empty');
        return;
    }
    
    if (newName.trim() === currentName.trim()) {
        // No change
        return;
    }
    
    try {
        console.log('Updating participant with ID:', participantId, 'to name:', newName.trim());
        
        const response = await window.WiseTravel2API.updateTripParticipant(currentTripId, participantId, {
            participant_name: newName.trim()
        });
        
        if (response.success) {
            // Update the UI immediately for better UX
            const nameElement = document.getElementById(`participant-name-${participantId}`);
            if (nameElement) {
                nameElement.textContent = newName.trim();
            }
            
            // Refresh all components to ensure consistency
            await updateParticipantsList();
            await updateExpenseModal();
            await updateUpdateExpenseModal();
            await updateGroupOverview();
            
            alert(`Participant name updated to "${newName.trim()}" successfully!`);
        } else {
            alert('Failed to update participant: ' + (response.message || 'Unknown error'));
            console.error('API response:', response);
        }
    } catch (error) {
        console.error('Error updating participant:', error);
        alert('Failed to update participant: ' + error.message);
    }
}

async function updateParticipantsList() {
    if (!currentTripId) {
        console.warn('No trip selected');
        document.getElementById('participantsList').innerHTML = '<p>Please select a trip first.</p>';
        return;
    }
    
    try {
        // Get current trip data from API
        const response = await window.WiseTravel2API.getTrip(currentTripId);
        
        if (response.success && response.data) {
            const trip = response.data;
            const participants = trip.participants || [];
            
            console.log('Participants data:', participants);
            
            // Handle participant structure - each participant has id, user_id, participant_name, role
            document.getElementById('participantsList').innerHTML = participants.map(p => {
                const participantName = p.participant_name || p.name || p; // Handle different formats
                const participantId = p.id; // Use the participant table ID for removal
                const isCurrentUser = window.WiseTravel2API.getCurrentUserId() == p.user_id;
                const isGuestParticipant = !p.user_id; // Guest participants don't have user_id
                
                return `
                    <div class="participant-item">
                        <span id="participant-name-${participantId}">${participantName} ${isCurrentUser ? '(You)' : ''} ${p.role === 'owner' ? '(Owner)' : ''}</span>
                        <div class="participant-actions">
                            ${isGuestParticipant ? `<button class="btn-tiny btn-secondary" onclick="editParticipant('${participantId}', '${participantName}')" title="Edit name">✏️</button>` : ''}
                            ${!isCurrentUser && p.role !== 'owner' ? `<button class="btn-tiny btn-danger" onclick="removeParticipant('${participantId}')" title="Remove">X</button>` : ''}
                        </div>
                    </div>`;
            }).join('');
            
            await updateBalances();
        } else {
            document.getElementById('participantsList').innerHTML = '<p>Unable to load participants.</p>';
        }
    } catch (error) {
        console.error('Error loading participants:', error);
        document.getElementById('participantsList').innerHTML = '<p>Error loading participants.</p>';
    }
}

async function updateBalances() {
    if (!currentTripId) return;
    
    try {
        // Get current trip data and expenses from API
        const [tripResponse, expensesResponse] = await Promise.all([
            window.WiseTravel2API.getTrip(currentTripId),
            window.WiseTravel2API.getExpenses(currentTripId)
        ]);
        
        if (tripResponse.success && expensesResponse.success) {
            const trip = tripResponse.data;
            const tripExpenses = expensesResponse.data;
            const participants = trip.participants || [];
            
            console.log('Debug updateBalances - trip:', trip);
            console.log('Debug updateBalances - participants:', participants);
            console.log('Debug updateBalances - expenses:', tripExpenses);
            
            const balances = participants.reduce((acc, p) => {
                const participantName = p.name || p; // Handle both object and string formats
                return { ...acc, [participantName]: 0 };
            }, {});
            
            console.log('Debug updateBalances - initial balances:', balances);

            tripExpenses.forEach(expense => {
                // Ensure amount is a number
                const expenseAmount = parseFloat(expense.amount) || 0;
                const shareAmount = expenseAmount / (expense.shared_with ? expense.shared_with.length : 1);
                const paidBy = expense.paid_by_name || 'Unknown';
                
                // Initialize balance for paidBy if not exists
                if (balances[paidBy] === undefined) {
                    balances[paidBy] = 0;
                }
                
                balances[paidBy] = (balances[paidBy] || 0) + expenseAmount;
                
                if (expense.shared_with) {
                    expense.shared_with.forEach(person => { 
                        // Initialize balance for person if not exists
                        if (balances[person] === undefined) {
                            balances[person] = 0;
                        }
                        balances[person] = (balances[person] || 0) - shareAmount; 
                    });
                }
            });
            
            console.log('Debug updateBalances - final balances:', balances);

            document.getElementById('balancesList').innerHTML = Object.entries(balances).map(([person, balance]) => {
                // Ensure balance is a valid number
                const safeBalance = isNaN(balance) ? 0 : parseFloat(balance) || 0;
                
                return `
                    <div class="participant-item">
                        <span>${person}</span>
                        <span class="${safeBalance > 0 ? 'balance-positive' : safeBalance < 0 ? 'balance-negative' : ''}">
                            ${window.WiseTravel2API.formatCurrency(safeBalance, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}
                        </span>
                    </div>`;
            }).join('');
        } else {
            document.getElementById('balancesList').innerHTML = '<p>Unable to calculate balances.</p>';
        }
    } catch (error) {
        console.error('Error calculating balances:', error);
        document.getElementById('balancesList').innerHTML = '<p>Error calculating balances.</p>';
    }
}

async function updateGroupOverview() {
    if (!currentTripId) return;
    
    try {
        // Get trip details from API to access participants
        const tripResponse = await window.WiseTravel2API.getTrip(currentTripId);
        
        if (tripResponse.success) {
            const trip = tripResponse.data; // Define trip variable here
            const participants = trip.participants || [];
            const totalExpenses = trip.total_expenses || 0;
            const perPersonAverage = participants.length > 0 ? totalExpenses / participants.length : 0;
            
            const groupOverviewElement = document.getElementById('groupOverview');
            if (groupOverviewElement) {
                groupOverviewElement.innerHTML = `
                    <p><strong>Participants:</strong> ${participants.length}</p>
                    <p><strong>Total Group Expenses:</strong> ${window.WiseTravel2API.formatCurrency(totalExpenses, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
                    <p><strong>Average per Person:</strong> ${window.WiseTravel2API.formatCurrency(perPersonAverage, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
                    <p><small>Click "Manage Travel Buddies" to see detailed balances.</small></p>`;
            }
        }
    } catch (error) {
        console.error('Failed to update group overview:', error);
        const groupOverviewElement = document.getElementById('groupOverview');
        if (groupOverviewElement) {
            groupOverviewElement.innerHTML = '<p>Failed to load group overview.</p>';
        }
    }
}

async function updateExpenseModal() {
    console.log('=== updateExpenseModal called ===');
    
    const paidBySelect = document.getElementById('expensePaidBy');
    const sharedWithDiv = document.getElementById('expenseSharedWith');
    
    // ALWAYS ensure we have at least a basic option
    if (!paidBySelect) {
        console.error('expensePaidBy element not found!');
        return;
    }
    
    // Start with a default option
    let userOptions = '<option value="1">Me</option>';
    let sharedOptions = '<label><input type="checkbox" value="1" checked> Me</label>';
    
    try {
        // Try to get current user info
        let currentUserName = 'Me';
        let currentUserId = '1';
        
        if (window.WiseTravel2API && window.WiseTravel2API.currentUser) {
            const apiUserName = window.WiseTravel2API.getCurrentUserName();
            const apiUserId = window.WiseTravel2API.getCurrentUserId();
            
            if (apiUserName && apiUserId) {
                currentUserName = apiUserName;
                currentUserId = apiUserId;
            }
        }
        
        console.log('Using user:', { currentUserName, currentUserId });
        
        // Update default options with real user info
        userOptions = `<option value="${currentUserId}">${currentUserName}</option>`;
        sharedOptions = `<label><input type="checkbox" value="${currentUserId}" checked> ${currentUserName}</label>`;
        
        // If we have a trip selected, try to get participants
        if (currentTripId && window.WiseTravel2API) {
            console.log('Fetching trip participants for trip:', currentTripId);
            
            const response = await window.WiseTravel2API.getTrip(currentTripId);
            
            if (response.success && response.data.participants && response.data.participants.length > 0) {
                const participants = response.data.participants;
                console.log('Found participants for expense modal:', participants);
                
                userOptions = participants.map(p => {
                    const participantName = p.participant_name || p.name || 'Unknown';
                    // For registered users, use user_id; for guest participants, use the participant table ID prefixed with 'p'
                    const participantId = p.user_id ? p.user_id : `p${p.id}`;
                    return `<option value="${participantId}">${participantName}</option>`;
                }).join('');
                
                sharedOptions = participants.map(p => {
                    const participantName = p.participant_name || p.name || 'Unknown';
                    // For registered users, use user_id; for guest participants, use the participant table ID prefixed with 'p'
                    const participantId = p.user_id ? p.user_id : `p${p.id}`;
                    return `<label><input type="checkbox" value="${participantId}" checked> ${participantName}</label>`;
                }).join('');
                
                console.log('Generated userOptions:', userOptions);
                console.log('Generated sharedOptions:', sharedOptions);
            } else {
                console.log('No participants found or API failed:', response);
            }
        }
    } catch (error) {
        console.error('Error in updateExpenseModal:', error);
        // Keep the default options we set above
    }
    
    // Set the options
    paidBySelect.innerHTML = userOptions;
    if (sharedWithDiv) {
        sharedWithDiv.innerHTML = sharedOptions;
    }
    
    // Set default date
    const expenseDateInput = document.getElementById('expenseDate');
    if (expenseDateInput && !expenseDateInput.value) {
        expenseDateInput.valueAsDate = new Date();
    }
    
    // Add real-time date validation
    if (expenseDateInput) {
        // Remove existing listeners to avoid duplicates
        expenseDateInput.removeEventListener('change', handleExpenseDateChange);
        expenseDateInput.removeEventListener('blur', handleExpenseDateChange);
        
        // Add new listeners
        expenseDateInput.addEventListener('change', handleExpenseDateChange);
        expenseDateInput.addEventListener('blur', handleExpenseDateChange);
    }
    
    // Update helper text with trip date range
    updateDateHelperText('expenseDateHelper');
    
    console.log('Final dropdown HTML:', paidBySelect.innerHTML);
    console.log('Final dropdown options count:', paidBySelect.options.length);
}

// --- NEW: Dynamic Travel Tips ---
function renderTips(destination) {
    const tipsContainer = document.getElementById('tipsContainer');
    
    // Check if destination is valid
    if (!destination) {
        tipsContainer.innerHTML = '<p>No destination information available.</p>';
        return;
    }
    
    // Get destination data, fallback to default if not found
    const data = destinationsData[destination] || destinationsData.default || {};
    const categories = Object.keys(data).filter(key => Array.isArray(data[key]) && data[key].length > 0);

    if (categories.length === 0) {
        tipsContainer.innerHTML = `
            <div class="no-tips-message">
                <p>🌟 <strong>${destination}</strong> is a wonderful destination!</p>
                <p>While we don't have specific recommendations yet, enjoy exploring this amazing place!</p>
            </div>
        `;
        return;
    }

    // Create tabs and content area
    tipsContainer.innerHTML = `
        <div class="tips-tabs">
            ${categories.map(cat => `<button class="tip-tab" data-category="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`).join('')}
        </div>
        <div class="tips-content"></div>
    `;

    const tabs = tipsContainer.querySelectorAll('.tip-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderCategoryContent(tab.dataset.category, data);
        });
    });

    // Activate the first tab by default
    tabs[0].classList.add('active');
    renderCategoryContent(categories[0], data);
}

function renderCategoryContent(category, data) {
    const contentDiv = document.querySelector('.tips-content');
    const items = data[category];

    if (!items || items.length === 0) {
        contentDiv.innerHTML = `<p>No recommendations for this category.</p>`;
        return;
    }

    contentDiv.innerHTML = items.map(item => `
        <div class="recommendation-card">
            <div class="recommendation-header">
                <strong>${item.name}</strong>
                <div class="recommendation-rating" title="${item.rating} stars">
                    ${'⭐'.repeat(Math.floor(item.rating))}${'☆'.repeat(5 - Math.floor(item.rating))}
                </div>
            </div>
            <div class="recommendation-details">
                <span>💰 Avg. Expense: ${window.WiseTravel2API.formatCurrency(item.avgExpense, window.WiseTravel2API.getCurrentUserCurrency())}</span>
                <span>🕒 Hours: ${item.operatingHours}</span>
                <span>📅 Days: ${item.operatingDays}</span>
            </div>
        </div>
    `).join('');
}

// --- NEW: Render Tips from Detailed Destination Data ---
async function renderTipsFromAPI(destinationId, destinationName) {
    const tipsContainer = document.getElementById('tipsContainer');
    
    if (!destinationName) {
        tipsContainer.innerHTML = '<p>No destination information available.</p>';
        return;
    }
    
    // Map the destination name to the key used in destinationsData
    const mappedName = mapDestinationName(destinationName);
    
    // Get destination data from our detailed destinationsData object
    const data = destinationsData[mappedName] || destinationsData.default || {};
    const categories = Object.keys(data).filter(key => Array.isArray(data[key]) && data[key].length > 0);

    if (categories.length === 0) {
        tipsContainer.innerHTML = `
            <div class="travel-tips-container">
                <h3>🌟 Malaysia Travel Tips for ${destinationName}</h3>
                <div class="travel-tips-content">
                    <p>${destinationName} is a wonderful destination! While we don't have specific recommendations yet, enjoy exploring this amazing place!</p>
                </div>
            </div>
        `;
        return;
    }

    // Create tabs and content area using the existing structure
    tipsContainer.innerHTML = `
        <div class="travel-tips-header">
            <h3>🌟 Malaysia Travel Tips for ${destinationName}</h3>
        </div>
        <div class="tips-tabs">
            ${categories.map(cat => `<button class="tip-tab" data-category="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`).join('')}
        </div>
        <div class="tips-content"></div>
    `;

    const tabs = tipsContainer.querySelectorAll('.tip-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderCategoryContent(tab.dataset.category, data);
        });
    });

    // Activate the first tab by default
    if (tabs.length > 0) {
        tabs[0].classList.add('active');
        renderCategoryContent(categories[0], data);
    }
}


// Export functions
async function exportToPDF() {
    if (!currentTripId) {
        alert('Please select a trip first.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Fetch trip and expenses data from API
        const tripResponse = await window.WiseTravel2API.getTrip(currentTripId);
        const expensesResponse = await window.WiseTravel2API.getExpenses(currentTripId);
        
        if (!tripResponse.success || !expensesResponse.success) {
            alert('Failed to fetch trip data for export.');
            return;
        }
        
        const trip = tripResponse.data;
        const tripExpenses = expensesResponse.data;
        
        doc.setFontSize(20);
        doc.text(`${trip.name} - Expense Report`, 20, 30);
        doc.setFontSize(12);
        doc.text(`Destination: ${trip.destination_name || 'Unknown'}`, 20, 50);
        doc.text(`Dates: ${trip.start_date} to ${trip.end_date}`, 20, 60);
        const totalSpent = tripExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        doc.text(`Budget: ${window.WiseTravel2API.formatCurrency(trip.budget, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}`, 20, 70);
        doc.text(`Total Spent: ${window.WiseTravel2API.formatCurrency(totalSpent, trip.currency || window.WiseTravel2API.getCurrentUserCurrency())}`, 20, 80);
        doc.text('Expenses:', 20, 100);
        let yPos = 110;
        tripExpenses.forEach(expense => {
            if (yPos > 250) { doc.addPage(); yPos = 30; }
            doc.text(`${expense.expense_date} - ${expense.description} (${window.WiseTravel2API.formatCurrency(expense.amount, expense.currency || trip.currency || window.WiseTravel2API.getCurrentUserCurrency())})`, 20, yPos);
            yPos += 10;
        });
        doc.save(`${trip.name}-report.pdf`);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Failed to export to PDF. Please try again.');
    }
}

async function exportToCSV() {
    if (!currentTripId) {
        alert('Please select a trip first.');
        return;
    }

    try {
        // Fetch trip and expenses data from API
        const tripResponse = await window.WiseTravel2API.getTrip(currentTripId);
        const expensesResponse = await window.WiseTravel2API.getExpenses(currentTripId);
        
        if (!tripResponse.success || !expensesResponse.success) {
            alert('Failed to fetch trip data for export.');
            return;
        }
        
        const trip = tripResponse.data;
        const tripExpenses = expensesResponse.data;
        
        let csv = 'Date,Description,Category,Amount,Paid By,Notes\n';
        tripExpenses.forEach(e => {
            // Handle potential null/undefined values and use correct field names
            const category = e.category_name || '';
            const paidBy = e.paid_by_name || '';
            const notes = e.notes || '';
            const description = e.description || '';
            const amount = e.amount || '0';
            const date = e.expense_date || '';
            
            // Escape quotes in CSV data
            const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;
            
            csv += `${escapeCsv(date)},${escapeCsv(description)},${escapeCsv(category)},${amount},${escapeCsv(paidBy)},${escapeCsv(notes)}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `${trip.name}-expenses.csv`;
        a.click();
        window.URL.revokeObjectURL(a.href);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('Failed to export to CSV. Please try again.');
    }
}

// Modal functions
async function openModal(modalId) {
    console.log('Opening modal:', modalId);
    document.getElementById(modalId).classList.add('active');
    
    if (modalId === 'expenseModal') {
        // IMMEDIATE FIX: Set basic options right away
        const paidBySelect = document.getElementById('expensePaidBy');
        if (paidBySelect) {
            paidBySelect.innerHTML = '<option value="1">Me</option>';
            console.log('Set immediate fallback option');
        }
        
        // Then try to load proper data
        await updateExpenseModal();
        
        // Debug: Check if dropdown has options after update
        if (paidBySelect) {
            console.log('Paid By dropdown options count:', paidBySelect.options.length);
            console.log('Paid By dropdown HTML:', paidBySelect.innerHTML);
            console.log('Paid By dropdown value:', paidBySelect.value);
        }
    } else if (modalId === 'updateExpenseModal') {
        await updateUpdateExpenseModal();
    } else if (modalId === 'participantsModal') {
        // Check if we have a valid trip selected before opening participants modal
        if (!currentTripId) {
            alert('Please select a trip first before managing travel buddies.');
            return; // Don't open the modal
        }
        
        console.log('Opening participants modal for trip:', currentTripId);
        updateParticipantsList();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Load user data - API Integrated
async function loadUserData() {
    try {
        console.log('Loading user data...');
        const currentCurrency = window.WiseTravel2API ? window.WiseTravel2API.getCurrentUserCurrency() : 'Unknown';
        console.log('Current user currency:', currentCurrency);
        
        const response = await window.WiseTravel2API.getTrips();
        
        if (response.success) {
            const userTrips = response.data;
            const tripsList = document.getElementById('tripsList');
            
            if (userTrips.length === 0) {
                console.log('No trips found, resetting currentTripId');
                currentTripId = null; // Only reset when no trips exist
                tripsList.innerHTML = '<p>No trips yet. Create one to get started!</p>';
                return;
            }
            
            console.log(`Rendering ${userTrips.length} trips with currency: ${currentCurrency}`);
            
            tripsList.innerHTML = userTrips.map(trip => {
                const budgetFormatted = window.WiseTravel2API.formatCurrency(trip.budget, trip.currency || window.WiseTravel2API.getCurrentUserCurrency());
                const spentFormatted = window.WiseTravel2API.formatCurrency(trip.total_expenses || 0, trip.currency || window.WiseTravel2API.getCurrentUserCurrency());
                console.log(`Trip ${trip.id} - ${trip.name}: Budget ${budgetFormatted}, Spent ${spentFormatted}`);
                
                return `
                <div class="trip-item" onclick="selectTrip(${trip.id})">
                    <button class="trip-update-btn" onclick="event.stopPropagation(); openUpdateTripModal(${trip.id}, '${trip.name.replace(/'/g, "\\'")}', '${trip.destination_name.replace(/'/g, "\\'")}', '${trip.start_date}', '${trip.end_date}', ${trip.budget})">
                        <span class="update-icon">✏️</span>
                    </button>
                    <button class="trip-delete-btn" onclick="event.stopPropagation(); confirmDeleteTrip(${trip.id}, '${trip.name.replace(/'/g, "\\'")}')">
                        <span class="delete-icon">🗑️</span>
                    </button>
                    <strong>${trip.name}</strong>
                    <p>📍 ${trip.destination_name}</p>
                    <p>📅 ${trip.start_date} to ${trip.end_date}</p>
                    <p>💰 Budget: ${budgetFormatted}</p>
                    <p>💸 Spent: ${spentFormatted}</p>
                </div>
            `;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
        document.getElementById('tripsList').innerHTML = '<p>Failed to load trips.</p>';
    }
}

// Add expense deletion function
async function deleteExpense(expenseId) {
    if (!currentTripId) return;
    
    if (confirm('Are you sure you want to delete this expense?')) {
        // Find the delete button and add loading state
        const deleteButton = event.target.closest('.delete-expense');
        const deleteIcon = deleteButton.querySelector('.delete-icon');
        const originalClass = deleteButton.className;
        const originalIcon = deleteIcon.textContent;
        
        deleteButton.classList.add('deleting');
        deleteIcon.textContent = '⏳';
        
        try {
            await window.WiseTravel2API.deleteExpense(currentTripId, expenseId);
            
            // Add success animation
            deleteButton.style.backgroundColor = '#2ed573';
            deleteButton.style.borderColor = '#2ed573';
            deleteIcon.textContent = '✓';
            
            // Wait a bit to show success, then reload
            setTimeout(async () => {
                await loadExpenses();
                await updateBudgetOverview();
                await updateGroupOverview();
                await updateCashFlowChart();
                await loadUserData(); // Refresh trip list to show updated totals
            }, 500);
            
        } catch (error) {
            // Reset button state on error
            deleteButton.className = originalClass;
            deleteIcon.textContent = originalIcon;
            alert('Failed to delete expense: ' + error.message);
        }
    }
}

// Update expense functionality

// Function to map database category names to dropdown values
function mapCategoryNameToDropdownValue(categoryName) {
    const categoryMapping = {
        'Food & Dining': 'Food',
        'Transportation': 'Transportation',
        'Accommodation': 'Accommodation', 
        'Activities': 'Activities',
        'Shopping': 'Shopping',
        'Entertainment': 'Entertainment',
        'Health & Medical': 'Health',
        'Miscellaneous': 'Other'
    };
    
    return categoryMapping[categoryName] || 'Food'; // Default to Food if not found
}

async function openUpdateExpenseModal(expenseId) {
    console.log('=== openUpdateExpenseModal called ===');
    console.log('Expense ID:', expenseId);
    console.log('Current Trip ID:', currentTripId);
    
    currentUpdateExpenseId = expenseId;
    
    // Check if modal exists
    const modal = document.getElementById('updateExpenseModal');
    if (!modal) {
        console.error('Update expense modal not found!');
        alert('Update modal not found. Please refresh the page.');
        return;
    }
    console.log('Modal found:', modal);
    
    // Check if we have a current trip
    if (!currentTripId) {
        alert('Please select a trip first');
        return;
    }
    
    try {
        // First, just try to open the modal with default values
        console.log('Opening modal with default values...');
        
        // Set some default values
        document.getElementById('updateExpenseDescription').value = 'Loading...';
        document.getElementById('updateExpenseAmount').value = '';
        document.getElementById('updateExpenseDate').value = '';
        document.getElementById('updateExpenseNotes').value = '';
        
        // Open the modal first
        modal.classList.add('active');
        console.log('Modal opened');
        
        // Now try to get and populate the real data
        console.log('Fetching expense data...');
        const expensesResponse = await window.WiseTravel2API.getExpenses(currentTripId);
        console.log('Expenses response:', expensesResponse);
        
        if (expensesResponse.success && expensesResponse.data) {
            const expense = expensesResponse.data.find(e => e.id == expenseId); // Use == for loose comparison
            console.log('Found expense:', expense);
            
            if (expense) {
                // Populate the form with current values
                console.log('Populating form with real data...');
                document.getElementById('updateExpenseDescription').value = expense.description || '';
                document.getElementById('updateExpenseAmount').value = expense.amount || '';
                document.getElementById('updateExpenseDate').value = expense.expense_date || '';
                
                // Map the database category name to dropdown value
                const dropdownCategoryValue = mapCategoryNameToDropdownValue(expense.category_name || expense.category);
                document.getElementById('updateExpenseCategory').value = dropdownCategoryValue;
                
                document.getElementById('updateExpenseNotes').value = expense.notes || '';
                
                // Update the modal dropdowns
                await updateUpdateExpenseModal();
                
                // Set the paid by value after modal is updated
                const paidBySelect = document.getElementById('updateExpensePaidBy');
                if (paidBySelect && expense.paid_by) {
                    // If the paid_by value exists in the dropdown options, use it directly
                    // Otherwise, assume it's a participant ID and prefix with 'p'
                    let paidByValue = expense.paid_by;
                    
                    // Check if this value exists as an option
                    const optionExists = Array.from(paidBySelect.options).some(option => option.value == paidByValue);
                    
                    if (!optionExists) {
                        // Try with 'p' prefix for participant IDs
                        paidByValue = `p${expense.paid_by}`;
                    }
                    
                    console.log('Setting paid_by to:', paidByValue);
                    paidBySelect.value = paidByValue;
                }
                
                // Set the shared with checkboxes (if shared_with data exists)
                const sharedWithDiv = document.getElementById('updateExpenseSharedWith');
                if (sharedWithDiv && expense.shared_with) {
                    // First, uncheck all checkboxes
                    const checkboxes = sharedWithDiv.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(cb => cb.checked = false);
                    
                    // Then check the ones that should be checked
                    if (Array.isArray(expense.shared_with)) {
                        expense.shared_with.forEach(participantId => {
                            // Try both the direct ID and the 'p' prefixed version
                            let checkbox = sharedWithDiv.querySelector(`input[value="${participantId}"]`);
                            if (!checkbox) {
                                checkbox = sharedWithDiv.querySelector(`input[value="p${participantId}"]`);
                            }
                            if (checkbox) {
                                checkbox.checked = true;
                            }
                        });
                    }
                }
                
                console.log('Form populated successfully');
            } else {
                console.error('Expense not found with ID:', expenseId);
                document.getElementById('updateExpenseDescription').value = 'Expense not found';
            }
        } else {
            console.error('Failed to get expenses:', expensesResponse);
            document.getElementById('updateExpenseDescription').value = 'Failed to load';
        }
    } catch (error) {
        console.error('Error in openUpdateExpenseModal:', error);
        alert('Error: ' + error.message);
        
        // Still open the modal so user can see something
        modal.classList.add('active');
        document.getElementById('updateExpenseDescription').value = 'Error loading data';
    }
}

async function updateUpdateExpenseModal() {
    console.log('=== updateUpdateExpenseModal called ===');
    const paidBySelect = document.getElementById('updateExpensePaidBy');
    const sharedWithDiv = document.getElementById('updateExpenseSharedWith');
    
    console.log('Found elements:', { paidBySelect, sharedWithDiv });
    
    // Start with a default option
    let userOptions = '<option value="1">Me</option>';
    let sharedOptions = '<label><input type="checkbox" value="1" checked> Me</label>';
    
    try {
        // Try to get current user info
        let currentUserName = 'Me';
        let currentUserId = '1';
        
        if (window.WiseTravel2API && window.WiseTravel2API.currentUser) {
            const apiUserName = window.WiseTravel2API.getCurrentUserName();
            const apiUserId = window.WiseTravel2API.getCurrentUserId();
            
            if (apiUserName && apiUserId) {
                currentUserName = apiUserName;
                currentUserId = apiUserId;
            }
        }
        
        console.log('Current user info:', { currentUserName, currentUserId });
        
        // Update default options with real user info
        userOptions = `<option value="${currentUserId}">${currentUserName}</option>`;
        sharedOptions = `<label><input type="checkbox" value="${currentUserId}" checked> ${currentUserName}</label>`;
        
        // If we have a trip selected, try to get participants
        if (currentTripId && window.WiseTravel2API) {
            console.log('Getting participants for trip:', currentTripId);
            const response = await window.WiseTravel2API.getTrip(currentTripId);
            console.log('Trip response:', response);
            
            if (response.success && response.data.participants && response.data.participants.length > 0) {
                const participants = response.data.participants;
                console.log('Processing participants:', participants);
                
                userOptions = participants.map(p => {
                    const participantName = p.participant_name || p.name || 'Unknown';
                    // For registered users, use user_id; for guest participants, use the participant table ID prefixed with 'p'
                    const participantId = p.user_id ? p.user_id : `p${p.id}`;
                    console.log(`Mapping participant: ${participantName} -> ${participantId}`, p);
                    return `<option value="${participantId}">${participantName}</option>`;
                }).join('');
                
                sharedOptions = participants.map(p => {
                    const participantName = p.participant_name || p.name || 'Unknown';
                    // For registered users, use user_id; for guest participants, use the participant table ID prefixed with 'p'
                    const participantId = p.user_id ? p.user_id : `p${p.id}`;
                    return `<label><input type="checkbox" value="${participantId}" checked> ${participantName}</label>`;
                }).join('');
                
                console.log('Generated userOptions:', userOptions);
                console.log('Generated sharedOptions:', sharedOptions);
            } else {
                console.log('No participants found or API failed:', response);
            }
        } else {
            console.log('No current trip or API not available:', { currentTripId, hasAPI: !!window.WiseTravel2API });
        }
    } catch (error) {
        console.error('Error in updateUpdateExpenseModal:', error);
    }
    
    // Set the options
    if (paidBySelect) {
        paidBySelect.innerHTML = userOptions;
        console.log('Set paid by options:', paidBySelect.innerHTML);
    }
    if (sharedWithDiv) {
        sharedWithDiv.innerHTML = sharedOptions;
        console.log('Set shared with options:', sharedWithDiv.innerHTML);
    }
    
    // Add real-time date validation for update expense modal
    const updateExpenseDateInput = document.getElementById('updateExpenseDate');
    if (updateExpenseDateInput) {
        // Remove existing listeners to avoid duplicates
        updateExpenseDateInput.removeEventListener('change', handleUpdateExpenseDateChange);
        updateExpenseDateInput.removeEventListener('blur', handleUpdateExpenseDateChange);
        
        // Add new listeners
        updateExpenseDateInput.addEventListener('change', handleUpdateExpenseDateChange);
        updateExpenseDateInput.addEventListener('blur', handleUpdateExpenseDateChange);
    }
    
    // Update helper text with trip date range
    updateDateHelperText('updateExpenseDateHelper');
}

async function updateExpense() {
    if (!currentUpdateExpenseId || !currentTripId) {
        alert('Error: Missing expense or trip information');
        return;
    }
    
    const description = document.getElementById('updateExpenseDescription').value;
    const amount = parseFloat(document.getElementById('updateExpenseAmount').value);
    const date = document.getElementById('updateExpenseDate').value;
    const category = document.getElementById('updateExpenseCategory').value;
    let paidBy = document.getElementById('updateExpensePaidBy').value;
    const notes = document.getElementById('updateExpenseNotes').value;
    
    // If no paidBy selected, use current user as fallback
    if (!paidBy) {
        paidBy = window.WiseTravel2API && window.WiseTravel2API.getCurrentUserId() ? 
                 window.WiseTravel2API.getCurrentUserId() : '1';
    }
    
    if (!description || !amount) { 
        alert('Please fill description and amount'); 
        return; 
    }

    // Validate expense date against trip date range
    const dateValidation = validateExpenseDate(date);
    if (!dateValidation.isValid) {
        const expenseDateInput = document.getElementById('updateExpenseDate');
        showDateValidationWarning(dateValidation.message, expenseDateInput);
        
        // Show confirmation dialog to allow user to proceed anyway
        const userConfirm = confirm(
            `${dateValidation.message}\n\nDo you want to update this expense anyway?`
        );
        
        if (!userConfirm) {
            return; // User chose not to proceed
        }
        
        clearDateValidationWarning();
    }
    
    try {
        // Map category names to IDs (adjust based on your categories)
        let categoryId = 1; // Default to Food & Dining
        switch(category) {
            case 'Food': categoryId = 1; break;
            case 'Transportation': categoryId = 2; break;
            case 'Accommodation': categoryId = 3; break;
            case 'Activities': categoryId = 4; break;
            case 'Shopping': categoryId = 5; break;
            case 'Entertainment': categoryId = 6; break;
            case 'Health': categoryId = 7; break;
            case 'Miscellaneous': categoryId = 8; break;
            case 'Other': categoryId = 8; break; // Map "Other" to Miscellaneous
        }

        const response = await window.WiseTravel2API.updateExpense(currentTripId, currentUpdateExpenseId, {
            description: description,
            amount: amount,
            category_id: categoryId,
            paid_by: paidBy,
            expense_date: date,
            notes: notes
        });

        if (response.success) {
            closeModal('updateExpenseModal');
            await loadExpenses();
            await updateBudgetOverview();
            await updateGroupOverview();
            await updateCashFlowChart();
            await loadUserData(); // Refresh trip list to show updated totals
            
            clearDateValidationWarning(); // Clear any remaining warnings
            clearDateValidationSuccess(); // Clear any remaining success messages
            alert('Expense updated successfully!');
        }
    } catch (error) {
        alert('Failed to update expense: ' + error.message);
    }
}

// Function to clear all trip-related data and UI elements
function clearTripSelection() {
    currentTripId = null;
    currentTripData = null; // Clear trip data
    
    // Clear UI elements safely
    const currentTripInfo = document.getElementById('currentTripInfo');
    if (currentTripInfo) {
        currentTripInfo.innerHTML = '<p>Select a trip to view details</p>';
    }
    
    // Hide action buttons
    ['addExpenseBtn', 'manageGroupBtn', 'exportPdfBtn', 'exportCsvBtn'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Clear content areas
    ['expensesList', 'budgetOverview', 'groupOverview', 'transactionDetails'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
        }
    });
    
    // Destroy charts if they exist
    try {
        if (budgetChart) {
            budgetChart.destroy();
            budgetChart = null;
        }
    } catch (e) {
        console.warn('Error destroying budget chart:', e);
        budgetChart = null;
    }
    
    try {
        if (cashFlowChart) {
            cashFlowChart.destroy();
            cashFlowChart = null;
        }
    } catch (e) {
        console.warn('Error destroying cash flow chart:', e);
        cashFlowChart = null;
    }
    
    // Clear chart canvases
    const budgetCanvas = document.getElementById('budgetChart');
    const cashFlowCanvas = document.getElementById('cashFlowChart');
    
    if (budgetCanvas) {
        try {
            const budgetCtx = budgetCanvas.getContext('2d');
            budgetCtx.clearRect(0, 0, budgetCanvas.width, budgetCanvas.height);
        } catch (e) {
            console.warn('Error clearing budget canvas:', e);
        }
    }
    
    if (cashFlowCanvas) {
        try {
            const cashFlowCtx = cashFlowCanvas.getContext('2d');
            cashFlowCtx.clearRect(0, 0, cashFlowCanvas.width, cashFlowCanvas.height);
        } catch (e) {
            console.warn('Error clearing cash flow canvas:', e);
        }
    }
    
    // Reset any global variables
    expenses = [];
    
    // Clear any active trip highlighting
    try {
        document.querySelectorAll('.trip-item').forEach(item => {
            item.classList.remove('active');
        });
    } catch (e) {
        console.warn('Error clearing trip highlights:', e);
    }
    
    console.log('Trip selection cleared successfully');
}

// Load destinations for trip creation form
async function loadDestinationsForTripCreation() {
    try {
        const response = await window.WiseTravel2API.getDestinations();
        const destinationSelect = document.getElementById('tripDestination');
        
        if (response && response.success && response.data && destinationSelect) {
            // Get emoji mapping for destinations
            const destinationEmojis = getDestinationEmoji();
            
            destinationSelect.innerHTML = '<option value="">Select destination...</option>' +
                response.data.map(dest => {
                    const emoji = destinationEmojis[dest.name] || '📍';
                    return `<option value="${dest.id}">${dest.name} ${emoji}</option>`;
                }).join('');
        } else {
            console.warn('Could not load destinations from API, using fallback');
            // Keep existing hardcoded options as fallback
        }
    } catch (error) {
        console.error('Failed to load destinations for trip creation:', error);
        // Keep existing hardcoded options as fallback
    }
}

// Trip deletion functionality with beautiful animations
let deleteConfirmationModal = null;

function createDeleteConfirmationModal() {
    if (deleteConfirmationModal) return deleteConfirmationModal;
    
    deleteConfirmationModal = document.createElement('div');
    deleteConfirmationModal.className = 'delete-confirmation-modal';
    deleteConfirmationModal.innerHTML = `
        <div class="delete-confirmation-content">
            <h3>🗑️ Delete Trip</h3>
            <p id="delete-trip-message">Are you sure you want to delete this trip? This action cannot be undone.</p>
            <div class="delete-confirmation-buttons">
                <button class="delete-cancel-btn" onclick="hideDeleteConfirmation()">Cancel</button>
                <button class="delete-confirm-btn" onclick="proceedWithTripDeletion()">Delete Trip</button>
            </div>
        </div>
    `;
    document.body.appendChild(deleteConfirmationModal);
    return deleteConfirmationModal;
}

function confirmDeleteTrip(tripId, tripName) {
    const modal = createDeleteConfirmationModal();
    const messageEl = document.getElementById('delete-trip-message');
    messageEl.innerHTML = `Are you sure you want to delete "<strong>${tripName}</strong>"? This will also delete all associated expenses and cannot be undone.`;
    
    // Store trip info for deletion
    modal.dataset.tripId = tripId;
    modal.dataset.tripName = tripName;
    
    // Show modal with animation
    modal.classList.add('show');
}

function hideDeleteConfirmation() {
    if (deleteConfirmationModal) {
        deleteConfirmationModal.classList.remove('show');
    }
}

async function proceedWithTripDeletion() {
    if (!deleteConfirmationModal) return;
    
    const tripId = deleteConfirmationModal.dataset.tripId;
    const tripName = deleteConfirmationModal.dataset.tripName;
    
    // Hide modal
    hideDeleteConfirmation();
    
    // Find the trip item and get the delete button
    const tripElement = document.querySelector(`[onclick="selectTrip(${tripId})"]`);
    const deleteBtn = tripElement.querySelector('.trip-delete-btn');
    const deleteIcon = deleteBtn.querySelector('.delete-icon');
    
    try {
        // Start loading animation
        deleteBtn.classList.add('deleting');
        deleteIcon.textContent = '⏳';
        
        // Call API to delete trip
        const response = await window.WiseTravel2API.deleteTrip(tripId);
        
        if (response.success) {
            // Success animation
            deleteBtn.classList.remove('deleting');
            deleteBtn.classList.add('success');
            deleteIcon.textContent = '✓';
            
            // Animate trip removal
            tripElement.classList.add('deleting');
            
            // Wait for animation to complete, then reload trips
            setTimeout(async () => {
                // If this was the selected trip, clear all selection and data
                if (currentTripId == tripId) {
                    clearTripSelection();
                }
                
                // Reload trips list
                await loadUserData();
                
                // Show success message
                showSuccessMessage(`Trip "${tripName}" has been deleted successfully!`);
            }, 500);
            
        } else {
            throw new Error(response.message || 'Failed to delete trip');
        }
        
    } catch (error) {
        console.error('Failed to delete trip:', error);
        
        // Error animation
        deleteBtn.classList.remove('deleting');
        deleteBtn.classList.add('error');
        deleteIcon.textContent = '✕';
        
        // Reset button after animation
        setTimeout(() => {
            deleteBtn.classList.remove('error');
            deleteIcon.textContent = '🗑️';
        }, 2000);
        
        // Show error message
        showErrorMessage(`Failed to delete trip: ${error.message}`);
    }
}

function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #66bb6a, #4caf50);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        z-index: 1001;
        font-weight: 600;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ef5350, #f44336);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
        z-index: 1001;
        font-weight: 600;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);
}

// Trip update functionality with beautiful modal and animations
let updateTripModal = null;
let currentUpdateTripId = null;

function createUpdateTripModal() {
    if (updateTripModal) return updateTripModal;
    
    try {
        updateTripModal = document.createElement('div');
        updateTripModal.className = 'update-trip-modal';
        updateTripModal.innerHTML = `
            <div class="update-trip-content">
                <h3>✏️ Update Trip</h3>
                <form class="update-trip-form" onsubmit="updateTrip(event)">
                    <div class="form-group">
                        <label for="updateTripName">🏷️ Trip Name</label>
                        <input type="text" id="updateTripName" name="name" required placeholder="Enter trip name">
                    </div>
                    
                    <div class="form-group">
                        <label for="updateDestination">📍 Destination</label>
                        <select id="updateDestination" name="destination" required>
                            <option value="">Select destination...</option>
                        </select>
                    </div>
                    
                    <div class="date-group">
                        <div class="form-group">
                            <label for="updateStartDate">📅 Start Date</label>
                            <input type="date" id="updateStartDate" name="start_date" required>
                        </div>
                        <div class="form-group">
                            <label for="updateEndDate">📅 End Date</label>
                            <input type="date" id="updateEndDate" name="end_date" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="updateBudget">💰 Total Budget </label>
                        <input type="number" id="updateBudget" name="budget" step="0.01" min="0" required placeholder="0.00">
                    </div>
                    
                    <div class="update-trip-buttons">
                        <button type="button" class="update-cancel-btn" onclick="hideUpdateTripModal()">
                            Cancel
                        </button>
                        <button type="submit" class="update-save-btn">
                            <span class="btn-text">💾 Save Changes</span>
                            <span class="btn-loader" style="display: none;"></span>
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        if (document.body) {
            document.body.appendChild(updateTripModal);
        } else {
            console.error('Document body not available for modal creation');
        }
        
        return updateTripModal;
    } catch (error) {
        console.error('Error creating update trip modal:', error);
        return null;
    }
}

async function loadDestinationsForUpdate() {
    try {
        const response = await window.WiseTravel2API.getDestinations();
        const destinationSelect = document.getElementById('updateDestination');
        
        if (response && response.success && response.data && destinationSelect) {
            // Create emoji mapping for destinations
            const emojiMap = getDestinationEmoji();
            
            destinationSelect.innerHTML = '<option value="">Select destination...</option>' +
                response.data.map(dest => {
                    const emoji = emojiMap[dest.name] || '📍';
                    return `<option value="${dest.id}">${dest.name} ${emoji}</option>`;
                }).join('');
        } else {
            console.warn('Invalid response or missing destination select element');
            // Fallback: create basic options if API fails
            if (destinationSelect) {
                destinationSelect.innerHTML = `
                    <option value="">Select destination...</option>
                    <option value="1">Kuala Lumpur 🏙️</option>
                    <option value="2">George Town, Penang 🏛️</option>
                    <option value="3">Johor Bahru 🌃</option>
                    <option value="4">Ipoh 🍜</option>
                    <option value="5">Kota Kinabalu 🌅</option>
                    <option value="6">Kuching 🐱</option>
                    <option value="7">Melaka 🏰</option>
                    <option value="8">Langkawi 🌊</option>
                    <option value="9">Cameron Highlands 🍃</option>
                    <option value="10">Tioman Island 🐠</option>
                    <option value="11">Redang Island 🏖️</option>
                    <option value="12">Perhentian Islands 🤿</option>
                    <option value="13">Taman Negara 🌳</option>
                    <option value="14">Genting Highlands 🎰</option>
                    <option value="15">Putrajaya 🏛️</option>
                `;
            }
        }
    } catch (error) {
        console.error('Failed to load destinations:', error);
        // Fallback destination options
        const destinationSelect = document.getElementById('updateDestination');
        if (destinationSelect) {
            destinationSelect.innerHTML = `
                <option value="">Select destination...</option>
                <option value="1">Kuala Lumpur 🏙️</option>
                <option value="2">George Town, Penang 🏛️</option>
                <option value="3">Johor Bahru 🌃</option>
                <option value="4">Ipoh 🍜</option>
                <option value="5">Kota Kinabalu 🌅</option>
                <option value="6">Kuching 🐱</option>
                <option value="7">Melaka 🏰</option>
                <option value="8">Langkawi 🌊</option>
                <option value="9">Cameron Highlands 🍃</option>
                <option value="10">Tioman Island 🐠</option>
                <option value="11">Redang Island 🏖️</option>
                <option value="12">Perhentian Islands 🤿</option>
                <option value="13">Taman Negara 🌳</option>
                <option value="14">Genting Highlands 🎰</option>
                <option value="15">Putrajaya 🏛️</option>
            `;
        }
    }
}

function openUpdateTripModal(tripId, tripName, destinationName, startDate, endDate, budget) {
    const modal = createUpdateTripModal();
    currentUpdateTripId = tripId;
    
    // Load destinations and populate form
    loadDestinationsForUpdate().then(() => {
        try {
            // Find destination ID by name with safe checks
            const destinationSelect = document.getElementById('updateDestination');
            if (destinationSelect && destinationSelect.options) {
                const destinationOptions = Array.from(destinationSelect.options);
                const matchingOption = destinationOptions.find(option => option.text === destinationName);
                
                if (matchingOption) {
                    destinationSelect.value = matchingOption.value;
                }
            }
            
            // Populate form fields with safe checks
            const nameField = document.getElementById('updateTripName');
            const startDateField = document.getElementById('updateStartDate');
            const endDateField = document.getElementById('updateEndDate');
            const budgetField = document.getElementById('updateBudget');
            
            if (nameField) nameField.value = tripName;
            if (startDateField) startDateField.value = startDate;
            if (endDateField) endDateField.value = endDate;
            if (budgetField) budgetField.value = budget;
            
        } catch (error) {
            console.error('Error populating form fields:', error);
        }
    }).catch(error => {
        console.error('Error loading destinations:', error);
        // Still populate other fields even if destinations fail
        try {
            const nameField = document.getElementById('updateTripName');
            const startDateField = document.getElementById('updateStartDate');
            const endDateField = document.getElementById('updateEndDate');
            const budgetField = document.getElementById('updateBudget');
            
            if (nameField) nameField.value = tripName;
            if (startDateField) startDateField.value = startDate;
            if (endDateField) endDateField.value = endDate;
            if (budgetField) budgetField.value = budget;
        } catch (formError) {
            console.error('Error populating form fields:', formError);
        }
    });
    
    // Show modal with animation
    modal.classList.add('show');
    
    // Focus on the first input with safe check
    setTimeout(() => {
        try {
            const firstInput = document.getElementById('updateTripName');
            if (firstInput && typeof firstInput.focus === 'function') {
                firstInput.focus();
            }
        } catch (error) {
            console.warn('Could not focus on first input:', error);
        }
    }, 300);
}

function hideUpdateTripModal() {
    if (updateTripModal) {
        updateTripModal.classList.remove('show');
        currentUpdateTripId = null;
        
        // Reset form after animation completes
        setTimeout(() => {
            const form = updateTripModal.querySelector('.update-trip-form');
            if (form && form.reset && typeof form.reset === 'function') {
                try {
                    form.reset();
                } catch (error) {
                    console.warn('Could not reset form:', error);
                }
            }
            
            // Also manually clear all form fields
            try {
                const fields = ['updateTripName', 'updateDestination', 'updateStartDate', 'updateEndDate', 'updateBudget'];
                fields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.value = '';
                    }
                });
            } catch (error) {
                console.warn('Could not clear form fields:', error);
            }
        }, 300);
    }
}

function cleanupUpdateTripModal() {
    if (updateTripModal && updateTripModal.parentNode) {
        try {
            updateTripModal.parentNode.removeChild(updateTripModal);
            updateTripModal = null;
            currentUpdateTripId = null;
        } catch (error) {
            console.warn('Error cleaning up modal:', error);
        }
    }
}

async function updateTrip(event) {
    event.preventDefault();
    
    if (!currentUpdateTripId) return;
    
    const formData = new FormData(event.target);
    const saveBtn = event.target.querySelector('.update-save-btn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoader = saveBtn.querySelector('.btn-loader');
    
    // Validation
    const startDate = new Date(formData.get('start_date'));
    const endDate = new Date(formData.get('end_date'));
    
    if (endDate <= startDate) {
        showErrorMessage('End date must be after start date');
        return;
    }
    
    try {
        // Start loading state
        saveBtn.classList.add('saving');
        saveBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        
        // Prepare trip data
        const tripData = {
            name: formData.get('name'),
            destination_id: parseInt(formData.get('destination')),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            budget: parseFloat(formData.get('budget'))
        };
        
        // Call API to update trip
        const response = await window.WiseTravel2API.updateTrip(currentUpdateTripId, tripData);
        
        if (response.success) {
            // Find the update button and animate success
            const tripElement = document.querySelector(`[onclick*="selectTrip(${currentUpdateTripId})"]`);
            const updateBtn = tripElement?.querySelector('.trip-update-btn');
            const updateIcon = updateBtn?.querySelector('.update-icon');
            
            if (updateBtn && updateIcon) {
                updateBtn.classList.add('success');
                updateIcon.textContent = '✓';
                
                setTimeout(() => {
                    updateBtn.classList.remove('success');
                    updateIcon.textContent = '✏️';
                }, 2000);
            }
            
            // Show success message in modal
            const formContainer = document.querySelector('.update-trip-form');
            if (formContainer) {
                formContainer.innerHTML = `
                    <div class="form-success">
                        ✅ Trip updated successfully!
                    </div>
                    <div class="update-trip-buttons">
                        <button type="button" class="update-cancel-btn" onclick="hideUpdateTripModal()">
                            Close
                        </button>
                    </div>
                `;
            }
            
            // Reload trips to show updated data
            setTimeout(async () => {
                // First reload the trips list
                await loadUserData();
                
                // Wait a moment for the data to be fully loaded
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // If this was the selected trip, refresh its details
                if (currentTripId == currentUpdateTripId) {
                    await selectTrip(currentUpdateTripId);
                }
                
                // Also update any other displays that might show trip name
                const currentTripInfoElement = document.getElementById('currentTripInfo');
                if (currentTripInfoElement && currentTripId == currentUpdateTripId) {
                    // Force refresh the current trip info with updated data
                    try {
                        const updatedTripResponse = await window.WiseTravel2API.getTrip(currentUpdateTripId);
                        if (updatedTripResponse.success) {
                            const updatedTrip = updatedTripResponse.data;
                            currentTripInfoElement.innerHTML = `
                                <h4>${updatedTrip.name}</h4>
                                <p>📍 ${updatedTrip.destination_name}</p>
                                <p>📅 ${updatedTrip.start_date} to ${updatedTrip.end_date}</p>
                                <p>💰 Budget: ${window.WiseTravel2API.formatCurrency(updatedTrip.budget, updatedTrip.currency || window.WiseTravel2API.getCurrentUserCurrency())}</p>
                            `;
                        }
                    } catch (error) {
                        console.warn('Could not refresh trip info:', error);
                    }
                }
                
                // Hide modal and reset it for next use
                hideUpdateTripModal();
                
                // Clean up and reset modal for reuse after a delay
                setTimeout(() => {
                    cleanupUpdateTripModal();
                }, 500);
                
                showSuccessMessage(`Trip "${tripData.name}" updated successfully!`);
            }, 1500);
            
        } else {
            throw new Error(response.message || 'Failed to update trip');
        }
        
    } catch (error) {
        console.error('Failed to update trip:', error);
        
        // Reset button state
        saveBtn.classList.remove('saving');
        saveBtn.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        
        // Find update button and show error state
        const tripElement = document.querySelector(`[onclick*="selectTrip(${currentUpdateTripId})"]`);
        const updateBtn = tripElement?.querySelector('.trip-update-btn');
        const updateIcon = updateBtn?.querySelector('.update-icon');
        
        if (updateBtn && updateIcon) {
            updateBtn.classList.add('error');
            updateIcon.textContent = '✕';
            
            setTimeout(() => {
                updateBtn.classList.remove('error');
                updateIcon.textContent = '✏️';
            }, 2000);
        }
        
        showErrorMessage(`Failed to update trip: ${error.message}`);
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    try {
        if (updateTripModal && updateTripModal.classList && event.target === updateTripModal) {
            hideUpdateTripModal();
        }
    } catch (error) {
        console.warn('Error in modal click handler:', error);
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    try {
        if (event.key === 'Escape' && updateTripModal && updateTripModal.classList && updateTripModal.classList.contains('show')) {
            hideUpdateTripModal();
        }
    } catch (error) {
        console.warn('Error in modal keydown handler:', error);
    }
});

// ===== FEEDBACK & SETTINGS FUNCTIONS =====

// Setup feedback form listeners for character counting and validation
function setupFeedbackFormListeners() {
    const subjectInput = document.getElementById('feedbackSubject');
    const subjectCharCount = document.getElementById('subjectCharCount');
    
    if (subjectInput && subjectCharCount) {
        subjectInput.addEventListener('input', function() {
            const length = this.value.length;
            subjectCharCount.textContent = length;
            
            // Visual feedback when approaching limit
            if (length > 240) {
                subjectCharCount.style.color = '#dc3545';
            } else if (length > 200) {
                subjectCharCount.style.color = '#ffc107';
            } else {
                subjectCharCount.style.color = '#6c757d';
            }
        });
    }

    // Add animation to feedback type select
    const feedbackTypeSelect = document.getElementById('feedbackType');
    if (feedbackTypeSelect) {
        feedbackTypeSelect.addEventListener('change', function() {
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    }
}

// Submit feedback form
async function submitFeedback() {
    if (!currentUser) {
        showErrorMessage('Please login to submit feedback');
        return;
    }

    const feedbackType = document.getElementById('feedbackType').value.trim();
    const subject = document.getElementById('feedbackSubject').value.trim();
    const message = document.getElementById('feedbackMessage').value.trim();

    // Validation
    if (!feedbackType) {
        showErrorMessage('Please select a feedback type');
        return;
    }

    if (!subject) {
        showErrorMessage('Please enter a subject');
        return;
    }

    if (subject.length > 255) {
        showErrorMessage('Subject must not exceed 255 characters');
        return;
    }

    if (!message || message.length < 10) {
        showErrorMessage('Message must be at least 10 characters long');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('.feedback-submit-btn');
    if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                feedback_type: feedbackType,
                subject: subject,
                message: message
            })
        });

        const data = await response.json();

        if (data.success) {
            // Show success message
            showFeedbackSuccess(data.message || 'Feedback submitted successfully!');
            
            // Clear form
            clearFeedbackForm();
            
            // Reload feedback history
            setTimeout(() => {
                loadFeedbackHistory();
            }, 1000);
        } else {
            throw new Error(data.message || 'Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showErrorMessage(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
        // Remove loading state
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
}

// Show feedback success message
function showFeedbackSuccess(message) {
    const successDiv = document.getElementById('feedbackSuccess');
    const feedbackForm = document.getElementById('feedbackForm');
    
    if (successDiv) {
        const messageP = successDiv.querySelector('p');
        if (messageP) {
            messageP.textContent = message;
        }
        
        successDiv.style.display = 'flex';
        
        // Hide form temporarily
        if (feedbackForm) {
            feedbackForm.style.display = 'none';
        }
        
        // Scroll to success message
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide after 5 seconds and show form again
        setTimeout(() => {
            successDiv.style.display = 'none';
            if (feedbackForm) {
                feedbackForm.style.display = 'block';
            }
        }, 5000);
    }
}

// Clear feedback form
function clearFeedbackForm() {
    document.getElementById('feedbackType').value = '';
    document.getElementById('feedbackSubject').value = '';
    document.getElementById('feedbackMessage').value = '';
    
    const subjectCharCount = document.getElementById('subjectCharCount');
    if (subjectCharCount) {
        subjectCharCount.textContent = '0';
        subjectCharCount.style.color = '#6c757d';
    }
}

// Load feedback history
async function loadFeedbackHistory() {
    if (!currentUser) {
        return;
    }

    const container = document.getElementById('feedbackHistoryContainer');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <span class="loading-icon">⏳</span>
            <p>Loading your feedback history...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success && data.data) {
            displayFeedbackHistory(data.data);
        } else {
            throw new Error(data.message || 'Failed to load feedback history');
        }
    } catch (error) {
        console.error('Error loading feedback history:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">😔</span>
                <p>Failed to load feedback history</p>
                <button class="btn btn-secondary btn-sm" onclick="loadFeedbackHistory()">
                    <span class="btn-icon">🔄</span>
                    Try Again
                </button>
            </div>
        `;
    }
}

// Display feedback history
function displayFeedbackHistory(feedbackList) {
    const container = document.getElementById('feedbackHistoryContainer');
    if (!container) return;

    if (!feedbackList || feedbackList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>No feedback submitted yet</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Share your thoughts with us!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = feedbackList.map(feedback => {
        const typeIcon = getFeedbackTypeIcon(feedback.feedback_type);
        const statusBadge = getFeedbackStatusBadge(feedback.status);
        const date = new Date(feedback.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="feedback-item" data-feedback-id="${feedback.id}">
                <div class="feedback-item-header">
                    <div class="feedback-item-title">
                        <span class="feedback-type-badge ${feedback.feedback_type}">
                            ${typeIcon} ${feedback.feedback_type}
                        </span>
                        <h4>${escapeHtml(feedback.subject)}</h4>
                    </div>
                    <span class="feedback-status-badge ${feedback.status}">
                        ${feedback.status}
                    </span>
                </div>
                <div class="feedback-item-message">
                    ${escapeHtml(feedback.message)}
                </div>
                <div class="feedback-item-footer">
                    <span class="feedback-item-date">
                        📅 ${date}
                    </span>
                    <div class="feedback-item-actions">
                        ${feedback.status === 'pending' ? `
                            <button class="btn btn-secondary btn-sm btn-edit-feedback" onclick="editFeedback(${feedback.id})">
                                <span class="btn-icon">✏️</span>
                                Edit
                            </button>
                            <button class="btn btn-secondary btn-sm btn-delete-feedback" onclick="deleteFeedback(${feedback.id})">
                                <span class="btn-icon">🗑️</span>
                                Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get feedback type icon
function getFeedbackTypeIcon(type) {
    const icons = {
        'suggestion': '💡',
        'question': '❓',
        'problem': '⚠️'
    };
    return icons[type] || '📝';
}

// Get feedback status badge
function getFeedbackStatusBadge(status) {
    return status || 'pending';
}

// Delete feedback
async function deleteFeedback(feedbackId) {
    if (!confirm('Are you sure you want to delete this feedback?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            showSuccessMessage('Feedback deleted successfully');
            
            // Remove the feedback item with animation
            const feedbackItem = document.querySelector(`[data-feedback-id="${feedbackId}"]`);
            if (feedbackItem) {
                feedbackItem.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    loadFeedbackHistory();
                }, 300);
            }
        } else {
            throw new Error(data.message || 'Failed to delete feedback');
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        showErrorMessage(error.message || 'Failed to delete feedback. Please try again.');
    }
}

// Edit feedback
async function editFeedback(feedbackId) {
    try {
        // Fetch the feedback details
        const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (!data.success || !data.data) {
            throw new Error(data.message || 'Failed to load feedback');
        }

        const feedback = data.data;

        // Check if it's still editable
        if (feedback.status !== 'pending') {
            showErrorMessage('You can only edit feedback that is still pending');
            return;
        }

        // Show edit modal
        showEditFeedbackModal(feedback);
    } catch (error) {
        console.error('Error loading feedback for edit:', error);
        showErrorMessage(error.message || 'Failed to load feedback. Please try again.');
    }
}

// Show edit feedback modal
function showEditFeedbackModal(feedback) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="editFeedbackModal" onclick="closeEditFeedbackModal(event)">
            <div class="modal-content edit-feedback-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>✏️ Edit Feedback</h3>
                    <button class="modal-close-btn" onclick="closeEditFeedbackModal()">✕</button>
                </div>
                <div class="modal-body">
                    <form id="editFeedbackForm">
                        <input type="hidden" id="editFeedbackId" value="${feedback.id}">
                        
                        <div class="form-group">
                            <label for="editFeedbackType">
                                <span class="label-icon">🏷️</span>
                                Feedback Type
                                <span class="required">*</span>
                            </label>
                            <select id="editFeedbackType" class="custom-select feedback-type-select" required>
                                <option value="">Select type...</option>
                                <option value="suggestion" ${feedback.feedback_type === 'suggestion' ? 'selected' : ''}>💡 Suggestion</option>
                                <option value="question" ${feedback.feedback_type === 'question' ? 'selected' : ''}>❓ Question</option>
                                <option value="problem" ${feedback.feedback_type === 'problem' ? 'selected' : ''}>⚠️ Problem</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="editFeedbackSubject">
                                <span class="label-icon">📌</span>
                                Subject
                                <span class="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="editFeedbackSubject" 
                                placeholder="Brief summary of your feedback" 
                                maxlength="255" 
                                value="${escapeHtml(feedback.subject)}"
                                class="feedback-input"
                                required>
                            <div class="char-counter">
                                <span id="editSubjectCharCount">${feedback.subject.length}</span>/255
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="editFeedbackMessage">
                                <span class="label-icon">💬</span>
                                Message
                                <span class="required">*</span>
                            </label>
                            <textarea 
                                id="editFeedbackMessage" 
                                placeholder="Tell us more about your feedback..." 
                                rows="6" 
                                class="feedback-textarea"
                                required>${escapeHtml(feedback.message)}</textarea>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeEditFeedbackModal()">
                                <span class="btn-icon">✕</span>
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary btn-update-feedback">
                                <span class="btn-icon">💾</span>
                                <span class="btn-text">Save Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Setup character counter for edit form
    const subjectInput = document.getElementById('editFeedbackSubject');
    const charCount = document.getElementById('editSubjectCharCount');
    
    if (subjectInput && charCount) {
        subjectInput.addEventListener('input', function() {
            charCount.textContent = this.value.length;
            if (this.value.length >= 245) {
                charCount.style.color = '#dc3545';
            } else if (this.value.length >= 200) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = '#6c757d';
            }
        });
    }

    // Setup form submit
    const form = document.getElementById('editFeedbackForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            updateFeedback();
        });
    }

    // Show modal with animation
    setTimeout(() => {
        const modal = document.getElementById('editFeedbackModal');
        if (modal) {
            modal.classList.add('show');
        }
    }, 10);
}

// Close edit feedback modal
function closeEditFeedbackModal(event) {
    if (event && event.target !== event.currentTarget) {
        return;
    }

    const modal = document.getElementById('editFeedbackModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.parentElement.remove();
        }, 300);
    }
}

// Update feedback
async function updateFeedback() {
    const feedbackId = document.getElementById('editFeedbackId').value;
    const feedbackType = document.getElementById('editFeedbackType').value.trim();
    const subject = document.getElementById('editFeedbackSubject').value.trim();
    const message = document.getElementById('editFeedbackMessage').value.trim();

    // Validation
    if (!feedbackType) {
        showErrorMessage('Please select a feedback type');
        return;
    }

    if (!subject) {
        showErrorMessage('Please enter a subject');
        return;
    }

    if (subject.length > 255) {
        showErrorMessage('Subject must not exceed 255 characters');
        return;
    }

    if (!message || message.length < 10) {
        showErrorMessage('Message must be at least 10 characters long');
        return;
    }

    // Show loading state
    const updateBtn = document.querySelector('.btn-update-feedback');
    if (updateBtn) {
        updateBtn.classList.add('loading');
        updateBtn.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                feedback_type: feedbackType,
                subject: subject,
                message: message
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessMessage(data.message || 'Feedback updated successfully!');
            
            // Close modal
            closeEditFeedbackModal();
            
            // Reload feedback history
            setTimeout(() => {
                loadFeedbackHistory();
            }, 500);
        } else {
            throw new Error(data.message || 'Failed to update feedback');
        }
    } catch (error) {
        console.error('Error updating feedback:', error);
        showErrorMessage(error.message || 'Failed to update feedback. Please try again.');
    } finally {
        // Remove loading state
        if (updateBtn) {
            updateBtn.classList.remove('loading');
            updateBtn.disabled = false;
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add fadeOut animation to CSS if not already present
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-20px);
        }
    }
`;
if (!document.querySelector('style[data-feedback-animations]')) {
    style.setAttribute('data-feedback-animations', 'true');
    document.head.appendChild(style);
}
