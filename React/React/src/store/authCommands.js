import { selectView, viewFieldChanged } from './viewState.js';

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

export const signIn = (view) => async (dispatch, getState) => {
  const { email, password } = selectView(getState(), view.owner, view.id);
  const update = (field, value) => dispatch(viewFieldChanged({ ...view, field, value }));
  const displayMessage = (text, color) => {
    update('message', text);
    update('messageColor', color);
  };
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  update('message', '');
  update('messageColor', '');

  if (!cleanEmail || !cleanPassword) {
    displayMessage("Please enter your email and password.", "red");
    return;
  }

  update('loading', true);

  try {
    const response = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    if (response.ok) {
      const user = await response.json();

      /* Persist the session for API requests and full-page navigation. */
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
        update('loading', false);
        return;
      }

      displayMessage("Login successful! Redirecting…", "green");

      /* The new page hydrates Redux from localStorage after the redirect. */
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
      update('loading', false);
    }

  } catch (error) {
    console.error("[login] Network error:", error);
    displayMessage(
      "Cannot reach login server. Make sure the backend is running on port 3000.",
      "red"
    );
    update('loading', false);
  }
};
