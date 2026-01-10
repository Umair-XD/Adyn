import { } from "lucide-react"

export function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-[#020817]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[#fa9e14] font-medium tracking-wider text-sm uppercase mb-4 block">Process</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist mb-6">
            Everything you need to<br />
            run ads like a pro.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            A simple, streamlined workflow designed to take you from idea to profitable campaign in record time.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Connector Line (Desktop only) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-[#fa9e14]/0 via-[#fa9e14]/30 to-[#fa9e14]/0 border-t border-dashed border-white/20"></div>

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center z-10">
              <div className="w-24 h-24 rounded-full bg-[#020817] border border-[#fa9e14]/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(250,158,20,0.1)] group hover:border-[#fa9e14]/50 transition-colors duration-300">
                <span className="text-3xl font-bold text-white font-urbanist">{i + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-urbanist">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const steps = [
  {
    title: "Connect Your Accounts",
    description: "Link your Facebook, Instagram, or TikTok ad accounts in one click. Secure and instant."
  },
  {
    title: "Create with AI",
    description: "Describe your product, and watch Adyn generate high-converting copy and creatives instantly."
  },
  {
    title: "Optimize & Scale",
    description: "Launch your ads and let our AI monitor performance, adjusting budgets to maximize ROI."
  }
]
