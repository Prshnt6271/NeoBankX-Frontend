import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await API.post("/api/auth/forgot-password", {
        email,
      });

      setMessageType("success");
      setMessage(res.data || "OTP sent successfully.");
      localStorage.setItem("resetEmail", email);

      setTimeout(() => {
        navigate("/reset-password");
      }, 1500);
    } catch (err) {
      setMessageType("error");
      setMessage(
        err.response?.data || "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold">
          Forgot Password
        </h2>

        <form onSubmit={sendOtp} className="space-y-4">

          <input
            type="email"
            placeholder="Enter Email"
            className="w-full rounded-xl border p-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 p-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          {message && (
            <p className={`text-center ${messageType === "error" ? "text-red-600" : "text-emerald-600"}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}