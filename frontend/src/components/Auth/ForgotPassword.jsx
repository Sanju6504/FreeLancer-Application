import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Briefcase } from "lucide-react";
import { http } from "../../services/http.js";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: enter email, 2: enter otp + new password
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(5 * 60); // 5 minutes
  const [submittingReset, setSubmittingReset] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await http("POST", "/auth/forgot", { email });
      setMessage("We sent a 6-digit OTP to your email. It expires in 5 minutes.");
      toast.success("OTP sent to your email");
      setStep(2);
      setSecondsLeft(5 * 60);
    } catch (err) {
      setError(err?.message || "Failed to request password reset");
      toast.error(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (step !== 2) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, secondsLeft]);

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return; // allow only single digit
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    if (val && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && inputsRef.current[idx - 1]) {
      inputsRef.current[idx - 1].focus();
    }
  };

  const otp = otpDigits.join("");
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (secondsLeft <= 0) {
      setError("OTP expired. Please request again.");
      return;
    }
    setSubmittingReset(true);
    try {
      await http("POST", "/auth/reset", { email, otp, newPassword });
      setMessage("Password reset successful. Redirecting to sign in...");
      toast.success("Password reset successful");
      navigate("/auth/signin");
    } catch (err) {
      setError(err?.message || "Failed to reset password");
      toast.error(err?.message || "Failed to reset password");
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Briefcase className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Forgot your password?
        </h2>
        {step === 1 ? (
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we'll send you a One-Time Password (OTP).
          </p>
        ) : (
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit OTP sent to your email and set a new password.
          </p>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-lg sm:rounded-2xl sm:px-12">
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-6">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP</label>
                <div className="mt-2">
                  {/* Table layout for 6-digit OTP */}
                  <table className="w-full text-center border-separate border-spacing-2">
                    <tbody>
                      <tr>
                        {otpDigits.map((d, i) => (
                          <td key={i} className="">
                            <input
                              ref={(el) => (inputsRef.current[i] = el)}
                              inputMode="numeric"
                              maxLength={1}
                              value={d}
                              onChange={(e) => handleOtpChange(i, e.target.value.replace(/\D/g, ""))}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="w-12 h-12 border border-gray-300 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-sm text-gray-600">Time remaining: {minutes}:{seconds}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReset}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingReset ? "Resetting..." : "Verify OTP & Reset Password"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/auth/signin" className="text-sm text-blue-600 hover:text-blue-700">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

