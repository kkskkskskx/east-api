let todos = JSON.parse(localStorage.getItem('todos')) || [];
let themes = [];
let currentTheme = localStorage.getItem('currentTheme') || 'midnight';

async function loadThemes() {
    try {
        const response = await fetch('https://kkskkskskx.github.io/east-api/themes.json');
        themes = await response.json();
        renderThemeDropdown();
        applyTheme(currentTheme);
    } catch (error) {
        console.error('Ошибка загрузки тем:', error);
        document.getElementById('themeDropdown').innerHTML = '<div class="loading">Ошибка загрузки</div>';
    }
}

function renderThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    const theme = themes.find(t => t.id === currentTheme);

    dropdown.innerHTML = themes.map(t => `
        <div class="theme-option ${t.id === currentTheme ? 'active' : ''}" onclick="changeTheme('${t.id}')">
            ${t.name}
        </div>
    `).join('');

    if (theme) {
        dropdown.style.background = theme.container;
        dropdown.style.color = theme.text;
    }
}

function changeTheme(themeId) {
    currentTheme = themeId;
    localStorage.setItem('currentTheme', themeId);
    applyTheme(themeId);
    renderThemeDropdown();
    document.getElementById('themeDropdown').classList.remove('show');
}

function applyTheme(themeId) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    if (theme.backgroundImage) {
        document.body.style.background = `url('${theme.backgroundImage}') center/cover fixed, ${theme.background}`;
    } else {
        document.body.style.background = theme.background;
    }

    document.querySelector('.container').style.background = theme.container;
    document.querySelector('.container').style.color = theme.text;
    document.querySelector('h1').style.color = theme.primary;

    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.style.borderColor = 'rgba(0,0,0,0.1)';
        input.style.color = theme.text;
        input.style.background = theme.itemBg;
    });

    document.getElementById('addBtn').style.background = theme.primary;
    document.getElementById('addBtn').style.color = 'white';
    document.getElementById('addBtn').style.borderColor = theme.primary;
    document.getElementById('themeBtn').style.background = theme.primary;
    document.getElementById('themeBtn').style.color = 'white';
    document.getElementById('themeBtn').style.borderColor = theme.primary;

    document.querySelectorAll('.stat-item').forEach(stat => {
        stat.style.background = theme.itemBg;
        stat.style.color = theme.text;
        stat.style.borderColor = theme.itemBg;
    });

    const style = document.createElement('style');
    style.id = 'dynamic-theme';
    const oldStyle = document.getElementById('dynamic-theme');
    if (oldStyle) oldStyle.remove();

    style.textContent = `
        #addBtn:hover { background: ${theme.primaryHover} !important; border-color: ${theme.primaryHover} !important; }
        #themeBtn:hover { background: ${theme.primaryHover} !important; border-color: ${theme.primaryHover} !important; }
        .delete-btn { background: white !important; color: ${theme.delete} !important; border-color: #d0d0d0 !important; }
        .delete-btn:hover { background: ${theme.delete} !important; color: white !important; border-color: ${theme.delete} !important; }
        li { background: ${theme.itemBg} !important; color: ${theme.text} !important; border-color: ${theme.itemBg} !important; }
        li:hover { background: ${theme.itemHover} !important; border-color: ${theme.itemHover} !important; }
        .stats { background: ${theme.itemBg} !important; border-color: ${theme.itemBg} !important; }
        .stat-item { background: ${theme.itemBg} !important; color: ${theme.text} !important; }
        input[type="text"]:focus { border-color: ${theme.primary} !important; }
        input[type="checkbox"] { accent-color: ${theme.primary} !important; }
        .theme-option:hover { background: ${theme.itemHover} !important; }
        .task-input { border-color: ${theme.primary} !important; }
        .task-text { color: ${theme.text} !important; }
        .completed .task-text { color: #999 !important; }
    `;
    document.head.appendChild(style);

    renderThemeDropdown();
}

document.getElementById('themeBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('themeDropdown').classList.toggle('show');
});

document.addEventListener('click', () => {
    document.getElementById('themeDropdown').classList.remove('show');
});

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.done).length;
    const active = total - completed;

    document.getElementById('totalStat').textContent = `Всего: ${total}`;
    document.getElementById('activeStat').textContent = `Активных: ${active}`;
    document.getElementById('completedStat').textContent = `Завершено: ${completed}`;
}

function save() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function render() {
    const list = document.getElementById('list');

    if (todos.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div>Нет задач. Добавьте первую!</div>
            </div>
        `;

        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            const theme = themes.find(t => t.id === currentTheme);
            if (theme) {
                emptyState.style.background = theme.itemBg;
                emptyState.style.color = theme.text;
                emptyState.style.borderColor = theme.itemBg;
            }
        }
    } else {
        list.innerHTML = todos.map((todo, i) => `
            <li class="${todo.done ? 'completed' : ''}" draggable="true" data-index="${i}">
                <span class="drag-handle">⋮⋮</span>
                <span class="task-text" onclick="editTask(${i})">${escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="del(${i})">Удалить</button>
                <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggle(${i})">
            </li>
        `).join('');

        setupDragAndDrop();
    }

    updateStats();
}

function editTask(index) {
    const list = document.getElementById('list');
    const item = list.children[index];
    const textSpan = item.querySelector('.task-text');
    const currentText = todos[index].text;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-input';
    input.value = currentText;

    textSpan.replaceWith(input);
    input.focus();
    input.select();

    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            todos[index].text = newText;
            save();
        }
        render();
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            render();
        }
    });
}

let draggedIndex = null;

function setupDragAndDrop() {
    const items = document.querySelectorAll('#list li');

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedIndex = parseInt(e.target.dataset.index);
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            items.forEach(i => i.classList.remove('drag-over'));
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const afterElement = getDragAfterElement(e.currentTarget.parentElement, e.clientY);
            const draggingElement = document.querySelector('.dragging');

            if (afterElement == null) {
                e.currentTarget.parentElement.appendChild(draggingElement);
            } else {
                e.currentTarget.parentElement.insertBefore(draggingElement, afterElement);
            }
        });

        item.addEventListener('dragenter', (e) => {
            if (e.target.tagName === 'LI') {
                e.target.classList.add('drag-over');
            }
        });

        item.addEventListener('dragleave', (e) => {
            if (e.target.tagName === 'LI') {
                e.target.classList.remove('drag-over');
            }
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropIndex = parseInt(e.currentTarget.dataset.index);

            if (draggedIndex !== null && draggedIndex !== dropIndex) {
                const draggedItem = todos[draggedIndex];
                todos.splice(draggedIndex, 1);

                const newIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
                todos.splice(newIndex, 0, draggedItem);

                save();
                render();
            }

            items.forEach(i => i.classList.remove('drag-over'));
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function add() {
    const input = document.getElementById('input');
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, done: false });
    input.value = '';
    save();
    render();
}

function toggle(i) {
    todos[i].done = !todos[i].done;
    save();
    render();
}

function del(i) {
    todos.splice(i, 1);
    save();
    render();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') add();
});

loadThemes();
render();
