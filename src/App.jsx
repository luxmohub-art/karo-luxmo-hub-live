import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Lock, ChevronRight, Filter, Trash2, Edit3, 
  AlertCircle, Star, ArrowLeft, Upload, CheckCircle2, ShieldCheck, X, Phone, Mail,
  FileText, Info, HelpCircle, RefreshCw, Truck, Scale
} from 'lucide-react';

const BUSINESS_INFO = {
  tradeName: "LUXMO HUB",
  legalName: "Sarita Devi",
  type: "Proprietorship",
  address: {
    line1: "Building No. 147, Unnamed Road",
    line2: "Near Mathura Chhapar Branch Post Office",
    area: "Vill-Kotwa, Mathura Chhapar",
    district: "District Deoria",
    state: "Uttar Pradesh – 274405, India"
  },
  emails: ["luxmohub@gmail.com"],
  phones: ["+91 7565012418", "+91 8299260182"],
  hours: "Monday–Saturday, 10:00 AM–6:00 PM (Sunday and public holidays may be closed.)"
};

const CATEGORIES = ["Hybrid Solar Inverter", "Mobile Back Case", "Solar Accessories"];

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

// Tax rules supplied for LUXMO HUB product listings.
// HSN/GST are derived from the selected category and, for mobile cases, material.
const MATERIAL_LABELS = {
  "": "Select material",
  "Genuine Leather": "Genuine Leather",
  "PU Leather": "PU Leather",
  "Plastic / Silicone / TPU / Rubber": "Plastic / Silicone / TPU / Rubber"
};

const MATERIAL_OPTIONS = {
  "Mobile Back Case": [
    "",
    "Genuine Leather",
    "PU Leather",
    "Plastic / Silicone / TPU / Rubber"
  ],
  "Hybrid Solar Inverter": ["Not Applicable"],
  "Solar Accessories": ["Not Specified"]
};

const TAX_RULES = {
  "Hybrid Solar Inverter": { hsn: "85044010", gstRate: 18, label: "Hybrid Solar Inverter / Electric Inverter" },
  "Mobile Back Case": {
    "Genuine Leather": { hsn: "42029900", gstRate: 18, label: "Mobile Phone Back Case / Cover – Genuine Leather" },
    "PU Leather": { hsn: "42029900", gstRate: 18, label: "Mobile Phone Back Case / Cover – PU Leather" },
    "Plastic / Silicone / TPU / Rubber": { hsn: "39269099", gstRate: 18, label: "Mobile Phone Back Case / Cover – Plastic / Silicone / TPU / Rubber" }
  },
  "Solar Accessories": null
};

const getTaxInfo = (category, material) => {
  if (category === "Hybrid Solar Inverter") return TAX_RULES[category];
  if (category === "Mobile Back Case") return TAX_RULES[category]?.[material] || null;
  return null;
};

const FORBIDDEN_TERMS = ["solar panel", "solar panels", "topcon", "mono perc", "bifacial", "half-cut"];

