"use client";
import React, { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ShoppingCart, BookOpen, CheckCircle, ArrowRight, Loader2, Minus, Plus, Zap, X, Code, Atom, Feather, Globe, Dna, Home, ChevronLeft, User, Trash2, BadgeCheck, Search, Star, Heart, Share2, Filter, Shield, MapPin, Headphones, Truck as TruckIcon, CreditCard as CreditCardIcon } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type Book = {
  id: number; title: string; price: number; digitalPrice: number;
  description: string; coverImage: string; category: string;
  rating?: number; reviews?: number; bestseller?: boolean; newArrival?: boolean;
};
type Format = "digital" | "physical";
type Step = "select" | "details" | "checkout" | "success" | "external" | "cart";
type CartItem = { bookId: number; title: string; format: Format; unitPrice: number; quantity: number; coverImage: string; };

const RUPEE_PRICE = 1;
const formatINR = (n: number) => `₹${Math.round(n)}`;

const BOOKS: Book[] = [
  { id: 1, title: "The Cosmic Voyager", price: 19.99, digitalPrice: 14.99, description: "An epic journey through undiscovered galaxies and the search for humanity's true home.", coverImage: "https://placehold.co/200x300/4f46e5/ffffff?text=Voyager", category: "Science & Tech", rating: 4.5, reviews: 234, bestseller: true },
  { id: 2, title: "Quantum Computing for Cats", price: 29.99, digitalPrice: 22.99, description: "A surprisingly accessible guide to superposition and entanglement.", coverImage: "https://placehold.co/200x300/047857/ffffff?text=Quantum+Cats", category: "Science & Tech", rating: 4.8, reviews: 567, bestseller: true },
  { id: 3, title: "History of the Internet", price: 15.0, digitalPrice: 11.0, description: "A satirical look at the rise of the digital age.", coverImage: "https://placehold.co/200x300/e11d48/ffffff?text=Internet", category: "History & Lore", rating: 4.2, reviews: 189 },
  { id: 4, title: "The Silent Gardener", price: 12.5, digitalPrice: 8.99, description: "A meditative study on urban permaculture.", coverImage: "https://placehold.co/200x300/fbbf24/000000?text=Gardener", category: "Life & Culture", rating: 4.6, reviews: 312, newArrival: true },
  { id: 5, title: "The Silicon Shepherd", price: 17.5, digitalPrice: 10.99, description: "A novel about AI and finding humanity in code.", coverImage: "https://placehold.co/200x300/3b82f6/ffffff?text=AI", category: "Science & Tech", rating: 4.4, reviews: 445 },
  { id: 6, title: "Atlas of Lost Cities", price: 35.0, digitalPrice: 28.0, description: "A photographic journey through forgotten urban centers.", coverImage: "https://placehold.co/200x300/44403c/ffffff?text=Lost+Cities", category: "History & Lore", rating: 4.7, reviews: 278, bestseller: true },
  { id: 7, title: "Zero Gravity Kitchen", price: 18.0, digitalPrice: 12.5, description: "Recipes for a future in space colonization.", coverImage: "https://placehold.co/200x300/6b7280/ffffff?text=Space+Food", category: "Fantasy & Fiction", rating: 4.3, reviews: 156 },
  { id: 8, title: "The Fifth Dimension Theory", price: 22.99, digitalPrice: 17.99, description: "A non-fiction deep dive into theoretical physics.", coverImage: "https://placehold.co/200x300/7e22ce/ffffff?text=Dimension+5", category: "Science & Tech", rating: 4.9, reviews: 623, bestseller: true },
  { id: 9, title: "Midnight at the Lighthouse", price: 14.99, digitalPrice: 9.99, description: "A thrilling mystery set on a remote coastline.", coverImage: "https://placehold.co/200x300/0891b2/ffffff?text=Lighthouse", category: "Fantasy & Fiction", rating: 4.5, reviews: 398, newArrival: true },
  { id: 10, title: "The Art of Minimalist Living", price: 11.99, digitalPrice: 7.99, description: "Practical guide to decluttering your life and mind.", coverImage: "https://placehold.co/200x300/d97706/ffffff?text=Minimalist", category: "Life & Culture", rating: 4.6, reviews: 521 },
];

