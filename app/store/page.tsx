"use client";
import React, { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ShoppingCart,
  BookOpen,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Loader2,
  Minus,
  Plus,
  Zap,
  X,
  Code,
  Atom,
  Feather,
  Globe,
  Dna,
  Home,
  ChevronLeft,
  User,
  Trash2,
  BadgeCheck,
} from "lucide-react";

// ---------- Types ----------
type Book = {
  id: number;
  title: string;
  price: number;
  digitalPrice: number;
  description: string;
  coverImage: string;
  category: string;
};

type Format = "digital" | "physical";
type Step = "select" | "details" | "checkout" | "success" | "external" | "cart";

type CartItem = {
  bookId: number;
  title: string;
  format: Format;
  unitPrice: number;
  quantity: number;
  coverImage: string;
};

// ---------- Book Data ----------
const BOOKS: Book[] = [
  {
    id: 1,
    title: "The Cosmic Voyager",
    price: 19.99,
    digitalPrice: 14.99,
    description:
      "An epic journey through undiscovered galaxies and the search for humanity's true home.",
    coverImage: "https://placehold.co/150x225/4f46e5/ffffff?text=Voyager",
    category: "Science & Tech",
  },
  {
    id: 2,
    title: "Quantum Computing for Cats",
    price: 29.99,
    digitalPrice: 22.99,
    description:
      "A surprisingly accessible guide to superposition and entanglement, explained with cat analogies.",
    coverImage: "https://placehold.co/150x225/047857/ffffff?text=Quantum+Cats",
    category: "Science & Tech",
  },
  {
    id: 3,
    title: "History of the Internet (Abridged)",
    price: 15.0,
    digitalPrice: 11.0,
    description:
      "A satirical, yet informative, look at the rise of the digital age, from ARPANET to modern memes.",
    coverImage:
      "https://placehold.co/150x225/e11d48/ffffff?text=Internet+History",
    category: "History & Lore",
  },
  {
    id: 4,
    title: "The Silent Gardener",
    price: 12.5,
    digitalPrice: 8.99,
    description:
      "A meditative study on urban permaculture and finding peace through nature in concrete jungles.",
    coverImage: "https://placehold.co/150x225/fbbf24/000000?text=Gardener",
    category: "Life & Culture",
  },
  {
    id: 5,
    title: "The Silicon Shepherd",
    price: 17.5,
    digitalPrice: 10.99,
    description: "A novel about AI and finding humanity in code.",
    coverImage: "https://placehold.co/150x225/3b82f6/ffffff?text=AI+Shepherd",
    category: "Science & Tech",
  },
  {
    id: 6,
    title: "Atlas of Lost Cities",
    price: 35.0,
    digitalPrice: 28.0,
    description: "A photographic journey through forgotten urban centers.",
    coverImage: "https://placehold.co/150x225/44403c/ffffff?text=Lost+Cities",
    category: "History & Lore",
  },
  {
    id: 7,
    title: "Zero Gravity Kitchen",
    price: 18.0,
    digitalPrice: 12.5,
    description: "Recipes for a future in space colonization.",
    coverImage: "https://placehold.co/150x225/6b7280/ffffff?text=Space+Food",
    category: "Fantasy & Fiction",
  },
  {
    id: 8,
    title: "The Fifth Dimension Theory",
    price: 22.99,
    digitalPrice: 17.99,
    description: "A non-fiction deep dive into theoretical physics.",
    coverImage: "https://placehold.co/150x225/7e22ce/ffffff?text=Dimension+5",
    category: "Science & Tech",
  },
  {
    id: 9,
    title: "Midnight at the Lighthouse",
    price: 14.99,
    digitalPrice: 9.99,
    description: "A thrilling mystery set on a remote coastline.",
    coverImage: "https://placehold.co/150x225/0891b2/ffffff?text=Lighthouse",
    category: "Fantasy & Fiction",
  },
  {
    id: 10,
    title: "The Art of Minimalist Living",
    price: 11.99,
    digitalPrice: 7.99,
    description: "Practical guide to decluttering your life and mind.",
    coverImage: "https://placehold.co/150x225/d97706/ffffff?text=Minimalist",
    category: "Life & Culture",
  },
  {
    id: 11,
    title: "Global Warming: The Next 100 Years",
    price: 32.0,
    digitalPrice: 25.0,
    description: "Data-driven projection on climate change impact.",
    coverImage: "https://placehold.co/150x225/b91c1c/ffffff?text=Warming",
    category: "Hard Science",
  },
  {
    id: 12,
    title: "The Dragon's Calculator",
    price: 16.5,
    digitalPrice: 11.5,
    description: "A fantasy tale involving magical mathematics.",
    coverImage: "https://placehold.co/150x225/ec4899/ffffff?text=Dragon+Calc",
    category: "Fantasy & Fiction",
  },
  {
    id: 13,
    title: "Learning Rust in 7 Days",
    price: 40.0,
    digitalPrice: 33.0,
    description: "An intensive programming language tutorial.",
    coverImage: "https://placehold.co/150x225/ea580c/ffffff?text=Rust+Book",
    category: "Science & Tech",
  },
  {
    id: 14,
    title: "Whispers of the Old Gods",
    price: 13.99,
    digitalPrice: 8.99,
    description: "Collection of ancient myths and folklore.",
    coverImage: "https://placehold.co/150x225/713f12/ffffff?text=Old+Gods",
    category: "History & Lore",
  },
  {
    id: 15,
    title: "Martian Agriculture Handbook",
    price: 25.0,
    digitalPrice: 19.5,
    description: "Scientific guide to farming on Mars.",
    coverImage: "https://placehold.co/150x225/991b1b/ffffff?text=Martian+Farm",
    category: "Hard Science",
  },
  {
    id: 16,
    title: "Tokyo Dreams, Kyoto Nights",
    price: 19.0,
    digitalPrice: 13.5,
    description: "A travel memoir exploring Japan's duality.",
    coverImage: "https://placehold.co/150x225/c026d3/ffffff?text=Tokyo",
    category: "Life & Culture",
  },
  {
    id: 17,
    title: "The Algorithm of Happiness",
    price: 21.0,
    digitalPrice: 15.0,
    description: "Philosophical inquiry into data and well-being.",
    coverImage: "https://placehold.co/150x225/84cc16/ffffff?text=Algorithm",
    category: "Life & Culture",
  },
  {
    id: 18,
    title: "Deep Sea Secrets",
    price: 27.99,
    digitalPrice: 20.99,
    description: "Exploration of the ocean's unexplored trenches.",
    coverImage: "https://placehold.co/150x225/1e3a8a/ffffff?text=Deep+Sea",
    category: "Hard Science",
  },
  {
    id: 19,
    title: "Post-Apocalypse Prep Guide",
    price: 10.5,
    digitalPrice: 6.5,
    description: "Survival tips for the inevitable future.",
    coverImage: "https://placehold.co/150x225/000000/ffffff?text=Prep+Guide",
    category: "Fantasy & Fiction",
  },
  {
    id: 20,
    title: "The History of Coffee Beans",
    price: 17.0,
    digitalPrice: 11.5,
    description: "A definitive guide from crop to cup.",
    coverImage: "https://placehold.co/150x225/92400e/ffffff?text=Coffee+History",
    category: "History & Lore",
  },
];

