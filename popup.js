// popup.js

// 动态添加弹幕输入项
function addDanmuInput(text = '', time = '') {
    const list = document.getElementById('danmu-list');
    const entry = document.createElement('div');
    entry.classList.add('danmu-entry');
    entry.innerHTML = `
    <input type="text" placeholder="弹幕内容" class="danmu-text" value="${text}">
    <input type="number" placeholder="时间(毫秒)" class="danmu-time" value="${time}">
    <button class="remove-danmu">删除</button>
  `;
    list.appendChild(entry);

    // 删除按钮事件
    entry.querySelector('.remove-danmu').addEventListener('click', () => {
        entry.remove();
    });
}

// 保存设置到 storage
function saveSettings() {
    const entries = document.querySelectorAll('.danmu-entry');
    const danmuList = [];
    entries.forEach((entry) => {
        const text = entry.querySelector('.danmu-text').value.trim();
        const time = parseInt(entry.querySelector('.danmu-time').value.trim(), 10);
        if (text && !isNaN(time)) {
            danmuList.push({ text, time });
        }
    });

    // 保存到 Chrome storage
    chrome.storage.local.set({ danmuList }, () => {
        alert('设置已保存！');
    });
}

// 从 storage 加载设置
function loadSettings() {
    chrome.storage.local.get(['danmuList'], (result) => {
        const danmuList = result.danmuList || [];
        danmuList.forEach((item) => addDanmuInput(item.text, item.time));
    });
}

// 初始化事件
document.getElementById('add-danmu').addEventListener('click', () => addDanmuInput());
document.getElementById('save-settings').addEventListener('click', saveSettings);

// 页面加载时加载设置
loadSettings();

// 导出设置为 JSON 文件
document.getElementById('export-settings').addEventListener('click', () => {
    chrome.storage.local.get(['danmuList'], (result) => {
        const danmuList = result.danmuList || [];
        const blob = new Blob([JSON.stringify(danmuList, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'danmu-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    });
});

// 导入设置从 JSON 文件
document.getElementById('import-settings').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const danmuList = JSON.parse(e.target.result);
            if (Array.isArray(danmuList)) {
                chrome.storage.local.set({ danmuList }, () => {
                    alert('设置已导入！');
                    // 清空现有弹幕列表并重新加载
                    document.getElementById('danmu-list').innerHTML = '';
                    danmuList.forEach((item) => addDanmuInput(item.text, item.time));
                });
            } else {
                alert('文件格式错误，请选择正确的 JSON 文件！');
            }
        } catch (error) {
            alert('文件解析失败，请检查文件内容是否正确！');
        }
    };
    reader.readAsText(file);
});