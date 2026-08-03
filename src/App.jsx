import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, Search, Trash2, Plus, X, 
  LayoutDashboard, ShoppingBag, Package, TrendingUp, 
  Sun, Edit3 
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
  "Galaxy Z Fold 7", "Galaxy Z Fold 6", "Galaxy Z Fold 5", "Galaxy Z Fold 4",
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Plus", "iPhone 17",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "Galaxy S26 Ultra", "Galaxy S26 Plus", "Galaxy S26",
  "Galaxy S25 Ultra", "Galaxy S25 Plus", "Galaxy S25",
  "Galaxy S24 Ultra", "Galaxy S24 Plus", "Galaxy S24",
  "Hybrid Solar Inverter 3KW 24V", "Hybrid Solar Inverter 5KW 48V",
  "Mono PERC Solar Panel 330W", "Bifacial Solar Panel 550W",
  "MagSafe Wireless Charger", "UV Tempered Glass Guard"
];

/* ===== Firebase Config ===== */
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: "", price: "", category: CATEGORIES[0], device: DEVICES[0], stock: 10,
    images: ["", "", "", "", "", "", "", "", "", ""]
  });

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    }, (err) => console.log(err));

    return () => unsubProducts();
  }, []);

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
        alert("Product Updated!");
      } else {
        await addDoc(collection(db, "products"), data);
        alert("Product Added!");
      }
      resetForm();
      setAdminSubTab("inventory");
    } catch (err) {
      alert("Error: " + err.message);
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
    if (window.confirm("Delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sun className="h-7 w-7 text-amber-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-amber-500 bg-clip-text text-transparent">
              LUXMO HUB
            </span>
          </div>

          <button
            onClick={() => setActiveTab(activeTab === "store" ? "admin" : "store")}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            {activeTab === "store" ? "Admin Panel" : "Storefront"}
          </button>
        </div>
      </header>

      {activeTab === "store" ? (
        <main className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-extrabold mb-4 text-white">Featured Collection</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3">
                <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden mb-3">
                  <img
                    src={p.images?.[0] || "https://via.placeholder.com/300"}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{p.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{p.device}</p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-base font-extrabold text-white">₹{p.price}</span>
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
              className={`flex-1 py-2 text-xs font-bold rounded-lg ${
                adminSubTab === "inventory" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              Inventory ({products.length})
            </button>
            <button
              onClick={() => { resetForm(); setAdminSubTab("add"); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg ${
                adminSubTab === "add" ? "bg-amber-500 text-slate-950" : "bg-slate-950 text-slate-300"
              }`}
            >
              {editingProduct ? "Edit Product" : "Add Product"}
            </button>
          </div>

          {adminSubTab === "inventory" && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              {products.map((p) => (
                <div key={p.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0] || "https://via.placeholder.com/50"} alt="" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{p.title}</h4>
                      <p className="text-xs text-amber-500">₹{p.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(p)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 bg-red-600 text-white rounded text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminSubTab === "add" && (
            <form onSubmit={handleSaveProduct} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <input
                type="text"
                placeholder="Product Title"
                required
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <input
                type="number"
                placeholder="Price"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <button type="submit" className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded text-xs">
                {editingProduct ? "Update Product" : "Save Product"}
              </button>
            </form>
          )}
        </main>
      )}
    </div>
  );
                }

