// Products Connector - Connects Supabase products to index.html and product-list.html

// Function to fetch products from Supabase
async function fetchProductsFromSupabase(featured = null, isNew = null, limit = 20) {
    try {
        // Check if Supabase is initialized
        if (!supabase) {
            console.error('Supabase not initialized');
            return { data: [], error: new Error('Supabase not initialized') };
        }

        // Start building the query
        let query = supabase.from('products').select('*');
        
        // Add featured filter if provided
        if (featured !== null) {
            query = query.eq('is_feature', featured);
        }
        
        // Add is_new filter if provided
        if (isNew !== null) {
            query = query.eq('is_new', isNew);
        }
        
        // Add limit and order
        query = query.order('created_at', { ascending: false }).limit(limit);
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching products from Supabase:', error);
            return { data: [], error };
        }
        
        console.log(`Fetched ${data.length} products from Supabase successfully`);
        return { data, error: null };
    } catch (error) {
        console.error('Exception fetching products from Supabase:', error);
        return { data: [], error };
    }
}

// Function to display products on the index page
function displayProductsOnIndex(products) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) {
        console.error('Products grid not found on index page');
        return;
    }
    
    // Clear existing products
    productsGrid.innerHTML = '';
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '<div class="no-products">No featured products available. Check back soon!</div>';
        return;
    }
    
    // Display up to 4 products on the index page
    const displayProducts = products.slice(0, 4);
    
    displayProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Function to display products on the product list page
function displayProductsOnListPage(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.error('Products grid not found on product list page');
        return;
    }
    
    // Clear existing products
    productsGrid.innerHTML = '';
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '<div class="no-products">No products found</div>';
        return;
    }
    
    products.forEach(product => {
        const productCard = createProductCard(product, true);
        productsGrid.appendChild(productCard);
    });
}

