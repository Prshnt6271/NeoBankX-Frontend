import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] =
    useState("");

  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const email =
    localStorage.getItem("resetEmail");

  const resetPassword = async (e) => {

    e.preventDefault();

    try {

      const res = await API.post(
        "/auth/reset-password",
        {
          email,
          otp,
          newPassword,
        }
      );

      setMessage(res.data);

      setTimeout(() => {
        localStorage.removeItem(
          "resetEmail"
        );

        navigate("/");
      }, 2000);

    } catch (err) {

      setMessage(
        err.response?.data ||
          "Reset Password Failed"
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">

        <h2 className="mb-6 text-center text-3xl font-bold">
          Reset Password
        </h2>

        <form
          onSubmit={resetPassword}
          className="space-y-4"
        >

          <input
            type="text"
            placeholder="Enter OTP"
            className="w-full rounded-xl border p-3"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="New Password"
            className="w-full rounded-xl border p-3"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
          />

          <button
            className="w-full rounded-xl bg-slate-900 p-3 text-white"
          >
            Reset Password
          </button>

          {message && (
            <p className="text-center text-green-600">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}   