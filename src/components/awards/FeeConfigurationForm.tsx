import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface FeeConfig {
  pass_on_percentage_fee: boolean;
  pass_on_ach_fee: boolean;
}

interface FeeConfigurationFormProps {
  registrationFee: number;
  onChange: (registrationFee: number, config: FeeConfig) => void;
}

export function FeeConfigurationForm({
  registrationFee,
  onChange,
}: FeeConfigurationFormProps) {
  const [fee, setFee] = useState(registrationFee);
  const [passOnPercentageFee, setPassOnPercentageFee] = useState(true);
  const [passOnAchFee, setPassOnAchFee] = useState(true);

  const handleFeeChange = (newFee: number) => {
    setFee(newFee);
    onChange(newFee, {
      pass_on_percentage_fee: passOnPercentageFee,
      pass_on_ach_fee: passOnAchFee,
    });
  };

  const handleConfigChange = (newConfig: Partial<FeeConfig>) => {
    const updatedPassOnPercentage = newConfig.pass_on_percentage_fee ?? passOnPercentageFee;
    const updatedPassOnAch = newConfig.pass_on_ach_fee ?? passOnAchFee;
    
    setPassOnPercentageFee(updatedPassOnPercentage);
    setPassOnAchFee(updatedPassOnAch);
    
    onChange(fee, {
      pass_on_percentage_fee: updatedPassOnPercentage,
      pass_on_ach_fee: updatedPassOnAch,
    });
  };

  // Calculate fees
  const percentageFee = fee * 0.04;
  const achFee = 10.95;
  const totalFeesIfNotPassed = percentageFee + achFee;
  
  // Calculate what customer pays and what creator receives
  const customerPays = fee + 
    (passOnPercentageFee ? percentageFee : 0) + 
    (passOnAchFee ? achFee : 0);
  
  const creatorReceives = fee - 
    (passOnPercentageFee ? 0 : percentageFee) - 
    (passOnAchFee ? 0 : achFee);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Registration Fee</h3>

        {/* Fee Type */}
        <div className="space-y-4 mb-6">
          <Label>Registration Type</Label>
          <RadioGroup
            value={fee > 0 ? "paid" : "free"}
            onValueChange={(value) => handleFeeChange(value === "paid" ? 100 : 0)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="free" id="free" />
              <Label htmlFor="free" className="font-normal cursor-pointer">
                Free - No registration fee
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paid" id="paid" />
              <Label htmlFor="paid" className="font-normal cursor-pointer">
                Paid - Charge a registration fee
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Registration Fee Amount */}
        {fee > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registration_fee">Registration Fee ($)</Label>
              <Input
                id="registration_fee"
                type="number"
                min="0"
                step="0.01"
                value={fee}
                onChange={(e) => handleFeeChange(parseFloat(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                Fee charged to attendees registering for the ceremony
              </p>
            </div>

            {/* Pass On Fees */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Fee Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pass_percentage"
                    checked={passOnPercentageFee}
                    onChange={(e) => handleConfigChange({ pass_on_percentage_fee: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="pass_percentage" className="font-normal cursor-pointer">
                    Pass on 4% processing fee to attendees
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pass_ach"
                    checked={passOnAchFee}
                    onChange={(e) => handleConfigChange({ pass_on_ach_fee: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="pass_ach" className="font-normal cursor-pointer">
                    Pass on $10.95 ACH fee to attendees
                  </Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Unchecked fees will be deducted from your payout
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Fee Breakdown Example */}
      {fee > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Fee Breakdown: ${fee.toFixed(2)} Registration</p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Registration Fee:</span>
                  <span className="font-semibold">${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>4% Processing Fee:</span>
                  <span>{passOnPercentageFee ? "(passed to attendees)" : `-$${percentageFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>$10.95 ACH Fee:</span>
                  <span>{passOnAchFee ? "(passed to attendees)" : `-$${achFee.toFixed(2)}`}</span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="font-semibold">Attendee Pays:</span>
                  <span className="font-bold text-blue-600">${customerPays.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">You Receive:</span>
                  <span className="font-bold text-green-600">${creatorReceives.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All funds are held until 5 business days after the awards ceremony,
                then automatically paid to your connected Stripe account.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
