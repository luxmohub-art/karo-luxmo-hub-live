import React, { useState } from "react";
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
  DollarSign,
  Users,
  Settings,
  Search,
  Sparkles,
  Layers,
  Smartphone,
  Cpu,
  Tag
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
  "TOPCon Solar Panel 600w,615w,630w,700w,715W",
];

export const CATEGORY_KEY_FEATURES = {
  "Mobile Back Case": [
    { key: "magsafe_support", label: "MagSafe / Wireless Charging Compatible", type: "boolean" },
    { key: "material", label: "Material", type: "select", options: ["Polycarbonate", "TPU", "Leather", "Titanium Frame", "Silicone"] },
    { key: "camera_protection", label: "Camera Protection Type", type: "select", options: ["Raised Lip", "Individual Metal Lens Ring", "Full Lens Cover"] },
    { key: "finish", label: "Back Panel Finish", type: "select", options: ["Matte Clear", "Textured Leather", "Glossy Translucent", "Solid"] },
  ],
  "Hybrid Solar Inverter": [
    { key: "rated_power", label: "Rated Output Power (KW)", type: "number" },
    { key: "battery_voltage", label: "System Battery Voltage (V)", type: "select", options: ["24V", "48V"] },
    { key: "mppt_tracker", label: "MPPT Controller Built-in", type: "boolean" },
    { key: "wifi_monitoring", label: "Wi-Fi / App Remote Monitoring", type: "boolean" },
  ],
  "Solar Panel": [
    { key: "cell_technology", label: "Cell Tech Type", type: "select", options: ["Mono PERC", "Half-Cut Mono PERC", "Bifacial", "TOPCon"] },
    { key: "wattage", label: "Wattage Capacity (W)", type: "string" },
    { key: "warranty_years", label: "Linear Power Warranty (Years)", type: "number" },
  ],
  "Accessories": [
    { key: "compatibility", label: "Universal Device Compatibility", type: "boolean" },
    { key: "connector_type", label: "Connector / Port Type", type: "select", options: ["USB-C", "Lightning", "MC4 Solar Connector", "DC Terminal"] },
  ],
};

export default function AdminDashboard() {
  const [view, setView] = useState("admin");
  const [showPinModal, setShowPinModal] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [adminTab, setAdminTab] = useState("add_product");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  const [products, setProducts] = useState([
    {
      id: "prod_1",
      title: "LUXMO Titanium MagSafe Clear Case",
      description: "Premium clear back case with aerospace titanium alloy frame, raised camera lens lip, and built-in magnetic ring.",
      category: "Mobile Back Case",
      device: "Galaxy S26 Ultra",
      price: "1999",
      salePrice: "1499",
      stock: "45",
      sku: "LXM-S26U-TITAN",
      featured: true,
      images: [
        "https://via.placeholder.com/150",
        "https://via.placeholder.com/150",
      ],
      dynamicSpecs: {
        magsafe_support: true,
        material: "Titanium Frame",
        camera_protection: "Individual Metal Lens Ring",
        finish: "Matte Clear"
      },
      features: "Internal MagSafe alignment magnets\n3D textured tactile back panel\nRaised white camera lens protection frame\nAnti-yellowing UV coating"
    }
  ]);

  const [orders] = useState([
    {
      id: "ORD-98231",
      customer: "Aptal Sharma",
      date: "2026-08-04",
      total: "2998",
      status: "Processing",
      items: ["LUXMO Titanium MagSafe Clear Case x 2"]
    }
  ]);

  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    device: DEVICES[0],
    price: "",
    salePrice: "",
    costPrice: "",
    stock: "10",
    sku: "",
    barcode: "",
    featured: false,
    isActive: true,
    features: "",
    images: ["", "", "", ""],
    dynamicSpecs: {}
  });

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

  const handleCategoryChange = (cat) => {
    setProductForm({
      ...productForm,
      category: cat,
      dynamicSpecs: {}
    });
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? { ...productForm, id: editingProduct.id }
            : p
        )
      );
    } else {
      const newProd = {
        ...productForm,
        id: `prod_${Date.now()}`,
        sku: productForm.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`
      };
      setProducts([newProd, ...products]);
    }
    resetForm();
    setAdminTab("products");
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setAdminTab("add_product");
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
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
      costPrice: "",
      stock: "10",
      sku: "",
      barcode: "",
      featured: false,
      isActive: true,
      features: "",
      images: ["", "", "", ""],
      dynamicSpecs: {}
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategoryFilter === "All" || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });
                                  
