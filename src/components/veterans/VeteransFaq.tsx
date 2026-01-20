import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What is an Intent to File?",
    answer: "An Intent to File is a simple notice that tells the VA you plan to submit a disability claim. It locks in your effective date so you don't lose potential back pay while you gather evidence and complete your claim.",
  },
  {
    question: "Who is this hub for?",
    answer: "This hub is designed for active duty service members, veterans, Guard and Reserve, military spouses and caregivers, and federal civilian employees who want to better understand and maximize their benefits.",
  },
  {
    question: "Can I use this if I'm still on active duty or about to separate?",
    answer: "Yes. In fact, starting early is one of the best ways to protect your benefits. The tools and AI Claims Agent can help you understand options and prepare long before you're in crisis.",
  },
  {
    question: "Does Seeksy file my claim with the VA?",
    answer: "Seeksy helps you get organized, understand the process, and generate a clean summary of your situation. With your permission, we securely share that summary with an accredited claims partner who can help you complete and submit your claim.",
  },
  {
    question: "What information do I need to get started?",
    answer: "You don't need much. Your service history, a general idea of your conditions or symptoms, and whether you've already filed anything with the VA is enough to begin. You can always add more detail later.",
  },
  {
    question: "Will my information be saved?",
    answer: "If you create an account and are signed in, your calculators, claim answers, and key notes can be securely saved and reused, so you don't have to start from scratch every time.",
  },
];

export function VeteransFaq() {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full mb-4">
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Common Questions</span>
        </div>
        <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
