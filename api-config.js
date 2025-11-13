/**
 * WiseTravel2 API Configuration and Client
 * Frontend JavaScript API client for the WiseTravel2 backend
 */

class WiseTravel2API {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.currentUser = null;
    }

    // Helper method for making HTTP requests
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include' // Include cookies for session management
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        const response = await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success) {
            this.currentUser = response.data;
        }
        
        return response;
    }

    async login(credentials) {
        const response = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.success) {
            this.currentUser = response.data;
            console.log('Login successful - currentUser set to:', this.currentUser);
            
            // Make sure preferred_currency exists
            if (!this.currentUser.preferred_currency) {
                console.warn('No preferred_currency in user data, defaulting to MYR');
                this.currentUser.preferred_currency = 'MYR';
            }
            
            console.log('Login - preferred_currency field:', this.currentUser.preferred_currency);
            
            // Dispatch currency update event
            document.dispatchEvent(new CustomEvent('userCurrencyUpdated', {
                detail: { currency: this.currentUser.preferred_currency }
            }));
        } else {
            console.log('Login failed:', response);
        }
        
        return response;
    }

    async logout() {
        const response = await this.makeRequest('/auth/logout', {
            method: 'POST'
        });
        
        // Always clear current user data, even if API call fails
        this.currentUser = null;
        
        // Clear any cached data
        try {
            localStorage.removeItem('wisetravel_currentTrip');
            localStorage.removeItem('wisetravel_userData');
            sessionStorage.clear();
        } catch (error) {
            console.warn('Could not clear storage during logout:', error);
        }
        
        return response;
    }

    async getCurrentUser() {
        try {
            const response = await this.makeRequest('/auth/user');
            if (response.success) {
                this.currentUser = response.data;
                
                // Make sure preferred_currency exists
                if (!this.currentUser.preferred_currency) {
                    console.warn('No preferred_currency in user data from getCurrentUser, defaulting to MYR');
                    this.currentUser.preferred_currency = 'MYR';
                } else {
                    console.log('getCurrentUser - Found preferred_currency:', this.currentUser.preferred_currency);
                }
                
                // Dispatch currency update event
                document.dispatchEvent(new CustomEvent('userCurrencyUpdated', {
                    detail: { currency: this.currentUser.preferred_currency }
                }));
                
                return response;
            } else {
                this.currentUser = null;
                return { success: false, message: 'No active session' };
            }
        } catch (error) {
            this.currentUser = null;
            // Don't throw error for authentication failures
            return { success: false, message: error.message };
        }
    }

    async updateUser(userData) {
        const response = await this.makeRequest('/auth/user', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        if (response.success) {
            this.currentUser = response.data;
            console.log('User updated - currentUser refreshed:', this.currentUser);
            console.log('User updated - new preferred_currency:', this.currentUser?.preferred_currency);
            
            // Dispatch event to notify other parts of the app about currency change
            document.dispatchEvent(new CustomEvent('userCurrencyUpdated', {
                detail: { currency: this.currentUser?.preferred_currency }
            }));
            
            // Refresh user data including trips to show new currency
            if (typeof loadUserData === 'function') {
                console.log('Refreshing user data to update currency display...');
                loadUserData();
            }
        }
        
        return response;
    }

    async changePassword(passwordData) {
        return await this.makeRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    }

    // Trip methods
    async getTrips() {
        return await this.makeRequest('/trips');
    }

    async getTrip(tripId) {
        return await this.makeRequest(`/trips/${tripId}`);
    }

    async createTrip(tripData) {
        return await this.makeRequest('/trips', {
            method: 'POST',
            body: JSON.stringify(tripData)
        });
    }

    async updateTrip(tripId, tripData) {
        return await this.makeRequest(`/trips/${tripId}`, {
            method: 'PUT',
            body: JSON.stringify(tripData)
        });
    }

    async deleteTrip(tripId) {
        return await this.makeRequest(`/trips/${tripId}`, {
            method: 'DELETE'
        });
    }

    // Expense methods
    async getExpenses(tripId) {
        return await this.makeRequest(`/trips/${tripId}/expenses`);
    }

    async getExpense(tripId, expenseId) {
        return await this.makeRequest(`/trips/${tripId}/expenses/${expenseId}`);
    }

    async createExpense(tripId, expenseData) {
        return await this.makeRequest(`/trips/${tripId}/expenses`, {
            method: 'POST',
            body: JSON.stringify(expenseData)
        });
    }

    async updateExpense(tripId, expenseId, expenseData) {
        return await this.makeRequest(`/trips/${tripId}/expenses/${expenseId}`, {
            method: 'PUT',
            body: JSON.stringify(expenseData)
        });
    }

    async deleteExpense(tripId, expenseId) {
        return await this.makeRequest(`/trips/${tripId}/expenses/${expenseId}`, {
            method: 'DELETE'
        });
    }

    // Expense analytics methods
    async getExpensesByCategory(tripId, categoryId = null) {
        const endpoint = categoryId 
            ? `/trips/${tripId}/expenses/category?category_id=${categoryId}`
            : `/trips/${tripId}/expenses/category`;
        return await this.makeRequest(endpoint);
    }

    async getCashFlowData(tripId) {
        return await this.makeRequest(`/trips/${tripId}/expenses/cashflow`);
    }

    async getExpensesByDateRange(tripId, startDate, endDate) {
        return await this.makeRequest(`/trips/${tripId}/expenses/date-range?start_date=${startDate}&end_date=${endDate}`);
    }

    // Destination methods
    async getDestinations(search = null, popular = false) {
        let endpoint = '/destinations';
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (popular) params.append('popular', 'true');
        
        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }
        
        return await this.makeRequest(endpoint);
    }

    async getDestination(destinationId) {
        return await this.makeRequest(`/destinations/${destinationId}`);
    }

    // Expense category methods
    async getExpenseCategories(tripId = null) {
        const endpoint = tripId 
            ? `/expense-categories?trip_id=${tripId}`
            : '/expense-categories';
        return await this.makeRequest(endpoint);
    }

    // Participant methods
    async addTripParticipant(tripId, participantData) {
        return await this.makeRequest(`/trips/${tripId}/participants`, {
            method: 'POST',
            body: JSON.stringify(participantData)
        });
    }

    async removeTripParticipant(tripId, participantId) {
        return await this.makeRequest(`/trips/${tripId}/participants/${participantId}`, {
            method: 'DELETE'
        });
    }

    async updateTripParticipant(tripId, participantId, participantData) {
        return await this.makeRequest(`/trips/${tripId}/participants/${participantId}`, {
            method: 'PUT',
            body: JSON.stringify(participantData)
        });
    }

    // Utility methods
    async getStats() {
        return await this.makeRequest('/stats');
    }

    async healthCheck() {
        return await this.makeRequest('/health');
    }

    // Helper methods for common operations
    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    getCurrentUserName() {
        return this.currentUser ? this.currentUser.name : null;
    }

    getCurrentUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }

    getCurrentUserCurrency() {
        console.log('getCurrentUserCurrency called - currentUser object:', this.currentUser);
        
        if (!this.currentUser) {
            console.log('getCurrentUserCurrency: No currentUser, defaulting to MYR');
            return 'MYR';
        }
        
        if (!this.currentUser.preferred_currency) {
            console.log('getCurrentUserCurrency: No preferred_currency field, defaulting to MYR');
            return 'MYR';
        }
        
        const currency = this.currentUser.preferred_currency;
        console.log('getCurrentUserCurrency: Found currency:', currency);
        return currency;
    }

    // Format currency helper
    formatCurrency(amount, currency) {
        // If no currency provided, try to get it from current user
        if (!currency) {
            currency = this.getCurrentUserCurrency();
            console.log('formatCurrency: No currency provided, using current user currency:', currency);
        }
        
        try {
            // Use a neutral locale like 'en-US' for formatting consistency.
            // The currency symbol is determined by the 'currency' option.
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            console.error(`Currency formatting error for currency code '${currency}':`, error);
            // Fallback to MYR if the provided currency code is invalid.
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'MYR'
            }).format(amount);
        }
    }

    // Date formatting helper
    formatDate(date, format = 'short') {
        const dateObj = new Date(date);
        
        if (format === 'short') {
            return dateObj.toLocaleDateString('en-MY');
        } else if (format === 'long') {
            return dateObj.toLocaleDateString('en-MY', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
}

// Determine the correct API base URL based on the environment
// If you're using Laragon with the default setup, use the path-based URL
// If you're running PHP built-in server (php -S localhost:8000), use that port
const determineApiBaseUrl = () => {
    // Check if we're using the PHP built-in server
    if (window.location.port === '8000') {
        return 'http://localhost:8000/api';
    }
    
    // For Laragon default setup (http://localhost/wisetravel2/)
    // Extract the base path properly
    const pathname = window.location.pathname;
    
    // If we're at the root level (e.g., /wisetravel2/ or /wisetravel2/index.html)
    if (pathname.includes('/wisetravel2')) {
        return window.location.origin + '/wisetravel2/api';
    }
    
    // Fallback - try to detect project folder
    const projectFolder = pathname.split('/')[1]; // Get first path segment
    if (projectFolder) {
        return window.location.origin + '/' + projectFolder + '/api';
    }
    
    // Last resort fallback
    return window.location.origin + '/api';
};

// Set the API_BASE_URL for use in feedback and other features
const API_BASE_URL = determineApiBaseUrl();
console.log('API Base URL configured as:', API_BASE_URL);

// Create global instance with the determined base URL
window.WiseTravel2API = new WiseTravel2API(API_BASE_URL);

// Auto-initialize user session on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded: Starting user session check...');
    try {
        const response = await window.WiseTravel2API.getCurrentUser();
        if (response.success && window.WiseTravel2API.currentUser) {
            console.log('User session restored:', window.WiseTravel2API.currentUser);
            console.log('Restored user currency:', window.WiseTravel2API.currentUser.preferred_currency);
            
            // Dispatch custom event for other scripts to listen to
            document.dispatchEvent(new CustomEvent('userSessionReady', {
                detail: { 
                    user: window.WiseTravel2API.currentUser,
                    currency: window.WiseTravel2API.currentUser.preferred_currency
                }
            }));
        } else {
            console.log('No active user session');
            document.dispatchEvent(new CustomEvent('userSessionReady', {
                detail: { user: null, currency: 'MYR' }
            }));
        }
    } catch (error) {
        console.log('Error checking user session:', error.message);
        document.dispatchEvent(new CustomEvent('userSessionReady', {
            detail: { user: null, currency: 'MYR' }
        }));
    }
});
