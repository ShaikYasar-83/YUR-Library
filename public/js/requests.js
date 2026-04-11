// requests.js — Submit note request & view My Requests as cards

requireUser();
initNavbar();

// ─── Submit Request ──────────────────────────────────────────
const requestForm = document.getElementById("request-form");
if (requestForm) {
  requestForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const subject = document.getElementById("req-subject").value.trim();
    const text    = document.getElementById("req-text").value.trim();

    if (!text) {
      showToast("Detailed request description is required.", "error"); return;
    }
    if (text.length < 10) {
      showToast("Description must be at least 10 characters.", "error"); return;
    }

    const btnText    = document.getElementById("req-btn-text");
    const btnLoading = document.getElementById("req-btn-loading");
    btnText.style.display = "none";
    btnLoading.style.display = "inline-flex";
    btnLoading.style.alignItems = "center";
    btnLoading.style.gap = "0.5rem";
    document.getElementById("req-btn").disabled = true;

    try {
      await apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({ subject, requestText: text }),
      });
      showToast("Request submitted successfully!", "success");
      requestForm.reset();
      loadMyRequests();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
      document.getElementById("req-btn").disabled = false;
    }
  });
}

// ─── Render My Requests as Cards ─────────────────────────────
const loadMyRequests = async () => {
  const container = document.getElementById("requests-container");
  container.innerHTML = `<div class="loading-block"><div class="spinner"></div><p>Fetching your requests...</p></div>`;

  try {
    const data = await apiFetch("/requests/my");
    const reqs = data.data || [];
    document.getElementById("req-count").textContent = `${reqs.length} request${reqs.length !== 1 ? "s" : ""}`;

    if (!reqs.length) {
      container.innerHTML = `<div style="text-align:center; padding: 4rem; color:var(--text-muted);"><i class="bi bi-chat-square-text" style="font-size:3rem; opacity:0.5;"></i><p class="mt-3">You haven't requested any notes yet.</p></div>`;
      return;
    }

    container.innerHTML = `<div class="grid-layout">${reqs.map(reqCard).join("")}</div>`;
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding: 4rem;"><i class="bi bi-exclamation-triangle" style="font-size:3rem; color:var(--danger)"></i><p class="mt-3">${err.message}</p></div>`;
  }
};

const reqCard = (r) => {
  let statusBadge = "";
  if (r.status === "pending") statusBadge = `<span class="card-type" style="background:rgba(245,158,11,0.15); color:var(--warning)">Pending</span>`;
  else statusBadge = `<span class="card-type" style="background:rgba(16,185,129,0.15); color:var(--success)">Completed</span>`;

  return `
    <div class="modern-card">
      <div class="card-header">
        ${statusBadge}
        <span style="font-size:0.75rem; color:var(--text-muted);"><i class="bi bi-calendar3"></i> ${new Date(r.createdAt).toLocaleDateString()}</span>
      </div>
      
      <div class="card-title">${r.subject || "General Request"}</div>
      <div class="card-desc" style="flex:1;">"${r.requestText}"</div>
      
      ${r.adminNote ? `<div style="margin-bottom:1rem; padding:0.75rem; background:rgba(139,92,246,0.1); border-left:3px solid var(--accent-1); border-radius:4px; font-size:0.8rem; color:var(--text-primary);"><i class="bi bi-info-circle me-1 text-info"></i> ${r.adminNote}</div>` : ""}

      <div class="card-footer" style="margin-top:auto; padding-top:0.5rem;">
        <div class="card-stats"></div>
        <div class="card-actions">
          <button class="btn-icon" style="background:rgba(239, 68, 68, 0.15); color:var(--danger);" onclick="deleteRequest('${r._id}')" title="Delete Request">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
};

// ─── Delete Request ────────────────────────────────────────────
window.deleteRequest = async (id) => {
  if (!confirm("Are you sure you want to delete this request?")) return;

  try {
    await apiFetch(`/requests/${id}`, { method: "DELETE" });
    showToast("Request deleted.", "success");
    loadMyRequests();
  } catch (err) {
    showToast("Failed to delete: " + err.message, "error");
  }
};

// ─── Init ──────────────────────────────────────────────────────
loadMyRequests();
