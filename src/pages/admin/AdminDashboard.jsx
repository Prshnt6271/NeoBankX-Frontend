import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Search, TrendingUp, Users, Wallet, ArrowUpRight,
  ShieldCheck, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import API from "../../api/api";

// ─── constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

// ─── helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (value) => {
  const n = Number(value) || 0;
  if (n >= 10_000_000) return "₹" + (n / 10_000_000).toFixed(1) + "Cr";
  if (n >= 100_000)    return "₹" + (n / 100_000).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN");
};

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const buildChartData = (accounts, period) => {
  const map = new Map();
  accounts.forEach((a) => {
    const d = new Date(a.createdAt);
    if (isNaN(d)) return;
    let key;
    if (period === "day") {
      key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } else if (period === "week") {
      const jan1   = new Date(d.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((d - jan1) / 86_400_000 + jan1.getDay() + 1) / 7);
      key = `W${weekNo} '${String(d.getFullYear()).slice(2)}`;
    } else if (period === "month") {
      key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    } else {
      key = String(d.getFullYear());
    }
    const cur = map.get(key) || { label: key, accounts: 0, balance: 0, active: 0 };
    cur.accounts += 1;
    cur.balance  += Number(a.balance) || 0;
    cur.active   += a.active ? 1 : 0;
    map.set(key, cur);
  });
  return Array.from(map.values());
};

