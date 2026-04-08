let publicConfig = null;
let currentPresetId = null;
let sessions = JSON.parse(localStorage.getItem('easychat-sessions')) || [];
let currentSessionId = localStorage.getItem('easychat-current-id') || null;
let abortController = null;

function saveSessions() {
  localStorage.setItem('easychat-sessions', JSON.stringify(sessions));
  localStorage.setItem('easychat-current-id', currentSessionId || '');
}

function sanitizeHtml(html) {
  return DOMPurify.sanitize(html);
}

function markdownToHtml(content) {
  return sanitizeHtml(marked.parse(content || ''));
}

function getCurrentSession() {
  return sessions.find((s) => s.id === currentSessionId);
}

function getCurrentPreset() {
  return publicConfig?.presets?.find((p) => p.id === currentPresetId) || null;
}

function setStatus(message, type = 'info') {
  const box = document.getElementById('status-box');
  const map = {
    info: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-900/40',
    success: 'border-green-200 text-green-700 bg-green-50 dark:border-green-900 dark:text-green-300 dark:bg-green-950/30',
    error: 'border-red-200 text-red-700 bg-red-50 dark:border-red-900 dark:text-red-300 dark:bg-red-950/30'
  };

  box.className = `text-xs rounded-2xl p-4 border ${map[type] || map.info}`;
  box.textContent = message;
  box.classList.remove('hidden');
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  const isHidden = sb.classList.contains('-translate-x-full');

  if (isHidden) {
    sb.classList.remove('-translate-x-full');
    ov.classList.remove('hidden');
    setTimeout(() => ov.classList.add('opacity-100'), 10);
  } else {
    sb.classList.add('-translate-x-full');
    ov.classList.remove('opacity-100');
    setTimeout(() => ov.classList.add('hidden'), 300);
  }
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('easychat-dark', document.documentElement.classList.contains('dark'));
}

function clearAllData() {
  if (!confirm('清空所有本地会话记录？')) return;
  localStorage.removeItem('easychat-sessions');
  localStorage.removeItem('easychat-current-id');
  location.reload();
}

function renderPresetTabs() {
  const container = document.getElementById('preset-tabs');
  container.innerHTML = '';

  (publicConfig?.presets || []).forEach((p) => {
    const btn = document.createElement('button');
    btn.className = `px-3 py-1 text-[10px] rounded-full whitespace-nowrap transition-all border ${
      p.id === currentPresetId
        ? 'bg-blue-600 border-blue-600 text-white font-bold'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
    }`;
    btn.innerText = p.name;
    btn.onclick = () => {
      currentPresetId = p.id;
      localStorage.setItem('easychat-preset-id', currentPresetId);
      renderPresetTabs();
      updatePresetInfo();
    };
    container.appendChild(btn);
  });
}

function updatePresetInfo() {
  const preset = getCurrentPreset();
  document.getElementById('current-model').textContent = preset ? `${preset.name} / ${preset.model}` : '-';
}

function createNewChat() {
  const id = Date.now().toString();
  sessions.unshift({ id, title: 'New Chat', history: [] });
  currentSessionId = id;
  saveSessions();
  renderHistoryList();
  loadSession(id);
  if (window.innerWidth < 1024) toggleSidebar();
}

function loadSession(id) {
  currentSessionId = id;
  saveSessions();

  const session = getCurrentSession();
  const container = document.querySelector('#chat-box > div');
  container.innerHTML = '';

  if (!session || session.history.length === 0) {
    container.innerHTML = `
      <div id="welcome-view" class="text-center py-32">
        <h1 id="app-title" class="text-7xl font-black mb-4 tracking-tighter italic oops-gradient">${publicConfig?.appName || 'EasyChat'}</h1>
        <p class="text-slate-400 dark:text-slate-600 text-sm font-medium tracking-widest uppercase">Start Conversation</p>
      </div>
    `;
  } else {
    session.history.forEach((msg) => renderBubble(msg.role, msg.content));
  }

  renderHistoryList();
}

function renderHistoryList() {
  const list = document.getElementById('history-list');
  list.innerHTML = '';

  sessions.forEach((s) => {
    const row = document.createElement('div');
    row.className = `flex items-center justify-between group p-4 rounded-2xl cursor-pointer transition-all ${
      s.id === currentSessionId
        ? 'bg-blue-50/40 dark:bg-blue-500/10 text-blue-600 font-bold backdrop-blur-md'
        : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/40 text-slate-500'
    }`;
    row.onclick = () => loadSession(s.id);
    row.innerHTML = `
      <span class="truncate text-xs flex-1">${s.title}</span>
      <button onclick="deleteSession(event, '${s.id}')" class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition">✕</button>
    `;
    list.appendChild(row);
  });
}

function deleteSession(e, id) {
  e.stopPropagation();
  sessions = sessions.filter((s) => s.id !== id);

  if (currentSessionId === id) {
    currentSessionId = sessions.length ? sessions[0].id : null;
  }

  if (sessions.length === 0) {
    createNewChat();
  } else {
    saveSessions();
    renderHistoryList();
    loadSession(currentSessionId);
  }
}

