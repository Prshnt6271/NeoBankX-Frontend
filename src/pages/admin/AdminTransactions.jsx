import { useEffect, useMemo, useState } from "react";
import API from "../../api/api";
import {
  Search, ChevronLeft, ChevronRight, TrendingUp,
  TrendingDown, Repeat2, ArrowDownCircle, ArrowUpCircle,
  RefreshCw, SlidersHorizontal, X, Calendar, Filter, Download
} from "lucide-react";

const DATE_RANGES = [
  { key: "all",    label: "All" },
  { key: "today",  label: "Today" },
  { key: "7days",  label: "This Week" },
  { key: "30days", label: "This Month" },
  { key: "custom", label: "Custom" },
];

const TYPE_CONFIG = {
  DEPOSIT:  { color: "bg-emerald-100 text-emerald-700", icon: <ArrowDownCircle size={13} /> },
  TRANSFER: { color: "bg-indigo-100 text-indigo-700",   icon: <Repeat2 size={13} /> },
  WITHDRAW: { color: "bg-rose-100 text-rose-700",       icon: <ArrowUpCircle size={13} /> },
};

const PAGE_SIZE = 10;

const fmt = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") { resolve(); return; }
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { s.dataset.loaded = "true"; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });

const JSPDF_SRC     = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const AUTOTABLE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";

