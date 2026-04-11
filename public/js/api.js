// ============================================================
// api.js — Shared API helper for all pages (Redesigned)
// ============================================================

const BASE_URL = "http://localhost:5000/api";

// ─── Token Helpers ───────────────────────────────────────────
const getToken  = ()       => localStorage.getItem("token");
const getUser   = ()       => JSON.parse(localStorage.getItem("user") || "{}");
const setAuth   = (t, u)   => { localStorage.setItem("token", t); localStorage.setItem("user", JSON.stringify(u)); };
const clearAuth = ()       => { localStorage.removeItem("token"); localStorage.removeItem("user"); };

// ─── Auth Guards ─────────────────────────────────────────────
const requireAuth = () => {
  if (!getToken()) window.location.href = "/login.html";
};

const requireAdmin = () => {
  requireAuth();
  const user = getUser();
  if (user.role !== "admin") window.location.href = "/dashboard.html";
};

const requireUser = () => {
  requireAuth();
  const user = getUser();
  if (user.role === "admin") window.location.href = "/admin-dashboard.html";
};

const requireGuest = () => {
  if (getToken()) {
    const user = getUser();
    if (user.role === "admin") window.location.href = "/admin-dashboard.html";
    else window.location.href = "/dashboard.html";
  }
};

// ─── Core Fetch Wrapper ──────────────────────────────────────
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ─── FormData Fetch (for file uploads) ──────────────────────
const apiFetchForm = async (endpoint, formData) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
};

// ─── UI Helpers (Toasts & Stars) ─────────────────────────────
const showToast = (message, type = "success") => {
  // Ensure container exists
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-msg ${type}`;
  const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
  toast.innerHTML = `<i class="bi ${icon}"></i> <span>${message}</span>`;
  
  container.appendChild(toast);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Legacy compat just in case old code calls it
const showAlert = (containerId, message, type) => showToast(message, type);

const getStars = (avg, total) => {
  const rating = Math.round(avg || 0);
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="bi bi-star${i <= rating ? "-fill" : ""} ${i <= rating ? "text-warning" : ""}"></i>`;
  }
  return `<span>${stars}</span> <span>${avg ? avg.toFixed(1) : "0.0"} (${total || 0})</span>`;
};

// ─── Navbar Initialization ───────────────────────────────────
const initNavbar = () => {
  const user = getUser();
  const avatarEl = document.getElementById("nav-avatar");
  const nameEl = document.getElementById("nav-name");
  
  if (avatarEl) avatarEl.textContent = (user.name || "U").charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = user.name ? user.name.split(" ")[0] : "Student";

  // Highlight active nav item
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll(".nav-item").forEach(a => {
    if (a.getAttribute("href") === "/" + currentPage || a.getAttribute("href") === currentPage) {
      a.classList.add("active");
    }
  });
};

// ─── Logout ──────────────────────────────────────────────────
const logout = () => {
  const user = getUser();
  const isAdminLogout = user && user.role === "admin";
  clearAuth();
  window.location.href = isAdminLogout ? "/login?admin=true" : "/login";
};
