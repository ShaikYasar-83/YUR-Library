let currentNoteFilter = "pending";

window.setNoteFilter = (filter) => {
  currentNoteFilter = filter;
  document.getElementById("btn-show-pending").classList.toggle("active", filter === "pending");
  document.getElementById("btn-show-all").classList.toggle("active", filter === "all");
  loadAdminNotes();
};

// ─── 1. Manage Notes ──────────────────────────────────────────
const loadAdminNotes = async () => {
  const tbody = document.getElementById("admin-notes-tbody");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4"><div class="spinner"></div> Fetching notes data...</td></tr>`;

  try {
    // If filter is 'pending', fetch only pending. If 'all', fetch from the main approved endpoint + pending? 
    // Actually, let's just fetch from an endpoint that returns all notes for admins if we have one.
    // For now, let's use /notes/admin/pending or /notes (for approved).
    let notes = [];
    if (currentNoteFilter === "pending") {
      const res = await apiFetch("/notes/admin/pending");
      notes = res.data || [];
    } else {
      // Fetch approved notes first
      const resApproved = await apiFetch("/notes");
      const approved = resApproved.data || [];
      // Then fetch pending
      const resPending = await apiFetch("/notes/admin/pending");
      const pending = resPending.data || [];
      notes = [...pending, ...approved];
    }

    if (!notes.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No notes match the current filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = notes.map(n => {
      let statusBadge = "";
      if (n.status === "pending") statusBadge = `<span class="card-type" style="background:rgba(245,158,11,0.15); color:var(--warning)">Pending</span>`;
      else if (n.status === "approved") statusBadge = `<span class="card-type" style="background:rgba(16,185,129,0.15); color:var(--success)">Approved</span>`;
      else statusBadge = `<span class="card-type" style="background:rgba(239,68,68,0.15); color:var(--danger)">Rejected</span>`;

      const actions = n.status === "pending" ? `
        <button class="btn btn-sm" style="background:rgba(16,185,129,0.2); color:var(--success);" onclick="updateNoteStatus('${n._id}', 'approve')"><i class="bi bi-check-circle"></i></button>
        <button class="btn btn-sm" style="background:rgba(239,68,68,0.2); color:var(--danger);" onclick="updateNoteStatus('${n._id}', 'reject')"><i class="bi bi-x-circle"></i></button>
      ` : "";

      return `
        <tr>
          <td>
            <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.1rem;">${n.title}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.02em;">${n.subject} • SEM ${n.semester || "?"}</div>
          </td>
          <td>
            <div style="font-size:0.8rem; color:var(--text-muted);">${n.uploadedBy?.name || "Shared"}</div>
            <div style="font-size:0.7rem; color:var(--accent-1); margin-top:0.2rem;">
              <i class="bi bi-eye me-1"></i> ${n.viewsCount || 0} views • <i class="bi bi-download me-1"></i> ${n.downloadsCount || 0}
            </div>
          </td>
          <td>${statusBadge}</td>
          <td style="font-size:0.85rem;">${new Date(n.createdAt).toLocaleDateString()}</td>
          <td class="text-end">
            <div class="d-flex gap-1 justify-content-end">
              ${actions}
              <button class="btn btn-sm btn-outline-light" onclick="openEditNoteModal('${n._id}')"><i class="bi bi-pencil"></i> Edit</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Failed to load notes: ${err.message}</td></tr>`;
  }
};

const editModal = new bootstrap.Modal(document.getElementById("editNoteModal"));

window.openEditNoteModal = async (id) => {
  try {
    const data = await apiFetch(`/notes/${id}`);
    const note = data.data;

    document.getElementById("edit-note-id").value = note._id;
    document.getElementById("edit-title").value = note.title;
    document.getElementById("edit-subject").value = note.subject;
    document.getElementById("edit-college").value = note.college || "";
    document.getElementById("edit-semester").value = note.semester || "";
    document.getElementById("edit-status").value = note.status;
    document.getElementById("edit-desc").value = note.description || "";

    editModal.show();
  } catch (err) {
    showToast("Failed to load note details: " + err.message, "error");
  }
};

window.submitEditNote = async () => {
  const id = document.getElementById("edit-note-id").value;
  const body = {
    title: document.getElementById("edit-title").value.trim(),
    subject: document.getElementById("edit-subject").value.trim(),
    college: document.getElementById("edit-college").value.trim(),
    semester: Number(document.getElementById("edit-semester").value),
    status: document.getElementById("edit-status").value,
    description: document.getElementById("edit-desc").value.trim(),
  };

  const btn = document.getElementById("edit-save-btn");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Saving...`;

  try {
    await apiFetch(`/notes/admin/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    showToast("Note updated successfully!", "success");
    editModal.hide();
    loadAdminNotes();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};

window.updateNoteStatus = async (id, action) => {
  if (!confirm(`Are you sure you want to ${action} this note?`)) return;
  try {
    await apiFetch(`/notes/${action}/${id}`, { method: "PUT" });
    showToast(`Note ${action}d successfully!`, "success");
    loadAdminNotes();
  } catch (err) {
    showToast(err.message, "error");
  }
};

// ─── 2. Manage Requests ───────────────────────────────────────
const loadAdminRequests = async () => {
  const tbody = document.getElementById("admin-requests-tbody");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4"><div class="spinner"></div> Fetching requests data...</td></tr>`;

  try {
    const data = await apiFetch("/requests");
    const reqs = data.data || [];

    if (!reqs.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No active user requests.</td></tr>`;
      return;
    }

    tbody.innerHTML = reqs.map(r => {
      const isPending = r.status === "pending";
      let statusBadge = isPending ? `<span class="card-type" style="background:rgba(245,158,11,0.15); color:var(--warning)">Pending</span>` : `<span class="card-type" style="background:rgba(16,185,129,0.15); color:var(--success)">Completed</span>`;

      return `
        <tr>
          <td><div style="font-weight:600;">${r.subject || "General"}</div><div style="font-size:0.75rem; color:var(--text-muted);">${new Date(r.createdAt).toLocaleDateString()}</div></td>
          <td style="font-size:0.85rem; max-width:250px;">${r.requestText}</td>
          <td style="font-size:0.8rem; color:var(--accent-2);">${r.user || "Unknown User"}</td>
          <td>${statusBadge}</td>
          <td class="text-end">
            ${isPending ? `
              <button class="btn btn-sm" style="background:rgba(16,185,129,0.2); color:var(--success);" onclick="markRequestCompleted('${r._id}')"><i class="bi bi-check2-all"></i> Mark Done</button>
            ` : `<span style="font-size:0.75rem; color:var(--text-muted)">Resolved</span>`}
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Failed to load requests: ${err.message}</td></tr>`;
  }
};

window.markRequestCompleted = async (id) => {
  const adminMsg = prompt("Enter an optional message for the user explaining how this was resolved:");
  if (adminMsg === null) return; // Cancelled
  
  try {
    await apiFetch(`/requests/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "completed", adminNote: adminMsg })
    });
    showToast("Request marked as completed.", "success");
    loadAdminRequests();
  } catch (err) {
    showToast(err.message, "error");
  }
};

