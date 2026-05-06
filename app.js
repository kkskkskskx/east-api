class CollaborativeEditor {
    constructor() {
        this.files = {
            'index.html': {
                content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <script src="script.js"></script>\n</body>\n</html>',
                editor: null
            },
            'style.css': {
                content: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n}',
                editor: null
            },
            'script.js': {
                content: 'console.log("Hello from JavaScript!");\n\n// Your code here',
                editor: null
            }
        };

        this.currentFile = 'index.html';
        this.users = new Map();
        this.currentUser = null;
        this.images = {};
        this.userColors = {};
        this.cursorPosition = 0;

        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.renderFilesList();
        this.loadFile(this.currentFile);
        this.renderImagesList();
        this.updatePreview();
        this.startSync();
    }

    setupEventListeners() {
        const usernameInput = document.getElementById('username');
        const codeEditor = document.getElementById('codeEditor');
        const addFileBtn = document.getElementById('addFileBtn');
        const deleteFileBtn = document.getElementById('deleteFileBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const openFullBtn = document.getElementById('openFullBtn');
        const imageUpload = document.getElementById('imageUpload');

        usernameInput.addEventListener('input', (e) => {
            this.currentUser = e.target.value.trim() || null;
            this.saveToLocalStorage();
            this.broadcastUsers();
        });

        codeEditor.addEventListener('input', (e) => {
            this.files[this.currentFile].content = e.target.value;
            this.files[this.currentFile].editor = this.currentUser;
            this.cursorPosition = e.target.selectionStart;
            this.broadcastCursor();
            this.saveToLocalStorage();
            this.renderFilesList();

            // Автообновление preview с небольшой задержкой
            clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => {
                this.updatePreview();
            }, 300);
        });

        codeEditor.addEventListener('click', (e) => {
            this.cursorPosition = e.target.selectionStart;
            this.broadcastCursor();
        });

        codeEditor.addEventListener('keyup', (e) => {
            this.cursorPosition = e.target.selectionStart;
            this.broadcastCursor();
        });

        codeEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                e.target.value = e.target.value.substring(0, start) + '    ' + e.target.value.substring(end);
                e.target.selectionStart = e.target.selectionEnd = start + 4;
                this.files[this.currentFile].content = e.target.value;
                this.saveToLocalStorage();
            }
        });

        addFileBtn.addEventListener('click', () => this.addNewFile());
        deleteFileBtn.addEventListener('click', () => this.deleteFile());
        refreshBtn.addEventListener('click', () => this.updatePreview());
        openFullBtn.addEventListener('click', () => this.openInNewWindow());
        imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));

        if (this.currentUser) {
            usernameInput.value = this.currentUser;
        }
    }

    renderFilesList() {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '';

        Object.keys(this.files).forEach(fileName => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item' + (fileName === this.currentFile ? ' active' : '');

            const fileNameSpan = document.createElement('div');
            fileNameSpan.className = 'file-name';
            fileNameSpan.textContent = fileName;

            const editorSpan = document.createElement('div');
            editorSpan.className = 'file-editor';
            editorSpan.textContent = this.files[fileName].editor ? `Editing: ${this.files[fileName].editor}` : '';

            fileItem.appendChild(fileNameSpan);
            fileItem.appendChild(editorSpan);

            fileItem.addEventListener('click', () => this.loadFile(fileName));

            filesList.appendChild(fileItem);
        });
    }

    loadFile(fileName) {
        this.currentFile = fileName;
        const codeEditor = document.getElementById('codeEditor');
        const currentFileName = document.getElementById('currentFileName');

        codeEditor.value = this.files[fileName].content;
        currentFileName.textContent = fileName;

        this.renderFilesList();
        this.renderCursors();
    }

    addNewFile() {
        const fileName = prompt('Enter file name (e.g., newfile.js, styles.css):');
        if (!fileName) return;

        if (this.files[fileName]) {
            alert('File already exists!');
            return;
        }

        this.files[fileName] = {
            content: '',
            editor: this.currentUser
        };

        this.saveToLocalStorage();
        this.renderFilesList();
        this.loadFile(fileName);
    }

    deleteFile() {
        if (Object.keys(this.files).length <= 1) {
            alert('Cannot delete the last file!');
            return;
        }

        if (!confirm(`Delete ${this.currentFile}?`)) return;

        delete this.files[this.currentFile];
        this.currentFile = Object.keys(this.files)[0];

        this.saveToLocalStorage();
        this.renderFilesList();
        this.loadFile(this.currentFile);
        this.updatePreview();
    }

    updatePreview() {
        const preview = document.getElementById('preview');
        const htmlContent = this.files['index.html']?.content || '';
        const cssContent = this.files['style.css']?.content || '';
        const jsContent = this.files['script.js']?.content || '';

        let fullHTML = htmlContent;

        // Добавляем UTF-8 кодировку если её нет
        if (!fullHTML.includes('charset')) {
            fullHTML = fullHTML.replace('<head>', '<head>\n    <meta charset="UTF-8">');
        }

        if (!fullHTML.includes('<style>') && cssContent) {
            fullHTML = fullHTML.replace('</head>', `<style>${cssContent}</style></head>`);
        }

        if (!fullHTML.includes('<script>') && jsContent) {
            fullHTML = fullHTML.replace('</body>', `<script>${jsContent}</script></body>`);
        }

        Object.keys(this.images).forEach(imageName => {
            const regex = new RegExp(`src=["']${imageName}["']`, 'g');
            fullHTML = fullHTML.replace(regex, `src="${this.images[imageName]}"`);
        });

        this.currentPreviewHTML = fullHTML;

        const blob = new Blob([fullHTML], { type: 'text/html; charset=utf-8' });
        preview.src = URL.createObjectURL(blob);
    }

    openInNewWindow() {
        window.open('preview.html', '_blank');
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            this.images[file.name] = event.target.result;
            this.saveToLocalStorage();
            this.renderImagesList();
            this.updatePreview();
        };
        reader.readAsDataURL(file);

        e.target.value = '';
    }

    renderImagesList() {
        const imagesList = document.getElementById('imagesList');
        imagesList.innerHTML = '';

        Object.keys(this.images).forEach(imageName => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = imageName;

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(`<img src="${imageName}" alt="${imageName}">`);
                copyBtn.textContent = '✓';
                setTimeout(() => copyBtn.textContent = 'Copy', 1000);
            });

            imageItem.appendChild(nameSpan);
            imageItem.appendChild(copyBtn);
            imagesList.appendChild(imageItem);
        });
    }

    saveToLocalStorage() {
        const data = {
            files: this.files,
            currentFile: this.currentFile,
            currentUser: this.currentUser,
            images: this.images,
            timestamp: Date.now()
        };
        localStorage.setItem('collaborativeEditor', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('collaborativeEditor');
        if (saved) {
            const data = JSON.parse(saved);
            this.files = data.files || this.files;
            this.currentFile = data.currentFile || this.currentFile;
            this.currentUser = data.currentUser || null;
            this.images = data.images || {};
            this.renderImagesList();
        }
    }

    startSync() {
        setInterval(() => {
            const saved = localStorage.getItem('collaborativeEditor');
            if (saved) {
                const data = JSON.parse(saved);

                if (data.timestamp && data.timestamp > (this.lastSyncTime || 0)) {
                    const currentContent = document.getElementById('codeEditor').value;

                    if (data.files[this.currentFile] &&
                        data.files[this.currentFile].content !== currentContent &&
                        data.files[this.currentFile].editor !== this.currentUser) {

                        this.files = data.files;
                        this.images = data.images || {};
                        this.loadFile(this.currentFile);
                        this.renderFilesList();
                        this.renderImagesList();
                        this.updatePreview();
                    }

                    this.lastSyncTime = data.timestamp;
                }
            }

            this.syncUsers();
        }, 500);
    }

    broadcastUsers() {
        const users = JSON.parse(localStorage.getItem('editorUsers') || '{}');
        if (this.currentUser) {
            users[this.currentUser] = Date.now();
        }
        localStorage.setItem('editorUsers', JSON.stringify(users));
    }

    syncUsers() {
        const users = JSON.parse(localStorage.getItem('editorUsers') || '{}');
        const now = Date.now();
        const activeUsers = [];

        Object.keys(users).forEach(user => {
            if (now - users[user] < 5000) {
                activeUsers.push(user);
            }
        });

        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        activeUsers.forEach(user => {
            const badge = document.createElement('div');
            badge.className = 'user-badge';
            badge.textContent = user;
            usersList.appendChild(badge);
        });

        if (this.currentUser) {
            this.broadcastUsers();
        }

        this.renderCursors();
    }

    getUserColor(username) {
        if (!this.userColors[username]) {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#fdcb6e', '#00b894'];
            this.userColors[username] = colors[Object.keys(this.userColors).length % colors.length];
        }
        return this.userColors[username];
    }

    broadcastCursor() {
        if (!this.currentUser) return;

        const cursors = JSON.parse(localStorage.getItem('editorCursors') || '{}');
        cursors[this.currentUser] = {
            position: this.cursorPosition,
            file: this.currentFile,
            timestamp: Date.now()
        };
        localStorage.setItem('editorCursors', JSON.stringify(cursors));
    }

    renderCursors() {
        const codeEditor = document.getElementById('codeEditor');
        const editorRect = codeEditor.getBoundingClientRect();

        let cursorsContainer = document.getElementById('cursorsContainer');
        if (!cursorsContainer) {
            cursorsContainer = document.createElement('div');
            cursorsContainer.id = 'cursorsContainer';
            cursorsContainer.style.position = 'absolute';
            cursorsContainer.style.pointerEvents = 'none';
            cursorsContainer.style.zIndex = '1000';
            cursorsContainer.style.top = '0';
            cursorsContainer.style.left = '0';
            codeEditor.parentElement.style.position = 'relative';
            codeEditor.parentElement.appendChild(cursorsContainer);
        }

        cursorsContainer.innerHTML = '';

        const cursors = JSON.parse(localStorage.getItem('editorCursors') || '{}');
        const now = Date.now();

        Object.keys(cursors).forEach(user => {
            if (user === this.currentUser) return;
            if (now - cursors[user].timestamp > 5000) return;
            if (cursors[user].file !== this.currentFile) return;

            const position = cursors[user].position;
            const color = this.getUserColor(user);

            const textBeforeCursor = codeEditor.value.substring(0, position);
            const lines = textBeforeCursor.split('\n');
            const lineNumber = lines.length - 1;
            const lastLine = lines[lines.length - 1];

            // Правильный подсчет ширины с учетом русских символов
            let columnWidth = 0;
            for (let i = 0; i < lastLine.length; i++) {
                const char = lastLine[i];
                // Русские буквы и спецсимволы занимают больше места
                if (/[а-яА-ЯёЁ]/.test(char)) {
                    columnWidth += 8.4;
                } else {
                    columnWidth += 8.4;
                }
            }

            // Используем getComputedStyle для точного расчета
            const style = window.getComputedStyle(codeEditor);
            const lineHeight = parseFloat(style.lineHeight);
            const paddingTop = parseFloat(style.paddingTop);
            const paddingLeft = parseFloat(style.paddingLeft);

            const top = (lineNumber * lineHeight) + paddingTop;
            const left = columnWidth + paddingLeft;

            const cursor = document.createElement('div');
            cursor.className = 'remote-cursor';
            cursor.style.position = 'absolute';
            cursor.style.top = top + 'px';
            cursor.style.left = left + 'px';
            cursor.style.width = '2px';
            cursor.style.height = lineHeight + 'px';
            cursor.style.backgroundColor = color;
            cursor.style.animation = 'blink 1s infinite';

            const label = document.createElement('div');
            label.className = 'cursor-label';
            label.textContent = user;
            label.style.position = 'absolute';
            label.style.top = '-20px';
            label.style.left = '0';
            label.style.backgroundColor = color;
            label.style.color = 'white';
            label.style.padding = '2px 6px';
            label.style.borderRadius = '3px';
            label.style.fontSize = '11px';
            label.style.whiteSpace = 'nowrap';

            cursor.appendChild(label);
            cursorsContainer.appendChild(cursor);
        });
    }
}

const editor = new CollaborativeEditor();
