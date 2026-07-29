import { useState, useMemo } from "react";
import {
  ShoppingBag, Menu, X, ShieldCheck, ArrowRight, Magnet, Sparkles,
  Star, ShoppingCart, Zap, ChevronLeft, ChevronRight, Ruler,
  SlidersHorizontal, Minus, Plus, Trash2, Tag, CheckCircle2,
  Smartphone, Wallet, CreditCard, Pencil, Package, ClipboardList,
  LayoutGrid, Phone, Mail, MapPin,
} from "lucide-react";


/* ===== products ===== */
// Luxmo Hub — seed product catalog
// Each product mirrors the shape the Admin Dashboard form produces,
// so items created in Admin drop straight into this same structure.

export const DEVICES = [
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 15 Pro Max",
  "iPhone 15",
  "Galaxy S25 Ultra",
  "Galaxy S24 Ultra",
  "Galaxy S23 Ultra",
];

export const MATERIALS = ["Leather", "Titanium Frame", "MagSafe Clear"];

export const initialProducts = [
  {
    id: "P-1001",
    title: "Aurum Leather Wrap",
    device: "iPhone 16 Pro Max",
    material: "Leather",
    price: 1899,
    stock: 42,
    inStock: true,
    magsafe: true,
    rating: 4.8,
    reviews: 214,
    description:
      "Full-grain leather shell with a hand-burnished edge and a hidden ring of N52 magnets for a precise MagSafe snap.",
    image:
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "P-1002",
    title: "Titan Frame Armor",
    device: "iPhone 16 Pro",
    material: "Titanium Frame",
    price: 2499,
    stock: 18,
    inStock: true,
    magsafe: true,
    rating: 4.9,
    reviews: 156,
    description:
      "Aerospace-grade brushed titanium rail bonded to an aramid-fiber back plate. Built for drop resistance without the bulk.",
    image:
      "https://images.unsplash.com/photo-1601593346740-925612772716?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "P-1003",
    title: "Glacier Clear MagSnap",
    device: "iPhone 15 Pro Max",
    material: "MagSafe Clear",
    price: 999,
    stock: 65,
    inStock: true,
    magsafe: true,
    rating: 4.6,
    reviews: 302,
    description:
      "Yellow-proof optical-grade polymer with a reinforced magnetic ring, so your titanium finish stays on show.",
    image:
      "https://images.unsplash.com/photo-1592286927505-1def25115962?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "P-1004",
    title: "Onyx Leather Fold",
    device: "Galaxy S25 Ultra",
    material: "Leather",
    price: 2199,
    stock: 0,
    inStock: false,
    magsafe: true,
    rating: 4.7,
    reviews: 98,
    description:
      "Vegetable-tanned leather in matte onyx, with an S-Pen silo and a magnetic charging window aligned to Ultra's coil.",
    image:
      "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "P-1005",
    title: "Titan Frame Armor — Ultra",
    device: "Galaxy S24 Ultra",
    material: "Titanium Frame",
    price: 2699,
    stock: 27,
    inStock: true,
    magsafe: true,
    rating: 4.8,
    reviews: 121,
    description:
      "The same brushed titanium rail system, tuned to the Ultra's camera deck and S-Pen slot with zero-play tolerances.",
    image:
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "P-1006",
    title: "Glacier Clear MagSnap — Ultra",
    device: "Galaxy S23 Ultra",
    material: "MagSafe Clear",
    price: 899,
    stock: 51,
    inStock: true,
    magsafe: false,
    rating: 4.4,
    reviews: 77,
    description:
      "Crystal-clear polycarbonate shell with reinforced corners. Sold without a magnetic ring for S23 Ultra.",
    image:
      "https://images.unsplash.com/photo-1533228100845-08145b01de14?q=80&w=800&auto=format&fit=crop",
  },
];

