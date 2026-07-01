import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/api";
import {
  Search, Download, SlidersHorizontal, ArrowUpDown, ChevronLeft,
  ChevronRight, TrendingUp, TrendingDown, RefreshCw, X, Calendar,
  ArrowUpCircle, ArrowDownCircle, Repeat2, Filter
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DATE_RANGES = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "7days", label: "7 Days" },
  { key: "30days", label: "30 Days" },
  { key: "custom", label: "Custom" },
];

const TYPE_CONFIG = {
  DEPOSIT:  { color: "bg-emerald-100 text-emerald-700", icon: <ArrowDownCircle size={13} /> },
  TRANSFER: { color: "bg-indigo-100 text-indigo-700",  icon: <Repeat2 size={13} /> },
  WITHDRAW: { color: "bg-rose-100 text-rose-700",      icon: <ArrowUpCircle size={13} /> },
};

export default function Transactions() {
  const [txns, setTxns]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all");
  const [txnType, setTxnType]         = useState("all");
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const [page, setPage]               = useState(1);
  const [sortByLatest, setSortByLatest] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const PAGE_SIZE = 8;

  const accountNumber = localStorage.getItem("accountNumber");

  useEffect(() => { loadTransactions(); }, []);

  const loadTransactions = async () => {
    try {
      const res = await API.get(`/api/transactions/${accountNumber}`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.transactions || [];
      setTxns(data);
    } catch { setTxns([]); }
    finally { setLoading(false); }
  };

  const fmt = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  const setRange = (range) => {
    setFilter(range); setPage(1);
    const today = new Date();
    if (range === "today") { const s = fmt(today); setFromDate(s); setToDate(s); }
    else if (range === "7days")  { const f = new Date(today); f.setDate(f.getDate()-6);  setFromDate(fmt(f)); setToDate(fmt(today)); }
    else if (range === "30days") { const f = new Date(today); f.setDate(f.getDate()-29); setFromDate(fmt(f)); setToDate(fmt(today)); }
    else if (range === "all") { setFromDate(""); setToDate(""); setSearch(""); setTxnType("all"); }
  };

  const resetAll = () => { setFilter("all"); setSearch(""); setTxnType("all"); setFromDate(""); setToDate(""); setSortByLatest(true); setPage(1); };

  const pick = (...args) => args.find(v => v && String(v).trim()) || null;

  const getDisplayName = (t) => pick(t.name, t.fullName, t.customerName, t.senderName, t.receiverName, t.recipientName, t.beneficiaryName, t.fromName, t.toName) || "-";
  const getDisplayMobile = (t) => pick(t.mobile, t.mobileNumber, t.phone, t.contactNumber, t.fromMobile, t.toMobile, t.senderMobile, t.receiverMobile) || "-";
  const getDisplayEmail = (t) => pick(t.email, t.userEmail, t.customerEmail, t.senderEmail, t.receiverEmail, t.fromEmail, t.toEmail) || "-";
  const getAccount = (t) => pick(t.accountNumber, t.accountNo, t.fromAccount, t.toAccount) || "-";

  const filteredTxns = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txns
      .filter((t) => {
        if (q) {
          const haystack = [
            t.amount?.toString(),
            getDisplayName(t),
            getDisplayMobile(t),
            getDisplayEmail(t),
            getAccount(t),
            t.fromAccount,
            t.toAccount,
            t.transactionType,
          ].filter(Boolean).map(v => v.toLowerCase());
          if (!haystack.some(v => v.includes(q))) return false;
        }
        if (fromDate && toDate) {
  const txDate = new Date(t.transactionDate);

  const localDate =
    `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}-${String(txDate.getDate()).padStart(2, "0")}`;

  if (localDate < fromDate || localDate > toDate) {
    return false;
  }
}
      })
      .sort((a, b) => {
        const da = new Date(a.transactionDate).getTime();
        const db = new Date(b.transactionDate).getTime();
        return sortByLatest ? db - da : da - db;
      });
  }, [txns, search, txnType, fromDate, toDate, sortByLatest]);

  const pageCount = Math.max(1, Math.ceil(filteredTxns.length / PAGE_SIZE));
  const pagedTxns = filteredTxns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalDeposit  = filteredTxns.filter(t => t.transactionType?.toUpperCase() === "DEPOSIT").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalWithdraw = filteredTxns.filter(t => t.transactionType?.toUpperCase() === "WITHDRAW").reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalTransfer = filteredTxns.filter(t => t.transactionType?.toUpperCase() === "TRANSFER").reduce((s, t) => s + Number(t.amount || 0), 0);

  const handleDownload = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFillColor(67, 56, 202);
    doc.rect(0, 0, 297, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("NeoBank", 14, 12);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Transaction Statement", 14, 20);

    const dateLabel = fromDate && toDate ? `${fromDate} to ${toDate}` : "All Time";
    doc.text(`Period: ${dateLabel}`, 200, 12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 20);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    const summaryY = 34;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Transactions: ${filteredTxns.length}`, 14, summaryY);
    doc.text(`Total Deposits: Rs ${totalDeposit.toLocaleString("en-IN")}`, 80, summaryY);
    doc.text(`Total Withdrawals: Rs ${totalWithdraw.toLocaleString("en-IN")}`, 160, summaryY);
    doc.text(`Total Transfers: Rs ${totalTransfer.toLocaleString("en-IN")}`, 230, summaryY);

    autoTable(doc, {
      startY: summaryY + 8,
      head: [["Type", "Amount (Rs)", "Account", "Name", "Mobile", "Email", "From", "To", "Date"]],
      body: filteredTxns.map((t) => [
        t.transactionType || "-",
        Number(t.amount || 0).toLocaleString("en-IN"),
        getAccount(t),
        getDisplayName(t),
        getDisplayMobile(t),
        getDisplayEmail(t),
        t.fromAccount || "-",
        t.toAccount || "-",
        t.transactionDate ? new Date(t.transactionDate).toLocaleString() : "-",
      ]),
      styles: { fontSize: 7.5, cellPadding: 3 },
      headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      columnStyles: { 1: { halign: "right" } },
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(7); doc.setTextColor(150);
    doc.text("This is a system-generated statement. NeoBank © " + new Date().getFullYear(), 14, pageHeight - 6);

    doc.save(`NeoBank_Statement_${fmt(new Date())}.pdf`);
  };

  const TypeBadge = ({ type }) => {
    const cfg = TYPE_CONFIG[type?.toUpperCase()] || { color: "bg-slate-100 text-slate-600", icon: null };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
        {cfg.icon}{type || "-"}
      </span>
    );
  };

  const amountColor = (type) => {
    const t = type?.toUpperCase();
    if (t === "DEPOSIT")  return "text-emerald-600";
    if (t === "WITHDRAW") return "text-rose-600";
    return "text-indigo-600";
  };

  const amountPrefix = (type) => {
    const t = type?.toUpperCase();
    if (t === "DEPOSIT")  return "+";
    if (t === "WITHDRAW") return "-";
    return "";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 space-y-5">

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-7 py-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute right-10 bottom-0 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Account Activity</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold">Transaction History</h1>
            <p className="mt-1.5 text-sm text-indigo-200">{accountNumber && `Account: ${accountNumber}`}</p>
          </div>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-all"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>

        {/* Summary strip */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", val: filteredTxns.length, unit: "txns", icon: <RefreshCw size={14} /> },
            { label: "Deposits", val: `₹${totalDeposit.toLocaleString("en-IN")}`, icon: <TrendingUp size={14} /> },
            { label: "Withdrawals", val: `₹${totalWithdraw.toLocaleString("en-IN")}`, icon: <TrendingDown size={14} /> },
            { label: "Transfers", val: `₹${totalTransfer.toLocaleString("en-IN")}`, icon: <Repeat2 size={14} /> },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10">
              <div className="flex items-center gap-1.5 text-indigo-300 text-xs mb-1">{s.icon}{s.label}</div>
              <p className="text-base font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by amount, name, mobile, email, account..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${showFilters ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
            <button
              onClick={() => setSortByLatest(v => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              <ArrowUpDown size={14} /> {sortByLatest ? "Latest" : "Oldest"}
            </button>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100 transition"
            >
              <X size={14} /> Reset
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Filter size={10} />Type</label>
              <select
                value={txnType}
                onChange={(e) => { setTxnType(e.target.value); setPage(1); }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
              >
                <option value="all">All Types</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="TRANSFER">Transfer</option>
                <option value="WITHDRAW">Withdraw</option>
              </select>
            </div>

            {/* Date range pills */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Calendar size={10} />Date Range</label>
              <div className="flex flex-wrap gap-2">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${filter === r.key ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {filter === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
                  <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{filteredTxns.length}</span> transactions found
          </p>
          <p className="text-xs text-slate-400">{sortByLatest ? "Sorted: latest first" : "Sorted: oldest first"}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-sm text-slate-500">Loading transactions...</p>
          </div>
        ) : filteredTxns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Search size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No transactions found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Type", "Amount", "Account", "Name", "Mobile", "Email", "From", "To", "Date"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pagedTxns.map((t, i) => (
                    <tr key={i} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="px-5 py-4"><TypeBadge type={t.transactionType} /></td>
                      <td className={`px-5 py-4 font-bold ${amountColor(t.transactionType)}`}>
                        {amountPrefix(t.transactionType)}₹{Number(t.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-mono text-xs">{getAccount(t)}</td>
                      <td className="px-5 py-4 text-slate-700 font-medium">{getDisplayName(t)}</td>
                      <td className="px-5 py-4 text-slate-600">{getDisplayMobile(t)}</td>
                      <td className="px-5 py-4 text-slate-600 text-xs">{getDisplayEmail(t)}</td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-xs">{t.fromAccount || "-"}</td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-xs">{t.toAccount || "-"}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {t.transactionDate ? new Date(t.transactionDate).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {pagedTxns.map((t, i) => (
                <div key={i} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <TypeBadge type={t.transactionType} />
                    <span className={`text-base font-bold ${amountColor(t.transactionType)}`}>
                      {amountPrefix(t.transactionType)}₹{Number(t.amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-slate-400">Name </span><span className="text-slate-700 font-medium">{getDisplayName(t)}</span></div>
                    <div><span className="text-slate-400">Mobile </span><span className="text-slate-700">{getDisplayMobile(t)}</span></div>
                    <div className="col-span-2"><span className="text-slate-400">Email </span><span className="text-slate-700">{getDisplayEmail(t)}</span></div>
                    <div><span className="text-slate-400">From </span><span className="text-slate-700 font-mono">{t.fromAccount || "-"}</span></div>
                    <div><span className="text-slate-400">To </span><span className="text-slate-700 font-mono">{t.toAccount || "-"}</span></div>
                    <div className="col-span-2 text-slate-400">
                      {t.transactionDate ? new Date(t.transactionDate).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && filteredTxns.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredTxns.length)}</span> of <span className="font-semibold text-slate-700">{filteredTxns.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-bold"
              >«</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              ><ChevronLeft size={15} /></button>

              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="h-8 w-8 flex items-center justify-center text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 flex items-center justify-center rounded-xl text-xs font-semibold transition ${page === p ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-slate-100"}`}
                    >{p}</button>
                  )
                )}

              <button
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              ><ChevronRight size={15} /></button>
              <button
                onClick={() => setPage(pageCount)}
                disabled={page === pageCount}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs font-bold"
              >»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}