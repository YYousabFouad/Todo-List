document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------------------
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const dueDateInput = document.getElementById("due-date-input");
  const priorityInput = document.getElementById("priority-input");
  const taskList = document.getElementById("task-list");
  const itemsLeft = document.getElementById("items-left");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");

  const countAll = document.getElementById("count-all");
  const countActive = document.getElementById("count-active");
  const countCompleted = document.getElementById("count-completed");

  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressPercentage = document.getElementById("progress-percentage");
  const progressMotivation = document.getElementById("progress-motivation");

  const themeToggle = document.getElementById("theme-toggle");
  const headerDate = document.getElementById("header-date");
  const emptyState = document.getElementById("empty-state");
  const emptyTitle = document.getElementById("empty-title");
  const emptySubtitle = document.getElementById("empty-subtitle");

  // Edit Modal Elements
  const editModal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-form");
  const editTaskInput = document.getElementById("edit-task-input");
  const editPriorityInput = document.getElementById("edit-priority-input");
  const editDueDateInput = document.getElementById("edit-due-date-input");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  const confettiCanvas = document.getElementById("confetti-canvas");

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = "all";
  let searchQuery = "";
  let editingTaskId = null;

  // -------------------------------------------------------------------------
  // Theme Management
  // -------------------------------------------------------------------------
  const initTheme = () => {
    const savedTheme = localStorage.getItem("taskflow-theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const activeTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", activeTheme);
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("taskflow-theme", nextTheme);
  };

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
  initTheme();

  // -------------------------------------------------------------------------
  // Date & Header Helpers
  // -------------------------------------------------------------------------
  const updateHeaderDate = () => {
    if (!headerDate) return;
    const now = new Date();
    const options = { weekday: "short", month: "short", day: "numeric" };
    headerDate.textContent = now.toLocaleDateString(undefined, options);
  };
  updateHeaderDate();

  const getTodayISO = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Set default minimum date on date inputs to today
  if (dueDateInput) {
    dueDateInput.min = getTodayISO();
  }

  const formatDueDate = (dateStr) => {
    if (!dateStr) return { text: "Today", status: "today" };

    const todayStr = getTodayISO();
    if (dateStr === todayStr) {
      return { text: "Today", status: "today" };
    }

    const today = new Date(todayStr + "T00:00:00");
    const targetDate = new Date(dateStr + "T00:00:00");

    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Overdue", status: "overdue" };
    }
    if (diffDays === 1) {
      return { text: "Tomorrow", status: "tomorrow" };
    }

    return {
      text: targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      status: "upcoming",
    };
  };

  // -------------------------------------------------------------------------
  // Persistence & Storage
  // -------------------------------------------------------------------------
  const saveTasks = () => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  };

  const escapeHTML = (str) => {
    return String(str).replace(
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

  // -------------------------------------------------------------------------
  // Confetti Animation Engine
  // -------------------------------------------------------------------------
  let confettiParticles = [];
  let confettiAnimationId = null;

  const launchConfetti = () => {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext("2d");
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#3b82f6", "#f59e0b"];
    confettiParticles = [];

    for (let i = 0; i < 90; i++) {
      confettiParticles.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 160,
        y: window.innerHeight * 0.35,
        radius: Math.random() * 4 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: (Math.random() * 0.08) + 0.04,
        tiltAngle: 0,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() * -10) - 4,
        gravity: 0.35,
        decay: 0.98,
        opacity: 1,
      });
    }

    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
    }

    const renderConfetti = () => {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = false;

      confettiParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= p.decay;
        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        p.opacity -= 0.009;

        if (p.opacity > 0 && p.y < confettiCanvas.height) {
          alive = true;
          ctx.beginPath();
          ctx.lineWidth = p.radius;
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.moveTo(p.x + p.tilt + p.radius / 2, p.y);
          ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.radius / 2);
          ctx.stroke();
        }
      });

      if (alive) {
        confettiAnimationId = requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confettiAnimationId = null;
      }
    };

    renderConfetti();
  };

  // Resize listener for canvas
  window.addEventListener("resize", () => {
    if (confettiCanvas && confettiAnimationId) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  });

  // -------------------------------------------------------------------------
  // Statistics & Progress Calculations
  // -------------------------------------------------------------------------
  const updateStats = () => {
    const totalCount = tasks.length;
    const completedCount = tasks.filter((t) => t.completed).length;
    const activeCount = totalCount - completedCount;

    if (itemsLeft) {
      itemsLeft.textContent = `${activeCount} task${activeCount === 1 ? "" : "s"} left`;
    }

    if (countAll) countAll.textContent = totalCount;
    if (countActive) countActive.textContent = activeCount;
    if (countCompleted) countCompleted.textContent = completedCount;

    // Progress Bar
    const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
    if (progressPercentage) progressPercentage.textContent = `${percent}%`;

    // Motivational Message
    if (progressMotivation) {
      if (totalCount === 0) {
        progressMotivation.textContent = "No tasks yet • Add your goals to begin!";
      } else if (percent === 100) {
        progressMotivation.textContent = "Outstanding! You've crushed all tasks today! 🎉";
      } else if (percent >= 60) {
        progressMotivation.textContent = "More than halfway there! Keep the streak going 💪";
      } else if (percent > 0) {
        progressMotivation.textContent = "Great start! One step closer to finishing 🚀";
      } else {
        progressMotivation.textContent = "Ready to start? Pick your first task to complete!";
      }
    }
  };

  // -------------------------------------------------------------------------
  // Render Tasks
  // -------------------------------------------------------------------------
  const renderTasks = () => {
    taskList.innerHTML = "";

    // Filter by Tab & Search Query
    const filteredTasks = tasks.filter((task) => {
      const matchesFilter =
        currentFilter === "all"
          ? true
          : currentFilter === "active"
            ? !task.completed
            : task.completed;

      const matchesSearch = searchQuery
        ? task.text.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      return matchesFilter && matchesSearch;
    });

    // Handle Empty States
    if (filteredTasks.length === 0) {
      emptyState.style.display = "flex";
      if (tasks.length === 0) {
        emptyTitle.textContent = "No tasks yet";
        emptySubtitle.textContent = "Plan your day by adding your first task above.";
      } else if (searchQuery) {
        emptyTitle.textContent = "No matching tasks";
        emptySubtitle.textContent = `No tasks found matching "${searchQuery}".`;
      } else if (currentFilter === "active") {
        emptyTitle.textContent = "All caught up! 🎉";
        emptySubtitle.textContent = "You don't have any pending tasks right now. Great job!";
      } else if (currentFilter === "completed") {
        emptyTitle.textContent = "No completed tasks";
        emptySubtitle.textContent = "Check off tasks as you finish them to see them here.";
      }
    } else {
      emptyState.style.display = "none";
    }

    filteredTasks.forEach((task) => {
      const li = document.createElement("li");
      const priority = task.priority || "medium";
      li.className = `task-item priority-${priority} ${task.completed ? "task-completed" : ""}`;
      li.setAttribute("data-id", task.id);

      const dueInfo = formatDueDate(task.dueDate);

      const priorityLabel =
        priority === "high" ? "High" : priority === "low" ? "Low" : "Normal";

      li.innerHTML = `
        <div class="task-content ${task.completed ? "completed" : ""}">
          <label class="custom-checkbox-wrapper" title="${task.completed ? "Mark active" : "Mark completed"}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
            <span class="checkbox-visual">
              <svg viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </label>
          <div class="task-details">
            <span class="task-text">${escapeHTML(task.text)}</span>
            <div class="task-meta-badges">
              <span class="priority-badge ${priority}">${priorityLabel}</span>
              <span class="due-badge ${dueInfo.status}">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${dueInfo.text}
              </span>
            </div>
          </div>
        </div>
        <div class="task-actions">
          <button class="action-btn edit-btn" data-id="${task.id}" title="Edit task" aria-label="Edit task">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete-btn" data-id="${task.id}" title="Delete task" aria-label="Delete task">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      taskList.appendChild(li);
    });

    updateStats();
  };

  // -------------------------------------------------------------------------
  // Task Actions
  // -------------------------------------------------------------------------
  const addTask = (text, dueDate, priority = "medium") => {
    const newTask = {
      id: Date.now().toString(),
      text: text.trim(),
      dueDate: dueDate || getTodayISO(),
      priority: priority || "medium",
      completed: false,
      createdAt: Date.now(),
    };
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
  };

  const toggleTask = (id) => {
    let justCompletedAll = false;
    tasks = tasks.map((task) => {
      if (task.id === id) {
        const nextState = !task.completed;
        if (nextState) {
          // Check if all tasks will now be completed
          const remaining = tasks.filter((t) => t.id !== id && !t.completed).length;
          if (remaining === 0) {
            justCompletedAll = true;
          }
        }
        return { ...task, completed: nextState };
      }
      return task;
    });

    saveTasks();
    renderTasks();

    if (justCompletedAll) {
      launchConfetti();
    }
  };

  const deleteTask = (id) => {
    const itemEl = document.querySelector(`.task-item[data-id="${id}"]`);
    if (itemEl) {
      itemEl.classList.add("removing");
      setTimeout(() => {
        tasks = tasks.filter((task) => task.id !== id);
        saveTasks();
        renderTasks();
      }, 240);
    } else {
      tasks = tasks.filter((task) => task.id !== id);
      saveTasks();
      renderTasks();
    }
  };

  // -------------------------------------------------------------------------
  // Edit Modal Handling
  // -------------------------------------------------------------------------
  const openEditModal = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    editingTaskId = id;
    editTaskInput.value = task.text;
    editPriorityInput.value = task.priority || "medium";
    editDueDateInput.value = task.dueDate || "";
    editModal.style.display = "flex";
    editTaskInput.focus();
  };

  const closeEditModal = () => {
    editingTaskId = null;
    editModal.style.display = "none";
  };

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!editingTaskId) return;

    const newText = editTaskInput.value.trim();
    if (!newText) return;

    tasks = tasks.map((task) => {
      if (task.id === editingTaskId) {
        return {
          ...task,
          text: newText,
          priority: editPriorityInput.value,
          dueDate: editDueDateInput.value || getTodayISO(),
        };
      }
      return task;
    });

    saveTasks();
    renderTasks();
    closeEditModal();
  });

  closeModalBtn.addEventListener("click", closeEditModal);
  cancelEditBtn.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // -------------------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------------------
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;

    if (text) {
      addTask(text, dueDate, priority);
      taskInput.value = "";
      dueDateInput.value = "";
      priorityInput.value = "medium";
      taskInput.focus();
    }
  });

  taskList.addEventListener("click", (e) => {
    const target = e.target;

    // Delete Button clicked
    const deleteBtn = target.closest(".delete-btn");
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.getAttribute("data-id");
      deleteTask(id);
      return;
    }

    // Edit Button clicked
    const editBtn = target.closest(".edit-btn");
    if (editBtn) {
      e.stopPropagation();
      const id = editBtn.getAttribute("data-id");
      openEditModal(id);
      return;
    }

    // Checkbox or Task text clicked to toggle completion
    const checkboxWrapper = target.closest(".custom-checkbox-wrapper");
    const taskItem = target.closest(".task-item");

    if (checkboxWrapper || target.closest(".task-text")) {
      if (taskItem) {
        const id = taskItem.getAttribute("data-id");
        toggleTask(id);
      }
    }
  });

  // Filter Buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter");
      renderTasks();
    });
  });

  // Search Input
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    clearSearchBtn.style.display = searchQuery ? "block" : "none";
    renderTasks();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.style.display = "none";
    searchInput.focus();
    renderTasks();
  });

  // Clear Completed
  clearCompletedBtn.addEventListener("click", () => {
    const completedTasks = tasks.filter((task) => task.completed);
    if (completedTasks.length === 0) return;

    // Animate removal of completed tasks
    completedTasks.forEach((task) => {
      const itemEl = document.querySelector(`.task-item[data-id="${task.id}"]`);
      if (itemEl) itemEl.classList.add("removing");
    });

    setTimeout(() => {
      tasks = tasks.filter((task) => !task.completed);
      saveTasks();
      renderTasks();
    }, 240);
  });

  // Keyboard Shortcuts: '/' to search, 'Escape' to blur or close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (editModal.style.display === "flex") {
        closeEditModal();
      } else if (document.activeElement === searchInput) {
        searchInput.blur();
      }
    } else if (
      e.key === "/" &&
      document.activeElement !== taskInput &&
      document.activeElement !== searchInput &&
      editModal.style.display !== "flex"
    ) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // -------------------------------------------------------------------------
  // Initial Render
  // -------------------------------------------------------------------------
  renderTasks();
});
