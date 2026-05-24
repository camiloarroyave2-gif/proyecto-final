const API = "";
let userId = null;
let currentEmail = "";
let currentFilter = "all";
let allTasks = [];

/* ── TOAST NOTIFICATIONS ── */
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const icons = { success: "✓", error: "✕", info: "ℹ" };
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ"}</span><span>${message}</span>`;
    container.appendChild(toast);
    gsapRipple(toast);
    
    setTimeout(() => {
        toast.classList.add("toast-out");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function gsapRipple(el) {
    const ripple = document.createElement("span");
    ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(184,255,63,0.15);pointer-events:none;width:10px;height:10px;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);animation:rippleAnim 0.6s ease-out forwards;`;
    el.style.position = "relative";
    el.style.overflow = "hidden";
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

/* ── THEME TOGGLE ── */
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
}

function loadTheme() {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
}

/* ── MESSAGES (legacy) ── */
function showAuthMessage(text, type = "error") {
    const el = document.getElementById("authMessage");
    el.textContent = text;
    el.className = `message ${type}`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add("hidden"), 4000);
}

function showTaskMessage(text, type = "error") {
    showToast(text, type);
}

/* ── NAVIGATION ── */
function showApp() {
    const appSection = document.getElementById("appSection");
    appSection.style.opacity = "0";
    appSection.style.transform = "translateY(20px)";
    document.getElementById("authSection").classList.add("hidden");
    appSection.classList.remove("hidden");
    document.getElementById("userStatus").classList.remove("hidden");
    document.getElementById("userEmail").textContent = currentEmail;
    selectCategory('personal');
    requestAnimationFrame(() => {
        appSection.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        appSection.style.opacity = "1";
        appSection.style.transform = "translateY(0)";
    });
    setTimeout(() => {
        document.querySelectorAll(".stat-card").forEach(c => c.classList.add("stagger"));
    }, 100);
    loadTasks();
}

function showAuth() {
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("appSection").classList.add("hidden");
    document.getElementById("userStatus").classList.add("hidden");
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    userId = null;
    currentEmail = "";
    document.getElementById("authSection").querySelector(".auth-card").style.animation = "none";
    requestAnimationFrame(() => {
        document.getElementById("authSection").querySelector(".auth-card").style.animation = "cardIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both";
    });
}

/* ── AUTH ── */
async function register() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showAuthMessage("Completa todos los campos", "error");
        return;
    }
    if (password.length < 4) {
        showAuthMessage("La contraseña debe tener al menos 4 caracteres", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            showToast("¡Cuenta creada! Ya puedes iniciar sesión", "success");
        } else {
            const data = await res.json();
            let errorMsg = "Error al registrar";
            if (typeof data.detail === "string") {
                errorMsg = data.detail;
            } else if (Array.isArray(data.detail)) {
                errorMsg = data.detail.map(e => e.msg || e.message).join(", ") || errorMsg;
            }
            showAuthMessage(errorMsg, "error");
        }
    } catch {
        showAuthMessage("No se pudo conectar con el servidor", "error");
    }
}

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showAuthMessage("Completa todos los campos", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            showAuthMessage("Credenciales incorrectas", "error");
            return;
        }

        const data = await res.json();
        userId = data.user_id;
        currentEmail = email;
        showToast(`Bienvenido, ${email}`, "success");
        showApp();
    } catch {
        showAuthMessage("No se pudo conectar con el servidor", "error");
    }
}

function logout() {
    showToast("Sesión cerrada", "success");
    userId = null;
    currentEmail = "";
    showAuth();
}

/* ── CATEGORY SELECTOR ── */
let currentCategory = "personal";

function selectCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll(".cat-card").forEach(c => { c.classList.remove("active"); c.style.transform = ""; });
    const activeCard = document.querySelector(`.cat-card[data-category="${cat}"]`);
    activeCard.classList.add("active");
    activeCard.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    activeCard.style.transform = "scale(1.05)";
    setTimeout(() => { activeCard.style.transform = "scale(1.02)"; }, 300);

    const locField = document.getElementById("locationField");
    const locLabel = document.getElementById("locationLabel");
    const locInput = document.getElementById("task_location");
    if (cat === "trabajo") {
        locField.style.display = "flex";
        locLabel.textContent = "Empresa / Proyecto";
        locInput.placeholder = "Ej: Acme Corp";
    } else if (cat === "hogar") {
        locField.style.display = "flex";
        locLabel.textContent = "Área / Habitación";
        locInput.placeholder = "Ej: Cocina";
    } else {
        locField.style.display = "none";
    }

    document.getElementById("studyFields").style.display = cat === "academico" ? "flex" : "none";

    if (["personal", "hogar", "trabajo", "academico"].includes(cat)) {
        currentFilter = cat;
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        const chip = document.querySelector(`.filter-chip[data-filter="${cat}"]`);
        if (chip) chip.classList.add("active");
        renderTasks();
    }
}

/* ── TASKS ── */
async function createTask() {
    if (!userId) {
        showTaskMessage("Debes iniciar sesión", "error");
        return;
    }

    const titleInput = document.getElementById("title");
    const descInput = document.getElementById("description");
    const priorityInput = document.getElementById("priority");
    const dueDateInput = document.getElementById("dueDate");
    const dateInput = document.getElementById("task_date");
    const timeInput = document.getElementById("task_time");
    const yearInput = document.getElementById("academic_year");
    const subjectInput = document.getElementById("task_subject");
    const teacherInput = document.getElementById("task_teacher");
    const locationInput = document.getElementById("task_location");

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const priority = priorityInput ? priorityInput.value : "media";
    const category = currentCategory;
    const due_date = dueDateInput && dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null;
    const task_date = dateInput ? dateInput.value : "";
    const task_time = timeInput ? timeInput.value : "";
    const academic_year = yearInput ? yearInput.value.trim() : "";
    const subject = subjectInput ? subjectInput.value.trim() : "";
    const teacher = teacherInput ? teacherInput.value.trim() : "";
    const location = locationInput ? locationInput.value.trim() : "";

    if (!title) {
        showTaskMessage("El título es obligatorio", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/api/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                title, 
                description, 
                priority,
                category,
                due_date,
                task_date,
                task_time,
                academic_year,
                subject,
                teacher,
                location,
                user_id: userId 
            })
        });

        if (res.ok) {
            titleInput.value = "";
            descInput.value = "";
            if (dueDateInput) dueDateInput.value = "";
            if (dateInput) dateInput.value = "";
            if (timeInput) timeInput.value = "";
            if (yearInput) yearInput.value = "";
            if (subjectInput) subjectInput.value = "";
            if (teacherInput) teacherInput.value = "";
            if (locationInput) locationInput.value = "";
            showToast("Tarea creada exitosamente", "success");
            loadTasks();
        } else {
            showTaskMessage("Error al crear la tarea", "error");
        }
    } catch {
        showTaskMessage("No se pudo conectar con el servidor", "error");
    }
}

async function toggleTask(id, newStatus, liEl) {
    if (liEl) {
        liEl.style.transition = "all 0.3s ease";
        if (newStatus === "completada") {
            liEl.classList.add("completing");
            liEl.style.transform = "scale(0.98)";
            liEl.style.opacity = "0.7";
        } else {
            liEl.style.transform = "scale(1.02)";
            liEl.style.opacity = "1";
        }
    }
    try {
        const res = await fetch(`${API}/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            showToast(newStatus === "completada" ? "✨ Tarea completada" : "↩ Tarea reabierta", "success");
            if (liEl) {
                setTimeout(() => { liEl.style.transform = ""; liEl.style.opacity = ""; }, 200);
            }
        }
    } catch {
        showTaskMessage("Error al actualizar", "error");
        if (liEl) { liEl.style.transform = ""; liEl.style.opacity = ""; }
    }
    loadTasks();
}