const CATEGORIES = [
  { name: "All Books", color: "bg-gray-600", icon: BookOpen },
  { name: "Science & Tech", color: "bg-blue-600", icon: Code },
  { name: "Fantasy & Fiction", color: "bg-purple-600", icon: Feather },
  { name: "Life & Culture", color: "bg-green-600", icon: Globe },
  { name: "History & Lore", color: "bg-amber-600", icon: Atom },
  { name: "Hard Science", color: "bg-red-600", icon: Dna },
];

type ButtonProps = { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; icon?: LucideIcon; variant?: "primary" | "secondary" | "outline"; size?: "sm" | "md" | "lg"; };
const Button = ({ children, onClick, disabled = false, className = "", icon: Icon, variant = "primary", size = "md" }: ButtonProps) => {
  const baseStyles = "flex items-center justify-center font-semibold rounded-lg transition-all duration-200";
  const variants = { primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg", secondary: "bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg", outline: "border-2 border-gray-300 hover:border-gray-400 text-gray-700 bg-white hover:bg-gray-50" };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base" };
  const disabledStyles = disabled ? "bg-gray-300 cursor-not-allowed text-gray-500 shadow-none" : "";
  return (<button type="button" onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}>{Icon ? <Icon className="w-4 h-4 mr-2" /> : null}{children}</button>);
};

