// Si el frontend se sirve desde el mismo servidor que el backend, la API puede ser relativa
const API = ""; // Al usar app.mount y FileResponse, podemos usar rutas relativas
let userId = null;
let currentEmail = "";

/* ── MENSAJES ── */
function showAuthMessage(text, type = "error") {
    const el = document.getElementById("authMessage");
    el.textContent = text;
    el.className = `message ${type}`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add("hidden"), 4000);
}

function showTaskMessage(text, type = "error") {
    const el = document.getElementById("taskMessage");
    el.textContent = text;
    el.className = `message ${type}`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add("hidden"), 3000);
}

/* ── NAVEGACIÓN ── */
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
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showAuthMessage("Completa todos los campos", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            showAuthMessage("¡Cuenta creada! Ya puedes iniciar sesión", "success");
        } else {
            showAuthMessage("Error al registrar. El email podría estar en uso.", "error");
        }
    } catch {
        showAuthMessage("No se pudo conectar con el servidor", "error");
    }
}

async function login() {
    const email    = document.getElementById("email").value.trim();
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
            showAuthMessage("Credenciales incorrectas. Prueba con la contraseña '1234'", "error");
            return;
        }

        const data = await res.json();
        userId       = data.user_id;
        currentEmail = email;
        showApp();
    } catch {
        showAuthMessage("No se pudo conectar con el servidor", "error");
    }
}

function logout() {
    userId       = null;
    currentEmail = "";
    showAuth();
}

/* ── TAREAS ── */
async function createTask() {
    if (!userId) {
        showTaskMessage("Debes iniciar sesión", "error");
        return;
    }

    const titleInput = document.getElementById("title");
    const descInput  = document.getElementById("description");
    const priorityInput = document.getElementById("priority");
    const teacherInput = document.getElementById("teacher");
    const dateInput = document.getElementById("task_date");
    const timeInput = document.getElementById("task_time");
    const yearInput = document.getElementById("academic_year");

    const title       = titleInput.value.trim();
    const description = descInput.value.trim();
    const priority    = priorityInput ? priorityInput.value : "media";
    const teacher     = teacherInput ? teacherInput.value.trim() : "";
    const task_date   = dateInput ? dateInput.value : "";
    const task_time   = timeInput ? timeInput.value : "";
    const academic_year = yearInput ? yearInput.value.trim() : "";

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
                teacher,
                task_date,
                task_time,
                academic_year,
                user_id: userId 
            })
        });

        if (res.ok) {
            titleInput.value = "";
            descInput.value = "";
            if (teacherInput) teacherInput.value = "";
            if (dateInput) dateInput.value = "";
            if (timeInput) timeInput.value = "";
            if (yearInput) yearInput.value = "";
            showTaskMessage("Tarea creada", "success");
            loadTasks();
        } else {
            showTaskMessage("Error al crear la tarea", "error");
        }
    } catch {
        showTaskMessage("No se pudo conectar con el servidor", "error");
    }
}

