import { Navigate } from 'react-router-dom';

// Legacy Pro Forma page - redirects to AI-powered version
export default function BoardProForma() {
  return <Navigate to="/board/forecasts" replace />;
}