const getJsPDF = async () => {
  await loadScript(JSPDF_SRC);
  await loadScript(AUTOTABLE_SRC);
  const ctor = window?.jspdf?.jsPDF;
  if (!ctor) throw new Error("jsPDF constructor not found on window.jspdf");
  return ctor;
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [txnType, setTxnType]           = useState("all");
  const [dateRange, setDateRange]       = useState("all");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");
  const [page, setPage]                 = useState(1);
  const [showFilters, setShowFilters]   = useState(false);
  const [sortLatest, setSortLatest]     = useState(true);
  const [downloading, setDownloading]   = useState(false);
  const [dlError, setDlError]           = useState("");

  useEffect(() => {
    loadTransactions();
    getJsPDF().catch(() => {});
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/transactions");
      setTransactions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setRange = (range) => {
    setDateRange(range); setPage(1);
    const today = new Date();
    if (range === "today")       { const s = fmt(today); setFromDate(s); setToDate(s); }
    else if (range === "7days")  { const f = new Date(today); f.setDate(f.getDate()-6);  setFromDate(fmt(f)); setToDate(fmt(today)); }
    else if (range === "30days") { const f = new Date(today); f.setDate(f.getDate()-29); setFromDate(fmt(f)); setToDate(fmt(today)); }
    else if (range === "all")    { setFromDate(""); setToDate(""); }
  };

  const resetAll = () => {
    setSearch(""); setTxnType("all"); setDateRange("all");
    setFromDate(""); setToDate(""); setPage(1); setSortLatest(true); setDlError("");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (q) {
          const hay = [
            t.customerName, t.email, t.mobile,
            t.fromAccount, t.toAccount,
            t.transactionType, t.remarks,
            t.amount?.toString(),
          ].filter(Boolean).map(v => v.toLowerCase());
          if (!hay.some(v => v.includes(q))) return false;
        }
        if (txnType !== "all" && t.transactionType?.toUpperCase() !== txnType) return false;
        if (fromDate && toDate) {
          const d = (t.transactionDate || "").split("T")[0].split(" ")[0];
          if (d && (d < fromDate || d > toDate)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.transactionDate).getTime();
        const db = new Date(b.transactionDate).getTime();
        return sortLatest ? db - da : da - db;
      });
  }, [transactions, search, txnType, fromDate, toDate, sortLatest]);

  const pageCount     = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged         = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalVolume   = filtered.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDeposit  = filtered.filter(t => t.transactionType === "DEPOSIT").reduce((s,t)  => s + Number(t.amount||0), 0);
  const totalWithdraw = filtered.filter(t => t.transactionType === "WITHDRAW").reduce((s,t) => s + Number(t.amount||0), 0);
  const totalTransfer = filtered.filter(t => t.transactionType === "TRANSFER").reduce((s,t) => s + Number(t.amount||0), 0);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDlError("");
    try {
      const jsPDF = await getJsPDF();
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 297, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text("NeoBank Admin", 14, 13);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("Transaction Monitoring Statement", 14, 22);
      const dateLabel = fromDate && toDate ? `${fromDate}  to  ${toDate}` : "All Time";
      doc.text(`Period: ${dateLabel}`, 180, 13);
      doc.text(`Type: ${txnType === "all" ? "All Types" : txnType}`, 180, 22);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 180, 28);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      const sy = 38;
      doc.text(`Total Transactions: ${filtered.length}`, 14, sy);
      doc.text(`Volume: Rs ${totalVolume.toLocaleString("en-IN")}`, 75, sy);
      doc.text(`Deposits: Rs ${totalDeposit.toLocaleString("en-IN")}`, 145, sy);
      doc.text(`Withdrawals: Rs ${totalWithdraw.toLocaleString("en-IN")}`, 205, sy);
      doc.text(`Transfers: Rs ${totalTransfer.toLocaleString("en-IN")}`, 255, sy);

      doc.autoTable({
        startY: sy + 7,
        head: [["Customer", "Email", "Mobile", "From Account", "To Account", "Type", "Amount (Rs)", "Remarks", "Date"]],
        body: filtered.map((t) => [
          t.customerName || "-",
          t.email || "-",
          t.mobile || "-",
          t.fromAccount || "-",
          t.toAccount || "-",
          t.transactionType || "-",
          Number(t.amount || 0).toLocaleString("en-IN"),
          t.remarks || "-",
          t.transactionDate ? new Date(t.transactionDate).toLocaleString("en-IN") : "-",
        ]),
        styles: { fontSize: 10, cellPadding: 5, font: "helvetica", textColor: [30, 30, 30] },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 10, cellPadding: 6 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 30 }, 1: { cellWidth: 42 }, 2: { cellWidth: 26 },
          3: { cellWidth: 30 }, 4: { cellWidth: 30 }, 5: { cellWidth: 24 },
          6: { halign: "right", cellWidth: 28 }, 7: { cellWidth: 30 }, 8: { cellWidth: 38 },
        },
        margin: { left: 10, right: 10 },
      });

      const ph = doc.internal.pageSize.height;
      doc.setFontSize(7); doc.setTextColor(150);
      doc.text(`NeoBank Admin © ${new Date().getFullYear()} — Confidential system-generated statement`, 14, ph - 6);
      doc.save(`NeoBank_Admin_Statement_${fmt(new Date())}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      setDlError("Download failed. Check your connection and try again.");
    } finally {
      setDownloading(false);
    }
  };

  const TypeBadge = ({ type }) => {
    const cfg = TYPE_CONFIG[type?.toUpperCase()] || { color: "bg-slate-100 text-slate-600", icon: null };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${cfg.color}`}>
        {cfg.icon}{type || "-"}
      </span>
    );
  };

  const amountColor  = (type) => ({ DEPOSIT: "text-emerald-600", WITHDRAW: "text-rose-600", TRANSFER: "text-indigo-600" }[type?.toUpperCase()] || "text-slate-700");
  const amountPrefix = (type) => ({ DEPOSIT: "+", WITHDRAW: "-" }[type?.toUpperCase()] || "");

  // Smart pagination: always show first, last, and pages near current
  const paginationItems = Array.from({ length: pageCount }, (_, i) => i + 1)
    .filter(p => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 text-white shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute -right-10 -top-10 h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-10 bottom-0 h-20 w-20 sm:h-28 sm:w-28 rounded-full bg-white/5 pointer-events-none" />

        {/* Title + Download */}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 sm:mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live transaction monitoring
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight">Transaction Monitoring</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-md">
              Monitor and audit all customer transactions across NeoBank in real time.
            </p>
          </div>

          {/* Download button — full-width on xs, auto on sm+ */}
          <div className="flex flex-col items-stretch sm:items-end gap-1 shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white/15 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed backdrop-blur-sm border border-white/20 px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-semibold text-white transition-all w-full sm:w-auto"
            >
              {downloading
                ? <><RefreshCw size={14} className="animate-spin" /> Generating…</>
                : <><Download size={14} /> Download Statement</>}
            </button>
            {dlError && <p className="text-xs text-rose-300">{dlError}</p>}
          </div>
        </div>

        {/* Stats grid — 2 cols on xs, 4 cols on sm+ */}
        <div className="relative mt-5 sm:mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total Txns",  val: filtered.length,                                 icon: <RefreshCw size={12} />,       color: "text-white" },
            { label: "Volume",      val: `₹${totalVolume.toLocaleString("en-IN")}`,        icon: <TrendingUp size={12} />,      color: "text-emerald-400" },
            { label: "Deposits",    val: `₹${totalDeposit.toLocaleString("en-IN")}`,       icon: <ArrowDownCircle size={12} />, color: "text-emerald-400" },
            { label: "Withdrawals", val: `₹${totalWithdraw.toLocaleString("en-IN")}`,      icon: <TrendingDown size={12} />,   color: "text-rose-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2.5 sm:py-3 border border-white/10 min-w-0">
              <div className="flex items-center gap-1 text-slate-400 text-[11px] sm:text-xs mb-1 truncate">{s.icon}{s.label}</div>
              <p className={`text-sm sm:text-base font-bold truncate ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-100 shadow-sm p-3 sm:p-5 space-y-3 sm:space-y-4">

        {/* Search row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, mobile, account…"
              className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          {/* Action buttons — scrollable row on xs so they never wrap strangely */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 sm:flex-wrap sm:overflow-visible no-scrollbar">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
                showFilters ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <SlidersHorizontal size={13} /> Filters
            </button>
            <button
              onClick={() => setSortLatest(v => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition whitespace-nowrap shrink-0"
            >
              {sortLatest ? "Latest First" : "Oldest First"}
            </button>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-100 transition whitespace-nowrap shrink-0"
            >
              <X size={13} /> Reset
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            {/* Type filter */}
            <div className="space-y-2">
              <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Filter size={10} /> Transaction Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["all","DEPOSIT","TRANSFER","WITHDRAW"].map(t => (
                  <button
                    key={t}
                    onClick={() => { setTxnType(t); setPage(1); }}
                    className={`rounded-lg sm:rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      txnType === t
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {t === "all" ? "All Types" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Calendar size={10} /> Date Range
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DATE_RANGES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`rounded-lg sm:rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      dateRange === r.key
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {dateRange === "custom" && (
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 pt-1">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Table / Cards ─────────────────────────────────────────────── */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{filtered.length}</span> transactions
            {txnType !== "all" && <span className="ml-1 text-indigo-600 font-medium">· {txnType}</span>}
            {fromDate && toDate && <span className="ml-1 text-slate-400 hidden sm:inline">· {fromDate} → {toDate}</span>}
          </p>
          <p className="text-xs text-slate-400">{sortLatest ? "Latest first" : "Oldest first"}</p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 gap-3">
            <svg className="animate-spin h-8 w-8 sm:h-9 sm:w-9 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-sm text-slate-500">Loading transactions...</p>
          </div>

        /* Empty */
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 gap-3">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Search size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No transactions found</p>
            <p className="text-xs text-slate-400">Try adjusting filters or search term</p>
          </div>

        ) : (
          <>
            {/* Desktop / Tablet table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Customer","Email","Mobile","From Account","To Account","Type","Amount","Remarks","Date"].map(h => (
                      <th key={h} className="px-4 lg:px-5 py-3 lg:py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((tx, i) => (
                    <tr key={tx.id || i} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 lg:px-5 py-3 lg:py-4 text-sm font-semibold text-slate-800 whitespace-nowrap max-w-[120px] truncate">{tx.customerName || "-"}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 text-xs text-slate-600 max-w-[140px] truncate">{tx.email || "-"}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 text-xs text-slate-600 whitespace-nowrap">{tx.mobile || "-"}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 font-mono text-xs text-slate-600 whitespace-nowrap">{tx.fromAccount || "-"}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{tx.toAccount || "-"}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4"><TypeBadge type={tx.transactionType} /></td>
                      <td className={`px-4 lg:px-5 py-3 lg:py-4 text-sm font-bold whitespace-nowrap ${amountColor(tx.transactionType)}`}>
                        {amountPrefix(tx.transactionType)}₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 text-xs text-slate-500 max-w-[120px] truncate">{tx.remarks || "-"}</td>
                      <td className="px-4 lg:px-5 py-3 lg:py-4 text-xs text-slate-500 whitespace-nowrap">
                        {tx.transactionDate
                          ? new Date(tx.transactionDate).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {paged.map((tx, i) => (
                <div key={tx.id || i} className="px-4 py-4 space-y-3">
                  {/* Row 1: name + amount */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{tx.customerName || "-"}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{tx.email || "-"}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className={`text-base font-bold ${amountColor(tx.transactionType)}`}>
                        {amountPrefix(tx.transactionType)}₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                      </p>
                      <TypeBadge type={tx.transactionType} />
                    </div>
                  </div>

                  {/* Row 2: details grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div className="min-w-0">
                      <span className="text-slate-400">Mobile </span>
                      <span className="text-slate-700 font-medium">{tx.mobile || "-"}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400">From </span>
                      <span className="font-mono text-slate-700 break-all">{tx.fromAccount || "-"}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400">To </span>
                      <span className="font-mono text-slate-700 break-all">{tx.toAccount || "-"}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400">Remarks </span>
                      <span className="text-slate-700 truncate">{tx.remarks || "-"}</span>
                    </div>
                    <div className="col-span-2 text-slate-400 text-[11px] pt-0.5">
                      {tx.transactionDate
                        ? new Date(tx.transactionDate).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                        : "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs sm:text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)}</span>
              {" "}of{" "}
              <span className="font-semibold text-slate-700">{filtered.length}</span>
            </p>

            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
              {/* First */}
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg sm:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold shrink-0"
              >«</button>

              {/* Prev */}
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg sm:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {paginationItems.map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-slate-400 text-sm shrink-0">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
                      page === p
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => setPage(p => Math.min(pageCount, p+1))}
                disabled={page === pageCount}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg sm:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <ChevronRight size={15} />
              </button>

              {/* Last */}
              <button
                onClick={() => setPage(pageCount)}
                disabled={page === pageCount}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg sm:rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold shrink-0"
              >»</button>
            </div>
          </div>
        )}
      </div>

      {/* Hide scrollbar utility (add to global CSS or keep inline) */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}