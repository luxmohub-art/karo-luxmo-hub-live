import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, Search, Trash2, Plus, Minus, X, 
  LayoutDashboard, ShoppingBag, Package, TrendingUp, 
  Zap
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp 
} from "firebase/firestore";

/* ===== 1. Categories & Devices Data ===== */
export const CATEGORIES = [
  "Mobile Back Case",
  "Hybrid Solar Inverter",
  "Solar Panel",
  "Accessories",
];

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

  // --- Solar & Mobile Accessories ---
  "MC4 Solar Connectors (Pair)",
  "4 Sq mm DC Solar Cable (10m)",
  "6 Sq mm DC Solar Cable (10m)",
  "Solar Panel Mounting Structure (2 Panel)",
  "Solar Structure (4 Panel)",
  "DC Distribution Box (DDB) all accessories",
  "20W 40w Fast Charging Adapter",
  "MagSafe Wireless Charger",
  "MagSafe Ring Sticker",
  "Camera Lens Protector Glass",
  "UV Tempered Glass Guard",
];

/* ===== 2. Firebase Config ===== */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STORE_UPI_ID = "yourstore@upi"; 

/* ===== 3. Main App Component ===== */
export default function App() {
  const [activeTab, setActiveTab] = useState("store");
  const [adminTab, setAdminTab] = useState("analytics");
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [customer, setCustomer] = useState({
    name: "", phone: "", address: "", city: "", pincode: "", paymentMethod: "UPI"
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: "", price: "", category: CATEGORIES[0], device: DEVICES[0], stock: 10,
    images: ["", "", "", "", "", ""]
  });

  // Realtime Firebase Listener
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(items);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.device && p.device.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart is empty!");

    const orderData = {
      customer,
      items: cart,
      totalAmount: cartTotal,
      status: "Pending",
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
      
      if (customer.paymentMethod === "UPI") {
        const upiUrl = `upi://pay?pa=${STORE_UPI_ID}&pn=Store&am=${cartTotal}&cu=INR`;
        window.location.href = upiUrl;
      } else {
        alert("🎉 Order Placed Successfully! (Cash on Delivery)");
      }

      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
    } catch (err) {
      alert("Error placing order: " + err.message);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const cleanImages = productForm.images.filter((img) => img && img.trim() !== "");
    const data = { ...productForm, images: cleanImages, price: Number(productForm.price) };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
      } else {
        await addDoc(collection(db, "products"), data);
      }
      setEditingProduct(null);
      setProductForm({ title: "", price: "", category: CATEGORIES[0], device: DEVICES[0], stock: 10, images: ["", "", "", "", "", ""] });
    } catch (err) {
      alert("Error saving product: " + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-7 w-7 text-amber-500 fill-amber-500" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-amber-600 bg-clip-text text-transparent">
              ElectroSolar Hub
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab(activeTab === "store" ? "admin" : "store")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 flex items-center gap-1 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              {activeTab === "store" ? "Admin Panel" : "Store Front"}
            </button>

            {activeTab === "store" && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === "store" ? (
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Search & Dynamic Category Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search case, inverter, solar panel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {["All", ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col justify-between hover:shadow-md transition">
                <div 
                  className="cursor-pointer" 
                  onClick={() => { setPreviewProduct(p); setActiveImageIdx(0); }}
                >
                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-2 relative">
                    <img
                      src={p.images?.[0] || "https://via.placeholder.com/300"}
                      alt={p.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{p.title}</h3>
                  {p.device && <p className="text-xs text-slate-500 mb-1">{p.device}</p>}
                </div>

                <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-900">₹{p.price}</span>
                  <button
                    onClick={() => addToCart(p)}
                    className="p-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md transition text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        /* ===== Admin Panel ===== */
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex border-b border-slate-200 mb-6 gap-6">
            <button
              onClick={() => setAdminTab("analytics")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
                adminTab === "analytics" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Analytics
            </button>
            <button
              onClick={() => setAdminTab("products")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
                adminTab === "products" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500"
              }`}
            >
              <Package className="w-4 h-4" /> Products Manager
            </button>
            <button
              onClick={() => setAdminTab("orders")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition relative ${
                adminTab === "orders" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500"
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Orders
              {pendingOrders > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingOrders}
                </span>
              )}
            </button>
          </div>

          {/* Admin Analytics Tab */}
          {adminTab === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500">Total Revenue</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">₹{totalRevenue.toLocaleString()}</h2>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500">Total Orders</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">{orders.length}</h2>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500">Active Products</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">{products.length}</h2>
              </div>
            </div>
          )}

          {/* Admin Products CRUD */}
          {adminTab === "products" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleSaveProduct} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <input
                  type="text"
                  placeholder="Title"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
                <input
                  type="number"
                  placeholder="Price (INR)"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
                
                {/* Dynamic Category Selector */}
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Dynamic Devices/Specs Selector */}
                <select
                  value={productForm.device}
                  onChange={(e) => setProductForm({ ...productForm, device: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                >
                  <option value="">-- Select Model/Spec --</option>
                  {DEVICES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <p className="text-[11px] font-semibold text-slate-500 mt-2">Up to 6 Image Links:</p>
                {productForm.images.map((img, idx) => (
                  <input
                    key={idx}
                    type="url"
                    placeholder={`Image URL ${idx + 1}`}
                    value={img}
                    onChange={(e) => {
                      const newImgs = [...productForm.images];
                      newImgs[idx] = e.target.value;
                      setProductForm({ ...productForm, images: newImgs });
                    }}
                    className="w-full p-1.5 border border-slate-200 rounded text-[11px]"
                  />
                ))}
                <button type="submit" className="w-full py-2 bg-amber-500 font-bold text-xs rounded hover:bg-amber-600 transition">
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
              </form>

              <div className="lg:col-span-2 space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || "https://via.placeholder.com/50"} alt="" className="w-10 h-10 object-cover rounded" />
                      <div>
                        <h4 className="text-xs font-semibold">{p.title}</h4>
                        <p className="text-[10px] text-slate-500">₹{p.price} | {p.category} {p.device ? `(${p.device})` : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p)