const CATEGORIES = [
  { name: "All Books", color: "bg-gray-500", icon: BookOpen },
  { name: "Science & Tech", color: "bg-indigo-600", icon: Code },
  { name: "Fantasy & Fiction", color: "bg-purple-600", icon: Feather },
  { name: "Life & Culture", color: "bg-emerald-600", icon: Globe },
  { name: "History & Lore", color: "bg-amber-600", icon: Atom },
  { name: "Hard Science", color: "bg-red-600", icon: Dna },
];

// ---------- UI Components ----------
type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  icon?: LucideIcon;
};

const Button = ({
  children,
  onClick,
  disabled = false,
  className = "",
  icon: Icon,
}: ButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-md font-semibold rounded-lg shadow-md transition duration-150 ease-in-out 
      ${
        disabled
          ? "bg-gray-300 cursor-not-allowed text-gray-500 shadow-none"
          : "bg-indigo-700 hover:bg-indigo-800 text-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300"
      }
      ${className}`}
  >
    {Icon ? <Icon className="w-4 h-4 mr-2" /> : null}
    {children}
  </button>
);

type QuantitySelectorProps = {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
};

const QuantitySelector = ({ quantity, setQuantity }: QuantitySelectorProps) => (
  <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1 w-28 mx-auto">
    <button
      type="button"
      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
      className="p-1 text-gray-700 hover:bg-gray-100 rounded-md transition"
    >
      <Minus className="w-4 h-4" />
    </button>
    <span className="font-semibold w-8 text-center text-gray-800">
      {quantity}
    </span>
    <button
      type="button"
      onClick={() => setQuantity((q) => q + 1)}
      className="p-1 text-gray-700 hover:bg-gray-100 rounded-md transition"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

// ---------- Book Card ----------
type BookGridItemProps = {
  book: Book;
  onSelect: (book: Book) => void;
  onQuickAdd: (book: Book) => void;
};

const BookGridItem = ({ book, onSelect, onQuickAdd }: BookGridItemProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-5 flex flex-col h-full group border border-gray-200 hover:border-indigo-300 transform hover:-translate-y-1">
      <div
        className="cursor-pointer"
        onClick={() => onSelect(book)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSelect(book);
        }}
      >
        <img
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          className="w-full h-64 max-w-[200px] mx-auto rounded-lg shadow-lg mb-4 flex-shrink-0 object-cover group-hover:scale-[1.05] transition-transform duration-300"
        />
        <div className="text-center mt-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-sm text-gray-500 mb-4">{book.category}</p>

          <div className="flex justify-around items-center mb-4">
            <div className="text-left">
              <p className="text-xs font-medium text-gray-500">Hardcover</p>
              <span className="text-xl font-black text-indigo-700">
                ${book.price.toFixed(2)}
              </span>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="text-left">
              <p className="text-xs font-medium text-gray-500">E-book</p>
              <span className="text-xl font-black text-gray-500">
                ${book.digitalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t pt-3 border-gray-100 grid grid-cols-2 gap-3">
        <Button onClick={() => onSelect(book)} icon={ShoppingCart}>
          Select
        </Button>
        <button
          type="button"
          onClick={() => onQuickAdd(book)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 font-semibold shadow-sm hover:bg-gray-50 transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

// ---------- Book Detail Modal ----------
type BookDetailModalProps = {
  book: Book;
  initialQuantity: number;
  initialFormat: Format;
  onProceed: (book: Book, format: Format, quantity: number) => void;
  onClose: () => void;
  onHome: () => void;
  onAddToCart: (item: CartItem) => void;
};

const BookDetailModal = ({
  book,
  initialQuantity,
  initialFormat,
  onProceed,
  onClose,
  onHome,
  onAddToCart,
}: BookDetailModalProps) => {
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [format, setFormat] = useState<Format>(initialFormat);

  const isPhysical = format === "physical";
  const unitPrice = isPhysical ? book.price : book.digitalPrice;
  const currentPrice = unitPrice * quantity;

  const handleProceed = () => onProceed(book, format, quantity);

  const handleAdd = () => {
    onAddToCart({
      bookId: book.id,
      title: book.title,
      format,
      unitPrice,
      quantity,
      coverImage: book.coverImage,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-gray-900/75 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 lg:p-8">
          <div className="flex justify-between items-start border-b pb-4 mb-6 gap-4">
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold text-gray-900 truncate">
                {book.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{book.category}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onHome}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                title="Home"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold text-sm">
                  Home
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                title="Back"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold text-sm">
                  Back
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 p-2 rounded-full hover:bg-gray-100 hover:text-gray-700 transition"
                aria-label="Close modal"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex flex-col items-center">
              <img
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                className="w-full max-w-xs rounded-xl shadow-xl mb-4"
              />
              <p className="text-gray-600 text-sm mt-3 leading-relaxed text-center">
                {book.description}
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                <p className="text-lg text-gray-600">
                  Order Total ({quantity} item{quantity > 1 ? "s" : ""}):
                </p>
                <span className="text-4xl font-bold text-indigo-700">
                  ${currentPrice.toFixed(2)}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  Select Edition:
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormat("digital")}
                    className={`p-4 rounded-xl border-2 text-center transition duration-200 hover:shadow-md ${
                      !isPhysical
                        ? "bg-indigo-700 border-indigo-800 text-white shadow-lg"
                        : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                    }`}
                  >
                    <Zap className="w-5 h-5 inline mr-2" />
                    <span className="block font-semibold mt-1">E-book</span>
                    <p
                      className={`text-sm ${
                        !isPhysical ? "text-indigo-100" : "text-gray-500"
                      }`}
                    >
                      ${book.digitalPrice.toFixed(2)}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("physical")}
                    className={`p-4 rounded-xl border-2 text-center transition duration-200 hover:shadow-md ${
                      isPhysical
                        ? "bg-indigo-700 border-indigo-800 text-white shadow-lg"
                        : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                    }`}
                  >
                    <Truck className="w-5 h-5 inline mr-2" />
                    <span className="block font-semibold mt-1">
                      Physical Book
                    </span>
                    <p
                      className={`text-sm ${
                        isPhysical ? "text-indigo-100" : "text-gray-500"
                      }`}
                    >
                      ${book.price.toFixed(2)}
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-4 space-y-4 border-t">
                <h3 className="text-xl font-semibold text-gray-800">
                  Quantity:
                </h3>
                <QuantitySelector quantity={quantity} setQuantity={setQuantity} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleAdd}
                    icon={ShoppingCart}
                    className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200"
                  >
                    Add to Cart
                  </Button>

                  <Button onClick={handleProceed} icon={ArrowRight}>
                    {isPhysical
                      ? "Proceed to Shipping Details"
                      : "Proceed to Digital Payment"}
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full mt-2 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Digital Payment (supports cart total too) ----------
type DigitalPaymentProps = {
  title: string;
  amount: number;
  onPaymentSuccess: () => void;
  onBackToCartOrModal: () => void;
};

const DigitalPayment = ({
  title,
  amount,
  onPaymentSuccess,
  onBackToCartOrModal,
}: DigitalPaymentProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");

  const handlePayment = () => {
    if (cardNumber.length < 19 || expiry.length < 5) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onPaymentSuccess();
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 16);
    return numericValue.match(/.{1,4}/g)?.join(" ") || numericValue;
  };

  const formatExpiry = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 4);
    if (numericValue.length > 2)
      return numericValue.slice(0, 2) + "/" + numericValue.slice(2);
    return numericValue;
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl max-w-lg mx-auto border border-gray-100">
      <div className="flex items-center justify-between text-indigo-700 mb-6 border-b pb-4">
        <div className="flex items-center">
          <CreditCard className="w-8 h-8 mr-3" />
          <h2 className="text-2xl font-bold">Secure Digital Checkout</h2>
        </div>

        <button
          type="button"
          onClick={onBackToCartOrModal}
          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
          title="Back"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline font-semibold text-sm">Back</span>
        </button>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-lg font-semibold mb-1 text-gray-700">{title}</p>
        <p className="text-4xl font-extrabold text-indigo-700">
          Total: ${amount.toFixed(2)}
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Card Number (XXXX XXXX XXXX XXXX)"
          value={formatCardNumber(cardNumber)}
          onChange={(e) => setCardNumber(e.target.value)}
          maxLength={19}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          disabled={loading}
        />
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="MM/YY"
            value={formatExpiry(expiry)}
            onChange={(e) => setExpiry(e.target.value)}
            maxLength={5}
            className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="CVC"
            maxLength={3}
            className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            disabled={loading}
          />
        </div>
      </div>

      <Button onClick={handlePayment} disabled={loading} className="mt-8 text-lg">
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>Complete Order (${amount.toFixed(2)})</>
        )}
      </Button>
    </div>
  );
};

// ---------- Success ----------
type SuccessViewProps = {
  message: string;
  onStartOver: () => void;
};

const SuccessView = ({ message, onStartOver }: SuccessViewProps) => (
  <div className="p-8 bg-white rounded-xl shadow-2xl max-w-lg mx-auto text-center border border-gray-100">
    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
    <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful</h2>
    <p className="text-lg text-gray-600 mb-6">{message}</p>
    <Button
      onClick={onStartOver}
      className="w-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
      icon={ArrowRight}
    >
      Continue Shopping
    </Button>
  </div>
);

// ---------- External ----------
type ExternalRedirectViewProps = {
  title: string;
  amount: number;
  onStartOver: () => void;
};

const ExternalRedirectView = ({ title, amount, onStartOver }: ExternalRedirectViewProps) => {
  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl max-w-lg mx-auto text-center border border-gray-100">
      <Truck className="w-16 h-16 text-indigo-500 mx-auto mb-6" />
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Physical Order Confirmation
      </h2>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-lg font-semibold mb-1 text-gray-700">{title}</p>
        <p className="text-4xl font-extrabold text-indigo-700">
          Total: ${amount.toFixed(2)}
        </p>
      </div>

      <p className="text-lg text-gray-600 mb-6">
        To complete the physical order and provide your delivery address, you will be redirected.
      </p>

      <a
        href="https://www.google.com/search?q=shipping+partner"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-lg font-medium rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 transition duration-150 ease-in-out mb-4"
      >
        <ArrowRight className="w-5 h-5 mr-2" />
        Proceed to Secure Shipping Portal
      </a>

      <Button
        onClick={onStartOver}
        className="w-auto px-6 bg-gray-500 hover:bg-gray-600 text-white shadow-sm"
        icon={Home}
      >
        Home / Store
      </Button>
    </div>
  );
};

// ---------- Cart Page (✅ added Buy Now) ----------
type CartPageProps = {
  cart: CartItem[];
  onBack: () => void;
  onUpdateQty: (bookId: number, format: Format, qty: number) => void;
  onRemove: (bookId: number, format: Format) => void;
  onClear: () => void;
  onBuy: () => void;
  buyDisabled: boolean;
};

const CartPage = ({
  cart,
  onBack,
  onUpdateQty,
  onRemove,
  onClear,
  onBuy,
  buyDisabled,
}: CartPageProps) => {
  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [cart]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-16 pb-16">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-indigo-600" />
          Your Cart
        </h2>

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-800 font-semibold hover:bg-gray-50 transition inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Store
          </button>

          <button
            type="button"
            onClick={onBuy}
            disabled={buyDisabled}
            className={`px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2 shadow-sm transition
              ${
                buyDisabled
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            title={buyDisabled ? "Cart is empty" : "Buy all items in cart"}
          >
            <BadgeCheck className="w-5 h-5" />
            Buy Now
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-700 font-semibold hover:bg-red-50 transition inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-600">
          Your cart is empty.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y">
            {cart.map((item) => (
              <div
                key={`${item.bookId}-${item.format}`}
                className="p-5 flex gap-4 items-center"
              >
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-16 h-24 object-cover rounded-md border"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Format:{" "}
                        <span className="font-semibold text-gray-700">
                          {item.format === "digital" ? "E-book" : "Physical"}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Unit:{" "}
                        <span className="font-semibold text-gray-700">
                          ${item.unitPrice.toFixed(2)}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.bookId, item.format)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(
                            item.bookId,
                            item.format,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="p-1 rounded-md hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(item.bookId, item.format, item.quantity + 1)
                        }
                        className="p-1 rounded-md hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Line total</p>
                      <p className="text-xl font-extrabold text-indigo-700">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
            <p className="text-lg font-semibold text-gray-700">Cart Total</p>
            <p className="text-3xl font-extrabold text-indigo-700">
              ${total.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Main App Component ----------
export default function App() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [step, setStep] = useState<Step>("select");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Books");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastModalQuantity, setLastModalQuantity] = useState<number>(1);
  const [lastModalFormat, setLastModalFormat] = useState<Format>("digital");

  // Checkout context (single-book OR cart)
  const [checkoutTitle, setCheckoutTitle] = useState<string>("");
  const [checkoutAmount, setCheckoutAmount] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const filteredBooks = useMemo(() => {
    if (selectedCategory === "All Books") return BOOKS;
    return BOOKS.filter((book) => book.category === selectedCategory);
  }, [selectedCategory]);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setStep("details");
  };

  const handleQuickAdd = (book: Book) => {
    const item: CartItem = {
      bookId: book.id,
      title: book.title,
      format: "digital",
      unitPrice: book.digitalPrice,
      quantity: 1,
      coverImage: book.coverImage,
    };
    handleAddToCart(item);
  };

  const handleProceedFromModal = (book: Book, format: Format, quantity: number) => {
    setSelectedBook(book);

    setLastModalQuantity(quantity);
    setLastModalFormat(format);

    setSelectedQuantity(quantity);

    if (format === "digital") {
      setCheckoutTitle(`Order: ${book.title} (x${quantity})`);
      setCheckoutAmount(book.digitalPrice * quantity);
      setSuccessMessage(
        `Your digital copy of "${book.title}" has been processed successfully.`
      );
      setStep("checkout");
    } else {
      setCheckoutTitle(`Order: ${book.title} (x${quantity})`);
      setCheckoutAmount(book.price * quantity);
      setStep("external");
    }
  };

  const handleStartOver = () => {
    setSelectedBook(null);
    setSelectedQuantity(1);
    setLastModalQuantity(1);
    setLastModalFormat("digital");
    setCheckoutTitle("");
    setCheckoutAmount(0);
    setSuccessMessage("");
    setStep("select");
  };

  const handleCloseModal = () => {
    setSelectedBook(null);
    setStep("select");
  };

  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (p) => p.bookId === item.bookId && p.format === item.format
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleUpdateCartQty = (bookId: number, format: Format, qty: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.bookId === bookId && i.format === format ? { ...i, quantity: qty } : i
      )
    );
  };

  const handleRemoveCartItem = (bookId: number, format: Format) => {
    setCart((prev) => prev.filter((i) => !(i.bookId === bookId && i.format === format)));
  };

  const handleClearCart = () => setCart([]);

  // ✅ BUY NOW from cart
  const handleBuyCart = () => {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const hasPhysical = cart.some((i) => i.format === "physical");

    setCheckoutTitle(`Cart Purchase (${cart.length} item${cart.length > 1 ? "s" : ""})`);
    setCheckoutAmount(total);

    if (hasPhysical) {
      // go external for shipping
      setStep("external");
    } else {
      // all digital -> payment
      setSuccessMessage("Your cart digital order has been processed successfully.");
      setStep("checkout");
    }
  };

  const renderCategorySelector = () => (
    <div className="w-full mb-8">
      <div className="w-full">
        <div className="flex w-full overflow-x-auto whitespace-nowrap">
          {CATEGORIES.map((cat) => {
            const isActive = cat.name === selectedCategory;
            const Icon = cat.icon;

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`
                  flex-1 flex flex-col items-center justify-center py-4 px-4 min-w-[150px]
                  transition-all duration-200 rounded-xl mx-1
                  ${isActive ? "bg-indigo-50" : "hover:bg-gray-100"}
                `}
              >
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    ${cat.color} text-white shadow-inner
                    ${isActive ? "ring-4 ring-indigo-300 ring-opacity-50" : ""}
                  `}
                >
                  <Icon className="w-7 h-7" />
                </div>

                <span
                  className={`
                    mt-2 w-full text-center text-sm font-semibold
                    ${isActive ? "text-indigo-700" : "text-gray-700"}
                  `}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (step === "cart") {
      return (
        <CartPage
          cart={cart}
          onBack={() => setStep("select")}
          onUpdateQty={handleUpdateCartQty}
          onRemove={handleRemoveCartItem}
          onClear={handleClearCart}
          onBuy={handleBuyCart}
          buyDisabled={cart.length === 0}
        />
      );
    }

    if (step === "select") {
      return (
        <div className="space-y-8 pb-12">
          {renderCategorySelector()}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4 lg:px-16">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <BookGridItem
                  key={book.id}
                  book={book}
                  onSelect={handleSelectBook}
                  onQuickAdd={handleQuickAdd}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 text-xl font-medium">
                No books found in the "{selectedCategory}" collection.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step === "checkout") {
      return (
        <div className="flex justify-center items-start min-h-[70vh] pt-12 px-4">
          <DigitalPayment
            title={checkoutTitle}
            amount={checkoutAmount}
            onBackToCartOrModal={() => setStep("cart")}
            onPaymentSuccess={() => {
              setCart([]); // ✅ clear cart after payment
              setStep("success");
            }}
          />
        </div>
      );
    }

    if (step === "success") {
      return (
        <div className="flex justify-center items-start min-h-[70vh] pt-12 px-4">
          <SuccessView message={successMessage} onStartOver={handleStartOver} />
        </div>
      );
    }

    if (step === "external") {
      return (
        <div className="flex justify-center items-start min-h-[70vh] pt-12 px-4">
          <ExternalRedirectView
            title={checkoutTitle}
            amount={checkoutAmount}
            onStartOver={() => {
              setCart([]);
              handleStartOver();
            }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen font-sans bg-transparent">
      {/* Header */}
      <header className="flex items-center justify-between py-6 mb-12 bg-white/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200 shadow-sm px-4 lg:px-16">
        <h1
          className="text-4xl font-extrabold text-indigo-700 flex items-center cursor-pointer"
          onClick={() => setStep("select")}
        >
          <BookOpen className="w-8 h-8 mr-3 text-indigo-500" />
          Online Bookstore
        </h1>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setStep("cart")}
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
            title="Cart"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 transition"
            title="User"
          >
            <User className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </header>

      {renderContent()}

      {/* Modal */}
      {selectedBook && step === "details" && (
        <BookDetailModal
          book={selectedBook}
          initialQuantity={lastModalQuantity}
          initialFormat={lastModalFormat}
          onProceed={handleProceedFromModal}
          onClose={handleCloseModal}
          onHome={handleStartOver}
          onAddToCart={(item) => handleAddToCart(item)}
        />
      )}
    </div>
  );
}
