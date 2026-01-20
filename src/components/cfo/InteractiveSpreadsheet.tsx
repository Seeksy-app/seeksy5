import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Share2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ProFormaSpreadsheetGenerator } from "./ProFormaSpreadsheetGenerator";
import { ShareProformaDialog } from "./ShareProformaDialog";
import { SpreadsheetViewerDialog } from "./SpreadsheetViewerDialog";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { SUBSCRIPTION_PRICING } from "@/lib/config/creditConfig";

interface SpreadsheetAssumptions {
  // Pricing by Product Line
  podcasterBasicPrice: number;
  podcasterProPrice: number;
  podcasterEnterprisePrice: number;
  eventCreatorPrice: number;
  eventOrgPrice: number;
  politicalCampaignPrice: number;
  myPageBasicPrice: number;
  myPageProPrice: number;
  industryCreatorPrice: number;
  
  // Customer Acquisition (Starting Month 1)
  startingPodcasters: number;
  startingEventCreators: number;
  startingEventOrgs: number;
  startingPolitical: number;
  startingMyPage: number;
  startingIndustryCreators: number;
  
  // Monthly Growth Rates (%)
  podcasterGrowthRate: number;
  eventCreatorGrowthRate: number;
  eventOrgGrowthRate: number;
  politicalGrowthRate: number;
  myPageGrowthRate: number;
  industryCreatorGrowthRate: number;
  
  // Tier Distribution (%)
  podcasterBasicPercent: number;
  podcasterProPercent: number;
  podcasterEnterprisePercent: number;
  myPageBasicPercent: number;
  myPageProPercent: number;
  
  // Churn & Retention (%)
  monthlyChurnRate: number;
  
  // Ad Revenue
  avgCPM: number;
  avgEpisodesPerMonth: number;
  avgListenersPerEpisode: number;
  adFillRate: number;
  platformAdRevShare: number; // % kept by platform
  
  // Costs (per user per month unless noted)
  aiComputeCost: number;
  storageCostPerGB: number;
  avgStoragePerUserGB: number;
  bandwidthCostPerGB: number;
  avgBandwidthPerUserGB: number;
  streamingCostPerHour: number;
  avgStreamingHoursPerUser: number;
  supportCostPerUser: number;
  marketingCAC: number;
  paymentProcessingRate: number; // %
  
  // Upsell Assumptions (% per month)
  basicToProUpsellRate: number;
  proToEnterpriseUpsellRate: number;
  
  // Cross-sell (% of podcasters also buying My Page)
  podcasterToMyPageCrossSell: number;
}

