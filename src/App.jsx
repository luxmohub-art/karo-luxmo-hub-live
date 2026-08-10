import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Lock, ChevronRight, Filter, Trash2, Edit3, 
  AlertCircle, Star, ArrowLeft, Upload, CheckCircle2, ShieldCheck, X, Phone, Mail
} from 'lucide-react';

// ============================================================================
// VERIFIED BUSINESS INFORMATION
// ============================================================================
const BUSINESS_INFO = {
  tradeName: "LUXMO HUB",
  legalName: "Sarita Devi",
  type: "Proprietorship",
  address: {
    line1: "Building No. 147, Unnamed Road",
    line2: "Near Mathura Chhapar Branch Post Office",
    area: "Vill-Kotwa, Mathura Chhapar",
    district: "District Deoria",
    state: "Uttar Pradesh - 274405"
  },
  emails: ["luxmohub@gmail.com"],
  phones: ["+91 7565012418", "+91 8299260182"],
  paymentSecurityText: "Payments are processed securely through our authorized payment gateway. We do not store customers’ card details, banking credentials or payment passwords on our servers."
};

// ============================================================================
// CATEGORIES & MODEL MAPPING
// ============================================================================
const CATEGORIES = [
  "Mobile Back Case",
  "Hybrid Solar Inverter",
  "Solar Accessories"
];

const MOBILE_MODELS = [
  "Galaxy Z Fold 7", "Galaxy Z Fold 6", "Galaxy Z Fold 5", "Galaxy Z Fold 4", "Galaxy Z Fold 3", "Galaxy Z Fold 2", "Galaxy Fold",
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Plus", "iPhone 17",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 Mini", "iPhone 13",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 Mini", "iPhone 12",
  "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
  "Galaxy S26 Ultra", "Galaxy S26 Plus", "Galaxy S26 FE", "Galaxy S26",
  "Galaxy S25 Ultra", "Galaxy S25 Plus", "Galaxy S25 FE", "Galaxy S25",
  "Galaxy S24 Ultra", "Galaxy S24 Plus", "Galaxy S24 FE", "Galaxy S24",
  "Galaxy S23 Ultra", "Galaxy S23 Plus", "Galaxy S23 FE", "Galaxy S23",
  "Galaxy S22 Ultra", "Galaxy S22 Plus", "Galaxy S22 FE", "Galaxy S22"
];

const INVERTER_MODELS = [
  "Hybrid Solar Inverter 3KW 24V", "Hybrid Solar Inverter 3.5KW 24V", "Hybrid Solar Inverter 5KW 24V",
  "Hybrid Solar Inverter 5KW 48V", "Hybrid Solar Inverter 5.5KW 24V", "Hybrid Solar Inverter 5.5KW 48V",
  "Hybrid Solar Inverter 6KW 48V", "Hybrid Solar Inverter 6.2KW 48V", "Hybrid Solar Inverter 6.5KW 48V",
  "Hybrid Solar Inverter 8KW 48V", "Hybrid Solar Inverter 8.5KW 48V", "Hybrid Solar Inverter 10KW 48V",
  "Hybrid Solar Inverter 10.5KW 48V", "Hybrid Solar Inverter 11KW 48V", "Hybrid Solar Inverter 11.5KW 48V",
  "Hybrid Solar Inverter 12KW 48V", "Hybrid Solar Inverter 12.5KW 48V"
];

const ACCESSORY_MODELS = [
  "Solar DC Cable", "MC4 Solar Connector", "MC4 Connector Pair", "Solar DC Connector",
  "Solar Cable Connector", "Solar Cable Accessories", "Solar Charge Controller", "Solar DC Fuse",
  "Solar DC Isolator", "Solar PV Combiner Box", "Solar Installation Accessories",
  "Solar Inverter Accessories", "WiFi Monitoring Dongle", "Solar Inverter Communication Cable"
];

const MODEL_MAP = {
  "Mobile Back Case": MOBILE_MODELS,
  "Hybrid Solar Inverter": INVERTER_MODELS,
  "Solar Accessories": ACCESSORY_MODELS
};

const FORBIDDEN_TERMS = ["solar panel", "solar panels", "topcon", "mono perc", "bifacial", "half-cut"];

