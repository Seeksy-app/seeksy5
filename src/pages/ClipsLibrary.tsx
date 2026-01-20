import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// This page now redirects directly to ClipsStudio to reduce clicks
export default function ClipsLibrary() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect immediately to clips studio - the studio IS the home for AI Clips
    navigate('/clips-studio', { replace: true });
  }, [navigate]);

  return null;
}
