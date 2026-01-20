import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Save, Send, CheckCircle, Download, FileDown, AlertCircle, UserCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface FieldValues {
  purchaser_name?: string;
  purchaser_email?: string;
  purchaser_street?: string;
  purchaser_city?: string;
  purchaser_state?: string;
  purchaser_zip?: string;
  seller_name?: string;
  seller_email?: string;
  seller_street?: string;
  seller_city?: string;
  seller_state?: string;
  seller_zip?: string;
  // Chairman of the Board (Agreed & Acknowledged)
  chairman_name?: string;
  chairman_title?: string;
  chairman_email?: string;
  input_mode?: "amount" | "shares";
  purchase_amount?: number;
  number_of_shares?: number;
  // Investor certification fields
  is_sophisticated_investor?: boolean;
  accredited_net_worth?: boolean;
  accredited_income?: boolean;
  accredited_director?: boolean;
  accredited_other?: boolean;
  accredited_other_text?: string;
}

interface ComputedValues {
  price_per_share?: number;
  rounding_mode?: "whole_share" | "two_decimals";
  min_investment_amount?: number;
  min_shares?: number;
  computed_purchase_amount?: number;
  computed_number_of_shares?: number;
}

interface LegalDocFormProps {
  fieldValues: FieldValues;
  computedValues: ComputedValues;
  isAdmin: boolean;
  status: string;
  onFieldChange: (field: keyof FieldValues, value: any) => void;
  onComputedChange: (field: keyof ComputedValues, value: any) => void;
  onSaveDraft: () => void;
  onSubmitForReview: () => void;
  onFinalize?: () => void;
  onExport?: (format: 'pdf' | 'docx') => void;
  isSaving?: boolean;
  onUseDefaults?: () => void;
}

