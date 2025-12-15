"use client";
import React, { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ShoppingCart,
  BookOpen,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowRight,
  User,
  Loader2,
  Minus,
  Plus,
  Zap,
  X,
} from "lucide-react";

// ---------- Types ----------
type Book = {
  id: number;
  title: string;
  price: number;
  digitalPrice: number;
  description: string;
  coverImage: string;
};

type Format = "digital" | "physical";
type Step = "select" | "details" | "checkout" | "success" | "external";

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
  },
  {
    id: 2,
    title: "Quantum Computing for Cats",
    price: 29.99,
    digitalPrice: 22.99,
    description:
      "A surprisingly accessible guide to superposition and entanglement, explained with cat analogies.",
    coverImage:
      "https://placehold.co/150x225/047857/ffffff?text=Quantum+Cats",
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
  },
  {
    id: 4,
    title: "The Silent Gardener",
    price: 12.5,
    digitalPrice: 8.99,
    description:
      "A meditative study on urban permaculture and finding peace through nature in concrete jungles.",
    coverImage: "https://placehold.co/150x225/fbbf24/000000?text=Gardener",
  },
  {
    id: 5,
    title: "The Silicon Shepherd",
    price: 17.5,
    digitalPrice: 10.99,
    description: "A novel about AI and finding humanity in code.",
    coverImage:
      "https://placehold.co/150x225/3b82f6/ffffff?text=AI+Shepherd",
  },
  {
    id: 6,
    title: "Atlas of Lost Cities",
    price: 35.0,
    digitalPrice: 28.0,
    description: "A photographic journey through forgotten urban centers.",
    coverImage:
      "https://placehold.co/150x225/44403c/ffffff?text=Lost+Cities",
  },
  {
    id: 7,
    title: "Zero Gravity Kitchen",
    price: 18.0,
    digitalPrice: 12.5,
    description: "Recipes for a future in space colonization.",
    coverImage: "https://placehold.co/150x225/6b7280/ffffff?text=Space+Food",
  },
  {
    id: 8,
    title: "The Fifth Dimension Theory",
    price: 22.99,
    digitalPrice: 17.99,
    description: "A non-fiction deep dive into theoretical physics.",
    coverImage:
      "https://placehold.co/150x225/7e22ce/ffffff?text=Dimension+5",
  },
  {
    id: 9,
    title: "Midnight at the Lighthouse",
    price: 14.99,
    digitalPrice: 9.99,
    description: "A thrilling mystery set on a remote coastline.",
    coverImage: "https://placehold.co/150x225/0891b2/ffffff?text=Lighthouse",
  },
  {
    id: 10,
    title: "The Art of Minimalist Living",
    price: 11.99,
    digitalPrice: 7.99,
    description: "Practical guide to decluttering your life and mind.",
    coverImage:
      "https://placehold.co/150x225/d97706/ffffff?text=Minimalist",
  },
  {
    id: 11,
    title: "Global Warming: The Next 100 Years",
    price: 32.0,
    digitalPrice: 25.0,
    description: "Data-driven projection on climate change impact.",
    coverImage: "https://placehold.co/150x225/b91c1c/ffffff?text=Warming",
  },
  {
    id: 12,
    title: "The Dragon's Calculator",
    price: 16.5,
    digitalPrice: 11.5,
    description: "A fantasy tale involving magical mathematics.",
    coverImage:
      "https://placehold.co/150x225/ec4899/ffffff?text=Dragon+Calc",
  },
  {
    id: 13,
    title: "Learning Rust in 7 Days",
    price: 40.0,
    digitalPrice: 33.0,
    description: "An intensive programming language tutorial.",
    coverImage: "https://placehold.co/150x225/ea580c/ffffff?text=Rust+Book",
  },
  {
    id: 14,
    title: "Whispers of the Old Gods",
    price: 13.99,
    digitalPrice: 8.99,
    description: "Collection of ancient myths and folklore.",
    coverImage: "https://placehold.co/150x225/713f12/ffffff?text=Old+Gods",
  },
  {
    id: 15,
    title: "Martian Agriculture Handbook",
    price: 25.0,
    digitalPrice: 19.5,
    description: "Scientific guide to farming on Mars.",
    coverImage:
      "https://placehold.co/150x225/991b1b/ffffff?text=Martian+Farm",
  },
  {
    id: 16,
    title: "Tokyo Dreams, Kyoto Nights",
    price: 19.0,
    digitalPrice: 13.5,
    description: "A travel memoir exploring Japan's duality.",
    coverImage: "https://placehold.co/150x225/c026d3/ffffff?text=Tokyo",
  },
  {
    id: 17,
    title: "The Algorithm of Happiness",
    price: 21.0,
    digitalPrice: 15.0,
    description: "Philosophical inquiry into data and well-being.",
    coverImage:
      "https://placehold.co/150x225/84cc16/ffffff?text=Algorithm",
  },
  {
    id: 18,
    title: "Deep Sea Secrets",
    price: 27.99,
    digitalPrice: 20.99,
    description: "Exploration of the ocean's unexplored trenches.",
    coverImage:
      "https://placehold.co/150x225/1e3a8a/ffffff?text=Deep+Sea",
  },
  {
    id: 19,
    title: "Post-Apocalypse Prep Guide",
    price: 10.5,
    digitalPrice: 6.5,
    description: "Survival tips for the inevitable future.",
    coverImage: "https://placehold.co/150x225/000000/ffffff?text=Prep+Guide",
  },
  {
    id: 20,
    title: "The History of Coffee Beans",
    price: 17.0,
    digitalPrice: 11.5,
    description: "A definitive guide from crop to cup.",
    coverImage:
      "https://placehold.co/150x225/92400e/ffffff?text=Coffee+History",
  },
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
    className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-md font-semibold rounded-xl shadow-lg transition duration-150 ease-in-out 
      ${disabled ? "bg-gray-400 cursor-not-allowed text-gray-700" : "bg-amber-400 hover:bg-amber-500 text-gray-900"}
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
      className="p-1 text-gray-700 hover:bg-gray-100 rounded-md"
    >
      <Minus className="w-4 h-4" />
    </button>
    <span className="font-semibold w-8 text-center">{quantity}</span>
    <button
      type="button"
      onClick={() => setQuantity((q) => q + 1)}
      className="p-1 text-gray-700 hover:bg-gray-100 rounded-md"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

