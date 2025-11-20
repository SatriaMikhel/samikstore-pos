"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, Package, Cloud, Search, 
  Trash2, ArrowLeft, ShoppingBag, TrendingUp, 
  MapPin, AlertTriangle, History, Receipt, Printer,
  Settings, Download, LogOut, Plus, Edit, Tag, Percent, 
  BarChart3, BookOpen, ChevronDown, ChevronUp, Lock, ShieldCheck, Image as ImageIcon
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// --- Types ---
type Tab = "dashboard" | "pos" | "inventory" | "notes" | "history" | "settings";
type Product = { 
  id: number; 
  name: string; 
  price: number; 
  stock: number; 
  category: string; 
  image?: string; 
};
type CartItem = Product & { qty: number };
type Transaction = { id: string; date: string; rawTotal: number; tax: number; discount: number; finalTotal: number; items: CartItem[] };

const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: "Kopi Gula Aren", price: 18000, stock: 50, category: "Minuman", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200&auto=format&fit=crop" },
  { id: 2, name: "Croissant Butter", price: 22000, stock: 5, category: "Makanan", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=200&auto=format&fit=crop" },
  { id: 3, name: "Air Mineral", price: 5000, stock: 100, category: "Minuman" },
  { id: 4, name: "Dimsum Mentai", price: 30000, stock: 15, category: "Snack" },
  { id: 5, name: "Nasi Goreng", price: 25000, stock: 0, category: "Makanan", image: "https://images.unsplash.com/photo-1603133872878-684f208fb74b?q=80&w=200&auto=format&fit=crop" },
];

