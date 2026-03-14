import { spawn } from 'node:child_process';

const run = (name, command, args) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    // eslint-disable-next-line no-console
    console.error(`[${name}] exited with ${reason}`);
    process.exitCode = typeof code === 'number' ? code : 1;
    process.kill(process.pid, 'SIGTERM');
  });

  return child;
};

const api = run('api', 'node', ['dist/src/main.js']);
const bot = run('bot', 'node', ['bot_folder/bot-server.mjs']);

process.on('SIGTERM', () => {
  api.kill('SIGTERM');
  bot.kill('SIGTERM');
  setTimeout(() => process.exit(process.exitCode ?? 0), 1000);
});

process.on('SIGINT', () => {
  api.kill('SIGINT');
  bot.kill('SIGINT');
  setTimeout(() => process.exit(process.exitCode ?? 0), 1000);
});