type BookGridItemProps = {
  book: Book;
  onSelect: (book: Book) => void;
};

const BookGridItem = ({ book, onSelect }: BookGridItemProps) => {
  return (
    <div
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 flex flex-col h-full cursor-pointer group"
      onClick={() => onSelect(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect(book);
      }}
    >
      <img
        src={book.coverImage}
        alt={`Cover of ${book.title}`}
        className="w-32 h-44 mx-auto rounded-xl shadow-md mb-4 flex-shrink-0 object-cover group-hover:scale-[1.02] transition-transform"
      />

      <div className="flex-grow text-center">
        <h3
          className="text-lg font-bold text-gray-900 truncate mb-2"
          title={book.title}
        >
          {book.title}
        </h3>

        <div className="flex items-center justify-center mb-1">
          <span className="text-xl font-extrabold text-red-600">
            ${book.price.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          starting from digital (${book.digitalPrice.toFixed(2)})
        </p>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="w-full text-center text-sm font-semibold text-indigo-600 py-1 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(book);
          }}
        >
          <ShoppingCart className="w-3 h-3 inline mr-1" /> View Options
        </button>
      </div>
    </div>
  );
};

type BookDetailModalProps = {
  book: Book;
  onProceed: (book: Book, format: Format, quantity: number) => void;
  onClose: () => void;
};

