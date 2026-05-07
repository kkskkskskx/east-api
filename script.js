let todos = JSON.parse(localStorage.getItem('todos')) || [];
let themes = [];
let currentTheme = localStorage.getItem('currentTheme') || 'midnight';
let achievements = JSON.parse(localStorage.getItem('achievements')) || {
    totalCompleted: 0,
    totalCreated: 0,
    lastActiveDate: null,
    currentStreak: 0,
    longestStreak: 0,
    unlockedAchievements: []
};

async function loadThemes() {
    try {
        const response = await fetch('https://kkskkskskx.github.io/east-api/themes.json');
        themes = await response.json();
        renderThemeDropdown();
        applyTheme(currentTheme);
    } catch (error) {
        console.error('Помилка завантаження тем:', error);
        document.getElementById('themeDropdown').innerHTML = '<div class="loading">Помилка завантаження</div>';
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

    document.getElementById('totalStat').textContent = `Всього: ${total}`;
    document.getElementById('activeStat').textContent = `Активних: ${active}`;
    document.getElementById('completedStat').textContent = `Завершено: ${completed}`;
}

function save() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function saveAchievements() {
    localStorage.setItem('achievements', JSON.stringify(achievements));
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastActive = achievements.lastActiveDate;

    if (lastActive !== today) {
        if (lastActive) {
            const lastDate = new Date(lastActive);
            const todayDate = new Date(today);
            const diffTime = todayDate - lastDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                achievements.currentStreak++;
            } else if (diffDays > 1) {
                achievements.currentStreak = 1;
            }
        } else {
            achievements.currentStreak = 1;
        }

        achievements.lastActiveDate = today;
        if (achievements.currentStreak > achievements.longestStreak) {
            achievements.longestStreak = achievements.currentStreak;
        }
        saveAchievements();
    }
}

function render() {
    const list = document.getElementById('list');

    if (todos.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div>Немає завдань. Додайте перше!</div>
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
                <button class="delete-btn" onclick="del(${i})">Видалити</button>
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
    achievements.totalCreated++;
    updateStreak();
    saveAchievements();
    checkNewAchievements();
    save();
    render();
}

function toggle(i) {
    const wasCompleted = todos[i].done;
    todos[i].done = !todos[i].done;

    if (!wasCompleted && todos[i].done) {
        achievements.totalCompleted++;
        updateStreak();
        saveAchievements();
        checkNewAchievements();
    } else if (wasCompleted && !todos[i].done) {
        achievements.totalCompleted--;
        saveAchievements();
    }

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

const achievementsList = [
    { id: 'first_task', icon: '🎯', title: 'Перший крок', description: 'Створіть перше завдання', requirement: () => achievements.totalCreated >= 1 },
    { id: 'task_master', icon: '📝', title: 'Майстер завдань', description: 'Створіть 10 завдань', requirement: () => achievements.totalCreated >= 10 },
    { id: 'task_legend', icon: '📚', title: 'Легенда завдань', description: 'Створіть 50 завдань', requirement: () => achievements.totalCreated >= 50 },
    { id: 'first_complete', icon: '✅', title: 'Початок шляху', description: 'Виконайте перше завдання', requirement: () => achievements.totalCompleted >= 1 },
    { id: 'productive', icon: '💪', title: 'Продуктивний', description: 'Виконайте 10 завдань', requirement: () => achievements.totalCompleted >= 10 },
    { id: 'super_productive', icon: '🔥', title: 'Супер продуктивний', description: 'Виконайте 25 завдань', requirement: () => achievements.totalCompleted >= 25 },
    { id: 'unstoppable', icon: '⚡', title: 'Невпинний', description: 'Виконайте 50 завдань', requirement: () => achievements.totalCompleted >= 50 },
    { id: 'centurion', icon: '💯', title: 'Центуріон', description: 'Виконайте 100 завдань', requirement: () => achievements.totalCompleted >= 100 },
    { id: 'streak_3', icon: '🔥', title: 'На розігріві', description: 'Працюйте 3 дні поспіль', requirement: () => achievements.currentStreak >= 3 },
    { id: 'streak_7', icon: '🌟', title: 'Тиждень сили', description: 'Працюйте 7 днів поспіль', requirement: () => achievements.currentStreak >= 7 },
    { id: 'streak_30', icon: '👑', title: 'Місяць тріумфу', description: 'Працюйте 30 днів поспіль', requirement: () => achievements.currentStreak >= 30 }
];

function checkNewAchievements() {
    const newlyUnlocked = [];

    achievementsList.forEach(achievement => {
        if (achievement.requirement() && !achievements.unlockedAchievements.includes(achievement.id)) {
            achievements.unlockedAchievements.push(achievement.id);
            newlyUnlocked.push(achievement);
        }
    });

    if (newlyUnlocked.length > 0) {
        saveAchievements();
        newlyUnlocked.forEach(achievement => showAchievementNotification(achievement));
    }
}

function showAchievementNotification(achievement) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';

    const theme = themes.find(t => t.id === currentTheme);
    if (theme) {
        notification.style.background = theme.container;
        notification.style.color = theme.text;
        notification.style.borderColor = theme.primary;
    }

    notification.innerHTML = `
        <div class="notification-icon">${achievement.icon}</div>
        <div class="notification-content">
            <div class="notification-title">🏆 Нагорода отримана!</div>
            <div class="notification-description">${achievement.title}</div>
        </div>
    `;

    container.appendChild(notification);

    const audio = new Audio('upload/sounds/message.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.error('Помилка відтворення звуку:', err));

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function renderAchievements() {
    const modal = document.getElementById('achievementsModal');
    const list = document.getElementById('achievementsList');
    const theme = themes.find(t => t.id === currentTheme);

    document.getElementById('totalCompleted').textContent = achievements.totalCompleted;
    document.getElementById('totalCreated').textContent = achievements.totalCreated;
    document.getElementById('currentStreak').textContent = achievements.currentStreak;

    list.innerHTML = achievementsList.map(achievement => {
        const unlocked = achievement.requirement();
        return `
            <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `;
    }).join('');

    if (theme) {
        modal.querySelector('.achievements-content').style.background = theme.container;
        modal.querySelector('.achievements-content').style.color = theme.text;
        modal.querySelectorAll('.achievement-stat').forEach(stat => {
            stat.style.background = theme.itemBg;
            stat.style.borderColor = theme.itemBg;
        });
        modal.querySelectorAll('.stat-number').forEach(num => {
            num.style.color = theme.primary;
        });
        modal.querySelectorAll('.achievement-item').forEach(item => {
            item.style.background = theme.itemBg;
            item.style.borderColor = theme.itemBg;
        });
        modal.querySelectorAll('.achievement-item.unlocked').forEach(item => {
            item.style.background = theme.container;
            item.style.borderColor = theme.primary;
        });
    }
}

document.getElementById('achievementsBtn').addEventListener('click', () => {
    renderAchievements();
    document.getElementById('achievementsModal').classList.add('show');
});

document.getElementById('closeAchievements').addEventListener('click', () => {
    document.getElementById('achievementsModal').classList.remove('show');
});

document.getElementById('achievementsModal').addEventListener('click', (e) => {
    if (e.target.id === 'achievementsModal') {
        document.getElementById('achievementsModal').classList.remove('show');
    }
});

loadThemes();
render();
