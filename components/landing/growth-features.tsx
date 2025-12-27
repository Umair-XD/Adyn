import { Zap, Users, Clock } from "lucide-react"

export function GrowthFeatures() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Gradient - Subtle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-950/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight mb-4 font-urbanist">
            Adyn isn&apos;t just another AI tool.<br />
            It&apos;s your growth partner.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="group p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-white/10 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#fa9e14]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-[#fa9e14]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-urbanist">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const features = [
  {
    title: "Clarity First",
    description: "Stop guessing. See exactly which ads are working and why, with crystal-clear performance metrics.",
    icon: Zap // Placeholder icon
  },
  {
    title: "Human + AI",
    description: "We don&apos;t replace you—we supercharge you. AI handles the grunt work, you control the strategy.",
    icon: Users
  },
  {
    title: "Faster Results",
    description: "Launch campaigns in minutes, not weeks. Test creative variations instantly and scale what wins.",
    icon: Clock
  }
]
