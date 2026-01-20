import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is Seeksy free to start?",
    answer: "Yes! Seeksy offers a free forever plan that includes core features like basic analytics, booking pages, and limited recording time. You can upgrade anytime to unlock more features.",
  },
  {
    question: "Can I connect multiple social accounts?",
    answer: "Absolutely. Connect Instagram, YouTube, TikTok, Facebook, and more. All your analytics are unified in one dashboard for easy comparison and tracking.",
  },
  {
    question: "Do I need equipment to use the studio?",
    answer: "No special equipment needed. Our browser-based studio works with your existing webcam and microphone. For best results, we recommend a decent USB microphone, but it is not required.",
  },
  {
    question: "How does the Media Kit work?",
    answer: "Your media kit is automatically generated from your connected social accounts and analytics. It includes follower counts, engagement rates, audience demographics, and suggested sponsorship rates. Export as a professional PDF to share with brands.",
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. We use bank-level encryption, never sell your data, and our identity verification uses blockchain technology for tamper-proof authentication.",
  },
];

export function FAQSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about Seeksy
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-5 data-[state=open]:shadow-sm transition-shadow"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4 text-sm">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
