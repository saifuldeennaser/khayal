/* ------------------------------------
   AUTHENTICATION HELPERS - FIXED
------------------------------------ */

// Check if user is logged in
function isUserAuthenticated() {
  return window.auth && window.auth.currentUser;
}

// Check if current page is a public page (no auth required)
function isPublicPage() {
  const currentPage = window.location.pathname.split('/').pop();
  return ['login.html', 'signup.html', 'index.html', ''].includes(currentPage);
}

// Redirect to login only for cart actions
function requireAuthForCart() {
  if (!isUserAuthenticated()) {
    console.log('Authentication required for cart - redirecting to login');
    localStorage.setItem('returnUrl', window.location.href);
    window.location.href = 'login.html';
    return false;
  }
  return true;
}


/* ------------------------------------
   SPLASH SCREEN FUNCTIONALITY - SHOW ON EVERY VISIT
------------------------------------ */

function initializeSplashScreen() {
  const splashScreen = document.getElementById('splashScreen');
  
  if (!splashScreen) return;

  // Check if we're coming from navigation (using sessionStorage)
  const isNavigation = sessionStorage.getItem('isNavigation');
  
  if (isNavigation === 'true') {
    // Don't show splash screen for navigation
    console.log('🔄 Navigation detected - skipping splash screen');
    splashScreen.style.display = 'none';
    document.body.classList.remove('splash-active');
    return;
  }

  // Show splash screen for fresh loads
  console.log('🔄 Fresh load - showing splash screen');
  document.body.classList.add('splash-active');

  // Hide splash screen after 3 seconds
  setTimeout(() => {
    splashScreen.classList.add('hidden');
    document.body.classList.remove('splash-active');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      if (splashScreen.parentNode) {
        splashScreen.parentNode.removeChild(splashScreen);
      }
    }, 500);
  }, 3000);
}

// Call this on home page load
document.addEventListener('DOMContentLoaded', function() {
  // Show splash screen on home page every time
  if (window.location.pathname.endsWith('index.html') || 
      window.location.pathname.endsWith('/') || 
      window.location.pathname === '') {
    initializeSplashScreen();
  }
});

function getCurrentPageCategory() {
  const currentPage = window.location.pathname.split('/').pop();
  console.log('🌐 Current page file:', currentPage);
  
  let category = 'all'; // Default to all products
  
  if (currentPage === 'accessories.html') {
    category = 'accessories';
  } else if (currentPage === 'clothes.html') {
    category = 'clothes';
  } else if (currentPage === 'car-gadgets.html') {
    category = 'car';
  } else if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
    category = 'all'; // Home page shows all products
  }
  
  console.log('🏷️ Determined category:', category);
  return category;
}

