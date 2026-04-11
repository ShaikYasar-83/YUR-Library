// auth.js — Login & Register logic

requireGuest(); // redirect to dashboard if already logged in

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
