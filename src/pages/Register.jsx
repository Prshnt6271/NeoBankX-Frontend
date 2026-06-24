import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async (event) => {
    event.preventDefault();

    const payload = {
      firstName: (data.firstName || "").trim(),
      lastName: (data.lastName || "").trim(),
      email: (data.email || "").trim(),
      mobile: (data.mobile || "").trim(),
      password: data.password || "",
    };

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.password) {
      setError("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await API.post("/auth/register", payload);
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-[32px] bg-white px-10 py-12 shadow-2xl shadow-slate-200">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Create your profile</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Open an account</h1>
          <p className="mt-2 text-sm text-slate-500">Start banking with a secure modern experience.</p>
        </div>
        <form onSubmit={register} className="grid gap-5">

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">First Name</label>
              <input
                name="firstName"
                value={data.firstName}
                onChange={(e) => setData({ ...data, firstName: e.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:bg-white"
                placeholder="First name"
                autoComplete="given-name"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Last Name</label>
              <input
                name="lastName"
                value={data.lastName}
                onChange={(e) => setData({ ...data, lastName: e.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:bg-white"
                placeholder="Last name"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
                name="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:bg-white"
                placeholder="you@example.com"
                autoComplete="email"
                required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Mobile</label>
            <input
              type="tel"
                name="mobile"
                value={data.mobile}
                onChange={(e) => setData({ ...data, mobile: e.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:bg-white"
                placeholder="Phone number"
                autoComplete="tel"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
                name="password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:bg-white"
                placeholder="Create a password"
                autoComplete="new-password"
                required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:text-slate-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}