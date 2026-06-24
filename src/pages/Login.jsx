import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      const { token, accountNumber } = res.data;

      // store basic info
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      localStorage.setItem("accountNumber", accountNumber);

      // decode JWT payload
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload.role;

      localStorage.setItem("role", role);

      // console.log("LOGIN RESPONSE:", res.data);

      // redirect based on role
      // if (role === "ADMIN") {
      //   navigate("/admin");
      // } else {
      //   navigate("/dashboard");
      // }

      if (role === "ADMIN") {
  navigate("/admin", { replace: true });
} else {
  navigate("/dashboard", { replace: true });
}

    } catch (err) {
      setError(
        err.response?.data || "Unable to login. Check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] bg-white px-10 py-12 shadow-2xl shadow-slate-200">

        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
            Secure access
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            Welcome back
          </h1>
        </div>

        <form onSubmit={login} className="space-y-5">

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-3xl border px-4 py-3"
            placeholder="Email"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-3xl border px-4 py-3"
            placeholder="Password"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-slate-900 py-3 text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-slate-900 hover:text-slate-700">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}