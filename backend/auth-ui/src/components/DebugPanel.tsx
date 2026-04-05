import { useState, useEffect, useRef } from 'react';
import { useSession } from '../lib/auth-client';

export interface DebugLog {
  id: number;
  time: string;
  type: 'req' | 'res' | 'info' | 'error';
  message: string;
  data?: unknown;
}

let logId = 0;
const listeners: Set<(log: DebugLog) => void> = new Set();

export function pushLog(
  type: DebugLog['type'],
  message: string,
  data?: unknown,
) {
  const log: DebugLog = {
    id: ++logId,
    time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    type,
    message,
    data,
  };
  listeners.forEach((fn) => fn(log));
}

const TYPE_COLORS: Record<DebugLog['type'], string> = {
  req: '#60a5fa',
  res: '#34d399',
  info: '#a78bfa',
  error: '#f87171',
};

const TYPE_LABELS: Record<DebugLog['type'], string> = {
  req: 'REQ',
  res: 'RES',
  info: 'INFO',
  error: 'ERR',
};

export function DebugPanel() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending, error } = useSession();

  useEffect(() => {
    const handler = (log: DebugLog) => {
      setLogs((prev) => [...prev.slice(-99), log]);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleLogExpand = (id: number) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="debug-panel">
      <div
        className="debug-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <span className="debug-title">
          🔍 Debug Panel
          <span className="debug-badge">{logs.length}</span>
        </span>
        <div className="debug-header-actions">
          {expanded && (
            <button
              className="debug-clear"
              onClick={(e) => {
                e.stopPropagation();
                setLogs([]);
              }}
            >
              Clear
            </button>
          )}
          <span className="debug-toggle">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <>
          <div className="debug-session-bar">
            <span className="debug-label">Session:</span>
            {isPending ? (
              <span className="debug-status pending">loading...</span>
            ) : error ? (
              <span className="debug-status error">error: {String(error)}</span>
            ) : session?.user ? (
              <span className="debug-status active">
                ✓ {session.user.name} ({session.user.email})
              </span>
            ) : (
              <span className="debug-status none">no session</span>
            )}
          </div>

          <div className="debug-logs" ref={scrollRef}>
            {logs.length === 0 && (
              <div className="debug-empty">
                No logs yet. Interact with the auth forms to see requests.
              </div>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                className={`debug-log debug-log-${log.type}`}
                onClick={() => log.data && toggleLogExpand(log.id)}
                role={log.data ? 'button' : undefined}
                tabIndex={log.data ? 0 : undefined}
              >
                <span className="debug-time">{log.time}</span>
                <span
                  className="debug-type"
                  style={{ color: TYPE_COLORS[log.type] }}
                >
                  [{TYPE_LABELS[log.type]}]
                </span>
                <span className="debug-msg">{log.message}</span>
                {log.data && (
                  <span className="debug-expand-hint">
                    {expandedLogs.has(log.id) ? '▾' : '▸'}
                  </span>
                )}
                {log.data && expandedLogs.has(log.id) && (
                  <pre className="debug-data">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