async function loadProducts() {
  console.log('🚀 STARTING loadProducts() - CATEGORY SPECIFIC');
  
  try {
    const productGrid = document.getElementById('productGrid');
    console.log('📋 Product grid element:', productGrid);
    
    if (!productGrid) {
      console.log('❌ No product grid found on this page');
      return;
    }

    // Show loading state
    productGrid.innerHTML = `
      <div class="loading-products" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <p>Loading products...</p>
      </div>
    `;

    // Get current page category
    const currentCategory = getCurrentPageCategory();
    console.log('🎯 Loading products for category:', currentCategory);

    // Get all products
    const allProducts = await getAllProducts();
    console.log('✅ All products fetched:', allProducts.length);

    // Filter products by current page category
    let categoryProducts = allProducts;
    if (currentCategory && currentCategory !== 'all') {
      categoryProducts = allProducts.filter(product => 
        product.category === currentCategory
      );
      console.log(`🎯 Filtered to ${categoryProducts.length} products in category: ${currentCategory}`);
    }

    // Display category-specific products
    displayProducts(categoryProducts);

  } catch (error) {
    console.error('💥 ERROR in loadProducts:', error);
    
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="empty-products" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px;">
          <h3 style="color: #856404;">Error Loading Products</h3>
          <p style="color: #856404;">Error: ${error.message}</p>
          <button onclick="location.reload()" class="btn-primary" style="margin-top: 15px;">
            Reload Page
          </button>
        </div>
      `;
    }
  }
}

async function getAllProducts() {
  console.log('🛒 STARTING getAllProducts()');
  
  try {
    if (!db) {
      console.error('❌ Firestore db not available');
      return [];
    }

    console.log('📝 Querying Firestore...');
    const snapshot = await db.collection('products').get();
    console.log('✅ Firestore query completed');

    const products = [];
    
    snapshot.forEach(doc => {
      const productData = doc.data();
      const product = {
        id: doc.id,
        name: productData.name || 'Unnamed Product',
        price: productData.price || 0,
        category: productData.category || 'uncategorized',
        stock: productData.stock || 0,
        imageUrl: productData.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image',
        description: productData.description || ''
      };
      products.push(product);
      
      console.log(`📦 Product ${products.length}:`, product);
    });

    console.log(`✅ Total products found: ${products.length}`);
    
    if (products.length === 0) {
      console.log('⚠️ No products found in database');
    }
    
    return products;
    
  } catch (error) {
    console.error('💥 ERROR in getAllProducts:', error);
    throw error;
  }
}

function displayProducts(products) {
  console.log('🎨 STARTING displayProducts()');
  console.log('   Products to display:', products.length);
  
  const productGrid = document.getElementById('productGrid');
  if (!productGrid) {
    console.log('❌ Product grid not found in displayProducts');
    return;
  }

  // Clear any loading state
  const loadingElement = productGrid.querySelector('.loading-products');
  if (loadingElement) {
    loadingElement.remove();
  }

  // Handle no products case
  if (!products || products.length === 0) {
    console.log('📭 No products to display');
    
    const currentCategory = getCurrentPageCategory();
    const categoryName = getCategoryDisplayName(currentCategory);
    
    productGrid.innerHTML = `
      <div class="empty-products" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <h3>No ${categoryName} Available</h3>
        <p>We're currently updating our ${categoryName.toLowerCase()} collection.</p>
        <p>Please check back later!</p>
      </div>
    `;
    return;
  }

  // Display products
  console.log(`🖼️ Rendering ${products.length} products`);
  
  let productsHTML = '';
  
  products.forEach((product, index) => {
    console.log(`   Rendering product ${index + 1}:`, product.name);
    
    const isOutOfStock = (product.stock || 0) < 1;
    
    productsHTML += `
      <div class="product-card" data-category="${product.category || 'uncategorized'}" data-product-id="${product.id}">
        <div class="thumb">
          <img src="${product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}" 
               alt="${product.name || 'Unnamed Product'}" 
               onerror="this.src='https://via.placeholder.com/300x300?text=Image+Error'"
               style="width: 100%; height: 200px; object-fit: cover;">
          ${isOutOfStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
        </div>
        <div class="info">
          <h4>${product.name || 'Unnamed Product'}</h4>
          <p class="price">$${(product.price || 0).toFixed(2)}</p>
          <p class="stock-info" style="font-size: 0.8rem; color: #666; margin: 5px 0;">
            ${(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          <button class="add-to-cart ${isOutOfStock ? 'out-of-stock' : ''}" 
                  data-product-id="${product.id}"
                  ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
  });

  productGrid.innerHTML = productsHTML;
  console.log('✅ Products rendered successfully');

  // Re-attach event listeners
  setTimeout(() => {
    attachAddToCartListeners();
  }, 100);
}

// Helper function to get display name for categories
function getCategoryDisplayName(category) {
  const categoryNames = {
    'accessories': 'Accessories',
    'clothes': 'Clothes', 
    'car': 'Car Gadgets',
    'all': 'Products'
  };
  return categoryNames[category] || 'Products';
}

// Helper function to render product grid HTML
function renderProductGrid(products) {
  return products.map(product => {
    // Ensure all required fields have fallbacks
    const productName = product.name || 'Unnamed Product';
    const productPrice = product.price || 0;
    const productCategory = product.category || 'uncategorized';
    const productImage = product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image';
    const productId = product.id || 'unknown';
    const productStock = product.stock || 0;
    
    // Stock status
    const isOutOfStock = productStock < 1;
    const buttonText = isOutOfStock ? 'Out of Stock' : 'Add to Cart';
    const buttonClass = isOutOfStock ? 'add-to-cart out-of-stock' : 'add-to-cart';
    const buttonDisabled = isOutOfStock ? 'disabled' : '';
    
    console.log(`🖼️ Rendering product: ${productName} (Category: ${productCategory}, Stock: ${productStock})`);
    
    return `
      <div class="product-card reveal" data-category="${productCategory}" data-product-id="${productId}">
        <div class="thumb">
          <img src="${productImage}" alt="${productName}" 
               onerror="this.src='https://via.placeholder.com/300x300?text=Image+Error'" 
               style="width: 100%; height: 200px; object-fit: cover;">
          ${isOutOfStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
        </div>
        <div class="info">
          <h4>${productName}</h4>
          <p class="price">$${productPrice.toFixed(2)}</p>
          <p class="stock-info" style="font-size: 0.8rem; color: #666; margin: 5px 0;">
            ${productStock > 0 ? `${productStock} in stock` : 'Out of stock'}
          </p>
          <button class="${buttonClass}" 
                  data-product-id="${productId}"
                  ${buttonDisabled}
                  style="width: 100%; padding: 12px; border: none; border-radius: 6px; background: ${isOutOfStock ? '#ccc' : 'linear-gradient(135deg, #000000 0%, #4f4f4f 100%)'}; color: white; cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'};">
            ${buttonText}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Enhanced add to cart with stock validation
async function addProductToCart(productId) {
  try {
    if (!requireAuthForCart()) {
      return;
    }
    
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      alert('Product not found!');
      return;
    }
    
    const product = productDoc.data();
    
    if (product.stock < 1) {
      alert('This product is out of stock!');
      return;
    }
    
    let cart = await getCart();
    let existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Cannot add more items. Stock limit reached!');
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        title: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        category: product.category,
        addedAt: new Date().toISOString()
      });
    }
    
    await saveCart(cart);
    
    // Visual feedback
    const btn = document.querySelector(`[data-product-id="${productId}"]`);
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '✓ Added!';
      btn.style.background = 'green';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 1500);
    }
    
  } catch (error) {
    console.error('Error adding product to cart:', error);
    alert('Error adding product to cart. Please try again.');
  }
}

// Attach event listeners to add to cart buttons
function attachAddToCartListeners() {
  const addToCartBtns = document.querySelectorAll('.add-to-cart[data-product-id]');
  
  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (!requireAuthForCart()) {
        return;
      }
      
      const productId = btn.getAttribute('data-product-id');
      await addProductToCart(productId);
    });
  });
}

// Add specific product to cart
async function addProductToCart(productId) {
  try {
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      alert('Product not found!');
      return;
    }
    
    const product = productDoc.data();
    
    if (product.stock < 1) {
      alert('This product is out of stock!');
      return;
    }
    
    let cart = await getCart();
    let existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Cannot add more items. Stock limit reached!');
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        title: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        category: product.category,
        addedAt: new Date().toISOString()
      });
    }
    
    await saveCart(cart);
    
    // Visual feedback
    const originalText = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.style.background = 'green';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1500);
    
  } catch (error) {
    console.error('Error adding product to cart:', error);
    alert('Error adding product to cart. Please try again.');
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log("🚀 DOM loaded - starting initialization");
  
  // Test Firestore first
  await testFirestoreConnection();
  
  // Initialize splash screen (only on index.html)
  if (window.location.pathname.endsWith('index.html') || 
      window.location.pathname.endsWith('/') || 
      window.location.pathname === '') {
    initializeSplashScreen();
  }
  
  // Load products for product pages
  if (!window.location.pathname.includes('admin.html') && 
      !window.location.pathname.includes('cart.html') &&
      !window.location.pathname.includes('orders.html') &&
      !window.location.pathname.includes('login.html') &&
      !window.location.pathname.includes('signup.html')) {
    
    console.log('🛍️ Loading products for page:', window.location.pathname);
    await loadProducts();
  }
  
  // Initialize other features
  if (window.location.pathname.includes('cart.html')) {
    initializeCheckoutModal();
  }
  
  if (window.location.pathname.includes('orders.html')) {
    if (window.auth && auth.currentUser) {
      await loadUserOrders();
    }
  }
  
  // Initialize cart and UI
  await updateCartCount();
  updateUserDisplay();
  
  if (window.location.pathname.includes('cart.html')) {
    await renderCartPage();
  }
  
  console.log("✅ App initialization complete");
});

// Emergency function to create sample products
async function createSampleProducts() {
  console.log('🆘 Creating sample products...');
  
  const sampleProducts = [
    {
      name: "Leather Watch",
      price: 129.99,
      category: "accessories",
      stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
      description: "Premium leather wristwatch",
      createdAt: new Date().toISOString()
    },
    {
      name: "Sunglasses",
      price: 79.99,
      category: "accessories",
      stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop",
      description: "Classic UV protection sunglasses",
      createdAt: new Date().toISOString()
    },
    {
      name: "Cotton T-Shirt",
      price: 29.99,
      category: "clothes",
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
      description: "Comfortable 100% cotton t-shirt",
      createdAt: new Date().toISOString()
    },
    {
      name: "Jeans",
      price: 59.99,
      category: "clothes",
      stock: 18,
      imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop",
      description: "Classic blue denim jeans",
      createdAt: new Date().toISOString()
    },
    {
      name: "Car Phone Mount",
      price: 24.99,
      category: "car",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1603712610496-5362a2f6ac14?w=300&h=300&fit=crop",
      description: "Universal smartphone car holder",
      createdAt: new Date().toISOString()
    },
    {
      name: "Car Charger",
      price: 19.99,
      category: "car",
      stock: 22,
      imageUrl: "https://images.unsplash.com/photo-1609588040091-5c99e0a115c4?w=300&h=300&fit=crop",
      description: "Fast charging car adapter",
      createdAt: new Date().toISOString()
    }
  ];

  let createdCount = 0;
  
  for (const product of sampleProducts) {
    try {
      await db.collection('products').add(product);
      createdCount++;
      console.log(`✅ Created: ${product.name}`);
    } catch (error) {
      console.error(`❌ Failed to create ${product.name}:`, error);
    }
  }
  
  console.log(`🎉 Created ${createdCount} sample products`);
  
  // Reload products after creation
  setTimeout(() => {
    loadProducts();
  }, 2000);
  
  return createdCount;
}

/* ------------------------------------
   FIREBASE CART SYSTEM
------------------------------------ */

// Helper to get user ID
function getUserId() {
  return window.auth && window.auth.currentUser ? window.auth.currentUser.uid : null;
}

// Helper to get cart data from Firestore
async function getCart() {
  try {
    const userId = getUserId();
    if (!userId) return [];
    
    const cartDoc = await db.collection('carts').doc(userId).get();
    return cartDoc.exists ? cartDoc.data().items : [];
  } catch (error) {
    console.error('Error getting cart:', error);
    return [];
  }
}

// Helper to save cart data to Firestore
async function saveCart(cart) {
  try {
    const userId = getUserId();
    if (!userId) return;
    
    await db.collection('carts').doc(userId).set({
      items: cart,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      userType: 'registered'
    });
    updateCartCount();
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

// Update the count on the Navbar
async function updateCartCount() {
  const cartCountEl = document.querySelector(".cart-count");
  if (cartCountEl) {
    if (isUserAuthenticated()) {
      const cart = await getCart();
      const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      cartCountEl.innerText = totalCount;
    } else {
      cartCountEl.innerText = "0";
    }
  }
}

// Add To Cart Buttons - FIXED VERSION
const addToCartBtns = document.querySelectorAll(".add-to-cart");

addToCartBtns.forEach(btn => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    
    // ONLY redirect to login when trying to add to cart
    if (!requireAuthForCart()) {
      return;
    }
    
    const card = btn.closest(".product-card");
    const title = card.querySelector("h4").innerText;
    const priceText = card.querySelector(".price").innerText.replace("$", "");
    const price = parseFloat(priceText);
    const imageUrl = card.querySelector("img").src;
    const category = card.getAttribute("data-category");

    let cart = await getCart();
    let existingItem = cart.find(item => item.title === title);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ 
        title, 
        price, 
        quantity: 1, 
        imageUrl, 
        category,
        addedAt: new Date().toISOString()
      });
    }

    await saveCart(cart);
    
    // Visual feedback
    const originalText = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.style.background = 'green';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1500);
  });
});

// Update the renderCartPage function in app.js
async function renderCartPage() {
  const container = document.getElementById("cartItemsContainer");
  const cartStatus = document.getElementById("cart-status");
  const subtotalEl = document.getElementById("cartSubtotal");
  const totalEl = document.getElementById("cartTotal");

  if (!container) return;

  let cart = await getCart();
  container.innerHTML = "";
  let subtotal = 0;

  if (cart.length === 0) {
    container.innerHTML = "<p style='padding: 20px; text-align: center;'>No products in the cart. Start shopping now!</p>";
    if (cartStatus) cartStatus.innerText = "Your cart is empty.";
    if (subtotalEl) subtotalEl.innerText = "$0.00";
    if (totalEl) totalEl.innerText = "$0.00";
  } else {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartStatus) cartStatus.innerText = `You have ${totalItems} items in your cart.`;

    // Fetch current product details to ensure prices are up to date
    for (let item of cart) {
      try {
        const productDoc = await db.collection('products').doc(item.id).get();
        if (productDoc.exists) {
          const product = productDoc.data();
          item.price = product.price; // Update price from database
          item.title = product.name; // Update title from database
          item.imageUrl = product.imageUrl; // Update image from database
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    }

    // Save updated cart
    await saveCart(cart);

    // Render cart items
    cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
        <img src="${item.imageUrl || 'images/placeholder.jpg'}" alt="${item.title}" onerror="this.src='images/placeholder.jpg'">
        <div class="cart-item-details">
          <h4>${item.title}</h4>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <span class="quantity-label">Qty:</span>
            <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="quantity-input">
          </div>
          <div class="item-total">Item Total: <strong>$${itemTotal.toFixed(2)}</strong></div>
        </div>
        <button class="remove-item" data-index="${index}">✕ Remove</button>
      `;
      container.appendChild(cartItem);
    });

    if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `$${subtotal.toFixed(2)}`;

    // Add event listeners
    setTimeout(() => {
      container.querySelectorAll(".remove-item").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const index = parseInt(e.target.getAttribute("data-index"));
          let updatedCart = await getCart();
          updatedCart.splice(index, 1);
          await saveCart(updatedCart);
          renderCartPage();
        });
      });

      container.querySelectorAll(".quantity-input").forEach(input => {
        input.addEventListener("change", async (e) => {
          const index = parseInt(e.target.getAttribute("data-index"));
          const newQuantity = parseInt(e.target.value);
          let updatedCart = await getCart();
          
          if (newQuantity < 1) {
            updatedCart.splice(index, 1);
          } else {
            // Check stock availability
            try {
              const productDoc = await db.collection('products').doc(updatedCart[index].id).get();
              if (productDoc.exists) {
                const product = productDoc.data();
                if (newQuantity > product.stock) {
                  alert(`Only ${product.stock} items available in stock!`);
                  e.target.value = product.stock;
                  updatedCart[index].quantity = product.stock;
                } else {
                  updatedCart[index].quantity = newQuantity;
                }
              }
            } catch (error) {
              console.error('Error checking stock:', error);
              updatedCart[index].quantity = newQuantity;
            }
          }
          
          await saveCart(updatedCart);
          renderCartPage();
        });
      });
    }, 100);
  }

  // Clear cart button
  const clearCartBtn = document.getElementById("clearCartBtn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", async () => {
      await saveCart([]);
      renderCartPage();
    });
  }
}

