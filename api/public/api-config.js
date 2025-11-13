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
        }
        
        return response;
    }

    async logout() {
        const response = await this.makeRequest('/auth/logout', {
            method: 'POST'
        });
        
        if (response.success) {
            this.currentUser = null;
        }
        
        return response;
    }

    async getCurrentUser() {
        try {
            const response = await this.makeRequest('/auth/user');
            if (response.success) {
                this.currentUser = response.data;
            }
            return response;
        } catch (error) {
            this.currentUser = null;
            throw error;
        }
    }

    async updateUser(userData) {
        const response = await this.makeRequest('/auth/user', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        if (response.success) {
            this.currentUser = response.data;
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

    async removeTripParticipant(tripId, userId) {
        return await this.makeRequest(`/trips/${tripId}/participants/${userId}`, {
            method: 'DELETE'
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
        return this.currentUser ? this.currentUser.preferred_currency : 'MYR';
    }

    // Format currency helper
    formatCurrency(amount, currency = null) {
        const userCurrency = currency || this.getCurrentUserCurrency();
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: userCurrency
        }).format(amount);
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

// Create global instance
window.WiseTravel2API = new WiseTravel2API();

// Auto-initialize user session on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.WiseTravel2API.getCurrentUser();
        console.log('User session restored:', window.WiseTravel2API.currentUser);
        
        // Dispatch custom event for other scripts to listen to
        document.dispatchEvent(new CustomEvent('userSessionReady', {
            detail: { user: window.WiseTravel2API.currentUser }
        }));
    } catch (error) {
        console.log('No active user session');
        document.dispatchEvent(new CustomEvent('userSessionReady', {
            detail: { user: null }
        }));
    }
});
