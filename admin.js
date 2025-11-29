const ADMIN_EMAILS = [
  'saifuldeennaser@gmail.com',
  'mostafaeladawy35@gmail.com',
  'mohand.ahmed201@gmail.com'
];

function isAdminUser(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

function checkAdminAuth() {
  if (!window.auth || !auth.currentUser) {
    console.log('No user found, redirecting to login');
    localStorage.setItem('returnUrl', 'admin.html');
    window.location.href = 'login.html';
    return false;
  }
  
  if (!isAdminUser(auth.currentUser)) {
    console.log('User is not admin, redirecting to home');
    alert('Access denied. Admin privileges required.');
    window.location.href = 'index.html';
    return false;
  }
  
  console.log('Admin access granted for:', auth.currentUser.email);
  return true;
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin page loaded, checking auth...');
  
  if (window.auth) {
    auth.onAuthStateChanged((user) => {
      console.log('Admin auth state changed:', user ? user.email : 'No user');
      
      if (user && isAdminUser(user)) {
        // User is admin, initialize dashboard
        initializeAdminDashboard();
        loadDashboardData();
        setupEventListeners();
      } else if (user) {
        // User is logged in but not admin
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
      } else {
        // User is not logged in
        localStorage.setItem('returnUrl', 'admin.html');
        window.location.href = 'login.html';
      }
    });
    
    // Immediate check
    if (auth.currentUser) {
      if (isAdminUser(auth.currentUser)) {
        initializeAdminDashboard();
        loadDashboardData();
        setupEventListeners();
      } else {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
      }
    }
  }
});

function initializeAdminDashboard() {
  console.log('Initializing admin dashboard...');
  
  // Setup sidebar navigation
  setupSidebarNavigation();
  
  // Setup modal
  setupAdminModal();
  
  // Setup mobile controls
  initializeMobileAdminControls();
}