export default function SamikStoreUltimate() {
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [savedPin, setSavedPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expense, setExpense] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [weather, setWeather] = useState<any>(null);

  // Load Data
  useEffect(() => {
    const load = (key: string, setter: Function, def: any) => {
      const saved = localStorage.getItem(`samikstore_${key}`);
      if (saved) setter(JSON.parse(saved));
      else setter(def);
    };
    
    load('products', setProducts, DEFAULT_PRODUCTS);
    load('transactions', setTransactions, []);
    load('expense', setExpense, 0);
    
    const storedPin = localStorage.getItem('samikstore_pin');
    if (storedPin) {
      setHasPin(true);
      setSavedPin(storedPin);
      const session = sessionStorage.getItem('samikstore_auth');
      if (session === 'true') setIsAuthenticated(true);
    } else {
      setIsAuthenticated(true);
    }
    setIsLoaded(true);

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current_weather=true`)
      .then(res => res.json())
      .then(data => setWeather(data.current_weather))
      .catch(() => {});
  }, []);

  // Save Data
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('samikstore_products', JSON.stringify(products));
    localStorage.setItem('samikstore_transactions', JSON.stringify(transactions));
    localStorage.setItem('samikstore_expense', JSON.stringify(expense));
  }, [products, transactions, expense, isLoaded]);

  const income = useMemo(() => transactions.reduce((acc, t) => acc + t.finalTotal, 0), [transactions]);
  
  const chartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('id-ID', { weekday: 'short' });
    });
    const values = days.map(day => {
      return transactions
        .filter(t => new Date(t.date.split(',')[0]).toLocaleDateString('id-ID', { weekday: 'short' }) === day)
        .reduce((acc, t) => acc + t.finalTotal, 0);
    });
    const maxVal = Math.max(...values, 1);
    return days.map((day, i) => ({ day, value: values[i], height: (values[i] / maxVal) * 100 }));
  }, [transactions]);

  // Auth Logic
  const handleLogin = () => {
    if (pinInput === savedPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('samikstore_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true); setPinInput("");
    }
  };

  const handleCreatePin = () => {
    if (newPinInput.length < 4) return alert("PIN minimal 4 angka");
    localStorage.setItem('samikstore_pin', newPinInput);
    setSavedPin(newPinInput);
    setHasPin(true);
    setNewPinInput("");
    alert("PIN Berhasil Dibuat!");
  };

  const handleRemovePin = () => {
    if (confirm("Hapus keamanan PIN?")) {
      localStorage.removeItem('samikstore_pin');
      setHasPin(false); setSavedPin(""); setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('samikstore_auth');
    setPinInput("");
  };

  // CRUD
  const deleteProduct = (id: number) => {
    if (confirm("Yakin ingin menghapus?")) setProducts(prev => prev.filter(p => p.id !== id));
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
       id: editingProduct ? editingProduct.id : Date.now(),
       name: (form.elements.namedItem('name') as HTMLInputElement).value,
       price: Number((form.elements.namedItem('price') as HTMLInputElement).value),
       stock: Number((form.elements.namedItem('stock') as HTMLInputElement).value),
       category: (form.elements.namedItem('category') as HTMLInputElement).value,
       image: (form.elements.namedItem('image') as HTMLInputElement).value,
    };
    setProducts(prev => editingProduct ? prev.map(p => p.id === editingProduct.id ? data : p) : [...prev, data]);
    setShowProductModal(false);
  };

  // POS
  const addToCart = (p: Product) => {
    if (p.stock <= 0) return;
    setCart(prev => {
      const exist = prev.find(item => item.id === p.id);
      return exist ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
    });
  };

  const subTotal = cart.reduce((a, b) => a + (b.price * b.qty), 0);
  const taxAmount = subTotal * taxRate;
  const finalTotal = Math.max(0, subTotal + taxAmount - discount);

  const handleCheckout = () => {
    const newTx: Transaction = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString('id-ID'),
      rawTotal: subTotal,
      tax: taxAmount,
      discount: discount,
      finalTotal: finalTotal,
      items: [...cart]
    };
    setTransactions(prev => [newTx, ...prev]);
    setProducts(products.map(p => {
      const inCart = cart.find(c => c.id === p.id);
      return inCart ? { ...p, stock: p.stock - inCart.qty } : p;
    }));
    setCart([]); setDiscount(0); setIsMobileCartOpen(false); setShowReceipt(newTx);
  };

  const categories = useMemo(() => ["All", ...new Set(products.map(p => p.category))], [products]);
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  if (!isLoaded) return null;

  // Login Screen
  if (hasPin && !isAuthenticated) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl text-center">
         <div className="w-16 h-16 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-serif italic text-2xl mx-auto mb-6 shadow-lg">S</div>
         <h1 className="text-2xl font-bold text-slate-800 mb-2">SamikStore POS</h1>
         <input type="password" value={pinInput} readOnly className="w-full text-center text-3xl font-bold tracking-[1em] mb-8 border-b-2 border-indigo-100 focus:outline-none py-2 h-12"/>
         <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
           {[1,2,3,4,5,6,7,8,9].map(num => (
             <button key={num} onClick={() => setPinInput(p => p.length < 4 ? p + num : p)} className="h-16 rounded-xl bg-gray-50 hover:bg-indigo-50 text-xl font-bold text-slate-700 active:scale-95">{num}</button>
           ))}
           <button onClick={() => setPinInput("")} className="h-16 rounded-xl bg-red-50 text-red-600 font-bold">C</button>
           <button onClick={() => setPinInput(p => p + "0")} className="h-16 rounded-xl bg-gray-50 text-slate-700 font-bold">0</button>
           <button onClick={handleLogin} className="h-16 rounded-xl bg-indigo-600 text-white font-bold"><ArrowLeft className="mx-auto"/></button>
         </div>
         {loginError && <p className="text-red-500 text-sm">PIN Salah</p>}
      </div>
    </div>
  );

  // MAIN APP
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col md:flex-row">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col h-screen fixed z-50 shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-wider">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-serif italic">S</div>SamikStore
          </h1>
          <p className="text-xs text-slate-400 mt-1 ml-10">Enterprise Edition</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavButton active={activeTab === "dashboard"} icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => setActiveTab("dashboard")} />
          <NavButton active={activeTab === "pos"} icon={<ShoppingBag size={20}/>} label="Kasir (POS)" onClick={() => setActiveTab("pos")} />
          <NavButton active={activeTab === "inventory"} icon={<Package size={20}/>} label="Produk" onClick={() => setActiveTab("inventory")} />
          <NavButton active={activeTab === "history"} icon={<History size={20}/>} label="Laporan" onClick={() => setActiveTab("history")} />
          <NavButton active={activeTab === "settings"} icon={<Settings size={20}/>} label="Pengaturan" onClick={() => setActiveTab("settings")} />
        </nav>
        {hasPin && <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 px-4 py-2 w-full text-sm font-medium"><LogOut size={18}/> Logout</button></div>}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-32 md:pb-8 min-h-screen overflow-y-auto">
        <header className="md:hidden flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 capitalize">{activeTab}</h2>
          {hasPin && <button onClick={handleLogout}><LogOut className="text-red-500" size={20}/></button>}
        </header>

        {/* VIEW: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                 <div className="z-10">
                   <div className="flex items-center gap-2 opacity-80 text-sm mb-2 bg-white/20 w-fit px-3 py-1 rounded-full"><MapPin size={14}/> Jakarta HQ</div>
                   <div className="text-4xl md:text-5xl font-bold mb-2">{weather ? `${weather.temperature}°` : "--"}</div>
                   <p className="text-indigo-100 max-w-md text-sm md:text-base">Selamat bekerja! Cek stok barang hari ini.</p>
                 </div>
                 <Cloud size={180} className="absolute -right-10 -bottom-10 opacity-20" />
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border flex flex-col justify-center items-center text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3"><TrendingUp size={24}/></div>
                  <p className="text-slate-400 text-xs md:text-sm font-medium uppercase">Pendapatan Bersih</p>
                  <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">{formatRupiah(income - expense)}</p>
              </div>
            </div>

            {/* Guide */}
            <div className="bg-slate-800 rounded-2xl p-4 text-white shadow-lg">
               <div onClick={() => setShowGuide(!showGuide)} className="flex items-center justify-between cursor-pointer select-none">
                  <div className="flex items-center gap-2"><BookOpen className="text-indigo-400" size={18}/><h3 className="text-sm font-bold uppercase tracking-wider text-indigo-100">Panduan Cepat</h3></div>
                  <button className="text-slate-400 hover:text-white">{showGuide ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button>
               </div>
               {showGuide && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
                    <div className="flex gap-3 items-start"><span className="text-indigo-400 font-bold text-lg">1.</span><div><h4 className="font-bold text-white text-sm">Buat Keamanan</h4><p className="text-xs text-slate-400 mt-1">Set PIN di menu Akun.</p></div></div>
                    <div className="flex gap-3 items-start"><span className="text-indigo-400 font-bold text-lg">2.</span><div><h4 className="font-bold text-white text-sm">Kasir & Stok</h4><p className="text-xs text-slate-400 mt-1">Otomatis potong stok.</p></div></div>
                    <div className="flex gap-3 items-start"><span className="text-indigo-400 font-bold text-lg">3.</span><div><h4 className="font-bold text-white text-sm">Download Laporan</h4><p className="text-xs text-slate-400 mt-1">Unduh di Pengaturan.</p></div></div>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border">
                  <h3 className="font-bold mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-indigo-600"/> Grafik Penjualan</h3>
                  <div className="flex items-end gap-2 h-48 pt-4 border-b border-dashed border-gray-200 pb-2">
                     {chartData.map((d, i) => (
                       <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="w-full bg-indigo-50 rounded-t-lg relative group-hover:bg-indigo-100 transition-all duration-500" style={{ height: `${d.height}%` }}></div>
                          <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-orange-500"/> Perlu Restock</h3>
                  <div className="space-y-3 overflow-y-auto max-h-60 pr-2 custom-scrollbar">
                     {products.filter(p => p.stock < 10).length === 0 && <p className="text-gray-400 text-sm italic">Semua stok aman.</p>}
                     {products.filter(p => p.stock < 10).map(p => (
                       <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                          <div><p className="font-bold text-sm text-slate-700">{p.name}</p><p className="text-xs text-slate-500">Stok: {p.stock}</p></div>
                          <button className="px-3 py-1 bg-white text-orange-600 text-xs font-bold rounded shadow-sm border border-orange-200">Order</button>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* VIEW: POS */}
        {activeTab === "pos" && (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
             <div className="flex-1">
                <div className="mb-6 space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                      <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500"/>
                   </div>
                   <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition", selectedCategory === cat ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-500 hover:bg-gray-100")}>{cat}</button>
                      ))}
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-20 lg:pb-0">
                  {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} className={cn("bg-white p-3 rounded-2xl border shadow-sm cursor-pointer hover:border-indigo-500 transition relative overflow-hidden", p.stock===0 && "opacity-60 pointer-events-none")}>
                       <div className="h-28 bg-indigo-50 rounded-xl mb-2 overflow-hidden">
                          {p.image ? <img src={p.image} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-indigo-200"><Package size={32}/></div>}
                       </div>
                       <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2">{p.name}</h4>
                       <div className="flex justify-between items-center">
                          <span className="text-indigo-600 font-bold text-sm">{formatRupiah(p.price)}</span>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold", p.stock < 5 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500")}>{p.stock}</span>
                       </div>
                       {p.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-red-500 border-2 border-red-500 rounded-xl m-6 transform -rotate-12">HABIS</div>}
                    </div>
                  ))}
                </div>
             </div>
             <div className="hidden lg:flex w-96 bg-white rounded-3xl border flex-col h-[calc(100vh-100px)] sticky top-4 shadow-xl overflow-hidden">
                <div className="p-5 bg-slate-50 border-b">
                   <h3 className="font-bold text-lg">Keranjang</h3>
                   <p className="text-xs text-gray-500">ID: {`INV-${Date.now().toString().slice(-6)}`}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2"><ShoppingBag size={48} className="opacity-20"/><p>Keranjang Kosong</p></div>
                   ) : (
                     cart.map(item => (
                       <div key={item.id} className="flex justify-between items-center group">
                          <div><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-gray-500">{formatRupiah(item.price)} x {item.qty}</p></div>
                          <div className="text-right">
                             <p className="font-bold text-sm">{formatRupiah(item.price * item.qty)}</p>
                             <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => setCart(c => c.map(i => i.id===item.id ? {...i, qty: i.qty-1} : i).filter(i=>i.qty>0))} className="text-xs bg-gray-100 p-1 rounded">-</button>
                                <button onClick={() => addToCart(item)} className="text-xs bg-gray-100 p-1 rounded">+</button>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
                <div className="p-5 bg-slate-50 border-t space-y-3">
                   <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatRupiah(subTotal)}</span></div>
                   <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><Tag size={14}/> Pajak (11%)</div><input type="checkbox" checked={taxRate > 0} onChange={(e) => setTaxRate(e.target.checked ? 0.11 : 0)} className="accent-indigo-600"/></div>
                   <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><Percent size={14}/> Diskon (Rp)</div><input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-20 text-right text-xs border rounded p-1"/></div>
                   <div className="border-t pt-3 flex justify-between items-center"><span className="font-bold text-lg">Total</span><span className="font-bold text-xl text-indigo-600">{formatRupiah(finalTotal)}</span></div>
                   <button onClick={handleCheckout} disabled={cart.length===0} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50">Bayar</button>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: INVENTORY (MOBILE FRIENDLY) */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
             <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
                <div><h3 className="font-bold text-lg">Produk</h3><p className="text-xs text-gray-500">Kelola stok barang</p></div>
                <button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex gap-2 items-center"><Plus size={16}/> <span className="hidden md:inline">Tambah</span></button>
             </div>

             {/* Mobile View (Cards) */}
             <div className="md:hidden space-y-3">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border shadow-sm flex gap-4">
                     <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                        {p.image ? <img src={p.image} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full"><Package size={20} className="text-gray-400"/></div>}
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{p.name}</h4>
                        <p className="text-xs text-gray-500 mb-2">{p.category} • {formatRupiah(p.price)}</p>
                        <div className="flex justify-between items-center">
                           <span className={cn("text-xs font-bold px-2 py-1 rounded", p.stock < 5 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>{p.stock} Unit</span>
                           <div className="flex gap-2">
                              <button onClick={() => {setEditingProduct(p); setShowProductModal(true)}} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit size={16}/></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16}/></button>
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Desktop View (Table) */}
             <div className="hidden md:block bg-white rounded-3xl border shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-medium">
                   <tr><th className="p-4 pl-6">Produk</th><th className="p-4">Kategori</th><th className="p-4">Harga</th><th className="p-4">Stok</th><th className="p-4 text-right pr-6">Aksi</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {products.map(p => (
                     <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="p-4 pl-6 font-bold text-slate-700 flex items-center gap-3">
                           {p.image ? <img src={p.image} className="w-8 h-8 rounded-md object-cover"/> : <div className="w-8 h-8 bg-indigo-50 rounded-md flex items-center justify-center"><Package size={14}/></div>}
                           {p.name}
                        </td>
                        <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">{p.category}</span></td>
                        <td className="p-4">{formatRupiah(p.price)}</td>
                        <td className="p-4"><div className={cn("w-fit px-2 py-1 rounded text-xs font-bold", p.stock<5 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>{p.stock} unit</div></td>
                        <td className="p-4 pr-6 text-right gap-2 flex justify-end">
                           <button onClick={() => {setEditingProduct(p); setShowProductModal(true)}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                           <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {activeTab === "history" && (
           <div className="bg-white rounded-3xl border shadow-sm p-6">
              <h3 className="font-bold text-lg mb-6">Laporan Transaksi</h3>
              <div className="space-y-4">
                 {transactions.length === 0 && <div className="text-center py-10 text-gray-400 italic">Belum ada data penjualan</div>}
                 {transactions.map(t => (
                   <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition cursor-pointer" onClick={() => setShowReceipt(t)}>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border text-indigo-600"><Receipt size={18}/></div>
                         <div><p className="font-bold text-sm">{t.id}</p><p className="text-xs text-gray-500">{t.date}</p></div>
                      </div>
                      <div className="text-right"><p className="font-bold text-slate-800">{formatRupiah(t.finalTotal)}</p></div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* VIEW: SETTINGS */}
        {activeTab === "settings" && (
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                   <div><h3 className="font-bold text-indigo-600 flex items-center gap-2"><ShieldCheck size={20}/> Keamanan Aplikasi</h3></div>
                   <div className={cn("px-3 py-1 rounded-full text-xs font-bold", hasPin ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500")}>{hasPin ? "PIN Aktif" : "Tidak Ada PIN"}</div>
                 </div>
                 {hasPin ? (
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <p className="text-sm mb-3 font-medium">Keamanan PIN sedang aktif.</p>
                     <button onClick={handleRemovePin} className="text-red-600 text-sm font-bold hover:underline flex items-center gap-2"><Lock size={14}/> Hapus/Nonaktifkan PIN</button>
                   </div>
                 ) : (
                   <div className="flex gap-3 items-end">
                     <div className="flex-1"><label className="text-xs font-bold text-gray-500 block mb-2">Buat PIN Baru</label><input type="number" value={newPinInput} onChange={e => setNewPinInput(e.target.value)} placeholder="123456" className="w-full p-3 border rounded-xl bg-gray-50"/></div>
                     <button onClick={handleCreatePin} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg">Simpan</button>
                   </div>
                 )}
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                 <h3 className="font-bold mb-4 flex items-center gap-2"><Download size={20}/> Export Data</h3>
                 <button onClick={() => {
                    const headers = ["ID,Tanggal,Total,Item"];
                    const rows = transactions.map(t => `${t.id},${t.date},${t.finalTotal},"${t.items.map(i => `${i.name}(${i.qty})`).join('; ')}"`);
                    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
                    const link = document.createElement("a");
                    link.setAttribute("href", encodeURI(csvContent));
                    link.setAttribute("download", `laporan_samikstore.csv`);
                    document.body.appendChild(link);
                    link.click();
                 }} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 w-fit"><Download size={16}/> Download CSV</button>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                 <h3 className="font-bold mb-4 text-red-600 flex items-center gap-2"><AlertTriangle size={20}/> Reset Data</h3>
                 <button onClick={() => { if(confirm("Yakin reset data?")) { localStorage.clear(); window.location.reload(); } }} className="border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium">Reset Aplikasi</button>
              </div>
           </div>
        )}
      </main>

      {/* MOBILE NAV BAR */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t flex justify-around py-3 z-40 text-xs font-medium text-gray-400 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1", activeTab==='dashboard' && "text-indigo-600")}><LayoutDashboard size={20}/> <span className="text-[10px]">Home</span></button>
        <button onClick={() => setActiveTab('pos')} className={cn("flex flex-col items-center gap-1", activeTab==='pos' && "text-indigo-600")}><ShoppingBag size={20}/> <span className="text-[10px]">Kasir</span></button>
        <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1", activeTab==='history' && "text-indigo-600")}><History size={20}/> <span className="text-[10px]">Laporan</span></button>
        <button onClick={() => setActiveTab('inventory')} className={cn("flex flex-col items-center gap-1", activeTab==='inventory' && "text-indigo-600")}><Package size={20}/> <span className="text-[10px]">Stok</span></button>
        <button onClick={() => setActiveTab('settings')} className={cn("flex flex-col items-center gap-1", activeTab==='settings' && "text-indigo-600")}><Settings size={20}/> <span className="text-[10px]">Akun</span></button>
      </div>

      {/* MODAL: Product Edit */}
      {showProductModal && (
         <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95">
               <h3 className="font-bold text-lg mb-4">{editingProduct ? "Edit Produk" : "Tambah Produk"}</h3>
               <form onSubmit={saveProduct} className="space-y-3">
                  <input name="name" placeholder="Nama Produk" defaultValue={editingProduct?.name} required className="w-full p-3 border rounded-xl bg-gray-50"/>
                  <div className="flex gap-3">
                     <input name="price" type="number" placeholder="Harga" defaultValue={editingProduct?.price} required className="w-full p-3 border rounded-xl bg-gray-50"/>
                     <input name="stock" type="number" placeholder="Stok" defaultValue={editingProduct?.stock} required className="w-24 p-3 border rounded-xl bg-gray-50"/>
                  </div>
                  <input name="category" placeholder="Kategori (Mis: Makanan)" defaultValue={editingProduct?.category} required className="w-full p-3 border rounded-xl bg-gray-50"/>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                    <input name="image" placeholder="URL Gambar (Opsional)" defaultValue={editingProduct?.image} className="w-full pl-10 pr-3 py-3 border rounded-xl bg-gray-50 text-sm"/>
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Batal</button>
                     <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Simpan</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* MODAL: Receipt */}
      {showReceipt && (
         <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xs shadow-2xl animate-in zoom-in-95">
               <div className="bg-slate-900 text-white p-4 text-center rounded-t-sm"><h3 className="font-bold flex items-center justify-center gap-2"><Receipt size={16}/> Struk Digital</h3></div>
               <div className="p-6 bg-[#fffdf5] text-slate-800 font-mono text-xs leading-relaxed">
                  <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                     <p className="font-bold text-base uppercase tracking-widest mb-1">SAMIKSTORE</p>
                     <p className="text-gray-500">Cabang Utama - Jakarta</p>
                     <p className="text-gray-500 mt-1">{showReceipt.id} • {showReceipt.date}</p>
                  </div>
                  <div className="space-y-2 mb-4">
                     {showReceipt.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between"><span>{item.name} x{item.qty}</span><span>{formatRupiah(item.price * item.qty)}</span></div>
                     ))}
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
                     <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(showReceipt.rawTotal)}</span></div>
                     <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-300 mt-2"><span>TOTAL</span><span>{formatRupiah(showReceipt.finalTotal)}</span></div>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 mt-6">Simpan struk ini sebagai bukti pembayaran.</p>
               </div>
               <div className="p-3 bg-gray-100 flex gap-2 rounded-b-sm">
                  <button onClick={() => setShowReceipt(null)} className="flex-1 py-2 bg-white border shadow-sm rounded font-bold text-xs">Tutup</button>
                  <button onClick={() => window.print()} className="flex-1 py-2 bg-slate-900 text-white shadow-sm rounded font-bold text-xs flex items-center justify-center gap-2"><Printer size={14}/> Cetak</button>
               </div>
            </div>
         </div>
      )}

      {/* MOBILE FLOATING CART */}
      {activeTab === 'pos' && cart.length > 0 && (
         <button onClick={() => setIsMobileCartOpen(true)} className="md:hidden fixed bottom-20 left-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center z-50 animate-in slide-in-from-bottom">
            <div className="flex items-center gap-3"><div className="bg-indigo-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{cart.reduce((a,b)=>a+b.qty,0)}</div><span>Lihat Keranjang</span></div>
            <span className="font-bold">{formatRupiah(finalTotal)}</span>
         </button>
      )}

      {/* MOBILE CART SHEET */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-bottom">
           <div className="p-4 border-b flex items-center gap-3"><button onClick={() => setIsMobileCartOpen(false)}><ArrowLeft/></button><h2 className="font-bold">Pesanan Saat Ini</h2></div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map(item => (
                 <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                    <div><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-gray-500">{formatRupiah(item.price)} x {item.qty}</p></div>
                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg shadow-sm">
                       <button onClick={() => setCart(c => c.map(i => i.id===item.id ? {...i, qty: i.qty-1} : i).filter(i=>i.qty>0))}>-</button>
                       <span className="text-sm font-bold">{item.qty}</span>
                       <button onClick={() => addToCart(item)}>+</button>
                    </div>
                 </div>
              ))}
           </div>
           <div className="p-5 border-t bg-slate-50 space-y-3">
               <div className="flex justify-between items-center text-sm"><label>Pajak 11%</label><input type="checkbox" checked={taxRate > 0} onChange={(e) => setTaxRate(e.target.checked ? 0.11 : 0)} className="scale-125"/></div>
               <div className="flex justify-between items-center text-sm"><label>Diskon (Rp)</label><input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-24 p-1 border rounded text-right"/></div>
               <div className="flex justify-between font-bold text-xl pt-2 border-t"><span>Total</span><span>{formatRupiah(finalTotal)}</span></div>
               <button onClick={handleCheckout} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg">Bayar</button>
           </div>
        </div>
      )}
    </div>
  );
}

// Helper
const NavButton = ({active, icon, label, onClick}: any) => (
   <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group relative overflow-hidden", active ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
     <div className="relative z-10 flex items-center gap-3">{icon} {label}</div>
     {active && <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-400"/>}
   </button>
);
