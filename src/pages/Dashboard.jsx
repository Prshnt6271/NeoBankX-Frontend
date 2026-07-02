import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  memo,
} from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ============================================================
// THEME TOKENS — "Classic Trust" deep blues + "Growth & Stability"
// teal/emerald, on clean neutral (slate) surfaces.
// ============================================================
const THEME = {
  heroGradient: "from-blue-900 via-blue-800 to-teal-700",
  heroGlowA: "bg-teal-300/20",
  heroGlowB: "bg-blue-300/10",
  accentGradient: "from-blue-700 to-teal-600",
  accentSolid: "#0f766e", // teal-700
  accentSolidAlt: "#1d4ed8", // blue-700
  ring: "focus-visible:ring-teal-500",
};

// Category palette derived from the theme (blues -> teals -> emerald),
// with a neutral slate reserved for anything uncategorized.
const CATEGORY_COLORS = [
  "#1d4ed8", // blue-700
  "#0f766e", // teal-700
  "#059669", // emerald-600
  "#3b82f6", // blue-500
  "#2dd4bf", // teal-400
  "#64748b", // slate-500 (fallback / "Other")
];

// ---------- Helpers ----------
const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const formatShortCurrency = (value) => formatCurrency(value).replace("INR", "₹");

const getDateRange = (period) => {
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      start.setDate(now.getDate() - now.getDay());
      break;
    case "monthly":
      start.setDate(1);
      break;
    case "yearly":
      start.setMonth(0, 1);
      break;
    default:
      start.setDate(now.getDate() - 30);
  }
  return start;
};

// A transaction is treated as "money in" (credit) if its type mentions
// deposit; everything else (withdraw, transfer, FD creation, bill pay, etc.)
// is treated as "money out" (debit/spend). This keeps "Total Spent" and the
// spending charts from being skewed by incoming money, which was previously
// mixed together and produced misleading totals/graphs.
const isCreditType = (type) => /deposit/i.test(type || "");

// ---------- Animated Balance ----------
const AnimatedBalance = memo(({ amount }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const prevAmountRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = prevAmountRef.current;
    const to = Number(amount) || 0;
    const duration = 600;

    const step = (now) => {
      const elapsed = Math.min(now - start, duration);
      const t = elapsed / duration;
      const eased = 1 - (1 - t) * (1 - t);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        prevAmountRef.current = to;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  return (
    <p className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
      {formatShortCurrency(display)}
    </p>
  );
});

// ---------- Skeleton (only for initial load) ----------
const SkeletonCard = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-[1.75rem] bg-slate-200/70 ${className}`}
  >
    <div className="h-full w-full rounded-[1.75rem] bg-gradient-to-br from-slate-100/50 to-slate-200/50" />
  </div>
);

// ---------- Custom chart tooltips (themed, accurate values) ----------
const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-teal-700">
        {formatShortCurrency(payload[0].value)}
      </p>
    </div>
  );
};

// ---------- Full category breakdown (always visible — works identically
// on touch and mouse devices, so nothing is hidden behind hover-only UX) ----------
const CategoryBreakdownList = ({ categories, total, activeName, onHover }) => (
  <ul className="mt-5 space-y-2">
    {categories.map((entry, index) => {
      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
      const isActive = activeName === entry.name;
      return (
        <li
          key={entry.name}
          onMouseEnter={() => onHover(entry.name)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onHover(isActive ? null : entry.name)}
          className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition duration-150 ${
            isActive ? "bg-slate-100" : "hover:bg-slate-50"
          }`}
        >
          <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
              }}
            />
            {entry.name}
          </span>
          <span className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-slate-900">
              {formatShortCurrency(entry.value)}
            </span>
            <span className="text-xs text-slate-400">{pct}%</span>
          </span>
        </li>
      );
    })}
  </ul>
);

