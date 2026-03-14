import express from 'express';

const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
const port = Number(process.env.BOT_PORT ?? '3001');

const pendingCodes = new Map();
const confirmedCodes = new Map();
let lastUpdateId = 0;

const tgCall = async (method, body) => {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  return response.json();
};

const cleanupExpired = () => {
  const now = Date.now();
  for (const [code, expiresAt] of pendingCodes.entries()) {
    if (expiresAt <= now) {
      pendingCodes.delete(code);
      confirmedCodes.delete(code);
    }
  }
};

const extractCode = (text) => {
  const normalized = text.trim();
  const startMatch = normalized.match(/^\/start(?:@\w+)?\s+login_(\d{6})$/i);
  if (startMatch?.[1]) {
    return startMatch[1];
  }

  const codeOnlyMatch = normalized.match(/(^|\s)(\d{6})(\s|$)/);
  if (codeOnlyMatch?.[2]) {
    return codeOnlyMatch[2];
  }

  return null;
};

const acknowledgeCode = async (chatId, code) => {
  try {
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `Code ${code} received. Return to Frogger and click Verify Telegram Code.`,
    });
  } catch {
    // Ignore send failures. The code is still confirmed server-side.
  }
};

const processUpdate = async (update) => {
  const message = update?.message;
  const from = message?.from;
  const text = message?.text;
  if (!from?.id || !text) {
    return;
  }

  const code = extractCode(text);
  if (!code) {
    return;
  }

  const expiresAt = pendingCodes.get(code);
  if (!expiresAt || expiresAt <= Date.now()) {
    return;
  }

  confirmedCodes.set(code, {
    id: from.id,
    username: from.username,
    first_name: from.first_name,
    last_name: from.last_name,
    confirmedAt: Date.now(),
  });

  await acknowledgeCode(message.chat?.id ?? from.id, code);
};

const pollUpdates = async () => {
  if (!botToken) {
    return;
  }

  try {
    const payload = await tgCall('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 20,
      allowed_updates: ['message'],
    });

    if (!payload?.ok || !Array.isArray(payload.result)) {
      return;
    }

    for (const update of payload.result) {
      lastUpdateId = Math.max(lastUpdateId, Number(update.update_id) || 0);
      await processUpdate(update);
    }
  } catch {
    // Ignore transient polling failures and retry.
  }
};

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  cleanupExpired();
  res.status(200).json({
    ok: true,
    botTokenConfigured: Boolean(botToken),
    pendingCodes: pendingCodes.size,
    confirmedCodes: confirmedCodes.size,
  });
});

app.post('/codes/register', (req, res) => {
  const code = String(req.body?.code ?? '');
  const ttlSeconds = Number(req.body?.ttlSeconds ?? 300);
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ ok: false, message: 'Invalid code format' });
    return;
  }

  const expiresAt = Date.now() + Math.max(ttlSeconds, 1) * 1000;
  pendingCodes.set(code, expiresAt);
  confirmedCodes.delete(code);

  res.status(200).json({ ok: true, expiresAt });
});

app.post('/codes/consume', (req, res) => {
  const code = String(req.body?.code ?? '');
  cleanupExpired();

  const user = confirmedCodes.get(code);
  if (!user) {
    res.status(404).json({ ok: false, message: 'Code not confirmed' });
    return;
  }

  pendingCodes.delete(code);
  confirmedCodes.delete(code);
  res.status(200).json({ ok: true, user });
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, message: 'Not Found' });
});

app.use((error, _req, res, _next) => {
  res.status(500).json({
    ok: false,
    message: error instanceof Error ? error.message : 'Internal error',
  });
});

app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[Bot] Telegram bot service listening on 0.0.0.0:${port}`);
});

setInterval(cleanupExpired, 10_000);
setInterval(() => {
  void pollUpdates();
}, 3_000);
void pollUpdates();