/* ------------------------------------
   CHECKOUT SYSTEM
------------------------------------ */

// Initialize checkout modal
function initializeCheckoutModal() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  const closeModalBtn = document.getElementById('closeCheckoutModal');
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutForm = document.getElementById('checkoutForm');
  
  if (!checkoutBtn || !checkoutModal) return;
  
  // Open modal when checkout button is clicked
  checkoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!requireAuthForCart()) {
      return;
    }
    
    const cart = await getCart();
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    openCheckoutModal(cart);
  });
  
  // Close modal when X is clicked
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeCheckoutModal);
  }
  
  // Close modal when clicking outside
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
      closeCheckoutModal();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && checkoutModal.classList.contains('active')) {
      closeCheckoutModal();
    }
  });
  
  // Handle form submission
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleOrderSubmission);
  }
}

// Open checkout modal with cart data
function openCheckoutModal(cart) {
  const checkoutModal = document.getElementById('checkoutModal');
  const modalOrderSummary = document.getElementById('modalOrderSummary');
  const modalTotalPrice = document.getElementById('modalTotalPrice');
  
  if (!checkoutModal || !modalOrderSummary) return;
  
  // Calculate total and build order summary
  let total = 0;
  let summaryHTML = '';
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    summaryHTML += `
      <div class="order-item-summary">
        <span>${item.title} (${item.quantity}x)</span>
        <span>$${itemTotal.toFixed(2)}</span>
      </div>
    `;
  });
  
  modalOrderSummary.innerHTML = summaryHTML;
  modalTotalPrice.textContent = `$${total.toFixed(2)}`;
  
  // Pre-fill user data if available
  if (window.auth && window.auth.currentUser) {
    const user = auth.currentUser;
    const nameInput = document.getElementById('customerName');
    const emailInput = document.getElementById('customerEmail');
    
    if (nameInput && user.displayName) {
      nameInput.value = user.displayName;
    }
    if (emailInput && user.email) {
      emailInput.value = user.email;
    }
  }
  
  // Show modal with animation
  checkoutModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close checkout modal
