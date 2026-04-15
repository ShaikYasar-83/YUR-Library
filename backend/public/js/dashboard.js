// dashboard.js — Logic for new Notion-style Notes UI

initNavbar();

let allNotes = [];
let selectedRating = 0;

// ─── Fetch & Render Notes ─────────────────────────────────────
const loadNotes = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.subject)  query.set("subject", params.subject);
  if (params.college)  query.set("college", params.college);
  if (params.semester) query.set("semester", params.semester);
  if (params.sort)     query.set("sort", params.sort);

  const container = document.getElementById("notes-container");
  container.innerHTML = `<div class="loading-block"><div class="spinner"></div><p>Loading the best notes...</p></div>`;

  try {
    const qs = query.toString();
    const data = await apiFetch(`/notes${qs ? "?" + qs : ""}`);
    allNotes = data.data || [];
    renderNotes(allNotes);
    populateFilters(allNotes);
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding: 4rem;"><i class="bi bi-exclamation-triangle" style="font-size:3rem; color:var(--danger)"></i><p class="mt-3">${err.message}</p></div>`;
  }
};

const renderNotes = (notes) => {
  const container = document.getElementById("notes-container");
  document.getElementById("notes-count").textContent = `${notes.length} note${notes.length !== 1 ? "s" : ""}`;

  if (!notes.length) {
    container.innerHTML = `<div style="text-align:center; padding: 4rem; color:var(--text-muted);"><i class="bi bi-journal-x" style="font-size:3rem; opacity:0.5;"></i><p class="mt-3">No notes found. Be the first to upload!</p></div>`;
    return;
  }

  container.innerHTML = `<div class="grid-layout">${notes.map(noteCard).join("")}</div>`;
};

const noteCard = (note) => {
  const typeClass = (note.fileType || "pdf").toLowerCase().includes("pdf") ? "type-pdf" : "type-img";
  return `
    <div class="modern-card">
      <div class="card-header">
        <span class="card-type ${typeClass}">${note.fileType || "PDF"}</span>
        <span style="font-size:0.75rem; color:var(--text-muted);"><i class="bi bi-calendar3"></i> ${new Date(note.createdAt).toLocaleDateString()}</span>
      </div>
      
      <div class="card-title">${note.title}</div>
      <div class="card-meta-inline">
        ${note.subject} 
        <span>•</span> <span>${note.college}</span>
        ${note.semester ? `<span>•</span> <span class="text-accent" style="color:var(--accent-1); font-weight:600;">Sem ${note.semester}</span>` : ""}
      </div>
      
      <div class="card-desc">${note.description || "No description provided."}</div>
      
      <div class="card-footer">
        <div class="card-stats">
          <span title="Downloads"><i class="bi bi-download"></i> ${note.downloadsCount || 0}</span>
          <span title="Rating"><i class="bi bi-star-fill text-warning" style="font-size:0.7rem;"></i> ${note.averageRating ? note.averageRating.toFixed(1) : "New"}</span>
        </div>
        <div class="card-actions">
          <button class="btn-icon" onclick="viewNote('${note._id}')" title="View / Preview">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn-icon" onclick="openReview('${note._id}','${note.title.replace(/'/g,"\\'")}')" title="Leave Review">
            <i class="bi bi-chat-left-text"></i>
          </button>
          <button class="btn-icon" style="background:var(--accent-1); color:#fff;" onclick="downloadNote('${note._id}','${note.title}')" title="Download">
            <i class="bi bi-cloud-arrow-down"></i>
          </button>
        </div>
      </div>
    </div>
  `;
};

// ─── Populate Filter Dropdowns ─────────────────────────────
const populateFilters = (notes) => {
  const subjects = [...new Set(notes.map(n => n.subject))].sort();
  const colleges  = [...new Set(notes.map(n => n.college))].sort();

  const subEl = document.getElementById("filter-subject");
  const colEl = document.getElementById("filter-college");

  // Keep selected values if already set
  const currentSub = subEl.value;
  const currentCol = colEl.value;

  subEl.innerHTML = '<option value="">All Subjects</option>';
  colEl.innerHTML = '<option value="">All Colleges</option>';

  subjects.forEach(s => { const o = document.createElement("option"); o.value = s; o.textContent = s; subEl.appendChild(o); });
  colleges.forEach(c => { const o = document.createElement("option"); o.value = c; o.textContent = c; colEl.appendChild(o); });

  subEl.value = currentSub;
  colEl.value = currentCol;
};

// ─── Filter Events ─────────────────────────────────────────
const getFilters = () => ({
  semester: document.getElementById("filter-semester").value,
  subject: document.getElementById("filter-subject").value,
  college: document.getElementById("filter-college").value,
  sort: document.getElementById("filter-sort").value,
});

document.getElementById("filter-semester").addEventListener("change", () => loadNotes(getFilters()));
document.getElementById("filter-subject").addEventListener("change", () => loadNotes(getFilters()));
document.getElementById("filter-college").addEventListener("change", () => loadNotes(getFilters()));
document.getElementById("filter-sort").addEventListener("change", () => loadNotes(getFilters()));