function renderBubble(role, content) {
  document.getElementById('welcome-view')?.remove();

  const container = document.querySelector('#chat-box > div');
  const div = document.createElement('div');
  div.className = `flex flex-col ${role === 'user' ? 'items-end' : 'items-start'}`;

  const bubble = document.createElement('div');
  bubble.className = `max-w-[90%] md:max-w-[85%] p-5 rounded-[22px] ${
    role === 'user'
      ? 'bg-blue-600 text-white shadow-lg rounded-tr-none'
      : 'bg-white/70 dark:bg-darkCard/70 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-white/10 dark:border-slate-800 shadow-sm rounded-tl-none'
  } prose dark:prose-invert prose-sm leading-relaxed`;

  bubble.innerHTML = markdownToHtml(content);
  div.innerHTML = `<span class="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 px-2">${role}</span>`;
  div.appendChild(bubble);
  container.appendChild(div);

  bubble.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));
  document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;

  return bubble;
}

async function testConnection() {
  const indicator = document.getElementById('test-indicator');
  const preset = getCurrentPreset();
  if (!preset) return;

  setStatus('正在测试连通性...', 'info');
  indicator.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse';

  try {
    const res = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: preset.id })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      indicator.className = 'w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_#22c55e]';
      setStatus(`连接成功：${preset.name} / ${preset.model}`, 'success');
    } else {
      indicator.className = 'w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]';
      setStatus(`连接失败：${data.message || data.error || '未知错误'}`, 'error');
    }
  } catch (error) {
    indicator.className = 'w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]';
    setStatus(`连接失败：${error.message}`, 'error');
  }
}

async function readSSEStream(response, onDelta) {
  if (!response.body) throw new Error('响应无数据流');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const lines = event.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;

        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content || '';
          if (delta) onDelta(delta);
        } catch (_) {}
      }
    }
  }
}

async function handleSend() {
  if (abortController) return;

  const input = document.getElementById('user-input');
  const text = input.value.trim();
  const preset = getCurrentPreset();

  if (!text || !preset) return;

  let session = getCurrentSession();
  if (!session) {
    createNewChat();
    session = getCurrentSession();
  }

  abortController = new AbortController();
  document.getElementById('loading-tag').classList.remove('hidden');
  document.getElementById('stop-btn').classList.remove('hidden');
  setStatus(`已使用预设：${preset.name} / ${preset.model}`, 'info');

  input.value = '';
  input.style.height = 'auto';

  if (session.history.length === 0) {
    session.title = text.substring(0, 24);
    renderHistoryList();
  }

  renderBubble('user', text);
  session.history.push({ role: 'user', content: text });

  const aiBubble = renderBubble('assistant', '');
  aiBubble.classList.add('typing');

  let full = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presetId: preset.id,
        messages: session.history,
        stream: true
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      let msg = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        msg = data.details || data.error || msg;
      } catch (_) {}
      throw new Error(msg);
    }

    await readSSEStream(response, (delta) => {
      full += delta;
      aiBubble.innerHTML = markdownToHtml(full);
      document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;
    });

    session.history.push({ role: 'assistant', content: full });
    saveSessions();
  } catch (error) {
    if (error.name === 'AbortError') {
      if (full) {
        session.history.push({ role: 'assistant', content: full });
        saveSessions();
      } else {
        aiBubble.innerHTML = '<span class="text-slate-400">已停止生成</span>';
      }
    } else {
      aiBubble.innerHTML = `<span class="text-red-500">错误：${error.message}</span>`;
      setStatus(`聊天失败：${error.message}`, 'error');
    }
  } finally {
    aiBubble.classList.remove('typing');
    aiBubble.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el));
    document.getElementById('loading-tag').classList.add('hidden');
    document.getElementById('stop-btn').classList.add('hidden');
    abortController = null;
  }
}

function stopGeneration() {
  if (abortController) abortController.abort();
}

async function init() {
  if (localStorage.getItem('easychat-dark') === 'true') {
    document.documentElement.classList.add('dark');
  }

  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    publicConfig = await res.json();

    document.title = publicConfig.appName || 'EasyChat AI';
    const appTitle = document.getElementById('app-title');
    if (appTitle) appTitle.textContent = publicConfig.appName || 'EasyChat';

    if (publicConfig.backgroundImage) {
      document.getElementById('dynamic-bg').style.backgroundImage = `url('${publicConfig.backgroundImage}')`;
    }

    const storedPresetId = localStorage.getItem('easychat-preset-id');
    currentPresetId = publicConfig.presets.some((p) => p.id === storedPresetId)
      ? storedPresetId
      : publicConfig.defaultPresetId || publicConfig.presets[0]?.id;

    renderPresetTabs();
    updatePresetInfo();

    if (sessions.length === 0) {
      createNewChat();
    } else {
      renderHistoryList();
      if (!currentSessionId || !sessions.some((s) => s.id === currentSessionId)) {
        currentSessionId = sessions[0].id;
      }
      loadSession(currentSessionId);
    }
  } catch (error) {
    setStatus(`初始化失败：${error.message}`, 'error');
  }
}

window.toggleSidebar = toggleSidebar;
window.toggleDarkMode = toggleDarkMode;
window.clearAllData = clearAllData;
window.createNewChat = createNewChat;
window.deleteSession = deleteSession;
window.testConnection = testConnection;

window.onload = init;

document.getElementById('send-btn').onclick = handleSend;
document.getElementById('stop-btn').onclick = stopGeneration;
document.getElementById('user-input').oninput = function () {
  this.style.height = 'auto';
  this.style.height = `${this.scrollHeight}px`;
};
document.getElementById('user-input').onkeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
