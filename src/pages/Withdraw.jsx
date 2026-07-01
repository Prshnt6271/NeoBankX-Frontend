import React, { useState } from "react";
import API from "../api/api";
import {
  ArrowDownCircle, ShieldCheck, Zap, ArrowRight,
  CheckCircle, XCircle, IndianRupee, User, Lock,
  AlertCircle, Wallet
} from "lucide-react";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000];

export default function Withdraw() {
  const [accountNumber] = useState(localStorage.getItem("accountNumber") || "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [step, setStep] = useState(1);

  const showMsg = (text, type) => setMessage({ text, type });
  const clearMsg = () => setMessage({ text: "", type: "" });

  const handleReview = (e) => {
    e.preventDefault();
    clearMsg();
    if (!amount || Number(amount) <= 0) { showMsg("Please enter a valid amount.", "error"); return; }
    setStep(2);
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true); clearMsg();
      const res = await API.post(`api/bank/withdraw?accountNumber=${accountNumber}&amount=${amount}`);
      showMsg(res.data || "Withdrawal successful!", "success");
      setAmount("");
      setStep(1);
    } catch (err) {
      showMsg(err.response?.data || "Withdrawal failed. Please try again.", "error");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 px-8 py-10 text-white shadow-xl shadow-rose-200">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Instant withdrawal available
            </div>
            <h1 className="text-3xl font-semibold leading-tight">Withdraw Funds<br />Securely</h1>
            <p className="mt-3 text-sm text-rose-200 max-w-sm">
              Access your money instantly from your NeoBank account.
            </p>
            <div className="mt-6 flex items-center gap-6">
              {[
                { icon: <Zap size={13} />,        label: "Instant credit" },
                { icon: <ShieldCheck size={13} />, label: "256-bit encrypted" },
                { icon: <Lock size={13} />,        label: "Zero charges" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-1.5 text-xs text-rose-200">
                  <span className="text-rose-300">{f.icon}</span>{f.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert */}
        {message.text && (
          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {message.type === "success"
              ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
              : <XCircle size={16} className="mt-0.5 shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Step 1 — Form */}
        {step === 1 && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-7 space-y-6">

            {/* Account display */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Your Account</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <User size={15} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 font-mono">{accountNumber || "N/A"}</p>
                  <p className="text-xs text-slate-400">NeoBank savings account</p>
                </div>
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
                Withdrawal Amount
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                  <IndianRupee size={15} className="text-rose-500" />
                </div>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-16 pr-5 text-xl font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition"
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
                    onClick={() => setAmount(String(q))}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition-all duration-150 ${
                      Number(amount) === q
                        ? "border-rose-500 bg-rose-600 text-white shadow-md shadow-rose-200"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                  >
                    ₹{q.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {amount && Number(amount) > 0 && (
              <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">Withdrawal Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Withdrawal amount</span>
                  <span className="font-semibold text-slate-800">₹{Number(amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Processing fee</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="border-t border-rose-100 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-slate-700">You will receive</span>
                  <span className="text-base font-bold text-rose-600">₹{Number(amount).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleReview}
              disabled={!amount || Number(amount) <= 0}
              className="group w-full rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 px-5 py-4 text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-200 disabled:shadow-none"
            >
              <Wallet size={15} />
              Review Withdrawal
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
              <h2 className="text-xl font-semibold text-slate-800">Confirm Withdrawal</h2>
              <p className="text-sm text-slate-500">Please review before confirming.</p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-200 overflow-hidden">
              {[
                { label: "Account Number", value: accountNumber, mono: true },
                { label: "Withdrawal Amount", value: `₹${Number(amount).toLocaleString("en-IN")}`, bold: true, color: "text-rose-600" },
                { label: "Processing Fee", value: "FREE", color: "text-emerald-600" },
                { label: "You will receive", value: `₹${Number(amount).toLocaleString("en-IN")}`, bold: true },
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
                onClick={() => { setStep(1); clearMsg(); }}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Go Back
              </button>
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 px-5 py-3.5 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
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
                  <><ArrowDownCircle size={15} /> Confirm Withdrawal</>
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