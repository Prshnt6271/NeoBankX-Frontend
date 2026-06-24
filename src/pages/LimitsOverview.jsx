import { useEffect, useState } from "react";
import API from "../api/api";
import {
  Shield,
  Send,
  ArrowDownCircle,
} from "lucide-react";

export default function LimitsOverview() {
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const res = await API.get("/limits");
      setLimits(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const percentage = (used, total) => {
    if (!total || total === 0) return 0;

    return Math.min((used / total) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="bg-white rounded-3xl p-10 shadow text-center">
          Loading limits...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Limits Overview
        </h1>

        <p className="text-slate-500 mt-2">
          Track your daily banking limits.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Transfer */}
        <div className="bg-white rounded-3xl shadow p-6">

          <div className="flex items-center gap-3 mb-5">
            <div className="bg-indigo-100 p-3 rounded-2xl">
              <Send className="text-indigo-600" />
            </div>

            <div>
              <h2 className="font-semibold text-lg">
                Transfer Limits
              </h2>

              <p className="text-sm text-slate-500">
                Daily transfer usage
              </p>
            </div>
          </div>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>Daily Limit</span>
              <span className="font-semibold">
                ₹{Number(limits.dailyTransferLimit).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Used Today</span>
              <span className="font-semibold text-red-500">
                ₹{Number(limits.transferUsedToday).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Remaining</span>
              <span className="font-semibold text-green-600">
                ₹{Number(limits.transferRemaining).toLocaleString()}
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full"
                style={{
                  width: `${percentage(
                    Number(limits.transferUsedToday),
                    Number(limits.dailyTransferLimit)
                  )}%`,
                }}
              />
            </div>

          </div>
        </div>

        {/* Withdraw */}
        <div className="bg-white rounded-3xl shadow p-6">

          <div className="flex items-center gap-3 mb-5">

            <div className="bg-red-100 p-3 rounded-2xl">
              <ArrowDownCircle className="text-red-600" />
            </div>

            <div>
              <h2 className="font-semibold text-lg">
                Withdrawal Limits
              </h2>

              <p className="text-sm text-slate-500">
                Daily withdrawal usage
              </p>
            </div>
          </div>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>Daily Limit</span>
              <span className="font-semibold">
                ₹{Number(limits.dailyWithdrawLimit).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Used Today</span>
              <span className="font-semibold text-red-500">
                ₹{Number(limits.withdrawUsedToday).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Remaining</span>
              <span className="font-semibold text-green-600">
                ₹{Number(limits.withdrawRemaining).toLocaleString()}
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-red-600 h-3 rounded-full"
                style={{
                  width: `${percentage(
                    Number(limits.withdrawUsedToday),
                    Number(limits.dailyWithdrawLimit)
                  )}%`,
                }}
              />
            </div>

          </div>
        </div>

      </div>

      <div className="mt-6 bg-white rounded-3xl shadow p-6">

        <div className="flex items-center gap-3 mb-3">
          <Shield className="text-green-600" />

          <h2 className="font-semibold">
            Banking Tips
          </h2>
        </div>

        <ul className="text-sm text-slate-500 space-y-2">
          <li>• Monitor your limits before making transactions.</li>
          <li>• Limits reset automatically every day.</li>
          <li>• Contact support if you require higher limits.</li>
        </ul>

      </div>

    </div>
  );
}