export function LegalDocForm({
  fieldValues,
  computedValues,
  isAdmin,
  status,
  onFieldChange,
  onComputedChange,
  onSaveDraft,
  onSubmitForReview,
  onFinalize,
  onExport,
  isSaving,
  onUseDefaults,
}: LegalDocFormProps) {
  const [localAmount, setLocalAmount] = useState<string>(
    fieldValues.purchase_amount?.toString() || ""
  );
  const [localShares, setLocalShares] = useState<string>(
    fieldValues.number_of_shares?.toString() || ""
  );

  const inputMode = fieldValues.input_mode || "amount";
  const pricePerShare = computedValues.price_per_share || 0;
  const roundingMode = computedValues.rounding_mode || "whole_share";

  // Calculate dependent field
  const calculateShares = useCallback((amount: number): number => {
    if (!pricePerShare || pricePerShare <= 0) return 0;
    const shares = amount / pricePerShare;
    return roundingMode === "whole_share" ? Math.floor(shares) : Math.round(shares * 100) / 100;
  }, [pricePerShare, roundingMode]);

  const calculateAmount = useCallback((shares: number): number => {
    return shares * pricePerShare;
  }, [pricePerShare]);

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setLocalAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onFieldChange("purchase_amount", numValue);
      const calculatedShares = calculateShares(numValue);
      onComputedChange("computed_number_of_shares", calculatedShares);
      setLocalShares(calculatedShares.toString());
    }
  };

  // Handle shares change
  const handleSharesChange = (value: string) => {
    setLocalShares(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onFieldChange("number_of_shares", numValue);
      const calculatedAmount = calculateAmount(numValue);
      onComputedChange("computed_purchase_amount", calculatedAmount);
      setLocalAmount(calculatedAmount.toFixed(2));
    }
  };

  // Reset computed fields when mode changes
  useEffect(() => {
    if (inputMode === "amount" && localAmount) {
      const numValue = parseFloat(localAmount);
      if (!isNaN(numValue) && numValue > 0) {
        const calculatedShares = calculateShares(numValue);
        onComputedChange("computed_number_of_shares", calculatedShares);
        setLocalShares(calculatedShares.toString());
      }
    } else if (inputMode === "shares" && localShares) {
      const numValue = parseFloat(localShares);
      if (!isNaN(numValue) && numValue > 0) {
        const calculatedAmount = calculateAmount(numValue);
        onComputedChange("computed_purchase_amount", calculatedAmount);
        setLocalAmount(calculatedAmount.toFixed(2));
      }
    }
  }, [inputMode, pricePerShare, roundingMode]);

  const isFinalized = status === "finalized";
  const isSubmitted = status === "submitted" || status === "admin_review";
  const canEdit = !isFinalized && (isAdmin || status === "draft" || status === "pending");
  const canExport = isFinalized || (isAdmin && isSubmitted);

  return (
    <div className="space-y-6 p-6">
      {/* Finalized Lock Alert */}
      {isFinalized && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            This agreement has been finalized and is now read-only. You can export the final document.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Investment Details</h2>
        <Badge variant={
          status === "draft" ? "secondary" :
          status === "submitted" ? "default" :
          status === "admin_review" ? "outline" :
          "default"
        }>
          {status === "draft" && "Draft"}
          {status === "submitted" && "Submitted"}
          {status === "admin_review" && "Under Review"}
          {status === "finalized" && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Finalized
            </span>
          )}
        </Badge>
      </div>

      {/* Use Defaults Button - Admin Only */}
      {isAdmin && onUseDefaults && !isFinalized && (
        <Button variant="outline" onClick={onUseDefaults} className="w-full">
          <UserCheck className="h-4 w-4 mr-2" />
          Use Default Test Data
        </Button>
      )}

      {/* Seller Info Section - Admin Only */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Seller Information
              <Badge variant="outline" className="text-xs">Admin Only</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seller_name">Seller Name</Label>
              <Input
                id="seller_name"
                value={fieldValues.seller_name || ""}
                onChange={(e) => onFieldChange("seller_name", e.target.value)}
                placeholder="Enter seller's full legal name"
                disabled={isFinalized}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller_email">Seller Email</Label>
              <Input
                id="seller_email"
                type="email"
                value={fieldValues.seller_email || ""}
                onChange={(e) => onFieldChange("seller_email", e.target.value)}
                placeholder="seller@example.com"
                disabled={isFinalized}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller_street">Street Address</Label>
              <Input
                id="seller_street"
                value={fieldValues.seller_street || ""}
                onChange={(e) => onFieldChange("seller_street", e.target.value)}
                placeholder="123 Main Street"
                disabled={isFinalized}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="seller_city">City</Label>
                <Input
                  id="seller_city"
                  value={fieldValues.seller_city || ""}
                  onChange={(e) => onFieldChange("seller_city", e.target.value)}
                  placeholder="City"
                  disabled={isFinalized}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller_state">State</Label>
                <Input
                  id="seller_state"
                  value={fieldValues.seller_state || ""}
                  onChange={(e) => onFieldChange("seller_state", e.target.value)}
                  placeholder="CA"
                  disabled={isFinalized}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller_zip">ZIP</Label>
                <Input
                  id="seller_zip"
                  value={fieldValues.seller_zip || ""}
                  onChange={(e) => onFieldChange("seller_zip", e.target.value)}
                  placeholder="90210"
                  disabled={isFinalized}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chairman of the Board Section - Admin Only (Agreed & Acknowledged) */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Chairman of the Board
              <Badge variant="outline" className="text-xs">Admin Only</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">For the "Agreed and Acknowledged" signature section</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chairman_name">Chairman Name</Label>
              <Input
                id="chairman_name"
                value={fieldValues.chairman_name || ""}
                onChange={(e) => onFieldChange("chairman_name", e.target.value)}
                placeholder="Enter Chairman's full name"
                disabled={isFinalized}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chairman_title">Chairman Title</Label>
              <Input
                id="chairman_title"
                value={fieldValues.chairman_title || "Chairman of the Board"}
                onChange={(e) => onFieldChange("chairman_title", e.target.value)}
                placeholder="Chairman of the Board"
                disabled={isFinalized}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chairman_email">Chairman Email (for signature request)</Label>
              <Input
                id="chairman_email"
                type="email"
                value={fieldValues.chairman_email || ""}
                onChange={(e) => onFieldChange("chairman_email", e.target.value)}
                placeholder="chairman@company.com"
                disabled={isFinalized}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchaser Info Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Purchaser Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purchaser_name">Purchaser Name</Label>
            <Input
              id="purchaser_name"
              value={fieldValues.purchaser_name || ""}
              onChange={(e) => onFieldChange("purchaser_name", e.target.value)}
              placeholder="Enter full legal name"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchaser_email">Purchaser Email</Label>
            <Input
              id="purchaser_email"
              type="email"
              value={fieldValues.purchaser_email || ""}
              onChange={(e) => onFieldChange("purchaser_email", e.target.value)}
              placeholder="purchaser@example.com"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchaser_street">Street Address</Label>
            <Input
              id="purchaser_street"
              value={fieldValues.purchaser_street || ""}
              onChange={(e) => onFieldChange("purchaser_street", e.target.value)}
              placeholder="123 Main Street"
              disabled={!canEdit}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="purchaser_city">City</Label>
              <Input
                id="purchaser_city"
                value={fieldValues.purchaser_city || ""}
                onChange={(e) => onFieldChange("purchaser_city", e.target.value)}
                placeholder="City"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaser_state">State</Label>
              <Input
                id="purchaser_state"
                value={fieldValues.purchaser_state || ""}
                onChange={(e) => onFieldChange("purchaser_state", e.target.value)}
                placeholder="CA"
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaser_zip">ZIP</Label>
              <Input
                id="purchaser_zip"
                value={fieldValues.purchaser_zip || ""}
                onChange={(e) => onFieldChange("purchaser_zip", e.target.value)}
                placeholder="90210"
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Details Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Investment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Per Share - Editable for Admin, Read-only for purchasers */}
          <div className="space-y-2">
            <Label htmlFor="price_per_share" className="flex items-center gap-2">
              Price Per Share
              {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
              {isAdmin && <Badge variant="outline" className="text-xs">Admin Only</Badge>}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price_per_share"
                type="number"
                step="0.01"
                min="0.01"
                value={computedValues.price_per_share || ""}
                onChange={(e) => onComputedChange("price_per_share", parseFloat(e.target.value))}
                className="pl-7"
                placeholder="Enter price per share"
                disabled={!isAdmin || isFinalized}
              />
            </div>
            {!isAdmin ? (
              <p className="text-xs text-muted-foreground">
                Price per share is set by the Company and cannot be changed.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Set the price per share. Shares will auto-calculate when purchaser enters investment amount.
              </p>
            )}
            {isAdmin && !computedValues.price_per_share && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You must set a Price Per Share before the purchaser can complete their investment details.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Admin: Rounding Mode */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Rounding Mode</Label>
              <RadioGroup
                value={roundingMode}
                onValueChange={(value) => onComputedChange("rounding_mode", value)}
                className="flex gap-4"
                disabled={isFinalized}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whole_share" id="whole_share" />
                  <Label htmlFor="whole_share" className="font-normal">Whole Shares</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="two_decimals" id="two_decimals" />
                  <Label htmlFor="two_decimals" className="font-normal">2 Decimals</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="space-y-2">
            <Label>I want to enter</Label>
            <RadioGroup
              value={inputMode}
              onValueChange={(value) => onFieldChange("input_mode", value)}
              className="flex gap-4"
              disabled={!canEdit}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amount" id="amount_mode" />
                <Label htmlFor="amount_mode" className="font-normal">Investment Amount ($)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shares" id="shares_mode" />
                <Label htmlFor="shares_mode" className="font-normal">Number of Shares</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="purchase_amount" className="flex items-center gap-2">
              Investment Amount
              {inputMode === "shares" && <span className="text-xs text-muted-foreground">(calculated)</span>}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="purchase_amount"
                type="number"
                step="0.01"
                min="0"
                value={localAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-7"
                disabled={!canEdit || inputMode === "shares"}
              />
            </div>
          </div>

          {/* Shares Field */}
          <div className="space-y-2">
            <Label htmlFor="number_of_shares" className="flex items-center gap-2">
              Number of Shares
              {inputMode === "amount" && <span className="text-xs text-muted-foreground">(calculated)</span>}
            </Label>
            <Input
              id="number_of_shares"
              type="number"
              step={roundingMode === "whole_share" ? "1" : "0.01"}
              min="0"
              value={localShares}
              onChange={(e) => handleSharesChange(e.target.value)}
              disabled={!canEdit || inputMode === "amount"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Investor Certification Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Exhibit B: Accredited Investor Certification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sophisticated Investor Checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="is_sophisticated_investor"
              checked={fieldValues.is_sophisticated_investor || false}
              onCheckedChange={(checked) => onFieldChange("is_sophisticated_investor", checked)}
              disabled={!canEdit}
            />
            <Label htmlFor="is_sophisticated_investor" className="font-normal text-sm leading-relaxed">
              The investor is acquiring the Shares as a Sophisticated Investor in a private shareholder-to-shareholder transaction exempt under Section 4(a)(1) of the Securities Act of 1933.
            </Label>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-3">Please check all applicable boxes indicating your status as an Accredited Investor:</p>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="accredited_net_worth"
                  checked={fieldValues.accredited_net_worth || false}
                  onCheckedChange={(checked) => onFieldChange("accredited_net_worth", checked)}
                  disabled={!canEdit}
                />
                <Label htmlFor="accredited_net_worth" className="font-normal text-sm leading-relaxed">
                  Individual with net worth (or joint net worth with spouse) exceeding $1,000,000, excluding primary residence
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="accredited_income"
                  checked={fieldValues.accredited_income || false}
                  onCheckedChange={(checked) => onFieldChange("accredited_income", checked)}
                  disabled={!canEdit}
                />
                <Label htmlFor="accredited_income" className="font-normal text-sm leading-relaxed">
                  Individual with income exceeding $200,000 in each of the two most recent years (or joint income with spouse exceeding $300,000) with reasonable expectation of reaching the same income level in the current year
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="accredited_director"
                  checked={fieldValues.accredited_director || false}
                  onCheckedChange={(checked) => onFieldChange("accredited_director", checked)}
                  disabled={!canEdit}
                />
                <Label htmlFor="accredited_director" className="font-normal text-sm leading-relaxed">
                  Director, executive officer, or general partner of the issuer
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="accredited_other"
                  checked={fieldValues.accredited_other || false}
                  onCheckedChange={(checked) => onFieldChange("accredited_other", checked)}
                  disabled={!canEdit}
                />
                <Label htmlFor="accredited_other" className="font-normal text-sm">
                  Other (please specify):
                </Label>
              </div>
              
              {fieldValues.accredited_other && (
                <Input
                  value={fieldValues.accredited_other_text || ""}
                  onChange={(e) => onFieldChange("accredited_other_text", e.target.value)}
                  placeholder="Please specify..."
                  className="ml-6"
                  disabled={!canEdit}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {canEdit && !isAdmin && (
          <>
            <Button onClick={onSaveDraft} variant="outline" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={onSubmitForReview} disabled={isSaving}>
              <Send className="h-4 w-4 mr-2" />
              Submit for Admin Review
            </Button>
          </>
        )}
        
        {isAdmin && !isFinalized && (
          <>
            <Button onClick={onSaveDraft} variant="outline" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            {onFinalize && (
              <Button onClick={onFinalize} disabled={isSaving}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {status === "draft" ? "Send Agreement" : "Finalize Agreement"}
              </Button>
            )}
          </>
        )}

        {/* Export buttons when finalized or for admin during review */}
        {onExport && canExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Document
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport('pdf')}>
                <FileDown className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('docx')}>
                <FileDown className="h-4 w-4 mr-2" />
                Export as DOCX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
