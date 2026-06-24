import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, X, ChevronLeft, ChevronRight, ShieldCheck, Clock, XCircle, CheckCircle } from "lucide-react";
import API from "../../api/api";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

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

const getFileUrl = (path) => {
  if (!path) return "#";
  return `http://localhost:8080/${path.replace(/\\/g, "/")}`;
};

const STATUS_CONFIG = {
  APPROVED: { color: "emerald", icon: <CheckCircle className="h-4 w-4" />, label: "Approved" },
  REJECTED: { color: "red",     icon: <XCircle     className="h-4 w-4" />, label: "Rejected"  },
  PENDING:  { color: "amber",   icon: <Clock       className="h-4 w-4" />, label: "Pending"   },
};

export default function AdminKycPanel() {
  const [kycs,    setKycs]    = useState([]);
  const [loading, setLoading] = useState(true);

  // search — committed on Enter / button (fixes backspace issue)
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // rejection modal state
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: "" });

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchKycs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/kyc/admin/all");
      setKycs(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load KYC requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKycs(); }, [fetchKycs]);

  const commitSearch = () => setSearch(searchInput.trim());
  const clearSearch  = () => { setSearchInput(""); setSearch(""); };

  // ── KPI counts ─────────────────────────────────────────────────────────────
  const pendingCount  = useMemo(() => kycs.filter(k => k.status === "PENDING").length,   [kycs]);
  const approvedCount = useMemo(() => kycs.filter(k => k.status === "APPROVED").length,  [kycs]);
  const rejectedCount = useMemo(() => kycs.filter(k => k.status === "REJECTED").length,  [kycs]);

  // ── filtered ───────────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredKycs = useMemo(() => {
    return kycs.filter((k) => {
      const matchesStatus = statusFilter === "ALL" || k.status === statusFilter;
      if (!q) return matchesStatus;
      const matchesSearch =
        `${k.firstName} ${k.lastName}`.toLowerCase().includes(q) ||
        (k.email         || "").toLowerCase().includes(q) ||
        (k.mobile        || "").toLowerCase().includes(q) ||
        (k.accountNumber || "").toLowerCase().includes(q) ||
        (k.panNumber     || "").toLowerCase().includes(q) ||
        (k.aadhaarNumber || "").toLowerCase().includes(q) ||
        (k.city          || "").toLowerCase().includes(q) ||
        (k.state         || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [kycs, q, statusFilter]);

  const pag = usePagination(filteredKycs);

  // ── approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await API.put(`/kyc/status/${id}`, null, { params: { status: "APPROVED" } });
      toast.success("KYC approved successfully");
      fetchKycs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve KYC");
    }
  };

  // ── reject modal ───────────────────────────────────────────────────────────
  const openRejectModal  = (id) => setRejectModal({ open: true, id, reason: "" });
  const closeRejectModal = ()   => setRejectModal({ open: false, id: null, reason: "" });

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    try {
      await API.put(`/kyc/status/${rejectModal.id}`, null, {
        params: { status: "REJECTED", reason: rejectModal.reason.trim() },
      });
      toast.success("KYC rejected");
      closeRejectModal();
      fetchKycs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject KYC");
    }
  };

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">

      {/* sticky header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 p-2.5">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">KYC Verification</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Pending Review"
            value={pendingCount}
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-100"
            accent="hover:border-amber-200"
            onClick={() => setStatusFilter("PENDING")}
            active={statusFilter === "PENDING"}
          />
          <KpiCard
            label="Approved"
            value={approvedCount}
            icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
            accent="hover:border-emerald-200"
            onClick={() => setStatusFilter("APPROVED")}
            active={statusFilter === "APPROVED"}
          />
          <KpiCard
            label="Rejected"
            value={rejectedCount}
            icon={<XCircle className="h-5 w-5 text-red-500" />}
            iconBg="bg-red-100"
            accent="hover:border-red-200"
            onClick={() => setStatusFilter("REJECTED")}
            active={statusFilter === "REJECTED"}
          />
        </div>

        {/* search + status filter */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-3">Search & Filter</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name, email, mobile, account no, PAN, Aadhaar, city…"
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button onClick={commitSearch}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
              Search
            </button>
            {(search || statusFilter !== "ALL") && (
              <button onClick={() => { clearSearch(); setStatusFilter("ALL"); }}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition">
                Clear
              </button>
            )}
          </div>
          {(search || statusFilter !== "ALL") && (
            <p className="mt-2 text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{filteredKycs.length}</span> of{" "}
              <span className="font-semibold text-slate-600">{kycs.length}</span> requests
              {search && <> for <span className="font-semibold text-slate-600">"{search}"</span></>}
              {statusFilter !== "ALL" && <> · status: <span className="font-semibold text-slate-600">{statusFilter}</span></>}
            </p>
          )}
        </div>

        {/* KYC table / mobile cards */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-bold text-slate-900">KYC Requests</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filteredKycs.length} of {kycs.length} total</p>
          </div>

          {/* ---- Desktop Table (hidden on small screens) ---- */}
          <div className="hidden sm:block overflow-x-auto">
            {loading ? <Spinner /> : filteredKycs.length === 0 ? (
              <Empty msg="No KYC requests match your filter." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["#","Name","Email","Mobile","Account No.","PAN","Aadhaar","City / State","Address","Documents","Status","Action"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-semibold text-slate-600 whitespace-nowrap text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pag.slice.map((kyc, i) => {
                    const rowNum = (pag.page - 1) * PAGE_SIZE + i + 1;
                    const cfg = STATUS_CONFIG[kyc.status] || STATUS_CONFIG.PENDING;
                    return (
                      <tr key={kyc.id} className="hover:bg-slate-50 transition align-top">
                        <td className="px-5 py-4 text-slate-400 text-xs">{rowNum}</td>
                        <td className="px-5 py-4 font-medium text-slate-900 whitespace-nowrap">
                          {kyc.firstName} {kyc.lastName}
                        </td>
                        <td className="px-5 py-4 text-slate-500">{kyc.email  || "—"}</td>
                        <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{kyc.mobile || "—"}</td>
                        <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">{kyc.accountNumber || "—"}</td>
                        <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">{kyc.panNumber     || "—"}</td>
                        <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">{kyc.aadhaarNumber || "—"}</td>
                        <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                          {kyc.city && kyc.state ? `${kyc.city}, ${kyc.state}` : kyc.city || kyc.state || "—"}
                          {kyc.pincode ? ` - ${kyc.pincode}` : ""}
                        </td>
                        <td className="px-5 py-4 text-slate-500 max-w-[160px] truncate" title={kyc.address}>
                          {kyc.address || "—"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {kyc.panFilePath && (
                              <a href={getFileUrl(kyc.panFilePath)} target="_blank" rel="noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline">
                                View PAN
                              </a>
                            )}
                            {kyc.aadhaarFilePath && (
                              <a href={getFileUrl(kyc.aadhaarFilePath)} target="_blank" rel="noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline">
                                View Aadhaar
                              </a>
                            )}
                            {!kyc.panFilePath && !kyc.aadhaarFilePath && (
                              <span className="text-xs text-slate-400">No files</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide
                            ${cfg.color === "emerald" ? "bg-emerald-100 text-emerald-700" :
                              cfg.color === "red"     ? "bg-red-100 text-red-600"         :
                                                        "bg-amber-100 text-amber-700"}`}>
                            {cfg.icon}{cfg.label}
                          </span>
                          {kyc.rejectionReason && (
                            <p className="mt-1 text-xs text-red-500 max-w-[120px] truncate" title={kyc.rejectionReason}>
                              {kyc.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {kyc.status === "PENDING" ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleApprove(kyc.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition">
                                Approve
                              </button>
                              <button onClick={() => openRejectModal(kyc.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition">
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No action</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ---- Mobile Cards (visible only on small screens) ---- */}
          <div className="sm:hidden divide-y divide-slate-100">
            {loading ? <Spinner /> : filteredKycs.length === 0 ? (
              <Empty msg="No KYC requests match your filter." />
            ) : (
              pag.slice.map((kyc, i) => {
                const rowNum = (pag.page - 1) * PAGE_SIZE + i + 1;
                const cfg = STATUS_CONFIG[kyc.status] || STATUS_CONFIG.PENDING;
                return (
                  <div key={kyc.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {rowNum}. {kyc.firstName} {kyc.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{kyc.email || "No email"}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide
                        ${cfg.color === "emerald" ? "bg-emerald-100 text-emerald-700" :
                          cfg.color === "red"     ? "bg-red-100 text-red-600"         :
                                                    "bg-amber-100 text-amber-700"}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div><span className="text-slate-400">Mobile:</span> {kyc.mobile || "—"}</div>
                      <div><span className="text-slate-400">Account:</span> {kyc.accountNumber || "—"}</div>
                      <div><span className="text-slate-400">PAN:</span> {kyc.panNumber || "—"}</div>
                      <div><span className="text-slate-400">Aadhaar:</span> {kyc.aadhaarNumber || "—"}</div>
                      <div className="col-span-2"><span className="text-slate-400">City/State:</span> {kyc.city && kyc.state ? `${kyc.city}, ${kyc.state}` : kyc.city || kyc.state || "—"}</div>
                      <div className="col-span-2 truncate"><span className="text-slate-400">Address:</span> {kyc.address || "—"}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {kyc.panFilePath && (
                        <a href={getFileUrl(kyc.panFilePath)} target="_blank" rel="noreferrer"
                          className="text-blue-600 underline">View PAN</a>
                      )}
                      {kyc.aadhaarFilePath && (
                        <a href={getFileUrl(kyc.aadhaarFilePath)} target="_blank" rel="noreferrer"
                          className="text-blue-600 underline">View Aadhaar</a>
                      )}
                      {!kyc.panFilePath && !kyc.aadhaarFilePath && (
                        <span className="text-slate-400">No files</span>
                      )}
                    </div>

                    {kyc.rejectionReason && (
                      <p className="text-xs text-red-500">{kyc.rejectionReason}</p>
                    )}

                    {kyc.status === "PENDING" ? (
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => handleApprove(kyc.id)}
                          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition">
                          Approve
                        </button>
                        <button onClick={() => openRejectModal(kyc.id)}
                          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-2">No action available</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {!loading && filteredKycs.length > 0 && <Pagination pag={pag} />}
        </div>

      </div>

      {/* ── Rejection Modal ────────────────────────────────────────────────── */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-red-100 p-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Reject KYC</h3>
              </div>
              <button onClick={closeRejectModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Please provide a reason for rejecting this KYC request. The customer will be notified.
            </p>
            <textarea
              autoFocus
              rows={4}
              placeholder="e.g. Document image is blurry, PAN number mismatch…"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(m => ({ ...m, reason: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none transition"
            />
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button onClick={handleRejectSubmit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition">
                Confirm Rejection
              </button>
              <button onClick={closeRejectModal}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, iconBg, accent, onClick, active }) {
  return (
    <button onClick={onClick}
      className={`text-left w-full rounded-xl bg-white p-6 shadow-sm border transition-all
        ${active ? "border-blue-400 ring-2 ring-blue-200 shadow-md" : `border-slate-100 hover:shadow-md ${accent}`}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-400">Click to filter</p>
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>{icon}</div>
      </div>
    </button>
  );
}

function Pagination({ pag }) {
  const { page, setPage, totalPages } = pag;
  if (totalPages <= 1) return null;
  const delta = 2;
  const pages = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-slate-100 gap-3">
      <p className="text-xs text-slate-400">
        Page <span className="font-semibold text-slate-600">{page}</span> of{" "}
        <span className="font-semibold text-slate-600">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <PagBtn onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft className="h-4 w-4" /></PagBtn>
        {pages[0] > 1 && (<><PagBtn onClick={() => setPage(1)}>1</PagBtn>{pages[0]>2 && <span className="px-1 text-slate-400 text-xs">…</span>}</>)}
        {pages.map(p => <PagBtn key={p} onClick={() => setPage(p)} active={p===page}>{p}</PagBtn>)}
        {pages[pages.length-1] < totalPages && (<>{pages[pages.length-1]<totalPages-1 && <span className="px-1 text-slate-400 text-xs">…</span>}<PagBtn onClick={() => setPage(totalPages)}>{totalPages}</PagBtn></>)}
        <PagBtn onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}><ChevronRight className="h-4 w-4" /></PagBtn>
      </div>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium transition-all
        ${active   ? "bg-blue-600 text-white shadow" : ""}
        ${disabled ? "text-slate-300 cursor-not-allowed" : ""}
        ${!active && !disabled ? "text-slate-600 hover:bg-slate-100" : ""}`}>
      {children}
    </button>
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