function closeCheckoutModal() {
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) {
    checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Handle order submission - UPDATED
async function handleOrderSubmission(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('.submit-order-btn');
  const formData = new FormData(e.target);
  
  // Get cart data
  const cart = await getCart();
  
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  // Validate form data
  const customerName = formData.get('customerName');
  const customerEmail = formData.get('customerEmail');
  const customerPhone = formData.get('customerPhone');
  const customerAddress = formData.get('customerAddress');
  
  if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
    alert('Please fill in all required fields.');
    return;
  }
  
  // Show loading state
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing Order...';
  
  try {
    // Create order object
    const order = {
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      orderNotes: formData.get('orderNotes') || '',
      items: [...cart], // Create a copy of the cart
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'pending',
      createdAt: new Date().toISOString(),
      userId: getUserId(),
      orderNumber: generateOrderNumber()
    };
    
    console.log('Saving order:', order);
    
    // Save order to Firestore
    const orderId = await saveOrderToFirestore(order);
    console.log('Order saved successfully with ID:', orderId);
    
    // Clear cart after successful order
    await saveCart([]);
    console.log('Cart cleared after order');
    
    // Show success message
    showOrderSuccess();
    
    // Debug: Check if order appears in orders
    setTimeout(() => {
      debugOrders();
    }, 2000);
    
  } catch (error) {
    console.error('Order submission error:', error);
    alert('There was an error placing your order. Please try again. Error: ' + error.message);
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
  }
}

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `KH${timestamp}${random}`;
}

