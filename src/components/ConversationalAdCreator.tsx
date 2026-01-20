import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

interface ConversationalAdCreatorProps {
  onSave: (config: {
    agentId: string;
    phoneNumber: string;
    phoneNumberType: 'shared' | 'custom';
    faqs: FAQ[];
    instructions: string;
    trainingUrls: string[];
  }) => void;
  isLoading: boolean;
}

export const ConversationalAdCreator = ({ onSave, isLoading }: ConversationalAdCreatorProps) => {
  const { toast } = useToast();
  const [agentId, setAgentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+1 202 952 1925");
  const [phoneNumberType, setPhoneNumberType] = useState<'shared' | 'custom'>('shared');
  const [instructions, setInstructions] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([{ question: "", answer: "" }]);
  const [trainingUrls, setTrainingUrls] = useState<string[]>([""]);

  const addFAQ = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const addUrl = () => {
    setTrainingUrls([...trainingUrls, ""]);
  };

  const removeUrl = (index: number) => {
    setTrainingUrls(trainingUrls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, value: string) => {
    const updated = [...trainingUrls];
    updated[index] = value;
    setTrainingUrls(updated);
  };

  const handleSave = () => {
    const validFaqs = faqs.filter(faq => faq.question.trim() && faq.answer.trim());
    
    if (validFaqs.length === 0) {
      toast({
        title: "FAQs required",
        description: "Please add at least one FAQ.",
        variant: "destructive",
      });
      return;
    }

    const validUrls = trainingUrls.filter(url => url.trim());

    onSave({
      agentId: agentId.trim(),
      phoneNumber: phoneNumber.trim(),
      phoneNumberType,
      faqs: validFaqs,
      instructions: instructions.trim(),
      trainingUrls: validUrls,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversational AI Configuration</CardTitle>
        <CardDescription>
          Set up an interactive voice conversation for your ad. Callers can ask questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Phone Number Option</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Card 
                className={`p-4 cursor-pointer transition-colors ${phoneNumberType === 'shared' ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setPhoneNumberType('shared')}
              >
                <div className="font-semibold mb-1">Shared Demo Number</div>
                <div className="text-2xl font-bold text-primary mb-2">FREE</div>
                <p className="text-sm text-muted-foreground">
                  Use our shared demo number for testing
                </p>
              </Card>
              <Card 
                className={`p-4 cursor-pointer transition-colors ${phoneNumberType === 'custom' ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setPhoneNumberType('custom')}
              >
                <div className="font-semibold mb-1">Custom Number</div>
                <div className="text-2xl font-bold text-primary mb-2">$10/mo</div>
                <p className="text-sm text-muted-foreground">
                  Use your own dedicated phone number
                </p>
              </Card>
            </div>
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 202 952 1925"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {phoneNumberType === 'shared' 
                ? 'Using shared demo number (can be modified)' 
                : 'Enter your custom ElevenLabs phone number'}
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-sm">
            <div className="font-semibold mb-2">Conversational Ad Pricing:</div>
            <ul className="space-y-1">
              <li>• Agent Setup: <strong>$50</strong> one-time fee</li>
              <li>• Phone: <strong>FREE</strong> (shared) or <strong>$10/mo</strong> (custom)</li>
              <li>• Usage: <strong>$0.25/minute</strong> per conversation</li>
              <li>• Minimum 1 minute per call, real-time billing</li>
            </ul>
          </div>
        </div>

        <div>
          <Label htmlFor="agentId">ElevenLabs Agent ID (Optional)</Label>
          <Input
            id="agentId"
            placeholder="Enter your ElevenLabs Agent ID"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            If using your own phone number, create an agent at <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">elevenlabs.io/app/conversational-ai</a>
          </p>
        </div>

        <div>
          <Label htmlFor="instructions">Agent Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            placeholder="Additional instructions for how the agent should behave..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Training URLs (Optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUrl}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add URL
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Add website URLs or documentation that the AI agent should learn from
          </p>
          <div className="space-y-2">
            {trainingUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://example.com/product-info"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                />
                {trainingUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUrl(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Frequently Asked Questions</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFAQ}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add FAQ
            </Button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor={`question-${index}`}>Question</Label>
                      <Input
                        id={`question-${index}`}
                        placeholder="What's the return policy?"
                        value={faq.question}
                        onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`answer-${index}`}>Answer</Label>
                      <Textarea
                        id={`answer-${index}`}
                        placeholder="We offer a 30-day money-back guarantee..."
                        value={faq.answer}
                        onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {faqs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFAQ(index)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Configuration...
            </>
          ) : (
            "Save Conversational Ad"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
