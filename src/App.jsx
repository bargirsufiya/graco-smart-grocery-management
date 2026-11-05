import { useState } from "react";
import Home from "./pages/Home";
import AuthModal from "./components/AuthModal";
import GroceryApp from "./components/GroceryApp";

function App() {
  // If the page was opened from a reset email, the link contains ?resetToken=...
  const [resetToken, setResetToken] = useState(() =>
    new URLSearchParams(window.location.search).get("resetToken")
  );

  const [authModal, setAuthModal] = useState(() =>
    new URLSearchParams(window.location.search).get("resetToken")
      ? "reset"
      : null
  );

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("graco_currentUser");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Removes the token from the address bar and from state
  const clearResetToken = () => {
    setResetToken(null);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const openLogin = () => {
    clearResetToken();
    setAuthModal("login");
  };

  const openRegister = () => {
    clearResetToken();
    setAuthModal("register");
  };

  const openForgot = () => {
    setAuthModal("forgot");
  };

  const closeAuth = () => {
    clearResetToken();
    setAuthModal(null);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem("graco_currentUser", JSON.stringify(user));
    setAuthModal(null);
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
    localStorage.setItem("graco_currentUser", JSON.stringify(user));
    setAuthModal(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("graco_currentUser");
    localStorage.removeItem("graco_token");
  };

  // Profile changes (Module 1) update the saved user
  const handleUserUpdate = (user) => {
    setCurrentUser(user);
    localStorage.setItem("graco_currentUser", JSON.stringify(user));
  };

  const handleDemo = () => {
    alert("Demo module will be connected next.");
  };

  if (currentUser) {
    return (
      <GroceryApp
        user={currentUser}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  return (
    <>
      <Home
        onLogin={openLogin}
        onRegister={openRegister}
        onDemo={handleDemo}
      />

      <AuthModal
        type={authModal}
        resetToken={resetToken}
        onClose={closeAuth}
        onSwitchToLogin={openLogin}
        onSwitchToRegister={openRegister}
        onSwitchToForgot={openForgot}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </>
  );
}

export default App;