import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const SeeksyArchitecture = () => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const architectureDiagram = `graph TD
    subgraph Users["User Types"]
        Organizer["👤 Organizer<br/>(Creates Seeksies)"]
        Participant["👥 Participant<br/>(Books meetings)"]
        Admin["⚙️ Admin<br/>(Manages platform)"]
    end

    subgraph Core["Seeksy Core Platform"]
        Auth["🔐 Authentication<br/>& Authorization"]
        Profile["👤 User Profiles<br/>username.seeksy.io"]
        Builder["🔨 Seeksy Builder<br/>(Workflow Creator)"]
        BookingEngine["📅 Booking Engine"]
        CalendarEngine["🗓️ Calendar &<br/>Availability Engine"]
        AutomationEngine["⚡ Automation &<br/>Workflow Engine"]
        Analytics["📊 Analytics &<br/>Reporting"]
        Database["💾 Database<br/>(Supabase)"]
    end

    subgraph Integrations["External Integrations"]
        CalendarInt["📆 Calendar APIs<br/>(Google, Outlook)"]
        VideoInt["📹 Video Conferencing<br/>(Zoom, Meet, Teams)"]
        CRMInt["📊 CRM Systems<br/>(Salesforce, HubSpot)"]
        EmailInt["📧 Email Service<br/>(Resend)"]
        PaymentInt["💳 Payments<br/>(Stripe)"]
        NotifyInt["🔔 Notifications<br/>(Slack, SMS)"]
    end

    %% User interactions
    Organizer -->|Creates & Manages| Builder
    Organizer -->|Views| Analytics
    Participant -->|Books via| BookingEngine
    Participant -->|Views| Profile
    Admin -->|Manages| Auth

    %% Core platform flows
    Auth --> Profile
    Builder -->|Defines| BookingEngine
    Builder -->|Sets up| AutomationEngine
    BookingEngine -->|Checks| CalendarEngine
    BookingEngine -->|Triggers| AutomationEngine
    CalendarEngine -->|Syncs with| CalendarInt
    AutomationEngine -->|Sends via| EmailInt
    AutomationEngine -->|Creates in| CRMInt
    AutomationEngine -->|Books via| VideoInt
    AutomationEngine -->|Processes via| PaymentInt
    AutomationEngine -->|Notifies via| NotifyInt
    BookingEngine -->|Stores in| Database
    Analytics -->|Reads from| Database

    style Users fill:#e3f2fd
    style Core fill:#fff3e0
    style Integrations fill:#f3e5f5`;

  const creationFlowDiagram = `graph TD
    Start([👤 Organizer Starts]) --> SignUp{Has Account?}
    
    SignUp -->|No| Register["📝 Sign Up<br/>Email/OAuth"]
    SignUp -->|Yes| Login["🔑 Login"]
    Register --> Onboard["🎯 Onboarding<br/>Set username<br/>Choose plan"]
    Login --> Dashboard
    Onboard --> Dashboard["📊 Dashboard"]
    
    Dashboard --> ConnectCal["📆 Connect Calendar<br/>Google/Outlook"]
    ConnectCal --> CalendarSync["✅ Calendar Synced<br/>Import availability"]
    
    CalendarSync --> CreateSeesky["➕ Create New Seeksy"]
    
    CreateSeesky --> DefineBasics["📋 Define Basics<br/>• Name<br/>• Description<br/>• Duration<br/>• Type (1-on-1/Group/Event)"]
    
    DefineBasics --> SetAvailability["⏰ Set Availability<br/>• Weekly hours<br/>• Specific dates<br/>• Buffer times<br/>• Min notice"]
    
    SetAvailability --> ConfigureForm["📝 Configure Intake Form<br/>• Standard fields<br/>• Custom questions<br/>• Required/Optional<br/>• Conditional logic"]
    
    ConfigureForm --> SetupAutomations["⚡ Setup Automations<br/>• Confirmation emails<br/>• Reminders (before/after)<br/>• CRM updates<br/>• Zoom link creation<br/>• Payment collection"]
    
    SetupAutomations --> CustomizePage["🎨 Customize Booking Page<br/>• Branding<br/>• Colors/Logo<br/>• FAQs<br/>• Terms"]
    
    CustomizePage --> Review["👀 Review & Test<br/>Preview booking flow"]
    
    Review --> Publish{Publish?}
    Publish -->|No| DefineBasics
    Publish -->|Yes| Published["✅ Seeksy Published"]
    
    Published --> GetLink["🔗 Get Booking Link<br/>username.seeksy.io/meetingtype"]
    GetLink --> AddToProfile["➕ Add to Public Page<br/>username.seeksy.io"]
    AddToProfile --> ShareLink["📤 Share Link<br/>Email/Social/Website"]
    ShareLink --> Monitor["📊 Monitor Bookings<br/>View analytics"]
    
    Monitor --> EditSeesky["✏️ Edit Seeksy<br/>(anytime)"]
    EditSeesky --> DefineBasics

    style Start fill:#4caf50
    style Published fill:#2196f3
    style Monitor fill:#ff9800`;

  const bookingFlowDiagram = `graph TD
    Start([👥 Participant Visits Link]) --> Landing["🏠 Landing Page<br/>username.seeksy.io"]
    
    Landing --> ViewProfile["👤 View Organizer Profile<br/>• Bio<br/>• Photo<br/>• FAQs"]
    
    ViewProfile --> BrowseSeeksies["📋 Browse Available Seeksies<br/>• Meeting types<br/>• Durations<br/>• Descriptions"]
    
    BrowseSeeksies --> SelectType["✅ Select Seeksy Type<br/>(e.g., '30min Consultation')"]
    
    SelectType --> LoadAvailability["⏳ Loading Availability<br/>Check calendar slots"]
    
    LoadAvailability --> ShowCalendar["📅 Show Available Times<br/>• Next 30 days<br/>• Timezone selection<br/>• Buffer times applied"]
    
    ShowCalendar --> SelectTime["🕐 Select Time Slot<br/>Click preferred slot"]
    
    SelectTime --> IntakeForm["📝 Fill Intake Form<br/>• Name & Email<br/>• Phone (optional)<br/>• Custom questions<br/>• Special requests"]
    
    IntakeForm --> ValidateForm{Form Valid?}
    ValidateForm -->|No| IntakeForm
    ValidateForm -->|Yes| Payment{Payment Required?}
    
    Payment -->|Yes| ProcessPayment["💳 Process Payment<br/>Stripe checkout"]
    Payment -->|No| ConfirmBooking
    ProcessPayment --> PaymentSuccess{Payment OK?}
    PaymentSuccess -->|No| IntakeForm
    PaymentSuccess -->|Yes| ConfirmBooking
    
    ConfirmBooking["✅ Confirm Booking<br/>Create calendar event"]
    
    ConfirmBooking --> TriggerAutomations["⚡ Trigger Automations"]
    
    TriggerAutomations --> SendConfirmation["📧 Send Confirmation Email<br/>• Meeting details<br/>• Calendar invite<br/>• Zoom/Meet link"]
    TriggerAutomations --> CreateVideo["📹 Create Video Link<br/>(if configured)"]
    TriggerAutomations --> UpdateCRM["📊 Update CRM<br/>Add contact/deal"]
    TriggerAutomations --> AddTags["🏷️ Apply Tags<br/>Segment participant"]
    TriggerAutomations --> ScheduleReminders["⏰ Schedule Reminders<br/>• 24h before<br/>• 1h before<br/>• Post-meeting follow-up"]
    
    SendConfirmation --> ConfirmationPage["✅ Confirmation Page<br/>• Success message<br/>• Add to calendar<br/>• Reschedule/Cancel links"]
    CreateVideo --> ConfirmationPage
    UpdateCRM --> ConfirmationPage
    AddTags --> ConfirmationPage
    ScheduleReminders --> ConfirmationPage
    
    ConfirmationPage --> MeetingTime["⏱️ Meeting Time Arrives"]
    
    MeetingTime --> JoinMeeting["🎥 Join Meeting<br/>Click video link"]
    
    JoinMeeting --> PostMeeting["✅ Meeting Completed"]
    
    PostMeeting --> FollowUp["📧 Post-Meeting Automation<br/>• Thank you email<br/>• Survey/Feedback<br/>• Next steps<br/>• CRM update"]
    
    FollowUp --> End([✨ Process Complete])
    
    ConfirmationPage --> Reschedule{Need to<br/>Reschedule?}
    Reschedule -->|Yes| ShowCalendar
    Reschedule -->|No| Cancel{Need to<br/>Cancel?}
    Cancel -->|Yes| CancelFlow["❌ Cancel Booking<br/>• Send notifications<br/>• Free up slot<br/>• Refund (if applicable)"]
    Cancel -->|No| MeetingTime

    style Start fill:#4caf50
    style ConfirmationPage fill:#2196f3
    style End fill:#9c27b0
    style TriggerAutomations fill:#ff9800`;

  const automationEngineDiagram = `graph TD
    subgraph Triggers["⚡ Automation Triggers"]
        T1["📅 On Booking Created"]
        T2["⏰ X Hours Before Event"]
        T3["⏰ X Hours After Event"]
        T4["❌ On Cancellation"]
        T5["🔄 On Reschedule"]
    end
    
    subgraph Actions["🎯 Available Actions"]
        A1["📧 Send Email<br/>(Confirmation/Reminder)"]
        A2["📱 Send SMS<br/>(Text notification)"]
        A3["📊 Update CRM<br/>(Create/Update record)"]
        A4["🏷️ Add Tags<br/>(Segment contacts)"]
        A5["📹 Create Video Link<br/>(Zoom/Meet/Teams)"]
        A6["💳 Process Payment<br/>(Stripe charge)"]
        A7["🔔 Notify Team<br/>(Slack/Teams/Email)"]
        A8["📋 Add to Campaign<br/>(Email sequence)"]
        A9["🎯 Update Pipeline<br/>(Sales stage)"]
        A10["📅 Create Calendar Event<br/>(Organizer + Participant)"]
    end
    
    subgraph Conditions["🔍 Conditional Logic"]
        C1["If answer = X"]
        C2["If first booking"]
        C3["If VIP tag exists"]
        C4["If payment completed"]
    end
    
    T1 --> A1
    T1 --> A3
    T1 --> A4
    T1 --> A5
    T1 --> A6
    T1 --> A7
    T1 --> A10
    
    T2 --> A1
    T2 --> A2
    T2 --> A7
    
    T3 --> A1
    T3 --> A3
    T3 --> A8
    
    T4 --> A1
    T4 --> A3
    T4 --> A7
    
    T5 --> A1
    T5 --> A10
    
    C1 -.->|Determines| A1
    C2 -.->|Determines| A8
    C3 -.->|Determines| A7
    C4 -.->|Required for| A10

    style Triggers fill:#e3f2fd
    style Actions fill:#fff3e0
    style Conditions fill:#f3e5f5`;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Seeksy.io System Architecture</h1>
        <p className="text-muted-foreground">
          Complete system design and user flows for the Seeksy platform
        </p>
      </div>

      <Tabs defaultValue="architecture" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="architecture">System Architecture</TabsTrigger>
          <TabsTrigger value="creation">Creation Flow</TabsTrigger>
          <TabsTrigger value="booking">Booking Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Level System Architecture</CardTitle>
              <CardDescription>
                Overview of all system components, user types, and external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(architectureDiagram, "Architecture diagram")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Mermaid Code
                </Button>
              </div>
              <div className="bg-muted p-6 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre">
                  {architectureDiagram}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste this code into <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-primary underline">mermaid.live</a> to view the interactive diagram
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seeksy Creation Flow (Organizer Journey)</CardTitle>
              <CardDescription>
                Step-by-step process for creating a new Seeksy workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(creationFlowDiagram, "Creation flow diagram")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Mermaid Code
                </Button>
              </div>
              <div className="bg-muted p-6 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre">
                  {creationFlowDiagram}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste this code into <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-primary underline">mermaid.live</a> to view the interactive diagram
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Flow (Participant Journey)</CardTitle>
              <CardDescription>
                Step-by-step process when someone books a Seeksy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(bookingFlowDiagram, "Booking flow diagram")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Mermaid Code
                </Button>
              </div>
              <div className="bg-muted p-6 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre">
                  {bookingFlowDiagram}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste this code into <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-primary underline">mermaid.live</a> to view the interactive diagram
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automation Engine Details</CardTitle>
              <CardDescription>
                Workflow automation triggers and actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(automationEngineDiagram, "Automation engine diagram")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Mermaid Code
                </Button>
              </div>
              <div className="bg-muted p-6 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre">
                  {automationEngineDiagram}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste this code into <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-primary underline">mermaid.live</a> to view the interactive diagram
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Key Technical Components:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Authentication:</strong> Supabase Auth with email/OAuth support</li>
              <li><strong>Database:</strong> Supabase PostgreSQL with RLS policies</li>
              <li><strong>Calendar Sync:</strong> Google Calendar & Outlook API integration</li>
              <li><strong>Video:</strong> Zoom, Google Meet, MS Teams API integration</li>
              <li><strong>Email:</strong> Resend for transactional emails</li>
              <li><strong>Payments:</strong> Stripe for paid bookings</li>
              <li><strong>CRM:</strong> Webhooks/API for HubSpot, Salesforce integration</li>
              <li><strong>Automation:</strong> Edge functions with scheduled triggers</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">User Roles:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Organizer:</strong> Creates Seeksies, manages bookings, views analytics</li>
              <li><strong>Participant:</strong> Books meetings, manages their bookings</li>
              <li><strong>Admin:</strong> Platform management, user support, system monitoring</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeeksyArchitecture;