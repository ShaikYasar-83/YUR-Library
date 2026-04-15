// upload.js — File drop, upload API form logic, and rendering My Upload cards

requireUser();
initNavbar();

// ─── File Drop Zone ──────────────────────────────────────────
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("note-file");
const fileDisplay = document.getElementById("file-name-display");

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) { fileInput.files = e.dataTransfer.files; showFileName(file); }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) showFileName(fileInput.files[0]);
});

const showFileName = (file) => {
  fileDisplay.innerHTML = `<i class="bi bi-file-check me-2"></i> ${file.name} ( ${(file.size / 1024 / 1024).toFixed(2)} MB )`;
  fileDisplay.style.display = "block";
};

// ─── Upload Form Submit ──────────────────────────────────────
document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("up-title").value.trim();
  const subject = document.getElementById("up-subject").value.trim();
  const college = document.getElementById("up-college").value.trim();
  const desc = document.getElementById("up-desc").value.trim();
  const file = fileInput.files[0];

  if (!title || !subject || !semester) { showToast("Title, Subject and Semester are required.", "error"); return; }
  if (!file) { showToast("Please attach a file to upload.", "error"); return; }

  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.type)) { showToast("Only PDF, JPG, PNG files allowed.", "error"); return; }
  if (file.size > 10 * 1024 * 1024) { showToast("File size cannot exceed 10MB.", "error"); return; }

  const semester = document.getElementById("up-semester").value;
  formData.append("noteFile", file);
  formData.append("title", title);
  formData.append("subject", subject);
  formData.append("college", college || getUser().college || "");
  formData.append("description", desc);
  if (semester) formData.append("semester", semester);

  const btnText = document.getElementById("upload-btn-text");
  const btnLoading = document.getElementById("upload-btn-loading");
  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";
  btnLoading.style.alignItems = "center";
  btnLoading.style.gap = "0.5rem";
  document.getElementById("upload-btn").disabled = true;

  try {
    await apiFetchForm("/notes/upload", formData);
    showToast("Successfully uploaded! Note is now Pending Review.", "success");
    document.getElementById("upload-form").reset();
    fileDisplay.style.display = "none";
    loadMyUploads();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
    document.getElementById("upload-btn").disabled = false;
  }
});

// ─── Render My Uploads as Cards ──────────────────────────────
const loadMyUploads = async () => {
  const container = document.getElementById("my-uploads-container");
  container.innerHTML = `<div class="loading-block"><div class="spinner"></div><p>Fetching your uploads...</p></div>`;

  try {
    const data = await apiFetch("/notes/user/my-notes");
    const notes = data.data || [];
    document.getElementById("my-uploads-count").textContent = `${notes.length} note${notes.length !== 1 ? "s" : ""}`;

    if (!notes.length) {
      container.innerHTML = `<div style="text-align:center; padding: 4rem; color:var(--text-muted);"><i class="bi bi-cloud-arrow-up" style="font-size:3rem; opacity:0.5;"></i><p class="mt-3">You haven't uploaded any notes yet.</p></div>`;
      return;
    }

    container.innerHTML = `<div class="grid-layout">${notes.map(noteUploadCard).join("")}</div>`;
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding: 4rem;"><i class="bi bi-exclamation-triangle" style="font-size:3rem; color:var(--danger)"></i><p class="mt-3">${err.message}</p></div>`;
  }
};

const noteUploadCard = (note) => {
  // Determine badge colors based on moderation status
  let statusBadge = "";
  if (note.status === "pending") statusBadge = `<span class="card-type" style="background:rgba(245,158,11,0.15); color:var(--warning)">Pending</span>`;
  else if (note.status === "approved") statusBadge = `<span class="card-type" style="background:rgba(16,185,129,0.15); color:var(--success)">Approved</span>`;
  else statusBadge = `<span class="card-type" style="background:rgba(239,68,68,0.15); color:var(--danger)">Rejected</span>`;

  return `
    <div class="modern-card">
      <div class="card-header">
        ${statusBadge}
        <span style="font-size:0.75rem; color:var(--text-muted);"><i class="bi bi-calendar3"></i> ${new Date(note.createdAt).toLocaleDateString()}</span>
      </div>
      
      <div class="card-title">${note.title}</div>
      <div class="card-meta-inline">${note.subject}</div>
      
      <div class="card-desc" style="flex:1;">Status: The admins will review this soon.</div>
      
      <div class="card-footer" style="margin-top:auto;">
        <div class="card-stats">
          <span title="Downloads"><i class="bi bi-download"></i> ${note.downloadsCount || 0}</span>
          <span title="File"><i class="bi bi-file-earmark"></i> ${note.fileType ? note.fileType.toUpperCase() : "FILE"}</span>
        </div>
      </div>
    </div>
  `;
};

// ─── Init ────────────────────────────────────────────────────
loadMyUploads();
