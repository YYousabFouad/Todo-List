document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------------------------------------------
  // Constants & Storage Keys
  // -------------------------------------------------------------------------
  const STORAGE_KEYS = {
    TASKS: "tasks",
    THEME: "taskflow-theme",
  };

  const PRIORITY_LABELS = {
    high: "High",
    medium: "Normal",
    low: "Low",
  };

  const CONFETTI_COLORS = ["#2b50ed", "#7928ca", "#f72585", "#00c48c", "#fa8c16", "#00b4d8"];

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
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [];
  let currentFilter = "all";
  let searchQuery = "";
  let editingTaskId = null;

  // -------------------------------------------------------------------------
  // Theme Management (DRY: centralized theme setter)
  // -------------------------------------------------------------------------
  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  };

  const initTheme = () => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(saved || (systemPrefersDark ? "dark" : "light"));
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  };

  themeToggle?.addEventListener("click", toggleTheme);
  initTheme();

  // -------------------------------------------------------------------------
  // Date Helpers (DRY & local timezone-safe)
  // -------------------------------------------------------------------------
  const updateHeaderDate = () => {
    if (!headerDate) return;
    const now = new Date();
    headerDate.textContent = now.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };
  updateHeaderDate();

  const getTodayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (dueDateInput) {
    dueDateInput.min = getTodayISO();
  }

  const formatDueDate = (dateStr) => {
    const todayStr = getTodayISO();
    if (!dateStr || dateStr === todayStr) {
      return { text: "Today", status: "today" };
    }

    const today = new Date(todayStr + "T00:00:00");
    const targetDate = new Date(dateStr + "T00:00:00");
    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", status: "overdue" };
    if (diffDays === 1) return { text: "Tomorrow", status: "tomorrow" };

    return {
      text: targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      status: "upcoming",
    };
  };

  // -------------------------------------------------------------------------
  // Persistence & State Mutator (DRY: atomic state & persistence synchronization)
  // -------------------------------------------------------------------------
  const commitTasks = (updater) => {
    tasks = typeof updater === "function" ? updater(tasks) : updater;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    renderTasks();
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
  // Confetti Animation Engine (DRY: centralized canvas sizing)
  // -------------------------------------------------------------------------
  let confettiParticles = [];
  let confettiAnimationId = null;

  const resizeConfetti = () => {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  };

  const launchConfetti = () => {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext("2d");
    resizeConfetti();

    confettiParticles = [];

    for (let i = 0; i < 90; i++) {
      confettiParticles.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 160,
        y: window.innerHeight * 0.35,
        radius: Math.random() * 4 + 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.08 + 0.04,
        tiltAngle: 0,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -10 - 4,
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

  window.addEventListener("resize", () => {
    if (confettiAnimationId) resizeConfetti();
  });

  // -------------------------------------------------------------------------
  // Statistics & Motivational Messaging
  // -------------------------------------------------------------------------
  const getMotivationalMessage = (totalCount, percent) => {
    if (totalCount === 0) return "No tasks yet • Add your goals to begin!";
    if (percent === 100) return "Outstanding! You've crushed all tasks today! 🎉";
    if (percent >= 60) return "More than halfway there! Keep the streak going 💪";
    if (percent > 0) return "Great start! One step closer to finishing 🚀";
    return "Ready to start? Pick your first task to complete!";
  };

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

    if (progressMotivation) {
      progressMotivation.textContent = getMotivationalMessage(totalCount, percent);
    }
  };

  // -------------------------------------------------------------------------
  // Empty State Resolver (DRY: declarative config mapping)
  // -------------------------------------------------------------------------
  const getEmptyStateConfig = () => {
    if (tasks.length === 0) {
      return {
        title: "No tasks yet",
        subtitle: "Plan your day by adding your first task above.",
      };
    }
    if (searchQuery) {
      return {
        title: "No matching tasks",
        subtitle: `No tasks found matching "${searchQuery}".`,
      };
    }
    if (currentFilter === "active") {
      return {
        title: "All caught up! 🎉",
        subtitle: "You don't have any pending tasks right now. Great job!",
      };
    }
    return {
      title: "No completed tasks",
      subtitle: "Check off tasks as you finish them to see them here.",
    };
  };

  // -------------------------------------------------------------------------
  // Render Tasks
  // -------------------------------------------------------------------------
  const renderTasks = () => {
    taskList.innerHTML = "";

    // Filter by Tab & Search Query
    const normalizedSearch = searchQuery.toLowerCase();
    const filteredTasks = tasks.filter((task) => {
      const matchesFilter =
        currentFilter === "all" ||
        (currentFilter === "active" ? !task.completed : task.completed);

      const matchesSearch =
        !normalizedSearch || task.text.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });

    const hasTasks = filteredTasks.length > 0;
    emptyState.style.display = hasTasks ? "none" : "flex";

    if (!hasTasks) {
      const { title, subtitle } = getEmptyStateConfig();
      emptyTitle.textContent = title;
      emptySubtitle.textContent = subtitle;
    } else {
      filteredTasks.forEach((task) => {
        const li = document.createElement("li");
        const priority = task.priority || "medium";
        li.className = `task-item priority-${priority} ${task.completed ? "task-completed" : ""}`;
        li.setAttribute("data-id", task.id);

        const dueInfo = formatDueDate(task.dueDate);
        const priorityLabel = PRIORITY_LABELS[priority] || "Normal";

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
    }

    updateStats();
  };

  // -------------------------------------------------------------------------
  // Task Actions & Removal Animation (DRY: unified animated element removal)
  // -------------------------------------------------------------------------
  const animateAndRemoveTasks = (taskIds, onComplete) => {
    const ids = Array.isArray(taskIds) ? taskIds : [taskIds];
    let hasAnimated = false;

    ids.forEach((id) => {
      const itemEl = document.querySelector(`.task-item[data-id="${id}"]`);
      if (itemEl) {
        itemEl.classList.add("removing");
        hasAnimated = true;
      }
    });

    if (hasAnimated) {
      setTimeout(onComplete, 240);
    } else {
      onComplete();
    }
  };

  const addTask = (text, dueDate, priority = "medium") => {
    const newTask = {
      id: Date.now().toString(),
      text: text.trim(),
      dueDate: dueDate || getTodayISO(),
      priority: priority || "medium",
      completed: false,
      createdAt: Date.now(),
    };
    commitTasks((prev) => [newTask, ...prev]);
  };

  const toggleTask = (id) => {
    let justCompletedAll = false;

    commitTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const nextState = !task.completed;
          if (nextState) {
            const remaining = prev.filter((t) => t.id !== id && !t.completed).length;
            if (remaining === 0) justCompletedAll = true;
          }
          return { ...task, completed: nextState };
        }
        return task;
      }),
    );

    if (justCompletedAll) {
      launchConfetti();
    }
  };

  const deleteTask = (id) => {
    animateAndRemoveTasks(id, () => {
      commitTasks((prev) => prev.filter((task) => task.id !== id));
    });
  };

  // -------------------------------------------------------------------------
  // Edit Modal Handling (DRY: centralized visibility & form binding)
  // -------------------------------------------------------------------------
  const isModalOpen = () => editModal.style.display === "flex";

  const setModalVisibility = (isOpen, taskId = null) => {
    editingTaskId = taskId;
    editModal.style.display = isOpen ? "flex" : "none";
  };

  const openEditModal = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    setModalVisibility(true, id);
    editTaskInput.value = task.text;
    editPriorityInput.value = task.priority || "medium";
    editDueDateInput.value = task.dueDate || "";
    editTaskInput.focus();
  };

  const closeEditModal = () => setModalVisibility(false);

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!editingTaskId) return;

    const newText = editTaskInput.value.trim();
    if (!newText) return;

    commitTasks((prev) =>
      prev.map((task) => {
        if (task.id === editingTaskId) {
          return {
            ...task,
            text: newText,
            priority: editPriorityInput.value,
            dueDate: editDueDateInput.value || getTodayISO(),
          };
        }
        return task;
      }),
    );

    closeEditModal();
  });

  [closeModalBtn, cancelEditBtn].forEach((btn) =>
    btn?.addEventListener("click", closeEditModal),
  );

  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEditModal();
  });

  // -------------------------------------------------------------------------
  // Event Listeners & Search Handling (DRY: unified search updater)
  // -------------------------------------------------------------------------
  const updateSearch = (query, focus = false) => {
    searchQuery = query.trim();
    searchInput.value = searchQuery;
    clearSearchBtn.style.display = searchQuery ? "block" : "none";
    if (focus) searchInput.focus();
    renderTasks();
  };

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    addTask(text, dueDateInput.value, priorityInput.value);
    taskForm.reset();
    priorityInput.value = "medium";
    taskInput.focus();
  });

  taskList.addEventListener("click", (e) => {
    const target = e.target;

    const deleteBtn = target.closest(".delete-btn");
    if (deleteBtn) {
      e.stopPropagation();
      deleteTask(deleteBtn.getAttribute("data-id"));
      return;
    }

    const editBtn = target.closest(".edit-btn");
    if (editBtn) {
      e.stopPropagation();
      openEditModal(editBtn.getAttribute("data-id"));
      return;
    }

    const checkboxWrapper = target.closest(".custom-checkbox-wrapper");
    const taskText = target.closest(".task-text");
    if (checkboxWrapper || taskText) {
      const taskItem = target.closest(".task-item");
      if (taskItem) {
        toggleTask(taskItem.getAttribute("data-id"));
      }
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

  searchInput.addEventListener("input", (e) => updateSearch(e.target.value));
  clearSearchBtn.addEventListener("click", () => updateSearch("", true));

  clearCompletedBtn.addEventListener("click", () => {
    const completedIds = tasks.filter((t) => t.completed).map((t) => t.id);
    if (completedIds.length === 0) return;

    animateAndRemoveTasks(completedIds, () => {
      commitTasks((prev) => prev.filter((task) => !task.completed));
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (isModalOpen()) {
        closeEditModal();
      } else if (document.activeElement === searchInput) {
        searchInput.blur();
      }
    } else if (
      e.key === "/" &&
      !isModalOpen() &&
      document.activeElement !== taskInput &&
      document.activeElement !== searchInput
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
