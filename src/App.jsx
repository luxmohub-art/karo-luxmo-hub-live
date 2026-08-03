import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, Search, Trash2, Plus, X, 
  LayoutDashboard, ShoppingBag, Package, TrendingUp, 
  Sun, Edit3 
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

export default function App() {
  const [activeTab, setActiveTab] = useState("store");
  const [adminSubTab, setAdminSubTab] = useState("inventory");
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [cart, setCart] = useState([]);
  
  // Edit Feature States
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: "", price: "", category: CATEGORIES[0], device: DEVICES[0], stock: 10,
    images: ["", "", "", "", "", "", "", "", "", ""]
  });

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

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.device && p.device.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const cleanImages = productForm.images.filter((img) => img && img.trim() !== "");
    const data = { 
      ...productForm, 
      images: cleanImages, 
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
      alert("Error saving product: " + err.message);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({ 
      title: "", price: "", category: CATEGORIES[0], device: DEVICES[0], stock: 10, 
      images: ["", "", "", "", "", "", "", "", "", ""] 
    });
  };

  const handleStartEdit = (p) => {
    setEditingProduct(p);
    const filledImgs = [...(p.images || [])];
    while (filledImgs.length < 10) filledImgs.push("");
    setProductForm({
      title: p.title || "",
      price: p.price || "",
      category: p.category || CATEGORIES[0],
      device: p.device || DEVICES[0],
      stock: p.stock || 10,
      images: filledImgs
    });
    setAdminSubTab("add");
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sun className="h-7 w-7 text-amber-500" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-amber-500 bg-clip-text text-transparent">
              LUXMO HUB
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab(activeTab === "store" ? "admin" : "store")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center gap-1.5 transition font-bold"
            >
              <LayoutDashboard className="w-4 h-4" />
              {activeTab === "store" ? "Admin Panel" : "Storefront"}
            </button>
          </div>
        </div>
      </header>

      {activeTab === "store" ? (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-extrabold mb-4 text-white">Featured Collection</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
                <div>
                  <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden mb-3 relative">
                    <img
                      src={p.images?.[0] || "https://images.unsplash.com/photo-1603313040372-a076624979e2?w=600&auto=format&fit=crop&q=60"}
                      alt={p.title || "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{p.device}</p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-base font-extrabold text-white">₹{p.price}</span>
                  <button
                    onClick={() => addToCart(p)}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Admin Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-900 p-2 rounded-xl border border-slate-800">
            <button
              onClick={() => setAdminSubTab("inventory")}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                adminSubTab === "inventory" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              <Package className="w-4 h-4" /> Products List & Edit ({products.length})
            </button>
            <button
              onClick={() => { resetForm(); setAdminSubTab("add"); }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                adminSubTab === "add" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              <Plus className="w-4 h-4" /> {editingProduct ? "Edit Product" : "Add Product"}
            </button>
          </div>

          {/* 1. All Products List with EDIT & DELETE */}
          {adminSubTab === "inventory" && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h3 className="font-bold text-white text-base mb-4 flex items-center justify-between">
                <span>Manage All Products</span>
                <span className="text-xs text-slate-400 font-normal">Click Edit to change price/details</span>
              </h3>

              <div className="space-y-3">
                {products.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No products found. Click "Add Product" above.</p>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.images?.[0] || "https://via.placeholder.com/50"} 
                          alt="" 
                          className="w-12 h-12 rounded object-cover border border-slate-800" 
                        />
                        <div>
                          <h4 className="text-sm font-bold text-white line-clamp-1">{p.title}</h4>
                          <p className="text-xs text-amber-500 font-semibold">₹{p.price} | Stock: {p.stock}</p>
                          <p className="text-[10px] text-slate-400">{p.category} ({p.device})</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="px-3 py-1.5 bg-blue-600/30 text-blue-400 border border-blue-600/50 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-600 hover:text-white transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs hover:bg-red-600 hover:text-white transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 2. Form for Add / Edit */}
          {adminSubTab === "add" && (
            <form onSubmit={handleSaveProduct} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">
                  {editingProduct ? "✏️ Edit Product Details" : "➕ Add New Product"}
                </h3>
                {editingProduct && (
                  <button 
                    type="button" 
                    onClick={() => { resetForm(); setAdminSubTab("inventory"); }} 
                    className="text-xs text-red-400 underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Galaxy S25 Ultra Titanium Case"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Device Model</label>
                  <select
                    value={productForm.device}
                    onChange={(e) => setProductForm({ ...productForm, device: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {DEVICES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="2499"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    placeholder="10"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Image URLs (Up to 10)</label>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {productForm.images.map((img, idx) => (
                    <input
                      key={idx}
                      type="url"
                      placeholder={`Image URL ${idx + 1}`}
                      value={img}
                      onChange={(e) => {
                        const updated = [...productForm.images];
                        updated[idx] = e.target.value;
                        setProductForm({ ...productForm, images: updated });
                      }}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition"
              >
                {editingProduct ? "Update Product" : "Save Product"}
              </button>
            </form>
          )}

        </main>
      )}
    </div>
  );
}