// ─── Pagination hook ──────────────────────────────────────────────────────────
function usePagination(data, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  useEffect(() => { setPage(1); }, [data.length]);
  const slice = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  );
  return { page, setPage, totalPages, slice };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [users,    setUsers]    = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // search — committed only on Enter / button click (fixes backspace clearing)
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const [filterField, setFilterField] = useState("all");
  const [period,      setPeriod]      = useState("month");

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, aRes] = await Promise.all([
        API.get("/api/admin/users"),
        API.get("/api/admin/accounts"),
      ]);
      setUsers(uRes.data   || []);
      setAccounts(aRes.data || []);
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const commitSearch = () => setSearch(searchInput.trim());
  const clearSearch  = () => { setSearchInput(""); setSearch(""); };

  // ── account actions ────────────────────────────────────────────────────────
  const closeAccount    = async (id) => { try { await API.put(`/api/admin/account/close/${id}`);    fetchAll(); } catch(e){ console.error(e); } };
  const activateAccount = async (id) => { try { await API.put(`/api/admin/account/activate/${id}`); fetchAll(); } catch(e){ console.error(e); } };

  // ── derived KPIs ───────────────────────────────────────────────────────────
  const activeCount  = useMemo(() => accounts.filter(a => a.active).length,       [accounts]);
  const totalBalance = useMemo(() => accounts.reduce((s,a) => s + (Number(a.balance)||0), 0), [accounts]);
  const kycVerified  = useMemo(() => users.filter(u => u.kycVerified).length,      [users]);
  const chartData    = useMemo(() => buildChartData(accounts, period),             [accounts, period]);

  // ── filtered data ──────────────────────────────────────────────────────────
  const q = search.toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!q) return users;
    return users.filter((u) => {
      const accNo = accounts.find(a => a.user?.id === u.id)?.accountNumber || "";
      if (filterField !== "all") {
        const fieldMap = {
          name: `${u.firstName} ${u.lastName}`,
          email: u.email, mobile: u.mobile,
          role: u.role, accountNumber: accNo,
        };
        return (fieldMap[filterField] || "").toLowerCase().includes(q);
      }
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        (u.email  || "").toLowerCase().includes(q) ||
        (u.mobile || "").toLowerCase().includes(q) ||
        (u.role   || "").toLowerCase().includes(q) ||
        accNo.toLowerCase().includes(q)
      );
    });
  }, [users, accounts, q, filterField]);

  const filteredAccounts = useMemo(() => {
    if (!q) return accounts;
    return accounts.filter((a) =>
      (a.accountNumber || "").toLowerCase().includes(q) ||
      (a.accountType   || "").toLowerCase().includes(q) ||
      String(a.balance || "").includes(q) ||
      `${a.user?.firstName||""} ${a.user?.lastName||""}`.toLowerCase().includes(q) ||
      (a.user?.email  || "").toLowerCase().includes(q) ||
      (a.user?.mobile || "").toLowerCase().includes(q)
    );
  }, [accounts, q]);

  // ── pagination ─────────────────────────────────────────────────────────────
  const userPag = usePagination(filteredUsers);
  const accPag  = usePagination(filteredAccounts);

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">

      {/* sticky header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 p-2.5">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">NeoxeBank · Admin Console</p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Users"      value={users.length}           sub={`${kycVerified} KYC verified`}                                                   icon={<Users       className="h-5 w-5 text-blue-600"   />} iconBg="bg-blue-100"   accent="hover:border-blue-200" />
          <KpiCard label="Total Accounts"   value={accounts.length}        sub={`${activeCount} active · ${accounts.length - activeCount} closed`}               icon={<Wallet      className="h-5 w-5 text-cyan-600"   />} iconBg="bg-cyan-100"   accent="hover:border-cyan-200" />
          <KpiCard label="Active Accounts"  value={activeCount}            sub={accounts.length > 0 ? `${Math.round((activeCount/accounts.length)*100)}% of total` : "—"} icon={<ArrowUpRight className="h-5 w-5 text-emerald-600"/>} iconBg="bg-emerald-100" accent="hover:border-emerald-200" />
          <KpiCard label="Total Balance"    value={formatCurrency(totalBalance)} sub={`Avg ${formatCurrency(totalBalance/(accounts.length||1))}`}               icon={<ShieldCheck className="h-5 w-5 text-amber-600"  />} iconBg="bg-amber-100"  accent="hover:border-amber-200" large />
        </div>

        {/* charts */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Account Growth Analytics</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Derived from {accounts.length} accounts · grouped by creation date
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["day","week","month","year"].map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period===p ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {loading ? <Spinner /> : chartData.length === 0 ? <Empty msg="No account data to chart yet." /> : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartBox title="Accounts Opened">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{top:4,right:8,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#0ea5e9" stopOpacity={1}   />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize:11}} interval="preserveStartEnd" />
                    <YAxis stroke="#94a3b8" tick={{fontSize:11}} allowDecimals={false} />
                    <Tooltip contentStyle={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12}} formatter={(v)=>[v,"Accounts"]} />
                    <Bar dataKey="accounts" fill="url(#barGrad)" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Balance Added (₹)">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{top:4,right:8,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.7}  />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{fontSize:11}} interval="preserveStartEnd" />
                    <YAxis stroke="#94a3b8" tick={{fontSize:11}} tickFormatter={(v)=>formatCurrency(v)} width={68} />
                    <Tooltip contentStyle={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12}} formatter={(v)=>[formatCurrency(v),"Balance"]} />
                    <Area type="monotone" dataKey="balance" stroke="#8b5cf6" strokeWidth={2} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          )}
        </div>

        {/* search */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-3">Search & Filter</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type and press Enter or click Search…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitSearch()}
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {searchInput && (
                <button onClick={clearSearch} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select value={filterField} onChange={(e) => setFilterField(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Fields</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="mobile">Mobile</option>
              <option value="role">Role</option>
              <option value="accountNumber">Account Number</option>
            </select>
            <button onClick={commitSearch}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
              Search
            </button>
            {search && (
              <button onClick={clearSearch}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition">
                Clear
              </button>
            )}
          </div>
          {search && (
            <p className="mt-2 text-xs text-slate-400">
              Showing results for <span className="font-semibold text-slate-600">"{search}"</span>
              {" "}— {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""},{" "}
              {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Users Table / Mobile Cards */}
        <TableShell
          title="Users"
          subtitle={`${filteredUsers.length} of ${users.length} users`}
          loading={loading}
          empty={!filteredUsers.length}
          emptyMsg="No users match your search."
          pagination={<Pagination pag={userPag} />}
        >
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["#","Name","Email","Mobile","Account No.","Role","KYC","Joined"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-semibold text-slate-600 whitespace-nowrap text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userPag.slice.map((u, i) => {
                  const acc = accounts.find(a => a.user?.id === u.id);
                  const rowNum = (userPag.page - 1) * PAGE_SIZE + i + 1;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{rowNum}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">{u.firstName} {u.lastName}</td>
                      <td className="px-5 py-3.5 text-slate-500">{u.email  || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{u.mobile || "—"}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 whitespace-nowrap">{acc?.accountNumber || "—"}</td>
                      <td className="px-5 py-3.5"><Badge color="blue">{u.role || "USER"}</Badge></td>
                      <td className="px-5 py-3.5">
                        {u.kycVerified
                          ? <Badge color="emerald">Verified</Badge>
                          : <Badge color="amber">Pending</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-slate-100">
            {userPag.slice.map((u, i) => {
              const acc = accounts.find(a => a.user?.id === u.id);
              const rowNum = (userPag.page - 1) * PAGE_SIZE + i + 1;
              return (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {rowNum}. {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{u.email || "No email"}</p>
                    </div>
                    <Badge color="blue">{u.role || "USER"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div><span className="text-slate-400">Mobile:</span> {u.mobile || "—"}</div>
                    <div><span className="text-slate-400">Account:</span> {acc?.accountNumber || "—"}</div>
                    <div><span className="text-slate-400">KYC:</span> {u.kycVerified ? "✅ Verified" : "⏳ Pending"}</div>
                    <div><span className="text-slate-400">Joined:</span> {fmtDate(u.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </TableShell>

        {/* Accounts Table / Mobile Cards */}
        <TableShell
          title="Accounts"
          subtitle={`${filteredAccounts.length} of ${accounts.length} accounts`}
          loading={loading}
          empty={!filteredAccounts.length}
          emptyMsg="No accounts match your search."
          pagination={<Pagination pag={accPag} />}
        >
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["#","Account No.","Holder","Email","Mobile","Type","Balance","Status","Opened","Action"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-semibold text-slate-600 whitespace-nowrap text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accPag.slice.map((a, i) => {
                  const rowNum = (accPag.page - 1) * PAGE_SIZE + i + 1;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{rowNum}</td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap">{a.accountNumber}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {a.user ? `${a.user.firstName} ${a.user.lastName}` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{a.user?.email  || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{a.user?.mobile || "—"}</td>
                      <td className="px-5 py-3.5"><Badge color="violet">{a.accountType || "—"}</Badge></td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(a.balance)}</td>
                      <td className="px-5 py-3.5">
                        {a.active ? <Badge color="emerald">Active</Badge> : <Badge color="red">Closed</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {a.active
                          ? <button onClick={() => closeAccount(a.id)}    className="px-3 py-1.5 rounded-lg bg-red-600     hover:bg-red-700     text-white text-xs font-semibold transition">Close</button>
                          : <button onClick={() => activateAccount(a.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition">Activate</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-slate-100">
            {accPag.slice.map((a, i) => {
              const rowNum = (accPag.page - 1) * PAGE_SIZE + i + 1;
              return (
                <div key={a.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {rowNum}. {a.accountNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.user ? `${a.user.firstName} ${a.user.lastName}` : "No holder"}
                      </p>
                    </div>
                    <Badge color={a.active ? "emerald" : "red"}>{a.active ? "Active" : "Closed"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div><span className="text-slate-400">Type:</span> {a.accountType || "—"}</div>
                    <div><span className="text-slate-400">Balance:</span> {formatCurrency(a.balance)}</div>
                    <div><span className="text-slate-400">Email:</span> {a.user?.email || "—"}</div>
                    <div><span className="text-slate-400">Mobile:</span> {a.user?.mobile || "—"}</div>
                    <div className="col-span-2"><span className="text-slate-400">Opened:</span> {fmtDate(a.createdAt)}</div>
                  </div>
                  <div>
                    {a.active
                      ? <button onClick={() => closeAccount(a.id)}    className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">Close Account</button>
                      : <button onClick={() => activateAccount(a.id)} className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition">Activate Account</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </TableShell>

      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, iconBg, accent, large }) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all ${accent}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-2 font-bold text-slate-900 ${large ? "text-xl" : "text-3xl"}`}>{value}</p>
          <p className="mt-1.5 text-xs text-slate-400">{sub}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700 mb-3">{title}</p>
      {children}
    </div>
  );
}

function TableShell({ title, subtitle, loading, empty, emptyMsg, children, pagination }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? <Spinner /> : empty ? <Empty msg={emptyMsg} /> : children}
      </div>
      {!loading && !empty && pagination}
    </div>
  );
}

function Pagination({ pag }) {
  const { page, setPage, totalPages } = pag;
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 gap-3">
      <p className="text-xs text-slate-400">
        Page <span className="font-semibold text-slate-600">{page}</span> of{" "}
        <span className="font-semibold text-slate-600">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <PagBtn onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4" />
        </PagBtn>
        {pages[0] > 1 && (
          <>
            <PagBtn onClick={() => setPage(1)}>1</PagBtn>
            {pages[0] > 2 && <span className="px-1 text-slate-400 text-xs">…</span>}
          </>
        )}
        {pages.map(p => (
          <PagBtn key={p} onClick={() => setPage(p)} active={p === page}>{p}</PagBtn>
        ))}
        {pages[pages.length-1] < totalPages && (
          <>
            {pages[pages.length-1] < totalPages - 1 && <span className="px-1 text-slate-400 text-xs">…</span>}
            <PagBtn onClick={() => setPage(totalPages)}>{totalPages}</PagBtn>
          </>
        )}
        <PagBtn onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </PagBtn>
      </div>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium transition-all
        ${active   ? "bg-blue-600 text-white shadow"                          : ""}
        ${disabled ? "text-slate-300 cursor-not-allowed"                      : ""}
        ${!active && !disabled ? "text-slate-600 hover:bg-slate-100"          : ""}`}
    >
      {children}
    </button>
  );
}

function Badge({ color, children }) {
  const map = {
    blue:    "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red:     "bg-red-100 text-red-600",
    amber:   "bg-amber-100 text-amber-700",
    violet:  "bg-violet-100 text-violet-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${map[color]||map.blue}`}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-400 text-sm">
      <div className="h-6 w-6 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      Loading…
    </div>
  );
}

function Empty({ msg }) {
  return <p className="py-10 text-center text-sm text-slate-400">{msg}</p>;
}