const RatingStars = ({ rating, reviews }: { rating: number; reviews: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`w-4 h-4 ${star <= Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />))}
    <span className="text-sm text-gray-600 ml-1">{rating}</span>
    <span className="text-sm text-gray-500 ml-1">({reviews} reviews)</span>
  </div>
);

const QuantitySelector = ({ quantity, onChange, size = "md" }: { quantity: number; onChange: (newQty: number) => void; size?: "sm" | "md"; }) => {
  const sizes = { sm: "p-0.5 w-7", md: "p-1 w-9" };
  return (<div className={`flex items-center border border-gray-300 rounded-lg ${sizes[size]}`}>
    <button type="button" onClick={() => onChange(Math.max(1, quantity - 1))} className={`${sizes[size]} flex items-center justify-center rounded hover:bg-gray-100 transition text-gray-700`}><Minus className="w-3 h-3" /></button>
    <span className={`${size === "md" ? "w-8 text-base" : "w-6 text-sm"} text-center font-semibold text-gray-800`}>{quantity}</span>
    <button type="button" onClick={() => onChange(quantity + 1)} className={`${sizes[size]} flex items-center justify-center rounded hover:bg-gray-100 transition text-gray-700`}><Plus className="w-3 h-3" /></button>
  </div>);
};

type BookGridItemProps = { book: Book; onSelect: (book: Book) => void; onQuickAdd: (book: Book) => void; };
const BookGridItem = ({ book, onSelect, onQuickAdd }: BookGridItemProps) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group border border-gray-200 hover:border-orange-300 hover:-translate-y-1 cursor-pointer" onClick={() => onSelect(book)}>
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
      {book.bestseller && <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">#1 Bestseller</span>}
      {book.newArrival && <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">New Arrival</span>}
    </div>
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button type="button" onClick={(e) => { e.stopPropagation(); }} className="bg-white/90 backdrop-blur p-2 rounded-full shadow-md hover:bg-gray-100 transition" title="Add to Wishlist"><Heart className="w-4 h-4 text-gray-600" /></button>
      <button type="button" onClick={(e) => { e.stopPropagation(); }} className="bg-white/90 backdrop-blur p-2 rounded-full shadow-md hover:bg-gray-100 transition" title="Share"><Share2 className="w-4 h-4 text-gray-600" /></button>
    </div>
    <div className="p-4 flex flex-col h-full">
      <div className="relative w-full aspect-[2/3] mb-4 overflow-hidden rounded-lg bg-gray-100">
        <img src={book.coverImage} alt={`Cover of ${book.title}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="flex-1 flex flex-col">
        <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">{book.category}</p>
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">{book.title}</h3>
        {book.rating && book.reviews && <RatingStars rating={book.rating} reviews={book.reviews} />}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">{formatINR(RUPEE_PRICE)}</span>
            <span className="text-sm text-gray-500 line-through">{formatINR(book.price)}</span>
          </div>
          <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />In Stock</p>
        </div>
      </div>
    </div>
    <div className="p-4 pt-0">
      <button type="button" onClick={(e) => { e.stopPropagation(); onQuickAdd(book); }} className="w-full py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm transition shadow-sm hover:shadow-md">Add to Cart</button>
    </div>
  </div>
);

type BookDetailModalProps = { book: Book; initialQuantity: number; initialFormat: Format; onProceed: (book: Book, format: Format, quantity: number) => void; onClose: () => void; onHome: () => void; onAddToCart: (item: CartItem) => void; };
const BookDetailModal = ({ book, initialQuantity, initialFormat, onProceed, onClose, onHome, onAddToCart }: BookDetailModalProps) => {
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [format, setFormat] = useState<Format>(initialFormat);
  const isPhysical = format === "physical";
  const currentPrice = RUPEE_PRICE * quantity;

  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={onHome} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"><Home className="w-4 h-4" /><span className="hidden sm:inline font-medium text-sm">Home</span></button>
            <div><h2 className="text-xl font-bold text-gray-900">{book.title}</h2><p className="text-sm text-gray-500">{book.category}</p></div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition"><X className="w-6 h-6 text-gray-500" /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gray-100 shadow-lg"><img src={book.coverImage} alt={`Cover of ${book.title}`} className="w-full h-full object-cover" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><Shield className="w-5 h-5 text-green-600" /><span className="text-xs text-gray-600">Secure<br/>Checkout</span></div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><TruckIcon className="w-5 h-5 text-blue-600" /><span className="text-xs text-gray-600">Fast<br/>Delivery</span></div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"><Headphones className="w-5 h-5 text-purple-600" /><span className="text-xs text-gray-600">24/7<br/>Support</span></div>
              </div>
            </div>
            <div className="space-y-6">
              {book.rating && book.reviews && <RatingStars rating={book.rating} reviews={book.reviews} />}
              <div className="border-b pb-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900">{formatINR(currentPrice)}</span>
                  <span className="text-lg text-gray-500 line-through">{formatINR(book.price * quantity)}</span>
                  <span className="text-sm text-green-600 font-medium">Save {formatINR(book.price * quantity - currentPrice)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Inclusive of all taxes</p>
              </div>
              <div><h3 className="font-semibold text-gray-900 mb-2">Description</h3><p className="text-gray-600 leading-relaxed">{book.description}</p></div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Choose Format</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setFormat("digital")} className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${!isPhysical ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                    <div className="flex items-center gap-2 mb-2"><Zap className={`w-5 h-5 ${!isPhysical ? "text-orange-500" : "text-gray-400"}`} /><span className={`font-semibold ${!isPhysical ? "text-gray-900" : "text-gray-700"}`}>E-book</span>{!isPhysical && <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Best Value</span>}</div>
                    <p className="text-sm text-gray-500">Instant download</p><p className="text-xl font-bold text-gray-900 mt-2">{formatINR(RUPEE_PRICE)}</p>
                  </button>
                  <button type="button" onClick={() => setFormat("physical")} className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${isPhysical ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                    <div className="flex items-center gap-2 mb-2"><TruckIcon className={`w-5 h-5 ${isPhysical ? "text-orange-500" : "text-gray-400"}`} /><span className={`font-semibold ${isPhysical ? "text-gray-900" : "text-gray-700"}`}>Physical Book</span></div>
                    <p className="text-sm text-gray-500">Free shipping</p><p className="text-xl font-bold text-gray-900 mt-2">{formatINR(RUPEE_PRICE)}</p>
                  </button>
                </div>
              </div>
              <div><h3 className="font-semibold text-gray-900 mb-3">Quantity</h3><QuantitySelector quantity={quantity} onChange={setQuantity} size="md" /></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => onAddToCart({ bookId: book.id, title: book.title, format, unitPrice: RUPEE_PRICE, quantity, coverImage: book.coverImage })} icon={ShoppingCart} variant="secondary" className="py-3">Add to Cart</Button>
                  <Button onClick={() => onProceed(book, format, quantity)} icon={ArrowRight} className="py-3">{isPhysical ? "Buy Now" : "Buy E-book"}</Button>
                </div>
                <button type="button" onClick={onClose} className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition">Continue Shopping</button>
              </div>
              {isPhysical && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="w-4 h-4" /><span>Delivery to <strong>Your Location</strong> - 2-3 business days</span></div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Shield className="w-4 h-4" /><span>7-day replacement policy</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type DigitalPaymentProps = { title: string; amount: number; onPaymentSuccess: () => void; onBackToCartOrModal: () => void; items: { title: string; quantity: number }[]; };
const DigitalPayment = ({ title, amount, onPaymentSuccess, onBackToCartOrModal, items }: DigitalPaymentProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const handlePayment = async () => {
    if (!items || items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/create-checkout-session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.detail || "Failed to create checkout session"); }
      const data = await res.json();
      if (!data?.url) throw new Error("Missing checkout url from backend");
      window.location.href = data.url;
    } catch (e) { console.error(e); setLoading(false); alert("Payment failed. Check backend."); }
  };
  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2"><Shield className="w-6 h-6" /><h2 className="text-xl font-bold">Secure Checkout</h2></div>
        <p className="text-orange-100 text-sm">Complete your purchase securely</p>
      </div>
      <div className="p-6">
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {items.map((item, idx) => (<div key={idx} className="flex justify-between text-gray-600"><span>{item.title} x{item.quantity}</span><span>{formatINR(RUPEE_PRICE * item.quantity)}</span></div>))}
            <div className="border-t pt-2 flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatINR(amount)}</span></div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
          <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3"><CreditCardIcon className="w-8 h-8 text-gray-400" /><div><p className="font-medium text-gray-900">Stripe Checkout</p><p className="text-sm text-gray-500">Credit/Debit Card, UPI, Net Banking</p></div></div>
        </div>
        <p className="text-sm text-gray-500 mb-6">You will be redirected to Stripe's secure checkout page.</p>
        <div className="flex gap-3">
          <Button onClick={onBackToCartOrModal} variant="outline" disabled={loading} className="flex-1"><ChevronLeft className="w-4 h-4 mr-2" />Back</Button>
          <Button onClick={handlePayment} disabled={loading} className="flex-1 py-3">{loading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</>) : (<><Shield className="w-4 h-4 mr-2" />Pay {formatINR(amount)}</>)}</Button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400"><span className="flex items-center gap-1"><Shield className="w-3 h-3" />SSL Secured</span><span className="flex items-center gap-1"><CreditCardIcon className="w-3 h-3" />PCI Compliant</span></div>
      </div>
    </div>
  );
};

