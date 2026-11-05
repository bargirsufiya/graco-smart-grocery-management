import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { API_BASE_URL } from "../api/apiClient";

const API_URL = `${API_BASE_URL}/auth`;

// Google sign-in only shows when a client ID is configured in .env
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const TITLES = {
  login: ["Welcome Back", "Sign in to manage your grocery lists"],
  register: ["Create Account", "Join Graco and start organizing your shopping"],
  forgot: [
    "Forgot Password?",
    "Enter your email and we'll send you a link to reset your password.",
  ],
  reset: ["Set New Password", "Choose a new password for your account."],
};

function AuthModal({
  type,
  resetToken,
  onClose,
  onSwitchToLogin,
  onSwitchToRegister,
  onSwitchToForgot,
  onLogin,
  onRegister,
}) {
  // Hooks must always be called before any conditional return
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear messages when switching between cards
  const [shownType, setShownType] = useState(type);
  if (type !== shownType) {
    setShownType(type);
    setError("");
    setSuccess("");
  }

  // If no modal type is provided, don't display anything
  if (!type) {
    return null;
  }

  const isLogin = type === "login";
  const isRegister = type === "register";
  const isForgot = type === "forgot";
  const isReset = type === "reset";

  const [title, subtitle] = TITLES[type];

  // Sends a POST request to the backend and returns the JSON response
  const sendAuthRequest = async (path, body) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  };

  const showError = (err) => {
    if (err.message === "Failed to fetch") {
      setError("Cannot reach the server. Please make sure the backend is running.");
    } else {
      setError(err.message);
    }
  };

  // Saves the token and tells the app who is logged in
  const finishAuth = (data) => {
    localStorage.setItem("graco_token", data.token);

    if (isLogin) {
      onLogin(data.user);
    } else {
      onRegister(data.user);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if ((isRegister || isReset) && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (isForgot) {
        const data = await sendAuthRequest("/forgot-password", {
          email: email.trim(),
        });
        setSuccess(data.message);
        return;
      }

      if (isReset) {
        const data = await sendAuthRequest("/reset-password", {
          token: resetToken,
          password,
        });
        setPassword("");
        setConfirmPassword("");
        setSuccess(data.message);
        return;
      }

      if (isLogin) {
        const data = await sendAuthRequest("/login", {
          email: email.trim(),
          password,
        });
        finishAuth(data);
        return;
      }

      const data = await sendAuthRequest("/signup", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      finishAuth(data);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const data = await sendAuthRequest("/google", {
        credential: credentialResponse.credential,
      });

      finishAuth(data);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = isLogin
    ? "Sign In"
    : isRegister
    ? "Create Account"
    : isForgot
    ? "Send Reset Link"
    : "Reset Password";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 slide-in">

        {/* Header */}
        <div className="relative text-center mb-6">

          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>

          <h2 className="text-2xl font-bold text-gray-800 px-8">
            {title}
          </h2>

          <p className="text-sm text-gray-500 mt-1 px-4">
            {subtitle}
          </p>

        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
            {success}
          </div>
        )}

        {/* After success on forgot / reset cards */}
        {success && (isForgot || isReset) ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition duration-300"
          >
            {isForgot ? "Back to Sign In" : "Go to Sign In"}
          </button>
        ) : (
          <>
            {/* Continue with Google - Sign In and Sign Up only */}
            {(isLogin || isRegister) && GOOGLE_ENABLED && (
              <>
                <div className="flex justify-center mb-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() =>
                      setError("Google sign-in failed. Please try again.")
                    }
                    text="continue_with"
                    shape="pill"
                    theme="outline"
                    size="large"
                    width="384"
                  />
                </div>

                <div className="flex items-center mb-4">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="mx-3 text-xs text-gray-400 uppercase tracking-wide">
                    or
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit}>

              {/* Full Name - Register Only */}
              {isRegister && (
                <div className="mb-4">

                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="register-name"
                  >
                    Full Name
                  </label>

                  <input
                    id="register-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />

                </div>
              )}

              {/* Email - not on the reset card */}
              {!isReset && (
                <div className="mb-4">

                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="auth-email"
                  >
                    Email
                  </label>

                  <input
                    id="auth-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />

                </div>
              )}

              {/* Password - not on the forgot card */}
              {!isForgot && (
                <div className={isLogin ? "mb-2" : "mb-4"}>

                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="auth-password"
                  >
                    {isReset ? "New Password" : "Password"}
                  </label>

                  <input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    minLength={6}
                    required
                  />

                </div>
              )}

              {/* Forgot password link - Sign In only */}
              {isLogin && (
                <div className="flex justify-end mb-6">
                  <button
                    type="button"
                    onClick={onSwitchToForgot}
                    className="text-sm text-emerald-600 hover:text-emerald-500"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Confirm Password - Sign Up and Reset */}
              {(isRegister || isReset) && (
                <div className="mb-6">

                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="auth-confirm"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="auth-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    minLength={6}
                    required
                  />

                </div>
              )}

              {/* Spacing for the forgot card */}
              {isForgot && <div className="mb-2"></div>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition duration-300 mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait..." : submitLabel}
              </button>

              {/* Links at the bottom */}
              <p className="text-center text-gray-600 text-sm">

                {isLogin && (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={onSwitchToRegister}
                      className="text-emerald-600 hover:text-emerald-500"
                    >
                      Sign up
                    </button>
                  </>
                )}

                {isRegister && (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={onSwitchToLogin}
                      className="text-emerald-600 hover:text-emerald-500"
                    >
                      Sign in
                    </button>
                  </>
                )}

                {(isForgot || isReset) && (
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-emerald-600 hover:text-emerald-500"
                  >
                    Back to Sign In
                  </button>
                )}

              </p>

            </form>
          </>
        )}

      </div>

    </div>
  );
}

export default AuthModal;