const INITIAL_PRODUCTS = [
  {
    id: "prod-001",
    title: "Premium Protective Case for Galaxy S25 Ultra",
    category: "Mobile Back Case",
    model: "Galaxy S25 Ultra",
    description: "Shockproof heavy-duty protection case with precision cutouts.",
    price: 899,
    salePrice: 499,
    stock: 50,
    sku: "MBC-GS25U-01",
    hsn: "39269099",
    gstRate: 18,
    images: ["https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&q=80&w=600"],
    published: true,
    rating: null,
    reviewsCount: 0
  },
  {
    id: "prod-002",
    title: "Hybrid Solar Inverter 5KW 48V Pure Sine Wave",
    category: "Hybrid Solar Inverter",
    model: "Hybrid Solar Inverter 5KW 48V",
    description: "High efficiency smart hybrid inverter with integrated MPPT charge controller.",
    price: 45000,
    salePrice: 38500,
    stock: 12,
    sku: "HSI-5KW-48V",
    hsn: "85044080",
    gstRate: 12,
    images: ["https://images.unsplash.com/photo-1613665812672-6c3999e52119?auto=format&fit=crop&q=80&w=600"],
    published: true,
    rating: null,
    reviewsCount: 0
  }
];

export default function LuxmoHubApp() {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('luxmo_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedModelFilter, setSelectedModelFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamic Razorpay Script Loader
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Admin Session State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('luxmo_admin_session') === 'true';
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminAuthInput, setAdminAuthInput] = useState("");
  const [authError, setAuthError] = useState("");

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminAuthInput === "LUXMO#SECURE2026") {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('luxmo_admin_session', 'true');
      setShowAdminModal(false);
      setAdminAuthInput("");
      setAuthError("");
    } else {
      setAuthError("Incorrect authentication key.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('luxmo_admin_session');
    setActiveTab("home");
  };

  // Product Management & Multiple Images State
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '', category: CATEGORIES[0], model: MOBILE_MODELS[0], description: '',
    price: '', salePrice: '', stock: '', sku: '', hsn: '39269099', gstRate: '18',
    images: [], published: true
  });
  const [formError, setFormError] = useState('');

  // MULTI-IMAGE UPLOAD (MAX 5 IMAGES)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + formData.images.length > 5) {
      setFormError('You can upload a maximum of 5 images per product.');
      return;
    }

    const readFiles = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readFiles).then(newImageUrls => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls].slice(0, 5)
      }));
      setFormError('');
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  useEffect(() => {
    localStorage.setItem('luxmo_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    const available = MODEL_MAP[formData.category] || [];
    if (!available.includes(formData.model)) {
      setFormData(prev => ({ ...prev, model: available[0] || '' }));
    }
  }, [formData.category]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const combinedText = `${p.title} ${p.description} ${p.category} ${p.model}`.toLowerCase();
      if (FORBIDDEN_TERMS.some(term => combinedText.includes(term))) return false;

      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchesModel = selectedModelFilter === "All" || p.model === selectedModelFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.title.toLowerCase().includes(q) || 
        p.model.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q);

      return matchesCat && matchesModel && matchesSearch && (isAdminLoggedIn || p.published);
    });
  }, [products, selectedCategory, selectedModelFilter, searchQuery, isAdminLoggedIn]);

  const validateAndSaveProduct = (e) => {
    e.preventDefault();
    setFormError('');

    if (FORBIDDEN_TERMS.some(term => formData.title.toLowerCase().includes(term))) {
      setFormError('Product title contains prohibited terms.');
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      setFormError('Please upload at least 1 product image.');
      return;
    }

    const productPayload = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: formData.title.trim(),
      category: formData.category,
      model: formData.model,
      description: formData.description.trim(),
      price: Number(formData.price),
      salePrice: formData.salePrice ? Number(formData.salePrice) : null,
      stock: Number(formData.stock),
      sku: formData.sku.trim(),
      hsn: formData.hsn.trim(),
      gstRate: Number(formData.gstRate),
      images: formData.images,
      published: Boolean(formData.published),
      rating: editingProduct ? editingProduct.rating : null,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 0
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productPayload : p));
    } else {
      setProducts(prev => [productPayload, ...prev]);
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      title: '', category: CATEGORIES[0], model: MOBILE_MODELS[0], description: '',
      price: '', salePrice: '', stock: '', sku: '', hsn: '39269099', gstRate: '18',
      images: [], published: true
    });
    setFormError('');
  };

  const handleEditInit = (prod) => {
    setEditingProduct(prod);
    setFormData({ 
      ...prod, 
      salePrice: prod.salePrice || '',
      images: prod.images || (prod.image ? [prod.image] : []) 
    });
    setActiveTab('admin');
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Delete this product?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.qty, 0);

  const handleRazorpayPayment = () => {
    if (!window.Razorpay) {
      alert("Payment gateway component loading. Please try again in a few seconds.");
      return;
    }

    const options = {
      key: "rzp_test_YourMerchantKeyHere",
      amount: cartTotal * 100,
      currency: "INR",
      name: BUSINESS_INFO.tradeName,
      description: "Order Checkout Payment",
      handler: function (response) {
        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        setCart([]);
        setActiveTab("home");
      },
      prefill: {
        name: "Customer Name",
        email: BUSINESS_INFO.emails[0],
        contact: BUSINESS_INFO.phones[0]
      },
      theme: { color: "#2563eb" }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <span>GST Registered Proprietorship: <strong>{BUSINESS_INFO.legalName}</strong> ({BUSINESS_INFO.tradeName})</span>
          <div className="flex gap-4">
            <a href={`tel:${BUSINESS_INFO.phones[0]}`} className="hover:text-white flex items-center gap-1"><Phone className="w-3 h-3" /> {BUSINESS_INFO.phones[0]}</a>
            <a href={`mailto:${BUSINESS_INFO.emails[0]}`} className="hover:text-white flex items-center gap-1"><Mail className="w-3 h-3" /> {BUSINESS_INFO.emails[0]}</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("home")}>
            <img 
              src="/logo.jpeg" 
              alt="LUXMO HUB" 
              className="h-10 w-auto object-contain rounded"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden bg-slate-900 text-white font-black text-xl px-3 py-1 rounded tracking-wider border border-amber-500">
              LUX<span className="text-amber-400">M</span>O <span className="text-amber-400">HUB</span>
            </div>
          </div>

          <div className="flex-1 max-w-md relative hidden md:block">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-6 text-sm font-medium">
            <button onClick={() => setActiveTab("home")} className={activeTab === 'home' ? 'text-blue-600 font-semibold' : 'text-slate-600'}>Home</button>
            <button onClick={() => setActiveTab("catalog")} className={activeTab === 'catalog' ? 'text-blue-600 font-semibold' : 'text-slate-600'}>Products</button>
            <button onClick={() => setActiveTab("cart")} className="relative p-1.5 hover:text-blue-600 text-slate-700">
              <ShoppingBag className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((a, b) => a + b.qty, 0)}
                </span>
              )}
            </button>

            {isAdminLoggedIn ? (
              <button onClick={() => setActiveTab("admin")} className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> Dashboard
              </button>
            ) : (
              <button onClick={() => setShowAdminModal(true)} className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1">
                <Lock className="w-3 h-3" /> Portal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === "home" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-2xl p-8 shadow-lg">
              <h1 className="text-3xl font-extrabold mb-2">LUXMO HUB Official Store</h1>
              <p className="text-slate-300 text-sm mb-4">Mobile Cases, Hybrid Solar Inverters & Accessories</p>
              <button onClick={() => setActiveTab("catalog")} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg">View Catalog</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CATEGORIES.map(cat => (
                <div key={cat} onClick={() => { setSelectedCategory(cat); setActiveTab("catalog"); }} className="bg-white border p-6 rounded-xl shadow-sm cursor-pointer hover:border-blue-500">
                  <h3 className="font-bold text-slate-900">{cat}</h3>
                  <span className="text-blue-600 text-xs font-bold mt-2 inline-block flex items-center">Browse <ChevronRight className="w-3 h-3"/></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-xl font-bold">Catalog</h1>
              <div className="flex gap-2">
                <button onClick={() => setSelectedCategory("All")} className={`px-3 py-1 text-xs rounded-lg ${selectedCategory === "All" ? "bg-blue-600 text-white" : "bg-white border"}`}>All</button>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 text-xs rounded-lg ${selectedCategory === cat ? "bg-blue-600 text-white" : "bg-white border"}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} onSelect={(p) => { setSelectedProduct(p); setActiveImageIndex(0); setActiveTab("product"); }} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}

        {/* SINGLE PRODUCT DETAIL PAGE WITH MULTI-IMAGE GALLERY */}
        {activeTab === "product" && selectedProduct && (
          <div className="bg-white rounded-2xl border p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <img 
                src={(selectedProduct.images && selectedProduct.images[activeImageIndex]) || selectedProduct.image} 
                alt={selectedProduct.title} 
                className="w-full aspect-square object-cover rounded-xl border" 
              />
              {/* Thumbnail Gallery */}
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedProduct.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt="" 
                      onClick={() => setActiveImageIndex(idx)} 
                      className={`w-16 h-16 object-cover rounded-lg border-2 cursor-pointer ${activeImageIndex === idx ? 'border-blue-600' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{selectedProduct.title}</h1>
              <p className="text-xs text-slate-500">Model: {selectedProduct.model}</p>
              <div className="text-2xl font-extrabold text-slate-900">₹{selectedProduct.salePrice || selectedProduct.price}</div>
              <p className="text-sm text-slate-600">{selectedProduct.description}</p>
              <button onClick={() => addToCart(selectedProduct)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-sm">Add to Cart</button>
            </div>
          </div>
        )}

        {activeTab === "cart" && (
          <div className="bg-white rounded-2xl border p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="text-xl font-bold border-b pb-3">Shopping Cart</h1>
            {cart.length === 0 ? <p className="text-center text-slate-500 py-8">Your cart is empty.</p> : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500">Qty: {item.qty} × ₹{item.salePrice || item.price}</p>
                    </div>
                    <span className="font-bold">₹{(item.salePrice || item.price) * item.qty}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-lg font-bold pt-2">
                  <span>Total Payable:</span>
                  <span className="text-blue-600">₹{cartTotal}</span>
                </div>
                <button onClick={handleRazorpayPayment} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg text-sm">
                  Pay Now via Razorpay Standard Checkout
                </button>
              </div>
            )}
          </div>
        )}

        {/* ADMIN FORM WITH MULTI-IMAGE UPLOAD (MAX 5 IMAGES) */}
        {activeTab === "admin" && isAdminLoggedIn && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-xl font-bold">Admin Management Console</h1>
              <button onClick={handleAdminLogout} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-bold">Log Out Admin</button>
            </div>

            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-4">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              {formError && <p className="text-xs text-red-600 mb-4 bg-red-50 p-2 rounded">{formError}</p>}
              
              <form onSubmit={validateAndSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold mb-1 text-slate-700">Product Title</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="Enter product title..."
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Model</label>
                  <select 
                    value={formData.model} 
                    onChange={e => setFormData({ ...formData, model: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {MODEL_MAP[formData.category]?.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Sale Price (Optional ₹)</label>
                  <input 
                    type="number" 
                    value={formData.salePrice} 
                    onChange={e => setFormData({ ...formData, salePrice: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">Stock</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.stock} 
                    onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">SKU</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.sku} 
                    onChange={e => setFormData({ ...formData, sku: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>

                {/* 5 IMAGES UPLOAD COMPONENT */}
                <div className="md:col-span-2 border-2 border-dashed border-slate-300 p-4 rounded-lg bg-slate-50 text-center">
                  <label className="block font-bold mb-2 text-slate-700">Upload Product Images (Up to 5)</label>
                  
                  {formData.images.length < 5 && (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        id="multi-file-input" 
                      />
                      <label htmlFor="multi-file-input" className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-bold hover:bg-blue-500">
                        <Upload className="w-4 h-4" /> Select Images ({formData.images.length}/5)
                      </label>
                    </>
                  )}

                  {/* Uploaded Images Preview Grid */}
                  {formData.images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3 justify-center">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden bg-white">
                          <img src={img} alt={`Preview ${index}`} className="w-20 h-20 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs shadow hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold mb-1 text-slate-700">Description</label>
                  <textarea 
                    rows="3" 
                    required 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-md text-xs">Save Product</button>
                  {editingProduct && <button type="button" onClick={resetForm} className="bg-slate-200 text-slate-800 px-4 py-2.5 rounded-md text-xs font-bold">Cancel</button>}
                </div>
              </form>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b font-bold">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="p-3 font-semibold">{p.title}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">₹{p.salePrice || p.price}</td>
                      <td className="p-3">{p.stock}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => handleEditInit(p)} className="hover:text-blue-600"><Edit3 className="w-4 h-4 inline" /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="hover:text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ADMIN AUTH MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600"/> Secure Admin Verification</h3>
              <button onClick={() => setShowAdminModal(false)}><X className="w-4 h-4"/></button>
            </div>
            {authError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{authError}</p>}
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input 
                type="password" 
                required 
                value={adminAuthInput} 
                onChange={e => setAdminAuthInput(e.target.value)} 
                placeholder="Enter Key..." 
                className="w-full text-xs p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              />
              <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg">Authenticate</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onSelect, onAddToCart }) {
  const displayImage = (product.images && product.images[0]) || product.image;

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition flex flex-col justify-between">
      <div className="cursor-pointer" onClick={() => onSelect(product)}>
        <img src={displayImage} alt={product.title} className="w-full aspect-square object-cover" />
        <div className="p-4 space-y-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase">{product.category}</span>
          <h3 className="font-semibold text-sm line-clamp-1">{product.title}</h3>
          <p className="text-xs text-slate-500">Model: {product.model}</p>
          <div className="font-extrabold text-base pt-1">₹{product.salePrice || product.price}</div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <button 
          onClick={() => onAddToCart(product)} 
          className="w-full bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold py-2 rounded-lg transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
