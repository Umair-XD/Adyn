import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Hero() {
  return (
    <div className="relative flex flex-col items-center justify-start pt-32 pb-20 px-4 text-center min-h-[90vh] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 bg-[#020817]">
         {/* Grid Lines */}
         <div className="absolute inset-0 opacity-[0.03]" 
              style={{
                backgroundImage: 'linear-gradient(90deg, #ffffff 1px, transparent 1px), linear-gradient(#ffffff 1px, transparent 1px)',
                backgroundSize: '70px 70px'
              }}
         ></div>
         
         {/* Main Glow - Center/Bottom */}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>

         {/* Side Glows - Blue/Darker */}
         <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-indigo-950/20 blur-[150px] rounded-full pointer-events-none"></div>
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-950/20 blur-[150px] rounded-full pointer-events-none"></div>

         {/* Stars / Particles */}
         <div className="absolute top-[15%] left-[10%] h-1 w-1 bg-white/60 rounded-full blur-[0.5px] animate-pulse"></div>
         <div className="absolute top-[25%] left-[5%] h-0.5 w-0.5 bg-white/40 rounded-full"></div>
         <div className="absolute top-[20%] right-[15%] h-1 w-1 bg-white/50 rounded-full blur-[0.5px]"></div>
         <div className="absolute top-[40%] right-[8%] h-0.5 w-0.5 bg-white/30 rounded-full"></div>
         <div className="absolute bottom-[30%] left-[20%] h-0.5 w-0.5 bg-white/40 rounded-full"></div>
         
         {/* Cross stars */}
         <div className="absolute top-[20%] left-[15%] opacity-40 scale-75 animate-pulse text-white"><CrossStar /></div>
         <div className="absolute top-[50%] right-[10%] opacity-30 scale-50 text-indigo-200"><CrossStar /></div>
         <div className="absolute bottom-[35%] left-[8%] opacity-20 scale-50 text-white"><CrossStar /></div>
      </div>

      {/* Chip */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div 
          className="inline-flex items-center justify-center rounded-full text-sm font-medium text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          style={{
            gap: '10px',
            padding: '8px 12px',
            background: 'linear-gradient(#536168, #536168) padding-box, linear-gradient(346.7deg, rgba(247, 249, 250, 0) 30.48%, #FAFBFC 48.58%, rgba(251, 252, 253, 0) 77.52%) border-box',
            border: '1px solid transparent',
            borderRadius: '100px'
          }}
        >
          <span className="w-2 h-2 rounded-full bg-[#fa9e14] shadow-[0_0_8px_#fa9e14] shrink-0"></span>
          <span className="whitespace-nowrap">The Future of Ad Management</span>
        </div>
      </div>

      {/* Heading */}
      <h1 
        className="font-bold tracking-tight mb-8 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both delay-100 pb-2"
        style={{
          background: 'linear-gradient(152.04deg, #FFFFFF 55.36%, #FB8500 70.83%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: 'Urbanist, sans-serif',
          fontSize: '80px',
          fontWeight: 700,
          lineHeight: '85px',
          letterSpacing: '0%',
          textAlign: 'center'
        }}>
        Smarter Meta Ads.<br />
        Powered by AI.
      </h1>

      {/* Subheading */}
      <p className="max-w-3xl text-lg sm:text-xl text-gray-400 mb-12 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both delay-200">
        Adyn combines human creativity with intelligent automation — so you can plan, 
        launch, and optimize Facebook & Instagram ads in one clean dashboard.
      </p>

      {/* CTA Form */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both delay-300">
        <Input 
          type="email" 
          placeholder="Enter your website or product URL" 
          className="bg-white/5 border-gray-700/50 text-white placeholder:text-gray-500 h-14 pl-6 text-base rounded-xl focus-visible:ring-2 focus-visible:ring-[#fa9e14]/50 focus-visible:border-[#fa9e14]/50 transition-all"
        />
        <Link href="/signup" className="w-full sm:w-auto">
           <Button 
            className="w-full h-14 px-8 text-base text-white font-bold rounded-xl shadow-[0_0_25px_rgba(250,158,20,0.3)] hover:shadow-[0_0_35px_rgba(250,158,20,0.5)] transition-all duration-300"
            style={{ background: 'linear-gradient(80.47deg, #FFB703 -14.05%, #FB8500 54.4%, #FFB703 94.43%)' }}
           >
              Start Free
           </Button>
        </Link>
      </div>

      {/* Trust Text */}
      <p className="text-sm text-gray-500 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both delay-500">
        See instant <span className="text-gray-300 font-medium">insights</span>, <span className="text-gray-300 font-medium">creative ideas</span>, and <span className="text-gray-300 font-medium">growth opportunities</span> — no setup needed.
      </p>
    </div>
  )
}

function CrossStar({ className }: { className?: string }) {
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="currentColor"/>
    </svg>
  )
}
