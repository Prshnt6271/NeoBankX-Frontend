import { useEffect, useState, createContext, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Landmark,
  Eye,
  AlertTriangle,
  TrendingUp,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import API from "../../api/api";

// ---------- Toast Context (self-contained) ----------
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

// ---------- Helper: Safe date formatting ----------
const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ---------- Main Component ----------
function MyFDsContent() {
  const { showToast } = useToast();
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakModal, setBreakModal] = useState({ show: false, fdId: null });

  const fetchFDs = async () => {
    try {
      const res = await API.get("/api/fd/my-fds");
      setFds(res.data);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to fetch Fixed Deposits",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const breakFD = async (id) => {
    try {
      const res = await API.post(`/api/fd/${id}/break`);
      showToast(res.data || "FD broken successfully", "success");
      fetchFDs();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to break FD",
        "error"
      );
    } finally {
      setBreakModal({ show: false, fdId: null });
    }
  };

  const openBreakModal = (id) => {
    setBreakModal({ show: true, fdId: id });
  };

  useEffect(() => {
    fetchFDs();
  }, []);

  // Helper to get the opening date from possible field names
  const getOpeningDate = (fd) => {
    return fd.createdAt || fd.openingDate || fd.startDate || null;
  };

  return (
    <>
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
                    My Fixed Deposits
                  </h1>
                  <p className="text-sm sm:text-base text-slate-500 flex items-center gap-2 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    View and manage your FD investments
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">Total FDs: {fds.length}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 p-12 text-center">
              <div className="flex justify-center items-center gap-3 text-slate-500">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading your FDs...
              </div>
            </div>
          ) : fds.length === 0 ? (
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              <div className="p-10 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-slate-100 rounded-full">
                    <Landmark className="w-12 h-12 text-slate-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-700">No Fixed Deposits Found</h2>
                <p className="text-slate-500 mt-2">You have not opened any FD yet.</p>
                <Link
                  to="/fd/create"
                  className="inline-block mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-200"
                >
                  Open Fixed Deposit
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {fds.map((fd) => {
                const openingDate = getOpeningDate(fd);
                const formattedDate = formatDate(openingDate);
                return (
                  <div
                    key={fd.id}
                    className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-blue-200/30 hover:border-blue-200/50"
                  >
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col md:flex-row md:justify-between gap-5">
                        {/* Left: Details */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl font-bold text-slate-800">{fd.fdNumber}</h2>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                fd.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : fd.status === "MATURED"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {fd.status}
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm">Account: {fd.accountNumber}</p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            <div className="bg-slate-50/80 rounded-xl px-4 py-3 border border-slate-100">
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" /> Principal
                              </p>
                              <p className="text-sm font-semibold text-slate-700">₹{fd.principalAmount}</p>
                            </div>
                            <div className="bg-slate-50/80 rounded-xl px-4 py-3 border border-slate-100">
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Rate
                              </p>
                              <p className="text-sm font-semibold text-slate-700">{fd.interestRate}%</p>
                            </div>
                            <div className="bg-slate-50/80 rounded-xl px-4 py-3 border border-slate-100">
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Tenure
                              </p>
                              <p className="text-sm font-semibold text-slate-700">{fd.tenureMonths} months</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl px-4 py-3 border border-blue-100">
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" /> Maturity
                              </p>
                              <p className="text-sm font-bold text-blue-600">₹{fd.maturityAmount}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col items-start md:items-end justify-between gap-4">
                          <div className="flex flex-wrap gap-3">
                            <Link
                              to={`/fd/${fd.id}`}
                              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-200"
                            >
                              <Eye size={16} />
                              Details
                            </Link>
                            {fd.status === "ACTIVE" && (
                              <button
                                onClick={() => openBreakModal(fd.id)}
                                className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02] transition-all duration-200"
                              >
                                <AlertTriangle size={16} />
                                Break FD
                              </button>
                            )}
                          </div>
                          {/* Opening Date – now safely formatted */}
                          <p className="text-xs text-slate-400">
                            Opened on {formattedDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {breakModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-white/50 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Break Fixed Deposit</h3>
              </div>
              <button
                onClick={() => setBreakModal({ show: false, fdId: null })}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-slate-600 mt-4">
              Are you sure you want to break this FD? This action is irreversible and may incur penalties.
            </p>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setBreakModal({ show: false, fdId: null })}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => breakFD(breakModal.fdId)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-medium shadow-md shadow-rose-500/20 hover:shadow-rose-500/40 transition-all"
              >
                Yes, Break FD
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Default export wrapped with ToastProvider ----------
export default function MyFDs() {
  return (
    <ToastProvider>
      <MyFDsContent />
    </ToastProvider>
  );
}   