import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function HeroManager() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the full hero generator page
    navigate("/admin/hero-generator", { replace: true });
  }, [navigate]);
  
  return null;
}
