import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Landmark,
  Calendar,
  Percent,
  Wallet,
  BadgeIndianRupee,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
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

const formatDateTime = (dateValue) => {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ---------- Main Component ----------
function FDDetailsContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [fd, setFd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFD = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/fd/${id}`);
      setFd(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Unable to load FD details";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFD();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-700";
      case "MATURED":
        return "bg-blue-100 text-blue-700";
      case "PREMATURE_CLOSED":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 px-4 sm:py-12 sm:px-6 lg:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 p-12 text-center">
            <div className="flex justify-center items-center gap-3 text-slate-500">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading FD details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !fd) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 px-4 sm:py-12 sm:px-6 lg:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 p-8 text-center">
            <p className="text-red-500 font-medium">{error || "FD not found"}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 px-4 sm:py-12 sm:px-6 lg:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="relative mb-8 sm:mb-10">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-sm hover:bg-white hover:shadow-md transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Fixed Deposit Details
                </h1>
                <p className="text-sm sm:text-base text-slate-500 flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Complete overview of your FD
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${getStatusColor(fd.status)}`}
              >
                {fd.status?.replace("_", " ")}
              </span>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">Insured</span>
              </div>
            </div>
          </div>
        </div>

        {/* FD Number Card */}
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 overflow-hidden mb-8">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="p-6 sm:p-8 flex items-center gap-5">
            <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/20">
              <Landmark className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">FD Number</p>
              <h2 className="text-2xl font-bold text-slate-800">{fd.fdNumber}</h2>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard
            icon={<Wallet className="w-5 h-5" />}
            title="Account Number"
            value={fd.accountNumber}
          />
          <InfoCard
            icon={<BadgeIndianRupee className="w-5 h-5" />}
            title="Principal Amount"
            value={`₹${Number(fd.principalAmount).toLocaleString()}`}
          />
          <InfoCard
            icon={<Percent className="w-5 h-5" />}
            title="Interest Rate"
            value={`${fd.interestRate}% p.a.`}
          />
          <InfoCard
            icon={<Clock className="w-5 h-5" />}
            title="Tenure"
            value={`${fd.tenureMonths} months`}
          />
          <InfoCard
            icon={<Calendar className="w-5 h-5" />}
            title="Start Date"
            value={formatDate(fd.startDate)}
          />
          <InfoCard
            icon={<Calendar className="w-5 h-5" />}
            title="Maturity Date"
            value={formatDate(fd.maturityDate)}
          />
          <InfoCard
            icon={<BadgeIndianRupee className="w-5 h-5" />}
            title="Maturity Amount"
            value={`₹${Number(fd.maturityAmount).toLocaleString()}`}
            highlight
          />
        </div>

        {/* Premature Closure Details */}
        {fd.status === "PREMATURE_CLOSED" && (
          <div className="mt-8 rounded-3xl border border-amber-200/60 bg-amber-50/80 backdrop-blur-sm p-6 sm:p-8 shadow-inner shadow-white/50">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-amber-800">Premature Closure Information</h3>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="bg-white/60 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Closed At</p>
                <p className="text-base font-semibold text-slate-700 mt-1">
                  {formatDateTime(fd.closedAt)}
                </p>
              </div>
              <div className="bg-white/60 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Penalty Applied</p>
                <p className="text-base font-semibold text-red-600 mt-1">
                  ₹{fd.prematurePenalty ? Number(fd.prematurePenalty).toLocaleString() : "0"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back to list link */}
        <div className="mt-8 text-center">
          <Link
            to="/fd/my-fds"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to My FDs
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------- Reusable Info Card ----------
function InfoCard({ icon, title, value, highlight = false }) {
  return (
    <div
      className={`
        bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-5 shadow-md
        transition-all duration-200 hover:shadow-lg hover:border-blue-200/50
        ${highlight ? "bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200/60" : ""}
      `}
    >
      <div className="flex items-center gap-3 text-indigo-600 mb-3">
        <div className={`p-2 rounded-xl ${highlight ? "bg-blue-100" : "bg-slate-100"}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-500">{title}</span>
      </div>
      <p className={`text-lg font-semibold text-slate-800 break-all ${highlight ? "text-blue-700" : ""}`}>
        {value}
      </p>
    </div>
  );
}

// ---------- Default Export wrapped with ToastProvider ----------
export default function FDDetails() {
  return (
    <ToastProvider>
      <FDDetailsContent />
    </ToastProvider>
  );
}