document.getElementById("clear-filters").addEventListener("click", () => {
  document.getElementById("filter-semester").value = "";
  document.getElementById("filter-subject").value = "";
  document.getElementById("filter-college").value = "";
  document.getElementById("filter-sort").value = "latest";
  document.getElementById("search-input").value = "";
  loadNotes();
});

// ─── Search ────────────────────────────────────────────────
let searchTimer;
document.getElementById("search-input").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  searchTimer = setTimeout(async () => {
    if (!q) { loadNotes(getFilters()); return; }
    const container = document.getElementById("notes-container");
    container.innerHTML = `<div class="loading-block"><div class="spinner"></div><p>Searching...</p></div>`;
    try {
      const data = await apiFetch(`/notes/search?q=${encodeURIComponent(q)}`);
      renderNotes(data.data || []);
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; padding: 4rem;"><i class="bi bi-search" style="font-size:3rem; opacity:0.5;"></i><p class="mt-3">${err.message}</p></div>`;
    }
  }, 400);
});

// ─── Download ──────────────────────────────────────────────
const downloadNote = async (id, title) => {
  try {
    const token = getToken();
    showToast("Starting download...", "success");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/notes/download/${id}`, { headers });
    if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = title; a.click();
    URL.revokeObjectURL(url);
    // Refresh quietly
    setTimeout(() => loadNotes(getFilters()), 1000);
  } catch (err) { showToast("Download failed: " + err.message, "error"); }
};

const viewNote = (id) => {
  const token = getToken();
  // Open the view route in a new tab.
  const url = token 
    ? `${BASE_URL}/notes/view/${id}?token=${token}` 
    : `${BASE_URL}/notes/view/${id}`;
    
  window.open(url, "_blank");
  // Refresh counts after a delay
  setTimeout(() => loadNotes(getFilters()), 2000);
};

// ─── Review Modal ──────────────────────────────────────────
const reviewModal = new bootstrap.Modal(document.getElementById("reviewModal"));

const openReview = (noteId, title) => {
  document.getElementById("review-note-id").value = noteId;
  document.getElementById("review-note-title").textContent = title;
  document.getElementById("review-comment").value = "";
  document.getElementById("review-rating").value = 0;
  selectedRating = 0;
  updateStarUI(0);
  
  loadExistingReviews(noteId);
  reviewModal.show();
};

const loadExistingReviews = async (noteId) => {
  const list = document.getElementById("reviews-list");
  list.innerHTML = `<div class="text-center py-3"><div class="spinner" style="width:20px;height:20px;"></div></div>`;
  
  try {
    const data = await apiFetch(`/reviews/${noteId}`);
    const reviews = data.data || [];
    
    if (reviews.length === 0) {
      list.innerHTML = `<p class="text-muted small text-center py-3">No reviews yet. Be the first!</p>`;
      return;
    }
    
    list.innerHTML = reviews.map(r => `
      <div style="background:var(--bg-primary); border:1px solid var(--border); border-radius:10px; padding:1rem; margin-bottom:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
          <strong style="font-size:0.85rem; color:var(--text-primary);">
            <i class="bi bi-person-circle me-1"></i> ${r.user ? r.user.name : "Guest User"}
          </strong>
          <div style="font-size:0.8rem; color:var(--warning);">
            ${Array(5).fill(0).map((_, i) => `<i class="bi bi-star${i < r.rating ? "-fill" : ""}"></i>`).join("")}
          </div>
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin:0;">${r.comment || '<span class="text-muted italic">No comment provided</span>'}</p>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem;">${new Date(r.createdAt).toLocaleDateString()}</div>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<p class="text-danger small text-center py-3">Failed to load reviews.</p>`;
  }
};

document.getElementById("star-select").addEventListener("click", (e) => {
  const star = e.target.closest("[data-val]");
  if (!star) return;
  selectedRating = parseInt(star.dataset.val);
  document.getElementById("review-rating").value = selectedRating;
  updateStarUI(selectedRating);
});

document.getElementById("star-select").addEventListener("mouseover", (e) => {
  const star = e.target.closest("[data-val]");
  if (star) updateStarUI(parseInt(star.dataset.val));
});

document.getElementById("star-select").addEventListener("mouseleave", () => {
  updateStarUI(selectedRating);
});

const updateStarUI = (count) => {
  document.querySelectorAll("#star-select i").forEach((s, i) => {
    s.className = i < count ? "bi bi-star-fill active text-warning" : "bi bi-star";
  });
};

document.getElementById("submit-review-btn").addEventListener("click", async () => {
  const noteId  = document.getElementById("review-note-id").value;
  const rating  = parseInt(document.getElementById("review-rating").value);
  const comment = document.getElementById("review-comment").value.trim();

  if (!rating) { showToast("Please select a star rating first.", "error"); return; }

  const btn = document.getElementById("submit-review-btn");
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;"></div>`;

  try {
    await apiFetch("/reviews", {
      method: "POST",
      body: JSON.stringify({ noteId, rating, comment }),
    });
    showToast("Review submitted successfully!", "success");
    reviewModal.hide();
    loadNotes(getFilters());
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Leave Review`;
  }
});

// ─── Init ──────────────────────────────────────────────────
loadNotes();
