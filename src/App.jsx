import React, { useState, useEffect } from "react";
import { 
  Trash2, Plus, LayoutDashboard, Package, Edit3, MessageSquare, 
  CreditCard, Search, ShoppingBag, AlertTriangle, TrendingUp, 
  Upload, CheckCircle, Clock, Truck, XCircle, DollarSign
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp 
} from "firebase/firestore";

/* ===== SET YOUR WHATSAPP NUMBER HERE ===== */
const WHATSAPP_NUMBER = "919876543210"; 

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
  "TOPCon Solar Panel 600w,615w,630w,700w,715, 720W, 730w",

  // --- Accessories ---
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
  "UV Tempered Glass Guard"
];

/* ===== 2. Firebase Setup ===== */
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForVercelBuildToPass",
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
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const initialFormState = {
    title: "", 
    description: "", 
    features: "", 
    price: "", 
    category: CATEGORIES[0], 
    device: DEVICES[0], 
    stock: 10,
    images: ["", "", "", "", "", "", "", "", "", ""]
  };

  const [productForm, setProductForm] = useState(initialFormState);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Fetch Firestore Products Data Real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    }, (err) => console.log(err));

    return () => unsub();
  }, []);

  // Fetch Firestore Orders Data Real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(items);
    }, (err) => console.log(err));

    return () => unsub();
  }, []);

  // WhatsApp Order
  const handleWhatsAppOrder = (product) => {
    const message = `Hello LUXMO HUB! 👋\nI want to order:\n\n*Product:* ${product.title}\n*Device/Model:* ${product.device}\n*Price:* ₹${product.price}\n\nPlease process my order.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Razorpay Payment & Order Creation
  const handleRazorpayPayment = (product) => {
    if (!window.Razorpay) {
      alert("Razorpay gateway loading... Try again in a few seconds.");
      return;
    }

    const options = {
      key: "rzp_test_YOUR_KEY_HERE",
      amount: Number(product.price) * 100,
      currency: "INR",
      name: "LUXMO HUB",
      description: `Payment for ${product.title}`,
      handler: async function (response) {
        try {
          // Save Order in Firestore
          await addDoc(collection(db, "orders"), {
            paymentId: response.razorpay_payment_id,
            productTitle: product.title,
            productId: product.id,
            price: Number(product.price),
            device: product.device,
            customerName: "Customer",
            customerContact: "9999999999",
            status: "Pending",
            createdAt: new Date().toISOString()
          });

          // Deduct Stock
          if (product.stock > 0) {
            await updateDoc(doc(db, "products", product.id), {
              stock: product.stock - 1
            });
          }

          alert(`Payment Successful & Order Placed! Payment ID: ${response.razorpay_payment_id}`);
        } catch (err) {
          alert("Error creating order: " + err.message);
        }
      },
      prefill: {
        name: "Customer Name",
        email: "customer@luxmohub.com",
        contact: "9999999999"
      },
      theme: { color: "#f59e0b" }
    };

    try {
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert("Payment Error: " + err.message);
    }
  };

  // Handle Direct Image File Upload (Converts to Base64)
  const handleFileUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedImages = [...productForm.images];
        updatedImages[index] = reader.result;
        setProductForm({ ...productForm, images: updatedImages });
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Product (Add / Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const cleanImages = productForm.images.filter((img) => img && img.trim() !== "");
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
        alert("New Product Added Successfully!");
      }
      resetForm();
      setAdminSubTab("inventory");
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm(initialFormState);
  };

  const handleStartEdit = (p) => {
    setEditingProduct(p);
    const filledImgs = [...(p.images || [])];
    while (filledImgs.length < 10) filledImgs.push("");
    setProductForm({
      title: p.title || "",
      description: p.description || "",
      features: p.features || "",
      price: p.price || "",
      category: p.category || CATEGORIES[0],
      device: p.device || DEVICES[0],
      stock: p.stock !== undefined ? p.stock : 10,
      images: filledImgs
    });
    setAdminSubTab("add");
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (err) {
        alert("Error deleting: " + err.message);
      }
    }
  };

  // Update Order Status
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (err) {
      alert("Error updating order status: " + err.message);
    }
  };

  // Filtered Products List
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.device?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate Metrics
  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const lowStockCount = products.filter(p => p.stock < 3).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 bg-slate-950 border-2 border-sky-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">L</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">LUXMO HUB</h1>
              <p className="text-[9px] font-bold text-amber-500 tracking-wider">PREMIUM STORE & SOLAR</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab(activeTab === "store" ? "admin" : "store")}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 flex items-center gap-1.5 transition hover:bg-amber-400"
          >
            <LayoutDashboard className="w-4 h-4" />
            {activeTab === "store" ? "Admin Panel" : "Storefront"}
          </button>
        </div>
      </header>

      {/* Main Area */}
      {activeTab === "store" ? (
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Storefront Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search products or device models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs text-white"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <h1 className="text-2xl font-extrabold mb-4 text-white">Featured Collection</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
                <div>
                  <div className="relative aspect-square bg-slate-950 rounded-lg overflow-hidden mb-3">
                    <img
                      src={p.images?.[0] || "https://via.placeholder.com/300"}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    {p.stock === 0 ? (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        Out of Stock
                      </span>
                    ) : p.stock < 3 ? (
                      <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Only {p.stock} left
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{p.title}</h3>
                  <p className="text-xs text-amber-500 font-semibold mt-0.5">{p.device}</p>

                  {p.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.description}</p>
                  )}

                  {p.features && (
                    <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <p className="text-[11px] font-bold text-slate-300 mb-1">Key Features:</p>
                      <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                        {p.features.split("\n").filter(f => f.trim() !== "").map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-xl font-extrabold text-white block mb-3">₹{p.price}</span>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleWhatsAppOrder(p)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-4 h-4" /> Order on WhatsApp
                    </button>
                    <button 
                      disabled={p.stock === 0}
                      onClick={() => handleRazorpayPayment(p)}
                      className={`w-full py-2 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition ${
                        p.stock === 0 
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> {p.stock === 0 ? "Out of Stock" : "Pay Online (UPI/Card)"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        /* Admin Navigation Sub-Tabs */
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 bg-slate-900 p-2 rounded-xl border border-slate-800">
            <button
              onClick={() => setAdminSubTab("analytics")}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                adminSubTab === "analytics" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setAdminSubTab("orders")}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                adminSubTab === "orders" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Orders ({orders.length})
            </button>
            <button
              onClick={() => setAdminSubTab("inventory")}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                adminSubTab === "inventory" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              <Package className="w-4 h-4" /> Products ({products.length})
            </button>
            <button
              onClick={() => { resetForm(); setAdminSubTab("add"); }}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                adminSubTab === "add" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              <Plus className="w-4 h-4" /> {editingProduct ? "Edit Product" : "Add Product"}
            </button>
          </div>

          {/* 1. Analytics & Sales Stats Dashboard View */}
          {adminSubTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Total Revenue</p>
                    <h3 className="text-xl font-bold text-emerald-400 mt-1">₹{totalRevenue.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Total Orders</p>
                    <h3 className="text-xl font-bold text-sky-400 mt-1">{orders.length}</h3>
                  </div>
                  <div className="p-3 bg-sky-500/10 rounded-lg text-sky-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Total Products</p>
                    <h3 className="text-xl font-bold text-amber-400 mt-1">{products.length}</h3>
                  </div>
                 
