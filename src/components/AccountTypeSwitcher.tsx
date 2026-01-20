import { useAccountType, type AccountType } from '@/hooks/useAccountType';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const accountTypeLabels: Record<AccountType, string> = {
  creator: 'Creator',
  podcaster: 'Podcaster',
  advertiser: 'Advertiser',
  agency: 'Agency',
  event_planner: 'Event Planner',
  brand: 'Brand',
  studio_team: 'Studio Team',
  admin: 'Admin',
  influencer: 'Influencer',
};

export function AccountTypeSwitcher() {
  const { activeAccountType, accountTypesEnabled, switchAccountType, isSwitching } = useAccountType();
  const navigate = useNavigate();

  if (!activeAccountType || accountTypesEnabled.length === 0) {
    return null;
  }

  // Don't show switcher if user only has one account type
  if (accountTypesEnabled.length === 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isSwitching}>
          <span className="font-medium">
            {accountTypeLabels[activeAccountType]}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Account Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountTypesEnabled.map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => {
              if (type !== activeAccountType) {
                switchAccountType(type as AccountType);
              }
            }}
            className="cursor-pointer"
          >
            <span className="flex-1">{accountTypeLabels[type as AccountType]}</span>
            {type === activeAccountType && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate('/onboarding')}
          className="cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account Type
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