const BookDetailModal = ({ book, onProceed, onClose }: BookDetailModalProps) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [format, setFormat] = useState<Format>("digital");

  const isPhysical = format === "physical";
  const unitPrice = isPhysical ? book.price : book.digitalPrice;
  const currentPrice = unitPrice * quantity;

  const handleProceed = () => onProceed(book, format, quantity);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform scale-100 transition-transform duration-300">
        <div className="p-6 lg:p-8">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {book.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col items-center">
              <img
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                className="w-full max-w-xs rounded-xl shadow-lg mb-4"
              />
              <p className="text-gray-600 text-sm mt-3">{book.description}</p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <span className="text-4xl font-bold text-red-600">
                  ${currentPrice.toFixed(2)}
                </span>
                <span className="text-lg text-gray-600 ml-3">
                  Total for {quantity} item{quantity > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  Choose Format:
                </h3>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormat("digital")}
                    className={`flex-1 p-3 rounded-xl border-2 transition ${
                      !isPhysical
                        ? "bg-indigo-100 border-indigo-500 text-indigo-700 shadow-md"
                        : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <Zap className="w-4 h-4 inline mr-2" /> E-book
                    <p className="text-sm font-normal">
                      ${book.digitalPrice.toFixed(2)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("physical")}
                    className={`flex-1 p-3 rounded-xl border-2 transition ${
                      isPhysical
                        ? "bg-indigo-100 border-indigo-500 text-indigo-700 shadow-md"
                        : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <Truck className="w-4 h-4 inline mr-2" /> Physical
                    <p className="text-sm font-normal">
                      ${book.price.toFixed(2)}
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-4 space-y-4 border-t">
                <h3 className="text-xl font-semibold text-gray-800">
                  Quantity:
                </h3>
                <div className="w-full">
                  <QuantitySelector
                    quantity={quantity}
                    setQuantity={setQuantity}
                  />
                </div>

                <Button
                  onClick={handleProceed}
                  className="text-white bg-indigo-600 hover:bg-indigo-700"
                  icon={ShoppingCart}
                >
                  {isPhysical
                    ? "Ship Book (External Redirect)"
                    : "Pay & Download (Online Payment)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type DigitalPaymentProps = {
  book: Book;
  quantity: number;
  onPaymentSuccess: () => void;
};

const DigitalPayment = ({
  book,
  quantity,
  onPaymentSuccess,
}: DigitalPaymentProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");

  const currentPrice = useMemo(
    () => book.digitalPrice * quantity,
    [book.digitalPrice, quantity]
  );

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
    if (numericValue.length > 2) {
      return numericValue.slice(0, 2) + "/" + numericValue.slice(2);
    }
    return numericValue;
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl max-w-lg mx-auto">
      <div className="flex items-center text-indigo-600 mb-6 border-b pb-3">
        <CreditCard className="w-8 h-8 mr-3" />
        <h2 className="text-2xl font-bold">Secure Digital Checkout</h2>
      </div>

      <p className="text-xl font-semibold mb-2 text-gray-800">
        {book.title} (x{quantity})
      </p>
      <p className="text-4xl font-extrabold text-red-600 mb-8">
        Total: ${currentPrice.toFixed(2)}
      </p>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Card Number (XXXX XXXX XXXX XXXX)"
          value={formatCardNumber(cardNumber)}
          onChange={(e) => setCardNumber(e.target.value)}
          maxLength={19}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          disabled={loading}
        />
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="MM/YY"
            value={formatExpiry(expiry)}
            onChange={(e) => setExpiry(e.target.value)}
            maxLength={5}
            className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="CVC"
            maxLength={3}
            className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          />
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="mt-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>Complete Order (${currentPrice.toFixed(2)})</>
        )}
      </Button>
    </div>
  );
};

type SuccessViewProps = {
  book: Book;
  onStartOver: () => void;
};

const SuccessView = ({ book, onStartOver }: SuccessViewProps) => (
  <div className="p-8 bg-white rounded-xl shadow-2xl max-w-lg mx-auto text-center">
    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
    <h2 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h2>
    <p className="text-lg text-gray-600 mb-6">
      Your digital copy of{" "}
      <span className="font-semibold text-indigo-600">"{book.title}"</span> is
      now available in your library.
    </p>
    <Button
      onClick={onStartOver}
      className="w-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
      icon={ArrowRight}
    >
      Continue Shopping
    </Button>
  </div>
);

type ExternalRedirectViewProps = {
  book: Book;
  quantity: number;
  onStartOver: () => void;
};