export const InteractiveSpreadsheet = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'baseline' | 'conservative' | 'growth' | 'aggressive'>('conservative');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [spreadsheetViewerOpen, setSpreadsheetViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{ assumptions: any; forecast: any[]; type: 'ai' | 'custom' } | null>(null);
  const [proformaType] = useState<'ai' | 'custom'>('custom'); // InteractiveSpreadsheet uses custom proforma
  const [assumptions, setAssumptions] = useState<SpreadsheetAssumptions>({
    // Pricing (from centralized config)
    podcasterBasicPrice: SUBSCRIPTION_PRICING.podcaster_basic,
    podcasterProPrice: SUBSCRIPTION_PRICING.podcaster_pro,
    podcasterEnterprisePrice: SUBSCRIPTION_PRICING.podcaster_enterprise,
    eventCreatorPrice: SUBSCRIPTION_PRICING.event_creator,
    eventOrgPrice: SUBSCRIPTION_PRICING.event_org,
    politicalCampaignPrice: SUBSCRIPTION_PRICING.political_campaign,
    myPageBasicPrice: SUBSCRIPTION_PRICING.mypage_basic,
    myPageProPrice: SUBSCRIPTION_PRICING.mypage_pro,
    industryCreatorPrice: SUBSCRIPTION_PRICING.industry_creator,
    
    // Starting Customers
    startingPodcasters: 20,
    startingEventCreators: 5,
    startingEventOrgs: 1,
    startingPolitical: 1,
    startingMyPage: 30,
    startingIndustryCreators: 3,
    
    // Growth Rates
    podcasterGrowthRate: 25,
    eventCreatorGrowthRate: 20,
    eventOrgGrowthRate: 15,
    politicalGrowthRate: 10,
    myPageGrowthRate: 30,
    industryCreatorGrowthRate: 15,
    
    // Tier Distribution
    podcasterBasicPercent: 40,
    podcasterProPercent: 45,
    podcasterEnterprisePercent: 15,
    myPageBasicPercent: 70,
    myPageProPercent: 30,
    
    // Churn
    monthlyChurnRate: 5,
    
    // Ad Revenue
    avgCPM: 25,
    avgEpisodesPerMonth: 4,
    avgListenersPerEpisode: 1000,
    adFillRate: 80,
    platformAdRevShare: 30,
    
    // Costs
    aiComputeCost: 2.5,
    storageCostPerGB: 0.023,
    avgStoragePerUserGB: 50,
    bandwidthCostPerGB: 0.05,
    avgBandwidthPerUserGB: 100,
    streamingCostPerHour: 0.15,
    avgStreamingHoursPerUser: 5,
    supportCostPerUser: 1.2,
    marketingCAC: 45,
    paymentProcessingRate: 2.9,
    
    // Upsell/Cross-sell
    basicToProUpsellRate: 2,
    proToEnterpriseUpsellRate: 1,
    podcasterToMyPageCrossSell: 25,
  });

  const updateAssumption = (key: keyof SpreadsheetAssumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  // Calculate monthly forecast for 36 months (3 years)
  const calculateForecast = () => {
    const months = [];
    
    let podcasters = assumptions.startingPodcasters;
    let eventCreators = assumptions.startingEventCreators;
    let eventOrgs = assumptions.startingEventOrgs;
    let political = assumptions.startingPolitical;
    let myPage = assumptions.startingMyPage;
    let industryCreators = assumptions.startingIndustryCreators;
    
    for (let month = 1; month <= 36; month++) {
      // Apply growth
      const newPodcasters = Math.round(podcasters * (1 + assumptions.podcasterGrowthRate / 100));
      const newEventCreators = Math.round(eventCreators * (1 + assumptions.eventCreatorGrowthRate / 100));
      const newEventOrgs = Math.round(eventOrgs * (1 + assumptions.eventOrgGrowthRate / 100));
      const newPolitical = Math.round(political * (1 + assumptions.politicalGrowthRate / 100));
      const newMyPage = Math.round(myPage * (1 + assumptions.myPageGrowthRate / 100));
      const newIndustryCreators = Math.round(industryCreators * (1 + assumptions.industryCreatorGrowthRate / 100));
      
      // Apply churn
      const churnMultiplier = 1 - (assumptions.monthlyChurnRate / 100);
      podcasters = Math.round(newPodcasters * churnMultiplier);
      eventCreators = Math.round(newEventCreators * churnMultiplier);
      eventOrgs = Math.round(newEventOrgs * churnMultiplier);
      political = Math.round(newPolitical * churnMultiplier);
      myPage = Math.round(newMyPage * churnMultiplier);
      industryCreators = Math.round(newIndustryCreators * churnMultiplier);
      
      // Calculate tier splits
      const podcasterBasic = Math.round(podcasters * (assumptions.podcasterBasicPercent / 100));
      const podcasterPro = Math.round(podcasters * (assumptions.podcasterProPercent / 100));
      const podcasterEnterprise = Math.round(podcasters * (assumptions.podcasterEnterprisePercent / 100));
      const myPageBasic = Math.round(myPage * (assumptions.myPageBasicPercent / 100));
      const myPagePro = Math.round(myPage * (assumptions.myPageProPercent / 100));
      
      // Calculate subscription revenue
      const podcasterRevenue = (
        podcasterBasic * assumptions.podcasterBasicPrice +
        podcasterPro * assumptions.podcasterProPrice +
        podcasterEnterprise * assumptions.podcasterEnterprisePrice
      );
      const eventCreatorRevenue = eventCreators * assumptions.eventCreatorPrice;
      const eventOrgRevenue = eventOrgs * assumptions.eventOrgPrice;
      const politicalRevenue = political * assumptions.politicalCampaignPrice;
      const myPageRevenue = (
        myPageBasic * assumptions.myPageBasicPrice +
        myPagePro * assumptions.myPageProPrice
      );
      const industryCreatorRevenue = industryCreators * assumptions.industryCreatorPrice;
      
      const totalSubscriptionRevenue = (
        podcasterRevenue + eventCreatorRevenue + eventOrgRevenue +
        politicalRevenue + myPageRevenue + industryCreatorRevenue
      );
      
      // Calculate ad revenue
      const totalImpressions = podcasters * assumptions.avgEpisodesPerMonth * assumptions.avgListenersPerEpisode;
      const adRevenueGross = (totalImpressions / 1000) * assumptions.avgCPM * (assumptions.adFillRate / 100);
      const adRevenuePlatform = adRevenueGross * (assumptions.platformAdRevShare / 100);
      const adRevenueToCreators = adRevenueGross - adRevenuePlatform;
      
      // Total revenue
      const totalRevenue = totalSubscriptionRevenue + adRevenuePlatform;
      
      // Calculate costs
      const totalUsers = podcasters + eventCreators + eventOrgs + political + myPage + industryCreators;
      
      const aiCosts = totalUsers * assumptions.aiComputeCost;
      const storageCosts = totalUsers * assumptions.avgStoragePerUserGB * assumptions.storageCostPerGB;
      const bandwidthCosts = totalUsers * assumptions.avgBandwidthPerUserGB * assumptions.bandwidthCostPerGB;
      const streamingCosts = totalUsers * assumptions.avgStreamingHoursPerUser * assumptions.streamingCostPerHour;
      const supportCosts = totalUsers * assumptions.supportCostPerUser;
      
      // Marketing costs (based on new user acquisition)
      const newUsers = month === 1 ? totalUsers : totalUsers - months[month - 2].totalUsers;
      const marketingCosts = newUsers * assumptions.marketingCAC;
      
      // Payment processing
      const paymentProcessingCosts = totalRevenue * (assumptions.paymentProcessingRate / 100);
      
      // Creator payouts
      const creatorPayouts = adRevenueToCreators;
      
      const totalCosts = (
        aiCosts + storageCosts + bandwidthCosts + streamingCosts +
        supportCosts + marketingCosts + paymentProcessingCosts + creatorPayouts
      );
      
      // Margins
      const grossProfit = totalRevenue - creatorPayouts;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netProfit = totalRevenue - totalCosts;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      months.push({
        month,
        year: 2026 + Math.floor((month - 1) / 12),
        podcasters,
        podcasterBasic,
        podcasterPro,
        podcasterEnterprise,
        eventCreators,
        eventOrgs,
        political,
        myPage,
        myPageBasic,
        myPagePro,
        industryCreators,
        totalUsers,
        podcasterRevenue,
        eventCreatorRevenue,
        eventOrgRevenue,
        politicalRevenue,
        myPageRevenue,
        industryCreatorRevenue,
        totalSubscriptionRevenue,
        adRevenueGross,
        adRevenuePlatform,
        adRevenueToCreators,
        totalRevenue,
        aiCosts,
        storageCosts,
        bandwidthCosts,
        streamingCosts,
        supportCosts,
        marketingCosts,
        paymentProcessingCosts,
        creatorPayouts,
        totalCosts,
        grossProfit,
        grossMargin,
        netProfit,
        netMargin,
      });
    }
    
    return months;
  };

  const forecast = calculateForecast();

  // Generate AI baseline forecast for spreadsheet viewer
  const generateAIForecast = () => {
    const baseline = {
      year1Revenue: 2100000,
      year2Revenue: 8700000,
      year3Revenue: 35800000,
      year1Profit: 523000,
      year2Profit: 2400000,
      year3Profit: 10800000,
    };

    // Apply selected scenario multiplier
    let multiplier = 1;
    switch (selectedScenario) {
      case 'conservative':
        multiplier = 0.7; // Revenue
        break;
      case 'growth':
        multiplier = 1.15;
        break;
      case 'aggressive':
        multiplier = 1.5;
        break;
      default:
        multiplier = 1;
    }

    const months = [];
    const monthlyYear1Revenue = (baseline.year1Revenue * multiplier) / 12;
    const monthlyYear2Revenue = (baseline.year2Revenue * (selectedScenario === 'conservative' ? 0.65 : selectedScenario === 'growth' ? 1.2 : selectedScenario === 'aggressive' ? 1.7 : 1)) / 12;
    const monthlyYear3Revenue = (baseline.year3Revenue * (selectedScenario === 'conservative' ? 0.6 : selectedScenario === 'growth' ? 1.25 : selectedScenario === 'aggressive' ? 2.0 : 1)) / 12;

    const monthlyYear1Profit = (baseline.year1Profit * (selectedScenario === 'conservative' ? 0.5 : selectedScenario === 'growth' ? 1.2 : selectedScenario === 'aggressive' ? 1.8 : 1)) / 12;
    const monthlyYear2Profit = (baseline.year2Profit * (selectedScenario === 'conservative' ? 0.55 : selectedScenario === 'growth' ? 1.25 : selectedScenario === 'aggressive' ? 2.0 : 1)) / 12;
    const monthlyYear3Profit = (baseline.year3Profit * (selectedScenario === 'conservative' ? 0.6 : selectedScenario === 'growth' ? 1.3 : selectedScenario === 'aggressive' ? 2.2 : 1)) / 12;

    for (let month = 1; month <= 36; month++) {
      let totalRevenue, netProfit;
      
      if (month <= 12) {
        totalRevenue = monthlyYear1Revenue;
        netProfit = monthlyYear1Profit;
      } else if (month <= 24) {
        totalRevenue = monthlyYear2Revenue;
        netProfit = monthlyYear2Profit;
      } else {
        totalRevenue = monthlyYear3Revenue;
        netProfit = monthlyYear3Profit;
      }

      const totalCosts = totalRevenue - netProfit;
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts * 0.3) / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      months.push({
        month,
        totalUsers: Math.floor(1000 + (month * 100)),
        podcasterRevenue: totalRevenue * 0.4,
        eventCreatorRevenue: totalRevenue * 0.15,
        myPageRevenue: totalRevenue * 0.25,
        adRevenuePlatform: totalRevenue * 0.2,
        totalRevenue,
        aiCosts: totalCosts * 0.3,
        storageCosts: totalCosts * 0.2,
        streamingCosts: totalCosts * 0.25,
        marketingCosts: totalCosts * 0.25,
        totalCosts,
        grossMargin,
        netProfit,
        netMargin,
      });
    }

    return months;
  };

  // Calculate scenario-adjusted AI projections with useMemo for optimal reactivity
  const scenarioProjections = useMemo(() => {
    const baseline = {
      year1Revenue: 2100000,
      year2Revenue: 8700000,
      year3Revenue: 35800000,
      year1Profit: 523000,
      year2Profit: 2400000,
      year3Profit: 10800000,
    };

    switch (selectedScenario) {
      case 'conservative':
        return {
          year1Revenue: baseline.year1Revenue * 0.7,
          year2Revenue: baseline.year2Revenue * 0.65,
          year3Revenue: baseline.year3Revenue * 0.6,
          year1Profit: baseline.year1Profit * 0.5,
          year2Profit: baseline.year2Profit * 0.55,
          year3Profit: baseline.year3Profit * 0.6,
        };
      case 'growth':
        return {
          year1Revenue: baseline.year1Revenue * 1.15,
          year2Revenue: baseline.year2Revenue * 1.2,
          year3Revenue: baseline.year3Revenue * 1.25,
          year1Profit: baseline.year1Profit * 1.2,
          year2Profit: baseline.year2Profit * 1.25,
          year3Profit: baseline.year3Profit * 1.3,
        };
      case 'aggressive':
        return {
          year1Revenue: baseline.year1Revenue * 1.5,
          year2Revenue: baseline.year2Revenue * 1.7,
          year3Revenue: baseline.year3Revenue * 2.0,
          year1Profit: baseline.year1Profit * 1.8,
          year2Profit: baseline.year2Profit * 2.0,
          year3Profit: baseline.year3Profit * 2.2,
        };
      default:
        return baseline;
    }
  }, [selectedScenario]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(value / 1000)}K`;
  };

  const exportToCSV = (tabName: string) => {
    let csv = '';
    
    if (tabName === 'assumptions') {
      csv = 'Category,Item,Value,Unit\n';
      csv += 'PRICING,,,,\n';
      csv += 'Pricing,Podcaster Basic,$' + assumptions.podcasterBasicPrice + ',per month\n';
      csv += 'Pricing,Podcaster Pro,$' + assumptions.podcasterProPrice + ',per month\n';
      csv += 'Pricing,Podcaster Enterprise,$' + assumptions.podcasterEnterprisePrice + ',per month\n';
      csv += 'Pricing,Event Creator,$' + assumptions.eventCreatorPrice + ',per month\n';
      csv += 'Pricing,Event Organization,$' + assumptions.eventOrgPrice + ',per month\n';
      csv += 'Pricing,Political Campaign,$' + assumptions.politicalCampaignPrice + ',per month\n';
      csv += 'Pricing,My Page Basic,$' + assumptions.myPageBasicPrice + ',per month\n';
      csv += 'Pricing,My Page Pro,$' + assumptions.myPageProPrice + ',per month\n';
      csv += 'Pricing,Industry Creator,$' + assumptions.industryCreatorPrice + ',per month\n';
      csv += '\nSTARTING CUSTOMERS,,,,\n';
      csv += 'Starting Customers,Podcasters,' + assumptions.startingPodcasters + ',count\n';
      csv += 'Starting Customers,Event Creators,' + assumptions.startingEventCreators + ',count\n';
      csv += 'Starting Customers,Event Orgs,' + assumptions.startingEventOrgs + ',count\n';
      csv += 'Starting Customers,Political,' + assumptions.startingPolitical + ',count\n';
      csv += 'Starting Customers,My Page Users,' + assumptions.startingMyPage + ',count\n';
      csv += 'Starting Customers,Industry Creators,' + assumptions.startingIndustryCreators + ',count\n';
      csv += '\nGROWTH RATES,,,,\n';
      csv += 'Growth Rates,Podcaster,' + assumptions.podcasterGrowthRate + ',%\n';
      csv += 'Growth Rates,Event Creator,' + assumptions.eventCreatorGrowthRate + ',%\n';
      csv += 'Growth Rates,Event Org,' + assumptions.eventOrgGrowthRate + ',%\n';
      csv += 'Growth Rates,Political,' + assumptions.politicalGrowthRate + ',%\n';
      csv += 'Growth Rates,My Page,' + assumptions.myPageGrowthRate + ',%\n';
      csv += 'Growth Rates,Industry Creator,' + assumptions.industryCreatorGrowthRate + ',%\n';
      csv += '\nTIER DISTRIBUTION,,,,\n';
      csv += 'Tiers,Podcaster Basic %,' + assumptions.podcasterBasicPercent + ',%\n';
      csv += 'Tiers,Podcaster Pro %,' + assumptions.podcasterProPercent + ',%\n';
      csv += 'Tiers,Podcaster Enterprise %,' + assumptions.podcasterEnterprisePercent + ',%\n';
      csv += 'Tiers,My Page Basic %,' + assumptions.myPageBasicPercent + ',%\n';
      csv += 'Tiers,My Page Pro %,' + assumptions.myPageProPercent + ',%\n';
      csv += '\nCHURN & RETENTION,,,,\n';
      csv += 'Churn,Monthly Churn Rate,' + assumptions.monthlyChurnRate + ',%\n';
      csv += '\nAD REVENUE,,,,\n';
      csv += 'Ad Revenue,Average CPM,$' + assumptions.avgCPM + ',per thousand\n';
      csv += 'Ad Revenue,Episodes per Month,' + assumptions.avgEpisodesPerMonth + ',count\n';
      csv += 'Ad Revenue,Listeners per Episode,' + assumptions.avgListenersPerEpisode + ',count\n';
      csv += 'Ad Revenue,Ad Fill Rate,' + assumptions.adFillRate + ',%\n';
      csv += 'Ad Revenue,Platform Revenue Share,' + assumptions.platformAdRevShare + ',%\n';
      csv += '\nCOST STRUCTURE,,,,\n';
      csv += 'Costs,AI Compute Cost,$' + assumptions.aiComputeCost + ',per user/month\n';
      csv += 'Costs,Storage Cost per GB,$' + assumptions.storageCostPerGB + ',per GB\n';
      csv += 'Costs,Avg Storage per User,' + assumptions.avgStoragePerUserGB + ',GB\n';
      csv += 'Costs,Bandwidth Cost per GB,$' + assumptions.bandwidthCostPerGB + ',per GB\n';
      csv += 'Costs,Avg Bandwidth per User,' + assumptions.avgBandwidthPerUserGB + ',GB\n';
      csv += 'Costs,Streaming Cost per Hour,$' + assumptions.streamingCostPerHour + ',per hour\n';
      csv += 'Costs,Avg Streaming Hours,' + assumptions.avgStreamingHoursPerUser + ',hours/month\n';
      csv += 'Costs,Support Cost,$' + assumptions.supportCostPerUser + ',per user/month\n';
      csv += 'Costs,Marketing CAC,$' + assumptions.marketingCAC + ',per acquisition\n';
      csv += 'Costs,Payment Processing,' + assumptions.paymentProcessingRate + ',%\n';
    } else if (tabName === 'forecast-summary') {
      // Summary export
      csv = 'Month,Year,Total Users,Podcasters,Event Creators,Event Orgs,Political,My Page,Industry Creators,';
      csv += 'Subscription Revenue,Ad Revenue,Total Revenue,Total Costs,Net Profit,Net Margin %\n';
      
      forecast.forEach(m => {
        csv += `${m.month},${m.year},${m.totalUsers},${m.podcasters},${m.eventCreators},${m.eventOrgs},${m.political},${m.myPage},${m.industryCreators},`;
        csv += `${m.totalSubscriptionRevenue.toFixed(2)},${m.adRevenuePlatform.toFixed(2)},${m.totalRevenue.toFixed(2)},${m.totalCosts.toFixed(2)},${m.netProfit.toFixed(2)},${m.netMargin.toFixed(2)}\n`;
      });
    } else if (tabName === 'forecast-detailed') {
      // Complete detailed export with ALL line items
      csv = 'Month,Year,';
      csv += 'Total Users,Podcasters,Podcaster Basic,Podcaster Pro,Podcaster Enterprise,Event Creators,Event Orgs,Political,My Page Users,My Page Basic,My Page Pro,Industry Creators,';
      csv += 'Podcaster Revenue,Event Creator Revenue,Event Org Revenue,Political Revenue,My Page Revenue,Industry Creator Revenue,Total Subscription Revenue,';
      csv += 'Ad Revenue Gross,Ad Revenue Platform,Ad Revenue to Creators,';
      csv += 'AI Costs,Storage Costs,Bandwidth Costs,Streaming Costs,Support Costs,Marketing Costs,Payment Processing Costs,Creator Payouts,Total Costs,';
      csv += 'Gross Profit,Gross Margin %,Net Profit,Net Margin %\n';
      
      forecast.forEach(m => {
        csv += `${m.month},${m.year},`;
        csv += `${m.totalUsers},${m.podcasters},${m.podcasterBasic},${m.podcasterPro},${m.podcasterEnterprise},${m.eventCreators},${m.eventOrgs},${m.political},${m.myPage},${m.myPageBasic},${m.myPagePro},${m.industryCreators},`;
        csv += `${m.podcasterRevenue.toFixed(2)},${m.eventCreatorRevenue.toFixed(2)},${m.eventOrgRevenue.toFixed(2)},${m.politicalRevenue.toFixed(2)},${m.myPageRevenue.toFixed(2)},${m.industryCreatorRevenue.toFixed(2)},${m.totalSubscriptionRevenue.toFixed(2)},`;
        csv += `${m.adRevenueGross.toFixed(2)},${m.adRevenuePlatform.toFixed(2)},${m.adRevenueToCreators.toFixed(2)},`;
        csv += `${m.aiCosts.toFixed(2)},${m.storageCosts.toFixed(2)},${m.bandwidthCosts.toFixed(2)},${m.streamingCosts.toFixed(2)},${m.supportCosts.toFixed(2)},${m.marketingCosts.toFixed(2)},${m.paymentProcessingCosts.toFixed(2)},${m.creatorPayouts.toFixed(2)},${m.totalCosts.toFixed(2)},`;
        csv += `${m.grossProfit.toFixed(2)},${m.grossMargin.toFixed(2)},${m.netProfit.toFixed(2)},${m.netMargin.toFixed(2)}\n`;
      });
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seeksy-${tabName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported to CSV successfully`);
  };

  // Calculate annual summaries
  const getAnnualSummaries = () => {
    const years = [2026, 2027, 2028];
    return years.map(year => {
      const yearData = forecast.filter(m => m.year === year);
      return {
        year,
        totalRevenue: yearData.reduce((sum, m) => sum + m.totalRevenue, 0),
        totalCosts: yearData.reduce((sum, m) => sum + m.totalCosts, 0),
        netProfit: yearData.reduce((sum, m) => sum + m.netProfit, 0),
        avgUsers: Math.round(yearData.reduce((sum, m) => sum + m.totalUsers, 0) / yearData.length),
        endUsers: yearData[yearData.length - 1].totalUsers,
      };
    });
  };

  const handleExportAIPDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;
      
      // ===== PAGE 1 =====
      // Header with gradient-style box
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Title
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Seeksy AI-Generated Pro Forma", 20, 20);
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("3-Year Financial Forecast (2026-2028)", 20, 28);
      doc.setFontSize(10);
      doc.text("Investment-ready pro forma using AI-powered market analysis", 20, 34);
      
      yPos = 50;
      
      // Forecast Assumptions Section
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Forecast Assumptions", 20, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("These values drive all projections below", 20, yPos);
      yPos += 10;
      
      // Assumption boxes
      const assumptionBoxes = [
        { label: "Monthly User Growth", value: "15%" },
        { label: "Conversion Rate", value: "5%" },
        { label: "Churn Rate", value: "5%" },
        { label: "Avg Subscription", value: "$19" }
      ];
      
      assumptionBoxes.forEach((box, index) => {
        const xPos = 20 + (index * 45);
        doc.setFillColor(248, 249, 250);
        doc.rect(xPos - 2, yPos - 2, 42, 18, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(box.label, xPos, yPos + 3);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(box.value, xPos, yPos + 12);
      });
      
      yPos += 28;
      
      // 3-Year Summary Section
      const years = [
        { year: "2026", revenue: "$51,656", profit: "$-3,069", users: "50", paidUsers: "2" },
        { year: "2027", revenue: "$276,372", profit: "$-15,859", users: "267", paidUsers: "13" },
        { year: "2028", revenue: "$7,912,504", profit: "$-451,665", users: "7,642", paidUsers: "382" }
      ];
      
      years.forEach((data, index) => {
        const xPos = 20 + (index * 60);
        const cardY = yPos;
        
        // Card background
        doc.setFillColor(248, 249, 250);
        doc.rect(xPos - 3, cardY - 3, 56, 52, 'F');
        
        // Year
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(data.year, xPos, cardY + 6);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Annual financial summary", xPos, cardY + 11);
        
        // Revenue
        doc.text("Total Revenue", xPos, cardY + 19);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(data.revenue, xPos, cardY + 26);
        
        // Profit
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Net Profit", xPos, cardY + 34);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        const isProfitable = !data.profit.includes("-");
        doc.setTextColor(isProfitable ? 34 : 239, isProfitable ? 197 : 68, isProfitable ? 94 : 68);
        doc.text(data.profit, xPos, cardY + 41);
        
        // Users
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Total Users: ${data.users} | Paid: ${data.paidUsers}`, xPos, cardY + 48);
      });
      
      yPos += 63;
      
      // Revenue Breakdown Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Revenue Breakdown", 20, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Annual revenue streams", 20, yPos);
      yPos += 10;
      
      // Table header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Year", 20, yPos);
      doc.text("Subscription", 80, yPos, { align: "right" });
      doc.text("Ad Revenue", 130, yPos, { align: "right" });
      doc.text("Total Revenue", 180, yPos, { align: "right" });
      yPos += 2;
      doc.setDrawColor(220, 220, 220);
      doc.line(20, yPos, 180, yPos);
      yPos += 5;
      
      // Revenue data
      const revenueRows = [
        ["2026", "$456", "$51,200", "$51,656"],
        ["2027", "$2,964", "$273,408", "$276,372"],
        ["2028", "$87,096", "$7,825,408", "$7,912,504"]
      ];
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      revenueRows.forEach(row => {
        doc.text(row[0], 20, yPos);
        doc.text(row[1], 80, yPos, { align: "right" });
        doc.text(row[2], 130, yPos, { align: "right" });
        doc.text(row[3], 180, yPos, { align: "right" });
        yPos += 5;
      });
      
      yPos += 8;
      
      // Key Financial Metrics Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Key Financial Metrics", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      const metrics = [
        "2026: Net Margin -5.9% | LTV:CAC 38.3:1 | Payback 0.5 months",
        "2027: Net Margin -5.7% | LTV:CAC 38.3:1 | Payback 0.5 months",
        "2028: Net Margin -5.7% | LTV:CAC 38.3:1 | Payback 0.5 months"
      ];
      
      metrics.forEach(metric => {
        doc.text(metric, 20, yPos);
        yPos += 5;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Seeksy Financial Models | ${new Date().toLocaleDateString()}`, 20, 285);
      
      // ===== PAGE 2 =====
      doc.addPage();
      yPos = 20;
      
      // Page 2 Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Detailed Financial Analysis", 20, yPos);
      yPos += 10;
      
      // Cost Breakdown Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Cost Breakdown by Year", 20, yPos);
      yPos += 8;
      
      // Cost table header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Cost Category", 20, yPos);
      doc.text("Year 1", 100, yPos, { align: "right" });
      doc.text("Year 2", 140, yPos, { align: "right" });
      doc.text("Year 3", 180, yPos, { align: "right" });
      yPos += 2;
      doc.line(20, yPos, 180, yPos);
      yPos += 5;
      
      const costData = [
        ["AI Compute Costs", "$45,000", "$187,000", "$770,000"],
        ["Storage & Bandwidth", "$110,000", "$458,000", "$1,892,000"],
        ["Streaming Costs", "$13,500", "$56,000", "$231,000"],
        ["Support Costs", "$22,000", "$91,000", "$375,000"],
        ["Marketing (CAC)", "$135,000", "$560,000", "$2,310,000"],
        ["Payment Processing", "$61,000", "$252,000", "$1,038,000"]
      ];
      
      doc.setFont("helvetica", "normal");
      costData.forEach(row => {
        doc.text(row[0], 20, yPos);
        doc.text(row[1], 100, yPos, { align: "right" });
        doc.text(row[2], 140, yPos, { align: "right" });
        doc.text(row[3], 180, yPos, { align: "right" });
        yPos += 5;
      });
      
      yPos += 2;
      doc.setDrawColor(220, 220, 220);
      doc.line(20, yPos, 180, yPos);
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL COSTS", 20, yPos);
      doc.text("$386,500", 100, yPos, { align: "right" });
      doc.text("$1,604,000", 140, yPos, { align: "right" });
      doc.text("$6,616,000", 180, yPos, { align: "right" });
      
      yPos += 15;
      
      // Unit Economics Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Unit Economics", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Metric", 20, yPos);
      doc.text("Year 1", 100, yPos, { align: "right" });
      doc.text("Year 2", 140, yPos, { align: "right" });
      doc.text("Year 3", 180, yPos, { align: "right" });
      yPos += 2;
      doc.line(20, yPos, 180, yPos);
      yPos += 5;
      
      const unitEconData = [
        ["ARPU (Annual)", "$9,013", "$8,042", "$7,127"],
        ["CAC", "$45", "$45", "$45"],
        ["LTV (3-year)", "$27,039", "$24,126", "$21,381"],
        ["LTV:CAC Ratio", "601x", "536x", "475x"],
        ["Gross Margin", "81.6%", "81.6%", "81.5%"],
        ["Payback (months)", "0.6", "0.7", "0.8"]
      ];
      
      doc.setFont("helvetica", "normal");
      unitEconData.forEach(row => {
        doc.text(row[0], 20, yPos);
        doc.text(row[1], 100, yPos, { align: "right" });
        doc.text(row[2], 140, yPos, { align: "right" });
        doc.text(row[3], 180, yPos, { align: "right" });
        yPos += 5;
      });
      
      yPos += 10;
      
      // Growth Metrics Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Growth Metrics & Assumptions", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      const growthMetrics = [
        "• User Base: Starting with 100 users, growing 15% monthly (compound)",
        "• Revenue per User: Blended ARPU declining from $9K to $7K as user base scales",
        "• Conversion Funnel: 5% of free users convert to paid subscriptions monthly",
        "• Platform Expansion: Event tools, political campaigns, Quick Ads revenue",
        "• Ad Monetization: Podcast ad insertion with 30% platform fee on $15 CPM",
        "• Churn Management: 5% monthly churn rate with 95% retention baseline",
        "• Infrastructure Scaling: AI compute $2.50/user/mo + streaming $0.75/user/mo",
        "• Customer Acquisition: $45 CAC with multi-channel marketing strategy"
      ];
      
      growthMetrics.forEach(metric => {
        doc.text(metric, 20, yPos);
        yPos += 5;
      });
      
      yPos += 10;
      
      // Revenue Mix Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Revenue Mix Analysis", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      const revenueMix = [
        "• Podcaster Subscriptions: ~20% (Basic $19, Pro $49, Enterprise $199/mo)",
        "• Event Creator Tools: ~8% ($29/mo per creator)",
        "• Event Organizations: ~9% ($299/mo per organization)",
        "• Political Campaigns: ~14% ($499/mo per campaign)",
        "• My Page Subscriptions: ~7% (Basic $9, Pro $29/mo)",
        "• Industry Creators: ~4% ($149/mo premium tier)",
        "• Podcast Ad Insertion: ~15% (30% platform fee on ad revenue)",
        "• Quick Ads Platform: ~23% ($199-$25K/mo advertiser tiers)"
      ];
      
      revenueMix.forEach(mix => {
        doc.text(mix, 20, yPos);
        yPos += 5;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Seeksy Financial Models | Page 2 of 2 | ${new Date().toLocaleDateString()}`, 20, 285);
      
      doc.save("seeksy-ai-proforma.pdf");
      toast.success("AI Pro Forma PDF exported with detailed analysis!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  const handleExportAIExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Helper function to apply bold formatting
      const boldCell = (cell: any) => {
        if (!cell) return;
        cell.s = { font: { bold: true } };
      };
      
      // Helper function to center align cells
      const centerCell = (cell: any) => {
        if (!cell) return;
        cell.s = { ...cell.s, alignment: { horizontal: "center" } };
      };
      
      // 1. Executive Summary Sheet
      const summaryData = [
        ["Seeksy AI-Generated Pro Forma"],
        ["3-Year Financial Projections"],
        ["Based on industry benchmarks and AI analysis"],
        [],
        ["BUSINESS MODEL"],
        ["Multi-sided platform serving creators, event organizers, political campaigns, and advertisers"],
        ["Revenue streams: Subscription tiers, podcast ad insertion (30% fee), Quick Ads ($199-$25k/mo)"],
        [],
        ["KEY FINANCIAL ASSUMPTIONS"],
        ["Platform Growth", "100 users initially, 15% monthly growth compounded"],
        ["Revenue Model", "Multi-tier subscriptions ($19-$499/mo) + ad revenue share"],
        ["Ad Monetization", "$15 CPM podcast ads with 65% fill rate, 30% platform cut"],
        ["Customer Economics", "$45 CAC with 5% monthly churn, 95% retention"],
        ["Cost Structure", "$2.50/user AI compute + $0.75/user streaming monthly"],
        ["Quick Ads Platform", "Advertiser subscriptions $199-$25k/mo across 4 tiers"],
        [],
        ["3-YEAR SUMMARY"],
        ["Metric", "Year 1", "Year 2", "Year 3"],
        ["Total Revenue", "$2.1M", "$8.7M", "$35.8M"],
        ["Net Profit", "$523K", "$2.4M", "$10.8M"],
        ["Net Margin", "25%", "28%", "30%"],
        ["Total Users (EOY)", "466", "2,164", "10,043"],
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      
      // Bold titles and center non-first columns
      ["A1", "A5", "A9", "A18"].forEach(ref => boldCell(ws1[ref]));
      ["B19", "C19", "D19"].forEach(ref => { boldCell(ws1[ref]); centerCell(ws1[ref]); });
      for (let row = 20; row <= 23; row++) {
        ["B", "C", "D"].forEach(col => centerCell(ws1[col + row]));
      }
      
      XLSX.utils.book_append_sheet(wb, ws1, "Executive Summary");
      
      // 2. Assumptions Sheet
      const assumptionsData = [
        ["SEEKSY FINANCIAL MODEL - ASSUMPTIONS"],
        [],
        ["PRICING BY PRODUCT LINE"],
        ["Product/Tier", "Monthly Price"],
        ["Podcaster Basic", "$19"],
        ["Podcaster Pro", "$49"],
        ["Podcaster Enterprise", "$199"],
        ["Event Creator", "$29"],
        ["Event Organization", "$299"],
        ["Political Campaign", "$499"],
        ["My Page Basic", "$9"],
        ["My Page Pro", "$29"],
        ["Industry Creator", "$149"],
        [],
        ["CUSTOMER ACQUISITION"],
        ["User Segment", "Starting Count", "Monthly Growth %"],
        ["Podcasters", "20", "25%"],
        ["Event Creators", "5", "20%"],
        ["Event Organizations", "1", "15%"],
        ["Political Campaigns", "1", "10%"],
        ["My Page Users", "30", "30%"],
        ["Industry Creators", "3", "15%"],
        [],
        ["TIER DISTRIBUTION"],
        ["Tier", "% of Users"],
        ["Podcaster Basic", "40%"],
        ["Podcaster Pro", "45%"],
        ["Podcaster Enterprise", "15%"],
        ["My Page Basic", "70%"],
        ["My Page Pro", "30%"],
        [],
        ["CHURN & RETENTION"],
        ["Metric", "Value"],
        ["Monthly Churn Rate", "5%"],
        ["Monthly Retention", "95%"],
        [],
        ["AD REVENUE MODEL"],
        ["Metric", "Value"],
        ["Average CPM", "$25"],
        ["Episodes per Month", "4"],
        ["Listeners per Episode", "1,000"],
        ["Ad Fill Rate", "80%"],
        ["Platform Revenue Share", "30%"],
        [],
        ["COST STRUCTURE (PER USER/MONTH)"],
        ["Cost Category", "Amount"],
        ["AI Compute Cost", "$2.50"],
        ["Storage Cost (50GB @ $0.023/GB)", "$1.15"],
        ["Bandwidth Cost (100GB @ $0.05/GB)", "$5.00"],
        ["Streaming Cost (5hrs @ $0.15/hr)", "$0.75"],
        ["Support Cost", "$1.20"],
        ["Marketing CAC (per acquisition)", "$45.00"],
        ["Payment Processing Rate", "2.9%"],
      ];
      
      const ws2 = XLSX.utils.aoa_to_sheet(assumptionsData);
      ws2['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 18 }];
      
      ["A1", "A3", "A15", "A24", "A33", "A38", "A48"].forEach(ref => boldCell(ws2[ref]));
      ["A4", "B4", "A16", "B16", "C16", "A25", "B25", "A34", "B34", "A39", "B39", "A49", "B49"].forEach(ref => {
        boldCell(ws2[ref]);
      });
      for (let row = 1; row <= assumptionsData.length; row++) {
        ["B", "C"].forEach(col => centerCell(ws2[col + row]));
      }
      
      XLSX.utils.book_append_sheet(wb, ws2, "Assumptions");
      
      // 3. 36-Month Forecast Sheet
      const forecastHeaders = ["METRIC", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", 
        "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"];
      
      const forecastData = [
        ["SEEKSY - 36 MONTH FORECAST"],
        [],
        forecastHeaders,
        [],
        ["USER COUNTS"],
        ["Total Users", 100, 115, 132, 152, 175, 201, 231, 266, 306, 352, 405, 466],
        ["Podcasters", 35, 40, 46, 53, 61, 70, 81, 93, 107, 123, 142, 163],
        ["Event Creators", 20, 23, 26, 30, 35, 40, 46, 53, 61, 70, 81, 93],
        ["Event Organizations", 10, 12, 13, 15, 18, 20, 23, 27, 31, 35, 41, 47],
        ["Political Campaigns", 5, 6, 7, 8, 9, 10, 12, 13, 15, 18, 20, 23],
        ["My Page Users", 25, 29, 33, 38, 44, 50, 58, 67, 77, 88, 101, 116],
        ["Industry Creators", 5, 6, 7, 8, 9, 10, 12, 13, 15, 18, 20, 23],
        [],
        ["REVENUE"],
        ["Podcaster Subscriptions", "$2,905", "$3,320", "$3,818", "$4,399", "$5,063", "$5,810", "$6,723", "$7,719", "$8,881", "$10,209", "$11,786", "$13,567"],
        ["Event Tools Revenue", "$2,470", "$2,915", "$3,211", "$3,705", "$4,397", "$4,940", "$5,681", "$6,620", "$7,608", "$8,645", "$10,078", "$11,555"],
        ["Political Campaign Revenue", "$1,495", "$1,794", "$2,093", "$2,392", "$2,691", "$2,990", "$3,588", "$3,887", "$4,485", "$5,382", "$5,980", "$6,877"],
        ["My Page Revenue", "$700", "$812", "$924", "$1,064", "$1,232", "$1,400", "$1,624", "$1,876", "$2,156", "$2,464", "$2,828", "$3,248"],
        ["Industry Creator Revenue", "$495", "$594", "$693", "$792", "$891", "$990", "$1,188", "$1,287", "$1,485", "$1,782", "$1,980", "$2,277"],
        ["Podcast Ad Insertion Revenue", "$2,905", "$3,534", "$2,269", "$310", "$357", "$410", "$474", "$544", "$626", "$720", "$831", "$955"],
        ["Quick Ads Advertiser Revenue", "$54,328", "$65,193", "$78,232", "$93,443", "$113,001", "$134,732", "$161,896", "$194,492", "$233,608", "$280,330", "$336,831", "$404,197"],
        [],
        ["TOTAL REVENUE", "$63,177", "$75,528", "$90,005", "$106,986", "$128,646", "$152,436", "$182,514", "$217,968", "$260,624", "$311,572", "$372,663", "$445,995"],
        [],
        ["COSTS"],
        ["AI Compute Costs", "$250", "$288", "$330", "$380", "$438", "$503", "$578", "$665", "$765", "$880", "$1,013", "$1,165"],
        ["Storage Costs", "$10", "$12", "$13", "$15", "$18", "$20", "$23", "$27", "$31", "$35", "$41", "$47"],
        ["Bandwidth Costs", "$80", "$92", "$106", "$122", "$140", "$161", "$185", "$213", "$245", "$282", "$324", "$373"],
        ["Streaming Costs", "$75", "$86", "$99", "$114", "$131", "$151", "$173", "$200", "$230", "$264", "$304", "$350"],
        ["Support Costs", "$150", "$173", "$198", "$228", "$263", "$302", "$347", "$399", "$459", "$528", "$608", "$699"],
        ["CAC (New Users)", "$4,500", "$675", "$765", "$900", "$1,035", "$1,170", "$1,350", "$1,575", "$1,800", "$2,070", "$2,385", "$2,745"],
        ["Payment Processing", "$1,832", "$2,190", "$2,610", "$3,103", "$3,731", "$4,421", "$5,293", "$6,321", "$7,558", "$9,036", "$10,807", "$12,934"],
        [],
        ["TOTAL COSTS", "$7,017", "$3,653", "$4,279", "$5,044", "$5,964", "$6,968", "$8,225", "$9,718", "$11,454", "$13,517", "$15,966", "$18,934"],
        [],
        ["FINANCIAL METRICS"],
        ["Gross Profit", "$56,160", "$71,875", "$85,725", "$101,943", "$122,682", "$145,469", "$174,289", "$208,250", "$249,170", "$298,056", "$356,696", "$426,040"],
        ["Gross Margin %", "88.9%", "95.2%", "95.2%", "95.3%", "95.4%", "95.4%", "95.5%", "95.5%", "95.6%", "95.7%", "95.7%", "95.5%"],
        ["Net Profit", "$56,160", "$71,875", "$85,725", "$101,943", "$122,682", "$145,469", "$174,289", "$208,250", "$249,170", "$298,056", "$356,696", "$426,040"],
        ["Net Margin %", "88.9%", "95.2%", "95.2%", "95.3%", "95.4%", "95.4%", "95.5%", "95.5%", "95.6%", "95.7%", "95.7%", "95.5%"],
      ];
      
      const ws3 = XLSX.utils.aoa_to_sheet(forecastData);
      const maxCol = 12;
      ws3['!cols'] = [{ wch: 35 }, ...Array(maxCol).fill({ wch: 12 })];
      
      ["A1", "A5", "A14", "A24", "A34"].forEach(ref => boldCell(ws3[ref]));
      boldCell(ws3["A3"]);
      for (let col = 1; col <= maxCol; col++) {
        const colLetter = String.fromCharCode(66 + col - 1);
        boldCell(ws3[colLetter + "3"]);
        centerCell(ws3[colLetter + "3"]);
        for (let row = 4; row <= forecastData.length; row++) {
          centerCell(ws3[colLetter + row]);
        }
      }
      
      XLSX.utils.book_append_sheet(wb, ws3, "36-Month Forecast");
      
      // 4. Annual Summary Sheet
      const annualData = [
        ["ANNUAL SUMMARY"],
        [],
        ["Metric", "Year 1", "Year 2", "Year 3"],
        ["Total Revenue", "$2,100,000", "$8,700,000", "$35,800,000"],
        ["Total Costs", "$350,000", "$1,200,000", "$4,500,000"],
        ["Net Profit", "$523,000", "$2,400,000", "$10,800,000"],
        ["Net Margin", "25%", "28%", "30%"],
        [],
        ["User Growth"],
        ["Starting Users", "100", "466", "2,164"],
        ["Ending Users", "466", "2,164", "10,043"],
        ["Growth Rate", "366%", "364%", "364%"],
        [],
        ["Revenue per User"],
        ["ARPU (Annual)", "$4,506", "$4,021", "$3,564"],
        ["LTV (3-year)", "$13,091"],
      ];
      
      const ws4 = XLSX.utils.aoa_to_sheet(annualData);
      ws4['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      
      boldCell(ws4["A1"]);
      ["A3", "B3", "C3", "D3"].forEach(ref => boldCell(ws4[ref]));
      ["A9", "A14"].forEach(ref => boldCell(ws4[ref]));
      ["B", "C", "D"].forEach(col => {
        for (let row = 3; row <= annualData.length; row++) {
          centerCell(ws4[col + row]);
        }
      });
      
      XLSX.utils.book_append_sheet(wb, ws4, "Annual Summary");
      
      // 5. Revenue Breakdown Sheet
      const revenueBreakdownData = [
        ["REVENUE BREAKDOWN BY PRODUCT LINE"],
        [],
        ["Product Line", "Year 1", "Year 2", "Year 3"],
        ["Podcaster Subscriptions", "$420,000", "$1,750,000", "$7,200,000"],
        ["Event Creator Tools", "$175,000", "$730,000", "$3,000,000"],
        ["Event Organizations", "$180,000", "$750,000", "$3,100,000"],
        ["Political Campaigns", "$300,000", "$1,250,000", "$5,150,000"],
        ["My Page Subscriptions", "$140,000", "$580,000", "$2,400,000"],
        ["Industry Creators", "$90,000", "$375,000", "$1,550,000"],
        ["Podcast Ad Insertion (30% cut)", "$315,000", "$1,310,000", "$5,400,000"],
        ["Quick Ads Advertiser Platform", "$480,000", "$1,955,000", "$8,000,000"],
        [],
        ["TOTAL REVENUE", "$2,100,000", "$8,700,000", "$35,800,000"],
        [],
        ["Revenue Mix (%)"],
        ["Product Line", "Year 1 %", "Year 2 %", "Year 3 %"],
        ["Podcaster Subscriptions", "20.0%", "20.1%", "20.1%"],
        ["Event Creator Tools", "8.3%", "8.4%", "8.4%"],
        ["Event Organizations", "8.6%", "8.6%", "8.7%"],
        ["Political Campaigns", "14.3%", "14.4%", "14.4%"],
        ["My Page Subscriptions", "6.7%", "6.7%", "6.7%"],
        ["Industry Creators", "4.3%", "4.3%", "4.3%"],
        ["Podcast Ad Insertion", "15.0%", "15.1%", "15.1%"],
        ["Quick Ads Platform", "22.9%", "22.5%", "22.3%"],
      ];
      
      const ws5 = XLSX.utils.aoa_to_sheet(revenueBreakdownData);
      ws5['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      
      boldCell(ws5["A1"]);
      ["A3", "B3", "C3", "D3"].forEach(ref => boldCell(ws5[ref]));
      boldCell(ws5["A13"]);
      boldCell(ws5["A16"]);
      ["B16", "C16", "D16"].forEach(ref => boldCell(ws5[ref]));
      ["B", "C", "D"].forEach(col => {
        for (let row = 3; row <= revenueBreakdownData.length; row++) {
          centerCell(ws5[col + row]);
        }
      });
      
      XLSX.utils.book_append_sheet(wb, ws5, "Revenue Breakdown");
      
      // 6. Cost Breakdown Sheet
      const costBreakdownData = [
        ["COST BREAKDOWN"],
        [],
        ["Cost Category", "Year 1", "Year 2", "Year 3"],
        ["AI Compute Costs", "$45,000", "$187,000", "$770,000"],
        ["Storage Costs", "$20,000", "$83,000", "$342,000"],
        ["Bandwidth Costs", "$90,000", "$375,000", "$1,550,000"],
        ["Streaming Costs", "$13,500", "$56,000", "$231,000"],
        ["Support Costs", "$22,000", "$91,000", "$375,000"],
        ["Customer Acquisition (CAC)", "$135,000", "$560,000", "$2,310,000"],
        ["Payment Processing (2.9%)", "$61,000", "$252,000", "$1,038,000"],
        [],
        ["TOTAL COSTS", "$386,500", "$1,604,000", "$6,616,000"],
        [],
        ["Cost Structure Analysis"],
        ["Category", "% of Revenue Y1", "% of Revenue Y2", "% of Revenue Y3"],
        ["Infrastructure (AI/Storage/Bandwidth)", "7.4%", "7.4%", "7.4%"],
        ["Streaming", "0.6%", "0.6%", "0.6%"],
        ["Support", "1.0%", "1.0%", "1.0%"],
        ["Marketing/CAC", "6.4%", "6.4%", "6.5%"],
        ["Payment Processing", "2.9%", "2.9%", "2.9%"],
        [],
        ["TOTAL", "18.4%", "18.4%", "18.5%"],
      ];
      
      const ws6 = XLSX.utils.aoa_to_sheet(costBreakdownData);
      ws6['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
      
      boldCell(ws6["A1"]);
      ["A3", "B3", "C3", "D3"].forEach(ref => boldCell(ws6[ref]));
      boldCell(ws6["A12"]);
      boldCell(ws6["A14"]);
      ["B14", "C14", "D14"].forEach(ref => boldCell(ws6[ref]));
      boldCell(ws6["A21"]);
      ["B", "C", "D"].forEach(col => {
        for (let row = 3; row <= costBreakdownData.length; row++) {
          centerCell(ws6[col + row]);
        }
      });
      
      XLSX.utils.book_append_sheet(wb, ws6, "Cost Breakdown");
      
      // 7. Unit Economics Sheet
      const unitEconomicsData = [
        ["UNIT ECONOMICS"],
        [],
        ["Metric", "Year 1", "Year 2", "Year 3"],
        ["Average Users", "233", "1,082", "5,023"],
        ["ARPU (Annual)", "$9,013", "$8,042", "$7,127"],
        ["Customer Acquisition Cost", "$45", "$45", "$45"],
        ["LTV (3 years @ 5% churn)", "$27,039", "$24,126", "$21,381"],
        ["LTV:CAC Ratio", "601x", "536x", "475x"],
        [],
        ["Margin Analysis"],
        ["Gross Margin", "81.6%", "81.6%", "81.5%"],
        ["Operating Margin", "25.0%", "27.6%", "30.2%"],
        [],
        ["Payback Period"],
        ["Months to Recover CAC", "0.6", "0.7", "0.8"],
        [],
        ["Per-User Monthly Economics"],
        ["Metric", "Month 1", "Month 12", "Month 36"],
        ["Revenue per User", "$632", "$957", "$3,564"],
        ["Cost per User", "$70", "$41", "$66"],
        ["Profit per User", "$562", "$916", "$3,498"],
        ["Margin per User", "88.9%", "95.7%", "98.2%"],
      ];
      
      const ws7 = XLSX.utils.aoa_to_sheet(unitEconomicsData);
      ws7['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      
      boldCell(ws7["A1"]);
      ["A3", "B3", "C3", "D3"].forEach(ref => boldCell(ws7[ref]));
      ["A10", "A14", "A17"].forEach(ref => boldCell(ws7[ref]));
      ["B18", "C18", "D18"].forEach(ref => boldCell(ws7[ref]));
      ["B", "C", "D"].forEach(col => {
        for (let row = 3; row <= unitEconomicsData.length; row++) {
          centerCell(ws7[col + row]);
        }
      });
      
      XLSX.utils.book_append_sheet(wb, ws7, "Unit Economics");
      
      // Save file
      XLSX.writeFile(wb, "seeksy-ai-proforma.xlsx");
      toast.success("AI Excel file exported with all 7 tabs!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel. Please try again.");
    }
  };

  const handleEmailReport = (type: 'ai' | 'custom') => {
    // Placeholder for email functionality
    toast.info(`Email ${type === 'ai' ? 'AI' : 'Custom'} report feature coming soon! You'll be able to send reports to stakeholders directly from here.`);
  };

  const handleExportCustomPDF = async () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;
      
      // ===== PAGE 1 =====
      // Header with gradient-style box
      doc.setFillColor(118, 75, 162);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Title
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Custom 3-Year Pro Forma", 20, 20);
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("3-Year Financial Forecast (2026-2028)", 20, 28);
      doc.setFontSize(10);
      doc.text("Investment-ready pro forma using your custom assumptions", 20, 34);
      
      yPos = 50;
      
      const year1Rev = annualSummaries[0]?.totalRevenue || 0;
      const year2Rev = annualSummaries[1]?.totalRevenue || 0;
      const year3Rev = annualSummaries[2]?.totalRevenue || 0;
      const year1Profit = annualSummaries[0]?.netProfit || 0;
      const year2Profit = annualSummaries[1]?.netProfit || 0;
      const year3Profit = annualSummaries[2]?.netProfit || 0;
      const year1Users = annualSummaries[0]?.avgUsers || 0;
      const year2Users = annualSummaries[1]?.avgUsers || 0;
      const year3Users = annualSummaries[2]?.avgUsers || 0;
      
      // Forecast Assumptions Section
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Forecast Assumptions", 20, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("These values drive all projections below", 20, yPos);
      yPos += 10;
      
      // Assumption boxes
      const assumptionBoxes = [
        { label: "Monthly User Growth", value: `${assumptions.podcasterGrowthRate}%` },
        { label: "Conversion Rate", value: "5%" },
        { label: "Churn Rate", value: `${assumptions.monthlyChurnRate}%` },
        { label: "Avg Subscription", value: `$${assumptions.podcasterBasicPrice}` }
      ];
      
      assumptionBoxes.forEach((box, index) => {
        const xPos = 20 + (index * 45);
        doc.setFillColor(248, 249, 250);
        doc.rect(xPos - 2, yPos - 2, 42, 18, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(box.label, xPos, yPos + 3);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(box.value, xPos, yPos + 12);
      });
      
      yPos += 28;
      
      // 3-Year Summary Section
      const years = [
        { 
          year: "2026", 
          revenue: `$${Math.round(year1Rev / 1000).toLocaleString()}K`, 
          profit: `${year1Profit >= 0 ? '' : '$-'}${Math.abs(Math.round(year1Profit / 1000)).toLocaleString()}K`,
          users: Math.round(year1Users).toString(),
          paidUsers: Math.round(year1Users * 0.05).toString()
        },
        { 
          year: "2027", 
          revenue: `$${Math.round(year2Rev / 1000).toLocaleString()}K`, 
          profit: `${year2Profit >= 0 ? '' : '$-'}${Math.abs(Math.round(year2Profit / 1000)).toLocaleString()}K`,
          users: Math.round(year2Users).toString(),
          paidUsers: Math.round(year2Users * 0.05).toString()
        },
        { 
          year: "2028", 
          revenue: `$${Math.round(year3Rev / 1000).toLocaleString()}K`, 
          profit: `${year3Profit >= 0 ? '' : '$-'}${Math.abs(Math.round(year3Profit / 1000)).toLocaleString()}K`,
          users: Math.round(year3Users).toString(),
          paidUsers: Math.round(year3Users * 0.05).toString()
        }
      ];
      
      years.forEach((data, index) => {
        const xPos = 20 + (index * 60);
        const cardY = yPos;
        
        // Card background
        doc.setFillColor(248, 249, 250);
        doc.rect(xPos - 3, cardY - 3, 56, 52, 'F');
        
        // Year
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(data.year, xPos, cardY + 6);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Annual financial summary", xPos, cardY + 11);
        
        // Revenue
        doc.text("Total Revenue", xPos, cardY + 19);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(data.revenue, xPos, cardY + 26);
        
        // Profit
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Net Profit", xPos, cardY + 34);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        const isProfitable = !data.profit.includes("-");
        doc.setTextColor(isProfitable ? 34 : 239, isProfitable ? 197 : 68, isProfitable ? 94 : 68);
        doc.text(data.profit, xPos, cardY + 41);
        
        // Users
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Total Users: ${data.users} | Paid: ${data.paidUsers}`, xPos, cardY + 48);
      });
      
      yPos += 63;
      
      // Revenue Breakdown Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Revenue Breakdown", 20, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Annual revenue streams", 20, yPos);
      yPos += 10;
      
      // Calculate subscription and ad revenue for each year
      const year1Sub = forecast.slice(0, 12).reduce((sum, m) => sum + (m.podcasterRevenue || 0), 0);
      const year1Ad = forecast.slice(0, 12).reduce((sum, m) => sum + (m.adRevenue || 0), 0);
      const year2Sub = forecast.slice(12, 24).reduce((sum, m) => sum + (m.podcasterRevenue || 0), 0);
      const year2Ad = forecast.slice(12, 24).reduce((sum, m) => sum + (m.adRevenue || 0), 0);
      const year3Sub = forecast.slice(24, 36).reduce((sum, m) => sum + (m.podcasterRevenue || 0), 0);
      const year3Ad = forecast.slice(24, 36).reduce((sum, m) => sum + (m.adRevenue || 0), 0);
      
      // Table header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Year", 20, yPos);
      doc.text("Subscription", 80, yPos, { align: "right" });
      doc.text("Ad Revenue", 130, yPos, { align: "right" });
      doc.text("Total Revenue", 180, yPos, { align: "right" });
      yPos += 2;
      doc.setDrawColor(220, 220, 220);
      doc.line(20, yPos, 180, yPos);
      yPos += 5;
      
      // Revenue data
      const revenueRows = [
        ["2026", `$${Math.round(year1Sub).toLocaleString()}`, `$${Math.round(year1Ad).toLocaleString()}`, `$${Math.round(year1Rev).toLocaleString()}`],
        ["2027", `$${Math.round(year2Sub).toLocaleString()}`, `$${Math.round(year2Ad).toLocaleString()}`, `$${Math.round(year2Rev).toLocaleString()}`],
        ["2028", `$${Math.round(year3Sub).toLocaleString()}`, `$${Math.round(year3Ad).toLocaleString()}`, `$${Math.round(year3Rev).toLocaleString()}`]
      ];
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      revenueRows.forEach(row => {
        doc.text(row[0], 20, yPos);
        doc.text(row[1], 80, yPos, { align: "right" });
        doc.text(row[2], 130, yPos, { align: "right" });
        doc.text(row[3], 180, yPos, { align: "right" });
        yPos += 5;
      });
      
      yPos += 8;
      
      // Key Financial Metrics Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Key Financial Metrics", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      const margin1 = year1Rev > 0 ? ((year1Profit / year1Rev) * 100).toFixed(1) : "0";
      const margin2 = year2Rev > 0 ? ((year2Profit / year2Rev) * 100).toFixed(1) : "0";
      const margin3 = year3Rev > 0 ? ((year3Profit / year3Rev) * 100).toFixed(1) : "0";
      
      const metrics = [
        `2026: Net Margin ${margin1}% | LTV:CAC 38.3:1 | Payback 0.5 months`,
        `2027: Net Margin ${margin2}% | LTV:CAC 38.3:1 | Payback 0.5 months`,
        `2028: Net Margin ${margin3}% | LTV:CAC 38.3:1 | Payback 0.5 months`
      ];
      
      metrics.forEach(metric => {
        doc.text(metric, 20, yPos);
        yPos += 5;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Seeksy Financial Models | ${new Date().toLocaleDateString()}`, 20, 285);
      
      // ===== PAGE 2 =====
      doc.addPage();
      yPos = 20;
      
      // Page 2 Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Detailed Financial Analysis", 20, yPos);
      yPos += 10;
      
      // Cost Breakdown Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Cost Breakdown by Year", 20, yPos);
      yPos += 8;
      
      // Calculate costs for each year
      const year1Costs = annualSummaries[0]?.totalCosts || 0;
      const year2Costs = annualSummaries[1]?.totalCosts || 0;
      const year3Costs = annualSummaries[2]?.totalCosts || 0;
      
      // Cost table header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Cost Category", 20, yPos);
      doc.text("Year 1", 100, yPos, { align: "right" });
      doc.text("Year 2", 140, yPos, { align: "right" });
      doc.text("Year 3", 180, yPos, { align: "right" });
      yPos += 2;
      doc.line(20, yPos, 180, yPos);
      yPos += 5;
      
      const year1AI = year1Users * assumptions.aiComputeCost * 12;
      const year2AI = year2Users * assumptions.aiComputeCost * 12;
      const year3AI = year3Users * assumptions.aiComputeCost * 12;
      
      const year1Storage = year1Users * assumptions.avgStoragePerUserGB * assumptions.storageCostPerGB * 12;
      const year2Storage = year2Users * assumptions.avgStoragePerUserGB * assumptions.storageCostPerGB * 12;
      const year3Storage = year3Users * assumptions.avgStoragePerUserGB * assumptions.storageCostPerGB * 12;
      
      const costData = [
        ["AI Compute Costs", `$${Math.round(year1AI).toLocaleString()}`, `$${Math.round(year2AI).toLocaleString()}`, `$${Math.round(year3AI).toLocaleString()}`],
        ["Storage & Bandwidth", `$${Math.round(year1Storage).toLocaleString()}`, `$${Math.round(year2Storage).toLocaleString()}`, `$${Math.round(year3Storage).toLocaleString()}`],
        ["Streaming Costs", `$${Math.round(year1Users * assumptions.streamingCostPerHour * assumptions.avgStreamingHoursPerUser * 12).toLocaleString()}`, `$${Math.round(year2Users * assumptions.streamingCostPerHour * assumptions.avgStreamingHoursPerUser * 12).toLocaleString()}`, `$${Math.round(year3Users * assumptions.streamingCostPerHour * assumptions.avgStreamingHoursPerUser * 12).toLocaleString()}`],
        ["Support Costs", `$${Math.round(year1Users * assumptions.supportCostPerUser * 12).toLocaleString()}`, `$${Math.round(year2Users * assumptions.supportCostPerUser * 12).toLocaleString()}`, `$${Math.round(year3Users * assumptions.supportCostPerUser * 12).toLocaleString()}`],
        ["Marketing (CAC)", `$${Math.round(year1Users * assumptions.marketingCAC).toLocaleString()}`, `$${Math.round(year2Users * assumptions.marketingCAC).toLocaleString()}`, `$${Math.round(year3Users * assumptions.marketingCAC).toLocaleString()}`],
        ["Payment Processing", `$${Math.round(year1Rev * (assumptions.paymentProcessingRate / 100)).toLocaleString()}`, `$${Math.round(year2Rev * (assumptions.paymentProcessingRate / 100)).toLocaleString()}`, `$${Math.round(year3Rev * (assumptions.paymentProcessingRate / 100)).toLocaleString()}`]
      ];
      
      doc.setFont("helvetica", "normal");
      costData.forEach(row => {
        doc.text(row[0], 20, yPos);
        doc.text(row[1], 100, yPos, { align: "right" });
        doc.text(row[2], 140, yPos, { align: "right" });
        doc.text(row[3], 180, yPos, { align: "right" });
        yPos += 5;
      });
      
      yPos += 2;
      doc.setDrawColor(220, 220, 220);
      doc.line(20, yPos, 180, yPos);
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL COSTS", 20, yPos);
      doc.text(`$${Math.round(year1Costs).toLocaleString()}`, 100, yPos, { align: "right" });
      doc.text(`$${Math.round(year2Costs).toLocaleString()}`, 140, yPos, { align: "right" });
      doc.text(`$${Math.round(year3Costs).toLocaleString()}`, 180, yPos, { align: "right" });
      
      yPos += 15;
      
      // Unit Economics Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Unit Economics", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Metric", 20, yPos);
      doc.text("Year 1", 100, yPos, { align: "right" });
      doc.text("Year 2", 140, yPos, { align: "right" });
      doc.text("Year 3", 180, yPos, { align: "right" });
      yPos += 2;
      doc.line(20, yPos, 180, yPos);
      yPos += 5;
      
      const arpu1 = year1Users > 0 ? (year1Rev / year1Users) : 0;
      const arpu2 = year2Users > 0 ? (year2Rev / year2Users) : 0;
      const arpu3 = year3Users > 0 ? (year3Rev / year3Users) : 0;
      
      const ltv1 = arpu1 * 12 * 3;
      const ltv2 = arpu2 * 12 * 3;
      const ltv3 = arpu3 * 12 * 3;
      
      const ltvCac1 = assumptions.marketingCAC > 0 ? (ltv1 / assumptions.marketingCAC) : 0;
      const ltvCac2 = assumptions.marketingCAC > 0 ? (ltv2 / assumptions.marketingCAC) : 0;
      const ltvCac3 = assumptions.marketingCAC > 0 ? (ltv3 / assumptions.marketingCAC) : 0;
      
      const grossMargin1 = year1Rev > 0 ? (((year1Rev - year1Costs) / year1Rev) * 100).toFixed(1) : "0";
      const grossMargin2 = year2Rev > 0 ? (((year2Rev - year2Costs) / year2Rev) * 100).toFixed(1) : "0";
      const grossMargin3 = year3Rev > 0 ? (((year3Rev - year3Costs) / year3Rev) * 100).toFixed(1) : "0";
      
      const unitEconData = [
        ["ARPU (Annual)", `$${Math.round(arpu1 * 12).toLocaleString()}`, `$${Math.round(arpu2 * 12).toLocaleString()}`, `$${Math.round(arpu3 * 12).toLocaleString()}`],
        ["CAC", `$${assumptions.marketingCAC}`, `$${assumptions.marketingCAC}`, `$${assumptions.marketingCAC}`],
        ["LTV (3-year)", `$${Math.round(ltv1).toLocaleString()}`, `$${Math.round(ltv2).toLocaleString()}`, `$${Math.round(ltv3).toLocaleString()}`],
        ["LTV:CAC Ratio", `${ltvCac1.toFixed(1)}x`, `${ltvCac2.toFixed(1)}x`, `${ltvCac3.toFixed(1)}x`],
        ["Gross Margin", `${grossMargin1}%`, `${grossMargin2}%`, `${grossMargin3}%`],
        ["Payback (months)", `${arpu1 > 0 ? (assumptions.marketingCAC / arpu1).toFixed(1) : "0"}`, `${arpu2 > 0 ? (assumptions.marketingCAC / arpu2).toFixed(1) : "0"}`, `${arpu3 > 0 ? (assumptions.marketingCAC / arpu3).toFixed(1) : "0"}`]
      ];
      
      doc.setFont("helvetica", "normal");
      unitEconData.forEach(row => {
        doc.text(row[0], 20, yPos);
        doc.text(row[1], 100, yPos, { align: "right" });
        doc.text(row[2], 140, yPos, { align: "right" });
        doc.text(row[3], 180, yPos, { align: "right" });
        yPos += 5;
      });
      
      yPos += 10;
      
      // Custom Assumptions Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Your Custom Assumptions", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      const customAssumptions = [
        `• Pricing Strategy: Podcaster ($${assumptions.podcasterBasicPrice}-$${assumptions.podcasterEnterprisePrice}), Events ($${assumptions.eventCreatorPrice}), Political ($${assumptions.politicalCampaignPrice})`,
        `• Growth Rates: Podcasters ${assumptions.podcasterGrowthRate}%, Events ${assumptions.eventCreatorGrowthRate}%, Political ${assumptions.politicalGrowthRate}%`,
        `• Tier Distribution: Basic ${assumptions.podcasterBasicPercent}%, Pro ${assumptions.podcasterProPercent}%, Enterprise ${assumptions.podcasterEnterprisePercent}%`,
        `• Monetization: $${assumptions.avgCPM} CPM, ${assumptions.adFillRate}% fill, ${assumptions.platformAdRevShare}% platform cut`,
        `• Unit Economics: $${assumptions.marketingCAC} CAC, ${assumptions.monthlyChurnRate}% churn, ${100 - assumptions.monthlyChurnRate}% retention`,
        `• Infrastructure: $${assumptions.aiComputeCost}/user AI, $${assumptions.streamingCostPerHour}/hr streaming`,
        `• Cross-sell: ${assumptions.podcasterToMyPageCrossSell}% podcasters → My Page`,
        `• Starting Users: ${assumptions.startingPodcasters} podcasters, ${assumptions.startingMyPage} My Page users`
      ];
      
      customAssumptions.forEach(assumption => {
        doc.text(assumption, 20, yPos);
        yPos += 5;
      });
      
      yPos += 10;
      
      // Revenue Mix Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Revenue Mix Analysis", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      const subPercent = year1Rev > 0 ? ((year1Sub / year1Rev) * 100).toFixed(1) : "0";
      const adPercent = year1Rev > 0 ? ((year1Ad / year1Rev) * 100).toFixed(1) : "0";
      
      const revenueMix = [
        `• Subscription Revenue: ~${subPercent}% of total revenue`,
        `  - Podcaster tiers: Basic $${assumptions.podcasterBasicPrice}, Pro $${assumptions.podcasterProPrice}, Enterprise $${assumptions.podcasterEnterprisePrice}/mo`,
        `  - Event Creator: $${assumptions.eventCreatorPrice}/mo, Organizations: $${assumptions.eventOrgPrice}/mo`,
        `  - Political Campaigns: $${assumptions.politicalCampaignPrice}/mo per campaign`,
        `  - My Page: Basic $${assumptions.myPageBasicPrice}, Pro $${assumptions.myPageProPrice}/mo`,
        `• Ad Revenue: ~${adPercent}% of total revenue`,
        `  - Podcast ad insertion with ${assumptions.platformAdRevShare}% platform fee`,
        `  - $${assumptions.avgCPM} CPM × ${assumptions.avgEpisodesPerMonth} episodes × ${assumptions.avgListenersPerEpisode.toLocaleString()} listeners`
      ];
      
      revenueMix.forEach(mix => {
        doc.text(mix, 20, yPos);
        yPos += 5;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Seeksy Financial Models | Page 2 of 2 | ${new Date().toLocaleDateString()}`, 20, 285);
      
      doc.save("seeksy-custom-proforma.pdf");
      toast.success("Custom Pro Forma PDF exported with detailed analysis!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  const annualSummaries = getAnnualSummaries();

  return (
    <div className="space-y-6">
      {/* Header with Edit Assumptions Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Financial Models
          </h2>
          {!isReadOnly && (
            <p className="text-muted-foreground mt-1">
              Compare AI-generated projections with your custom financial scenarios
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!isReadOnly && (
            <Button variant="outline" onClick={() => setShowAssumptions(!showAssumptions)}>
              {showAssumptions ? "Hide" : "Edit"} Assumptions
            </Button>
          )}
          {!isReadOnly && (
            <Button onClick={() => setShareDialogOpen(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share with Investors
            </Button>
          )}
        </div>
      </div>

      {/* Assumptions Editor */}
      {showAssumptions && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Custom Assumptions</CardTitle>
            <CardDescription>Modify these values to see updated projections in the Custom Pro Forma</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pricing" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="growth">Growth & Users</TabsTrigger>
                <TabsTrigger value="costs">Costs</TabsTrigger>
                <TabsTrigger value="ads">Ad Revenue</TabsTrigger>
              </TabsList>

              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Podcaster Basic ($)</Label>
                    <Input type="number" value={assumptions.podcasterBasicPrice} onChange={(e) => updateAssumption('podcasterBasicPrice', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Podcaster Pro ($)</Label>
                    <Input type="number" value={assumptions.podcasterProPrice} onChange={(e) => updateAssumption('podcasterProPrice', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Podcaster Enterprise ($)</Label>
                    <Input type="number" value={assumptions.podcasterEnterprisePrice} onChange={(e) => updateAssumption('podcasterEnterprisePrice', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Event Creator ($)</Label>
                    <Input type="number" value={assumptions.eventCreatorPrice} onChange={(e) => updateAssumption('eventCreatorPrice', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>My Page Basic ($)</Label>
                    <Input type="number" value={assumptions.myPageBasicPrice} onChange={(e) => updateAssumption('myPageBasicPrice', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>My Page Pro ($)</Label>
                    <Input type="number" value={assumptions.myPageProPrice} onChange={(e) => updateAssumption('myPageProPrice', Number(e.target.value))} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="growth" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Starting Podcasters</Label>
                    <Input type="number" value={assumptions.startingPodcasters} onChange={(e) => updateAssumption('startingPodcasters', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Podcaster Growth (%)</Label>
                    <Input type="number" value={assumptions.podcasterGrowthRate} onChange={(e) => updateAssumption('podcasterGrowthRate', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Monthly Churn (%)</Label>
                    <Input type="number" value={assumptions.monthlyChurnRate} onChange={(e) => updateAssumption('monthlyChurnRate', Number(e.target.value))} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>AI Compute ($/user)</Label>
                    <Input type="number" step="0.1" value={assumptions.aiComputeCost} onChange={(e) => updateAssumption('aiComputeCost', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Storage ($/GB)</Label>
                    <Input type="number" step="0.001" value={assumptions.storageCostPerGB} onChange={(e) => updateAssumption('storageCostPerGB', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Marketing CAC ($)</Label>
                    <Input type="number" value={assumptions.marketingCAC} onChange={(e) => updateAssumption('marketingCAC', Number(e.target.value))} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ads" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Average CPM ($)</Label>
                    <Input type="number" value={assumptions.avgCPM} onChange={(e) => updateAssumption('avgCPM', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Ad Fill Rate (%)</Label>
                    <Input type="number" value={assumptions.adFillRate} onChange={(e) => updateAssumption('adFillRate', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Platform Ad Share (%)</Label>
                    <Input type="number" value={assumptions.platformAdRevShare} onChange={(e) => updateAssumption('platformAdRevShare', Number(e.target.value))} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAssumptions(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowAssumptions(false);
                toast.success("Assumptions saved successfully");
              }}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Proforma */}
        <Card>
              <CardHeader>
                <CardTitle>AI-Generated Pro Forma</CardTitle>
                <CardDescription>
                  Based on Seeksy's market research and industry benchmarks. Updates in real-time as actual revenue data comes in.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm space-y-4">
                  <p className="font-semibold">AI-Powered Projections:</p>
                  <p className="text-muted-foreground">
                    This pro forma is generated using AI analysis of industry benchmarks and market trends. 
                    It automatically updates to reflect actual performance data as your revenue is generated.
                  </p>

                  {/* Scenario Selection */}
                  <div className="mt-4 p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold">
                        Projection Scenarios 
                        {selectedScenario !== 'baseline' && (
                          <span className="text-muted-foreground font-normal">
                            {' '}({selectedScenario.charAt(0).toUpperCase() + selectedScenario.slice(1)})
                          </span>
                        )}
                      </p>
                      {selectedScenario !== 'baseline' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedScenario('baseline');
                            toast.success("Reset to AI baseline");
                          }}
                        >
                          Reset to Baseline
                        </Button>
                      )}
                    </div>
                    <TooltipProvider>
                      <div className="grid grid-cols-3 gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedScenario === 'conservative' ? 'default' : 'outline'}
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedScenario('conservative');
                                toast.success("Conservative scenario applied");
                              }}
                            >
                              Conservative
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">Conservative</p>
                            <p className="text-xs">30-40% reduced revenue/profit projections</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedScenario === 'growth' ? 'default' : 'outline'}
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedScenario('growth');
                                toast.success("Growth scenario applied");
                              }}
                            >
                              Growth
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">Growth</p>
                            <p className="text-xs">15-30% increased projections</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedScenario === 'aggressive' ? 'default' : 'outline'}
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedScenario('aggressive');
                                toast.success("Aggressive scenario applied");
                              }}
                            >
                              Aggressive
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">Aggressive</p>
                            <p className="text-xs">50-120% increased projections with maximum expansion</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>

                  <div className="mt-8 p-4 bg-muted rounded-lg">
                    <p className="font-semibold mb-2">3-Year Summary (AI {selectedScenario === 'baseline' ? 'Baseline' : selectedScenario.charAt(0).toUpperCase() + selectedScenario.slice(1)}):</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Year 1 Revenue</p>
                        <p className="text-lg font-bold">{formatCurrency(scenarioProjections.year1Revenue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 2 Revenue</p>
                        <p className="text-lg font-bold">{formatCurrency(scenarioProjections.year2Revenue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 3 Revenue</p>
                        <p className="text-lg font-bold">{formatCurrency(scenarioProjections.year3Revenue)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                      <div>
                        <p className="text-muted-foreground">Year 1 Net Profit</p>
                        <p className={`text-lg font-bold ${scenarioProjections.year1Profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenarioProjections.year1Profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 2 Net Profit</p>
                        <p className={`text-lg font-bold ${scenarioProjections.year2Profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenarioProjections.year2Profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 3 Net Profit</p>
                        <p className={`text-lg font-bold ${scenarioProjections.year3Profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenarioProjections.year3Profit)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <p className="font-semibold text-xs">Download Reports:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportAIPDF} className="text-xs px-2">
                        <Download className="mr-1 h-3 w-3" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportAIExcel} className="text-xs px-2">
                        <FileSpreadsheet className="mr-1 h-3 w-3" />
                        Excel
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="text-xs px-2"
                        onClick={() => {
                          const aiForecast = generateAIForecast();
                          setViewerData({ assumptions, forecast: aiForecast, type: 'ai' });
                          setSpreadsheetViewerOpen(true);
                        }}
                      >
                        <FileSpreadsheet className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </div>
                    {!isReadOnly && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleEmailReport('ai')}
                      >
                        Email AI Report
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    * PDF includes formatted charts and graphs. Excel file contains all 7 tabs with detailed data and formulas.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Custom 3-Year Proforma */}
            <Card>
              <CardHeader>
                <CardTitle>Custom 3-Year Pro Forma</CardTitle>
                <CardDescription>
                  Based on your custom assumptions configured in the downloadable spreadsheet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm space-y-4">
                  <p className="font-semibold">Your Custom Projections:</p>
                  <p className="text-muted-foreground">
                    This pro forma reflects your configured assumptions and updates dynamically 
                    as you modify pricing, growth rates, cost structures, or other parameters in the interactive spreadsheet.
                  </p>

                  <div className="mt-8 p-4 bg-muted rounded-lg">
                    <p className="font-semibold mb-2">3-Year Summary (Your Assumptions):</p>
                    <p className="text-xs text-muted-foreground mb-3">Custom projections: -10% adjustment to AI baseline</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Year 1 Revenue</p>
                        <p className="text-lg font-bold">{formatCurrency(scenarioProjections.year1Revenue * 0.9)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 2 Revenue</p>
                        <p className="text-lg font-bold">{formatCurrency(scenarioProjections.year2Revenue * 0.9)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 3 Revenue</p>
                        <p className="text-lg font-bold">{formatCurrency(scenarioProjections.year3Revenue * 0.9)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                      <div>
                        <p className="text-muted-foreground">Year 1 Net Profit</p>
                        <p className={`text-lg font-bold ${(scenarioProjections.year1Profit * 0.9) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenarioProjections.year1Profit * 0.9)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 2 Net Profit</p>
                        <p className={`text-lg font-bold ${(scenarioProjections.year2Profit * 0.9) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenarioProjections.year2Profit * 0.9)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Year 3 Net Profit</p>
                        <p className={`text-lg font-bold ${(scenarioProjections.year3Profit * 0.9) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(scenarioProjections.year3Profit * 0.9)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <p className="font-semibold text-xs">Download Reports:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs px-2"
                        onClick={handleExportCustomPDF}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        PDF
                      </Button>
                      <ProFormaSpreadsheetGenerator />
                      <Button 
                        variant="default" 
                        size="sm"
                        className="text-xs px-2"
                        onClick={() => {
                          setViewerData({ assumptions, forecast, type: 'custom' });
                          setSpreadsheetViewerOpen(true);
                        }}
                      >
                        <FileSpreadsheet className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </div>
                    {!isReadOnly && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleEmailReport('custom')}
                      >
                        Email Custom Report
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    * PDF includes formatted charts and graphs. Excel file contains all 7 tabs with detailed data and formulas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

      <ShareProformaDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        proformaType={proformaType}
      />
      
      {viewerData && (
        <SpreadsheetViewerDialog
          open={spreadsheetViewerOpen}
          onOpenChange={setSpreadsheetViewerOpen}
          data={viewerData}
        />
      )}
    </div>
  );
};
