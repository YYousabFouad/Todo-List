const todoListObject = [
  {
    name: 'Your To DO',
    dueDate: 'Due Date',
  },
];
todoListObject.splice(0, 1);
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
    const html = `<div>${name}</div>
   <div> ${dueDate}</div>
    <button onclick=" 
    todoListObject.splice(${i},1);
    renderTodoList();
  " class="delete-todo-button">Delete</button>
    `;
    todoListHTML += html;
  }
  document.querySelector('.js-todo-list').innerHTML = todoListHTML;
}

function checkKey(event) {
  if (event.key === 'Enter') {
    addTodo();
  }
}
