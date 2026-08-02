import { useState, useMemo } from "react";
import {
  ShoppingBag, Menu, X, ShieldCheck, ArrowRight, Magnet, Sparkles,
  Star, ShoppingCart, Zap, ChevronLeft, ChevronRight, Ruler,
  SlidersHorizontal, Minus, Plus, Trash2, Tag, CheckCircle2,
  Smartphone, Wallet, CreditCard, Pencil, Package, ClipboardList,
  LayoutGrid, Phone, Mail, MapPin
} from "lucide-react";

/* ===== Categories & Specs ===== */
export const CATEGORIES = [
  "Mobile Back Case",
  "Hybrid Solar Inverter",
  "Accessories"
];

export const DEVICES = [
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

  // --- Samsung Galaxy Ultra, FE & Plus Series ---
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
  "Hybrid Solar Inverter 3.5KW 24V",
  "Hybrid Solar Inverter 5.5KW 24V",
  "Hybrid Solar Inverter 5.5KW 48V",
  "Hybrid Solar Inverter 6.2KW 48V",
  "Hybrid Solar Inverter 8KW 48V",
  "Hybrid Solar Inverter 10KW 48V",
  "Hybrid Solar Inverter 12KW 48V"
];

export const MATERIALS = [
  "Leather",
  "Titanium frame",
  "MagSafe Clear",
  "Pure Sine Wave Solar",
  "Hybrid Inverter Specs"
];

export const initialProducts = [
  {
    id: "P-1001",
    title: "Aurum Leather Wrap",
    category: "Mobile Back Case",
    device: "iPhone 16 Pro Max",
    material: "Leather",
    price: 1899,
    stock: 42,
    inStock: true,
    magsafe: true,
    rating: 4.8,
    reviews: 214,
    description: "Full-grain leather shell with a hand-burnished edge and a hidden ring of N52 magnets for a precise MagSafe snap.",
    image: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "P-1002",
    title: "Titan Frame Armor",
    category: "Mobile Back Case",
    device: "iPhone 16 Pro",
    material: "Titanium Frame",
    price: 2499,
    stock: 18,
    inStock: true,
    magsafe: true,
    rating: 4.9,
    reviews: 156,
    description: "Aerospace-grade brushed titanium rail bonded to an aramid-fiber back plate.",
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?q=80&w=800&auto=format&fit=crop"
  }
];

export function Header({ view, setView, cartCount, onOpenCart }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("store")}>
          <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-lg flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-amber-500/20">
            L
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-white">LUXMO HUB</h1>
            <p className="text-[10px] text-amber-400 tracking-widest uppercase">Premium Store & Solar</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setView(view === "admin" ? "store" : "admin")}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition"
          >
            {view === "admin" ? "Storefront" : "Admin Panel"}
          </button>

          <button
            onClick={onOpenCart}
            className="relative p-2 text-slate-300 hover:text-white transition"
          >
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-amber-500 text-slate-950 text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export function AdminDashboard({ products, setProducts, orders }) {
  const [formData, setFormData] = useState({
    title: "",
    category: CATEGORIES[0],
    device: DEVICES[0],
    material: MATERIALS[0],
    price: "",
    stock: "",
    description: "",
    image: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    const newProd = {
      id: `P-${Date.now().toString().slice(-4)}`,
      title: formData.title,
      category: formData.category,
      device: formData.device,
      material: formData.material,
      price: Number(formData.price),
      stock: Number(formData.stock) || 10,
      inStock: true,
      magsafe: true,
      rating: 5.0,
      reviews: 1,
      description: formData.description || "Premium high quality item.",
      image: formData.image || "https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800&auto=format&fit=crop"
    };

    setProducts([newProd, ...products]);
    setFormData({
      title: "",
      category: CATEGORIES[0],
      device: DEVICES[0],
      material: MATERIALS[0],
      price: "",
      stock: "",
      description: "",
      image: ""
    });
    alert("Product Added Successfully!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h2>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-2xl mb-12">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-400" /> Add New Product
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Product Title</label>
            <input
              type="text"
              placeholder="e.g. Aurum Leather Wrap or 5.5KW Hybrid Inverter"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Device / Model Specs</label>
              <select
                value={formData.device}
                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                className="w-full p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
              >
                {DEVICES.map((dev) => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Material / Type</label>
              <select
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
              >
                {MATERIALS.map((mat) => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Price (₹)</label>
              <input
                type="number"
                placeholder="1899"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stock Qty</label>
              <input
                type="number"
                placeholder="10"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              rows="3"
              placeholder="Product details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Image URL</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full p-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-lg shadow-amber-500/20"
          >
            Save & Add Product
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("store");
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen bg-[#0b0f19] font-sans text-slate-100">
      <Header view={view} setView={setView} cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      {view === "store" ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-white mb-6">Featured Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4">
                <img src={p.image} alt={p.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                  {p.category || "Accessories"}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{p.title}</h3>
                <p className="text-xs text-slate-400 mb-2">{p.device} • {p.material}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold text-amber-400">₹{p.price}</span>
                  <button
                    onClick={() => addToCart(p)}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg border border-slate-700 transition"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <AdminDashboard products={products} setProducts={setProducts} orders={orders} />
      )}
    </div>
  );
}
