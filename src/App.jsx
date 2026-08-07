import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Lock,
  TrendingUp,
  PackageCheck,
  Plus,
  Truck,
  Edit3,
  Trash2,
  Users,
  Search,
  FileText,
  Star,
  ShoppingCart,
  CheckCircle,
  ArrowRight,
  X,
  Printer
} from "lucide-react";

export const CATEGORIES = [
  "Mobile Back Case",
  "Hybrid Solar Inverter",
  "Solar Panel",
  "Accessories",
];

export const DEVICES = [
  "Galaxy Z Fold 7",
  "Galaxy Z Fold 6",
  "Galaxy Z Fold 5",
  "Galaxy Z Fold 4",
  "Galaxy Z Fold 3",
  "Galaxy Z Fold 2",
  "Galaxy Fold",
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
  "Hybrid Solar Inverter 3KW 24V",
  "Hybrid Solar Inverter 3.5KW 24V",
  "Hybrid Solar Inverter 5KW 24V",
  "Hybrid Solar Inverter 5KW 48V",
  "Hybrid Solar Inverter 5.5KW 24V",
  "Hybrid Solar Inverter 5.5KW 48V",
  "Hybrid Solar Inverter 6KW 48V",
  "Hybrid Solar Inverter 6.2KW 48V",
  "Hybrid Solar Inverter 6.5KW 48V",
  "Hybrid Solar Inverter 8KW 48V",
  "Hybrid Solar Inverter 8.5KW 48V",
  "Hybrid Solar Inverter 10KW 48V",
  "Hybrid Solar Inverter 10.5KW 48V",
  "Hybrid Solar Inverter 11KW 48V",
  "Hybrid Solar Inverter 11.5KW 48V",
  "Hybrid Solar Inverter 12KW 48V",
  "Hybrid Solar Inverter 12.5KW 48V",
  "Mono PERC Solar Panel 330W",
  "Mono PERC Solar Panel 440W",
  "Half-Cut Mono PERC 540W",
  "Bifacial Solar Panel 550W",
  "TOPCon Solar Panel 580,590W",
  "TOPCon Solar Panel 600w,615w,630w,700w,715W, 720W, 730W"
];

