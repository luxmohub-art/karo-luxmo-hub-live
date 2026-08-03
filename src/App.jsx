import React, { useState, useEffect } from "react";
import { 
  Trash2, Plus, LayoutDashboard, Package, Edit3 
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc 
} from "firebase/firestore";

/* ===== Categories & Devices Data ===== */
export const CATEGORIES = [
  "Mobile Back Case",
  "Hybrid Solar Inverter",
  "Solar Panel",
  "Accessories",
];

export const DEVICES = [
  "Galaxy Z Fold 7", "Galaxy Z Fold 6", "Galaxy Z Fold 5",
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Plus", "iPhone 17",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "Galaxy S26 Ultra", "Galaxy S26 Plus", "Galaxy S26",
  "Galaxy S25 Ultra", "Galaxy S25 Plus", "Galaxy S25",
  "Hybrid Solar Inverter 3KW 24V", "Hybrid Solar Inverter 5KW 48V",
  "Mono PERC Solar Panel 330W", "Bifacial Solar Panel 550W",
  "MagSafe Wireless Charger", "UV Tempered Glass Guard"
];

/* ===== Firebase Setup ===== */
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
  const [adminSubTab, setAdminSubTab] = useState("inventory");
  
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [productForm, setProductForm] = useState({
    title: "", price: "", category: CATEGORIES[0], device: DEVICES[0], stock: 10,
    images: ["", "", "", "", "", "", "", "", "", ""]
  });

  // Fetch real-time products from Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    }, (err) => console.log(err));

    return () => unsub();
  }, []);

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
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (err) {
        alert("Error deleting: " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Header with Matching Blue Shield Logo */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Custom Matching Shield Logo */}
            <div className="relative w-10 h-10 bg-slate-950 border-2 border-sky-400 rounded-xl flex items-center justify-center shadow-inner">
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center">
                <span className="text-white font-extrabold text-xs">L</span>
              </div>
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

      {/* Main Content */}
      {activeTab === "store" ? (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-extrabold mb-4 text-white">Featured Collection</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
                <div>
                  <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden mb-3">
                    <img
                      src={p.images?.[0] || "https://via.placeholder.com/300"}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{p.device}</p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-base font-extrabold text-white">₹{p.price}</span>
                  <button className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded text-xs">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-2 mb-6 bg-slate-900 p-2 rounded-xl border border-slate-800">
            <button
              onClick={() => setAdminSubTab("inventory")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                adminSubTab === "inventory" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              <Package className="w-4 h-4" /> Manage Products ({products.length})
            </button>
            <button
              onClick={() => { resetForm(); setAdminSubTab("add"); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                adminSubTab === "add" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              <Plus className="w-4 h-4" /> {editingProduct ? "Edit Product" : "Add Product"}
            </button>
          </div>

          {/* 1. Inventory View with Edit & Delete */}
          {adminSubTab === "inventory" && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-base mb-2">All Active Products</h3>
              {products.length === 0 ? (
                <p className="text-xs text-slate-400">No products found. Click "Add Product" to create one.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || "https://via.placeholder.com/50"} alt="" className="w-12 h-12 rounded object-cover border border-slate-800" />
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{p.title}</h4>
                        <p className="text-xs text-amber-500 font-semibold">₹{p.price} | Stock: {p.stock}</p>
                        <p className="text-[10px] text-slate-400">{p.category} ({p.device})</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-500"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. Add / Edit Form */}
          {adminSubTab === "add" && (
            <form onSubmit={handleSaveProduct} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 max-w-2xl mx-auto">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? "✏️ Edit Product Details" : "➕ Add New Product"}
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="Product Title"
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
                    {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Device Model</label>
                  <select
                    value={productForm.device}
                    onChange={(e) => setProductForm({ ...productForm, device: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {DEVICES.map((d) => (<option key={d} value={d}>{d}</option>))}
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
