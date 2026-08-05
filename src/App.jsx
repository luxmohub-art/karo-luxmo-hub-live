import React, { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";

import {
  ShoppingCart,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  Package,
} from "lucide-react";

import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

const categories = [
  {
    id: 1,
    title: "Mobile Back Cases",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
  },
  {
    id: 2,
    title: "Hybrid Solar Inverter",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
  },
  {
    id: 3,
    title: "Solar Panels",
    image:
      "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800",
  },
  {
    id: 4,
    title: "Accessories",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800",
  },
];

export default function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(data);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((item) =>
      item.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((x) => x !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };return (
  <div className="min-h-screen bg-slate-950 text-white">

    <Header
      cartCount={cart.length}
      search={search}
      setSearch={setSearch}
      onMenuClick={() => setMobileMenu(!mobileMenu)}
    />

    {/* Hero */}
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-10">

        <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-sm font-bold">
          PREMIUM BRAND
        </span>

        <h1 className="text-5xl font-black mt-6">
          Welcome to LUXMO HUB
        </h1>

        <p className="text-slate-300 mt-5 max-w-2xl">
          Premium Mobile Accessories, Hybrid Solar Inverters,
          Solar Panels & Smart Energy Solutions.
        </p>

        <button className="mt-8 px-8 py-3 bg-amber-500 rounded-xl text-black font-bold">
          Shop Now
        </button>

      </div>
    </section>

    {/* Categories */}
    <section className="max-w-7xl mx-auto px-6">

      <h2 className="text-3xl font-bold mb-6">
        Shop By Category
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

        {categories.map((cat)=>(
          <div
            key={cat.id}
            className="bg-slate-900 rounded-2xl overflow-hidden"
          >

            <img
              src={cat.image}
              alt={cat.title}
              className="h-40 w-full object-cover"
            />

            <div className="p-4 font-semibold">
              {cat.title}
            </div>

          </div>
        ))}

      </div>

    </section>    {/* Products */}
    <section className="max-w-7xl mx-auto px-6 py-16">

      <h2 className="text-3xl font-bold mb-8">
        Featured Products
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {filteredProducts.map((product) => (

          <div
            key={product.id}
            className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800"
          >

            <img
              src={product.image}
              alt={product.title}
              className="w-full h-64 object-cover"
            />

            <div className="p-5">

              <h3 className="text-xl font-bold">
                {product.title}
              </h3>

              <p className="text-slate-400 mt-1">
                {product.category}
              </p>

              <div className="mt-3 flex items-center gap-3">

                <span className="text-amber-400 text-2xl font-bold">
                  ₹{product.price}
                </span>

                <span className="line-through text-slate-500">
                  ₹{product.mrp}
                </span>

              </div>

              <div className="mt-2 text-yellow-400">
                ⭐ {product.rating}
              </div>

              <div className="mt-2 text-green-400">
                Stock : {product.stock}
              </div>

              <div className="flex gap-3 mt-5">

                <button
                  onClick={() => addToCart(product)}
                  className="flex-1 bg-amber-500 text-black py-2 rounded-xl font-bold"
                >
                  Add To Cart
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="px-4 bg-slate-800 rounded-xl"
                >
                  {wishlist.includes(product.id) ? "❤️" : "🤍"}
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </section>    {/* Footer */}
    <footer className="bg-slate-950 border-t border-slate-800 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-6 text-center">

        <h2 className="text-2xl font-bold text-white">
          Luxmo Hub
        </h2>

        <p className="text-slate-400 mt-2">
          Premium Mobile Accessories • Hybrid Solar Inverters • Solar Panels
        </p>

        <p className="text-slate-500 text-sm mt-6">
          © 2026 Luxmo Hub. All Rights Reserved.
        </p>

      </div>
    </footer>

  </div>
);
}