// Save order to Firestore - UPDATED
async function saveOrderToFirestore(order) {
  if (!window.db) {
    throw new Error('Firestore not available');
  }
  
  try {
    const orderRef = await db.collection('orders').add(order);
    console.log('Order saved with ID:', orderRef.id);
    
    // Verify the order was saved
    const savedOrder = await orderRef.get();
    console.log('Verified order data:', savedOrder.data());
    
    return orderRef.id;
  } catch (error) {
    console.error('Error saving order to Firestore:', error);
    throw error;
  }
}

// Show order success message
function showOrderSuccess() {
  const checkoutForm = document.getElementById('checkoutForm');
  if (!checkoutForm) return;
  
  checkoutForm.innerHTML = `
    <div class="order-success">
      <div class="success-icon">✓</div>
      <h3>Order Placed Successfully!</h3>
      <p>Thank you for your purchase. Your order has been received and is being processed.</p>
      <p>We will contact you shortly to confirm your order.</p>
      <button class="btn-primary" onclick="closeCheckoutModal(); window.location.href='index.html'">
        Continue Shopping
      </button>
    </div>
  `;
}

// Debug function to check orders
async function debugOrders() {
  const userId = getUserId();
  if (!userId) {
    console.log('No user ID found');
    return;
  }
  
  try {
    const ordersSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .get();
    
    console.log('Total orders found:', ordersSnapshot.size);
    ordersSnapshot.forEach(doc => {
      console.log('Order:', doc.id, doc.data());
    });
  } catch (error) {
    console.error('Debug error:', error);
  }
}

