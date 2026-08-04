import React, { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Lock,
  TrendingUp,
  PackageCheck,
  Plus,
  Truck,
  Edit3,
  Trash2,
  DollarSign,
  Users,
  Settings,
  Search,
  Sparkles,
  Layers,
  Smartphone,
  Cpu,
  Tag,
  FileText,
  BarChart2,
  ShieldCheck,
  Database,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Percent
} from "lucide-react";

export const CATEGORIES = [
  "Mobile Back Case",
  "Hybrid Solar Inverter",
  "Solar Panel",
  "Accessories",
];

export const DEVICES = [
  "Galaxy S26 Ultra",
  "iPhone 17 Pro Max",
  "iPhone 17 Pro",
  "Galaxy Z Fold 7",
  "Hybrid Solar Inverter 5KW 48V",
  "Mono PERC Solar Panel 330W",
  "TOPCon Solar Panel 600w,615w,630w,700w,715W",
];

export const CATEGORY_KEY_FEATURES = {
  "Mobile Back Case": [
    { key: "magsafe_support", label: "MagSafe / Wireless Charging Compatible", type: "boolean" },
    { key: "material", label: "Material", type: "select", options: ["Polycarbonate", "TPU", "Leather", "Titanium Frame", "Silicone"] },
    { key: "camera_protection", label: "Camera Protection Type", type: "select", options: ["Raised Lip", "Individual Metal Lens Ring", "Full Lens Cover"] },
    { key: "finish", label: "Back Panel Finish", type: "select", options: ["Matte Clear", "Textured Leather", "Glossy Translucent", "Solid"] },
  ],
  "Hybrid Solar Inverter": [
    { key: "rated_power", label: "Rated Output Power (KW)", type: "number" },
    { key: "battery_voltage", label: "System Battery Voltage (V)", type: "select", options: ["24V", "48V"] },
    { key: "mppt_tracker", label: "MPPT Controller Built-in", type: "boolean" },
    { key: "wifi_monitoring", label: "Wi-Fi / App Remote Monitoring", type: "boolean" },
  ],
  "Solar Panel": [
    { key: "cell_technology", label: "Cell Tech Type", type: "select", options: ["Mono PERC", "Half-Cut Mono PERC", "Bifacial", "TOPCon"] },
    { key: "wattage", label: "Wattage Capacity (W)", type: "string" },
    { key: "warranty_years", label: "Linear Power Warranty (Years)", type: "number" },
  ],
  "Accessories": [
    { key: "compatibility", label: "Universal Device Compatibility", type: "boolean" },
    { key: "connector_type", label: "Connector / Port Type", type: "select", options: ["USB-C", "Lightning", "MC4 Solar Connector", "DC Terminal"] },
  ],
};

