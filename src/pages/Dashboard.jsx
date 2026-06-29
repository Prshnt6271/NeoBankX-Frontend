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

// ---------- Helpers ----------
const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

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

// ---------- Animated Balance ----------
const AnimatedBalance = memo(({ amount }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = Number(display) || 0;
    const to = Number(amount) || 0;
    const duration = 800;

    const step = (now) => {
      const elapsed = Math.min(now - start, duration);
      const t = elapsed / duration;
      const eased = 1 - (1 - t) * (1 - t);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [amount]);

  return (
    <p className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
      {formatCurrency(display).replace("INR", "₹")}
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

  // ---- Data fetching (silent option) ----
  const loadDashboard = useCallback(async (silent = false) => {
    try {
      const res = await API.get("/api/dashboard");
      setData(normalizeDashboardData(res.data));
      setError("");
    } catch (err) {
      console.error(err);
      if (!silent) setError("Unable to load dashboard data.");
    }
  }, []);

  const loadTxns = useCallback(async (silent = false) => {
    try {
      const res = await API.get(`/transactions/${accountNumber}`);
      setTxns(res.data || []);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Unable to load transactions.");
    }
  }, [accountNumber]);

  // ---- Initial load ----
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDashboard(true), loadTxns(true)]);
    setLoading(false);
  }, [loadDashboard, loadTxns]);

  // ---- Silent refresh (background) ----
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadDashboard(true), loadTxns(true)]);
    setRefreshing(false);
  }, [loadDashboard, loadTxns]);

  // ---- Polling every 5 seconds (silent) ----
  useEffect(() => {
    fetchInitial();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [fetchInitial, refreshData]);

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

  // ---- Analytics ----
  const analyticsData = useMemo(() => {
    if (!filteredTxns || filteredTxns.length === 0) return null;

    const groupByDate = {};
    const categorySpending = {};

    filteredTxns.forEach((tx) => {
      const date = new Date(tx.transactionDate).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      const category = tx.transactionType || "Other";
      const amount = Number(tx.amount) || 0;

      groupByDate[date] = (groupByDate[date] || 0) + amount;
      categorySpending[category] = (categorySpending[category] || 0) + amount;
    });

    return {
      timeline: Object.entries(groupByDate).map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2)),
      })),
      categories: Object.entries(categorySpending).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      })),
    };
  }, [filteredTxns]);

  // ---- Metrics ----
  const totalSpent = useMemo(
    () => filteredTxns.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
    [filteredTxns]
  );

  const avgTransaction = useMemo(
    () => (filteredTxns.length > 0 ? totalSpent / filteredTxns.length : 0),
    [filteredTxns, totalSpent]
  );

  const maxTransaction = useMemo(
    () =>
      filteredTxns.length > 0
        ? Math.max(...filteredTxns.map((tx) => Number(tx.amount) || 0))
        : 0,
    [filteredTxns]
  );

  const growthRate = useMemo(() => {
    const now = new Date();
    const startDate = getDateRange(timePeriod);
    const midDate = new Date((startDate.getTime() + now.getTime()) / 2);

    const firstHalf = filteredTxns.filter(
      (tx) => new Date(tx.transactionDate) < midDate
    );
    const secondHalf = filteredTxns.filter(
      (tx) => new Date(tx.transactionDate) >= midDate
    );

    const firstSum = firstHalf.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const secondSum = secondHalf.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    if (firstSum === 0) return 0;
    return (((secondSum - firstSum) / firstSum) * 100).toFixed(1);
  }, [filteredTxns, timePeriod]);

  const statusLabel = data?.active ? "Active" : data?.status || "Inactive";
  const COLORS = ["#0ea5e9", "#06b6d4", "#0d9488", "#8b5cf6", "#ec4899", "#f59e0b"];

  // ---- Render ----
  if (error && loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-200/80">
        <p className="text-base text-rose-600">{error}</p>
        <button
          onClick={fetchInitial}
          className="mt-4 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white"
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
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-600 via-cyan-500 to-indigo-600 p-6 text-white shadow-2xl shadow-slate-900/10 fade-in-up sm:p-8">
        <div className="pointer-events-none absolute -right-16 top-10 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute left-8 top-16 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/80">
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Your banking hub
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-cyan-100/90 sm:text-base">
              Real-time analytics and insights for smarter financial decisions.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/20 bg-white/10 px-4 py-3 text-sm text-cyan-50 shadow-lg shadow-cyan-500/20">
            Account #{data.accountNumber || "N/A"}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card-frost rounded-[1.75rem] border border-white/20 p-5 shadow-xl shadow-slate-950/5">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/80">
              Live balance
            </p>
            <AnimatedBalance amount={data.balance} />
            <p className="mt-2 text-xs text-cyan-100/80">Updates every 5 seconds</p>
          </div>

          <div className="card-frost rounded-[1.75rem] border border-white/20 p-5 shadow-xl shadow-slate-950/5">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/80">
              Account type
            </p>
            <p className="mt-4 text-2xl font-semibold">{data.accountType}</p>
          </div>

          <div className="card-frost rounded-[1.75rem] border border-white/20 p-5 shadow-xl shadow-slate-950/5">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/80">
              Status
            </p>
            <span
              className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                data.active
                  ? "bg-emerald-100/90 text-emerald-900"
                  : "bg-rose-100/90 text-rose-900"
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
              className="btn-glow inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-slate-100"
              onClick={() => navigate("/transfer")}
            >
              Transfer
            </button>
            <button
              type="button"
              className="btn-glow inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-slate-100"
              onClick={() => navigate("/deposit")}
            >
              Deposit
            </button>
            <button
              type="button"
              className="btn-glow inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-slate-100"
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
                ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/30"
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
              {formatCurrency(totalSpent).replace("INR", "₹")}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {filteredTxns.length} transactions
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Average Transaction
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {formatCurrency(avgTransaction).replace("INR", "₹")}
            </p>
            <p className="mt-2 text-xs text-slate-500">Per transaction</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Highest Transaction
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {formatCurrency(maxTransaction).replace("INR", "₹")}
            </p>
            <p className="mt-2 text-xs text-slate-500">Max amount</p>
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
            <p className="mt-2 text-xs text-slate-500">Period-over-period</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.timeline}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.75rem",
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {analyticsData && analyticsData.categories.length > 0 && (
          <div className="rounded-[1.75rem] bg-white p-6 shadow-lg shadow-slate-200/60">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Category Breakdown
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Spending by type
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${formatCurrency(value).replace("INR", "₹")}`
                  }
                  outerRadius={80}
                  fill="#0ea5e9"
                  dataKey="value"
                >
                  {analyticsData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
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
                    <div className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
                      {formatCurrency(tx.amount).replace("INR", "₹")}
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