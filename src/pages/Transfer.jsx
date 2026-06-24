import React, { useState } from "react";
import API from "../api/api";
import {
  Send, ShieldCheck, Zap, ArrowRight, CheckCircle,
  XCircle, IndianRupee, Hash, User, Lock, AlertCircle
} from "lucide-react";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000];

export default function Transfer() {
  const [data, setData] = useState({ toAccount: "", amount: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = confirm

  const fromAccount = localStorage.getItem("accountNumber") || "XXXX XXXX XXXX";

  const handleReview = (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!data.toAccount.trim()) { setError("Please enter recipient account number."); return; }
    if (!data.amount || Number(data.amount) <= 0) { setError("Please enter a valid amount."); return; }
    if (data.toAccount.trim() === fromAccount.trim()) { setError("You cannot transfer to your own account."); return; }
    setStep(2);
  };

  const handleTransfer = async () => {
    try {
      setLoading(true); setError(""); setSuccess("");
      const res = await API.post("/transactions/transfer", {
        toAccount: data.toAccount,
        amount: Number(data.amount),
      });
      setSuccess(res.data || "Transfer successful!");
      setData({ toAccount: "", amount: "" });
      setStep(1);
    } catch (err) {
      setError(err.response?.data || err.message || "Transfer failed");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-10 text-white shadow-xl shadow-indigo-200">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Secure instant transfer
            </div>
            <h1 className="text-3xl font-semibold leading-tight">Transfer Funds<br />Instantly</h1>
            <p className="mt-3 text-sm text-indigo-200 max-w-sm">
              Send money securely to any NeoBank account in seconds.
            </p>
            <div className="mt-6 flex items-center gap-6">
              {[
                { icon: <Zap size={13} />, label: "Instant transfer" },
                { icon: <ShieldCheck size={13} />, label: "Bank-grade security" },
                { icon: <Lock size={13} />, label: "Zero fees" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-1.5 text-xs text-indigo-200">
                  <span className="text-indigo-300">{f.icon}</span>{f.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
            <XCircle size={16} className="mt-0.5 shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-medium text-emerald-700">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />{success}
          </div>
        )}

        {/* Step 1 — Form */}
        {step === 1 && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-7 space-y-6">

            {/* From account */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">From Account</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <User size={15} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 font-mono">{fromAccount}</p>
                  <p className="text-xs text-slate-400">Your NeoBank account</p>
                </div>
              </div>
            </div>

            {/* To account */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
                Recipient Account Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <Hash size={15} className="text-indigo-500" />
                </div>
                <input
                  type="text"
                  value={data.toAccount}
                  onChange={(e) => setData({ ...data, toAccount: e.target.value })}
                  placeholder="Enter account number"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-16 pr-5 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
                Amount
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <IndianRupee size={15} className="text-indigo-500" />
                </div>
                <input
                  type="number"
                  min="1"
                  value={data.amount}
                  onChange={(e) => setData({ ...data, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-16 pr-5 text-xl font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
            </div>

            {/* Quick amounts */}
            <div className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">Quick Select</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setData({ ...data, amount: String(q) })}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition-all duration-150 ${
                      Number(data.amount) === q
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                    }`}
                  >
                    ₹{q.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {data.amount && Number(data.amount) > 0 && (
              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-5 py-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Transfer Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">You send</span>
                  <span className="font-semibold text-slate-800">₹{Number(data.amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Transfer fee</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="border-t border-indigo-100 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-slate-700">Recipient gets</span>
                  <span className="text-base font-bold text-indigo-600">₹{Number(data.amount).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleReview}
              disabled={!data.toAccount || !data.amount || Number(data.amount) <= 0}
              className="group w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 px-5 py-4 text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:shadow-none"
            >
              <Send size={15} />
              Review Transfer
              <ArrowRight size={14} className="ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} /> Protected by 256-bit SSL encryption
            </p>
          </div>
        )}

        {/* Step 2 — Confirm */}
        {step === 2 && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-7 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertCircle size={26} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Confirm Transfer</h2>
              <p className="text-sm text-slate-500">Please review the details before confirming.</p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-200 overflow-hidden">
              {[
                { label: "From Account", value: fromAccount, mono: true },
                { label: "To Account",   value: data.toAccount, mono: true },
                { label: "Amount",       value: `₹${Number(data.amount).toLocaleString("en-IN")}`, bold: true, color: "text-indigo-600" },
                { label: "Transfer Fee", value: "FREE", color: "text-emerald-600" },
                { label: "You will be debited", value: `₹${Number(data.amount).toLocaleString("en-IN")}`, bold: true },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-slate-500">{row.label}</span>
                  <span className={`text-sm ${row.bold ? "font-bold" : "font-medium"} ${row.color || "text-slate-800"} ${row.mono ? "font-mono" : ""}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setError(""); }}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Go Back
              </button>
              <button
                onClick={handleTransfer}
                disabled={loading}
                className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-5 py-3.5 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <><Send size={15} /> Confirm Transfer</>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} /> This action cannot be undone
            </p>
          </div>
        )}

      </div>
    </div>
  );
}