import React, { useState, useEffect } from "react";
import { 
  Trash2, Plus, LayoutDashboard, Package, Edit3,
  Search, ShoppingBag, TrendingUp, CheckCircle, Clock, Truck,
  ShoppingCart, X, Lock, Download, Eye, MapPin, Phone, User
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc 
} from "firebase/firestore";

/* ===== SETTINGS ===== */
const WHATSAPP_NUMBER = "919876543210"; 
const ADMIN_PIN = "1234"; 

export const CATEGORIES = [
  "Mobile Back Case",
  "Hybrid Solar Inverter",
  "Solar Panel",
  "Accessories",
];

export const COLOR_OPTIONS = [
  "Titanium", "Matte Black", "White", "Light Gray", "Golden", "Clear/Transparent"
];

// AAPKI SAARI COMPLETE DEVICES AND PRODUCTS LIST
export const DEVICES = [
  // --- Samsung Galaxy Z Fold Series ---
  "Galaxy Z Fold 7",
  "Galaxy Z Fold 6",
  "Galaxy Z Fold 5",
  "Galaxy Z Fold 4",
  "Galaxy Z Fold 3",
  "Galaxy Z Fold 2",
  "Galaxy Fold",

  // --- iPhone Series ---
  "iPhone 17 Pro Max",
  "iPhone 17 Pro",
  "iPhone 17 Plus",
  "iPhone 17",
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16 Plus",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15 Plus",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 14 Plus",
  "iPhone 14",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13 Mini",
  "iPhone 13",
  "iPhone 12 Pro Max",
  "iPhone 12 Pro",
  "iPhone 12 Mini",
  "iPhone 12",
  "iPhone 11 Pro Max",
  "iPhone 11 Pro",
  "iPhone 11",

  // --- Samsung Galaxy S Series ---
  "Galaxy S26 Ultra",
  "Galaxy S26 Plus",
  "Galaxy S26 FE",
  "Galaxy S26",
  "Galaxy S25 Ultra",
  "Galaxy S25 Plus",
  "Galaxy S25 FE",
  "Galaxy S25",
  "Galaxy S24 Ultra",
  "Galaxy S24 Plus",
  "Galaxy S24 FE",
  "Galaxy S24",
  "Galaxy S23 Ultra",
  "Galaxy S23 Plus",
  "Galaxy S23 FE",
  "Galaxy S23",
  "Galaxy S22 Ultra",
  "Galaxy S22 Plus",
  "Galaxy S22 FE",
  "Galaxy S22",

  // --- Hybrid Solar Inverters ---
  "Hybrid Solar Inverter 3KW 24V",
  "Hybrid Solar Inverter 3.5KW 24V",
  "Hybrid Solar Inverter 5KW 24V",
  "Hybrid Solar Inverter 5KW 48V",
  "Hybrid Solar Inverter 5.5KW 24V",
  "Hybrid Solar Inverter 5.5KW 48V",
  "Hybrid Solar Inverter 6KW 48V",
  "Hybrid Solar Inverter 6.2KW 48V",
  "Hybrid Solar Inverter 6.5KW 48V",
  "Hybrid Solar Inverter 8KW 48V",
  "Hybrid Solar Inverter 8.5KW 48V",
  "Hybrid Solar Inverter 10KW 48V",
  "Hybrid Solar Inverter 10.5KW 48V",
  "Hybrid Solar Inverter 11KW 48V",
  "Hybrid Solar Inverter 11.5KW 48V",
  "Hybrid Solar Inverter 12KW 48V",
  "Hybrid Solar Inverter 12.5KW 48V",

  // --- Solar Panels ---
  "Mono PERC Solar Panel 330W",
  "Mono PERC Solar Panel 440W",
  "Half-Cut Mono PERC 540W",
  "Bifacial Solar Panel 550W",
  "TOPCon Solar Panel 580,590W",
  "TOPCon Solar Panel 600w,615w,630w,700w,715W",

  // --- Accessories ---
  "MagSafe Wireless Charger",
  "MagSafe Ring Sticker",
  "UV Tempered Glass Guard"
];

