import { useViewState } from '../../store/useViewState.js';
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { signIn } from "../../store/authCommands.js";
import "./Login.css";

/* =========================================================
   APP
   ========================================================= */

function LoginPage() {
  const dispatch = useDispatch();
  const [
    { email, password, showPassword, message, messageColor, loading },
    { setEmail, setPassword, setShowPassword },
    view,
  ] = useViewState('publicPages', 'LoginPage', () => ({
    email: "",
    password: "",
    showPassword: false,
    message: "",
    messageColor: "",
    loading: false,
  }));

  useEffect(() => {
    document.title = "Login — CareerNest";
  }, []);

  /* =========================================================
     HELPERS
     ========================================================= */

  const togglePassword = () => setShowPassword((prev) => !prev);

  /* =========================================================
     LOGIN
     All logins go through the real backend so every session
     gets a valid accessToken that ProtectedRoute can verify.
     Demo accounts shown in the hint panel live in the
     backend's in-memory store and work exactly like real ones.
     ========================================================= */

  const login = () => dispatch(signIn(view));

  const handlePasswordKeyDown = (event) => {
    if (event.key === "Enter") login();
  };

  const handleBackToHome = () => {
    window.location.href = "/";
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
            </div>

            {/* LOGIN BUTTON */}

            <button className="login-btn" onClick={login} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {/* MESSAGE */}

            <p id="msg-display" style={{ color: messageColor }}>{message}</p>

          </div>

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
