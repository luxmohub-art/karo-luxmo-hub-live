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
  Heart,
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
  const [wishlist, setWishlist] = useState([]);
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

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

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
  
