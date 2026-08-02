import React, { useState } from 'react';
import { ShoppingBag, PlusCircle, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';

const initialProducts = [
  {
    id: 1,
    title: 'Luxmo Premium Magnetic MagSafe Case for iPhone 17 Pro Max – Orange',
    category: 'Mobile Back Case',
    device: 'iPhone 17 Pro Max',
    material: 'Titanium frame',
    price: 2499,
    stock: 10,
    description: 'Protect your iPhone 17 Pro Max with the Luxmo Premium Magnetic MagSafe Case.',
    images: [
      'https://i.ibb.co/sample1.jpg'
    ]
  }
];

export default function App() {
  const [view, setView] = useState('store'); // 'store' or 'admin'
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Form State for Admin Panel
  const [formData, setFormData] = useState({
    title: '',
    category: 'Mobile Back Case',
    device: 'iPhone 17 Pro Max',
    material: 'Titanium frame',
    price: '',
    stock: '',
    description: '',
    images: Array(10).fill('') // 10 Image URL inputs
  });

  const handleImageUrlChange = (index, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData({ ...formData, images: updatedImages });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Corrected trim function
    const validImages = formData.images.filter((url) => url && url.trim() !== '');
    
    const newProd = {
      id: Date.now(),
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      images: validImages.length > 0 ? validImages : ['https://via.placeholder.com/400?text=No+Image']
    };

    setProducts([newProd, ...products]);
    alert('Product Added Successfully with Multiple Images!');
    
    // Reset Form
    setFormData({
      title: '',
      category: 'Mobile Back Case',
      device: 'iPhone 17 Pro Max',
      material: 'Titanium frame',
      price: '',
      stock: '',
      description: '',
      images: Array(10).fill('')
    });
    setView('store');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('store')}>
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xl shadow-lg shadow-amber-500/20">
              L
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wider text-white">LUXMO HUB</h1>
              <p className="text-[10px] text-amber-400 font-semibold tracking-widest uppercase">PREMIUM STORE & SOLAR</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {view === 'admin' ? (
              <button
                onClick={() => setView('store')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                <ShoppingBag size={18} /> Storefront
              </button>
            ) : (
              <button
                onClick={() => setView('admin')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                <LayoutDashboard size={18} /> Admin Panel
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'admin' ? (
          /* ADMIN PANEL - ADD PRODUCT WITH 10 IMAGE URLS */
          <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <PlusCircle className="text-amber-500" /> Add New Product (Up to 10 Images)
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Galaxy S25 Ultra Titanium Case"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200"
                  >
                    <option>Mobile Back Case</option>
                    <option>Hybrid Solar Inverter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Device Model</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 17 Pro Max"
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="2499"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Stock Qty</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200"
                  />
                </div>
              </div>

              {/* 10 IMAGE URL INPUT BOXES */}
              <div className="border-t border-slate-800 pt-4 mt-2">
                <label className="block text-sm font-bold text-amber-400 mb-2">
                  Product Image URLs (Add up to 10 photos)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold w-6">#{idx + 1}</span>
                      <input
                        type="url"
                        placeholder={idx === 0 ? "Main Image URL (ImgBB/Direct Link)" : `Additional Photo ${idx + 1} URL`}
                        value={url}
                        onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition mt-4"
              >
                Save & Add Product
              </button>
            </form>
          </div>
        ) : (
          /* STOREFRONT VIEW */
          <div>
            <h2 className="text-3xl font-black text-white mb-6">Featured Collection</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setActiveImgIndex(0); }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition cursor-pointer group"
                >
                  <div className="relative aspect-square bg-slate-950 overflow-hidden">
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-300"
                    />
                    {p.images.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-slate-950/80 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-700">
                        +{p.images.length - 1} Photos
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-white text-base mt-2 line-clamp-2">{p.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.device} • {p.material}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-black text-white">₹{p.price}</span>
                      <button className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg transition">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* PRODUCT GALLERY MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold z-10"
            >
              ✕
            </button>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="relative aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={selectedProduct.images[activeImgIndex]}
                  alt="Product view"
                  className="max-h-full max-w-full object-contain"
                />

                {selectedProduct.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImgIndex((prev) => (prev === 0 ? selectedProduct.images.length - 1 : prev - 1))}
                      className="absolute left-2 bg-slate-900/80 text-white p-2 rounded-full hover:bg-amber-500 hover:text-slate-950"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setActiveImgIndex((prev) => (prev === selectedProduct.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 bg-slate-900/80 text-white p-2 rounded-full hover:bg-amber-500 hover:text-slate-950"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {selectedProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedProduct.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImgIndex(i)}
                      className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 ${
                        activeImgIndex === i ? 'border-amber-500' : 'border-slate-800'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <h2 className="text-xl font-bold text-white">{selectedProduct.title}</h2>
              <p className="text-2xl font-black text-amber-400">₹{selectedProduct.price}</p>
              <p className="text-xs text-slate-400">{selectedProduct.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
