import { Navigate } from 'react-router-dom';
import { useSession } from '../features/auth/index.js';

export const ProtectedRoute = ({ children }) => {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
};
