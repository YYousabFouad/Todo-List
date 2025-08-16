const todoListObject = [];
const doneTasks = [];

function addTodo() {
  const inputElement = document.querySelector('.todo-space');
  const name = inputElement.value;

  // Check if the name is empty
  if (!name.trim()) {
    alert('Please enter a todo name');
    return; // Exit the function if empty
  }

  const dateElement = document.querySelector('.js-due-date');
  let dueDate = dateElement.value;
  if (dueDate === '') {
    dueDate = new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' });
  }

  todoListObject.push({ name, dueDate });
  inputElement.value = '';
  dateElement.value = '';
  renderTodoList();
}

function renderTodoList() {
  let todoListHTML = '';
  for (let i = 0; i < todoListObject.length; i++) {
    const todos = todoListObject[i];
    const { name, dueDate } = todos;
    const checkboxId = `todo-${i}`;

    const html = `
      <div>
        <input type="checkbox" id="${checkboxId}" onchange="taskChecked(${i})" />
        <label for="${checkboxId}" id="label-${i}">${name}</label>
      </div>
      <div>${dueDate}</div>
      <button onclick=" 
        todoListObject.splice(${i},1);
        renderTodoList();
      " class="delete-todo-button">Delete</button>
    `;
    todoListHTML += html;
  }
  document.querySelector('.js-todo-list').innerHTML = todoListHTML;
}

function renderDoneList() {
  let doneListHTML = '<h3>Tasks I Have Done</h3> <hr> <br>';
  for (let i = 0; i < doneTasks.length; i++) {
    const { name, dueDate } = doneTasks[i];
    doneListHTML += `
    
      <div>
        <label style="text-decoration: line-through;">${name}</label>
      </div>
      <div>${dueDate}</div>
      <br>
    `;
  }
  document.querySelector('.js-done-list').innerHTML = doneListHTML;
}

function checkKey(event) {
  if (event.key === 'Enter') {
    addTodo();
  }
}

function taskChecked(index) {
  const checkbox = document.getElementById(`todo-${index}`);
  if (checkbox.checked) {
    const task = todoListObject.splice(index, 1)[0];
    doneTasks.push(task);
    renderTodoList();
    renderDoneList();
  }
}
