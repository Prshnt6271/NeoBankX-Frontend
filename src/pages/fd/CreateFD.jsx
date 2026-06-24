import { useEffect, useState, createContext, useContext } from "react";
import API from "../../api/api";
import { Landmark, TrendingUp, Calendar, IndianRupee, ShieldCheck, Sparkles } from "lucide-react";

// ---------- Toast Context ----------
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto p-4 rounded-xl shadow-2xl backdrop-blur-md
              transform transition-all duration-300 animate-slide-in
              ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : ""}
              ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" : ""}
              ${toast.type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
              border
            `}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" && <span className="text-xl">✅</span>}
              {toast.type === "error" && <span className="text-xl">❌</span>}
              {toast.type === "info" && <span className="text-xl">ℹ️</span>}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

// ---------- Interest Rates ----------
const interestRates = {
  3: 5.5,
  6: 6.0,
  12: 6.75,
  24: 7.0,
  36: 7.25,
  60: 7.5,
};

// ---------- Main Component Content (uses toast) ----------
function CreateFDContent() {
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState(12);
  const [interest, setInterest] = useState(0);
  const [maturityAmount, setMaturityAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!amount || Number(amount) <= 0) {
      setInterest(0);
      setMaturityAmount(0);
      return;
    }
    const rate = interestRates[tenure] || 0;
    const years = tenure / 12;
    const interestEarned = (Number(amount) * rate * years) / 100;
    setInterest(interestEarned);
    setMaturityAmount(Number(amount) + interestEarned);
  }, [amount, tenure]);

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (numAmount < 10000) {
      showToast("Minimum deposit amount is ₹10,000", "error");
      setTouched(true);
      return;
    }
    try {
      setLoading(true);
      await API.post("/fd/create", {
        amount: numAmount,
        tenureMonths: tenure,
      });
      showToast("🎉 FD created successfully!", "success");
      setAmount("");
      setTenure(12);
      setTouched(false);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create FD. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + tenure);

  const isValid = Number(amount) >= 10000;
  const isAmountValid = !amount || Number(amount) >= 10000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 px-4 sm:py-12 sm:px-6 lg:py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative mb-8 sm:mb-10">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600/20 rounded-2xl blur-xl" />
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-3.5 rounded-2xl shadow-lg shadow-blue-500/25">
                  <Landmark className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Open Fixed Deposit
                </h1>
                <p className="text-sm sm:text-base text-slate-500 flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Grow your savings with guaranteed returns
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-slate-600">Insured up to ₹5 Lakhs</span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
              {/* Left - Form */}
              <div className="lg:col-span-3 space-y-7">
                <div>
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-blue-600" />
                    Deposit Amount
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="10000"
                      step="1000"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setTouched(true);
                      }}
                      onBlur={() => setTouched(true)}
                      placeholder="Enter amount (min. ₹10,000)"
                      className={`
                        w-full pl-9 pr-4 py-3.5 text-base rounded-xl
                        border-2 transition-all duration-200
                        focus:outline-none focus:ring-4
                        ${!isAmountValid && touched && amount
                          ? 'border-red-400 bg-red-50/50 focus:ring-red-200 focus:border-red-400'
                          : 'border-slate-200 bg-slate-50/50 focus:ring-blue-200 focus:border-blue-500 hover:border-slate-300'
                        }
                      `}
                    />
                    {!isAmountValid && touched && amount && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                        Minimum deposit is ₹10,000
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {[10000, 25000, 50000, 100000].map((val) => (
                      <button
                        key={val}
                        onClick={() => {
                          setAmount(String(val));
                          setTouched(true);
                        }}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition-all duration-200 border border-transparent hover:border-blue-200"
                      >
                        ₹{val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Tenure
                  </label>
                  <div className="relative mt-2">
                    <select
                      value={tenure}
                      onChange={(e) => setTenure(Number(e.target.value))}
                      className="
                        w-full px-4 py-3.5 text-base rounded-xl
                        border-2 border-slate-200 bg-slate-50/50
                        focus:outline-none focus:ring-4 focus:ring-blue-200
                        focus:border-blue-500 hover:border-slate-300
                        transition-all duration-200 appearance-none
                        cursor-pointer pr-10
                      "
                    >
                      <option value={3}>3 Months — 5.50% p.a.</option>
                      <option value={6}>6 Months — 6.00% p.a.</option>
                      <option value={12}>12 Months — 6.75% p.a.</option>
                      <option value={24}>24 Months — 7.00% p.a.</option>
                      <option value={36}>36 Months — 7.25% p.a.</option>
                      <option value={60}>60 Months — 7.50% p.a.</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${((tenure - 3) / (60 - 3)) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {tenure} months
                    </span>
                  </div>
                </div>

                <button
                  disabled={loading || !isValid}
                  onClick={handleSubmit}
                  className={`
                    w-full py-4 rounded-xl font-semibold text-base
                    transition-all duration-300 relative overflow-hidden
                    ${loading || !isValid
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]'
                    }
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Landmark className="w-5 h-5" />
                      Open Fixed Deposit
                    </span>
                  )}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-3 lg:hidden">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Insured up to ₹5L
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Guaranteed returns
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Up to 7.50% p.a.
                  </div>
                </div>
              </div>

              {/* Right - Summary */}
              <div className="lg:col-span-2">
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5 rounded-2xl" />
                  <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-7 border border-slate-200/60 shadow-inner shadow-white/50 h-full">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md shadow-blue-500/20">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-800">FD Summary</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-500">You Invest</span>
                        <span className="text-sm font-bold text-slate-700">
                          ₹{Number(amount || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-500">Interest Earned</span>
                        <span className="text-sm font-bold text-emerald-600">
                          ₹{interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-500">Interest Rate</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {interestRates[tenure] || 0}% p.a.
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-500">Maturity Date</span>
                        <span className="text-sm font-medium text-slate-700">
                          {maturityDate.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="mt-3 pt-4 border-t-2 border-dashed border-blue-200/60">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold text-slate-700">You Receive</span>
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ₹{maturityAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 text-right">
                          {tenure} months · ₹{(Number(amount) / tenure).toFixed(0)}/month invested
                        </p>
                      </div>
                    </div>

                    {Number(amount) > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>₹10,000 min</span>
                          <span>₹{Number(amount).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min((Number(amount) / 100000) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          * Fixed Deposits are subject to terms &amp; conditions. TDS applicable as per income tax rules.
        </p>
      </div>
    </div>
  );
}

// ---------- Default export – wrap with ToastProvider ----------
export default function CreateFD() {
  return (
    <ToastProvider>
      <CreateFDContent />
    </ToastProvider>
  );
}