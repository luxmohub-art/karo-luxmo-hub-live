import React, { useState, useMemo } from "react";
import Header from "./components/Header";
import {
  ShoppingCart,
  Heart,
  Search,
  Menu,
  X,
  User,
  LayoutDashboard,
  Package,
  Truck,
  Star,
  Sun,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
const categories = [
  {
    id: 1,
    title: "Mobile Back Cases",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"
  },
  {
    id: 2,
    title: "Hybrid Solar Inverter",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800"
  },
  {
    id: 3,
    title: "Solar Panels",
    image:
      "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800"
  },
  {
    id: 4,
    title: "Accessories",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=800"
  }
];

const products = [
  {
    id: 1,
    title: "Titanium MagSafe Case",
    category: "Mobile Back Case",
    price: 1499,
    mrp: 1999,
    rating: 4.9,
    stock: 24,
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800"
  },
  {
    id: 2,
    title: "Hybrid Solar Inverter 5KW",
    category: "Hybrid Solar Inverter",
    price: 58000,
    mrp: 65000,
    rating: 4.8,
    stock: 5,
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800"
  }
];

export default function App() {
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((x) => x !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}

      <Header
  cartCount={cart.length}
  search={search}
  setSearch={setSearch}
  onMenuClick={() => setMobileMenu(!mobileMenu)}
/>

      {/* Hero */}

      <section className="max-w-7xl mx-auto px-6 py-16">

        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-10">

          <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold">

            PREMIUM BRAND

          </span>

          <h2 className="text-5xl font-black mt-6">

            Welcome to LUXMO HUB

          </h2>

          <p className="text-slate-300 mt-5 max-w-2xl">

            Premium Mobile Accessories,
            Hybrid Solar Inverters,
            Solar Panels &
            Smart Energy Solutions.

          </p>

          <button className="mt-8 px-8 py-3 bg-amber-500 rounded-xl text-black font-bold">

            Shop Now

          </button>

        </div>

      </section>      {/* Search */}

      <section className="max-w-7xl mx-auto px-6 py-6">

        <div className="relative">

          <Search className="absolute left-4 top-4 text-slate-400" size={20} />

          <input
            type="text"
            placeholder="Search Products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-amber-500"
          />

        </div>

      </section>

      {/* Categories */}

      <section className="max-w-7xl mx-auto px-6 py-10">

        <h2 className="text-3xl font-bold mb-8">
          Shop By Category
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {categories.map((item) => (

            <div
              key={item.id}
              className="bg-slate-900 rounded-2xl overflow-hidden hover:scale-105 transition cursor-pointer"
            >

              <img
                src={item.image}
                alt={item.title}
                className="h-44 w-full object-cover"
              />

              <div className="p-4">

                <h3 className="font-bold">
                  {item.title}
                </h3>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* Featured Products */}

      <section className="max-w-7xl mx-auto px-6 py-10">

        <h2 className="text-3xl font-bold mb-8">
          Featured Products
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          {filteredProducts.map((product) => (

            <div
              key={product.id}
              className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500 transition"
            >

              <img
                src={product.image}
                alt={product.title}
                className="h-64 w-full object-cover"
              />

              <div className="p-5">

                <h3 className="font-bold text-lg">
                  {product.title}
                </h3>

                <p className="text-slate-400 text-sm mt-2">
                  {product.category}
                </p>

                <div className="flex items-center gap-2 mt-3">

                  <Star size={18} className="text-yellow-400 fill-yellow-400" />

                  <span>{product.rating}</span>

                </div>                <div className="flex items-center gap-3 mt-4">

                  <span className="text-2xl font-black text-amber-400">
                    ₹{product.price.toLocaleString()}
                  </span>

                  <span className="line-through text-slate-500">
                    ₹{product.mrp.toLocaleString()}
                  </span>

                </div>

                <p className="mt-2 text-sm text-green-400">
                  In Stock : {product.stock}
                </p>

                <div className="flex gap-3 mt-6">

                  <button
                    onClick={() => addToCart(product)}
                    className="flex-1 bg-amber-500 text-black py-3 rounded-xl font-bold hover:bg-amber-400 transition"
                  >
                    Add To Cart
                  </button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-red-500 transition"
                  >
                    <Heart
                      size={20}
                      fill={
                        wishlist.includes(product.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* Features */}

      <section className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-slate-900 rounded-2xl p-8 text-center">
            <Truck className="mx-auto text-amber-400" size={42} />
            <h3 className="font-bold text-xl mt-4">
              Fast Delivery
            </h3>
            <p className="text-slate-400 mt-2">
              Secure shipping across India.
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 text-center">
            <ShieldCheck className="mx-auto text-amber-400" size={42} />
            <h3 className="font-bold text-xl mt-4">
              Genuine Products
            </h3>
            <p className="text-slate-400 mt-2">
              100% Original Quality Products.
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 text-center">
            <Sun className="mx-auto text-amber-400" size={42} />
            <h3 className="font-bold text-xl mt-4">
              Solar Experts
            </h3>
            <p className="text-slate-400 mt-2">
              Premium Hybrid Solar Solutions.
            </p>
          </div>

        </div>

      </section>      {/* Footer */}

      <footer className="bg-slate-900 border-t border-slate-800 mt-20">

        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-10">

          <div>

            <h2 className="text-2xl font-black text-amber-400">
              LUXMO HUB
            </h2>

            <p className="text-slate-400 mt-4">
              Premium Mobile Accessories,
              Hybrid Solar Inverters,
              Solar Panels &
              Smart Energy Solutions.
            </p>

          </div>

          <div>

            <h3 className="font-bold mb-4">
              Quick Links
            </h3>

            <ul className="space-y-2 text-slate-400">

              <li>Home</li>
              <li>Products</li>
              <li>Categories</li>
              <li>Contact</li>

            </ul>

          </div>

          <div>

            <h3 className="font-bold mb-4">
              Customer Care
            </h3>

            <ul className="space-y-2 text-slate-400">

              <li>Email: luxmohub@gmail.com</li>
              <li>Phone: +91 7565012418</li>
              <li>Alt: +91 8299260182</li>

            </ul>

          </div>

          <div>

            <h3 className="font-bold mb-4">
              Secure Shopping
            </h3>

            <p className="text-slate-400">
              Safe Payments, Fast Delivery,
              Genuine Products &
              Trusted Support.
            </p>

          </div>

        </div>

        <div className="border-t border-slate-800 py-6 text-center text-slate-500">

          © {new Date().getFullYear()} LUXMO HUB.
          All Rights Reserved.

        </div>

      </footer>

    </div>

  );

}
