import { Navigate } from 'react-router-dom';

// Board AI Analyst is now a slide-out panel accessible from any Board page
// This page redirects to the dashboard where the floating AI button is available
export default function BoardAIAnalyst() {
  return <Navigate to="/board" replace />;
}