const CATEGORIES = ["personal", "hogar", "trabajo", "academico"];

async function updateTaskCategory(id, newCategory) {
    try {
        const res = await fetch(`${API}/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: newCategory })
        });
        if (res.ok) {
            showToast(`Categoría cambiada a ${newCategory}`, "success");
            loadTasks();
        }
    } catch {
        showTaskMessage("Error al cambiar categoría", "error");
    }
}

async function deleteTask(id, liEl) {
    if (liEl) {
        liEl.classList.add("removing");
        try { await fetch(`${API}/api/tasks/${id}`, { method: "DELETE" }); } catch {}
        setTimeout(() => {
            showToast("🗑 Tarea eliminada", "info");
            loadTasks();
        }, 300);
        return;
    }
    try {
        await fetch(`${API}/api/tasks/${id}`, { method: "DELETE" });
        showToast("🗑 Tarea eliminada", "info");
    } catch {
        showTaskMessage("Error al eliminar", "error");
    }
    loadTasks();
}

/* ── PROFILE ── */
async function toggleProfile() {
    const view = document.getElementById("profileView");
    if (!view.classList.contains("hidden")) {
        view.classList.add("hidden");
        return;
    }

    try {
        const res = await fetch(`${API}/api/profile/${userId}`);
        const data = await res.json();
        
        document.getElementById("profileEmail").textContent = data.correo || data.email;
        document.getElementById("profileTotal").textContent = data.stats.total;
        document.getElementById("profileCompleted").textContent = data.stats.completadas;
        document.getElementById("profilePending").textContent = data.stats.pendientes;
        
        view.classList.remove("hidden");
        view.scrollIntoView({ behavior: 'smooth' });
    } catch {
        showTaskMessage("No se pudo cargar el perfil", "error");
    }
}

/* ── STATS ── */
function updateStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completada").length;
    const pending = total - completed;
    
    animateNumber("totalTasks", total);
    animateNumber("completedTasks", completed);
    animateNumber("pendingTasks", pending);
    
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById("productivityRate").textContent = `${rate}%`;
    document.getElementById("productivityBar").style.width = `${rate}%`;
    
    const highPriority = tasks.filter(t => t.priority === "alta" && t.status !== "completada").length;
    document.getElementById("highPriorityCount").textContent = highPriority;
    
    const categories = new Set(tasks.map(t => t.category || "personal"));
    document.getElementById("categoryCount").textContent = categories.size;
}

function animateNumber(elId, target) {
    const el = document.getElementById(elId);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const duration = 400;
    const startTs = performance.now();

    function step(ts) {
        const progress = Math.min((ts - startTs) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* ── FILTERS ── */
function setupFilters() {
    const filterBar = document.getElementById("filterBar");
    filterBar.addEventListener("click", (e) => {
        if (e.target.classList.contains("filter-chip")) {
            const filter = e.target.dataset.filter;
            if (["personal", "hogar", "trabajo", "academico"].includes(filter)) {
                selectCategory(filter);
            } else {
                filterBar.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
                e.target.classList.add("active");
                currentFilter = filter;
                renderTasks();
            }
        }
    });
}

function getFilteredTasks() {
    if (currentFilter === "all") return allTasks;
    if (currentFilter === "pendiente") return allTasks.filter(t => t.status === "pendiente");
    if (currentFilter === "completada") return allTasks.filter(t => t.status === "completada");
    if (currentFilter === "alta") return allTasks.filter(t => t.priority === "alta");
    return allTasks.filter(t => t.category === currentFilter);
}

/* ── SUBTASKS ── */
async function addSubtask(taskId, inputEl) {
    const title = inputEl.value.trim();
    if (!title) return;
    try {
        await fetch(`${API}/api/subtasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, task_id: taskId })
        });
        inputEl.value = "";
        showToast("Subtarea añadida", "success");
        loadTasks();
    } catch {
        showTaskMessage("Error al añadir subtarea", "error");
    }
}

