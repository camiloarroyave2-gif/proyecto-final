const API = "http://127.0.0.1:8000";
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
            showAuthMessage("Credenciales incorrectas", "error");
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

    const title       = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!title) {
        showTaskMessage("El título es obligatorio", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/api/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, user_id: userId })
        });

        if (res.ok) {
            document.getElementById("title").value       = "";
            document.getElementById("description").value = "";
            showTaskMessage("Tarea creada", "success");
            loadTasks();
        } else {
            showTaskMessage("Error al crear la tarea", "error");
        }
    } catch {
        showTaskMessage("No se pudo conectar con el servidor", "error");
    }
}

async function toggleTask(id, markComplete) {
    const newStatus = markComplete ? "completada" : "pendiente";

    try {
        const res = await fetch(`${API}/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            showTaskMessage(markComplete ? "Tarea completada ✓" : "Tarea reabierta", "success");
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

/* ── UTILS ── */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}