// Initialize mobile admin controls
function initializeMobileAdminControls() {
  const adminMenuBtn = document.getElementById('adminMenuBtn');
  const adminSidebar = document.getElementById('adminSidebar');
  
  if (adminMenuBtn && adminSidebar) {
    adminMenuBtn.addEventListener('click', () => {
      adminSidebar.classList.toggle('active');
      document.body.style.overflow = adminSidebar.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
      if (adminSidebar.classList.contains('active') && 
          !adminSidebar.contains(e.target) && 
          e.target !== adminMenuBtn && 
          !adminMenuBtn.contains(e.target)) {
        adminSidebar.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    
    // Close sidebar with escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && adminSidebar.classList.contains('active')) {
        adminSidebar.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
}

function setupSidebarNavigation() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const adminMenuBtn = document.getElementById('adminMenuBtn');
  const adminSidebar = document.getElementById('adminSidebar');
  
  // Sidebar link clicks
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links
      sidebarLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Show corresponding tab
      const tabId = link.getAttribute('data-tab') + '-tab';
      showAdminTab(tabId);
      
      // Close sidebar on mobile after selection
      if (window.innerWidth <= 768) {
        adminSidebar.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

function showAdminTab(tabId) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Show selected tab
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.classList.add('active');
    
    // Load tab-specific data
    switch(tabId) {
      case 'orders-tab':
        loadOrdersData();
        break;
      case 'products-tab':
        loadProductsData();
        break;
      case 'customers-tab':
        loadCustomersData();
        break;
      case 'analytics-tab':
        loadAnalyticsData();
        break;
    }
  }
}

function setupAdminModal() {
  const modal = document.getElementById('orderDetailsModal');
  const closeBtn = document.querySelector('.close-admin-modal');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

// Load dashboard overview data
async function loadDashboardData() {
  try {
    const orders = await getAllOrders();
    updateDashboardStats(orders);
    updateRecentOrders(orders);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

// Get all orders from Firestore
async function getAllOrders() {
  try {
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();
    
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Update dashboard statistics
function updateDashboardStats(orders) {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'delivered').length;
  
  // Update DOM elements
  document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
  document.getElementById('totalOrders').textContent = totalOrders;
  document.getElementById('pendingOrders').textContent = pendingOrders;
  document.getElementById('completedOrders').textContent = completedOrders;
  
  // Update pending orders badge
  const pendingBadge = document.getElementById('pendingOrdersCount');
  if (pendingBadge) {
    pendingBadge.textContent = pendingOrders;
  }
  
  // Calculate additional stats
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const todayRevenue = orders
    .filter(order => new Date(order.createdAt) >= todayStart)
    .reduce((sum, order) => sum + order.total, 0);
  
  const weekRevenue = orders
    .filter(order => new Date(order.createdAt) >= weekStart)
    .reduce((sum, order) => sum + order.total, 0);
  
  const monthRevenue = orders
    .filter(order => new Date(order.createdAt) >= monthStart)
    .reduce((sum, order) => sum + order.total, 0);
  
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  document.getElementById('todayRevenue').textContent = `$${todayRevenue.toFixed(2)}`;
  document.getElementById('weekRevenue').textContent = `$${weekRevenue.toFixed(2)}`;
  document.getElementById('monthRevenue').textContent = `$${monthRevenue.toFixed(2)}`;
  document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
}

// Update recent orders list
function updateRecentOrders(orders) {
  const recentOrdersList = document.getElementById('recentOrdersList');
  if (!recentOrdersList) return;
  
  const recentOrders = orders.slice(0, 5); // Show last 5 orders
  
  recentOrdersList.innerHTML = recentOrders.map(order => `
    <div class="recent-order-item">
      <div class="order-info">
        <h4>Order #${order.orderNumber}</h4>
        <p>${order.customerName} • ${formatDate(order.createdAt)}</p>
      </div>
      <div class="order-details">
        <span class="order-amount">$${order.total.toFixed(2)}</span>
        <span class="order-status status-${order.status}">${order.status}</span>
      </div>
    </div>
  `).join('');
}

// Load orders data for orders tab
async function loadOrdersData() {
  try {
    const orders = await getAllOrders();
    displayOrdersTable(orders);
  } catch (error) {
    console.error('Error loading orders data:', error);
  }
}

// Display orders in table
function displayOrdersTable(orders) {
  const tableBody = document.getElementById('ordersTableBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = orders.map(order => `
    <tr>
      <td>${order.orderNumber}</td>
      <td>${order.customerName}</td>
      <td>${formatDate(order.createdAt)}</td>
      <td>$${order.total.toFixed(2)}</td>
      <td><span class="order-status status-${order.status}">${order.status}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-sm btn-view" onclick="viewOrderDetails('${order.id}')">View</button>
          ${order.status === 'pending' ? 
            `<button class="btn-sm btn-confirm" onclick="updateOrderStatus('${order.id}', 'confirmed')">Confirm</button>` : 
            order.status === 'confirmed' ?
            `<button class="btn-sm btn-deliver" onclick="updateOrderStatus('${order.id}', 'delivered')">Deliver</button>` :
            ''
          }
        </div>
      </td>
    </tr>
  `).join('');
}

// View order details
async function viewOrderDetails(orderId) {
  try {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (orderDoc.exists) {
      const order = orderDoc.data();
      showOrderDetailsModal(order);
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
  }
}

// Show order details in modal
function showOrderDetailsModal(order) {
  const modal = document.getElementById('orderDetailsModal');
  const content = document.getElementById('orderDetailsContent');
  
  content.innerHTML = `
    <div class="order-details">
      <div class="detail-section">
        <h3>Order Information</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
        <p><strong>Status:</strong> <span class="order-status status-${order.status}">${order.status}</span></p>
        <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
      </div>
      
      <div class="detail-section">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        <p><strong>Phone:</strong> ${order.customerPhone}</p>
        <p><strong>Address:</strong> ${order.customerAddress}</p>
        ${order.orderNotes ? `<p><strong>Notes:</strong> ${order.orderNotes}</p>` : ''}
      </div>
      
      <div class="detail-section">
        <h3>Order Items</h3>
        ${order.items.map(item => `
          <div class="order-item-detail">
            <p><strong>${item.title}</strong> - $${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    await db.collection('orders').doc(orderId).update({
      status: newStatus
    });
    
    // Reload data
    loadDashboardData();
    loadOrdersData();
    
    alert(`Order status updated to ${newStatus}`);
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('Error updating order status');
  }
}

// Load products data
async function loadProductsData() {
  // This would load products from your products collection
  // For now, we'll show a placeholder
  const productsGrid = document.getElementById('productsGrid');
  if (productsGrid) {
    productsGrid.innerHTML = `
      <div class="product-card">
        <p>Product management coming soon...</p>
        <p>You can add, edit, and manage products here.</p>
      </div>
    `;
  }
}

// Load customers data
async function loadCustomersData() {
  // This would aggregate customer data from orders
  const customersTableBody = document.getElementById('customersTableBody');
  if (customersTableBody) {
    customersTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          Customer analytics coming soon...
        </td>
      </tr>
    `;
  }
}

// Load analytics data
async function loadAnalyticsData() {
  // Placeholder for analytics
  console.log('Loading analytics data...');
}

// Format date function
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Admin logout
function adminLogout() {
  if (window.auth && auth.currentUser) {
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    });
  } else {
    window.location.href = 'login.html';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Order search functionality
  const orderSearch = document.getElementById('orderSearch');
  if (orderSearch) {
    orderSearch.addEventListener('input', debounce(handleOrderSearch, 300));
  }
  
  // Order filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn[data-status]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterOrders(btn.getAttribute('data-status'));
    });
  });
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Handle order search
async function handleOrderSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const orders = await getAllOrders();
  
  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm) ||
    order.customerName.toLowerCase().includes(searchTerm) ||
    order.customerEmail.toLowerCase().includes(searchTerm)
  );
  
  displayOrdersTable(filteredOrders);
}

// Filter orders by status
async function filterOrders(status) {
  const orders = await getAllOrders();
  
  const filteredOrders = status === 'all' 
    ? orders 
    : orders.filter(order => order.status === status);
  
  displayOrdersTable(filteredOrders);
}

// Add to admin.js - PRODUCT MANAGEMENT FUNCTIONS

// Load products data
async function loadProductsData() {
  try {
    const products = await getAllProducts();
    displayProductsGrid(products);
  } catch (error) {
    console.error('Error loading products data:', error);
  }
}

// Get all products from Firestore
async function getAllProducts() {
  try {
    const productsSnapshot = await db.collection('products')
      .orderBy('createdAt', 'desc')
      .get();
    
    return productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Display products in grid
function displayProductsGrid(products) {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;
  
  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div class="empty-products">
        <p>No products yet. Add your first product!</p>
      </div>
    `;
    return;
  }
  
  productsGrid.innerHTML = products.map(product => `
    <div class="product-admin-card" data-product-id="${product.id}">
      <div class="product-admin-image">
        <img src="${product.imageUrl || 'images/placeholder.jpg'}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
      </div>
      <div class="product-admin-info">
        <h4>${product.name}</h4>
        <p class="product-admin-category">${product.category}</p>
        <p class="product-admin-price">$${product.price.toFixed(2)}</p>
        <p class="product-admin-stock">Stock: ${product.stock}</p>
      </div>
      <div class="product-admin-actions">
        <button class="btn-sm btn-edit" onclick="editProduct('${product.id}')">Edit</button>
        <button class="btn-sm btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Add product functionality
function setupAddProductButton() {
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', showAddProductModal);
  }
}

// Show add product modal
function showAddProductModal() {
  const modal = document.createElement('div');
  modal.className = 'admin-modal active';
  modal.innerHTML = `
    <div class="admin-modal-content">
      <div class="admin-modal-header">
        <h2>Add New Product</h2>
        <button class="close-admin-modal">&times;</button>
      </div>
      <div class="admin-modal-body">
        <form id="addProductForm" class="product-form">
          <div class="form-group">
            <label for="productName">Product Name</label>
            <input type="text" id="productName" name="name" required>
          </div>
          
          <div class="form-group">
            <label for="productCategory">Category</label>
            <select id="productCategory" name="category" required>
              <option value="">Select Category</option>
              <option value="accessories">Accessories</option>
              <option value="clothes">Clothes</option>
              <option value="car">Car Gadgets</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="productPrice">Price ($)</label>
            <input type="number" id="productPrice" name="price" step="0.01" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="productStock">Stock Quantity</label>
            <input type="number" id="productStock" name="stock" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="productDescription">Description</label>
            <textarea id="productDescription" name="description" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="productImage">Image URL</label>
            <input type="url" id="productImage" name="imageUrl" placeholder="https://example.com/image.jpg">
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-outline" onclick="closeCurrentModal()">Cancel</button>
            <button type="submit" class="btn-primary">Add Product</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Setup event listeners
  const closeBtn = modal.querySelector('.close-admin-modal');
  const form = modal.querySelector('#addProductForm');
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  form.addEventListener('submit', handleAddProduct);
}

// Update in admin.js - ENHANCED PRODUCT CREATION
async function handleAddProduct(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const product = {
    name: formData.get('name') || 'Unnamed Product',
    category: formData.get('category') || 'uncategorized',
    price: parseFloat(formData.get('price')) || 0,
    stock: parseInt(formData.get('stock')) || 0,
    description: formData.get('description') || '',
    imageUrl: formData.get('imageUrl') || 'https://via.placeholder.com/300x300?text=No+Image',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Validate required fields
  if (!product.name || product.price <= 0) {
    alert('Please fill in all required fields with valid values.');
    return;
  }
  
  try {
    await db.collection('products').add(product);
    alert('Product added successfully!');
    closeCurrentModal();
    loadProductsData(); // Reload the products list
  } catch (error) {
    console.error('Error adding product:', error);
    alert('Error adding product. Please try again.');
  }
}

// Edit product
async function editProduct(productId) {
  try {
    const productDoc = await db.collection('products').doc(productId).get();
    if (productDoc.exists) {
      const product = productDoc.data();
      showEditProductModal(productId, product);
    }
  } catch (error) {
    console.error('Error fetching product:', error);
  }
}

// Show edit product modal
function showEditProductModal(productId, product) {
  const modal = document.createElement('div');
  modal.className = 'admin-modal active';
  modal.innerHTML = `
    <div class="admin-modal-content">
      <div class="admin-modal-header">
        <h2>Edit Product</h2>
        <button class="close-admin-modal">&times;</button>
      </div>
      <div class="admin-modal-body">
        <form id="editProductForm" class="product-form">
          <div class="form-group">
            <label for="editProductName">Product Name</label>
            <input type="text" id="editProductName" name="name" value="${product.name}" required>
          </div>
          
          <div class="form-group">
            <label for="editProductCategory">Category</label>
            <select id="editProductCategory" name="category" required>
              <option value="accessories" ${product.category === 'accessories' ? 'selected' : ''}>Accessories</option>
              <option value="clothes" ${product.category === 'clothes' ? 'selected' : ''}>Clothes</option>
              <option value="car" ${product.category === 'car' ? 'selected' : ''}>Car Gadgets</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="editProductPrice">Price ($)</label>
            <input type="number" id="editProductPrice" name="price" value="${product.price}" step="0.01" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="editProductStock">Stock Quantity</label>
            <input type="number" id="editProductStock" name="stock" value="${product.stock}" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="editProductDescription">Description</label>
            <textarea id="editProductDescription" name="description" rows="3">${product.description || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="editProductImage">Image URL</label>
            <input type="url" id="editProductImage" name="imageUrl" value="${product.imageUrl || ''}" placeholder="https://example.com/image.jpg">
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-outline" onclick="closeCurrentModal()">Cancel</button>
            <button type="submit" class="btn-primary">Update Product</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeBtn = modal.querySelector('.close-admin-modal');
  const form = modal.querySelector('#editProductForm');
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  form.addEventListener('submit', (e) => handleUpdateProduct(e, productId));
}

// Handle update product
async function handleUpdateProduct(e, productId) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const product = {
    name: formData.get('name'),
    category: formData.get('category'),
    price: parseFloat(formData.get('price')),
    stock: parseInt(formData.get('stock')),
    description: formData.get('description'),
    imageUrl: formData.get('imageUrl') || 'images/placeholder.jpg',
    updatedAt: new Date().toISOString()
  };
  
  try {
    await db.collection('products').doc(productId).update(product);
    alert('Product updated successfully!');
    closeCurrentModal();
    loadProductsData(); // Reload the products list
  } catch (error) {
    console.error('Error updating product:', error);
    alert('Error updating product. Please try again.');
  }
}

// Delete product
async function deleteProduct(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      await db.collection('products').doc(productId).delete();
      alert('Product deleted successfully!');
      loadProductsData(); // Reload the products list
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    }
  }
}

// Close current modal
function closeCurrentModal() {
  const modal = document.querySelector('.admin-modal.active');
  if (modal) {
    document.body.removeChild(modal);
  }
}

// Update the initializeAdminDashboard function to include product setup
function initializeAdminDashboard() {
  console.log('Initializing admin dashboard...');
  
  // Setup sidebar navigation
  setupSidebarNavigation();
  
  // Setup modal
  setupAdminModal();
  
  // Setup mobile controls
  initializeMobileAdminControls();
  
  // Setup product management
  setupAddProductButton();
}