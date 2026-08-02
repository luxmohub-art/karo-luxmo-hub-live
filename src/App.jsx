import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDevice, setSelectedDevice] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Cases',
    device: 'Galaxy S23 Ultra',
    material: 'Titanium Frame',
    price: '',
    stock: '10',
    description: '',
    images: ['', '', '', '']
  });

  // 🔹 Fetch Products Realtime from Firebase Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    });

    return () => unsubscribe();
  }, []);

  // Filter Products
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
    const deviceMatch = selectedDevice === 'All' || product.device === selectedDevice;
    return categoryMatch && deviceMatch;
  });

  // 🔹 Add Product to Firebase Database
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validImages = formData.images.filter(url => url && url.trim() !== '');

    try {
      await addDoc(collection(db, "products"), {
        title: formData.title,
        category: formData.category,
        device: formData.device,
        material: formData.material,
        price: Number(formData.price),
        stock: Number(formData.stock),
        description: formData.description,
        images: validImages.length > 0 ? validImages : ['https://via.placeholder.com/480?text=No+Image'],
        createdAt: serverTimestamp()
      });

      alert('Product added successfully!');
      setFormData({
        title: '',
        category: 'Cases',
        device: 'Galaxy S23 Ultra',
        material: 'Titanium Frame',
        price: '',
        stock: '10',
        description: '',
        images: ['', '', '', '']
      });
    } catch (error) {
      console.error("Error adding product: ", error);
      alert('Error adding product to Firebase!');
    }
  };

  // 🔹 Delete Product from Firebase Database
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (error) {
        console.error("Error deleting product: ", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-wider text-amber-500 uppercase">Luxmo Hub</h1>
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            {isAdmin ? 'View Shop' : 'Admin Panel'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isAdmin ? (
          /* Admin Panel */
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-amber-500 mb-6">Add New Accessory Product</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Product Title</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. MagSafe Ultra Case White Camera"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cases">Cases</option>
                    <option value="Chargers">Chargers</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Compatible Device</label>
                  <select 
                    value={formData.device} 
                    onChange={(e) => setFormData({...formData, device: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Galaxy S23 Ultra">Galaxy S23 Ultra</option>
                    <option value="Galaxy S24 Ultra">Galaxy S24 Ultra</option>
                    <option value="iPhone 15 Pro Max">iPhone 15 Pro Max</option>
                    <option value="iPhone 16 Pro Max">iPhone 16 Pro Max</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="1299"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Material / Finish</label>
                  <input 
                    type="text" 
                    value={formData.material} 
                    onChange={(e) => setFormData({...formData, material: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Titanium Matte"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea 
                  rows="3" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="Product features and specifications..."
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Image URLs (up to 4)</label>
                {formData.images.map((img, idx) => (
                  <input 
                    key={idx}
                    type="url" 
                    value={img} 
                    onChange={(e) => {
                      const newImgs = [...formData.images];
                      newImgs[idx] = e.target.value;
                      setFormData({...formData, images: newImgs});
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 mb-2"
                    placeholder={`Image URL ${idx + 1}`}
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded transition mt-4"
              >
                Save Product to Database
              </button>
            </form>
          </section>
        ) : (
          /* Store Front */
          <>
            {/* Filters */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <div className="flex gap-2">
                {['All', 'Cases', 'Chargers', 'Accessories'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                      selectedCategory === cat 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <select 
                value={selectedDevice} 
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Devices</option>
                <option value="Galaxy S23 Ultra">Galaxy S23 Ultra</option>
                <option value="Galaxy S24 Ultra">Galaxy S24 Ultra</option>
                <option value="iPhone 15 Pro Max">iPhone 15 Pro Max</option>
                <option value="iPhone 16 Pro Max">iPhone 16 Pro Max</option>
              </select>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                No products found in database. Switch to Admin Panel to add new products!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col group"
                  >
                    <div 
                      className="aspect-square bg-slate-950 overflow-hidden cursor-pointer relative"
                      onClick={() => { setSelectedProduct(product); setActiveImageIndex(0); }}
                    >
                      <img 
                        src={product.images?.[0] || 'https://via.placeholder.com/480?text=No+Image'} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs text-amber-500 font-medium mb-1">{product.device}</div>
                        <h3 className="font-semibold text-slate-200 line-clamp-1">{product.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{product.material}</p>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-lg font-bold text-slate-100">₹{product.price}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setSelectedProduct(product); setActiveImageIndex(0); }}
                            className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded text-xs hover:bg-amber-500 hover:text-slate-950 transition font-medium"
                          >
                            View
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500 hover:text-white transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Product View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden mb-3 border border-slate-800">
                  <img 
                    src={selectedProduct.images?.[activeImageIndex] || selectedProduct.images?.[0]} 
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {selectedProduct.images?.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded overflow-hidden border ${
                        activeImageIndex === idx ? 'border-amber-500' : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">{selectedProduct.category}</span>
                  <h2 className="text-2xl font-bold text-slate-100 mt-1">{selectedProduct.title}</h2>
                  <p className="text-sm text-slate-400 mt-1">For: {selectedProduct.device}</p>
                  
                  <div className="text-2xl font-bold text-amber-500 my-4">₹{selectedProduct.price}</div>
                  
                  <p className="text-sm text-slate-300 mb-4">{selectedProduct.description || 'Premium quality accessory crafted for maximum durability and sleek visual style.'}</p>
                  
                  <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 space-y-1">
                    <div><strong className="text-slate-300">Material:</strong> {selectedProduct.material || 'Premium Alloy'}</div>
                    <div><strong className="text-slate-300">Availability:</strong> In Stock</div>
                  </div>
                </div>

                <button 
                  onClick={() => alert('Order feature integrated!')}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg transition mt-6"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
