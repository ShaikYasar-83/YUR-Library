// auth.js — Login & Register logic

requireGuest(); // redirect to dashboard if already logged in

// Check for redirect messages from protected pages
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("msg") === "login_required") {
  showToast("Please sign in to access this feature.", "error");
  // Clean up URL so it doesn't re-trigger on refresh
  window.history.replaceState({}, document.title, "/login.html");
}

// ────────────────────────────────────────────────────────────
// Password toggle (login page only)
// ────────────────────────────────────────────────────────────
const toggleBtn = document.getElementById("toggle-pw");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const pwInput = document.getElementById("password");
    const icon = toggleBtn.querySelector("i");
    if (pwInput.type === "password") {
      pwInput.type = "text";
      icon.className = "bi bi-eye-slash";
    } else {
      pwInput.type = "password";
      icon.className = "bi bi-eye";
    }
  });
}

// ────────────────────────────────────────────────────────────
// LOGIN FORM
// ────────────────────────────────────────────────────────────
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showToast("Please fill in both fields.", "error"); return;
    }

    const btnText    = document.getElementById("btn-text");
    const btnLoading = document.getElementById("btn-loading");
    btnText.style.display = "none";
    btnLoading.style.display = "inline-block";

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.token, data.user);
      
      if (data.user.role === "admin") {
        window.location.href = "/admin-dashboard.html";
      } else {
        window.location.href = "/dashboard.html";
      }
    } catch (err) {
      showToast(err.message, "error");
      btnText.style.display = "inline-block";
      btnLoading.style.display = "none";
    }
  });
}

// ────────────────────────────────────────────────────────────
// REGISTER FORM
// ────────────────────────────────────────────────────────────
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name     = document.getElementById("name").value.trim();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const college  = document.getElementById("college").value.trim();
    const branch   = document.getElementById("branch").value.trim();
    const year     = parseInt(document.getElementById("year").value);

    if (!name || !email || !password || !college || !branch || !year) {
      showToast("Please fill in all fields.", "error"); return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error"); return;
    }

    const btnText    = document.getElementById("btn-text");
    const btnLoading = document.getElementById("btn-loading");
    btnText.style.display = "none";
    btnLoading.style.display = "inline-block";

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, college, branch, year }),
      });
      
      // Success - show verification section
      showToast(data.message, "success");
      document.getElementById("reg-fields").style.display = "none";
      document.getElementById("verify-section").style.display = "block";
      document.getElementById("display-email").textContent = email;
      
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btnText.style.display = "inline-block";
      btnLoading.style.display = "none";
    }
  });
}

// ────────────────────────────────────────────────────────────
// VERIFICATION LOGIC
// ────────────────────────────────────────────────────────────
const verifyBtn = document.getElementById("verify-btn");
if (verifyBtn) {
  verifyBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const otp = document.getElementById("otp").value.trim();

    if (!otp || otp.length !== 6) {
      showToast("Please enter a 6-digit code.", "error"); return;
    }

    const btnText = document.getElementById("verify-btn-text");
    const btnLoading = document.getElementById("verify-btn-loading");
    btnText.style.display = "none";
    btnLoading.style.display = "inline-block";

    try {
      const data = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      setAuth(data.token, data.user);
      showToast("Email verified! Redirecting...", "success");

      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "/admin-dashboard.html";
        } else {
          window.location.href = "/dashboard.html";
        }
      }, 1500);

    } catch (err) {
      showToast(err.message, "error");
      btnText.style.display = "inline-block";
      btnLoading.style.display = "none";
    }
  });
}

const resendLink = document.getElementById("resend-otp-link");
if (resendLink) {
  resendLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    
    try {
      const data = await apiFetch("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      showToast(data.message, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

const backBtn = document.getElementById("back-to-reg");
if (backBtn) {
  backBtn.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("reg-fields").style.display = "block";
    document.getElementById("verify-section").style.display = "none";
  });
}