// Function to display products in new arrivals section
function displayNewArrivals(products) {
    const swiperWrapper = document.querySelector('.new-arrivals-swiper .swiper-wrapper');
    if (!swiperWrapper) {
        console.error('Swiper wrapper not found');
        return;
    }
    
    // Clear existing slides
    swiperWrapper.innerHTML = '';
    
    if (!products || products.length === 0) {
        return;
    }
    
    // Filter only products where is_new = true
    const newArrivals = products.filter(product => product.is_new === true).slice(0, 5);
    
    // If no new products found, show a message
    if (newArrivals.length === 0) {
        swiperWrapper.innerHTML = `
            <div class="swiper-slide">
                <div class="new-arrival-card">
                    <div class="new-arrival-content">
                        <h3 class="new-arrival-name">No New Products Available</h3>
                        <p class="new-arrival-price">Check back soon for new arrivals!</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    newArrivals.forEach(product => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        slide.innerHTML = `
            <div class="new-arrival-card" onclick="viewProduct('${product.id}')" style="cursor: pointer;">
                <div class="new-tag">New</div>
                <div class="new-arrival-image">
                    <img src="${product.image_url || 'https://via.placeholder.com/500x500.png?text=No+Image'}" alt="${product.name}">
                </div>
                <div class="new-arrival-content">
                    <h3 class="new-arrival-name">${product.name}</h3>
                    <div class="new-arrival-rating">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                        <span class="rating-count">(${Math.floor(Math.random() * 20) + 1})</span>
                    </div>
                    <p class="new-arrival-price">$${(product.sale_price || product.price).toFixed(2)}</p>
                    <button class="new-arrival-btn" onclick="event.stopPropagation(); addToCart('${product.id}', ${product.sale_price || product.price}, '${product.name}')">Add to Cart</button>
                </div>
            </div>
        `;
        
        swiperWrapper.appendChild(slide);
    });
    
    // Reinitialize swiper if it exists
    if (typeof Swiper !== 'undefined') {
        new Swiper('.new-arrivals-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                480: {
                    slidesPerView: 2,
                    spaceBetween: 20
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 30
                }
            }
        });
    }
}

// Function to create a product card
function createProductCard(product, isListPage = false) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.setAttribute('data-category', product.category || 'general');
    card.setAttribute('data-name', product.name);
    
    // Format price display
    const priceDisplay = product.sale_price 
        ? `<span class="product-price">$${product.sale_price.toFixed(2)}</span>
           <span class="product-old-price">$${product.price.toFixed(2)}</span>`
        : `<span class="product-price">$${product.price.toFixed(2)}</span>`;
    
    // Create featured badge if product is featured
    const featuredBadge = product.is_feature 
        ? '<div class="product-badge">Featured</div>' 
        : '';
    
    // Create new badge if product is new
    const newBadge = product.is_new 
        ? '<div class="product-badge new">New</div>' 
        : '';
    
    // Determine which badge to show (prioritize new over featured)
    const badge = product.is_new ? newBadge : (product.is_feature ? featuredBadge : '');
    
    card.innerHTML = `
        ${badge}
        <div class="product-image-container" onclick="viewProduct('${product.id}')" style="cursor: pointer;">
            <img src="${product.image_url || 'https://via.placeholder.com/500x500.png?text=No+Image'}" alt="${product.name}" class="product-image">
            <div class="product-actions">
                <button class="action-btn wishlist-btn" onclick="event.stopPropagation(); addToWishlist('${product.id}', '${product.name}')"><i class="fas fa-heart"></i></button>
                <button class="action-btn cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}', ${product.sale_price || product.price}, '${product.name}')"><i class="fas fa-shopping-cart"></i></button>
                <button class="action-btn view-btn" onclick="event.stopPropagation(); viewProduct('${product.id}')"><i class="fas fa-eye"></i></button>
            </div>
        </div>
        <div class="product-content" onclick="viewProduct('${product.id}')" style="cursor: pointer;">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-rating">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star-half-alt"></i>
                <span class="rating-count">(${Math.floor(Math.random() * 50) + 5})</span>
            </div>
            <p class="product-description">${product.description}</p>
            <div class="product-price-container">
                ${priceDisplay}
            </div>
            <button class="product-btn" onclick="event.stopPropagation(); addToCart('${product.id}', ${product.sale_price || product.price}, '${product.name}')">Add to Cart</button>
        </div>
    `;
    
    return card;
}

// Function to navigate to product details page
function viewProduct(productId) {
    // Navigate to product details page
    window.location.href = `product-details.html?id=${productId}`;
}

// Function to filter products on the product list page
function filterProducts(searchTerm = '') {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.getAttribute('data-name').toLowerCase();
        const matchesSearch = productName.includes(searchTerm.toLowerCase());
        
        if (matchesSearch) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
            card.classList.remove('fade-in');
        }
    });
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing products from Supabase...');
    
    // Wait for Supabase to initialize
    if (typeof initializeSupabase === 'function') {
        initializeSupabase();
    }
    
    // Wait a bit for Supabase to be ready
    setTimeout(async () => {
        // Fetch all products
        const { data: allProducts } = await fetchProductsFromSupabase();
        
        // Check if we're on the index page
        if (document.querySelector('.products-grid') && !document.getElementById('productsGrid')) {
            // Fetch featured products for index page
            const { data: featuredProducts, error: featuredError } = await fetchProductsFromSupabase(true, null, 4);
            
            if (featuredError) {
                console.error('Error fetching featured products:', featuredError);
                // Show fallback message
                const productsGrid = document.querySelector('.products-grid');
                if (productsGrid) {
                    productsGrid.innerHTML = '<div class="no-products">Error loading featured products. Please try again later.</div>';
                }
            } else {
                displayProductsOnIndex(featuredProducts.length > 0 ? featuredProducts : allProducts);
            }
            
            // Update new arrivals section if it exists - fetch only new products
            if (document.querySelector('.new-arrivals-swiper')) {
                const { data: newProducts } = await fetchProductsFromSupabase(null, true, 5);
                displayNewArrivals(newProducts);
            }
        }
        
        // Check if we're on the product list page
        if (document.getElementById('productsGrid')) {
            displayProductsOnListPage(allProducts);
            
            // Set up search functionality
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    filterProducts(this.value);
                });
            }
        }
    }, 1000);
});

// Make functions available globally
window.fetchProductsFromSupabase = fetchProductsFromSupabase;
window.displayProductsOnIndex = displayProductsOnIndex;
window.displayProductsOnListPage = displayProductsOnListPage;
window.filterProducts = filterProducts;
