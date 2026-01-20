import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleCenterModal } from "@/components/modules";

/**
 * ModuleCenter page - renders as a full-screen modal
 * This wrapper allows direct navigation to /module-center while
 * using the modal component for consistent UI
 */
export default function ModuleCenter() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  return <ModuleCenterModal isOpen={true} onClose={handleClose} />;
}