const ExternalRedirectView = ({
  book,
  quantity,
  onStartOver,
}: ExternalRedirectViewProps) => {
  const currentPrice = book.price * quantity;

  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl max-w-lg mx-auto text-center">
      <Truck className="w-16 h-16 text-orange-500 mx-auto mb-6" />
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Physical Order Fulfillment
      </h2>
      <p className="text-xl font-semibold mb-2 text-gray-800">
        {book.title} (x{quantity})
      </p>
      <p className="text-4xl font-extrabold text-red-600 mb-8">
        Total: ${currentPrice.toFixed(2)}
      </p>

      <p className="text-lg text-gray-600 mb-6">
        The physical edition is handled by our preferred shipping partner. You
        will now be redirected to an external site to complete the shipping
        details.
      </p>
      <a
        href="https://www.google.com/search?q=buy+physical+book"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-lg font-medium rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 transition duration-150 ease-in-out mb-4"
      >
        <ArrowRight className="w-5 h-5 mr-2" />
        Go to Shipping Partner (External Site)
      </a>
      <Button
        onClick={onStartOver}
        className="w-auto px-6 bg-gray-500 hover:bg-gray-600 text-white"
      >
        Return to Store
      </Button>
    </div>
  );
};

// ---------- Main ----------
export default function App() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [step, setStep] = useState<Step>("select");
  const [showUserId, setShowUserId] = useState<boolean>(false);

  const userId = "GUEST_SESSION_ID_12345";
  const error: string | null = null;

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setStep("details");
  };

  const handleProceedFromModal = (
    book: Book,
    format: Format,
    quantity: number
  ) => {
    setSelectedBook(book);
    setSelectedQuantity(quantity);

    if (format === "digital") setStep("checkout");
    else setStep("external");
  };

  const handleStartOver = () => {
    setSelectedBook(null);
    setSelectedQuantity(1);
    setStep("select");
  };

  const handleCloseModal = () => {
    setSelectedBook(null);
    setStep("select");
  };

  const renderContent = () => {
    if (step === "select") {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {BOOKS.map((book) => (
              <BookGridItem key={book.id} book={book} onSelect={handleSelectBook} />
            ))}
          </div>
        </div>
      );
    }

    if (!selectedBook) {
      return (
        <div className="text-center text-gray-500 py-12">
          Error: No book selected or transaction completed.
        </div>
      );
    }

    switch (step) {
      case "checkout":
        return (
          <DigitalPayment
            book={selectedBook}
            quantity={selectedQuantity}
            onPaymentSuccess={() => setStep("success")}
          />
        );
      case "success":
        return <SuccessView book={selectedBook} onStartOver={handleStartOver} />;
      case "external":
        return (
          <ExternalRedirectView
            book={selectedBook}
            quantity={selectedQuantity}
            onStartOver={handleStartOver}
          />
        );
      case "details":
        return null;
      default:
        return <div className="text-center text-gray-500 py-12">Invalid step.</div>;
    }
  };

  return (
    <div className="min-h-screen font-sans p-4 md:p-8">
      <header className="flex justify-between items-center py-4 mb-8">
        <h1 className="text-4xl font-extrabold text-indigo-700 flex items-center">
          <BookOpen className="w-8 h-8 mr-3 text-indigo-500" />
          Our Colorful Books Collection
        </h1>

        <button
          type="button"
          onClick={() => setShowUserId((v) => !v)}
          className="text-sm text-gray-600 flex items-center bg-gray-200 p-2 rounded-lg hover:bg-gray-300 transition duration-150 relative"
          aria-expanded={showUserId}
          aria-controls="user-id-info"
        >
          <User className="w-6 h-6 text-gray-700" />

          {showUserId && (
            <div
              id="user-id-info"
              className="absolute right-0 top-full mt-2 w-max max-w-xs p-3 bg-white border border-gray-300 rounded-lg shadow-xl z-10 text-left"
            >
              <span className="font-semibold text-gray-800">Current User:</span>
              <p className="text-xs text-gray-600 break-all mt-1">{userId}</p>
            </div>
          )}
        </button>
      </header>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-8"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      <div>{renderContent()}</div>

      {selectedBook && step === "details" && (
        <BookDetailModal
          book={selectedBook}
          onProceed={handleProceedFromModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}