// ─── 3. Admin Direct Upload (Updated for Multiple Files) ───────────────────────
document.getElementById("admin-upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title   = document.getElementById("up-title").value.trim();
  const subject = document.getElementById("up-subject").value.trim();
  const college = document.getElementById("up-college").value.trim();
  const desc    = document.getElementById("up-desc").value.trim();
  const semester = document.getElementById("up-semester").value;
  const fileInput = document.getElementById("note-file");
  const files   = fileInput.files;

  if (!subject || !semester || files.length === 0) {
    showToast("Subject, Semester, and at least one File are required.", "error"); return;
  }

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("noteFiles", files[i]);
  }
  
  if (title) formData.append("title", title);
  formData.append("subject", subject);
  formData.append("college", college);
  formData.append("description", desc);
  if (semester) formData.append("semester", semester);

  const btnText    = document.getElementById("upload-btn-text");
  const btnLoading = document.getElementById("upload-btn-loading");
  const uploadBtn  = document.getElementById("upload-btn");
  
  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";
  uploadBtn.disabled = true;

  try {
    // Call the bulk upload endpoint
    await apiFetchForm("/notes/admin/bulk-upload", formData);
    showToast(`${files.length} notes uploaded and placed in pending queue!`, "success");
    document.getElementById("admin-upload-form").reset();
    setTimeout(loadAdminNotes, 1000);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
    uploadBtn.disabled = false;
  }
});

// ─── Boot ─────────────────────────────────────────────────────
loadAdminNotes();
loadAdminRequests();
