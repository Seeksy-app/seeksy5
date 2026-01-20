import { useState } from "react";
import { VeteransLayout } from "@/components/veterans/VeteransLayout";
import { IntentToFileForm } from "@/components/veterans/intent-to-file/IntentToFileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Clock, FileText } from "lucide-react";

export default function IntentToFilePage() {
  return (
    <VeteransLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Compliance Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Important Disclosure</p>
              <p>
                We are not the VA. We help prepare your VA claim and connect you with accredited representatives. 
                Final submission must be completed by you through VA's secure systems.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Intent to File</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Protect your effective date and maximize your benefits. We'll help you prepare your 
            claim and connect you with an accredited representative.
          </p>
        </div>

        {/* Why Intent to File Matters */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-blue-100 dark:border-blue-900">
            <CardContent className="pt-6">
              <Clock className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-1">Lock in Your Date</h3>
              <p className="text-sm text-muted-foreground">
                Your Intent to File date becomes your effective date for benefits
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-background border-green-100 dark:border-green-900">
            <CardContent className="pt-6">
              <Shield className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-1">1 Year to Complete</h3>
              <p className="text-sm text-muted-foreground">
                You have 12 months to gather evidence and file your full claim
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background border-purple-100 dark:border-purple-900">
            <CardContent className="pt-6">
              <FileText className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-1">Retroactive Pay</h3>
              <p className="text-sm text-muted-foreground">
                Get back-pay from your Intent to File date when approved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* The Form */}
        <IntentToFileForm />
      </div>
    </VeteransLayout>
  );
}