/* ===== Header ===== */
const LuxmoLogo = ({ className = "h-10 w-auto" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 200" className={className}>
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>
    <g transform="translate(20, 10)">
      <path
        d="M 90 10 L 160 45 V 120 C 160 165 90 190 90 190 C 90 190 20 165 20 120 V 45 Z"
        fill="none"
        stroke="url(#shieldGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="90" cy="98" r="36" fill="none" stroke="url(#goldGrad)" strokeWidth="4" strokeDasharray="12 6" />
      <path d="M 78 68 V 120 H 115" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <text x="200" y="110" fontSize="60" fontWeight="900" letterSpacing="6" fill="#ffffff" fontFamily="sans-serif">
      LUXMO
    </text>
    <text x="460" y="110" fontSize="60" fontWeight="900" letterSpacing="5" fill="url(#goldGrad)" fontFamily="sans-serif">
      HUB
    </text>
    <text x="202" y="148" fontSize="12" fontWeight="700" letterSpacing="6" fill="#38bdf8" fontFamily="sans-serif">
      PREMIUM PHONE CASES & ACCESSORIES
    </text>
  </svg>
);

const NAV_LINKS = [
  { label: "Shop", href: "#shop" },
  { label: "iPhone", href: "#iphone" },
  { label: "Galaxy Ultra", href: "#galaxy" },
  { label: "MagSafe", href: "#magsafe" },
];

function Header({ view, setView, cartCount, onOpenCart }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => setView("store")}
          className="flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] rounded-md"
          aria-label="Luxmo Hub home"
        >
          <LuxmoLogo className="h-9 w-auto sm:h-10" />
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium tracking-wide text-slate-300 transition-colors hover:text-[#38bdf8]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setView(view === "admin" ? "store" : "admin")}
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-300 transition-colors hover:border-[#38bdf8]/50 hover:text-[#38bdf8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {view === "admin" ? "Exit Admin" : "Admin"}
          </button>

          <button
            onClick={onOpenCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-[#38bdf8]/50 hover:text-[#38bdf8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-br from-[#fef08a] to-[#eab308] px-1 text-[10px] font-bold text-[#0b0f19]">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-200 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0b0f19] px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-[#38bdf8]"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setView(view === "admin" ? "store" : "admin");
                setMobileOpen(false);
              }}
              className="mt-2 flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {view === "admin" ? "Exit Admin" : "Admin"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ===== Hero ===== */
function Hero({ onShopNow }) {
  return (
    <section className="relative overflow-hidden bg-[#0b0f19]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#38bdf8]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#eab308]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-28 lg:px-8">
        {/* Copy */}
        <div className="order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#38bdf8]">
            <Magnet className="h-3.5 w-3.5" />
            MAGSAFE-CERTIFIED ALIGNMENT
          </div>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Titanium edges.
            <br />
            <span className="bg-gradient-to-r from-[#fef08a] to-[#eab308] bg-clip-text text-transparent">
              Full-grain leather.
            </span>
            <br />
            Perfect snap, every time.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400">
            Luxmo Hub builds cases around your phone's own magnet ring — not
            around ours. Every case is calibrated per device, so your MagSafe
            charger, wallet, and stand lock in flush, first try.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={onShopNow}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] px-7 py-3.5 text-sm font-bold tracking-wide text-[#0b0f19] shadow-[0_0_30px_-5px_rgba(56,189,248,0.6)] transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
            >
              Shop Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-[#38bdf8]" />
              10,000+ precision-fit cases shipped across India
            </div>
          </div>
        </div>

        {/* Signature visual: concentric MagSafe alignment rings behind a phone silhouette */}
        <div className="order-1 flex items-center justify-center lg:order-2">
          <div className="relative flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96">
            {/* concentric alignment rings */}
            <div className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-[#eab308]/40" />
            <div className="absolute inset-8 animate-[spin_24s_linear_infinite_reverse] rounded-full border border-dashed border-[#38bdf8]/30" />
            <div className="absolute inset-16 rounded-full border border-slate-400/20" />

            {/* phone silhouette */}
            <div className="relative h-56 w-32 rounded-[2rem] border border-slate-300/20 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl sm:h-72 sm:w-40">
              <div className="absolute inset-[6px] rounded-[1.6rem] bg-gradient-to-br from-slate-700/60 to-slate-900/80" />
              <div className="absolute left-1/2 top-4 h-1.5 w-10 -translate-x-1/2 rounded-full bg-slate-950/80" />
              {/* magnet ring glow */}
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#eab308]/70 shadow-[0_0_25px_2px_rgba(234,179,8,0.35)]" />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#38bdf8]" />
            </div>

            <div className="absolute -bottom-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b0f19] px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-400">
              <Sparkles className="h-3 w-3 text-[#eab308]" />
              LIVE MAGNET ALIGNMENT
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== ProductCard ===== */
const rupee = (n) => `₹${n.toLocaleString("en-IN")}`;

function ProductCard({ product, onAddToCart, onBuyNow, onOpenDetail }) {
  const [imgError, setImgError] = useState(false);
  const gallery = [product.image, product.image, product.image]; // multi-angle placeholders
  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-[#38bdf8]/40">
      {/* Image gallery */}
      <button
        onClick={() => onOpenDetail(product)}
        className="relative aspect-square w-full overflow-hidden bg-slate-900 focus:outline-none"
      >
        {!imgError ? (
          <img
            src={gallery[activeImg]}
            alt={product.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
            Image unavailable
          </div>
        )}

        {/* Gallery arrows */}
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setActiveImg((i) => (i - 1 + gallery.length) % gallery.length);
          }}
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white group-hover:flex"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </span>
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setActiveImg((i) => (i + 1) % gallery.length);
          }}
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white group-hover:flex"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </span>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {product.magsafe && (
            <span className="flex items-center gap-1 rounded-full bg-[#0b0f19]/80 px-2 py-1 text-[10px] font-bold tracking-wide text-[#38bdf8] backdrop-blur">
              <Magnet className="h-3 w-3" /> MAGSAFE
            </span>
          )}
          <span className="rounded-full bg-[#0b0f19]/80 px-2 py-1 text-[10px] font-bold tracking-wide text-[#eab308] backdrop-blur">
            {product.material.toUpperCase()}
          </span>
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f19]/70">
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500">{product.device}</p>
        <button onClick={() => onOpenDetail(product)} className="text-left text-sm font-semibold text-white hover:text-[#38bdf8]">
          {product.title}
        </button>

        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Star className="h-3.5 w-3.5 fill-[#eab308] text-[#eab308]" />
          <span className="font-medium text-slate-300">{product.rating}</span>
          <span>({product.reviews})</span>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-bold text-white">{rupee(product.price)}</span>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            disabled={!product.inStock}
            onClick={() => onAddToCart(product)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-[#38bdf8]/50 hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
          <button
            disabled={!product.inStock}
            onClick={() => onBuyNow(product)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] py-2 text-xs font-bold text-[#0b0f19] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Zap className="h-3.5 w-3.5" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== ProductDetailModal ===== */
function ProductDetailModal({ product, onClose, onAddToCart, onBuyNow }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0f19] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:text-[#38bdf8]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-2">
          {/* Image / multi-angle showcase */}
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
              <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-slate-900">
                  <img src={product.image} alt={`${product.title} angle ${i + 1}`} className="h-full w-full object-cover opacity-80" />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-xs font-semibold tracking-wide text-slate-500">{product.device}</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{product.title}</h2>

            <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
              <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" />
              <span className="font-semibold text-slate-200">{product.rating}</span>
              <span>({product.reviews} reviews)</span>
            </div>

            <p className="mt-4 text-2xl font-black text-white">{rupee(product.price)}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{product.description}</p>

            {/* Magnetic alignment callout */}
            {product.magsafe && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#38bdf8]/20 bg-[#38bdf8]/5 p-3.5">
                <Magnet className="mt-0.5 h-4 w-4 shrink-0 text-[#38bdf8]" />
                <p className="text-xs leading-relaxed text-slate-300">
                  N52 magnet ring calibrated to {product.device}'s native MagSafe array —
                  chargers, wallets, and stands snap into exact factory alignment.
                </p>
              </div>
            )}

            {/* Tech specs */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-white/10 p-3">
                <p className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Ruler className="h-3.5 w-3.5 text-[#38bdf8]" /> Material
                </p>
                <p className="mt-1 text-slate-400">{product.material}</p>
              </div>
              <div className="rounded-lg border border-white/10 p-3">
                <p className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#38bdf8]" /> Protection
                </p>
                <p className="mt-1 text-slate-400">Raised-edge drop protection</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                disabled={!product.inStock}
                onClick={() => onAddToCart(product)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-semibold text-slate-200 hover:border-[#38bdf8]/50 hover:text-[#38bdf8] disabled:opacity-40"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </button>
              <button
                disabled={!product.inStock}
                onClick={() => onBuyNow(product)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] py-3 text-sm font-bold text-[#0b0f19] disabled:opacity-40"
              >
                <Zap className="h-4 w-4" /> Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== ProductGrid ===== */
const MAX_PRICE = 3000;

function ProductGrid({ products, onAddToCart, onBuyNow, onOpenDetail }) {
  const [device, setDevice] = useState("All");
  const [material, setMaterial] = useState("All");
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (device !== "All" && p.device !== device) return false;
      if (material !== "All" && p.material !== material) return false;
      if (p.price > maxPrice) return false;
      return true;
    });
  }, [products, device, material, maxPrice]);

  const resetFilters = () => {
    setDevice("All");
    setMaterial("All");
    setMaxPrice(MAX_PRICE);
  };

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Device</p>
        <div className="flex flex-wrap gap-2">
          {["All", ...DEVICES].map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                device === d
                  ? "border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8]"
                  : "border-white/10 text-slate-400 hover:border-white/30"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Material</p>
        <div className="flex flex-wrap gap-2">
          {["All", ...MATERIALS].map((m) => (
            <button
              key={m}
              onClick={() => setMaterial(m)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                material === m
                  ? "border-[#eab308] bg-[#eab308]/10 text-[#eab308]"
                  : "border-white/10 text-slate-400 hover:border-white/30"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-400">
          Max Price
          <span className="text-slate-300">₹{maxPrice.toLocaleString("en-IN")}</span>
        </p>
        <input
          type="range"
          min={500}
          max={MAX_PRICE}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#38bdf8]"
        />
      </div>

      <button onClick={resetFilters} className="text-xs font-semibold text-slate-500 underline hover:text-slate-300">
        Reset filters
      </button>
    </div>
  );

  return (
    <section id="shop" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Shop the Collection</h2>
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-300 lg:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.03] p-5">{FilterPanel}</div>
        </aside>

        {/* Mobile filter drawer */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setFiltersOpen(false)} />
            <div className="relative z-10 ml-auto h-full w-72 overflow-y-auto bg-[#0b0f19] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-white">Filters</p>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              {FilterPanel}
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
            <p className="text-sm font-semibold text-slate-300">No cases match those filters</p>
            <p className="mt-1 text-xs text-slate-500">Try widening your price range or device selection.</p>
            <button onClick={resetFilters} className="mt-4 rounded-full bg-[#38bdf8]/10 px-4 py-2 text-xs font-semibold text-[#38bdf8]">
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ===== CartDrawer ===== */
const INDIAN_STATES = [
  "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other",
];

const COUPONS = {
  LUXMO10: 0.1,
  WELCOME15: 0.15,
};

function CartDrawer({ open, onClose, cart, setCart, onPlaceOrder }) {
  const [step, setStep] = useState("cart"); // cart | checkout | success
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState(null);
  const [discountRate, setDiscountRate] = useState(0);
  const [payment, setPayment] = useState("upi");
  const [address, setAddress] = useState({
    name: "", phone: "", line1: "", pincode: "", city: "", state: "",
  });
  const [errors, setErrors] = useState({});

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );
  const discount = Math.round(subtotal * discountRate);
  const shipping = subtotal > 0 && subtotal < 1500 ? 99 : 0;
  const total = subtotal - discount + shipping;

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (COUPONS[code]) {
      setDiscountRate(COUPONS[code]);
      setCouponMsg({ type: "ok", text: `Coupon applied — ${COUPONS[code] * 100}% off` });
    } else {
      setDiscountRate(0);
      setCouponMsg({ type: "error", text: "Invalid coupon code" });
    }
  };

  const validateAddress = () => {
    const e = {};
    if (!address.name.trim()) e.name = "Required";
    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) e.phone = "Enter a valid 10-digit mobile number";
    if (!address.line1.trim()) e.line1 = "Required";
    if (!/^\d{6}$/.test(address.pincode.trim())) e.pincode = "Enter a valid 6-digit PIN code";
    if (!address.city.trim()) e.city = "Required";
    if (!address.state) e.state = "Select a state";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = () => {
    if (!validateAddress()) return;
    const order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      items: cart,
      address,
      payment,
      total,
      status: "Processing",
      createdAt: new Date().toISOString(),
    };
    onPlaceOrder(order);
    setStep("success");
  };

  const closeAndReset = () => {
    onClose();
    setTimeout(() => {
      if (step === "success") {
        setStep("cart");
        setCoupon("");
        setDiscountRate(0);
        setCouponMsg(null);
        setAddress({ name: "", phone: "", line1: "", pincode: "", city: "", state: "" });
      }
    }, 300);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={closeAndReset} />

      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#0b0f19] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold tracking-wide text-white">
            {step === "cart" && "Your Cart"}
            {step === "checkout" && "Checkout"}
            {step === "success" && "Order Confirmed"}
          </h2>
          <button onClick={closeAndReset} aria-label="Close cart">
            <X className="h-5 w-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* CART STEP */}
          {step === "cart" && (
            <>
              {cart.length === 0 ? (
                <p className="mt-10 text-center text-sm text-slate-500">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl border border-white/10 p-3">
                      <img src={item.image} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
                      <div className="flex flex-1 flex-col">
                        <p className="text-xs font-semibold text-white">{item.title}</p>
                        <p className="text-[11px] text-slate-500">{item.device}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-white/10 px-2 py-1">
                            <button onClick={() => updateQty(item.id, -1)} aria-label="Decrease quantity">
                              <Minus className="h-3 w-3 text-slate-400" />
                            </button>
                            <span className="w-4 text-center text-xs text-white">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} aria-label="Increase quantity">
                              <Plus className="h-3 w-3 text-slate-400" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-white">{rupee(item.price * item.qty)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} aria-label="Remove item">
                        <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-400" />
                      </button>
                    </div>
                  ))}

                  {/* Coupon */}
                  <div className="rounded-xl border border-white/10 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Tag className="h-3.5 w-3.5 text-[#eab308]" /> Coupon code
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="e.g. LUXMO10"
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                      />
                      <button
                        onClick={applyCoupon}
                        className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#38bdf8]/50"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMsg && (
                      <p className={`mt-1.5 text-[11px] ${couponMsg.type === "ok" ? "text-[#38bdf8]" : "text-red-400"}`}>
                        {couponMsg.text}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* CHECKOUT STEP */}
          {step === "checkout" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Full Name</label>
                <input
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
                {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Mobile Number</label>
                <input
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
                {errors.phone && <p className="mt-1 text-[11px] text-red-400">{errors.phone}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Address</label>
                <input
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  placeholder="House no., street, locality"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                />
                {errors.line1 && <p className="mt-1 text-[11px] text-red-400">{errors.line1}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">PIN Code</label>
                  <input
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    placeholder="6-digit PIN"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  />
                  {errors.pincode && <p className="mt-1 text-[11px] text-red-400">{errors.pincode}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">City</label>
                  <input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  />
                  {errors.city && <p className="mt-1 text-[11px] text-red-400">{errors.city}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">State</label>
                <select
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s} className="bg-[#0b0f19]">
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="mt-1 text-[11px] text-red-400">{errors.state}</p>}
              </div>

              {/* Payment method */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-300">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "upi", label: "UPI", icon: Smartphone },
                    { id: "cod", label: "COD", icon: Wallet },
                    { id: "card", label: "Card", icon: CreditCard },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPayment(id)}
                      className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[11px] font-semibold transition-colors ${
                        payment === id
                          ? "border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8]"
                          : "border-white/10 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-14 w-14 text-[#38bdf8]" />
              <p className="mt-4 text-sm font-bold text-white">Order placed successfully</p>
              <p className="mt-1 text-xs text-slate-500">
                A confirmation will be sent to your mobile number. You'll pay via{" "}
                {payment === "upi" ? "UPI" : payment === "cod" ? "Cash on Delivery" : "Card"}.
              </p>
            </div>
          )}
        </div>

        {/* Footer / summary */}
        {step !== "success" && (
          <div className="border-t border-white/10 px-5 py-4">
            <div className="mb-3 space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-200">{rupee(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#38bdf8]">
                  <span>Discount</span>
                  <span>-{rupee(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-slate-200">{shipping === 0 ? "Free" : rupee(shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-white">
                <span>Total</span>
                <span>{rupee(total)}</span>
              </div>
            </div>

            {step === "cart" && (
              <button
                disabled={cart.length === 0}
                onClick={() => setStep("checkout")}
                className="w-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] py-3 text-sm font-bold text-[#0b0f19] disabled:opacity-40"
              >
                Proceed to Checkout
              </button>
            )}
            {step === "checkout" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("cart")}
                  className="flex-1 rounded-full border border-white/15 py-3 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="flex-[2] rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] py-3 text-sm font-bold text-[#0b0f19]"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="border-t border-white/10 px-5 py-4">
            <button
              onClick={closeAndReset}
              className="w-full rounded-full border border-white/15 py-3 text-xs font-semibold text-slate-300"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== AdminDashboard ===== */
const emptyForm = {
  id: null,
  title: "",
  device: DEVICES[0],
  material: MATERIALS[0],
  price: "",
  stock: "",
  description: "",
  image: "",
  magsafe: false,
};

function AdminDashboard({ products, setProducts, orders }) {
  const [tab, setTab] = useState("inventory"); // inventory | orders
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.stock) return;

    const stockNum = Number(form.stock);
    const productData = {
      ...form,
      price: Number(form.price),
      stock: stockNum,
      inStock: stockNum > 0,
      rating: form.rating ?? 4.5,
      reviews: form.reviews ?? 0,
      image: form.image || "https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800&auto=format&fit=crop",
    };

    if (editingId) {
      setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...productData, id: editingId } : p)));
    } else {
      setProducts((prev) => [
        ...prev,
        { ...productData, id: `P-${Math.floor(1000 + Math.random() * 9000)}`, rating: 4.5, reviews: 0 },
      ]);
    }
    resetForm();
  };

  const startEdit = (product) => {
    setForm({ ...emptyForm, ...product });
    setEditingId(product.id);
    setTab("inventory");
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
  };

  const toggleStock = (id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock, stock: !p.inStock ? p.stock || 1 : 0 } : p))
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Manage Luxmo Hub inventory and orders</p>
        </div>
        <div className="flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            onClick={() => setTab("inventory")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === "inventory" ? "bg-[#38bdf8] text-[#0b0f19]" : "text-slate-400"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Inventory
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === "orders" ? "bg-[#38bdf8] text-[#0b0f19]" : "text-slate-400"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" /> Orders
          </button>
        </div>
      </div>

      {tab === "inventory" && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[380px_1fr]">
          {/* Product form */}
          <form
            onSubmit={handleSubmit}
            className="h-fit space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Package className="h-4 w-4 text-[#38bdf8]" />
                {editingId ? "Edit Product" : "Add New Product"}
              </p>
              {editingId && (
                <button type="button" onClick={resetForm} aria-label="Cancel edit">
                  <X className="h-4 w-4 text-slate-500 hover:text-white" />
                </button>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Aurum Leather Wrap"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Device Model</label>
                <select
                  value={form.device}
                  onChange={(e) => setForm({ ...form, device: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                >
                  {DEVICES.map((d) => (
                    <option key={d} value={d} className="bg-[#0b0f19]">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Material</label>
                <select
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                >
                  {MATERIALS.map((m) => (
                    <option key={m} value={m} className="bg-[#0b0f19]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Image URL</label>
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={form.magsafe}
                onChange={(e) => setForm({ ...form, magsafe: e.target.checked })}
                className="h-4 w-4 accent-[#38bdf8]"
              />
              <Magnet className="h-3.5 w-3.5 text-[#38bdf8]" />
              MagSafe Compatible
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] py-2.5 text-xs font-bold text-[#0b0f19]"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingId ? "Save Changes" : "Add Product"}
            </button>
          </form>

          {/* Inventory table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Device</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={p.image} alt={p.title} className="h-8 w-8 rounded-md object-cover" />
                        <span className="font-medium text-white">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.device}</td>
                    <td className="px-4 py-3">{rupee(p.price)}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStock(p.id)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          p.inStock ? "bg-[#38bdf8]/10 text-[#38bdf8]" : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {p.inStock ? "In Stock" : "Out of Stock"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(p)} aria-label="Edit product">
                          <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-[#38bdf8]" />
                        </button>
                        <button onClick={() => deleteProduct(p.id)} aria-label="Delete product">
                          <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No products yet. Add your first one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5 text-slate-300">
                  <td className="px-4 py-3 font-medium text-white">{o.id}</td>
                  <td className="px-4 py-3">
                    {o.address.name}
                    <br />
                    <span className="text-slate-500">{o.address.phone}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {o.address.line1}, {o.address.city}, {o.address.state} — {o.address.pincode}
                  </td>
                  <td className="px-4 py-3 uppercase">{o.payment}</td>
                  <td className="px-4 py-3">{rupee(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#eab308]/10 px-2.5 py-1 text-[10px] font-bold text-[#eab308]">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== Footer ===== */
function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0f19]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <LuxmoLogo className="h-9 w-auto" />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-500">
              Precision-fit MagSafe cases in leather and titanium, engineered for
              iPhone flagships and Galaxy Ultra devices.
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Contact</p>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#38bdf8]" />
                <span>7565012418 / 8299260182</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#38bdf8]" />
                <span>Luxmohub@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#38bdf8]" />
                <span>H.N. 147, Kotwa, Post Mathura Chhapar, Deoria, UP, 274405, India</span>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Policies</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#shipping" className="hover:text-[#38bdf8]">Shipping Policy</a></li>
              <li><a href="#returns" className="hover:text-[#38bdf8]">Returns & Refund Policy</a></li>
              <li><a href="#privacy" className="hover:text-[#38bdf8]">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-[#38bdf8]">Terms of Service</a></li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Shop</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#iphone" className="hover:text-[#38bdf8]">iPhone Cases</a></li>
              <li><a href="#galaxy" className="hover:text-[#38bdf8]">Galaxy Ultra Cases</a></li>
              <li><a href="#magsafe" className="hover:text-[#38bdf8]">MagSafe Accessories</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Luxmo Hub. All rights reserved.</p>
          <p>GSTIN & business registration details available on request. Registered address as listed above.</p>
        </div>
      </div>
    </footer>
  );
}

/* ===== App ===== */
function App() {
  const [view, setView] = useState("store"); // "store" | "admin"
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
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

  const buyNow = (product) => {
    addToCart(product);
  };

  const handlePlaceOrder = (order) => {
    setOrders((prev) => [order, ...prev]);
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen bg-[#0b0f19] font-sans text-slate-100">
      <Header
        view={view}
        setView={setView}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      {view === "store" ? (
        <>
          <Hero onShopNow={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })} />
          <ProductGrid
            products={products}
            onAddToCart={addToCart}
            onBuyNow={buyNow}
            onOpenDetail={setDetailProduct}
          />
        </>
      ) : (
        <AdminDashboard products={products} setProducts={setProducts} orders={orders} />
      )}

      <Footer />

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(p) => {
          addToCart(p);
          setDetailProduct(null);
        }}
        onBuyNow={(p) => {
          buyNow(p);
          setDetailProduct(null);
        }}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setCart={setCart}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
}

export default App;