export default function App() {
  const [view, setView] = useState("storefront");
  const [showPinModal, setShowPinModal] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  
  const [adminTab, setAdminTab] = useState("analytics");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("cart"); 
  const [shippingDetails, setShippingDetails] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    pincode: ""
  });

  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const [products, setProducts] = useState([
    {
      id: "prod_1",
      title: "LUXMO Titanium MagSafe Clear Case",
      description: "Premium clear back case with aerospace titanium alloy frame, white camera lens protection ring, and built-in magnetic ring.",
      category: "Mobile Back Case",
      device: "Galaxy S26 Ultra",
      price: "1999",
      salePrice: "1499",
      stock: "45",
      sku: "LXM-S26U-TITAN",
      status: "Published",
      hsnCode: "392690",
      gstRate: "18",
      rating: 4.8,
      reviewsCount: 124
    },
    {
      id: "prod_2",
      title: "LUXMO Hybrid Solar Inverter 5KW 48V MPPT",
      description: "High-efficiency pure sine wave solar inverter with built-in Wi-Fi monitoring and dual MPPT tracker.",
      category: "Hybrid Solar Inverter",
      device: "Hybrid Solar Inverter 5KW 48V",
      price: "65000",
      salePrice: "58000",
      stock: "3",
      sku: "LXM-INV-5KW",
      status: "Published",
      hsnCode: "850440",
      gstRate: "12",
      rating: 4.9,
      reviewsCount: 38
    }
  ]);

  const [orders, setOrders] = useState([
    {
      id: "ORD-98231",
      customer: "Aptal Sharma",
      phone: "+91 9876543210",
      address: "Main Bazaar, New Delhi - 110001",
      date: "2026-08-04",
      total: "58000",
      paymentStatus: "Paid",
      shippingStatus: "Dispatched",
      items: [{ title: "LUXMO Hybrid Solar Inverter 5KW 48V", price: "58000", qty: 1, hsn: "850440", gst: "12%" }]
    }
  ]);

  const [customers] = useState([
    { id: "CUST-1", name: "Aptal Sharma", email: "aptal@example.com", phone: "+91 9876543210", orders: 3, totalSpent: "1,24,500" },
    { id: "CUST-2", name: "Rahul Verma", email: "rahul@example.com", phone: "+91 9123456789", orders: 1, totalSpent: "1,499" }
  ]);

  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    device: DEVICES[0],
    price: "",
    salePrice: "",
    stock: "15",
    sku: "",
    hsnCode: "392690",
    gstRate: "18",
    status: "Published"
  });

  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);
  }, [orders]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategoryFilter === "All" || p.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryFilter]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + parseFloat(item.salePrice || item.price) * item.qty, 0);
  }, [cart]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (pinInput === "1234") {
      setIsAdminLoggedIn(true);
      setShowPinModal(false);
      setPinError("");
      setPinInput("");
      setView("admin");
    } else {
      setPinError("Invalid PIN! Try 1234");
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    const newOrder = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      customer: shippingDetails.fullName || "Guest Customer",
      phone: shippingDetails.phone || "+91 9000000000",
      address: shippingDetails.address || "India",
      date: new Date().toISOString().split("T")[0],
      total: cartTotal.toString(),
      paymentStatus: "Paid (Online/COD)",
      shippingStatus: "Processing",
      items: cart.map((i) => ({
        title: i.title,
        price: i.salePrice || i.price,
        qty: i.qty,
        hsn: i.hsnCode || "392690",
        gst: `${i.gstRate || 18}%`
      }))
    };
    setOrders([newOrder, ...orders]);
    setCheckoutStep("success");
    setCart([]);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...productForm, id: editingProduct.id, rating: p.rating, reviewsCount: p.reviewsCount } : p
        )
      );
    } else {
      const newProd = {
        ...productForm,
        id: `prod_${Date.now()}`,
        sku: productForm.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
        rating: 5.0,
        reviewsCount: 1
      };
      setProducts([newProd, ...products]);
    }
    resetForm();
    setAdminTab("products");
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({
      title: "",
      description: "",
      category: CATEGORIES[0],
      device: DEVICES[0],
      price: "",
      salePrice: "",
      stock: "15",
      sku: "",
      hsnCode: "392690",
      gstRate: "18",
      status: "Published"
    });
  };
          return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-xl">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setView("storefront")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
            L
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white uppercase leading-none">
              LUXMO <span className="text-amber-400">HUB ENTERPRISE</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-widest font-semibold uppercase">
              Flipkart & Amazon Grade Store
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {view === "storefront" && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition"
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {cart.reduce((a, c) => a + c.qty, 0)}
                </span>
              )}
            </button>
          )}

          {view === "storefront" ? (
            <button
              onClick={() => {
                if (isAdminLoggedIn) setView("admin");
                else setShowPinModal(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition"
            >
              <LayoutDashboard size={15} />
              <span>Admin Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => setView("storefront")}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition"
            >
              <ShoppingBag size={15} />
              <span>View Storefront</span>
            </button>
          )}
        </div>
      </nav>

      {/* GST Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedInvoiceOrder(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">LUXMO HUB ENTERPRISE</h2>
                <p className="text-xs text-slate-500">GSTIN: 07AABCL1234K1ZU</p>
                <p className="text-xs text-slate-500">New Delhi, India - 110001</p>
              </div>
              <div className="text-right">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                  Tax Invoice
                </span>
                <p className="text-xs font-bold mt-2">Invoice #: {selectedInvoiceOrder.id}</p>
                <p className="text-xs text-slate-500">Date: {selectedInvoiceOrder.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl mb-4 text-xs">
              <div>
                <span className="font-bold text-slate-500 block mb-1">Billed To:</span>
                <p className="font-bold text-slate-900">{selectedInvoiceOrder.customer}</p>
                <p className="text-slate-600">{selectedInvoiceOrder.address}</p>
                <p className="text-slate-600">Phone: {selectedInvoiceOrder.phone}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-1">Payment & Shipping:</span>
                <p className="text-slate-800">Status: <span className="font-bold text-emerald-600">{selectedInvoiceOrder.paymentStatus}</span></p>
                <p className="text-slate-800">Shipping: {selectedInvoiceOrder.shippingStatus}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs mb-6">
              <thead>
                <tr className="border-b bg-slate-100 text-slate-700">
                  <th className="p-2">Item Description</th>
                  <th className="p-2">HSN</th>
                  <th className="p-2">GST</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoiceOrder.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 font-medium">{item.title}</td>
                    <td className="p-2 text-slate-600">{item.hsn || "392690"}</td>
                    <td className="p-2 text-slate-600">{item.gst || "18%"}</td>
                    <td className="p-2 text-slate-600">{item.qty}</td>
                    <td className="p-2 text-right font-bold">₹{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-6">
              <div className="w-48 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold">₹{selectedInvoiceOrder.total}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-black text-sm">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600">₹{selectedInvoiceOrder.total}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center space-x-2 text-xs"
              >
                <Printer size={15} />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart size={18} className="text-amber-400" />
                <span>Your Shopping Cart ({cart.reduce((a, c) => a + c.qty, 0)})</span>
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {checkoutStep === "cart" && (
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-xs">
                    Your cart is empty. Add products to begin checkout!
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-emerald-400 text-xs font-black mt-1">₹{item.salePrice || item.price} x {item.qty}</div>
                      </div>
                      <button
                        onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {checkoutStep === "shipping" && (
              <form onSubmit={(e) => { e.preventDefault(); setCheckoutStep("payment"); }} className="flex-1 overflow-y-auto py-4 space-y-3 text-xs">
                <h4 className="font-bold text-amber-400 mb-2">Shipping Details</h4>
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={shippingDetails.fullName}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={shippingDetails.phone}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Delivery Address & Pincode</label>
                  <textarea
                    required
                    rows={2}
                    value={shippingDetails.address}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {checkoutStep === "payment" && (
              <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
                <h4 className="font-bold text-amber-400">Select Payment Method</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="radio" name="pay" defaultChecked className="text-amber-500" />
                    <span>Online UPI / Card / NetBanking (Razorpay / Stripe)</span>
                  </label>
                  <label className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="radio" name="pay" className="text-amber-500" />
                    <span>Cash on Delivery (COD)</span>
                  </label>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg"
                >
                  Confirm & Place Order (₹{cartTotal})
                </button>
              </div>
            )}

            {checkoutStep === "success" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <CheckCircle size={50} className="text-emerald-400" />
                <h3 className="text-lg font-black text-white">Order Placed Successfully!</h3>
                <p className="text-xs text-slate-400">Thank you for shopping with LUXMO HUB ENTERPRISE. Your order is being processed.</p>
                <button
                  onClick={() => { setIsCartOpen(false); setCheckoutStep("cart"); }}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
                >
                  Continue Shopping
                </button>
              </div>
            )}

            {cart.length > 0 && checkoutStep === "cart" && (
              <div className="pt-4 border-t border-slate-800 mt-auto">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-xs">Subtotal</span>
                  <span className="text-white font-black text-base">₹{cartTotal}</span>
                </div>
                <button
                  onClick={() => setCheckoutStep("shipping")}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Admin Access</h3>
                <p className="text-[10px] text-slate-400">Enter PIN to manage store (Default: 1234)</p>
              </div>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                autoFocus
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 4-digit PIN"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center tracking-widest text-lg text-white font-black"
              />
              {pinError && <p className="text-xs text-red-400 text-center font-bold">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg"
              >
                Login to Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
                                            {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {view === "storefront" ? (
          <div>
            {/* Hero Banner */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 md:p-10 mb-8 overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-xl">
                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Enterprise Grade Products
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-white mt-3 tracking-tight">
                  LUXMO Titanium & Solar Solutions Hub
                </h2>
                <p className="text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                  Explore premium MagSafe clear cases for Galaxy Ultra & iPhone series, alongside high-efficiency hybrid solar inverters with instant GST invoicing.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                        selectedCategoryFilter === cat
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                          : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {selectedCategoryFilter !== "All" && (
                    <button
                      onClick={() => setSelectedCategoryFilter("All")}
                      className="px-3 py-2 bg-slate-800 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-700"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by title, device model, or SKU..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-slate-800 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {product.category}
                      </span>
                      <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
                        <Star size={13} className="fill-amber-400" />
                        <span>{product.rating} ({product.reviewsCount})</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                      {product.title}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-3 flex items-center space-x-2 text-[10px] text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800/60">
                      <span className="font-bold text-slate-300">Device/Model:</span>
                      <span className="text-amber-300 truncate">{product.device}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-base font-black text-white">₹{product.salePrice || product.price}</span>
                        {product.salePrice && (
                          <span className="text-xs text-slate-500 line-through">₹{product.price}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold block">In Stock: {product.stock} units</span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow flex items-center space-x-1.5"
                    >
                      <ShoppingCart size={14} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Admin Dashboard */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white">Admin Control Center</h2>
                <p className="text-xs text-slate-400">Manage products, track orders, and monitor business analytics.</p>
              </div>
              <div className="flex space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setAdminTab("analytics")}
                  className={`px-3.5 py-2 rounded-xl transition ${adminTab === "analytics" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setAdminTab("products")}
                  className={`px-3.5 py-2 rounded-xl transition ${adminTab === "products" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}
                >
                  Products ({products.length})
                </button>
                <button
                  onClick={() => setAdminTab("orders")}
                  className={`px-3.5 py-2 rounded-xl transition ${adminTab === "orders" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}
                >
                  Orders ({orders.length})
                </button>
                <button
                  onClick={() => setAdminTab("customers")}
                  className={`px-3.5 py-2 rounded-xl transition ${adminTab === "customers" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"}`}
                >
                  Customers
                </button>
              </div>
            </div>

            {/* Analytics Tab */}
            {adminTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-400">Total Revenue</span>
                      <TrendingUp size={16} className="text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2">₹{totalRevenue.toLocaleString()}</div>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1 block">+12.4% from last month</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-400">Total Orders</span>
                      <PackageCheck size={16} className="text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2">{orders.length}</div>
                    <span className="text-[10px] text-amber-400 font-bold mt-1 block">Fulfilled & Processing</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-400">Active Products</span>
                      <ShoppingBag size={16} className="text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2">{products.length}</div>
                    <span className="text-[10px] text-blue-400 font-bold mt-1 block">Published in Store</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-400">Total Customers</span>
                      <Users size={16} className="text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2">{customers.length}</div>
                    <span className="text-[10px] text-purple-400 font-bold mt-1 block">Registered & Guest</span>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {adminTab === "products" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <h3 className="font-bold text-white text-sm">Inventory & Catalog Management</h3>
                  <button
                    onClick={() => { resetForm(); setAdminTab("product-form"); }}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
                  >
                    <Plus size={15} />
                    <span>Add New Product</span>
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
                        <th className="p-3.5">Product Title</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Device/Model</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Stock</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="p-3.5 font-bold text-white">{p.title}</td>
                          <td className="p-3.5 text-slate-300">{p.category}</td>
                          <td className="p-3.5 text-amber-300">{p.device}</td>
                          <td className="p-3.5 font-black text-emerald-400">₹{p.salePrice || p.price}</td>
                          <td className="p-3.5 text-slate-300">{p.stock}</td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => { setEditingProduct(p); setProductForm(p); setAdminTab("product-form"); }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg inline-flex"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setProducts(products.filter(item => item.id !== p.id))}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg inline-flex"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Form Tab */}
            {adminTab === "product-form" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto shadow-2xl">
                <h3 className="text-base font-black text-white mb-4">
                  {editingProduct ? "Edit Product" : "Add New Product & Device Specification"}
                </h3>
                <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Product Title</label>
                    <input
                      required
                      type="text"
                      value={productForm.title}
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      placeholder="e.g. LUXMO Titanium MagSafe Case"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Device / Model Specification</label>
                      <select
                        value={productForm.device}
                        onChange={(e) => setProductForm({ ...productForm, device: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                      >
                        {DEVICES.map((dev) => (
                          <option key={dev} value={dev}>{dev}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Regular Price (₹)</label>
                      <input
                        required
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Sale Price (₹)</label>
                      <input
                        type="number"
                        value={productForm.salePrice}
                        onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Stock Quantity</label>
                      <input
                        required
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-slate-800">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition"
                    >
                      Save Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab("products")}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {adminTab === "orders" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5 text-right">GST Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="p-3.5 font-bold text-amber-400">{o.id}</td>
                        <td className="p-3.5 text-white">
                          {/* Orders Tab */}
            {adminTab === "orders" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5 text-right">GST Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="p-3.5 font-bold text-amber-400">{o.id}</td>
                        <td className="p-3.5 text-white">
                          <div className="font-bold">{o.customer}</div>
                          <div className="text-[10px] text-slate-400">{o.phone}</div>
                        </td>
                        <td className="p-3.5 text-slate-300">{o.date}</td>
                        <td className="p-3.5 font-black text-emerald-400">₹{o.total}</td>
                        <td className="p-3.5 text-slate-300">
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedInvoiceOrder(o)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold flex items-center space-x-1.5 ml-auto"
                          >
                            <FileText size={13} />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Customers Tab */}
            {adminTab === "customers" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Orders</th>
                      <th className="p-3.5 text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="p-3.5 font-bold text-white">{c.name}</td>
                        <td className="p-3.5 text-slate-300">{c.email}</td>
                        <td className="p-3.5 text-slate-300">{c.phone}</td>
                        <td className="p-3.5 text-amber-400 font-bold">{c.orders} Orders</td>
                        <td className="p-3.5 text-right font-black text-emerald-400">₹{c.totalSpent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
                    }
                    
