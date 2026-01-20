import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
}

export const BackButton = ({ href = "/identity", onClick, label = "Back to Identity" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(href);
    }
  };

  return (
    <Button variant="ghost" onClick={handleClick}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};