/* ------------------------------------
   ORDERS PAGE FUNCTIONALITY
------------------------------------ */

// Load user's orders
async function loadUserOrders() {
  const ordersContainer = document.getElementById('ordersContainer');
  const noOrders = document.getElementById('noOrders');
  
  if (!ordersContainer) return;
  
  try {
    const orders = await getUserOrders();
    
    if (orders.length === 0) {
      ordersContainer.style.display = 'none';
      if (noOrders) noOrders.style.display = 'block';
      return;
    }
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Display orders
    displayOrders(orders);
    
  } catch (error) {
    console.error('Error loading orders:', error);
    ordersContainer.innerHTML = '<p>Error loading orders. Please try again.</p>';
  }
}

// Get user's orders from Firestore - UPDATED
async function getUserOrders() {
  const userId = getUserId();
  if (!userId) {
    console.log('No user ID available');
    return [];
  }
  
  console.log('Fetching orders for user:', userId);
  
  try {
    const ordersSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Orders fetched successfully:', orders.length);
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    // If ordering fails, try without order
    try {
      const ordersSnapshot = await db.collection('orders')
        .where('userId', '==', userId)
        .get();
      
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Manual sort by date
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('Orders fetched without ordering:', orders.length);
      return orders;
    } catch (secondError) {
      console.error('Second attempt failed:', secondError);
      return [];
    }
  }
}

