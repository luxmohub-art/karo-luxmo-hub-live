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
  Tag
} from "lucide-react";

/* ==========================================================================
   COMPLETE CATEGORIES & DEVICES DATA (NO SHORTENING)
   ========================================================================== */

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

/* ==========================================================================
   MAIN ADMIN DASHBOARD COMPONENT
   ========================================================================== */

export default function AdminDashboard() {
  const [view, setView] = useState("admin");
  const [showPinModal, setShowPinModal] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [adminTab, setAdminTab] = useState("add_product");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  const [products, setProducts] = useState([
    {
      id: "prod_1",
      title: "LUXMO Titanium MagSafe Clear Case",
      description: "Premium clear back case with aerospace titanium alloy frame, raised camera lens lip, and built-in magnetic ring.",
      category: "Mobile Back Case",
      device: "Galaxy S26 Ultra",
      price: "1999",
      salePrice: "1499",
      stock: "45",
      sku: "LXM-S26U-TITAN",
      featured: true,
      images: [
        "https://via.placeholder.com/150",
        "https://via.placeholder.com/150",
      ],
      dynamicSpecs: {
        magsafe_support: true,
        material: "Titanium Frame",
        camera_protection: "Individual Metal Lens Ring",
        finish: "Matte Clear"
      },
      features: "Internal MagSafe alignment magnets\n3D textured tactile back panel\nRaised white camera lens protection frame\nAnti-yellowing UV coating"
    }
  ]);

  const [orders] = useState([
    {
      id: "ORD-98231",
      customer: "Aptal Sharma",
      date: "2026-08-04",
      total: "2998",
      status: "Processing",
      items: ["LUXMO Titanium MagSafe Clear Case x 2"]
    }
  ]);

  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    device: DEVICES[0],
    price: "",
    salePrice: "",
    costPrice: "",
    stock: "10",
    sku: "",
    barcode: "",
    featured: false,
    isActive: true,
    features: "",
    images: ["", "", "", ""],
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

  const handleCategoryChange = (cat) => {
    setProductForm({
      ...productForm,
      category: cat,
      dynamicSpecs: {}
    });
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? { ...productForm, id: editingProduct.id }
            : p
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

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setAdminTab("add_product");
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
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
      stock: "10",
      sku: "",
      barcode: "",
      featured: false,
      isActive: true,
      features: "",
      images: ["", "", "", ""],
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
      {/* NAVBAR */}
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
              LUXMO <span className="text-amber-400">HUB</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-widest font-semibold uppercase">
              Admin & Enterprise Control Panel
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {view === "storefront" ? (
            <button
              onClick={() => {
                if (isAdminLoggedIn) setView("admin");
                else setShowPinModal(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition"
            >
              <LayoutDashboard size={14} />
              <span>Admin Panel</span>
            </button>
          ) : (
            <button
              onClick={() => setView("storefront")}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition"
            >
              <ShoppingBag size={14} />
              <span>Storefront</span>
            </button>
          )}
        </div>
      </nav>

      {/* ADMIN PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Admin Access</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                4-Digit Security PIN enter karein.
              </p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="Enter PIN (Default: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg bg-slate-950 border border-slate-700 focus:border-amber-500 text-amber-400 rounded-xl py-2 px-3 outline-none"
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
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN VIEW SWITCHER */}
      {view === "admin" ? (
        <div className="p-4 max-w-7xl mx-auto">
          {/* DASHBOARD HEADER */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>Admin Management Dashboard</span>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Pro Enterprise
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage Products, Dynamic Specs, Inventory, Logistics & Analytics
              </p>
            </div>
            <button
              onClick={() => {
                setIsAdminLoggedIn(false);
                setView("storefront");
              }}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-bold transition"
            >
              Logout Admin
            </button>
          </div>

          {/* DASHBOARD SUB TABS */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setAdminTab("analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                adminTab === "analytics"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <TrendingUp size={14} />
              <span>Analytics Overview</span>
            </button>
            <button
              onClick={() => setAdminTab("products")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                adminTab === "products"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <PackageCheck size={14} />
              <span>Product Catalog ({products.length})</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setAdminTab("add_product");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                adminTab === "add_product"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Plus size={14} />
              <span>{editingProduct ? "Edit Product" : "+ Add Product"}</span>
            </button>
            <button
              onClick={() => setAdminTab("orders")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                adminTab === "orders"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Truck size={14} />
              <span>Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setAdminTab("settings")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                adminTab === "settings"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Settings size={14} />
              <span>Store Settings</span>
            </button>
          </div>

          {/* TAB 1: ANALYTICS OVERVIEW */}
          {adminTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1">
                        Total Gross Revenue
                      </p>
                      <h3 className="text-2xl font-black text-emerald-400">
                        ₹48,950
                      </h3>
                    </div>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-2 inline-block">
                    ↑ +14% vs last month
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1">
                        Total Orders
                      </p>
                      <h3 className="text-2xl font-black text-sky-400">
                        {orders.length + 32}
                      </h3>
                    </div>
                    <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                      <Truck size={18} />
                    </div>
                  </div>
                  <span className="text-[10px] text-sky-400 font-semibold mt-2 inline-block">
                    92% Order Fulfillment Rate
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1">
                        Active Catalog Items
                      </p>
                      <h3 className="text-2xl font-black text-amber-400">
                        {products.length}
                      </h3>
                    </div>
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                      <PackageCheck size={18} />
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold mt-2 inline-block">
                    {products.filter((p) => Number(p.stock) < 5).length} Items Low Stock
                  </span>
                </div>

               