const SuccessView = ({ message, onStartOver }: { message: string; onStartOver: () => void; }) => (
  <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center"><CheckCircle className="w-16 h-16 mx-auto mb-4" /><h2 className="text-2xl font-bold">Order Confirmed!</h2></div>
    <div className="p-6 text-center"><p className="text-gray-600 mb-6">{message}</p><div className="bg-green-50 rounded-xl p-4 mb-6"><p className="text-sm text-green-700">A confirmation email has been sent to your registered email address.</p></div><Button onClick={onStartOver} icon={ArrowRight} className="w-auto px-8">Continue Shopping</Button></div>
  </div>
);

const ExternalRedirectView = ({ title, amount, onStartOver }: { title: string; amount: number; onStartOver: () => void; }) => (
  <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white"><TruckIcon className="w-12 h-12 mb-3" /><h2 className="text-xl font-bold">Physical Order Confirmed</h2></div>
    <div className="p-6"><div className="bg-gray-50 rounded-xl p-4 mb-6"><p className="text-gray-600 mb-1">{title}</p><p className="text-3xl font-bold text-gray-900">{formatINR(amount)}</p></div><p className="text-gray-600 mb-6">To complete your physical order, you'll be redirected to our shipping partner.</p><a href="https://www.google.com/search?q=shipping+partner" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-md hover:shadow-lg mb-4"><TruckIcon className="w-5 h-5" />Proceed to Shipping Portal</a><Button onClick={onStartOver} variant="outline" className="w-full"><Home className="w-4 h-4 mr-2" />Back to Store</Button></div>
  </div>
);

