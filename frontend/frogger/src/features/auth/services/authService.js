// Authentication service for handling login, logout, and token management

class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.userKey = 'user_data';
  }

  // Simulate login API call
  async login(credentials) {
    // In a real application, this would make an API call to your backend
    // For now, we'll simulate a successful login

    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Basic validation
        if (!credentials.email || !credentials.password) {
          reject(new Error('Email and password are required'));
          return;
        }

        // Simulate successful login
        const mockResponse = {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: 1,
            email: credentials.email,
            name: 'Demo User'
          }
        };

        this.setToken(mockResponse.token);
        this.setUser(mockResponse.user);
        resolve(mockResponse);
      }, 1000);
    });
  }

  // Logout user
  logout() {
    this.removeToken();
    this.removeUser();
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Set token in storage
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Remove token from storage
  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  // Get stored user data
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Set user data in storage
  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Remove user data from storage
  removeUser() {
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
