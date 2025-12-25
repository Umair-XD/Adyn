import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LucideLayoutDashboard, LucideLightbulb, LucideMegaphone, LucideImage, LucidePenTool, LucideUsers, LucideBarChart, LucideBell, LucideSearch, LucideSparkles, LucideArrowUpRight, LucideTrendingUp, LucideMousePointer2, LucideShoppingCart, LucideMoreVertical } from "lucide-react"

import Link from "next/link"

export function DashboardPreview() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 -mt-24 relative z-10 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
      <Link href="/dashboard" className="block transform hover:scale-[1.01] transition-all duration-500 cursor-pointer group">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 flex min-h-[700px] group-hover:shadow-[0_20px_50px_rgba(250,158,20,0.15)] transition-shadow duration-500 ring-1 ring-black/5">
          {/* Sidebar */}
          <div className="w-72 border-r border-gray-100 bg-white p-6 hidden lg:flex flex-col shrink-0">
            <div className="flex items-center gap-3 mb-10 text-gray-900 font-bold text-xl tracking-tight">
               <div className="bg-gradient-to-br from-[#fa9e14] to-[#e08b0b] rounded-lg p-1.5 shadow-md">
                 <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
               </div>
               ADYN AI
            </div>

            <div className="space-y-1.5 mb-8">
               <div className="text-[11px] font-bold tracking-wider text-gray-400 mb-3 px-3">MAIN MENU</div>
               <SidebarItem icon={<LucideLayoutDashboard size={20} />} label="Dashboard" active />
               <SidebarItem icon={<LucideLightbulb size={20} />} label="AI Insights" badge="3" />
               <SidebarItem icon={<LucideMegaphone size={20} />} label="Campaigns" />
               <SidebarItem icon={<LucideImage size={20} />} label="Creative Library" />
               <SidebarItem icon={<LucidePenTool size={20} />} label="Content Studio" />
               <SidebarItem icon={<LucideUsers size={20} />} label="Audience" />
            </div>

            <div className="space-y-1.5">
               <div className="text-[11px] font-bold tracking-wider text-gray-400 mb-3 px-3">ANALYTICS</div>
               <SidebarItem icon={<LucideBarChart size={20} />} label="Reports" />
            </div>

            <div className="mt-auto pt-6 border-t border-gray-50 flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                    JD
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-semibold text-gray-900 truncate">John Doe</div>
                    <div className="text-xs text-gray-500 truncate">Pro Plan</div>
                </div>
                <LucideMoreVertical className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-gray-50/80 flex flex-col relative overflow-hidden">
             
             {/* Header */}
             <div className="h-20 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm px-8 flex items-center justify-between sticky top-0 z-20">
                <div className="relative w-96 hidden md:block">
                  <LucideSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                  <input type="text" placeholder="Search campaigns, creatives, insights..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100/50 rounded-xl border-transparent focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all text-gray-900 placeholder:text-gray-500 font-medium" readOnly />
                </div>
                <div className="flex items-center gap-6 ml-auto">
                   <div className="relative">
                        <LucideBell className="text-gray-500 w-5 h-5 hover:text-gray-700 transition-colors cursor-pointer" />
                        <span className="absolute -top-1 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                   </div>
                   <Button size="sm" className="hidden sm:flex bg-gray-900 text-white hover:bg-gray-800 rounded-lg h-9 px-4 gap-2 font-medium shadow-lg shadow-gray-900/10">
                       <LucidePlus className="w-4 h-4" /> New Project
                   </Button>
                </div>
             </div>

             {/* Dashboard Content */}
             <div className="p-8 lg:p-10 overflow-y-auto">
                <div className="flex items-end justify-between mb-10">
                   <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, John 👋</h2>
                      <p className="text-gray-500 font-medium">Here's what's happening with your store today.</p>
                   </div>
                   <div className="flex gap-3">
                      <Button variant="outline" size="sm" className="gap-2 text-gray-700 border-gray-200 hover:bg-gray-50 h-10 px-4 font-medium bg-white shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Last 30 Days
                      </Button>
                   </div>
                </div>

                {/* AI Suggestions Card */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50/50 rounded-2xl border border-orange-100 p-6 mb-10 relative overflow-hidden group/card hover:border-orange-200 transition-colors">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                   
                   <div className="flex items-start gap-5 relative z-10">
                      <div className="bg-gradient-to-br from-[#fa9e14] to-[#f57c00] p-3 rounded-xl text-white shadow-lg shadow-orange-500/20 ring-4 ring-orange-100">
                         <LucideSparkles className="w-6 h-6" />
                      </div>
                      <div className="flex-1 pt-1">
                         <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900">3 AI Optimization Suggestions</h3>
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-orange-700 hover:text-orange-800 hover:bg-orange-100 px-3">View All</Button>
                         </div>
                         <p className="text-[15px] text-gray-600 mb-5 max-w-2xl leading-relaxed">
                             Our AI has detected an opportunity to improve <span className="font-semibold text-gray-900">ROAS by 12%</span> by reallocating budget to high-performing creative sets.
                         </p>
                         <div className="flex flex-wrap gap-2.5">
                            <SuggestionChip label="Budget Optimization" icon={<LucideTrendingUp size={14} />} />
                            <SuggestionChip label="Audience Expansion" icon={<LucideUsers size={14} />} />
                            <SuggestionChip label="Creative Refresh" icon={<LucideImage size={14} />} />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                   <MetricCard 
                      label="Return on Ad Spend" 
                      value="4.2x" 
                      change="+12.5%" 
                      icon={<LucideTrendingUp className="text-blue-600 w-5 h-5" />} 
                      bg="bg-blue-50" 
                      textColor="text-blue-700"
                      chartColor="text-blue-500"
                   />
                   <MetricCard 
                      label="Total Spend" 
                      value="$12,450" 
                      change="-5.2%" 
                      trend="down"
                      icon={<span className="text-[#fa9e14] font-bold text-lg leading-none">$</span>} 
                      bg="bg-orange-50" 
                      textColor="text-[#fa9e14]"
                      chartColor="text-orange-500"
                   />
                   <MetricCard 
                      label="Total Clicks" 
                      value="8,354" 
                      change="+8.1%" 
                      icon={<LucideMousePointer2 className="text-purple-600 w-5 h-5" />} 
                      bg="bg-purple-50" 
                      textColor="text-purple-700"
                      chartColor="text-purple-500"
                   />
                   <MetricCard 
                      label="Conversions" 
                      value="482" 
                      change="+15.3%" 
                      icon={<LucideShoppingCart className="text-teal-600 w-5 h-5" />} 
                      bg="bg-teal-50" 
                      textColor="text-teal-700"
                      chartColor="text-teal-500"
                   />
                </div>
             </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

function SidebarItem({ icon, label, active = false, badge }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string }) {
  return (
    <div className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold cursor-default transition-all group/item ${active ? 'bg-orange-50 text-orange-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
      <span className={`${active ? 'text-orange-600' : 'text-gray-400 group-hover/item:text-gray-600'}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{badge}</span>}
    </div>
  )
}

function LucidePlus({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    )
}

function SuggestionChip({ label, icon }: { label: string, icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-white text-gray-700 border border-gray-200 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700 transition-colors cursor-default shadow-sm">
      {icon && <span className="text-orange-500">{icon}</span>}
      {label}
    </span>
  )
}

function MetricCard({ label, value, change, trend = 'up', icon, bg, textColor, chartColor }: any) {
   return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
         <div className="flex justify-between items-start mb-5">
            <div className={`p-2.5 rounded-xl ${bg}`}>
               {icon}
            </div>
            <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-lg flex items-center`}>
               {trend === 'up' ? <LucideArrowUpRight className="w-3 h-3 mr-1" /> : <LucideTrendingUp className="w-3 h-3 mr-1 rotate-180" />}
               {change}
            </span>
         </div>
         <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
         <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
         
         {/* Simple sparkline visualization */}
         <div className="mt-4 flex items-end justify-between h-8 gap-0.5 opacity-30">
            {[40, 60, 45, 70, 50, 80, 65, 90, 75, 100].map((h, i) => (
                <div key={i} className={`w-full rounded-t-sm ${chartColor?.split('-')[1] === 'orange' ? 'bg-orange-500' : chartColor?.split('-')[1] === 'blue' ? 'bg-blue-500' : chartColor?.split('-')[1] === 'purple' ? 'bg-purple-500' : 'bg-teal-500'}`} style={{ height: `${h}%` }}></div>
            ))}
         </div>
      </div>
   )
}
