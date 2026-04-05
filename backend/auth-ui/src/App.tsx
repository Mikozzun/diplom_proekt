import { useState, useEffect } from 'react';
import { useSession } from './lib/auth-client';
import { SignInForm } from './components/SignInForm';
import { SignUpForm } from './components/SignUpForm';
import { Dashboard } from './components/Dashboard';
import { DebugPanel, pushLog } from './components/DebugPanel';
import './App.css';

type AuthView = 'signin' | 'signup';

function App() {
  const { data: session, isPending, error } = useSession();
  const [view, setView] = useState<AuthView>('signin');

  useEffect(() => {
    pushLog('info', 'App mounted — fetching session...');
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (error) {
      pushLog('error', 'Session fetch failed', { error: String(error) });
    } else if (session?.user) {
      pushLog('info', `Session active: ${session.user.name}`, session);
    } else {
      pushLog('info', 'No active session');
    }
  }, [isPending, session, error]);

  if (isPending) {
    return (
      <div className="auth-container">
        <div className="auth-loading">Loading...</div>
        <DebugPanel />
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="auth-container">
        <Dashboard />
        <DebugPanel />
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">🐸 Frogger</div>
        {view === 'signin' ? (
          <SignInForm
            onSwitch={() => setView('signup')}
            onSuccess={() => window.location.reload()}
          />
        ) : (
          <SignUpForm
            onSwitch={() => setView('signin')}
            onSuccess={() => window.location.reload()}
          />
        )}
      </div>
      <DebugPanel />
    </div>
  );
}

export default App;
