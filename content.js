// 定义函数：发送弹幕
function sendDanmu(text) {
    const inputBox = document.querySelector('textarea.aliveWordInput');
    if (!inputBox) {
        updateLog('未找到输入框，弹幕发送失败。');
        return;
    }

    const sendButton = document.querySelector('div.submitInfo');
    if (!sendButton) {
        updateLog('未找到发送按钮，弹幕发送失败。');
        return;
    }

    inputBox.value = text;
    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
    sendButton.click();
    updateLog(`发送弹幕：${text}`);
}

// 添加一个新的时间格式转换函数
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// 按时间表发送弹幕
function scheduleDanmuWithSync(danmuList) {
    observeVideoElement((video) => {
        // 记录已发送的弹幕，防止重复发送
        const sentDanmu = new Set();

        // 设置一个总的定时器来检查视频时间和发送弹幕
        const interval = setInterval(() => {
            const currentTime = Math.floor(video.currentTime * 1000);

            // 遍历弹幕列表，只处理未发送且时间匹配的弹幕
            danmuList.forEach(item => {
                // 检查是否已发送
                if (sentDanmu.has(item.time)) {
                    return;
                }

                // 如果当前时间在弹幕时间点前后100ms内，则发送弹幕
                if (currentTime >= item.time && currentTime <= item.time + 100) {
                    sendDanmu(item.text);
                    sentDanmu.add(item.time);
                    updateLog(`成功发送定时弹幕：${item.text} (时间点：${formatTime(item.time)})`);
                } else if (currentTime > item.time + 100) {
                    // 如果超过弹幕时间100ms以上，标记为已过期但不发送
                    sentDanmu.add(item.time);
                    updateLog(`弹幕已过期，跳过：${item.text} (时间点：${formatTime(item.time)})`);
                }
            });

            // 如果所有弹幕都已处理，清除定时器
            if (sentDanmu.size === danmuList.length) {
                clearInterval(interval);
                updateLog('所有弹幕处理完成');
            }
        }, 100);

        // 视频暂停时清除定时器
        video.addEventListener('pause', () => {
            clearInterval(interval);
        });
    });
}

function observeVideoElement(callback) {
    const observer = new MutationObserver((mutations) => {
        const video = document.getElementById('livePlayerInstance');
        if (video) {
            console.log('找到视频元素！');
            observer.disconnect();

            // 监听视频播放事件
            video.addEventListener('play', () => {
                updateLog('播放按钮被点击，等待获取准确的播放时间...');

                // 等待 timeupdate 事件获取准确时间
                const onTimeUpdate = () => {
                    const currentTime = Math.floor(video.currentTime * 1000); // 获取当前时间（毫秒）
                    updateLog(`准确播放时间获取成功：${currentTime}ms`);
                    video.removeEventListener('timeupdate', onTimeUpdate); // 移除监听
                };

                // 添加 timeupdate 监听
                video.addEventListener('timeupdate', onTimeUpdate, { once: true });
            });

            callback(video);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
        observer.disconnect();
        console.error('超时未找到视频元素！');
    }, 10000); // 超时 10 秒
}

// 从 storage 加载设置并同步弹幕
chrome.storage.local.get(['danmuList'], (result) => {
    const danmuList = result.danmuList || [];
    const validDanmuList = danmuList.filter(item => item.text && item.time >= 0); // 校验数据
    scheduleDanmuWithSync(validDanmuList);
});

// 创建日志窗口
function createLogWindow() {
    const logWindow = document.createElement('div');
    logWindow.id = 'danmu-log';
    logWindow.style.position = 'fixed';
    logWindow.style.bottom = '10px';
    logWindow.style.right = '10px';
    logWindow.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    logWindow.style.color = 'white';
    logWindow.style.padding = '10px';
    logWindow.style.borderRadius = '5px';
    logWindow.style.fontSize = '12px';
    logWindow.style.maxHeight = '200px';
    logWindow.style.overflowY = 'auto';
    document.body.appendChild(logWindow);
}

// 更新日志
function updateLog(message) {
    const logWindow = document.getElementById('danmu-log');
    if (!logWindow) return;
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    logWindow.appendChild(logEntry);
    if (logWindow.childNodes.length > 50) {
        logWindow.removeChild(logWindow.firstChild);
    }
    logWindow.scrollTop = logWindow.scrollHeight;
}

// 初始化日志窗口
createLogWindow();