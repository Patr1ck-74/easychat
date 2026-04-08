import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 7777;
const HOST = process.env.HOST || '0.0.0.0';
const WEB_ROOT = path.resolve(__dirname, '../web');

app.use(express.json({ limit: '2mb' }));

function loadConfig() {
  const configPath = process.env.CONFIG_PATH || path.join(__dirname, 'presets.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  const json = JSON.parse(raw);

  if (!json.presets || !Array.isArray(json.presets) || json.presets.length === 0) {
    throw new Error('presets.json 缺少 presets 配置');
  }

  return json;
}

function getPublicConfig() {
  const config = loadConfig();
  return {
    appName: config.appName || 'EasyChat AI',
    backgroundImage: config.backgroundImage || '',
    defaultPresetId: config.defaultPresetId || config.presets[0].id,
    presets: config.presets.map((p) => ({
      id: p.id,
      name: p.name,
      model: p.model
    }))
  };
}

function findPresetById(id) {
  const config = loadConfig();
  return config.presets.find((p) => p.id === id);
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/, '');
}

function buildSystemMessage() {
  const timeStr = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return {
    role: 'system',
    content: `当前北京时间：${timeStr}。请基于此回答。`
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/config', (req, res) => {
  try {
    res.json(getPublicConfig());
  } catch (error) {
    res.status(500).json({ error: error.message || '读取配置失败' });
  }
});

app.post('/api/test', async (req, res) => {
  try {
    const { presetId } = req.body || {};
    const preset = findPresetById(presetId);

    if (!preset) {
      return res.status(400).json({ error: '无效的 presetId' });
    }

    const url = `${normalizeBaseUrl(preset.baseUrl)}/chat/completions`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${preset.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: preset.model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        stream: false
      })
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        status: upstream.status,
        message: text
      });
    }

    return res.json({
      ok: true,
      status: upstream.status
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || '测试失败'
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { presetId, messages = [], stream = true } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 不能为空' });
    }

    const preset = findPresetById(presetId);
    if (!preset) {
      return res.status(400).json({ error: '无效的 presetId' });
    }

    const url = `${normalizeBaseUrl(preset.baseUrl)}/chat/completions`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${preset.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: preset.model,
        messages: [buildSystemMessage(), ...messages],
        stream: Boolean(stream)
      })
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({
        error: '上游接口返回错误',
        details: text
      });
    }

    if (!stream) {
      const data = await upstream.json();
      return res.json(data);
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    if (!upstream.body) {
      return res.status(500).end('上游无响应流');
    }

    for await (const chunk of upstream.body) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || '服务异常'
      });
    } else {
      res.end();
    }
  }
});

app.use(express.static(WEB_ROOT));

app.get('*', (req, res) => {
  res.sendFile(path.join(WEB_ROOT, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`EasyChat server running on http://${HOST}:${PORT}`);
});
