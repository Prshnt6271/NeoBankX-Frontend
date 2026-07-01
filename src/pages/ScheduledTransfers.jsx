import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import API from "../api/api";
import {
  Clock,
  XCircle,
  CalendarClock,
  Send,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const ScheduledTransfers = memo(() => {
  // ---- Form state ----
  const [form, setForm] = useState({
    toAccount: "",
    amount: "",
    remarks: "",
  });
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [accountError, setAccountError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ---- Transfers state ----
  const [transfers, setTransfers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ---- Load transfers ----
  const loadTransfers = useCallback(async () => {
    try {
      setTableLoading(true);
      const res = await API.get("api/scheduled");
      setTransfers(res.data || []);
    } catch (err) {
      console.error("Failed to load transfers:", err);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  // ---- Form handlers ----
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "toAccount") setAccountError("");
  }, []);

  const scheduleTransfer = useCallback(
    async (e) => {
      e.preventDefault();
      setAccountError("");
      setSuccessMsg("");

      const combined = dateVal && timeVal ? `${dateVal}T${timeVal}` : "";
      if (!form.toAccount || !form.amount || !combined) {
        if (!form.toAccount) setAccountError("Receiver account number is required");
        return;
      }

      const isoString = combined + ":00";
      const dateObj = new Date(isoString);
      if (isNaN(dateObj.getTime()) || dateObj <= new Date()) {
        setAccountError("Please select a future date and time.");
        return;
      }

      try {
        setLoading(true);
        await API.post("api/scheduled", {
          toAccount: form.toAccount,
          amount: Number(form.amount),
          remarks: form.remarks,
          scheduledAt: dateObj.toISOString(),
        });

        setForm({ toAccount: "", amount: "", remarks: "" });
        setDateVal("");
        setTimeVal("");
        setSuccessMsg("Transfer scheduled successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
        loadTransfers();
      } catch (err) {
        const msg = err?.response?.data?.message || "";
        if (
          msg.toLowerCase().includes("account") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("receiver")
        ) {
          setAccountError(msg || "Account number not found. Please check and try again.");
        } else {
          setAccountError(msg || "Failed to schedule transfer. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [form, dateVal, timeVal, loadTransfers]
  );

  const cancelTransfer = useCallback(
    async (id) => {
      try {
        await API.delete(`/scheduled/${id}`);
        loadTransfers();
      } catch (err) {
        alert(err?.response?.data?.message || "Failed to cancel transfer");
      }
    },
    [loadTransfers]
  );

  // ---- Memoized filtering & pagination ----
  const filtered = useMemo(
    () =>
      transfers.filter((t) =>
        `${t.fromAccount || ""} ${t.toAccount || ""} ${t.status || ""} ${t.remarks || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [transfers, search]
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage, itemsPerPage]
  );

  // ---- Helpers ----
  const badgeColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return { bg: "#dcfce7", color: "#15803d", label: "Completed" };
      case "FAILED":
        return { bg: "#fee2e2", color: "#dc2626", label: "Failed" };
      case "CANCELLED":
        return { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" };
      default:
        return { bg: "#fef9c3", color: "#a16207", label: "Pending" };
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const minTime =
    dateVal === today
      ? new Date(Date.now() + 60000).toTimeString().slice(0, 5)
      : "00:00";

  // ---- Render ----
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px 16px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <CalendarClock size={22} color="#6366f1" />
            <h1
              style={{
                fontSize: "clamp(20px, 4vw, 28px)",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Schedule a Transfer
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            Set up a future-dated transfer — we'll execute it automatically at the scheduled
            time.
          </p>
        </div>

        {/* SUCCESS BANNER */}
        {successMsg && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CheckCircle2 size={18} color="#16a34a" />
            <span style={{ color: "#15803d", fontSize: 14, fontWeight: 500 }}>
              {successMsg}
            </span>
          </div>
        )}

        {/* FORM CARD */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "28px 24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            marginBottom: 24,
            border: "1px solid #e2e8f0",
          }}
        >
          <form onSubmit={scheduleTransfer} noValidate>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {/* Receiver Account */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Receiver Account <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  name="toAccount"
                  value={form.toAccount}
                  onChange={handleChange}
                  placeholder="e.g. ACC0055520178"
                  style={{
                    border: accountError ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                    color: "#0f172a",
                    background: accountError ? "#fff5f5" : "#fff",
                    transition: "border 0.2s",
                    width: "100%",
                  }}
                  onFocus={(e) => {
                    if (!accountError) e.target.style.border = "1.5px solid #6366f1";
                  }}
                  onBlur={(e) => {
                    if (!accountError) e.target.style.border = "1.5px solid #e2e8f0";
                  }}
                />
                {accountError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <AlertCircle size={13} color="#ef4444" />
                    <span style={{ color: "#ef4444", fontSize: 12 }}>{accountError}</span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Amount (₹) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="1"
                  style={{
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                    color: "#0f172a",
                    width: "100%",
                  }}
                  onFocus={(e) => (e.target.style.border = "1.5px solid #6366f1")}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #e2e8f0")}
                />
              </div>

              {/* Remarks */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Remarks{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="e.g. Monthly rent"
                  style={{
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 14,
                    outline: "none",
                    color: "#0f172a",
                    width: "100%",
                  }}
                  onFocus={(e) => (e.target.style.border = "1.5px solid #6366f1")}
                  onBlur={(e) => (e.target.style.border = "1.5px solid #e2e8f0")}
                />
              </div>

              {/* Date & Time */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  Schedule Date & Time <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => {
                      setDateVal(e.target.value);
                      setTimeVal("");
                    }}
                    min={today}
                    style={{
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "11px 12px",
                      fontSize: 14,
                      outline: "none",
                      color: "#0f172a",
                      flex: "1 1 120px",
                      minWidth: 0,
                    }}
                    onFocus={(e) => (e.target.style.border = "1.5px solid #6366f1")}
                    onBlur={(e) => (e.target.style.border = "1.5px solid #e2e8f0")}
                  />
                  <input
                    type="time"
                    value={timeVal}
                    onChange={(e) => setTimeVal(e.target.value)}
                    min={minTime}
                    style={{
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "11px 12px",
                      fontSize: 14,
                      outline: "none",
                      color: "#0f172a",
                      flex: "0 1 110px",
                      minWidth: 80,
                    }}
                    onFocus={(e) => (e.target.style.border = "1.5px solid #6366f1")}
                    onBlur={(e) => (e.target.style.border = "1.5px solid #e2e8f0")}
                  />
                </div>
                {dateVal && timeVal && (
                  <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 500 }}>
                    Scheduled for{" "}
                    {new Date(`${dateVal}T${timeVal}:00`).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 20 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 12,
                  background: loading ? "#a5b4fc" : "#6366f1",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = "#4f46e5";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = "#6366f1";
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Schedule Transfer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SEARCH BAR */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "12px 16px",
            marginBottom: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            placeholder="Search by account, status, or remarks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#0f172a",
              width: "100%",
              background: "transparent",
            }}
          />
        </div>

        {/* TABLE CARD */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {tableLoading ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Loader2 size={20} className="animate-spin" />
              Loading transfers...
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <CalendarClock size={32} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
                {search ? "No results found" : "No scheduled transfers found"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="desktop-table" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      {["From", "To", "Amount", "Remarks", "Scheduled Time", "Status", "Action"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "12px 16px",
                              textAlign: "left",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((t, i) => {
                      const badge = badgeColor(t.status);
                      return (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            background: i % 2 === 0 ? "#fff" : "#fafafa",
                          }}
                        >
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 13,
                              fontFamily: "monospace",
                              color: "#374151",
                            }}
                          >
                            {t.fromAccount}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 13,
                              fontFamily: "monospace",
                              color: "#374151",
                            }}
                          >
                            {t.toAccount}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#0f172a",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₹ {Number(t.amount).toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>
                            {t.remarks || "—"}
                          </td>
                          <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 13,
                                color: "#374151",
                              }}
                            >
                              <Clock size={13} color="#6366f1" />
                              {t.scheduledAt
                                ? new Date(t.scheduledAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "—"}
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              style={{
                                background: badge.bg,
                                color: badge.color,
                                padding: "4px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {t.status === "PENDING" && (
                              <button
                                onClick={() => cancelTransfer(t.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  background: "#fff0f0",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  borderRadius: 8,
                                  padding: "6px 12px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <XCircle size={13} />
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="mobile-cards" style={{ display: "none", marginTop: 8 }}>
                {paginated.map((t) => {
                  const badge = badgeColor(t.status);
                  return (
                    <div
                      key={t.id}
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                          ₹ {Number(t.amount).toLocaleString("en-IN")}
                        </span>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>To: </span>
                        <span style={{ fontFamily: "monospace" }}>{t.toAccount}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>From: </span>
                        <span style={{ fontFamily: "monospace" }}>{t.fromAccount}</span>
                      </div>
                      {t.remarks && (
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>Remarks: </span>
                          {t.remarks}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          color: "#6366f1",
                          marginBottom: 10,
                        }}
                      >
                        <Clock size={12} />
                        {t.scheduledAt
                          ? new Date(t.scheduledAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "—"}
                      </div>
                      {t.status === "PENDING" && (
                        <button
                          onClick={() => cancelTransfer(t.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: "#fff0f0",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: 8,
                            padding: "7px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "100%",
                            justifyContent: "center",
                          }}
                        >
                          <XCircle size={13} /> Cancel Transfer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Responsive CSS toggles */}
              <style>
                {`
                  @media (max-width: 639px) {
                    .desktop-table { display: none !important; }
                    .mobile-cards { display: block !important; }
                  }
                  @media (min-width: 640px) {
                    .mobile-cards { display: none !important; }
                  }
                  .animate-spin {
                    animation: spin 1s linear infinite;
                  }
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}
              </style>
            </>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                color: currentPage === 1 ? "#cbd5e1" : "#374151",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: currentPage === page ? "none" : "1px solid #e2e8f0",
                  background: currentPage === page ? "#6366f1" : "#fff",
                  color: currentPage === page ? "#fff" : "#374151",
                  cursor: "pointer",
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                color: currentPage === totalPages ? "#cbd5e1" : "#374151",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ScheduledTransfers;