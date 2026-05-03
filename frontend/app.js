const API = "";
let userId = null;
let currentEmail = "";
let currentFilter = "all";
let allTasks = [];

/* ── TOAST NOTIFICATIONS ── */
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === "success" ? "✓" : "✕"}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("toast-out");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");
    document.getElementById("userStatus").classList.remove("hidden");
    document.getElementById("userEmail").textContent = currentEmail;
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

/* ── TASKS ── */
async function createTask() {
    if (!userId) {
        showTaskMessage("Debes iniciar sesión", "error");
        return;
    }

    const titleInput = document.getElementById("title");
    const descInput = document.getElementById("description");
    const priorityInput = document.getElementById("priority");
    const categoryInput = document.getElementById("category");
    const dueDateInput = document.getElementById("dueDate");

    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const priority = priorityInput.value;
    const category = categoryInput.value;
    const due_date = dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null;

    if (!title) {
        showTaskMessage("El título es obligatorio", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/api/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, priority, category, due_date, user_id: userId })
        });

        if (res.ok) {
            titleInput.value = "";
            descInput.value = "";
            dueDateInput.value = "";
            showToast("Tarea creada exitosamente", "success");
            loadTasks();
        } else {
            showTaskMessage("Error al crear la tarea", "error");
        }
    } catch {
        showTaskMessage("No se pudo conectar con el servidor", "error");
    }
}

async function toggleTask(id, newStatus) {
    try {
        const res = await fetch(`${API}/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            showToast(newStatus === "completada" ? "Tarea completada" : "Tarea reabierta", "success");
        }
    } catch {
        showTaskMessage("Error al actualizar", "error");
    }
    loadTasks();
}

async function deleteTask(id) {
    try {
        await fetch(`${API}/api/tasks/${id}`, { method: "DELETE" });
        showToast("Tarea eliminada", "success");
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
    
    const categories = new Set(tasks.map(t => t.category || "general"));
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
            filterBar.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
            e.target.classList.add("active");
            currentFilter = e.target.dataset.filter;
            renderTasks();
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
    list.innerHTML = `<li style="padding:40px;text-align:center"><div class="loading-dots"><span></span><span></span><span></span></div></li>`;

    try {
        const res = await fetch(`${API}/api/tasks/${userId}`);
        allTasks = await res.json();
        updateStats(allTasks);
        renderTasks();
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
    const category = task.category || "general";
    
    li.innerHTML = `
        <div class="priority-indicator priority-${task.priority || 'media'}"></div>
        <div class="task-check-wrap">
            <input type="checkbox" class="task-checkbox" ${isDone ? 'checked' : ''}>
        </div>
        <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-description">${escapeHtml(task.description || '')}</div>
            <div class="task-meta">
                <span class="category-badge category-${category}">${category}</span>
                <span class="task-date" style="color:var(--lime);opacity:0.8;">${task.priority}</span>
                <span class="task-date">${date}</span>
                ${dueDate ? `<span class="task-date" style="color:var(--warning);">→ ${dueDate}</span>` : ''}
            </div>
        </div>
        <div class="task-actions">
            <button class="btn-task-action btn-task-toggle">${isDone ? 'Reabrir' : 'Completar'}</button>
            <button class="btn-task-action btn-delete">Borrar</button>
        </div>
    `;

    li.querySelector(".task-checkbox").onchange = () => toggleTask(task.id, nextStatus);
    li.querySelector(".btn-task-toggle").onclick = () => toggleTask(task.id, nextStatus);
    li.querySelector(".btn-delete").onclick = () => deleteTask(task.id);

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
    document.getElementById('password')?.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
    document.getElementById('title')?.addEventListener('keydown', e => { if (e.key === 'Enter') createTask(); });
});
