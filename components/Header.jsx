import React from "react";
import {
  ShoppingCart,
  Heart,
  Search,
  Menu,
  User
} from "lucide-react";

export default function Header({
  cartCount = 0,
  search = "",
  setSearch = () => {},
  onMenuClick = () => {}
}) {
  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">

      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-2xl">
            L
          </div>

          <div>
            <h1 className="text-xl font-black">
              LUXMO HUB
            </h1>

            <p className="text-xs text-slate-400">
              Enterprise Store
            </p>
          </div>

        </div>

        <div className="hidden lg:flex flex-1 max-w-xl mx-10 relative">

          <Search
            size={18}
            className="absolute left-4 top-4 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-slate-800 rounded-xl pl-11 pr-4 py-3 outline-none border border-slate-700 focus:border-amber-500"
          />

        </div>

        <div className="flex items-center gap-4">

          <button>
            <Heart />
          </button>

          <button>
            <User />
          </button>

          <button className="relative">

            <ShoppingCart />

            <span className="absolute -top-2 -right-2 bg-amber-500 text-black w-5 h-5 rounded-full text-xs flex items-center justify-center">

              {cartCount}

            </span>

          </button>

          <button
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu />
          </button>

        </div>

      </div>

    </header>
  );
}
