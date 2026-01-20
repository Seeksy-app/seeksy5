import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export function ProFormaSpreadsheetGenerator() {
  const [generating, setGenerating] = useState(false);

  // Core assumptions
  const assumptions = {
    // Subscription pricing
    podcasterBasic: 29,
    podcasterPro: 79,
    podcasterEnterprise: 199,
    eventCreator: 49,
    eventOrganization: 149,
    politicalCampaign: 299,
    myPageBasic: 19,
    myPagePro: 49,
    industryCreator: 99,
    
    // Growth
    startingUsers: 100,
    monthlyGrowthRate: 0.15, // 15%
    
    // Segment distribution
    podcastersPct: 0.35,
    eventCreatorsPct: 0.20,
    eventOrgsPct: 0.10,
    politicalPct: 0.05,
    myPagePct: 0.25,
    industryPct: 0.05,
    
    // Ad revenue
    platformCPM: 15,
    episodesPerPodcaster: 4,
    listenersPerEpisode: 500,
    adFillRate: 0.65,
    platformRevShare: 0.30,
    
    // Quick Ads
    quickAdsStarter: 199,
    quickAdsGrowth: 499,
    quickAdsPro: 999,
    quickAdsEnterpriseLow: 2500,
    quickAdsEnterpriseHigh: 25000,
    startingAdvertisers: 50,
    advertiserGrowth: 0.20,
    tierMixStarter: 0.50,
    tierMixGrowth: 0.30,
    tierMixPro: 0.15,
    tierMixEnterprise: 0.05,
    
    // Costs
    aiComputePerUser: 2.5,
    storageCostPerGB: 0.02,
    storagePerUser: 5,
    bandwidthCostPerGB: 0.08,
    bandwidthPerUser: 10,
    streamingCostPerHour: 0.15,
    streamingHoursPerUser: 5,
    supportCostPerUser: 1.5,
    cac: 45,
    paymentProcessingFee: 0.029,
    churnRate: 0.05,
  };

  // Calculate 36 months of projections
  const calculateMonthlyData = () => {
    const months = [];
    
    for (let i = 0; i < 36; i++) {
      const totalUsers = Math.round(assumptions.startingUsers * Math.pow(1 + assumptions.monthlyGrowthRate, i));
      const podcasters = Math.round(totalUsers * assumptions.podcastersPct);
      const eventCreators = Math.round(totalUsers * assumptions.eventCreatorsPct);
      const eventOrgs = Math.round(totalUsers * assumptions.eventOrgsPct);
      const political = Math.round(totalUsers * assumptions.politicalPct);
      const myPageUsers = Math.round(totalUsers * assumptions.myPagePct);
      const industryCreators = Math.round(totalUsers * assumptions.industryPct);
      
      // Revenue calculations
      const podcasterRev = podcasters * ((assumptions.podcasterBasic * 0.4) + (assumptions.podcasterPro * 0.4) + (assumptions.podcasterEnterprise * 0.2));
      const eventToolsRev = (eventCreators * assumptions.eventCreator) + (eventOrgs * assumptions.eventOrganization);
      const politicalRev = political * assumptions.politicalCampaign;
      const myPageRev = myPageUsers * ((assumptions.myPageBasic * 0.7) + (assumptions.myPagePro * 0.3));
      const industryRev = industryCreators * assumptions.industryCreator;
      
      // Ad insertion revenue
      const adInsertionRev = (podcasters * assumptions.episodesPerPodcaster * assumptions.listenersPerEpisode * 
        (assumptions.platformCPM / 1000) * assumptions.adFillRate) * assumptions.platformRevShare;
      
      // Quick Ads revenue
      const advertisers = Math.round(assumptions.startingAdvertisers * Math.pow(1 + assumptions.advertiserGrowth, i));
      const quickAdsRev = advertisers * (
        (assumptions.tierMixStarter * assumptions.quickAdsStarter) +
        (assumptions.tierMixGrowth * assumptions.quickAdsGrowth) +
        (assumptions.tierMixPro * assumptions.quickAdsPro) +
        (assumptions.tierMixEnterprise * ((assumptions.quickAdsEnterpriseLow + assumptions.quickAdsEnterpriseHigh) / 2))
      );
      
      // Additional revenue streams
      const blogModuleRev = totalUsers * 0.15 * 25; // 15% adoption at $25/mo
      const rssAutoPostRev = podcasters * 0.2 * 15; // 20% adoption at $15/mo
      const autoPublishRev = totalUsers * 0.1 * 10; // 10% adoption at $10/mo
      
      const totalRevenue = podcasterRev + eventToolsRev + politicalRev + myPageRev + industryRev + 
        adInsertionRev + quickAdsRev + blogModuleRev + rssAutoPostRev + autoPublishRev;
      
      // Cost calculations
      const aiComputeCost = totalUsers * assumptions.aiComputePerUser;
      const storageCost = totalUsers * assumptions.storagePerUser * assumptions.storageCostPerGB;
      const bandwidthCost = totalUsers * assumptions.bandwidthPerUser * assumptions.bandwidthCostPerGB;
      const streamingCost = totalUsers * assumptions.streamingHoursPerUser * assumptions.streamingCostPerHour;
      const supportCost = totalUsers * assumptions.supportCostPerUser;
      const cacCost = i === 0 ? (totalUsers * assumptions.cac) : ((totalUsers - months[i-1].totalUsers) * assumptions.cac);
      const paymentProcessingCost = totalRevenue * assumptions.paymentProcessingFee;
      const churnImpact = totalUsers * assumptions.churnRate * ((assumptions.podcasterBasic + assumptions.myPageBasic) / 2);
      
      const totalCosts = aiComputeCost + storageCost + bandwidthCost + streamingCost + supportCost + 
        cacCost + paymentProcessingCost + churnImpact;
      
      const grossMargin = totalRevenue - totalCosts;
      const grossMarginPct = totalRevenue > 0 ? grossMargin / totalRevenue : 0;
      const netProfit = grossMargin;
      const netMarginPct = totalRevenue > 0 ? netProfit / totalRevenue : 0;
      
      months.push({
        month: i + 1,
        totalUsers,
        podcasters,
        eventCreators,
        eventOrgs,
        political,
        myPageUsers,
        industryCreators,
        podcasterRev,
        eventToolsRev,
        politicalRev,
        myPageRev,
        industryRev,
        adInsertionRev,
        quickAdsRev,
        blogModuleRev,
        rssAutoPostRev,
        autoPublishRev,
        totalRevenue,
        aiComputeCost,
        storageCost,
        bandwidthCost,
        streamingCost,
        supportCost,
        cacCost,
        paymentProcessingCost,
        churnImpact,
        totalCosts,
        grossMargin,
        grossMarginPct,
        netProfit,
        netMarginPct,
        advertisers,
      });
    }
    
    return months;
  };

  // Format worksheet with column widths and number formatting
  const formatWorksheet = (ws: any, data: any[][]) => {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Auto-size columns based on content
    const colWidths: number[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && cell.v) {
          const cellValue = String(cell.v);
          maxWidth = Math.max(maxWidth, cellValue.length);
        }
      }
      colWidths.push(Math.min(maxWidth + 2, 50)); // Cap at 50 characters
    }
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    // Apply formatting: bold headers, center alignment, and currency
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        const cell = ws[cellAddress];
        const cellValue = data[R] && data[R][C];
        
        // Initialize cell style
        if (!cell.s) cell.s = {};
        
        // Bold titles - first row and section headers (uppercase or containing colons)
        const isHeader = R === 0 || 
                        (cellValue && typeof cellValue === 'string' && 
                         (cellValue.includes(':') || cellValue === cellValue.toUpperCase() && cellValue.length > 3));
        
        if (isHeader) {
          cell.s.font = { bold: true };
        }
        
        // Center align all columns except the first column (C > 0)
        if (C > 0) {
          cell.s.alignment = { horizontal: "center" };
        }
        
        // Currency formatting for numeric values (except percentages)
        if (typeof cell.v === 'number' && cell.v !== 0) {
          const isPercentage = cellValue && typeof cellValue === 'string' && cellValue.includes('%');
          
          if (!isPercentage) {
            cell.z = '$#,##0';
          }
        }
      }
    }
  };

  const generateSpreadsheet = () => {
    setGenerating(true);
    
    try {
      const monthlyData = calculateMonthlyData();
      const workbook = XLSX.utils.book_new();

      // TAB 1: Executive Summary
      const executiveSummary = generateExecutiveSummary(monthlyData);
      const ws1 = XLSX.utils.aoa_to_sheet(executiveSummary);
      formatWorksheet(ws1, executiveSummary);
      XLSX.utils.book_append_sheet(workbook, ws1, "Executive Summary");

      // TAB 2: Assumptions
      const assumptionsSheet = generateAssumptions();
      const ws2 = XLSX.utils.aoa_to_sheet(assumptionsSheet);
      formatWorksheet(ws2, assumptionsSheet);
      XLSX.utils.book_append_sheet(workbook, ws2, "Assumptions");

      // TAB 3: 36-Month Forecast
      const monthlyForecast = generateMonthlyForecast(monthlyData);
      const ws3 = XLSX.utils.aoa_to_sheet(monthlyForecast);
      formatWorksheet(ws3, monthlyForecast);
      XLSX.utils.book_append_sheet(workbook, ws3, "36-Month Forecast");

      // TAB 4: Annual Summary
      const annualSummary = generateAnnualSummary(monthlyData);
      const ws4 = XLSX.utils.aoa_to_sheet(annualSummary);
      formatWorksheet(ws4, annualSummary);
      XLSX.utils.book_append_sheet(workbook, ws4, "Annual Summary");

      // TAB 5: Revenue Breakdown
      const revenueBreakdown = generateRevenueBreakdown(monthlyData);
      const ws5 = XLSX.utils.aoa_to_sheet(revenueBreakdown);
      formatWorksheet(ws5, revenueBreakdown);
      XLSX.utils.book_append_sheet(workbook, ws5, "Revenue Breakdown");

      // TAB 6: Cost Breakdown
      const costBreakdown = generateCostBreakdown(monthlyData);
      const ws6 = XLSX.utils.aoa_to_sheet(costBreakdown);
      formatWorksheet(ws6, costBreakdown);
      XLSX.utils.book_append_sheet(workbook, ws6, "Cost Breakdown");

      // TAB 7: Unit Economics
      const unitEconomics = generateUnitEconomics(monthlyData);
      const ws7 = XLSX.utils.aoa_to_sheet(unitEconomics);
      formatWorksheet(ws7, unitEconomics);
      XLSX.utils.book_append_sheet(workbook, ws7, "Unit Economics");

      // Generate file with cellStyles enabled
      const excelBuffer = XLSX.write(workbook, { 
        bookType: "xlsx", 
        type: "array",
        cellStyles: true 
      });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Seeksy_ProForma_3Year_Financial_Model.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Pro forma spreadsheet generated successfully!");
    } catch (error) {
      console.error("Error generating spreadsheet:", error);
      toast.error("Failed to generate spreadsheet");
    } finally {
      setGenerating(false);
    }
  };

  const generateExecutiveSummary = (data: any[]) => {
    // Calculate annual totals
    const year1Revenue = data.slice(0, 12).reduce((sum, m) => sum + m.totalRevenue, 0);
    const year2Revenue = data.slice(12, 24).reduce((sum, m) => sum + m.totalRevenue, 0);
    const year3Revenue = data.slice(24, 36).reduce((sum, m) => sum + m.totalRevenue, 0);
    
    const year1Costs = data.slice(0, 12).reduce((sum, m) => sum + m.totalCosts, 0);
    const year2Costs = data.slice(12, 24).reduce((sum, m) => sum + m.totalCosts, 0);
    const year3Costs = data.slice(24, 36).reduce((sum, m) => sum + m.totalCosts, 0);
    
    const year1Profit = year1Revenue - year1Costs;
    const year2Profit = year2Revenue - year2Costs;
    const year3Profit = year3Revenue - year3Costs;
    
    const avgUsers1 = data.slice(0, 12).reduce((sum, m) => sum + m.totalUsers, 0) / 12;
    const avgUsers2 = data.slice(12, 24).reduce((sum, m) => sum + m.totalUsers, 0) / 12;
    const avgUsers3 = data.slice(24, 36).reduce((sum, m) => sum + m.totalUsers, 0) / 12;
    
    const endUsers1 = data[11].totalUsers;
    const endUsers2 = data[23].totalUsers;
    const endUsers3 = data[35].totalUsers;
    
    return [
      ["SEEKSY - EXECUTIVE SUMMARY", "", "", "", ""],
      ["3-Year Financial Pro Forma", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "Year 1", "Year 2", "Year 3", "Total"],
      ["Annual Revenue", Math.round(year1Revenue), Math.round(year2Revenue), Math.round(year3Revenue), Math.round(year1Revenue + year2Revenue + year3Revenue)],
      ["Annual Costs", Math.round(year1Costs), Math.round(year2Costs), Math.round(year3Costs), Math.round(year1Costs + year2Costs + year3Costs)],
      ["Net Profit", Math.round(year1Profit), Math.round(year2Profit), Math.round(year3Profit), Math.round(year1Profit + year2Profit + year3Profit)],
      ["", "", "", "", ""],
      ["Gross Margin %", `${((year1Revenue - year1Costs) / year1Revenue * 100).toFixed(1)}%`, `${((year2Revenue - year2Costs) / year2Revenue * 100).toFixed(1)}%`, `${((year3Revenue - year3Costs) / year3Revenue * 100).toFixed(1)}%`, ""],
      ["Net Margin %", `${(year1Profit / year1Revenue * 100).toFixed(1)}%`, `${(year2Profit / year2Revenue * 100).toFixed(1)}%`, `${(year3Profit / year3Revenue * 100).toFixed(1)}%`, ""],
      ["", "", "", "", ""],
      ["Average Users", Math.round(avgUsers1), Math.round(avgUsers2), Math.round(avgUsers3), ""],
      ["Ending Users", endUsers1, endUsers2, endUsers3, ""],
      ["YoY Growth %", "", `${((endUsers2 - endUsers1) / endUsers1 * 100).toFixed(1)}%`, `${((endUsers3 - endUsers2) / endUsers2 * 100).toFixed(1)}%`, ""],
      ["", "", "", "", ""],
      ["KEY DRIVERS", "", "", "", ""],
      ["Subscription ARPU", `$${Math.round(year1Revenue / avgUsers1)}`, `$${Math.round(year2Revenue / avgUsers2)}`, `$${Math.round(year3Revenue / avgUsers3)}`, ""],
      ["CAC", `$${assumptions.cac}`, "", "", ""],
      ["LTV", `$${Math.round((year1Revenue / avgUsers1) * 12 / assumptions.churnRate)}`, "", "", ""],
      ["Payback Period (months)", Math.round(assumptions.cac / ((year1Revenue / avgUsers1) / 12)), "", "", ""],
      ["", "", "", "", ""],
      ["KEY ASSUMPTIONS", "", "", "", ""],
      ["Starting Users", assumptions.startingUsers, "", "", ""],
      ["Monthly Growth %", `${(assumptions.monthlyGrowthRate * 100).toFixed(0)}%`, "", "", ""],
      ["Platform CPM", `$${assumptions.platformCPM}`, "", "", ""],
      ["Ad Fill Rate", `${(assumptions.adFillRate * 100).toFixed(0)}%`, "", "", ""],
    ];
  };

  const generateAssumptions = () => {
    return [
      ["SEEKSY - ASSUMPTIONS", "", ""],
      ["All pricing and growth assumptions", "", ""],
      ["", "", ""],
      ["SUBSCRIPTION PRICING (Monthly)", "", ""],
      ["Podcaster Basic", assumptions.podcasterBasic, ""],
      ["Podcaster Pro", assumptions.podcasterPro, ""],
      ["Podcaster Enterprise", assumptions.podcasterEnterprise, ""],
      ["Event Creator", assumptions.eventCreator, ""],
      ["Event Organization", assumptions.eventOrganization, ""],
      ["Political Campaign", assumptions.politicalCampaign, ""],
      ["My Page Basic", assumptions.myPageBasic, ""],
      ["My Page Pro", assumptions.myPagePro, ""],
      ["Industry Creator", assumptions.industryCreator, ""],
      ["", "", ""],
      ["CUSTOMER GROWTH", "", ""],
      ["Starting Total Users", assumptions.startingUsers, ""],
      ["Monthly Growth Rate %", `${(assumptions.monthlyGrowthRate * 100).toFixed(0)}%`, ""],
      ["", "", ""],
      ["SEGMENT DISTRIBUTION %", "", ""],
      ["Podcasters %", `${(assumptions.podcastersPct * 100).toFixed(0)}%`, ""],
      ["Event Creators %", `${(assumptions.eventCreatorsPct * 100).toFixed(0)}%`, ""],
      ["Event Organizations %", `${(assumptions.eventOrgsPct * 100).toFixed(0)}%`, ""],
      ["Political Campaigns %", `${(assumptions.politicalPct * 100).toFixed(0)}%`, ""],
      ["My Page Users %", `${(assumptions.myPagePct * 100).toFixed(0)}%`, ""],
      ["Industry Creators %", `${(assumptions.industryPct * 100).toFixed(0)}%`, ""],
      ["", "", ""],
      ["AD REVENUE ASSUMPTIONS", "", ""],
      ["Platform CPM", assumptions.platformCPM, "per 1000"],
      ["Episodes per Podcaster/Month", assumptions.episodesPerPodcaster, ""],
      ["Avg Listeners per Episode", assumptions.listenersPerEpisode, ""],
      ["Ad Fill Rate %", `${(assumptions.adFillRate * 100).toFixed(0)}%`, ""],
      ["Platform Rev Share %", `${(assumptions.platformRevShare * 100).toFixed(0)}%`, ""],
      ["", "", ""],
      ["QUICK ADS - ADVERTISER PRICING", "", ""],
      ["Quick Ads Starter - Monthly", assumptions.quickAdsStarter, "1 ad, 10k impressions"],
      ["Quick Ads Growth - Monthly", assumptions.quickAdsGrowth, "3 ads, 50k impressions"],
      ["Quick Ads Pro - Monthly", assumptions.quickAdsPro, "Unlimited ads, 200k impressions"],
      ["Quick Ads Enterprise - Low", assumptions.quickAdsEnterpriseLow, "Custom campaigns"],
      ["Quick Ads Enterprise - High", assumptions.quickAdsEnterpriseHigh, "Full enterprise solution"],
      ["Quick Ads Avg Advertisers/Month", assumptions.startingAdvertisers, "Starting count"],
      ["Quick Ads Growth Rate %", `${(assumptions.advertiserGrowth * 100).toFixed(0)}%`, ""],
      ["Quick Ads Tier Mix: Starter %", `${(assumptions.tierMixStarter * 100).toFixed(0)}%`, ""],
      ["Quick Ads Tier Mix: Growth %", `${(assumptions.tierMixGrowth * 100).toFixed(0)}%`, ""],
      ["Quick Ads Tier Mix: Pro %", `${(assumptions.tierMixPro * 100).toFixed(0)}%`, ""],
      ["Quick Ads Tier Mix: Enterprise %", `${(assumptions.tierMixEnterprise * 100).toFixed(0)}%`, ""],
      ["", "", ""],
      ["COST STRUCTURE", "", ""],
      ["AI Compute Cost per User", assumptions.aiComputePerUser, "per month"],
      ["Storage Cost per GB", assumptions.storageCostPerGB, ""],
      ["Avg Storage per User (GB)", assumptions.storagePerUser, ""],
      ["Bandwidth Cost per GB", assumptions.bandwidthCostPerGB, ""],
      ["Avg Bandwidth per User (GB)", assumptions.bandwidthPerUser, ""],
      ["Streaming Cost per Hour", assumptions.streamingCostPerHour, ""],
      ["Avg Streaming Hours per User", assumptions.streamingHoursPerUser, ""],
      ["Support Cost per User", assumptions.supportCostPerUser, "per month"],
      ["CAC (Customer Acquisition Cost)", assumptions.cac, ""],
      ["Payment Processing Fee %", `${(assumptions.paymentProcessingFee * 100).toFixed(1)}%`, ""],
      ["Monthly Churn Rate %", `${(assumptions.churnRate * 100).toFixed(0)}%`, ""],
    ];
  };

  const generateMonthlyForecast = (data: any[]) => {
    const headers = ["METRIC", ...data.map(m => `Month ${m.month}`)];
    
    return [
      ["SEEKSY - 36 MONTH FORECAST"],
      [""],
      headers,
      [""],
      ["USER COUNTS"],
      ["Total Users", ...data.map(m => m.totalUsers)],
      ["Podcasters", ...data.map(m => m.podcasters)],
      ["Event Creators", ...data.map(m => m.eventCreators)],
      ["Event Organizations", ...data.map(m => m.eventOrgs)],
      ["Political Campaigns", ...data.map(m => m.political)],
      ["My Page Users", ...data.map(m => m.myPageUsers)],
      ["Industry Creators", ...data.map(m => m.industryCreators)],
      [""],
      ["REVENUE"],
      ["Podcaster Subscriptions", ...data.map(m => Math.round(m.podcasterRev))],
      ["Event Tools Revenue", ...data.map(m => Math.round(m.eventToolsRev))],
      ["Political Campaign Revenue", ...data.map(m => Math.round(m.politicalRev))],
      ["My Page Revenue", ...data.map(m => Math.round(m.myPageRev))],
      ["Industry Creator Revenue", ...data.map(m => Math.round(m.industryRev))],
      ["Podcast Ad Insertion Revenue", ...data.map(m => Math.round(m.adInsertionRev))],
      ["Quick Ads Advertiser Revenue", ...data.map(m => Math.round(m.quickAdsRev))],
      ["Blog Module Revenue", ...data.map(m => Math.round(m.blogModuleRev))],
      ["RSS Auto-Posting Revenue", ...data.map(m => Math.round(m.rssAutoPostRev))],
      ["Auto-Publishing Tools", ...data.map(m => Math.round(m.autoPublishRev))],
      [""],
      ["TOTAL REVENUE", ...data.map(m => Math.round(m.totalRevenue))],
      [""],
      ["COSTS"],
      ["AI Compute Costs", ...data.map(m => Math.round(m.aiComputeCost))],
      ["Storage Costs", ...data.map(m => Math.round(m.storageCost))],
      ["Bandwidth Costs", ...data.map(m => Math.round(m.bandwidthCost))],
      ["Streaming Costs", ...data.map(m => Math.round(m.streamingCost))],
      ["Support Costs", ...data.map(m => Math.round(m.supportCost))],
      ["CAC (New Users)", ...data.map(m => Math.round(m.cacCost))],
      ["Payment Processing", ...data.map(m => Math.round(m.paymentProcessingCost))],
      ["Churn Impact", ...data.map(m => Math.round(m.churnImpact))],
      [""],
      ["TOTAL COSTS", ...data.map(m => Math.round(m.totalCosts))],
      [""],
      ["FINANCIAL METRICS"],
      ["Gross Margin", ...data.map(m => Math.round(m.grossMargin))],
      ["Gross Margin %", ...data.map(m => `${(m.grossMarginPct * 100).toFixed(1)}%`)],
      ["Net Profit", ...data.map(m => Math.round(m.netProfit))],
      ["Net Margin %", ...data.map(m => `${(m.netMarginPct * 100).toFixed(1)}%`)],
    ];
  };

  const generateAnnualSummary = (data: any[]) => {
    const year1Revenue = data.slice(0, 12).reduce((sum, m) => sum + m.totalRevenue, 0);
    const year2Revenue = data.slice(12, 24).reduce((sum, m) => sum + m.totalRevenue, 0);
    const year3Revenue = data.slice(24, 36).reduce((sum, m) => sum + m.totalRevenue, 0);
    
    const year1Costs = data.slice(0, 12).reduce((sum, m) => sum + m.totalCosts, 0);
    const year2Costs = data.slice(12, 24).reduce((sum, m) => sum + m.totalCosts, 0);
    const year3Costs = data.slice(24, 36).reduce((sum, m) => sum + m.totalCosts, 0);
    
    const avgUsers1 = data.slice(0, 12).reduce((sum, m) => sum + m.totalUsers, 0) / 12;
    const avgUsers2 = data.slice(12, 24).reduce((sum, m) => sum + m.totalUsers, 0) / 12;
    const avgUsers3 = data.slice(24, 36).reduce((sum, m) => sum + m.totalUsers, 0) / 12;
    
    const endUsers1 = data[11].totalUsers;
    const endUsers2 = data[23].totalUsers;
    const endUsers3 = data[35].totalUsers;
    
    return [
      ["SEEKSY - ANNUAL SUMMARY"],
      [""],
      ["METRIC", "Year 1", "Year 2", "Year 3"],
      [""],
      ["Total Revenue", Math.round(year1Revenue), Math.round(year2Revenue), Math.round(year3Revenue)],
      ["Total Costs", Math.round(year1Costs), Math.round(year2Costs), Math.round(year3Costs)],
      ["Net Profit", Math.round(year1Revenue - year1Costs), Math.round(year2Revenue - year2Costs), Math.round(year3Revenue - year3Costs)],
      [""],
      ["Average Users", Math.round(avgUsers1), Math.round(avgUsers2), Math.round(avgUsers3)],
      ["Ending Users", endUsers1, endUsers2, endUsers3],
      ["User Growth", Math.round(avgUsers1), Math.round(avgUsers2 - avgUsers1), Math.round(avgUsers3 - avgUsers2)],
      ["YoY Growth %", "", `${((endUsers2 - endUsers1) / endUsers1 * 100).toFixed(1)}%`, `${((endUsers3 - endUsers2) / endUsers2 * 100).toFixed(1)}%`],
      [""],
      ["Gross Margin %", `${((year1Revenue - year1Costs) / year1Revenue * 100).toFixed(1)}%`, `${((year2Revenue - year2Costs) / year2Revenue * 100).toFixed(1)}%`, `${((year3Revenue - year3Costs) / year3Revenue * 100).toFixed(1)}%`],
      ["Net Margin %", `${((year1Revenue - year1Costs) / year1Revenue * 100).toFixed(1)}%`, `${((year2Revenue - year2Costs) / year2Revenue * 100).toFixed(1)}%`, `${((year3Revenue - year3Costs) / year3Revenue * 100).toFixed(1)}%`],
      [""],
      ["ARPU (Annual)", Math.round(year1Revenue / avgUsers1), Math.round(year2Revenue / avgUsers2), Math.round(year3Revenue / avgUsers3)],
      ["ARPU (Monthly)", Math.round(year1Revenue / avgUsers1 / 12), Math.round(year2Revenue / avgUsers2 / 12), Math.round(year3Revenue / avgUsers3 / 12)],
    ];
  };

  const generateRevenueBreakdown = (data: any[]) => {
    const headers = ["REVENUE STREAM", ...data.map(m => `Month ${m.month}`), "Year 1", "Year 2", "Year 3"];
    
    const year1 = (key: string) => Math.round(data.slice(0, 12).reduce((sum: number, m: any) => sum + m[key], 0));
    const year2 = (key: string) => Math.round(data.slice(12, 24).reduce((sum: number, m: any) => sum + m[key], 0));
    const year3 = (key: string) => Math.round(data.slice(24, 36).reduce((sum: number, m: any) => sum + m[key], 0));
    
    return [
      ["SEEKSY - REVENUE BREAKDOWN"],
      [""],
      headers,
      ["Podcaster Subscriptions", ...data.map(m => Math.round(m.podcasterRev)), year1('podcasterRev'), year2('podcasterRev'), year3('podcasterRev')],
      ["Event Tools", ...data.map(m => Math.round(m.eventToolsRev)), year1('eventToolsRev'), year2('eventToolsRev'), year3('eventToolsRev')],
      ["Political Campaigns", ...data.map(m => Math.round(m.politicalRev)), year1('politicalRev'), year2('politicalRev'), year3('politicalRev')],
      ["My Page", ...data.map(m => Math.round(m.myPageRev)), year1('myPageRev'), year2('myPageRev'), year3('myPageRev')],
      ["Industry Creators", ...data.map(m => Math.round(m.industryRev)), year1('industryRev'), year2('industryRev'), year3('industryRev')],
      ["Podcast Ad Insertion", ...data.map(m => Math.round(m.adInsertionRev)), year1('adInsertionRev'), year2('adInsertionRev'), year3('adInsertionRev')],
      ["Quick Ads (Advertisers)", ...data.map(m => Math.round(m.quickAdsRev)), year1('quickAdsRev'), year2('quickAdsRev'), year3('quickAdsRev')],
      ["Blog Module", ...data.map(m => Math.round(m.blogModuleRev)), year1('blogModuleRev'), year2('blogModuleRev'), year3('blogModuleRev')],
      ["RSS Auto-Posting", ...data.map(m => Math.round(m.rssAutoPostRev)), year1('rssAutoPostRev'), year2('rssAutoPostRev'), year3('rssAutoPostRev')],
      ["Auto-Publishing", ...data.map(m => Math.round(m.autoPublishRev)), year1('autoPublishRev'), year2('autoPublishRev'), year3('autoPublishRev')],
      [""],
      ["TOTAL REVENUE", ...data.map(m => Math.round(m.totalRevenue)), year1('totalRevenue'), year2('totalRevenue'), year3('totalRevenue')],
    ];
  };

  const generateCostBreakdown = (data: any[]) => {
    const headers = ["COST CATEGORY", ...data.map(m => `Month ${m.month}`), "Year 1", "Year 2", "Year 3"];
    
    const year1 = (key: string) => Math.round(data.slice(0, 12).reduce((sum: number, m: any) => sum + m[key], 0));
    const year2 = (key: string) => Math.round(data.slice(12, 24).reduce((sum: number, m: any) => sum + m[key], 0));
    const year3 = (key: string) => Math.round(data.slice(24, 36).reduce((sum: number, m: any) => sum + m[key], 0));
    
    return [
      ["SEEKSY - COST BREAKDOWN"],
      [""],
      headers,
      ["AI Compute", ...data.map(m => Math.round(m.aiComputeCost)), year1('aiComputeCost'), year2('aiComputeCost'), year3('aiComputeCost')],
      ["Storage", ...data.map(m => Math.round(m.storageCost)), year1('storageCost'), year2('storageCost'), year3('storageCost')],
      ["Bandwidth", ...data.map(m => Math.round(m.bandwidthCost)), year1('bandwidthCost'), year2('bandwidthCost'), year3('bandwidthCost')],
      ["Streaming", ...data.map(m => Math.round(m.streamingCost)), year1('streamingCost'), year2('streamingCost'), year3('streamingCost')],
      ["Support", ...data.map(m => Math.round(m.supportCost)), year1('supportCost'), year2('supportCost'), year3('supportCost')],
      ["CAC", ...data.map(m => Math.round(m.cacCost)), year1('cacCost'), year2('cacCost'), year3('cacCost')],
      ["Payment Processing", ...data.map(m => Math.round(m.paymentProcessingCost)), year1('paymentProcessingCost'), year2('paymentProcessingCost'), year3('paymentProcessingCost')],
      ["Churn Impact", ...data.map(m => Math.round(m.churnImpact)), year1('churnImpact'), year2('churnImpact'), year3('churnImpact')],
      [""],
      ["TOTAL COSTS", ...data.map(m => Math.round(m.totalCosts)), year1('totalCosts'), year2('totalCosts'), year3('totalCosts')],
    ];
  };

  const generateUnitEconomics = (data: any[]) => {
    const avgPodcasters = data.reduce((sum, m) => sum + m.podcasters, 0) / 36;
    const avgEventCreators = data.reduce((sum, m) => sum + m.eventCreators, 0) / 36;
    const avgEventOrgs = data.reduce((sum, m) => sum + m.eventOrgs, 0) / 36;
    const avgPolitical = data.reduce((sum, m) => sum + m.political, 0) / 36;
    const avgMyPage = data.reduce((sum, m) => sum + m.myPageUsers, 0) / 36;
    const avgIndustry = data.reduce((sum, m) => sum + m.industryCreators, 0) / 36;
    const avgAdvertisers = data.reduce((sum, m) => sum + m.advertisers, 0) / 36;
    
    const podcasterARPU = (assumptions.podcasterBasic * 0.4) + (assumptions.podcasterPro * 0.4) + (assumptions.podcasterEnterprise * 0.2);
    const myPageARPU = (assumptions.myPageBasic * 0.7) + (assumptions.myPagePro * 0.3);
    const quickAdsAvgARPU = (assumptions.quickAdsStarter * 0.5) + (assumptions.quickAdsGrowth * 0.3) + (assumptions.quickAdsPro * 0.15) + (((assumptions.quickAdsEnterpriseLow + assumptions.quickAdsEnterpriseHigh) / 2) * 0.05);
    
    return [
      ["SEEKSY - UNIT ECONOMICS"],
      [""],
      ["SEGMENT", "Users (Avg)", "ARPU", "CAC", "LTV", "Gross Margin %", "Payback (Months)"],
      [""],
      ["Podcasters", Math.round(avgPodcasters), Math.round(podcasterARPU), assumptions.cac, Math.round(podcasterARPU * 12 / assumptions.churnRate), "65%", Math.round(assumptions.cac / podcasterARPU)],
      ["Event Creators", Math.round(avgEventCreators), assumptions.eventCreator, assumptions.cac, Math.round(assumptions.eventCreator * 12 / assumptions.churnRate), "70%", Math.round(assumptions.cac / assumptions.eventCreator)],
      ["Event Organizations", Math.round(avgEventOrgs), assumptions.eventOrganization, assumptions.cac, Math.round(assumptions.eventOrganization * 12 / assumptions.churnRate), "72%", Math.round(assumptions.cac / assumptions.eventOrganization)],
      ["Political Campaigns", Math.round(avgPolitical), assumptions.politicalCampaign, assumptions.cac, Math.round(assumptions.politicalCampaign * 12 / assumptions.churnRate), "75%", Math.round(assumptions.cac / assumptions.politicalCampaign)],
      ["My Page Users", Math.round(avgMyPage), Math.round(myPageARPU), assumptions.cac, Math.round(myPageARPU * 12 / assumptions.churnRate), "68%", Math.round(assumptions.cac / myPageARPU)],
      ["Industry Creators", Math.round(avgIndustry), assumptions.industryCreator, assumptions.cac, Math.round(assumptions.industryCreator * 12 / assumptions.churnRate), "73%", Math.round(assumptions.cac / assumptions.industryCreator)],
      [""],
      ["QUICK ADS ADVERTISERS", "", "", "", "", "", ""],
      ["Starter Tier", Math.round(avgAdvertisers * 0.5), assumptions.quickAdsStarter, assumptions.cac * 2, Math.round(assumptions.quickAdsStarter * 12 / 0.15), "80%", Math.round((assumptions.cac * 2) / assumptions.quickAdsStarter)],
      ["Growth Tier", Math.round(avgAdvertisers * 0.3), assumptions.quickAdsGrowth, assumptions.cac * 2, Math.round(assumptions.quickAdsGrowth * 12 / 0.15), "82%", Math.round((assumptions.cac * 2) / assumptions.quickAdsGrowth)],
      ["Pro Tier", Math.round(avgAdvertisers * 0.15), assumptions.quickAdsPro, assumptions.cac * 2, Math.round(assumptions.quickAdsPro * 12 / 0.15), "85%", Math.round((assumptions.cac * 2) / assumptions.quickAdsPro)],
      ["Enterprise Tier", Math.round(avgAdvertisers * 0.05), Math.round((assumptions.quickAdsEnterpriseLow + assumptions.quickAdsEnterpriseHigh) / 2), assumptions.cac * 3, Math.round(((assumptions.quickAdsEnterpriseLow + assumptions.quickAdsEnterpriseHigh) / 2) * 12 / 0.10), "88%", Math.round((assumptions.cac * 3) / ((assumptions.quickAdsEnterpriseLow + assumptions.quickAdsEnterpriseHigh) / 2))],
    ];
  };

  return (
    <Button onClick={generateSpreadsheet} disabled={generating} variant="outline" size="sm" className="w-full">
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      {generating ? "Generating..." : "Excel (.xlsx)"}
    </Button>
  );
}