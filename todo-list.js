document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const dueDateInput = document.getElementById("due-date-input");
  const taskList = document.getElementById("task-list");
  const itemsLeft = document.getElementById("items-left");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const filterBtns = document.querySelectorAll(".filter-btn");

  // State
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = "all";

  // Helper function to format ISO date (YYYY-MM-DD) string to Today / Tomorrow / Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr === todayStr) return "Today";

    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Helper to get Today's Date formatted as YYYY-MM-DD
  const getTodayISO = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Functions
  const saveTasks = () => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  };

  const updateStats = () => {
    const activeCount = tasks.filter((task) => !task.completed).length;
    itemsLeft.textContent = `${activeCount} task${activeCount === 1 ? "" : "s"} left`;
  };

  const renderTasks = () => {
    taskList.innerHTML = "";

    const filteredTasks = tasks.filter((task) => {
      if (currentFilter === "active") return !task.completed;
      if (currentFilter === "completed") return task.completed;
      return true;
    });

    filteredTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";

      const dueDateText = formatDate(task.dueDate || getTodayISO());

      li.innerHTML = `
                <div class="task-content ${task.completed ? "completed" : ""}" data-id="${task.id}">
                    <input type="checkbox" ${task.completed ? "checked" : ""}>
                    <div class="task-details">
                        <span class="task-text">${escapeHTML(task.text)}</span>
                        <span class="due-badge">📅 ${dueDateText}</span>
                    </div>
                </div>
                <button class="delete-btn" data-id="${task.id}">✕</button>
            `;

      taskList.appendChild(li);
    });

    updateStats();
  };

  const escapeHTML = (str) => {
    return str.replace(
      /[&<>'"]/g,
      (tag) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[tag] || tag,
    );
  };

  // 4. Fallback to Today if no due date is chosen
  const addTask = (text, dueDate) => {
    const newTask = {
      id: Date.now().toString(),
      text: text,
      dueDate: dueDate || getTodayISO(),
      completed: false,
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
  };

  const toggleTask = (id) => {
    tasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    );
    saveTasks();
    renderTasks();
  };

  const deleteTask = (id) => {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    renderTasks();
  };

  // Event Listeners
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const dueDate = dueDateInput.value;

    if (text) {
      addTask(text, dueDate);
      taskInput.value = "";
      dueDateInput.value = "";
    }
  });

  taskList.addEventListener("click", (e) => {
    const target = e.target;

    if (target.classList.contains("delete-btn")) {
      const id = target.getAttribute("data-id");
      deleteTask(id);
    } else if (target.closest(".task-content")) {
      const id = target.closest(".task-content").getAttribute("data-id");
      toggleTask(id);
    }
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter");
      renderTasks();
    });
  });

  clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
  });

  // Initial Render
  renderTasks();
});
