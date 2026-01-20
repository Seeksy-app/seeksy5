import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PaidAdsTerms() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (!accepted) {
      toast.error("Please accept the terms to continue");
      return;
    }
    toast.success("Terms accepted");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">PAID Ads Activation</h1>
            <p className="text-muted-foreground">Effective Date: November 26, 2025</p>
          </div>

          <div className="h-[600px] overflow-y-auto border rounded-lg p-6 space-y-6 bg-muted/20">
            <section className="space-y-4">
              <p className="font-semibold text-sm text-muted-foreground">
                BY PARTICIPATING IN THE PAID PROGRAM, YOU AFFIRM THAT YOU ARE AT LEAST 18 YEARS OLD.
              </p>

              <h2 className="text-2xl font-bold">OVERVIEW</h2>
              <p>
                Please read these PAID Program Terms ("PAID Terms") carefully before participating in the PAID Program offered through Seeksy. This is a binding agreement between Seeksy ("Seeksy," "us," "we," or "our") and you, and is subject to our Terms of Service. Any capitalized terms used herein but not otherwise defined shall have the same meaning set forth in the Terms of Service.
              </p>

              <h3 className="text-xl font-semibold mt-6">Definitions</h3>
              <div className="space-y-3">
                <p><strong>"Ad Marker"</strong> means a setting in the PAID Program for placement of a Roll Slot.</p>
                <p><strong>"Ads"</strong> means a commercial message (in any format), inserted into any Publication by the PAID Program.</p>
                <p><strong>"Advertiser"</strong> means the person or entity paying for Ads in any Publication, which may include third parties or Seeksy.</p>
                <p><strong>"Advertising Partner"</strong> means a third party engaged by Seeksy for selling, serving or producing Ads in a Publication.</p>
                <p><strong>"Advertising Rate"</strong> means the price at which an Ad is sold.</p>
                <p><strong>"Net Advertising Revenue"</strong> means the amount actually received by Seeksy for sold Ads, less applicable taxes and any Third Party Fees.</p>
                <p><strong>"PAID Program"</strong> is a program offered by Seeksy that allows podcasters with a qualifying Account to monetize their podcasts by automatically inserting programmatic advertisements into their podcast episodes.</p>
                <p><strong>"Publication"</strong> means any and all Content associated with the podcast show or episode hosted, distributed and/or monetized by Seeksy under the terms of the Agreement.</p>
                <p><strong>"Roll Slot"</strong> means a break in an episode where an Ad may be inserted (pre-roll, mid-roll, or post-roll).</p>
                <p><strong>"Standard Ad Inventory"</strong> means the minimum number of Ads and Roll Slots in each episode of the Publication.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">THE PROGRAM</h2>
              <p className="font-semibold">
                THE PAID PROGRAM IS NOT FOR PERSONS UNDER THE AGE OF 18. IF YOU ARE UNDER 18 YEARS OF AGE, THEN YOU MUST NOT USE OR ACCESS THE PAID PROGRAM.
              </p>
              <p>
                Seeksy will make available the PAID Program as set out in these PAID Terms. Seeksy shall use commercially reasonable efforts to make the PAID Program available, except for scheduled and unscheduled maintenance. Seeksy reserves the right to temporarily or permanently discontinue any or all aspects of the PAID Program at any time upon written notice.
              </p>
              <p>
                Participation in the Program is subject to you having a qualifying Account and verifying a valid PayPal account. Upon verification, if you have a qualifying Account then you will be granted access to the PAID Program.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">OWNERSHIP AND RIGHTS</h2>
              <p>
                Seeksy is and remains the sole owner of all rights in Seeksy's intellectual property. Seeksy hereby grants to you a non-exclusive, non-transferable, revocable worldwide license to use and participate in the Program in accordance with the Agreement.
              </p>
              <p>
                As between you and Seeksy, all your Content is owned by you or validly licensed by you. We do not claim any ownership rights to your Content.
              </p>
              <p>
                By enabling Content to include Ads as part of the PAID Program, you grant to Seeksy a non-exclusive, sub-licensable, fully paid, royalty-free, worldwide license to host, use, copy, transmit, modify, publicly perform, display, promote, market, distribute, and otherwise make your Content available to end users and third parties including via download and streaming.
              </p>
              <p>
                You may have an option within the PAID Program dashboard to exclude some types of advertising categories based on the official IAB ad category list.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">COMMERCIALS</h2>
              <p>You agree that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Seeksy has the non-exclusive right to host, distribute and monetize the Publication.</li>
                <li>Seeksy's failure to secure any Ad for your Publication shall not constitute a breach of this Agreement.</li>
                <li>You shall allow Seeksy to use and fill the Standard Ad Inventory with Ads as available into the Publication.</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6">Revenue Share</h3>
              <p>
                Seeksy and you agree to share Net Advertising Revenue from any Ads placed on any Publication as follows: <strong>Seeksy 30% / Creator 70%</strong>, unless otherwise agreed in writing.
              </p>
              <p>
                Any third-party fees (e.g., PayPal transaction fees) shall be deducted from your share of Net Advertising Revenue. Seeksy makes no representation that any Ads will generate any particular amount of Net Advertising Revenue.
              </p>

              <h3 className="text-xl font-semibold mt-6">Payment Terms</h3>
              <p>
                Payment for the share of Net Advertising Revenue will be provided via PayPal, subject to PayPal's terms and conditions. Balances accrue daily and are payable 60 days after being earned, subject to invalid traffic, fraud and abuse verification, as well as transaction fee adjustments.
              </p>
              <p>
                Seeksy reserves the right to withhold payments if the minimum share of Net Advertising Revenue to qualify for payments is not met.
              </p>
              <p>
                Seeksy has the right to remove any Ads from a Publication if Seeksy assesses that an Ad may violate these Terms or any applicable law.
              </p>
              <p>
                You are fully responsible for reporting and paying all taxes related to any payment received by you under this Agreement.
              </p>
              <p>
                Seeksy reserves the right to suspend monetization and withhold payments if: (i) PayPal account information is inaccurate or incomplete; (ii) identity cannot be verified; or (iii) recipient is unable to receive payment due to legal restrictions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">TERM AND TERMINATION</h2>
              <p>
                You may terminate your participation in the PAID Program at any time by deleting your Account. Your non-compliance with the PAID Terms may result in suspension of access, removal of Content, or termination of your Account.
              </p>
              <p>
                If Seeksy determines that you have breached the PAID Terms, or that Publication engagement has been artificially altered, Seeksy may suspend monetization and withhold accrued payments.
              </p>
              <p>
                Seeksy may, at any time and at its own discretion, close the PAID Program or parts of the PAID Program.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">CHANGES TO THE PAID TERMS</h2>
              <p>
                We reserve the right to modify or replace these PAID Terms by posting the updated terms on Seeksy. Your continued use of the PAID Program after any such changes constitutes your acceptance of the new PAID Terms.
              </p>
              <p className="font-semibold">
                IF YOU DO NOT AGREE TO THESE PAID TERMS OR ANY CHANGES, DO NOT USE OR CONTINUE TO ACCESS THE PAID PROGRAM.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">SUPPORT</h2>
              <p>
                If you have any questions about the PAID Program, please contact us at support@seeksy.io
              </p>
            </section>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <label
              htmlFor="accept-terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have read and accept the PAID Ads Terms of Service
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!accepted}
            className="w-full"
            size="lg"
          >
            Accept and Continue
          </Button>
        </Card>
      </div>
    </div>
  );
}