export default function AdminDashboard() {
  const [view, setView] = useState("admin"); // 'admin' or 'storefront'
  const [showPinModal, setShowPinModal] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  
  // Admin Tabs mapping to Enterprise Modules
  const [adminTab, setAdminTab] = useState("analytics");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Enterprise State: Products Catalog
  const [products, setProducts] = useState([
    {
      id: "prod_1",
      title: "LUXMO Titanium MagSafe Clear Case",
      description: "Premium clear back case with aerospace titanium alloy frame, white camera lens protection ring, and built-in magnetic ring.",
      category: "Mobile Back Case",
      device: "Galaxy S26 Ultra",
      price: "1999",
      salePrice: "1499",
      costPrice: "800",
      stock: "45",
      sku: "LXM-S26U-TITAN",
      status: "Published",
      featured: true,
      hsnCode: "392690",
      gstRate: "18",
      images: ["https://via.placeholder.com/150"],
      dynamicSpecs: {
        magsafe_support: true,
        material: "Titanium Frame",
        camera_protection: "Individual Metal Lens Ring",
        finish: "Matte Clear"
      },
      features: "Internal MagSafe alignment magnets\n3D textured tactile back panel\nRaised white camera lens protection frame"
    },
    {
      id: "prod_2",
      title: "LUXMO Hybrid Solar Inverter 5KW 48V MPPT",
      description: "High-efficiency pure sine wave solar inverter with built-in Wi-Fi monitoring and dual MPPT tracker.",
      category: "Hybrid Solar Inverter",
      device: "Hybrid Solar Inverter 5KW 48V",
      price: "65000",
      salePrice: "58000",
      costPrice: "45000",
      stock: "3", // Low stock trigger
      sku: "LXM-INV-5KW",
      status: "Published",
      featured: true,
      hsnCode: "850440",
      gstRate: "12",
      images: ["https://via.placeholder.com/150"],
      dynamicSpecs: {
        rated_power: 5,
        battery_voltage: "48V",
        mppt_tracker: true,
        wifi_monitoring: true
      },
      features: "Pure Sine Wave Output\nBuilt-in Wi-Fi App tracking\nOverload & Short Circuit protection"
    }
  ]);

  // Enterprise State: Orders & Logistics
  const [orders, setOrders] = useState([
    {
      id: "ORD-98231",
      customer: "Aptal Sharma",
      date: "2026-08-04",
      total: "59498",
      paymentStatus: "Paid (Razorpay)",
      shippingStatus: "Dispatched",
      items: ["LUXMO Hybrid Solar Inverter 5KW 48V x 1"]
    }
  ]);

  // Enterprise State: Customers
  const [customers] = useState([
    { id: "CUST-1", name: "Aptal Sharma", email: "aptal@example.com", phone: "+91 9876543210", orders: 3, totalSpent: "124,500" },
    { id: "CUST-2", name: "Rahul Verma", email: "rahul@example.com", phone: "+91 9123456789", orders: 1, totalSpent: "1,499" }
  ]);

  // Product Form State
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    device: DEVICES[0],
    price: "",
    salePrice: "",
    costPrice: "",
    stock: "15",
    sku: "",
    hsnCode: "392690",
    gstRate: "18",
    status: "Published",
    featured: false,
    features: "",
    images: [""],
    dynamicSpecs: {}
  });

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (pinInput === "1234") {
      setIsAdminLoggedIn(true);
      setShowPinModal(false);
      setPinError("");
      setPinInput("");
      setView("admin");
    } else {
      setPinError("Invalid PIN! Try 1234");
    }
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...productForm, id: editingProduct.id } : p
        )
      );
    } else {
      const newProd = {
        ...productForm,
        id: `prod_${Date.now()}`,
        sku: productForm.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`
      };
      setProducts([newProd, ...products]);
    }
    resetForm();
    setAdminTab("products");
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({
      title: "",
      description: "",
      category: CATEGORIES[0],
      device: DEVICES[0],
      price: "",
      salePrice: "",
      costPrice: "",
      stock: "15",
      sku: "",
      hsnCode: "392690",
      gstRate: "18",
      status: "Published",
      featured: false,
      features: "",
      images: [""],
      dynamicSpecs: {}
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategoryFilter === "All" || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setView("storefront")}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
            L
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white uppercase leading-none">
              LUXMO <span className="text-amber-400">HUB ENTERPRISE</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-widest font-semibold uppercase">
              Production Grade Management Suite
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {view === "storefront" ? (
            <button
              onClick={() => {
                if (isAdminLoggedIn) setView("admin");
                else setShowPinModal(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <LayoutDashboard size={15} />
              <span>Admin Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => setView("storefront")}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <ShoppingBag size={15} />
              <span>View Storefront</span>
            </button>
          )}
        </div>
      </nav>

      {/* Security PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Enterprise Admin Authentication</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter 4-digit security PIN (Default: 1234)
              </p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-amber-400 rounded-xl py-2.5 px-3 outline-none"
              />
              {pinError && (
                <p className="text-[11px] text-red-400 font-semibold text-center">
                  {pinError}
                </p>
              )}
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow transition"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main View Switcher */}
      {view === "admin" ? (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>Enterprise Control Center</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Secure Live Node
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Full module management: Catalog, Inventory, GST, Orders & Analytics
              </p>
            </div>
            <button
              onClick={() => {
                setIsAdminLoggedIn(false);
                setView("storefront");
              }}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-bold transition"
            >
              Secure Logout
            </button>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "analytics", label: "Analytics & KPI", icon: TrendingUp },
              { id: "products", label: `Catalog (${products.length})`, icon: PackageCheck },
              { id: "add_product", label: editingProduct ? "Edit Item" : "+ Add Product", icon: Plus },
              { id: "inventory", label: "Inventory & Stock", icon: Database },
              { id: "orders", label: `Orders (${orders.length})`, icon: Truck },
              { id: "customers", label: `Customers (${customers.length})`, icon: Users },
              { id: "finance", label: "GST & Finance", icon: FileText },
              { id: "settings", label: "Store Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "add_product" && !editingProduct) resetForm();
                    setAdminTab(tab.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
                    adminTab === tab.id
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* MODULE 1: Analytics & KPIs */}
          {adminTab === "analytics" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Gross Revenue (YTD)</p>
                  <h3 className="text-2xl font-black text-emerald-400">₹1,24,950</h3>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-2 inline-block">↑ +18.4% vs last month</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Total Orders Processed</p>
                  <h3 className="text-2xl font-black text-sky-400">{orders.length + 42}</h3>
                  <span className="text-[10px] text-sky-400 font-semibold mt-2 inline-block">98.2% Fulfillment Success</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Active Catalog SKUs</p>
                  <h3 className="text-2xl font-black text-amber-400">{products.length}</h3>
                  <span className="text-[10px] text-amber-400 font-semibold mt-2 inline-block">
                    {products.filter((p) => Number(p.stock) < 5).length} items require re-stocking
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Registered Customers</p>
                  <h3 className="text-2xl font-black text-purple-400">{customers.length + 124}</h3>
                  <span className="text-[10px] text-purple-400 font-semibold mt-2 inline-block">High retention rate</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-400" />
                  <span>Real-time Category Sales Distribution</span>
                </h3>
                <div className="space-y-3">
                  {CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{cat}</span>
                        <span className="text-amber-400">{idx === 0 ? "64%" : idx === 1 ? "22%" : "14%"}</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full"
                          style={{ width: idx === 0 ? "64%" : idx === 1 ? "22%" : "14%" }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: Product Catalog & Management */}
          {adminTab === "products" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by title, device model, or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-slate-950/50">
                        <th className="p-3.5">Product Details</th>
                        <th
