import { useEffect, useState } from "react";
import "./Login.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/* =========================================================
   ROLE REDIRECTS
   ========================================================= */

const ROLE_REDIRECT = {
  candidate: "/candidate",
  alumni: "/alumni",
  recruiter: "/recruiter",
  placement_officer: "/placement",
  college_admin: "/college-admin",
  super_admin: "/super-admin",
};

/* =========================================================
   DEMO ACCOUNTS (for the hint panel)
   ========================================================= */

const DEMO_ACCOUNTS = [
  { role: "Candidate",         email: "c@gmail.com",              password: "123" },
  { role: "Alumni",            email: "a@gmail.com",              password: "123" },
  { role: "Recruiter",         email: "r@gmail.com",              password: "123" },
  { role: "Placement Officer", email: "p@gmail.com",              password: "123" },
  { role: "College Admin",     email: "ca@iiit.in",               password: "123" },
  { role: "Super Admin",       email: "superadmin@platform.com",  password: "123" },
];

/* =========================================================
   APP
   ========================================================= */

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoHints, setShowDemoHints] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStep, setResetStep] = useState("email");

  useEffect(() => {
    document.title = "Login — CareerNest";
  }, []);

  /* =========================================================
     HELPERS
     ========================================================= */

  const displayMessage = (text, color) => {
    setMessage(text);
    setMessageColor(color);
  };

  const togglePassword = () => setShowPassword((prev) => !prev);

  /* =========================================================
     LOGIN
     All logins go through the real backend so every session
     gets a valid accessToken that ProtectedRoute can verify.
     Demo accounts (c@gmail.com / 123, etc.) live in the
     backend's in-memory store and work exactly like real ones.
     ========================================================= */

  const login = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    setMessage("");
    setMessageColor("");

    if (!cleanEmail || !cleanPassword) {
      displayMessage("Please enter your email and password.", "red");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      if (response.ok) {
        const user = await response.json();

        /* Persist full session — AuthContext.readSession() reads loggedInUser */
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userName", user.name || "");
        localStorage.setItem("userEmail", user.email || "");
        localStorage.setItem("userId", String(user.id));
        localStorage.setItem(
          "collegeId",
          user.collegeId != null ? String(user.collegeId) : "null"
        );
        /* accessToken is critical — ProtectedRoute checks user?.accessToken */
        localStorage.setItem("accessToken", user.accessToken || "");

        if (user.role === "recruiter") {
          localStorage.setItem("recruiterEmail", user.email);
          localStorage.setItem("recruiterName", user.name);
          localStorage.setItem("recruiterCompany", user.company || "");
        }

        const redirectUrl = ROLE_REDIRECT[user.role];

        if (!redirectUrl) {
          displayMessage(`Unknown role: ${user.role}`, "red");
          setLoading(false);
          return;
        }

        displayMessage("Login successful! Redirecting…", "green");

        /* window.location.replace() triggers a full navigation so the new
           route's AuthContext mounts with the localStorage we just wrote. */
        setTimeout(() => { window.location.replace(redirectUrl); }, 600);

      } else {
        let errorMsg = "Invalid email or password.";
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData.message)) {
            errorMsg = errorData.message.join(", ");
          } else if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch { /* use default */ }
        displayMessage(errorMsg, "red");
        setLoading(false);
      }

    } catch (error) {
      console.error("[login] Network error:", error);
      displayMessage(
        "Cannot reach login server. Make sure the backend is running on port 3000.",
        "red"
      );
      setLoading(false);
    }
  };

  const handlePasswordKeyDown = (event) => {
    if (event.key === "Enter") login();
  };

  const handleBackToHome = () => {
    window.location.href = "/";
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetPassword("");
    setResetConfirmPassword("");
    setResetMessage("");
    setResetStep("email");
    setShowForgotPassword(true);
  };

  const continuePasswordReset = (event) => {
    event.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!/^\S+@\S+\.[A-Za-z]{2,}$/.test(cleanEmail)) {
      setResetMessage("Enter the email address registered to your account.");
      return;
    }
    setResetEmail(cleanEmail);
    setResetMessage("");
    setResetStep("password");
  };

  const resetAccountPassword = async (event) => {
    event.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (resetPassword.length < 3) {
      setResetMessage("Your new password must contain at least 3 characters.");
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetMessage("The new password and confirmation do not match.");
      return;
    }
    setResetLoading(true);
    setResetMessage("");
    try {
      const response = await fetch(`${BASE_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, newPassword: resetPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message);
      setEmail(cleanEmail);
      setPassword("");
      setResetMessage(data.message || "Password reset successfully. You can now sign in.");
      setResetStep("complete");
    } catch (error) {
      setResetMessage(error.message || "Could not reset your password. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="cn-login" style={{ display: "contents" }}>
      <div className="login-page login-page--single">

        <div className="main-wrapper main-wrapper--single">

          {/* =================================================
              LOGIN CONTAINER
              ================================================= */}

          <div className="login-container">

            {/* LOGO / TITLE */}
            <div className="login-brand">
              <div className="login-brand__icon">
                <i className="fa-solid fa-briefcase"></i>
              </div>
              <h1>CareerNest</h1>
              <p className="login-brand__sub">Sign in to your account</p>
            </div>


            {/* EMAIL */}

            <div className="input-group">
              <p className="label">Email ID</p>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>


            {/* PASSWORD */}

            <div className="input-group">
              <p className="label">Password</p>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  autoComplete="current-password"
                />
                <span
                  className="toggle-password"
                  onClick={togglePassword}
                  role="button"
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") togglePassword();
                  }}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </span>
              </div>
              <button type="button" className="forgot-password-btn" onClick={openForgotPassword}>Forgot password?</button>
            </div>


            {/* LOGIN BUTTON */}

            <button className="login-btn" onClick={login} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>


            {/* MESSAGE */}

            <p id="msg-display" style={{ color: messageColor }}>{message}</p>


            {/* DEMO HINT TOGGLE */}

            <div className="demo-section">
              <button
                className="demo-toggle-btn"
                onClick={() => setShowDemoHints((v) => !v)}
                type="button"
              >
                <i className={`fa-solid ${showDemoHints ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                &nbsp; Demo Accounts
              </button>

              {showDemoHints && (
                <div className="demo-table">
                  {DEMO_ACCOUNTS.map((d) => (
                    <div
                      key={d.role}
                      className="demo-row"
                      onClick={() => {
                        setEmail(d.email);
                        setPassword(d.password);
                        setShowDemoHints(false);
                      }}
                      title={`Click to fill in ${d.role} credentials`}
                    >
                      <span className="demo-role">{d.role}</span>
                      <span className="demo-cred">{d.email} / {d.password}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="recruiter-contact-link">
              <span>Recruiter looking to hire from campus?</span>
              <a href="/recruiter-contact">Contact a college →</a>
            </div>

          </div>

          {showForgotPassword && (
            <div className="forgot-password-backdrop" onClick={() => setShowForgotPassword(false)}>
              <form className="forgot-password-modal" onSubmit={resetStep === "email" ? continuePasswordReset : resetAccountPassword} onClick={(event) => event.stopPropagation()}>
                <button type="button" className="forgot-password-close" onClick={() => setShowForgotPassword(false)} aria-label="Close">×</button>
                {resetStep === "email" && <>
                  <span className="forgot-password-step">Step 1 of 2</span>
                  <h2>Find your account</h2>
                  <p>Enter the email address registered to your CareerNest account.</p>
                  <label>Email address</label>
                  <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} autoComplete="email" required autoFocus />
                  {resetMessage && <p className="forgot-password-message">{resetMessage}</p>}
                  <button className="login-btn" type="submit">Continue</button>
                </>}
                {resetStep === "password" && <>
                  <span className="forgot-password-step">Step 2 of 2</span>
                  <h2>Choose a new password</h2>
                  <p>Resetting the password for <strong>{resetEmail}</strong>.</p>
                  <label>New password</label>
                  <input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} autoComplete="new-password" required autoFocus />
                  <label>Confirm new password</label>
                  <input type="password" value={resetConfirmPassword} onChange={(event) => setResetConfirmPassword(event.target.value)} autoComplete="new-password" required />
                  {resetMessage && <p className="forgot-password-message">{resetMessage}</p>}
                  <div className="forgot-password-actions"><button type="button" className="forgot-password-back" onClick={() => { setResetMessage(""); setResetStep("email"); }}>Back</button><button className="login-btn" type="submit" disabled={resetLoading}>{resetLoading ? "Resetting…" : "Reset Password"}</button></div>
                </>}
                {resetStep === "complete" && <>
                  <span className="forgot-password-step">Complete</span>
                  <h2>Password changed</h2>
                  <p className="forgot-password-success">{resetMessage}</p>
                  <button className="login-btn" type="button" onClick={() => setShowForgotPassword(false)}>Back to sign in</button>
                </>}
              </form>
            </div>
          )}


          {/* =================================================
              BACK TO HOME
              ================================================= */}

          <div className="footer-action">
            <button className="home-btn" onClick={handleBackToHome}>
              <i className="fa-solid fa-arrow-left" style={{ marginRight: "6px" }}></i>
              Back To Home
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