// ---------- Main Dashboard ----------
const Dashboard = memo(() => {
  const navigate = useNavigate();
  const accountNumber = localStorage.getItem("accountNumber");

  // ---- State ----
  const [data, setData] = useState(null);
  const [txns, setTxns] = useState([]);
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  // Guards against overlapping requests (a slow request combined with a
  // 5s poll could otherwise pile up in-flight calls and make everything
  // feel sluggish) and lets us cancel stale requests on unmount.
  const isFetchingRef = useRef(false);
  const abortRef = useRef(null);

  // ---- Data normalisation (unchanged) ----
  const resolveDashboardPayload = (rawData) => {
    if (!rawData || typeof rawData !== "object") return rawData;
    if (Array.isArray(rawData)) return rawData;
    if (rawData.account || rawData.accountDetails || rawData.payload) {
      return rawData.account ?? rawData.accountDetails ?? rawData.payload;
    }
    if (rawData.data && typeof rawData.data === "object") {
      return resolveDashboardPayload(rawData.data);
    }
    if (rawData.response && typeof rawData.response === "object") {
      return resolveDashboardPayload(rawData.response);
    }
    return rawData;
  };

  const normalizeDashboardData = (rawData) => {
    const payload = resolveDashboardPayload(rawData) ?? {};
    const statusValue =
      payload.active ?? payload.isActive ?? payload.status ?? payload.accountStatus;
    const active =
      typeof statusValue === "boolean"
        ? statusValue
        : typeof statusValue === "string"
        ? ["active", "true", "yes", "open"].includes(statusValue.toLowerCase())
        : Boolean(statusValue);

    return {
      ...payload,
      active,
      accountNumber: payload.accountNumber || payload.accountNo || accountNumber,
      accountType: payload.accountType || payload.type || payload.accountTypeName || "N/A",
      balance: payload.balance ?? payload.accountBalance ?? payload.currentBalance ?? 0,
      status: payload.status || (active ? "Active" : "Inactive"),
    };
  };

  // ---- Data fetching (silent option, abortable) ----
  const loadDashboard = useCallback(async (silent, signal) => {
    try {
      const res = await API.get("/api/dashboard", { signal });
      setData(normalizeDashboardData(res.data));
      setError("");
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      console.error(err);
      if (!silent) setError("Unable to load dashboard data.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTxns = useCallback(
    async (silent, signal) => {
      try {
        const res = await API.get(`/api/transactions/${accountNumber}`, { signal });
        setTxns(res.data || []);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.error(err);
        if (!silent) setError("Unable to load transactions.");
      }
    },
    [accountNumber]
  );

  // ---- Shared fetch runner: dedupes overlapping calls, cancels stale ones ----
  const runFetch = useCallback(
    async (silent) => {
      if (isFetchingRef.current) return; // a fetch is already in flight, skip this tick
      isFetchingRef.current = true;

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await Promise.all([
          loadDashboard(silent, controller.signal),
          loadTxns(silent, controller.signal),
        ]);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [loadDashboard, loadTxns]
  );

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    await runFetch(true);
    setLoading(false);
  }, [runFetch]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await runFetch(true);
    setRefreshing(false);
  }, [runFetch]);

  // ---- Initial load + polling every 5 seconds, paused while the tab is
  // hidden so background tabs don't burn cycles/bandwidth (a big source
  // of perceived slowness once you switch back). ----
  useEffect(() => {
    fetchInitial();

    let interval = null;
    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => runFetch(true), 5000);
    };
    const stopPolling = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        runFetch(true); // catch up immediately on return
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchInitial, runFetch]);

  // ---- Memoized filtered transactions ----
  const filteredTxns = useMemo(() => {
    const startDate = getDateRange(timePeriod);
    return txns.filter((tx) => new Date(tx.transactionDate) >= startDate);
  }, [txns, timePeriod]);

  const latestTxns = useMemo(() => {
    if (!filteredTxns || filteredTxns.length === 0) return [];
    return [...filteredTxns]
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 5);
  }, [filteredTxns]);

  // Only debit-side transactions count as "spend" — deposits are money in,
  // not spend, and mixing them in was producing inaccurate totals/charts.
  const debitTxns = useMemo(
    () => filteredTxns.filter((tx) => !isCreditType(tx.transactionType)),
    [filteredTxns]
  );

  // ---- Analytics (built only from real, correctly-signed spend data) ----
  const analyticsData = useMemo(() => {
    if (!debitTxns || debitTxns.length === 0) return null;

    const groupByDate = {};
    const categorySpending = {};

    debitTxns.forEach((tx) => {
      const date = new Date(tx.transactionDate).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      const category = tx.transactionType || "Other";
      const amount = Math.abs(Number(tx.amount) || 0);

      groupByDate[date] = (groupByDate[date] || 0) + amount;
      categorySpending[category] = (categorySpending[category] || 0) + amount;
    });

    return {
      timeline: Object.entries(groupByDate)
        .map(([date, amount]) => ({
          date,
          amount: parseFloat(amount.toFixed(2)),
        }))
        // keep the trend chronological, not insertion-order
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
      categories: Object.entries(categorySpending)
        .map(([name, value]) => ({
          name,
          value: parseFloat(value.toFixed(2)),
        }))
        .sort((a, b) => b.value - a.value),
    };
  }, [debitTxns]);

  // ---- Metrics (debit-only, so "Total Spent" actually means spent) ----
  const totalSpent = useMemo(
    () => debitTxns.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0),
    [debitTxns]
  );

  const avgTransaction = useMemo(
    () => (debitTxns.length > 0 ? totalSpent / debitTxns.length : 0),
    [debitTxns, totalSpent]
  );

  const maxTransaction = useMemo(
    () =>
      debitTxns.length > 0
        ? Math.max(...debitTxns.map((tx) => Math.abs(Number(tx.amount) || 0)))
        : 0,
    [debitTxns]
  );

  const growthRate = useMemo(() => {
    const now = new Date();
    const startDate = getDateRange(timePeriod);
    const midDate = new Date((startDate.getTime() + now.getTime()) / 2);

    const firstHalf = debitTxns.filter((tx) => new Date(tx.transactionDate) < midDate);
    const secondHalf = debitTxns.filter((tx) => new Date(tx.transactionDate) >= midDate);

    const firstSum = firstHalf.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const secondSum = secondHalf.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

    if (firstSum === 0) return 0;
    return (((secondSum - firstSum) / firstSum) * 100).toFixed(1);
  }, [debitTxns, timePeriod]);

  const categoryTotal = analyticsData?.categories.reduce((s, c) => s + c.value, 0) || 0;

  const statusLabel = data?.active ? "Active" : data?.status || "Inactive";

  // ---- Render ----
  if (error && loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-200/80">
        <p className="text-base text-rose-600">{error}</p>
        <button
          onClick={fetchInitial}
          className="mt-4 rounded-full bg-blue-700 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6 px-2 pb-6 sm:px-0">
        <SkeletonCard className="h-64 w-full" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard className="h-80 w-full" />
          <SkeletonCard className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 pb-6 sm:px-0">
      {/* ---------- Main Account Card ---------- */}
      <section
        className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${THEME.heroGradient} p-6 text-white shadow-2xl shadow-blue-950/20 fade-in-up sm:p-8`}
      >
        <div
          className={`pointer-events-none absolute -right-16 top-10 h-52 w-52 rounded-full ${THEME.heroGlowA} blur-3xl`}
        />
        <div
          className={`pointer-events-none absolute left-8 top-16 h-32 w-32 rounded-full ${THEME.heroGlowB} blur-2xl`}
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.32em] text-teal-100/80">
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Your banking hub
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-blue-100/90 sm:text-base">
              Real-time analytics and insights for smarter financial decisions.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-50 shadow-lg shadow-blue-900/20">
            Account #{data.accountNumber || "N/A"}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card-frost rounded-[1.75rem] border border-white/20 p-5 shadow-xl shadow-slate-950/5">
            <p className="text-sm uppercase tracking-[0.24em] text-teal-100/80">
              Live balance
            </p>
            <AnimatedBalance amount={data.balance} />
            <p className="mt-2 text-xs text-blue-100/80">Updates every 5 seconds</p>
          </div>

          <div className="card-frost rounded-[1.75rem] border border-white/20 p-5 shadow-xl shadow-slate-950/5">
            <p className="text-sm uppercase tracking-[0.24em] text-teal-100/80">
              Account type
            </p>
            <p className="mt-4 text-2xl font-semibold">{data.accountType}</p>
          </div>

          <div className="card-frost rounded-[1.75rem] border border-white/20 p-5 shadow-xl shadow-slate-950/5">
            <p className="text-sm uppercase tracking-[0.24em] text-teal-100/80">
              Status
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                data.active
                  ? "bg-emerald-100/90 text-emerald-900"
                  : "bg-slate-200/90 text-slate-700"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={`btn-glow inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-blue-900 outline-none transition duration-200 hover:bg-slate-100 focus-visible:ring-2 ${THEME.ring}`}
              onClick={() => navigate("/transfer")}
            >
              Transfer
            </button>
            <button
              type="button"
              className={`btn-glow inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-blue-900 outline-none transition duration-200 hover:bg-slate-100 focus-visible:ring-2 ${THEME.ring}`}
              onClick={() => navigate("/deposit")}
            >
              Deposit
            </button>
            <button
              type="button"
              className={`btn-glow inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-blue-900 outline-none transition duration-200 hover:bg-slate-100 focus-visible:ring-2 ${THEME.ring}`}
              onClick={() => navigate("/withdraw")}
            >
              Withdraw
            </button>
          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-white/20 disabled:opacity-70"
          >
            {refreshing && (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {refreshing ? "Refreshing..." : "Refresh dashboard"}
          </button>
        </div>
      </section>

      {/* ---------- Time Period Selector ---------- */}
      <div className="flex flex-wrap gap-2 rounded-[1.75rem] bg-white p-4 shadow-lg shadow-slate-200/60">
        {["today", "weekly", "monthly", "yearly"].map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition duration-200 ${
              timePeriod === period
                ? `bg-gradient-to-r ${THEME.accentGradient} text-white shadow-lg shadow-teal-600/30`
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* ---------- Key Metrics ---------- */}
      {analyticsData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Total Spent
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {formatShortCurrency(totalSpent)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {debitTxns.length} debit transactions
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Average Transaction
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {formatShortCurrency(avgTransaction)}
            </p>
            <p className="mt-2 text-xs text-slate-500">Per debit transaction</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Highest Transaction
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {formatShortCurrency(maxTransaction)}
            </p>
            <p className="mt-2 text-xs text-slate-500">Max debit amount</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Growth Rate
            </p>
            <p
              className={`mt-4 text-2xl font-semibold ${
                growthRate >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {growthRate >= 0 ? "+" : ""}
              {growthRate}%
            </p>
            <p className="mt-2 text-xs text-slate-500">Period-over-period spend</p>
          </div>
        </div>
      )}

      {/* ---------- Charts ---------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {analyticsData && analyticsData.timeline.length > 0 && (
          <div className="rounded-[1.75rem] bg-white p-6 shadow-lg shadow-slate-200/60">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Transaction Trend
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Spending over time
              </h2>
            </div>
            <div className="h-[240px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analyticsData.timeline}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME.accentSolid} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={THEME.accentSolid} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={THEME.accentSolid}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    isAnimationActive={false}
                    activeDot={{ r: 5, fill: THEME.accentSolid }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {analyticsData && analyticsData.categories.length > 0 && (
          <div
            className="rounded-[1.75rem] bg-white p-6 shadow-lg shadow-slate-200/60"
            onMouseLeave={() => setActiveCategory(null)}
          >
            <div className="mb-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Category Breakdown
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Spending by type
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
              <div className="h-[220px] sm:h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={86}
                      paddingAngle={2}
                      dataKey="value"
                      isAnimationActive={false}
                      onMouseEnter={(entry) => setActiveCategory(entry.name)}
                      onClick={(entry) =>
                        setActiveCategory((prev) => (prev === entry.name ? null : entry.name))
                      }
                    >
                      {analyticsData.categories.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          opacity={
                            activeCategory && activeCategory !== entry.name ? 0.35 : 1
                          }
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatShortCurrency(value)}
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Full breakdown — always rendered so every category (Transfer,
                  Deposit, FD Create, Withdraw, ...) is visible on both touch
                  and pointer devices, not just whichever slice happens to be
                  under the cursor. Hovering/tapping a row (or a slice) cross
                  -highlights the other. */}
              <CategoryBreakdownList
                categories={analyticsData.categories}
                total={categoryTotal}
                activeName={activeCategory}
                onHover={setActiveCategory}
              />
            </div>
          </div>
        )}
      </div>

      {/* ---------- Account Details & Recent Activity ---------- */}
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[1.75rem] bg-white p-6 shadow-lg shadow-slate-200/60">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
            Account details
          </p>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Secure overview
          </h2>
          <div className="mt-5 grid gap-4">
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Account number</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {data.accountNumber}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Account type</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {data.accountType}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Transactions</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {filteredTxns.length} in period
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-lg shadow-slate-200/60 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Recent activity
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Latest transactions
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate("/transactions")}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-100"
            >
              View all
            </button>
          </div>

          {latestTxns.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No transactions in this period.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {latestTxns.map((tx, index) => (
                <li
                  key={tx.id ?? index}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {tx.transactionType || "Transaction"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(tx.transactionDate).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${
                        isCreditType(tx.transactionType)
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {isCreditType(tx.transactionType) ? "+" : "-"}
                      {formatShortCurrency(Math.abs(tx.amount))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
});

export default Dashboard;