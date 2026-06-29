import React, { useState } from "react";
import API from "../api/api";
import { PlusCircle, ShieldCheck, Zap, TrendingUp, CheckCircle, XCircle, ArrowRight, IndianRupee } from "lucide-react";

const QUICK_AMOUNTS = [500, 1000, 5000, 10000, 25000, 50000];

export default function Deposit() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setMessage({ text: "Please enter a valid amount", type: "error" });
      return;
    }
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });
      const res = await API.post(`/api/bank/deposit?amount=${amount}`);
      setMessage({ text: res.data || "Deposit successful!", type: "success" });
      setAmount("");
    } catch (err) {
      setMessage({ text: err.response?.data || "Deposit failed. Please try again.", type: "error" });
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
              Instant deposit available
            </div>
            <h1 className="text-3xl font-semibold leading-tight">Add Money to<br />Your Account</h1>
            <p className="mt-3 text-sm text-indigo-200 max-w-sm">
              Funds are credited instantly and securely to your NeoBank wallet.
            </p>
            <div className="mt-6 flex items-center gap-6">
              {[
                { icon: <Zap size={13} />, label: "Instant credit" },
                { icon: <ShieldCheck size={13} />, label: "256-bit encrypted" },
                { icon: <TrendingUp size={13} />, label: "No hidden fees" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-1.5 text-xs text-indigo-200">
                  <span className="text-indigo-300">{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-3xl bg-white border border-slate-100 p-7 shadow-sm space-y-6">

          {/* Amount input */}
          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
              Enter Amount
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <IndianRupee size={15} className="text-indigo-500" />
              </div>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-16 pr-5 text-xl font-semibold text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
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
          {amount && Number(amount) > 0 && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-5 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Summary</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Deposit amount</span>
                <span className="text-sm font-semibold text-slate-800">₹{Number(amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Processing fee</span>
                <span className="text-sm font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="border-t border-indigo-100 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">You will receive</span>
                <span className="text-base font-bold text-indigo-600">₹{Number(amount).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium border ${
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

          {/* Submit */}
          <button
            onClick={handleDeposit}
            disabled={loading || !amount || Number(amount) <= 0}
            className="group w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 px-5 py-4 text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:shadow-none"
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
              <>
                <PlusCircle size={16} />
                Deposit ₹{amount ? Number(amount).toLocaleString("en-IN") : "0"}
                <ArrowRight size={15} className="ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} /> Secured by 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
}