/* ===== Firebase Setup ===== */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDummyKeyForVercelBuildToPass",
  authDomain: "luxmo-hub.firebaseapp.com",
  projectId: "luxmo-hub",
  storageBucket: "luxmo-hub.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState("store");
  const [adminSubTab, setAdminSubTab] = useState("analytics");
  
  // Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Firestore Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  // UI / Cart / Modals
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeGalleryImages, setActiveGalleryImages] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Shipping Form State
  const [shippingDetails, setShippingDetails] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    pincode: ""
  });

  // Product Form State
  const initialFormState = {
    title: "", 
    description: "", 
    features: "", 
    price: "", 
    category: CATEGORIES[0], 
    device: DEVICES[0], 
    selectedColor: COLOR_OPTIONS[0],
    stock: 10,
    images: ["", "", "", ""]
  };

  const [productForm, setProductForm] = useState(initialFormState);
  const [selectedProductColors, setSelectedProductColors] = useState({});

  // Razorpay Script Loader
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Fetch Firestore Products Real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    }, (err) => console.log(err));
    return () => unsub();
  }, []);

  // Fetch Firestore Orders Real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(items);
    }, (err) => console.log(err));
    return () => unsub();
  }, []);

  /* ===== Admin Auth ===== */
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminAuthenticated(true);
      setPinError(false);
      setActiveTab("admin");
    } else {
      setPinError(true);
    }
  };

  /* ===== Cart Handlers ===== */
  const addToCart = (product, customColor) => {
    const chosenColor = customColor || product.selectedColor || COLOR_OPTIONS[0];
    const existing = cart.find(item => item.id === product.id && item.selectedColor === chosenColor);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id && item.selectedColor === chosenColor 
          ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1, selectedColor: chosenColor }]);
    }
    setIsCartOpen(true);
  };

  const updateCartQty = (id, delta, color) => {
    setCart(cart.map(item => {
      if (item.id === id && item.selectedColor === color) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

  /* ===== WhatsApp & Razorpay ===== */
  const handleWhatsAppCheckout = () => {
    if (!shippingDetails.fullName || !shippingDetails.phone || !shippingDetails.address) {
      alert("Please enter full Shipping Address details!");
      return;
    }
    let itemsList = cart.map(item => `- ${item.title} (${item.device} / ${item.selectedColor}) x ${item.qty} = ₹${item.price * item.qty}`).join("\n");
    const message = `Hello LUXMO HUB! 👋\n\n*NEW ORDER RECEIVED*\n\n*Items Ordered:*\n${itemsList}\n\n*Total Amount:* ₹${cartTotal}\n\n*Shipping Details:*\nName: ${shippingDetails.fullName}\nPhone: ${shippingDetails.phone}\nAddress: ${shippingDetails.address}, ${shippingDetails.city} - ${shippingDetails.pincode}`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleRazorpayPayment = () => {
    if (!window.Razorpay) {
      alert("Razorpay loading... Retry in a moment.");
      return;
    }
    if (!shippingDetails.fullName || !shippingDetails.phone || !shippingDetails.address) {
      alert("Please fill in complete shipping details!");
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_YOUR_KEY_HERE",
      amount: cartTotal * 100,
      currency: "INR",
      name: "LUXMO HUB",
      description: "Order Payment",
      handler: async function (response) {
        try {
          await addDoc(collection(db, "orders"), {
            paymentId: response.razorpay_payment_id,
            items: cart,
            totalPrice: cartTotal,
            customerDetails: shippingDetails,
            status: "Pending",
            courierName: "",
            trackingId: "",
            createdAt: new Date().toISOString()
          });
          setCart([]);
          setIsCheckoutOpen(false);
          setIsCartOpen(false);
          alert(`Order Placed Successfully! Payment ID: ${response.razorpay_payment_id}`);
        } catch (err) {
          alert("Error saving order: " + err.message);
        }
      },
      prefill: {
        name: shippingDetails.fullName,
        contact: shippingDetails.phone
      },
      theme: { color: "#f59e0b" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  /* ===== Product & Order Admin Actions ===== */
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const cleanImages = productForm.images.filter(img => img && img.trim() !== "");
    const data = { 
      ...productForm, 
      images: cleanImages.length > 0 ? cleanImages : ["https://via.placeholder.com/300"], 
      price: Number(productForm.price),
      stock: Number(productForm.stock)
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
        alert("Product Updated Successfully!");
      } else {
        await addDoc(collection(db, "products"), data);
        alert("New Product Added!");
      }
      setEditingProduct(null);
      setProductForm(initialFormState);
      setAdminSubTab("inventory");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Delete this product permanently?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleUpdateLogistics = async (orderId, newStatus, trackingId, courierName) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { 
        status: newStatus,
        trackingId: trackingId || "",
        courierName: courierName || ""
      });
      alert("Logistics Details Updated!");
    } catch (err) {
      alert("Error updating order: " + err.message);
    }
  };

  const exportOrdersToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Customer Name,Phone,Total Amount,Status,Tracking AWB,Date\n";
    orders.forEach(o => {
      csvContent += `${o.id},"${o.customerDetails?.fullName || 'N/A'}",${o.customerDetails?.phone || 'N/A'},₹${o.totalPrice || 0},${o.status},${o.trackingId || 'N/A'},${o.createdAt}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LUXMO_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.device?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-950 border-2 border-sky-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">L</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">LUXMO HUB</h1>
              <p className="text-[9px] font-bold text-amber-500 tracking-wider">PREMIUM STORE & ACCESSORIES</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:text-white"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (activeTab === "admin") {
                  setActiveTab("store");
                } else if (!isAdminAuthenticated) {
                  setActiveTab("auth_modal");
                } else {
                  setActiveTab("admin");
                }
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 flex items-center gap-1.5 transition hover:bg-amber-400"
            >
              <LayoutDashboard className="w-4 h-4" />
              {activeTab === "admin" ? "Storefront" : "Admin Panel"}
            </button>
          </div>
        </div>
      </header>

      {/* Admin Security PIN Modal */}
      {activeTab === "auth_modal" && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center text-white">Admin Access</h2>
            <p className="text-xs text-slate-400 text-center">4-Digit Security PIN enter karein.</p>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                placeholder="Enter PIN (Default: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-400 focus:outline-none focus:border-amber-500"
              />
              {pinError && <p className="text-xs text-red-500 text-center">Incorrect PIN!</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("store")}
                  className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {activeGalleryImages && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <button 
              onClick={() => setActiveGalleryImages(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-sm font-bold text-slate-300 mb-3">Product Gallery</h3>
            <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {activeGalleryImages.map((img, idx) => (
                <img key={idx} src={img} alt="" className="w-full h-48 object-cover rounded-lg border border-slate-800" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STOREFRONT VIEW */}
      {activeTab === "store" && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search products or device models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <h2 className="text-xl font-bold mb-4 text-white">Products Catalog</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const selectedColor = selectedProductColors[p.id] || p.selectedColor || COLOR_OPTIONS[0];

              return (
                <div key={p.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col justify-between hover:border-slate-700 transition">
                  <div>
                    <div className="relative aspect-square bg-slate-950 rounded-lg overflow-hidden mb-3">
                      <img
                        src={p.images?.[0] || "https://via.placeholder.com/300"}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                      {p.images?.length > 1 && (
                        <button
                          onClick={() => setActiveGalleryImages(p.images)}
                          className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 backdrop-blur-sm"
                        >
                          <Eye className="w-3 h-3" /> View {p.images.length} Images
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">{p.category}</span>
                    <h3 className="font-bold text-slate-100 text-sm mt-0.5">{p.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    
                    {p.device && (
                      <div className="mt-2 text-xs text-slate-300">
                        <span className="text-slate-500">Device: </span>{p.device}
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="text-[10px] text-slate-400 block mb-1">Select Color:</label>
                      <select
                        value={selectedColor}
                        onChange={(e) => setSelectedProductColors({ ...selectedProductColors, [p.id]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                      >
                        {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Price</span>
                      <span className="text-base font-extrabold text-amber-400">₹{p.price}</span>
                    </div>
                    <button
                      onClick={() => addToCart(p, selectedColor)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ADMIN PANEL VIEW */}
      {activeTab === "admin" && isAdminAuthenticated && (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">Admin Management Dashboard</h2>
              <p className="text-xs text-slate-400">Manage Products, Orders, Logistics, & Analytics</p>
            </div>
            <button
              onClick={() => setIsAdminAuthenticated(false)}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg hover:bg-red-500/20"
            >
              Logout Admin
            </button>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2">
            {[
              { id: "analytics", label: "Analytics Overview", icon: TrendingUp },
              { id: "inventory", label: "Product Catalog", icon: Package },
              { id: "add_product", label: editingProduct ? "Edit Product" : "Add Product", icon: Plus },
              { id: "orders", label: `Orders (${orders.length})`, icon: ShoppingBag }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminSubTab(tab.id)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                    adminSubTab === tab.id 
                      ? "bg-amber-500 text-slate-950" 
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Analytics Sub-Tab */}
          {adminSubTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Total Revenue</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">₹{totalRevenue}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Total Orders</span>
                  <p className="text-2xl font-bold text-sky-400 mt-1">{orders.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Active Products</span>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{products.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Add / Edit Product Sub-Tab */}
          {adminSubTab === "add_product" && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-2xl">
              <h3 className="text-base font-bold text-white mb-4">
                {editingProduct ? "Edit Product Details" : "Add New Product"}
              </h3>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Target Device / Model</label>
                    <select
                      value={productForm.device}
                      onChange={(e) => setProductForm({ ...productForm, device: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    >
                      {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Image URLs (Up to 4)</label>
                  {productForm.images.map((imgUrl, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Image URL ${idx + 1}`}
                      value={imgUrl}
                      onChange={(e) => {
                        const updated = [...productForm.images];
                        updated[idx] = e.target.value;
                        setProductForm({ ...productForm, images: updated });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white mb-2"
                    />
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
                  >
                    {editingProduct ? "Update Product" : "Save Product"}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm(initialFormState);
                      }}
                      className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded text-xs"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Inventory Sub-Tab */}
          {adminSubTab === "inventory" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 font-bold text-sm text-white">Product Inventory</div>
              <div className="divide-y divide-slate-800">
                {products.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt="" className="w-12 h-12 object-cover rounded" />
                      <div>
                        <h4 className="font-bold text-xs text-white">{p.title}</h4>
                        <span className="text-[10px] text-amber-500">{p.category} | {p.device}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-emerald-400">₹{p.price}</span>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setProductForm({
                            title: p.title || "",
                            description: p.description || "",
                            features: p.features || "",
                            price: p.price || "",
                            category: p.category || CATEGORIES[0],
                            device: p.device || DEVICES[0],
                            selectedColor: p.selectedColor || COLOR_OPTIONS[0],
                            stock: p.stock || 10,
                            images: [p.images?.[0] || "", p.images?.[1] || "", p.images?.[2] || "", p.images?.[3] || ""]
                          });
                          setAdminSubTab("add_product");
                        }}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders & Logistics Sub-Tab */}
          {adminSubTab === "orders" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Customer Orders & Logistics Tracking</h3>
                <button
                  onClick={exportOrdersToCSV}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold rounded flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export Orders CSV
                </button>
              </div>

              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Order ID: {order.id}</span>
                        <h4 className="text-xs font-bold text-white">{order.customerDetails?.fullName}</h4>
                        <p className="text-[11px] text-slate-400">{order.customerDetails?.phone} | {order.customerDetails?.address}, {order.customerDetails?.city}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-400">₹{order.totalPrice}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Status</label>
                        <select
                          defaultValue={order.status || "Pending"}
                          id={`status-${order.id}`}
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded px-2 py-1 text-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Courier Partner</label>
                        <input
                          type="text"
                          defaultValue={order.courierName || ""}
                          placeholder="e.g. BlueDart / Delhivery"
                          id={`courier-${order.id}`}
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded px-2 py-1 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Tracking / AWB Number</label>
                        <input
                          type="text"
                          defaultValue={order.trackingId || ""}
                          placeholder="Tracking AWB Number"
                          id={`tracking-${order.id}`}
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const s = document.getElementById(`status-${order.id}`).value;
                        const c = document.getElementById(`courier-${order.id}`).value;
                        const t = document.getElementById(`tracking-${order.id}`).value;
                        handleUpdateLogistics(order.id, s, t, c);
                      }}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded"
                    >
                      Update Order Logistics
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">Shopping Cart ({cart.length})</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="divide-y divide-slate-800 max-h-[60vh] overflow-y-auto mt-3">
                {cart.map((item, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <p className="text-[10px] text-slate-400">{item.device} | {item.selectedColor}</p>
                      <span className="text-xs font-bold text-amber-400">₹{item.price * item.qty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQty(item.id, -1, item.selectedColor)} className="w-6 h-6 bg-slate-800 text-white rounded">-</button>
                      <span className="text-xs font-bold">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1, item.selectedColor)} className="w-6 h-6 bg-slate-800 text-white rounded">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex justify-between font-bold text-white text-sm">
                  <span>Total Amount:</span>
                  <span className="text-amber-400">₹{cartTotal}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Shipping Information</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={shippingDetails.fullName}
                onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={shippingDetails.phone}
                onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Complete Address"
                value={shippingDetails.address}
                onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={shippingDetails.city}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={shippingDetails.pincode}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleRazorpayPayment}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg"
              >
                Pay via Razorpay Gateway (₹{cartTotal})
              </button>
              <button
                onClick={handleWhatsAppCheckout}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg"
              >
                Order via WhatsApp Direct
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
