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

           