async function toggleSubtask(subtaskId, completed) {
    try {
        await fetch(`${API}/api/subtasks/${subtaskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed })
        });
        loadTasks();
    } catch {
        showTaskMessage("Error al actualizar subtarea", "error");
    }
}

async function deleteSubtask(subtaskId) {
    try {
        await fetch(`${API}/api/subtasks/${subtaskId}`, { method: "DELETE" });
        showToast("Subtarea eliminada", "success");
        loadTasks();
    } catch {
        showTaskMessage("Error al eliminar subtarea", "error");
    }
}

/* ── RENDER ── */
function renderTasks() {
    const list = document.getElementById("taskList");
    const filtered = getFilteredTasks();
    list.innerHTML = "";

    if (filtered.length === 0) {
        list.innerHTML = `
            <li class="empty-state">
                <span class="empty-icon">📋</span>
                <p>${currentFilter === "all" ? "Sin tareas aún" : "Sin resultados"}</p>
                <span class="empty-hint">${currentFilter === "all" ? "Crea tu primera tarea usando el formulario" : "Prueba con otro filtro"}</span>
            </li>`;
        return;
    }

    filtered.forEach((task, i) => {
        const li = renderTaskItem(task);
        li.style.animationDelay = `${i * 50}ms`;
        list.appendChild(li);
    });
}

async function loadTasks() {
    if (!userId) return;

    const list = document.getElementById("taskList");
    list.innerHTML = `
        <li style="padding:40px;text-align:center">
            <div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin:0 auto;">
                <div class="skeleton skeleton-line long"></div>
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line short"></div>
                <div class="skeleton skeleton-line long" style="margin-top:8px;"></div>
                <div class="skeleton skeleton-line"></div>
            </div>
        </li>`;

    try {
        const res = await fetch(`${API}/api/tasks/${userId}`);
        allTasks = await res.json();
        updateStats(allTasks);
        renderTasks();
        document.querySelectorAll(".stat-card").forEach(c => c.classList.add("stagger"));
    } catch {
        list.innerHTML = `<li class="empty-state"><span class="empty-icon">⚠️</span><p>Error al cargar tareas</p></li>`;
    }
}

function renderTaskItem(task) {
    const li = document.createElement("li");
    const isDone = task.status === 'completada';
    li.className = `task-item ${isDone ? 'completed' : ''}`;
    
    const nextStatus = isDone ? 'pendiente' : 'completada';
    const date = task.created_at ? new Date(task.created_at).toLocaleDateString() : '';
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : null;
    const category = task.category || "personal";
    
    const taskDateInfo = task.task_date ? `📅 ${task.task_date}` : '';
    const taskTimeInfo = task.task_time ? `🕐 ${task.task_time}` : '';
    const yearInfo = task.academic_year ? `📚 ${task.academic_year}` : '';
    const subjectInfo = task.subject ? `📖 ${task.subject}` : '';
    const teacherInfo = task.teacher ? `👨‍🏫 ${task.teacher}` : '';
    const locationInfo = task.location ? `📍 ${task.location}` : '';
    
    const subtasks = task.subtareas || [];
    const subtaskHtml = subtasks.map(st => `
        <li class="subtask-item" data-subtask-id="${st.id}">
            <input type="checkbox" class="subtask-checkbox" ${st.completed ? 'checked' : ''}>
            <span class="subtask-title ${st.completed ? 'done' : ''}">${escapeHtml(st.title)}</span>
            <button class="subtask-delete" title="Eliminar subtarea">✕</button>
        </li>
    `).join('');

    li.innerHTML = `
        <div class="priority-indicator priority-${task.priority || 'media'}"></div>
        <div class="task-check-wrap">
            <input type="checkbox" class="task-checkbox" ${isDone ? 'checked' : ''}>
        </div>
        <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-description">${escapeHtml(task.description || '')}</div>
            <div class="task-meta">
                <span class="category-badge category-${category}" style="cursor:pointer" title="Click para cambiar categoría">${category}</span>
                <span class="task-date" style="color:var(--lime);opacity:0.8;">${task.priority}</span>
                <span class="task-date">${date}</span>
                ${dueDate ? `<span class="task-date" style="color:var(--warning);">→ ${dueDate}</span>` : ''}
            </div>
            <div class="task-meta" style="margin-top:4px;">
                ${taskDateInfo ? `<span class="task-date" style="color:var(--text-dim);">${taskDateInfo}</span>` : ''}
                ${taskTimeInfo ? `<span class="task-date" style="color:var(--text-dim);">${taskTimeInfo}</span>` : ''}
                ${teacherInfo ? `<span class="task-date" style="color:var(--text-dim);">${teacherInfo}</span>` : ''}
                ${subjectInfo ? `<span class="task-date" style="color:var(--text-dim);">${subjectInfo}</span>` : ''}
                ${locationInfo ? `<span class="task-date" style="color:var(--text-dim);">${locationInfo}</span>` : ''}
                ${yearInfo ? `<span class="task-date" style="color:var(--text-dim);">${yearInfo}</span>` : ''}
            </div>
            <div class="subtask-section">
                <div class="subtask-header">Subtareas (${subtasks.filter(s => s.completed).length}/${subtasks.length})</div>
                <ul class="subtask-list">${subtaskHtml}</ul>
                <div class="subtask-add-form">
                    <input type="text" class="subtask-add-input" placeholder="Nueva subtarea..." maxlength="100">
                    <button class="subtask-add-btn">+</button>
                </div>
            </div>
        </div>
        <div class="task-actions">
            <button class="btn-task-action btn-task-toggle">${isDone ? 'Reabrir' : 'Completar'}</button>
            <button class="btn-task-action btn-delete">Borrar</button>
        </div>
    `;

    li.querySelector(".task-checkbox").onchange = () => toggleTask(task.id, nextStatus, li);
    li.querySelector(".btn-task-toggle").onclick = () => toggleTask(task.id, nextStatus, li);
    li.querySelector(".btn-delete").onclick = () => deleteTask(task.id, li);
    li.querySelector(".category-badge").onclick = () => {
        const idx = CATEGORIES.indexOf(task.category || "personal");
        const nextCat = CATEGORIES[(idx + 1) % CATEGORIES.length];
        updateTaskCategory(task.id, nextCat);
    };

    const addForm = li.querySelector(".subtask-add-form");
    const addInput = addForm.querySelector(".subtask-add-input");
    const addBtn = addForm.querySelector(".subtask-add-btn");
    addBtn.onclick = () => addSubtask(task.id, addInput);
    addInput.addEventListener("keydown", e => {
        if (e.key === "Enter") addSubtask(task.id, addInput);
    });

    li.querySelectorAll(".subtask-item").forEach(item => {
        const cb = item.querySelector(".subtask-checkbox");
        const stId = parseInt(item.dataset.subtaskId);
        cb.onchange = () => toggleSubtask(stId, cb.checked);
        item.querySelector(".subtask-delete").onclick = () => deleteSubtask(stId);
    });

    return li;
}

/* ── UTILS ── */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    setupFilters();
    selectCategory('personal');
    document.getElementById('password')?.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
    document.getElementById('title')?.addEventListener('keydown', e => { if (e.key === 'Enter') createTask(); });
    document.getElementById('task_subject')?.addEventListener('keydown', e => { if (e.key === 'Enter') createTask(); });
    document.getElementById('task_teacher')?.addEventListener('keydown', e => { if (e.key === 'Enter') createTask(); });
    document.getElementById('task_location')?.addEventListener('keydown', e => { if (e.key === 'Enter') createTask(); });
});