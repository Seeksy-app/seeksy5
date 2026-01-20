import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyBriefModal } from './DailyBriefModal';
import { useNavigate } from 'react-router-dom';

interface DailyBriefButtonProps {
  audienceType?: 'ceo' | 'board' | 'investor' | 'creator';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  mode?: 'modal' | 'page';
}

export function DailyBriefButton({ 
  audienceType = 'creator',
  variant = 'outline',
  size = 'default',
  className,
  mode = 'modal'
}: DailyBriefButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (mode === 'page') {
      navigate('/daily-brief');
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        <Newspaper className="w-4 h-4 mr-2" />
        Daily Brief
      </Button>
      
      {mode === 'modal' && (
        <DailyBriefModal 
          open={isOpen} 
          onOpenChange={setIsOpen}
          audienceType={audienceType}
        />
      )}
    </>
  );
}
