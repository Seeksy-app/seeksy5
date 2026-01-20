import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Mia, an AI venue manager assistant. You help venue owners and staff with:

1. **Pricing Strategies**: Suggest pricing based on event type, guest count, season, and market rates.
2. **Package Creation**: Help design event packages for weddings, corporate events, parties, etc.
3. **Client Communications**: Draft professional emails, follow-ups, and proposals.
4. **Marketing Ideas**: Provide creative marketing strategies for filling slow periods.
5. **Influencer Outreach**: Help craft messages to invite influencers to feature the venue.
6. **Event Planning**: Offer tips for event logistics, vendor coordination, and timelines.

Guidelines:
- Speak at an 8th-10th grade reading level - clear and practical, not overly formal.
- Always be helpful, friendly, and solution-oriented.
- End responses with actionable next steps when appropriate.
- If asked about something outside your expertise, acknowledge it and redirect to relevant help.
- Keep responses concise but comprehensive.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format messages for Gemini
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Call Lovable AI (Gemini)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${Deno.env.get("GEMINI_API_KEY") || ""}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: formattedMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      // Fallback to a helpful default response
      const fallbackResponse = generateFallbackResponse(messages[messages.length - 1]?.content || "");
      return new Response(
        JSON.stringify({ reply: fallbackResponse }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I apologize, but I couldn't process that request. Could you please try rephrasing?";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Venue AI Manager error:", error);
    return new Response(
      JSON.stringify({ 
        reply: "I'm having a brief technical issue. Please try again in a moment, or let me know how else I can help with your venue!" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes("pricing") || lowerMessage.includes("price") || lowerMessage.includes("cost")) {
    return `Great question about pricing! Here are some general guidelines:

**Wedding Receptions (150 guests)**
- Venue rental: $3,000 - $8,000
- Consider peak vs. off-peak rates
- Include furniture, basic AV in base price

**Tips for setting rates:**
1. Research 3-5 competitors in your area
2. Factor in your unique amenities
3. Offer tiered packages (Basic, Premium, All-Inclusive)

Would you like me to help you create a specific pricing structure for your venue?`;
  }
  
  if (lowerMessage.includes("email") || lowerMessage.includes("follow")) {
    return `Here's a follow-up email template:

---
**Subject: Following up on your visit to [Venue Name]**

Hi [Client Name],

It was wonderful meeting you last [day]! I hope you enjoyed touring our venue.

I wanted to check in and see if you have any questions about hosting your [event type] with us. We'd love to be part of your special day.

As a reminder, we're currently offering [mention any promotions] for [season] bookings.

Would you like to schedule a call to discuss next steps?

Best regards,
[Your Name]

---

Would you like me to customize this for a specific client?`;
  }
  
  if (lowerMessage.includes("influencer") || lowerMessage.includes("creator")) {
    return `Here's how to approach influencer partnerships:

**Outreach Template:**
"Hi [Name], I love your content showcasing [niche]! We think our venue would be a perfect fit for your audience. Would you be interested in a complimentary visit to experience and share [Venue Name]?"

**What to offer:**
- Complimentary venue visit/dinner
- Photo opportunity access
- Potential paid partnership for larger creators

**What to ask for:**
- Instagram post + stories
- Tag and mention
- Honest review

Would you like me to help craft a personalized outreach message?`;
  }
  
  return `I'd be happy to help with that! Here are some things I can assist with:

• **Pricing & Packages** - Help you set competitive rates
• **Client Communications** - Draft emails and proposals
• **Marketing Ideas** - Creative ways to fill your calendar
• **Influencer Outreach** - Connect with local creators
• **Event Planning Tips** - Best practices for smooth events

What would you like to focus on? Just let me know the specifics!`;
}