// Display orders in the container
function displayOrders(orders) {
  const ordersContainer = document.getElementById('ordersContainer');
  const noOrders = document.getElementById('noOrders');
  
  if (!ordersContainer) return;
  
  if (orders.length === 0) {
    ordersContainer.style.display = 'none';
    if (noOrders) noOrders.style.display = 'block';
    return;
  }
  
  ordersContainer.innerHTML = orders.map(order => `
    <div class="order-card reveal">
      <div class="order-header">
        <div class="order-info">
          <h3>Order #${order.orderNumber}</h3>
          <div class="order-meta">
            <span><strong>Date:</strong> ${formatDate(order.createdAt)}</span>
            <span><strong>Total:</strong> $${order.total.toFixed(2)}</span>
          </div>
        </div>
        <div class="order-status status-${order.status}">
          ${order.status}
        </div>
      </div>
      
      <div class="order-items">
        ${order.items.map(item => `
          <div class="order-item">
            <img src="${item.imageUrl}" alt="${item.title}" class="item-image" onerror="this.src='https://picsum.photos/50/50'">
            <div class="item-details">
              <h4>${item.title}</h4>
              <p>$${item.price.toFixed(2)} each</p>
            </div>
            <div class="item-quantity">
              Qty: ${item.quantity}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="customer-info">
        <h4>Delivery Information</h4>
        <div class="customer-details">
          <p><strong>Name:</strong> ${order.customerName}</p>
          <p><strong>Phone:</strong> ${order.customerPhone}</p>
          <p><strong>Email:</strong> ${order.customerEmail}</p>
          <p><strong>Address:</strong> ${order.customerAddress}</p>
          ${order.orderNotes ? `<p><strong>Notes:</strong> ${order.orderNotes}</p>` : ''}
        </div>
      </div>
      
      <div class="order-total">
        <h4>Order Total: $${order.total.toFixed(2)}</h4>
      </div>
    </div>
  `).join('');
  
  // Trigger reveal animations
  setTimeout(() => {
    const reveals = ordersContainer.querySelectorAll('.reveal');
    reveals.forEach(element => element.classList.add('active'));
  }, 100);
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/* ------------------------------------
   MOBILE MENU
------------------------------------ */
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle("open");
  });

  document.querySelectorAll("#mobileMenu a").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
    });
  });

  document.addEventListener("click", (e) => {
    if (mobileMenu.classList.contains("open") && 
        !mobileMenu.contains(e.target) && 
        e.target !== menuBtn && 
        !menuBtn.contains(e.target)) {
      mobileMenu.classList.remove("open");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
      mobileMenu.classList.remove("open");
    }
  });
}

/* ------------------------------------
   SCROLL REVEAL ANIMATIONS
------------------------------------ */
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  const trigger = window.innerHeight * 0.85;
  reveals.forEach(element => {
    const top = element.getBoundingClientRect().top;
    if (top < trigger) element.classList.add("active");
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

/* ------------------------------------
   USER PROFILE DISPLAY - SIMPLIFIED
------------------------------------ */
function updateUserDisplay() {
  const userMenu = document.getElementById('userMenu');
  const mobileUserMenu = document.getElementById('mobileUserMenu');
  const mobileUserGreeting = document.getElementById('mobileUserGreeting');

  if (window.auth && window.auth.currentUser) {
    const userName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
    
    // Update desktop user menu (just show logout button)
    if (userMenu) {
      userMenu.classList.add('logged-in');
    }
    
    // Update mobile user menu (keep greeting for mobile)
    if (mobileUserMenu && mobileUserGreeting) {
      mobileUserMenu.classList.add('logged-in');
      mobileUserGreeting.textContent = `Hi, ${userName}`;
    }
  } else {
    // Hide user menus if not logged in
    if (userMenu) userMenu.classList.remove('logged-in');
    if (mobileUserMenu) mobileUserMenu.classList.remove('logged-in');
  }
}

function logout() {
  if (window.auth && window.auth.currentUser) {
    auth.signOut().then(() => {
      console.log('User logged out');
      window.location.replace('login.html');
    }).catch((error) => {
      console.error('Logout error:', error);
      window.location.replace('login.html');
    });
  } else {
    window.location.replace('login.html');
  }
}

// Initialize user display when auth state changes
if (window.auth) {
  window.auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user ? user.email : "No user");
    updateUserDisplay();
    updateCartCount();
  });
}

// Update in app.js - MAIN INITIALIZATION
document.addEventListener('DOMContentLoaded', async function() {
  console.log("DOM loaded - initializing app");
  
  // Initialize splash screen (only on index.html)
  if (window.location.pathname.endsWith('index.html') || 
      window.location.pathname.endsWith('/') || 
      window.location.pathname === '') {
    initializeSplashScreen();
  }
  
  // Initialize checkout modal if on cart page
  if (window.location.pathname.includes('cart.html')) {
    initializeCheckoutModal();
  }
  
  // Initialize orders page if on orders.html
  if (window.location.pathname.includes('orders.html')) {
    if (window.auth && auth.currentUser) {
      await loadUserOrders();
    }
  }
  
  // Load products for ALL main site pages (except admin, cart, orders)
  if (!window.location.pathname.includes('admin.html') && 
      !window.location.pathname.includes('cart.html') &&
      !window.location.pathname.includes('orders.html') &&
      !window.location.pathname.includes('login.html') &&
      !window.location.pathname.includes('signup.html')) {
    console.log('This is a product page, loading products...');
    await loadProducts();
  }
  
  // Wait for Firebase to initialize
  if (window.auth) {
    window.auth.onAuthStateChanged(async (user) => {
      console.log("Auth state changed:", user ? user.email : "No user");
      
      // Update UI based on auth state
      updateUserDisplay();
      await updateCartCount();
      
      // Only render cart page if we're on the cart page
      if (window.location.pathname.includes('cart.html')) {
        await renderCartPage();
      }
      
      // Load orders if on orders page
      if (window.location.pathname.includes('orders.html') && user) {
        await loadUserOrders();
      }
    });
  }
  
  // Initialize cart and UI
  await updateCartCount();
  updateUserDisplay();
  
  // If on cart page, render it
  if (window.location.pathname.includes('cart.html')) {
    await renderCartPage();
  }
});

// Add CSS for out of stock items
const style = document.createElement('style');
style.textContent = `
  .out-of-stock {
    background: #ccc !important;
    cursor: not-allowed !important;
  }
  
  .out-of-stock-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255,0,0,0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .thumb {
    position: relative;
  }
`;
document.head.appendChild(style);

// Call this temporarily to see what's happening
// debugProducts();


// Add this to app.js - TEST FUNCTION
window.testProducts = async function() {
  console.log('Testing product loading...');
  await loadProducts();
};

// Also update on page load
document.addEventListener('DOMContentLoaded', function() {
  // Mark the body as main site (not admin)
  document.body.classList.add('main-site');
  document.body.classList.remove('admin-body');
  
  // Clean up any leftover admin elements
  const adminElements = document.querySelectorAll('.admin-navbar, .admin-sidebar');
  adminElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
});

// Check if user is admin (for showing/hiding admin links)
function isAdminUser(user) {
  const ADMIN_EMAILS = [
  'saifuldeennaser@gmail.com',
  'mostafaeladawy35@gmail.com',
  'mohand.ahmed201@gmail.com'
];
  return user && ADMIN_EMAILS.includes(user.email);
}

// Update the user display to show admin link for admins
function updateUserDisplay() {
  const userMenu = document.getElementById('userMenu');
  const mobileUserMenu = document.getElementById('mobileUserMenu');
  const mobileUserGreeting = document.getElementById('mobileUserGreeting');

  if (window.auth && window.auth.currentUser) {
    const user = auth.currentUser;
    const userName = user.displayName || user.email.split('@')[0];
    
    // Update desktop user menu
    if (userMenu) {
      userMenu.classList.add('logged-in');
      
      // Add admin link if user is admin
      if (isAdminUser(user)) {
        let adminLink = userMenu.querySelector('.admin-link');
        if (!adminLink) {
          adminLink = document.createElement('a');
          adminLink.href = 'admin.html';
          adminLink.className = 'admin-link';
          adminLink.textContent = 'Admin';
          adminLink.style.marginRight = '15px';
          adminLink.style.color = '#fff';
          adminLink.style.textDecoration = 'none';
          adminLink.style.padding = '8px 16px';
          adminLink.style.background = 'rgba(255,255,255,0.2)';
          adminLink.style.borderRadius = '6px';
          userMenu.insertBefore(adminLink, userMenu.querySelector('.logout-btn'));
        }
      } else {
        // Remove admin link if not admin
        const adminLink = userMenu.querySelector('.admin-link');
        if (adminLink) {
          adminLink.remove();
        }
      }
    }
    
    // Update mobile user menu
    if (mobileUserMenu && mobileUserGreeting) {
      mobileUserMenu.classList.add('logged-in');
      mobileUserGreeting.textContent = `Hi, ${userName}`;
      
      // Add admin link to mobile menu if user is admin
      if (isAdminUser(user)) {
        let mobileAdminLink = mobileUserMenu.querySelector('.mobile-admin-link');
        if (!mobileAdminLink) {
          mobileAdminLink = document.createElement('a');
          mobileAdminLink.href = 'admin.html';
          mobileAdminLink.className = 'mobile-admin-link';
          mobileAdminLink.textContent = 'Admin Dashboard';
          mobileAdminLink.style.color = '#ddd';
          mobileAdminLink.style.textDecoration = 'none';
          mobileAdminLink.style.padding = '10px';
          mobileAdminLink.style.textAlign = 'center';
          mobileAdminLink.style.border = '1px solid #ddd';
          mobileAdminLink.style.borderRadius = '6px';
          mobileUserMenu.insertBefore(mobileAdminLink, mobileUserMenu.querySelector('.mobile-logout-btn'));
        }
      }
    }
  } else {
    // Hide user menus if not logged in
    if (userMenu) {
      userMenu.classList.remove('logged-in');
      const adminLink = userMenu.querySelector('.admin-link');
      if (adminLink) adminLink.remove();
    }
    if (mobileUserMenu) {
      mobileUserMenu.classList.remove('logged-in');
      const mobileAdminLink = mobileUserMenu.querySelector('.mobile-admin-link');
      if (mobileAdminLink) mobileAdminLink.remove();
    }
  }
}

async function sendAdminNotification(order) {
  try {
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbxOS6tnT5-7aqzLBBvlAGJH5HHNMnfPPaqcCZaHYAa8zjQ44DW4S_nXgz8mHGcBbMJV/exec';
    
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order)
    });
    
    const result = await response.json();
    console.log('Notification sent:', result);
    
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}