const INITIAL_PRODUCTS = [
  {
    id: "prod-001",
    title: "LUXMO HUB 5.5KW 24V Hybrid Solar Inverter",
    category: "Hybrid Solar Inverter",
    model: "Hybrid Solar Inverter 5.5KW 24V",
    material: "Not Applicable",
    description: "Pure Sine Wave | MPPT Solar Charge Controller | 24V Battery Support | Home & Solar Power Backup System",
    price: 65000,
    salePrice: 54999,
    stock: 10,
    sku: "LUX5.5H24V",
    hsn: "85044010",
    gstRate: 18,
    images: ["https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&q=80&w=600"],
    published: true,
    rating: null,
    reviewsCount: 0
  }
];

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target.result);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function LuxmoHubApp() {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('luxmo_products');
      const loaded = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
      return loaded.map(product => {
        const materialOptions = MATERIAL_OPTIONS[product.category] || [];
        const material = materialOptions.includes(product.material) ? product.material : (product.category === "Hybrid Solar Inverter" ? "Not Applicable" : "");
        const taxInfo = getTaxInfo(product.category, material);
        const isMobileWithoutMaterial = product.category === "Mobile Back Case" && !material;
        return {
          ...product,
          material,
          hsn: isMobileWithoutMaterial ? "" : (taxInfo?.hsn || product.hsn || ""),
          gstRate: isMobileWithoutMaterial ? null : (taxInfo?.gstRate ?? product.gstRate ?? null)
        };
      });
    } catch (err) {
      console.error("Storage load error:", err);
      return INITIAL_PRODUCTS;
    }
  });

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedModelFilter, setSelectedModelFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

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

  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '', category: CATEGORIES[0], model: MOBILE_MODELS[0], material: "", description: '',
    price: '', salePrice: '', stock: '', sku: '', hsn: '42029900', gstRate: '18',
    images: [], published: true
  });
  const [formError, setFormError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (files.length + formData.images.length > 5) {
      setFormError('Maximum 5 images allowed per product.');
      return;
    }

    setIsCompressing(true);
    setFormError('');

    try {
      const compressed = await Promise.all(files.map(file => compressImage(file)));
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...compressed].slice(0, 5)
      }));
    } catch (err) {
      console.error("Upload Error:", err);
      setFormError('Failed to process image. Try a smaller image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  useEffect(() => {
    try {
      localStorage.setItem('luxmo_products', JSON.stringify(products));
    } catch (e) {
      console.error("Storage Limit Reached!", e);
      alert("Browser storage limit full!");
    }
  }, [products]);

  useEffect(() => {
    const availableModels = MODEL_MAP[formData.category] || [];
    const availableMaterials = MATERIAL_OPTIONS[formData.category] || [];
    const nextModel = availableModels.includes(formData.model) ? formData.model : (availableModels[0] || '');
    const nextMaterial = availableMaterials.includes(formData.material) ? formData.material : (availableMaterials[0] || '');
    const tax = getTaxInfo(formData.category, nextMaterial);

    setFormData(prev => ({
      ...prev,
      model: nextModel,
      material: nextMaterial,
      hsn: tax?.hsn || '',
      gstRate: tax?.gstRate ?? ''
    }));
  }, [formData.category]);

  useEffect(() => {
    const tax = getTaxInfo(formData.category, formData.material);
    if (tax) {
      setFormData(prev => ({ ...prev, hsn: tax.hsn, gstRate: tax.gstRate }));
    } else if (formData.category === "Solar Accessories") {
      setFormData(prev => ({ ...prev, hsn: '', gstRate: '' }));
    }
  }, [formData.material]);

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

    const taxInfo = getTaxInfo(formData.category, formData.material);
    if (formData.category === "Mobile Back Case" && !formData.material) {
      setFormError('Please select the correct mobile case material so the correct HSN code can be applied.');
      return;
    }
    if ((formData.category === "Mobile Back Case" || formData.category === "Hybrid Solar Inverter") && !taxInfo) {
      setFormError('Please select a valid product material/category so the correct HSN and GST can be applied.');
      return;
    }

    const productPayload = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: formData.title.trim(),
      category: formData.category,
      model: formData.model,
      material: formData.material,
      description: formData.description.trim(),
      price: Number(formData.price),
      salePrice: formData.salePrice ? Number(formData.salePrice) : null,
      stock: Number(formData.stock),
      sku: formData.sku.trim(),
      hsn: taxInfo?.hsn || '',
      gstRate: taxInfo?.gstRate ?? null,
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
      title: '', category: CATEGORIES[0], model: MOBILE_MODELS[0], material: "", description: '',
      price: '', salePrice: '', stock: '', sku: '', hsn: '42029900', gstRate: '18',
      images: [], published: true
    });
    setFormError('');
  };

  const handleEditInit = (prod) => {
    setEditingProduct(prod);
    const materialOptions = MATERIAL_OPTIONS[prod.category] || [];
    const material = materialOptions.includes(prod.material) ? prod.material : (materialOptions[0] || '');
    const taxInfo = getTaxInfo(prod.category, material);
    setFormData({ 
      ...prod,
      material,
      hsn: taxInfo?.hsn || '',
      gstRate: taxInfo?.gstRate ?? '',
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

  const currentFormTaxInfo = getTaxInfo(formData.category, formData.material);

  const handleRazorpayPayment = async () => {
  if (!window.Razorpay) {
    alert("Razorpay loading. Please try again.");
    return;
  }

  if (!cart || cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  try {
    const orderResponse = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: cartTotal
      })
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok || !orderData.success) {
      throw new Error(
        orderData.error || "Unable to create order"
      );
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: BUSINESS_INFO.tradeName,
      description: "Luxmo Hub Order",
      order_id: orderData.orderId,

      handler: async function (response) {
        try {
          const verifyResponse = await fetch(
            "/api/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(response)
            }
          );

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData.success) {
            alert("Payment verification failed.");
            return;
          }

          alert(
            `Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`
          );

          setCart([]);
          setActiveTab("home");

        } catch (error) {
          console.error("Verification error:", error);
          alert("Payment verification failed.");
        }
      },

      prefill: {
        name: "Customer",
        email: BUSINESS_INFO.emails[0],
        contact: BUSINESS_INFO.phones[0]
      },

      theme: {
        color: "#2563eb"
      }
    };

    const paymentObject = new window.Razorpay(options);

    paymentObject.on(
      "payment.failed",
      function (response) {
        console.error(
          "Payment failed:",
          response.error
        );

        alert(
          response.error?.description ||
          "Payment failed. Please try again."
        );
      }
    );

    paymentObject.open();

  } catch (error) {
    console.error("Razorpay Error:", error);

    alert(
      error.message ||
      "Unable to start payment."
    );
  }
};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Banner */}
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
            <div className="bg-slate-900 text-white font-black text-xl px-3 py-1 rounded tracking-wider border border-amber-500">
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
            <button onClick={() => setActiveTab("policies")} className={activeTab === 'policies' ? 'text-blue-600 font-semibold' : 'text-slate-600'}>Policies</button>
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
              <button onClick={() => setShowAdminModal(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* HOME VIEW */}
        {activeTab === "home" && (
  <div className="space-y-8">

    {/* Hero Section */}
    {/* Premium Hero Section */}
<div className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 text-white rounded-2xl p-6 md:p-10 shadow-xl">
  <div className="max-w-4xl">
    <p className="text-sm md:text-base font-semibold text-blue-300 uppercase tracking-wider">
      LUXMO HUB
    </p>

    <h1 className="text-3xl md:text-5xl font-bold mt-3 leading-tight">
      Smart Power & Premium Mobile Protection
    </h1>

    <p className="text-lg md:text-xl text-slate-200 mt-4">
      Hybrid Solar Inverters, Solar Accessories & Premium Mobile Back Cases
    </p>

    <p className="text-slate-300 mt-3 text-base md:text-lg">
      Quality Products, Trusted by You.
    </p>

    <div className="flex flex-wrap gap-4 mt-7">
      <button
        onClick={() => {
          setSelectedCategory("Hybrid Solar Inverter");
          setActiveTab("catalog");
        }}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
      >
        Shop Solar Inverters →
      </button>

      <button
        onClick={() => {
          setSelectedCategory("Mobile Back Case");
          setActiveTab("catalog");
        }}
        className="px-6 py-3 bg-white text-blue-900 hover:bg-slate-100 rounded-lg font-semibold shadow-md"
      >
        Shop Mobile Cases →
      </button>
    </div>

    <div className="flex flex-wrap gap-3 mt-7 text-sm text-slate-200">
      <span className="px-3 py-1 bg-white/10 rounded-full">
        ✓ GST Invoice
      </span>
      <span className="px-3 py-1 bg-white/10 rounded-full">
        ✓ Secure Payment
      </span>
      <span className="px-3 py-1 bg-white/10 rounded-full">
        ✓ Customer Support
      </span>
      <span className="px-3 py-1 bg-white/10 rounded-full">
        ✓ Reliable Shipping
      </span>
    </div>
  </div>
</div>
    

    {/* Mobile Back Cases */}
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">
        📱 Mobile Back Cases
      </h2>

      <p className="text-slate-600 mt-2">
        Premium protection for your smartphone.
      </p>

      <p className="text-slate-600 mt-3">
        iPhone Cases • Samsung Cases • MagSafe Cases • Leather Cases •
        Silicone / TPU Cases
      </p>

      <button
        onClick={() => {
          setSelectedCategory("Mobile Back Case");
          setActiveTab("catalog");
        }}
        className="mt-5 text-blue-600 font-semibold"
      >
        View Mobile Cases →
      </button>
    </div>

    {/* Hybrid Solar Inverters */}
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">
        ☀️ Hybrid Solar Inverters
      </h2>

      <p className="text-slate-600 mt-2">
        Reliable power solutions for your home.
      </p>

      <p className="text-slate-600 mt-3">
        24V Hybrid Inverters • 48V Hybrid Inverters • WiFi Monitoring •
        Solar Accessories
      </p>

      <button
        onClick={() => {
          setSelectedCategory("Hybrid Solar Inverter");
          setActiveTab("catalog");
        }}
        className="mt-5 text-blue-600 font-semibold"
      >
        View Solar Inverters →
      </button>
    </div>

    {/* Solar Accessories */}
{/* Premium Product Categories */}
<div className="space-y-5">

  <div className="text-center">
    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
      Explore Our Products
    </p>

    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
      Premium Products for Every Need
    </h2>

    <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
      Discover quality mobile protection and reliable solar power solutions
      from LUXMO HUB.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

    {/* Mobile Cases */}
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4">
        📱
      </div>

      <h3 className="text-xl font-bold text-slate-900">
        Mobile Back Cases
      </h3>

      <p className="text-slate-600 mt-2 leading-relaxed">
        Premium protection for your smartphone with stylish and durable
        designs.
      </p>

      <p className="text-sm text-slate-500 mt-3">
        iPhone • Samsung • MagSafe • Leather • Silicone • TPU
      </p>

      <button
        onClick={() => {
          setSelectedCategory("Mobile Back Case");
          setActiveTab("catalog");
        }}
        className="mt-5 inline-flex items-center font-semibold text-blue-600 hover:text-blue-700"
      >
        Explore Mobile Cases →
      </button>

    </div>

    {/* Hybrid Solar Inverters */}
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl mb-4">
        ☀️
      </div>

      <h3 className="text-xl font-bold text-slate-900">
        Hybrid Solar Inverters
      </h3>

      <p className="text-slate-600 mt-2 leading-relaxed">
        Reliable hybrid power solutions designed for efficient home and
        solar energy systems.
      </p>

      <p className="text-sm text-slate-500 mt-3">
        24V • 48V • MPPT • WiFi Monitoring • Hybrid Power
      </p>

      <button
        onClick={() => {
          setSelectedCategory("Hybrid Solar Inverter");
          setActiveTab("catalog");
        }}
        className="mt-5 inline-flex items-center font-semibold text-blue-600 hover:text-blue-700"
      >
        Explore Solar Inverters →
      </button>

    </div>

    {/* Solar Accessories */}
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl mb-4">
        🔌
      </div>

      <h3 className="text-xl font-bold text-slate-900">
        Solar Accessories
      </h3>

      <p className="text-slate-600 mt-2 leading-relaxed">
        Essential accessories for reliable, safe and efficient solar power
        installations.
      </p>

      <p className="text-sm text-slate-500 mt-3">
        DC Cables • MC4 Connectors • DC Fuse • PV Combiner Box • WiFi Dongle
      </p>

      <button
        onClick={() => {
          setSelectedCategory("Solar Accessories");
          setActiveTab("catalog");
        }}
        className="mt-5 inline-flex items-center font-semibold text-blue-600 hover:text-blue-700"
      >
        Explore Solar Accessories →
      </button>

    </</div>
{/* Why Choose LUXMO HUB */}
<div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
  <h2 className="text-2xl font-bold text-slate-900">
    ⭐ Why Choose LUXMO HUB
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-slate-700">
    <div>✅ Quality Products</div>
    <div>✅ GST Invoice</div>
    <div>✅ Secure Payment</div>
    <div>✅ Customer Support</div>
    <div>✅ Reliable Shipping</div>
  </div>
</div>

{/* Contact Section */}
<div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
  <h2 className="text-2xl font-bold text-slate-900">
    📞 Need Help?
  </h2>

  <p className="text-slate-600 mt-2">
    WhatsApp / Call: +91 7565012418
  </p>

  <p className="text-slate-600 mt-1">
    Email: luxmohub@gmail.com
  </p>
</div>        {/* CATALOG VIEW */}
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

        {/* CUSTOMER POLICIES TAB VIEW */}
        {activeTab === "policies" && (
          <div className="bg-white border rounded-2xl p-6 md:p-8 space-y-8 max-w-4xl mx-auto shadow-sm text-sm leading-relaxed text-slate-700">
            <div className="border-b pb-4">
              <h1 className="text-2xl font-bold text-slate-900">CUSTOMER POLICIES — LUXMO HUB</h1>
              <p className="text-xs text-slate-500 mt-1">Official Legal Guidelines, Privacy, Shipping & Refund Terms</p>
            </div>

            {/* 1. About Us */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1">
                <Info className="w-4 h-4 text-blue-600" /> 1. About Us
              </h2>
              <p>LUXMO HUB is a customer-focused business dealing in Hybrid Solar Inverters and Solar Accessories.</p>
              <p>Our aim is to provide quality products, transparent pricing, reliable customer support, and dependable after-sales assistance.</p>
              <p>LUXMO HUB is operated as a proprietorship business. The legal name of the proprietor is <strong>Sarita Devi</strong>, and the trade name is <strong>LUXMO HUB</strong>.</p>
              <p>We continuously work to improve our products and services to provide customers with a smooth and trustworthy shopping experience.</p>
            </section>

            {/* 2. Contact Us */}
            <section className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1 border-slate-200">
                <Phone className="w-4 h-4 text-blue-600" /> 2. Contact Us
              </h2>
              <p>If you have any questions regarding products, orders, payments, shipping, warranty, cancellation, returns, or refunds, please contact us.</p>
              <div className="text-xs space-y-1 font-medium text-slate-800 pt-2">
                <p><strong>Business Name:</strong> LUXMO HUB</p>
                <p><strong>Proprietor:</strong> Sarita Devi</p>
                <p><strong>Email:</strong> <a href={`mailto:${BUSINESS_INFO.emails[0]}`} className="text-blue-600 hover:underline">{BUSINESS_INFO.emails[0]}</a></p>
                <p><strong>Helpline:</strong> {BUSINESS_INFO.phones.join(', ')}</p>
                <p><strong>Operating Address:</strong> {BUSINESS_INFO.address.line1}, {BUSINESS_INFO.address.line2}, {BUSINESS_INFO.address.area}, {BUSINESS_INFO.address.district}, {BUSINESS_INFO.address.state}</p>
                <p><strong>Business Hours:</strong> {BUSINESS_INFO.hours}</p>
              </div>
            </section>

            {/* 3. Privacy Policy */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> 3. Privacy Policy
              </h2>
              <p>At LUXMO HUB, we respect your privacy and are committed to protecting the personal information you provide to us.</p>
              
              <h3 className="font-semibold text-slate-800 pt-2">Information We May Collect</h3>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Customer name</li>
                <li>Mobile number</li>
                <li>Email address</li>
                <li>Billing and shipping address</li>
                <li>Order details</li>
                <li>Payment-related transaction information</li>
                <li>Information provided when contacting customer support</li>
              </ul>

              <h3 className="font-semibold text-slate-800 pt-2">How We Use Your Information</h3>
              <p className="text-xs">Your information may be used for processing and delivering orders, providing customer support, processing payments and refunds, communicating order updates, providing warranty or after-sales support, improving our products and services, and preventing fraudulent transactions.</p>

              <h3 className="font-semibold text-slate-800 pt-2">Payment Information</h3>
              <p className="text-xs">Payments may be processed through third-party payment gateway providers. LUXMO HUB does not intentionally store customers' complete debit/credit card, UPI, or banking credentials.</p>

              <h3 className="font-semibold text-slate-800 pt-2">Information Sharing & Data Security</h3>
              <p className="text-xs">We may share necessary information with trusted service providers such as shipping and logistics partners, payment gateway providers, and technology service providers solely to fulfill your order or comply with applicable laws.</p>
            </section>

            {/* 4. Terms & Conditions */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1">
                <Scale className="w-4 h-4 text-blue-600" /> 4. Terms & Conditions
              </h2>
              <p>By accessing or using the LUXMO HUB website, you agree to comply with these Terms & Conditions.</p>
              
              <p><strong>Products:</strong> We make reasonable efforts to display accurate product descriptions, specifications, images, prices, and availability. However, minor variations in product appearance, packaging, or specifications may occur.</p>
              <p><strong>Orders & Pricing:</strong> An order is considered accepted only after successful order confirmation and payment verification. LUXMO HUB reserves the right to cancel an order due to product unavailability, pricing errors, or suspected fraud. Product prices displayed on the website may change without prior notice.</p>
              <p><strong>Customer Responsibility:</strong> Customers are responsible for providing accurate name, mobile number, email address, and shipping address. LUXMO HUB will not be responsible for delays caused by incorrect information.</p>
            </section>

            {/* 5. Shipping Policy */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1">
                <Truck className="w-4 h-4 text-blue-600" /> 5. Shipping Policy
              </h2>
              <p><strong>Order Processing:</strong> Orders are generally processed within 1–3 business days, subject to product availability and payment confirmation.</p>
              <p><strong>Delivery Inspection:</strong> For products such as solar inverters and electronic equipment, customers are advised to inspect the package carefully at the time of delivery. If the package appears visibly damaged, customers should take photographs/videos of the package and contact LUXMO HUB as soon as possible.</p>
            </section>

            {/* 6. Cancellation & Refund Policy */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1">
                <RefreshCw className="w-4 h-4 text-blue-600" /> 6. Cancellation & Refund Policy
              </h2>
              <p><strong>Order Cancellation:</strong> Customers may request cancellation before the order has been shipped. Once shipped, cancellation may not be possible.</p>
              <p><strong>Refunds:</strong> If a refund is approved, the amount will generally be processed to the original payment method used for the transaction within standard bank timelines.</p>
              <p><strong>Damaged or Defective Product:</strong> If a product is received damaged or defective, contact LUXMO HUB promptly with your order number and photos/videos of the issue for verification and resolution.</p>
            </section>
          </div>
        )}

        {/* PRODUCT DETAILS VIEW */}
        {activeTab === "product" && selectedProduct && (
          <div className="bg-white rounded-2xl border p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <img 
                src={(selectedProduct.images && selectedProduct.images[activeImageIndex]) || selectedProduct.image} 
                alt={selectedProduct.title} 
                className="w-full aspect-square object-cover rounded-xl border" 
              />
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
              {selectedProduct.material && selectedProduct.material !== "Not Applicable" && (
                <p className="text-xs text-slate-500">Material / Type: {selectedProduct.material}</p>
              )}
              <div className="text-2xl font-extrabold text-slate-900">₹{selectedProduct.salePrice || selectedProduct.price}</div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Tax Information</h3>
                  {selectedProduct.hsn && selectedProduct.gstRate != null && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                      Tax Details
                    </span>
                  )}
                </div>

                {selectedProduct.hsn && selectedProduct.gstRate != null ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <span className="text-slate-500 block">HSN Code</span>
                      <strong className="text-slate-900 text-sm">{selectedProduct.hsn}</strong>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <span className="text-slate-500 block">GST Rate</span>
                      <strong className="text-slate-900 text-sm">{selectedProduct.gstRate}%</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3">
                    <strong className="text-slate-800">Tax classification:</strong> HSN/GST details are not configured for this product category.
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line">{selectedProduct.description}</p>
              <button onClick={() => addToCart(selectedProduct)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-sm">Add to Cart</button>
            </div>
          </div>
        )}

        {/* CART VIEW */}
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
                  Pay Now via Razorpay
                </button>
              </div>
            )}
          </div>
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {activeTab === "admin" && isAdminLoggedIn && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h1 className="text-xl font-bold">Admin Management Console</h1>
              <button onClick={handleAdminLogout} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-bold">Log Out Admin</button>
            </div>

            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-bold mb-4">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              {formError && <p className="text-xs text-red-600 mb-4 bg-red-50 p-2 rounded font-semibold">{formError}</p>}
              
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
                  <label className="block font-bold mb-1 text-slate-700">Product Material / Type</label>
                  <select
                    value={formData.material}
                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {(MATERIAL_OPTIONS[formData.category] || []).map(material => (
                      <option key={material || 'select-material'} value={material}>
                        {MATERIAL_LABELS[material] || material}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900">Tax Information</h3>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          HSN and GST are assigned automatically from the selected category/material.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-white border border-blue-200 text-blue-700">
                        Auto Assigned
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <span className="block text-[10px] uppercase tracking-wide font-bold text-slate-500">Category</span>
                        <strong className="block mt-1 text-sm text-slate-900">{formData.category}</strong>
                      </div>

                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <span className="block text-[10px] uppercase tracking-wide font-bold text-slate-500">HSN Code</span>
                        <strong className="block mt-1 text-sm text-slate-900">
                          {currentFormTaxInfo?.hsn || "Select applicable material"}
                        </strong>
                      </div>

                      <div className="bg-white rounded-lg border border-blue-100 p-3">
                        <span className="block text-[10px] uppercase tracking-wide font-bold text-slate-500">GST Rate</span>
                        <strong className="block mt-1 text-sm text-slate-900">
                          {currentFormTaxInfo ? `${currentFormTaxInfo.gstRate}%` : "Select applicable material"}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px]">
                      {currentFormTaxInfo ? (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-800">
                          <strong>Tax classification:</strong> {currentFormTaxInfo.label}
                        </div>
                      ) : formData.category === "Mobile Back Case" ? (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
                          Select Genuine Leather, PU Leather, or Plastic / Silicone / TPU / Rubber to display the correct HSN and GST.
                        </div>
                      ) : (
                        <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-slate-600">
                          HSN/GST classification has not been supplied for this category. Do not enter or invent a tax code.
                        </div>
                      )}
                    </div>
                  </div>
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
                        disabled={isCompressing}
                      />
                      <label 
                        htmlFor="multi-file-input" 
                        className={`cursor-pointer inline-flex items-center gap-2 text-white px-4 py-2 rounded-md font-bold transition ${isCompressing ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-500'}`}
                      >
                        <Upload className="w-4 h-4" /> 
                        {isCompressing ? "Optimizing Images..." : `Select Images (${formData.images.length}/5)`}
                      </label>
                    </>
                  )}

                  {formData.images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3 justify-center">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden bg-white shadow-sm">
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
                    <th className="p-3">HSN</th>
                    <th className="p-3">GST</th>
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
                      <td className="p-3">{p.hsn || '—'}</td>
                      <td className="p-3">{p.gstRate != null ? `${p.gstRate}%` : '—'}</td>
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

      {/* Footer with Policies Link */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {BUSINESS_INFO.tradeName} ({BUSINESS_INFO.legalName}). All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab("policies")} className="hover:text-white underline">Terms & Customer Policies</button>
            <button onClick={() => setActiveTab("policies")} className="hover:text-white underline">Privacy Policy</button>
            <button onClick={() => setActiveTab("policies")} className="hover:text-white underline">Refund Policy</button>
          </div>
        </div>
      </footer>

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
          {product.hsn && product.gstRate != null && (
            <div className="text-[10px] text-slate-500 pt-1">HSN: {product.hsn} · GST: {product.gstRate}%</div>
          )}
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
