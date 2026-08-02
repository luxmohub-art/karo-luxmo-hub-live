import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDevice, setSelectedDevice] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form State for Adding/Editing
  const [formData, setFormData] = useState({
    title: '',
    category: 'Mobile Back Case',
    device: 'iPhone 17 Pro Max',
    material: 'Titanium frame',
    price: '',
    stock: '10',
    description: '',
    images: ['', '', '', '', '', '']
  });

  // Fetch Products Realtime from Firebase Firestore
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

  // Open Edit Modal
  const handleEditClick = (product) => {
    setEditingProduct(product);
    const existingImages = product.images || [];
    // Ensure array has 6 slots for inputs
    const paddedImages = [...existingImages];
    while (paddedImages.length < 6) paddedImages.push('');

    setFormData({
      title: product.title || '',
      category: product.category || 'Mobile Back Case',
      device: product.device || 'iPhone 17 Pro Max',
      material: product.material || 'Titanium frame',
      price: product.price || '',
      stock: product.stock || '10',
      description: product.description || '',
      images: paddedImages
    });
  };

  // Add or Update Product
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validImages = formData.images.filter(url => url && url.trim() !== '');

    const payload = {
      title: formData.title,
      category: formData.category,
      device: formData.device,
      material: formData.material,
      price: Number(formData.price),
      stock: Number(formData.stock),
      description: formData.description,
      images: validImages.length > 0 ? validImages : ['https://via.placeholder.com/480?text=No+Image'],
      updatedAt: serverTimestamp()
    };

    try {
      if (editingProduct) {
        // Update Existing Product
        await updateDoc(doc(db, "products", editingProduct.id), payload);
        alert('Product updated successfully!');
        setEditingProduct(null);
      } else {
        // Add New Product
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        alert('Product added successfully!');
      }

      setFormData({
        title: '',
        category: 'Mobile Back Case',
        device: 'iPhone 17 Pro Max',
        material: 'Titanium frame',
        price: '',
        stock: '10',
        description: '',
        images: ['', '', '', '', '', '']
      });
    } catch (error) {
      console.error("Error saving product: ", error);
      alert('Error saving product to Firebase!');
    }
  };

  // Delete Product
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
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-amber-500 uppercase">Luxmo Hub</h1>
            <p className="text-xs text-slate-400">PREMIUM STORE &amp; ACCESSORIES</p>
          </div>
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            {isAdmin ? 'Storefront' : 'Admin Panel'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isAdmin ? (
          /* Admin Panel Form */
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-amber-500 mb-6">
              {editingProduct ? 'Edit Product Details' : 'Add New Product (Up to 6 Images)'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">PRODUCT TITLE</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Galaxy S24 Ultra Titanium Case"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">CATEGORY</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Mobile Back Case">Mobile Back Case</option>
                    <option value="Chargers">Chargers</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">DEVICE MODEL</label>
                  <select 
                    value={formData.device} 
                    onChange={(e) => setFormData({...formData, device: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="iPhone 17 Pro Max">iPhone 17 Pro Max</option>
                    <option value="iPhone 17 Pro">iPhone 17 Pro</option>
                    <option value="iPhone 16 Pro Max">iPhone 16 Pro Max</option>
                    <option value="iPhone 15 Pro Max">iPhone 15 Pro Max</option>
                    <option value="Galaxy S25 Ultra">Galaxy S25 Ultra</option>
                    <option value="Galaxy S24 Ultra">Galaxy S24 Ultra</option>
                    <option value="Galaxy S23 Ultra">Galaxy S23 Ultra</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">PRICE (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="1999"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">STOCK QTY</label>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">MATERIAL / FINISH</label>
                <input 
                  type="text" 
                  value={formData.material} 
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Titanium frame"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Product Image Direct URLs (Add up to 6 photos)</label>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 mb-2 text-xs"
                    placeholder={`#${idx + 1} Image Direct URL (https://i.ibb.co/...)`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded transition mt-2"
                >
                  {editingProduct ? 'Update Product' : 'Save & Add Product'}
                </button>
                {editingProduct && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingProduct(null);
                      setFormData({
                        title: '',
                        category: 'Mobile Back Case',
                        device: 'iPhone 17 Pro Max',
                        material: 'Titanium frame',
                        price: '',
                        stock: '10',
                        description: '',
                        images: ['', '', '', '', '', '']
                      });
                    }}
                    className="px-4 bg-slate-800 text-slate-300 rounded py-2.5 mt-2 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        ) : (
          /* Store Front */
          <>
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Featured Collection</h2>

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
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col group relative"
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
                      {product.images?.length > 1 && (
                        <span className="absolute top-2 right-2 bg-slate-950/80 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                          +{product.images.length - 1} Photos
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="inline-block bg-slate-800 text-amber-500 text-[10px] px-2 py-0.5 rounded font-medium mb-2">
                          {product.category || 'Mobile Back Case'}
                        </span>
                        <h3 className="font-semibold text-slate-100 text-sm line-clamp-2">{product.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{product.device} • {product.material}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xl font-bold text-slate-100">₹{product.price}</span>
                          <button 
                            onClick={() => { setSelectedProduct(product); setActiveImageIndex(0); }}
                            className="px-3 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs hover:bg-slate-700 transition"
                          >
                            View Details
                          </button>
                        </div>

                        {/* Admin Controls on Cards */}
                        {isAdmin && (
                          <div className="flex gap-2 pt-2 border-t border-slate-800">
                            <button 
                              onClick={() => handleEditClick(product)}
                              className="flex-1 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded text-xs hover:bg-amber-500 hover:text-slate-950 transition font-medium text-center"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="flex-1 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500 hover:text-white transition text-center"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Details Modal with Image Gallery */}
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
                {/* Thumbnails */}
                {selectedProduct.images?.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedProduct.images.map((img, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded overflow-hidden border shrink-0 ${
                          activeImageIndex === idx ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">{selectedProduct.category}</span>
                  <h2 className="text-xl font-bold text-slate-100 mt-1">{selectedProduct.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">For: {selectedProduct.device}</p>
                  
                  <div className="text-2xl font-bold text-amber-500 my-4">₹{selectedProduct.price}</div>
                  
                  <p className="text-xs text-slate-300 mb-4">{selectedProduct.description || 'Premium quality accessory crafted for maximum durability and sleek visual style.'}</p>
                  
                  <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 space-y-1">
                    <div><strong className="text-slate-300">Material:</strong> {selectedProduct.material || 'Titanium frame'}</div>
                    <div><strong className="text-slate-300">Availability:</strong> In Stock ({selectedProduct.stock || 10} units)</div>
                  </div>
                </div>

                <button 
                  onClick={() => alert('Order process initiated!')}
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