type CartPageProps = { cart: CartItem[]; onBack: () => void; onUpdateQty: (bookId: number, format: Format, qty: number) => void; onRemove: (bookId: number, format: Format) => void; onClear: () => void; onBuy: () => void; buyDisabled: boolean; };
const CartPage = ({ cart, onBack, onUpdateQty, onRemove, onClear, onBuy, buyDisabled }: CartPageProps) => {
  const total = useMemo(() => cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [cart]);
  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><button type="button" onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition"><ChevronLeft className="w-5 h-5 text-gray-600" /></button><h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-orange-500" />Shopping Cart</h2></div>
        {cart.length > 0 && <button type="button" onClick={onClear} className="text-sm text-red-600 hover:text-red-700 font-medium">Clear Cart</button>}
      </div>
      {cart.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center"><ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3><p className="text-gray-500 mb-6">Looks like you haven't added any books yet.</p><Button onClick={onBack} icon={ArrowRight}>Continue Shopping</Button></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={`${item.bookId}-${item.format}`} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 border border-gray-100">
                <img src={item.coverImage} alt={item.title} className="w-20 h-28 object-cover rounded-lg" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 capitalize">{item.format}</p>
                  <div className="flex items-center gap-4 mt-2"><span className="text-xl font-bold text-gray-900">{formatINR(item.unitPrice * item.quantity)}</span><span className="text-sm text-gray-500 line-through">{formatINR(item.unitPrice * 5 * item.quantity)}</span><span className="text-xs text-green-600 font-medium">Save {formatINR(item.unitPrice * 4 * item.quantity)}</span></div>
                  <div className="flex items-center justify-between mt-3">
                    <QuantitySelector quantity={item.quantity} onChange={(q) => onUpdateQty(item.bookId, item.format, q)} size="sm" />
                    <button type="button" onClick={() => onRemove(item.bookId, item.format)} className="text-sm text-gray-500 hover:text-red-600 font-medium flex items-center gap-1"><Trash2 className="w-4 h-4" />Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between text-gray-600"><span>Subtotal ({cart.length} items)</span><span>{formatINR(total)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-green-600">FREE</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax</span><span>₹0</span></div>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 mb-6"><span>Total</span><span>{formatINR(total)}</span></div>
              <Button onClick={onBuy} disabled={buyDisabled} className="w-full py-3" icon={BadgeCheck}>Proceed to Checkout</Button>
              <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1"><Shield className="w-3 h-3" />Secure checkout powered by Stripe</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StorePage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [step, setStep] = useState<Step>("select");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Books");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastModalQuantity, setLastModalQuantity] = useState<number>(1);
  const [lastModalFormat, setLastModalFormat] = useState<Format>("digital");
  const [checkoutTitle, setCheckoutTitle] = useState<string>("");
  const [checkoutAmount, setCheckoutAmount] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [checkoutItems, setCheckoutItems] = useState<{ title: string; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const filteredBooks = useMemo(() => {
    let books = selectedCategory === "All Books" ? BOOKS : BOOKS.filter((book) => book.category === selectedCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      books = books.filter(book => book.title.toLowerCase().includes(query) || book.description.toLowerCase().includes(query) || book.category.toLowerCase().includes(query));
    }
    return books;
  }, [selectedCategory, searchQuery]);

  const handleSelectBook = (book: Book) => { setSelectedBook(book); setStep("details"); };

  const handleQuickAdd = (book: Book) => {
    const item: CartItem = { bookId: book.id, title: book.title, format: "digital", unitPrice: RUPEE_PRICE, quantity: 1, coverImage: book.coverImage };
    setCart((prev) => { const idx = prev.findIndex((p) => p.bookId === item.bookId && p.format === item.format); if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity }; return copy; } return [...prev, item]; });
  };

  const handleProceedFromModal = (book: Book, format: Format, quantity: number) => {
    setSelectedBook(book); setLastModalQuantity(quantity); setLastModalFormat(format); setSelectedQuantity(quantity);
    const total = RUPEE_PRICE * quantity;
    setCheckoutTitle(`Order: ${book.title} (x${quantity})`);
    setCheckoutAmount(total);
    setCheckoutItems([{ title: `${book.title} (${format})`, quantity }]);
    if (format === "digital") { setSuccessMessage(`Your digital copy of "${book.title}" has been processed successfully.`); setStep("checkout"); } else { setStep("external"); }
  };

  const handleStartOver = () => { setSelectedBook(null); setSelectedQuantity(1); setLastModalQuantity(1); setLastModalFormat("digital"); setCheckoutTitle(""); setCheckoutAmount(0); setSuccessMessage(""); setCheckoutItems([]); setStep("select"); };
  const handleCloseModal = () => { setSelectedBook(null); setStep("select"); };
  const handleUpdateCartQty = (bookId: number, format: Format, qty: number) => { setCart((prev) => prev.map((i) => i.bookId === bookId && i.format === format ? { ...i, quantity: qty } : i)); };
  const handleRemoveCartItem = (bookId: number, format: Format) => { setCart((prev) => prev.filter((i) => !(i.bookId === bookId && i.format === format))); };
  const handleClearCart = () => setCart([]);
  const handleBuyCart = () => {
    if (cart.length === 0) return;
    const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
    const total = RUPEE_PRICE * totalQty;
    setCheckoutTitle(`Cart Purchase (${cart.length} item${cart.length > 1 ? "s" : ""})`);
    setCheckoutAmount(total);
    setCheckoutItems(cart.map((i) => ({ title: `${i.title} (${i.format})`, quantity: i.quantity })));
    const hasPhysical = cart.some((i) => i.format === "physical");
    if (hasPhysical) { setStep("external"); } else { setSuccessMessage("Your cart digital order has been processed successfully."); setStep("checkout"); }
  };

  const renderCategorySelector = () => (
    <div className="mb-8">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const isActive = cat.name === selectedCategory;
          const Icon = cat.icon;
          return (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`flex-shrink-0 flex flex-col items-center py-3 px-5 rounded-xl transition-all duration-200 ${isActive ? "bg-orange-50 ring-2 ring-orange-300" : "hover:bg-gray-100 bg-white border border-gray-200"}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${cat.color} text-white shadow-sm ${isActive ? "ring-2 ring-orange-200" : ""}`}><Icon className="w-6 h-6" /></div>
              <span className={`text-xs font-medium text-center ${isActive ? "text-orange-700" : "text-gray-600"}`}>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    if (step === "cart") return <CartPage cart={cart} onBack={() => setStep("select")} onUpdateQty={handleUpdateCartQty} onRemove={handleRemoveCartItem} onClear={handleClearCart} onBuy={handleBuyCart} buyDisabled={cart.length === 0} />;
    if (step === "select") {
      return (
        <div className="pb-12">
          {renderCategorySelector()}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredBooks.map((book) => (<BookGridItem key={book.id} book={book} onSelect={handleSelectBook} onQuickAdd={handleQuickAdd} />))}
            </div>
          ) : (
            <div className="text-center py-16"><Search className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3><p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p><Button onClick={() => { setSearchQuery(""); setSelectedCategory("All Books"); }} variant="outline">Clear Filters</Button></div>
          )}
        </div>
      );
    }
    if (step === "checkout") return (<div className="flex justify-center items-start min-h-[70vh] pt-12 px-4"><DigitalPayment title={checkoutTitle} amount={checkoutAmount} items={checkoutItems} onBackToCartOrModal={() => setStep("cart")} onPaymentSuccess={() => { setCart([]); setStep("success"); }} /></div>);
    if (step === "success") return (<div className="flex justify-center items-start min-h-[70vh] pt-12 px-4"><SuccessView message={successMessage} onStartOver={handleStartOver} /></div>);
    if (step === "external") return (<div className="flex justify-center items-start min-h-[70vh] pt-12 px-4"><ExternalRedirectView title={checkoutTitle} amount={checkoutAmount} onStartOver={() => { setCart([]); handleStartOver(); }} /></div>);
    return null;
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => { setStep("select"); setSearchQuery(""); }}>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
              <div className="hidden sm:block"><h1 className="text-lg font-bold text-gray-900 leading-none">BookStore</h1><p className="text-xs text-gray-500">Your favorite reads</p></div>
            </div>
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search books, authors, categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg transition"><Search className="w-4 h-4 text-white" /></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setStep("cart")} className="relative p-2 rounded-full hover:bg-gray-100 transition" title="Cart"><ShoppingCart className="w-6 h-6 text-gray-700" />{cartCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">{cartCount}</span>)}</button>
              <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition" title="User"><User className="w-6 h-6 text-gray-700" /></button>
            </div>
          </div>
          <div className="flex items-center gap-6 py-2 text-sm border-t border-gray-100">
            <button type="button" className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition"><Filter className="w-4 h-4" /><span>All Categories</span></button>
            <button type="button" className="text-gray-600 hover:text-orange-600 transition">Today's Deals</button>
            <button type="button" className="text-gray-600 hover:text-orange-600 transition">Bestsellers</button>
            <button type="button" className="text-gray-600 hover:text-orange-600 transition hidden sm:inline">New Arrivals</button>
            <button type="button" className="text-gray-600 hover:text-orange-600 transition hidden sm:inline">Gift Cards</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {step === "select" && (<div className="mb-6"><div className="flex items-center gap-2 text-sm text-gray-500 mb-4"><span className="hover:text-orange-600 cursor-pointer transition" onClick={() => { setStep("select"); setSearchQuery(""); }}>Home</span><ChevronLeft className="w-4 h-4" /><span className="font-medium text-gray-900">{selectedCategory}</span></div></div>)}
        {renderContent()}
        {selectedBook && step === "details" && (<BookDetailModal book={selectedBook} initialQuantity={lastModalQuantity} initialFormat={lastModalFormat} onProceed={handleProceedFromModal} onClose={handleCloseModal} onHome={handleStartOver} onAddToCart={(item) => setCart((prev) => { const idx = prev.findIndex((p) => p.bookId === item.bookId && p.format === item.format); if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity }; return copy; } return [...prev, item]; })} />)}
      </main>
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div><h4 className="text-white font-semibold mb-4">Get to Know Us</h4><ul className="space-y-2 text-sm"><li><a href="#" className="hover:text-white transition">About Us</a></li><li><a href="#" className="hover:text-white transition">Careers</a></li><li><a href="#" className="hover:text-white transition">Press Releases</a></li></ul></div>
            <div><h4 className="text-white font-semibold mb-4">Connect with Us</h4><ul className="space-y-2 text-sm"><li><a href="#" className="hover:text-white transition">Facebook</a></li><li><a href="#" className="hover:text-white transition">Twitter</a></li><li><a href="#" className="hover:text-white transition">Instagram</a></li></ul></div>
            <div><h4 className="text-white font-semibold mb-4">Make Money with Us</h4><ul className="space-y-2 text-sm"><li><a href="#" className="hover:text-white transition">Sell on BookStore</a></li><li><a href="#" className="hover:text-white transition">Become an Affiliate</a></li><li><a href="#" className="hover:text-white transition">Advertise Your Books</a></li></ul></div>
            <div><h4 className="text-white font-semibold mb-4">Let Us Help You</h4><ul className="space-y-2 text-sm"><li><a href="#" className="hover:text-white transition">Help Center</a></li><li><a href="#" className="hover:text-white transition">Returns</a></li><li><a href="#" className="hover:text-white transition">Contact Us</a></li></ul></div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center"><p>© 2024 BookStore. All rights reserved.</p></div>
        </div>
      </footer>
    </div>
  );
}
