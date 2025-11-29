// auth.js - STRICT VERSION (No Guest Mode)

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Hide error message
function hideError() {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.style.display = 'none';
}

// Completely remove guest mode - redirect to signup instead
function continueAsGuest() {
  // Instead of guest mode, encourage signup
  window.location.href = 'signup.html';
}

// Check if user is logged in (STRICT - no guest mode)
function isUserAuthenticated() {
  return auth.currentUser !== null;
}

// Redirect to login if not authenticated for cart actions
function requireAuth() {
  if (!isUserAuthenticated()) {
    // Store the current page to return after login
    localStorage.setItem('returnUrl', window.location.href);
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Prevent going back to login page after successful login
function preventBackToLogin() {
  // Replace current history entry with the target page
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
  }
}

// Handle login form
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('User logged in:', user.email);
      
      // Remove any guest mode data
      localStorage.removeItem('guestMode');
      localStorage.removeItem('guestId');
      
      // Redirect to return URL or home page
      const returnUrl = localStorage.getItem('returnUrl') || 'index.html';
      localStorage.removeItem('returnUrl');
      
      // Use replace instead of href to prevent back button issues
      window.location.replace(returnUrl);
      
    } catch (error) {
      console.error('Login error:', error);
      showError(getAuthErrorMessage(error));
    }
  });
}

// Handle signup form
if (document.getElementById('signupForm')) {
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await user.updateProfile({
        displayName: name
      });
      
      // Save user profile to Firestore
      await db.collection('users').doc(user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('User created:', user.email);
      
      // Remove any guest mode data
      localStorage.removeItem('guestMode');
      localStorage.removeItem('guestId');
      
      // Use replace to prevent back button issues
      window.location.replace('index.html');
      
    } catch (error) {
      console.error('Signup error:', error);
      showError(getAuthErrorMessage(error));
    }
  });
}

// Get user-friendly error messages
function getAuthErrorMessage(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please login instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}

// Auth state observer
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.email);
    
    // If user is on login/signup page and already logged in, redirect to home
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === 'signup.html') {
      const returnUrl = localStorage.getItem('returnUrl') || 'index.html';
      localStorage.removeItem('returnUrl');
      window.location.replace(returnUrl);
    }
    
  } else {
    console.log('User is signed out');
  }
});

// Prevent access to login/signup pages when already authenticated
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop();
  if ((currentPage === 'login.html' || currentPage === 'signup.html') && auth.currentUser) {
    window.location.replace('index.html');
  }
});

// Check if current page is an admin page
function isAdminPage() {
  const currentPage = window.location.pathname.split('/').pop();
  return currentPage === 'admin.html';
}

// Admin email configuration
const ADMIN_EMAILS = [
  'saifuldeennaser@gmail.com',
  'mostafaeladawy35@gmail.com',
  'mohand.ahmed201@gmail.com'
];

// Check if user is admin
function isAdminUser(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

// Updated login form handler in auth.js
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('User logged in:', user.email);
      
      // Remove any guest mode data
      localStorage.removeItem('guestMode');
      localStorage.removeItem('guestId');
      
      // Check if user is admin and redirect accordingly
      const returnUrl = localStorage.getItem('returnUrl') || 'index.html';
      localStorage.removeItem('returnUrl');
      
      if (isAdminUser(user) && returnUrl.includes('admin.html')) {
        // Admin going to admin page
        window.location.replace('admin.html');
      } else if (isAdminUser(user) && returnUrl === 'index.html') {
        // Admin logged in from home page, offer admin access
        window.location.replace('admin.html');
      } else {
        // Regular user or admin going to regular page
        window.location.replace(returnUrl);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      showError(getAuthErrorMessage(error));
    }
  });
}

// Updated auth state observer in auth.js
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.email);
    
    // If user is on login/signup page and already logged in, redirect based on page type
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === 'signup.html') {
      const returnUrl = localStorage.getItem('returnUrl') || 'index.html';
      localStorage.removeItem('returnUrl');
      
      // Don't redirect if going to admin page
      if (returnUrl.includes('admin.html')) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = returnUrl;
      }
    }
    
  } else {
    console.log('User is signed out');
    
    // If on admin page and not logged in, redirect to login
    if (isAdminPage()) {
      localStorage.setItem('returnUrl', 'admin.html');
      window.location.href = 'login.html';
    }
  }
});