// Completa o reabre una tarea según el estado deseado
async function toggleTask(id, newStatus) {
    try {
        const res = await fetch(`${API}/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            showTaskMessage(newStatus === "completada" ? "Tarea completada ✓" : "Tarea reabierta", "success");
        } else {
            showTaskMessage("Error al actualizar la tarea", "error");
        }
    } catch {
        showTaskMessage("No se pudo conectar con el servidor", "error");
    }

    loadTasks();
}

async function deleteTask(id) {
    if (!confirm("¿Eliminar esta tarea?")) return;

    try {
        await fetch(`${API}/api/tasks/${id}`, { method: "DELETE" });
        showTaskMessage("Tarea eliminada", "success");
    } catch {
        showTaskMessage("No se pudo conectar con el servidor", "error");
    }

    loadTasks();
}

/* ── PERFIL ── */
async function toggleProfile() {
    const view = document.getElementById("profileView");
    if (!view.classList.contains("hidden")) {
        view.classList.add("hidden");
        return;
    }

    try {
        const res = await fetch(`${API}/api/profile/${userId}`);
        const data = await res.json();
        
        document.getElementById("profileEmail").textContent = data.email;
        document.getElementById("profileStatus").textContent = 
            `Has completado ${data.stats.completadas} de ${data.stats.total} tareas totales.`;
        
        view.classList.remove("hidden");
        view.scrollIntoView({ behavior: 'smooth' });
    } catch {
        showTaskMessage("No se pudo cargar el perfil", "error");
    }
}

/* ── STATS ── */
function updateStats(tasks) {
    const total     = tasks.length;
    const completed = tasks.filter(t => t.status === "completada").length;
    const pending   = total - completed;

    animateNumber("totalTasks",     total);
    animateNumber("completedTasks", completed);
    animateNumber("pendingTasks",   pending);
}

// Anima un número de 0 al valor destino
function animateNumber(elId, target) {
    const el = document.getElementById(elId);
    if (!el) return;

    const start    = parseInt(el.textContent) || 0;
    const duration = 400;
    const startTs  = performance.now();

    function step(ts) {
        const progress = Math.min((ts - startTs) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);         // ease-out-cubic
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

/* ── RENDER LISTA ── */
async function loadTasks() {
    if (!userId) return;

    const list = document.getElementById("taskList");
    list.innerHTML = `
        <li style="padding:40px;text-align:center">
            <div class="loading-dots">
                <span></span><span></span><span></span>
            </div>
        </li>
    `;

    try {
        const res   = await fetch(`${API}/api/tasks/${userId}`);
        const tasks = await res.json();

        list.innerHTML = "";
        updateStats(tasks);

        if (tasks.length === 0) {
            list.innerHTML = `
                <li class="empty-state">
                    <span class="empty-icon">📋</span>
                    <p>Sin tareas aún</p>
                    <span class="empty-hint">Crea tu primera tarea usando el formulario de arriba</span>
                </li>
            `;
            return;
        }

        tasks.forEach((task, i) => {
            // Normaliza el objeto para que renderTaskItem lo entienda
            const normalized = {
                ...task,
                completed: task.status === "completada"
            };
            const li = renderTaskItem(normalized);

            // Escalonamos la animación de entrada
            li.style.animationDelay = `${i * 50}ms`;
            list.appendChild(li);
        });

    } catch {
        list.innerHTML = `
            <li class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>Error al cargar tareas</p>
                <span class="empty-hint">Revisa que el servidor esté corriendo</span>
            </li>
        `;
    }
}

function renderTaskItem(task) {
    const li = document.createElement("li");
    const isDone = task.status === 'completada';
    li.className = `task-item ${isDone ? 'completed' : ''}`;
    
    const priorityClass = `priority-${task.priority || 'media'}`;
    const nextStatus = isDone ? 'pendiente' : 'completada';
    const date = task.created_at ? new Date(task.created_at).toLocaleDateString() : '';
    
    const teacherInfo = task.teacher ? `👨‍🏫 ${escapeHtml(task.teacher)}` : '';
    const taskDateInfo = task.task_date ? `📅 ${task.task_date}` : '';
    const taskTimeInfo = task.task_time ? `🕐 ${task.task_time}` : '';
    const yearInfo = task.academic_year ? `📚 ${task.academic_year}` : '';
    
    li.innerHTML = `
        <div class="task-check-wrap">
            <input type="checkbox" class="task-checkbox" ${isDone ? 'checked' : ''}>
        </div>
        <div class="task-content">
            <div class="task-title" style="${isDone ? 'text-decoration:line-through' : ''}">${escapeHtml(task.title)}</div>
            <div class="task-description">${escapeHtml(task.description || '')}</div>
            <div class="task-meta">
                <span class="task-status-dot ${isDone ? 'done' : ''}"></span>
                <span class="task-date" style="text-transform:uppercase; font-size:10px; color:var(--lime); opacity:0.8;">${task.priority}</span>
                <span class="task-date">${date}</span>
            </div>
            <div class="task-meta" style="margin-top:4px;">
                ${teacherInfo ? `<span class="task-date" style="color:var(--text-dim);">${teacherInfo}</span>` : ''}
                ${taskDateInfo ? `<span class="task-date" style="color:var(--text-dim);">${taskDateInfo}</span>` : ''}
                ${taskTimeInfo ? `<span class="task-date" style="color:var(--text-dim);">${taskTimeInfo}</span>` : ''}
                ${yearInfo ? `<span class="task-date" style="color:var(--text-dim);">${yearInfo}</span>` : ''}
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

/* ── INICIALIZACIÓN ── */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('password')?.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
    document.getElementById('title')?.addEventListener('keydown', e => { if (e.key === 'Enter') createTask(); });
});

/* ── UTILS ── */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}