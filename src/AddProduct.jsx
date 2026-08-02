import React, { useState } from 'react';
// अपनी प्रोजेक्ट की firebase file import करें (अगर अलग नाम है तो path सही कर लें)
import { db } from './firebase'; 
import { collection, addDoc } from 'firebase/firestore';

export default function AddProduct() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Mobile Back Case');
  const [device, setDevice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'products'), {
        title: title,
        price: Number(price),
        category: category,
        device: device,
        stock: Number(stock),
        images: [imageUrl],
        createdAt: new Date()
      });

      alert('🎉 प्रोडक्ट सफलतापूर्वक सेव हो गया!');
      // फॉर्म रिसेट करें
      setTitle('');
      setPrice('');
      setDevice('');
      setStock('');
      setImageUrl('');
    } catch (error) {
      alert('गड़बड़ हुई: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>नया प्रोडक्ट जोड़ें (Admin)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Price (₹):</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Category:</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Device:</label>
          <input type="text" value={device} onChange={(e) => setDevice(e.target.value)} placeholder="iPhone 17 Pro Max" required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Stock:</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Image URL:</label>
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." required style={{ width: '100%', padding: '8px' }} />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'सेव हो रहा है...' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}

