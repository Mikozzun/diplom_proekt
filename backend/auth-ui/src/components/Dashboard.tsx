import { authClient, useSession } from '../lib/auth-client';
import { pushLog } from './DebugPanel';

export function Dashboard() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    pushLog('req', 'POST /api/auth/sign-out');
    try {
      await authClient.signOut();
      pushLog('res', 'Sign-out successful');
    } catch (err) {
      pushLog('error', 'Sign-out failed', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    window.location.reload();
  };

  if (!session?.user) return null;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="user-card">
        {session.user.image && (
          <img src={session.user.image} alt="" className="user-avatar" />
        )}
        <div className="user-info">
          <h2>{session.user.name}</h2>
          <p className="user-email">{session.user.email}</p>
          <div className="user-meta">
            <span className="badge">ID: {session.user.id}</span>
            <span className="badge">
              Joined: {new Date(session.user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="session-info">
        <h3>Session</h3>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>

      <button className="auth-btn sign-out-btn" onClick={handleSignOut}>
        Sign Out
      </button>
    </div>
  );
}
