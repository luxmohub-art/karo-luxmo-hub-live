import React, { useState, useEffect } from "react";
import { 
  Trash2, Plus, LayoutDashboard, Package, Edit3, MessageSquare, 
  CreditCard, Search, ShoppingBag, AlertTriangle, TrendingUp, 
  Upload, CheckCircle, Clock, Truck, XCircle, DollarSign,
  ShoppingCart, X, Lock, Download, Eye, MapPin, Phone, User
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp 
} from "firebase/firestore";

/* ===== SET YOUR WHATSAPP NUMBER & ADMIN PIN HERE ===== */
const WHATSAPP_NUMBER = "919876543210"; 
const ADMIN_PIN = "1234"; 

/* ===== Categories & Devices Data ===== */
export const CATEGORIES = [
  "Mobile Back Case",
  "Hybrid Solar Inverter",
  "Solar Panel",
  "Accessories",
];

export const COLOR_OPTIONS = [
  "Titanium", "Matte Black", "White", "Light Gray", "Golden", "Clear/Transparent"
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
  
  // Auth & Admin Protection State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Store & Admin Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  // Cart & Modal States
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeGalleryImages, setActiveGalleryImages] = useState(null);

  // Search & Filters State
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

  // Selected colors state for storefront items
  const [selectedProductColors, setSelectedProductColors] = useState({});

  // Load Razorpay Script
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

  /* ===== Admin Authentication Handler ===== */
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

  /* ===== Cart Operations ===== */
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

  /* ===== WhatsApp Checkout Handler ===== */
  const handleWhatsAppCheckout = () => {
    if (!shippingDetails.fullName || !shippingDetails.phone || !shippingDetails.address) {
      alert("Please fill in your Shipping Address details!");
      return;
    }

    let itemsList = cart.map(item => `- ${item.title} (${item.device} / ${item.selectedColor}) x ${item.qty} = ₹${item.price * item.qty}`).join("\n");
    const message = `Hello LUXMO HUB! 👋\n\n*NEW ORDER RECEIVED*\n\n*Items Ordered:*\n${itemsList}\n\n*Total Amount:* ₹${cartTotal}\n\n*Shipping Details:*\nName: ${shippingDetails.fullName}\nPhone: ${shippingDetails.phone}\nAddress: ${shippingDetails.address}, ${shippingDetails.city} - ${shippingDetails.pincode}`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  /* ===== Razorpay Checkout Handler ===== */
  const handleRazorpayPayment = () => {
    if (!window.Razorpay) {
      alert("Razorpay gateway loading... Try again in a few seconds.");
      return;
    }

    if (!shippingDetails.fullName || !shippingDetails.phone || !shippingDetails.address) {
      alert("Please fill in your complete Shipping Address details!");
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_YOUR_KEY_HERE",
      amount: cartTotal * 100,
      currency: "INR",
      name: "LUXMO HUB",
      description: "E-Commerce Purchase Payment",
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
          alert(`Payment Successful! Order Placed. Payment ID: ${response.razorpay_payment_id}`);
        } catch (err) {
          alert("Error placing order: " + err.message);
        }
      },
      prefill: {
        name: shippingDetails.fullName,
        contact: shippingDetails.phone
      },
      theme: { color: "#f59e0b" }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  /* ===== Product Management Functions ===== */
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
        alert("New Product Added Successfully!");
      }
      setEditingProduct(null);
      setProductForm(initialFormState);
      setAdminSubTab("inventory");
    } catch (err) {
      alert("Error saving product: " + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
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
      alert("Order Shipping Status & AWB Updated!");
    } catch (err) {
      alert("Error updating logistics: " + err.message);
    }
  };

  /* ===== CSV Export Utility ===== */
  const exportOrdersToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Customer Name,Phone,Total Amount,Status,Tracking AWB,Date\n";
    orders.forEach(o => {
      csvContent += `${o.id},"${o.customerDetails?.fullName || 'N/A'}",${o.customerDetails?.phone || 'N/A'},₹${o.totalPrice || o.price || 0},${o.status},${o.trackingId || 'N/A'},${o.createdAt}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LUXMO_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // Metrics Calculations
  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.totalPrice || curr.price) || 0), 0);
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.device?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Navbar Header */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 bg-slate-950 border-2 border-sky-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">L</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">LUXMO HUB</h1>
              <p className="text-[9px] font-bold text-amber-500 tracking-wider">PREMIUM STORE & ACCESSORIES</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Cart Trigger Button */}
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

            {/* Admin Toggle */}
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

      {/* Admin Authentication Pin Modal */}
      {activeTab === "auth_modal" && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center text-white">Admin Authentication</h2>
            <p className="text-xs text-slate-400 text-center">Admin panel access karne ke liye 4-Digit Security PIN enter karein.</p>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                placeholder="Enter 4-Digit PIN (Default: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-400 focus:outline-none focus:border-amber-500"
              />
              {pinError && <p className="text-xs text-red-500 text-center">Incorrect PIN. Try again!</p>}
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
                  Login Admin
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
            <h3 className="text-sm font-bold text-slate-300 mb-3">Product Image Gallery</h3>
            <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {activeGalleryImages.map((img, idx) => (
                <img key={idx} src={img} alt="" className="w-full h-48 object-cover rounded-lg border border-slate-800" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Storefront View */}
      {activeTab === "store" && (
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

          <h1 className="text-2xl font-extrabold mb-4 text-white">Featured Catalog</h1>
          
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
                          className="absolute bo
