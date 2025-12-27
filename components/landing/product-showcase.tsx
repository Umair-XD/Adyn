import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProductShowcase() {
  return (
    <section className="py-24 px-4 bg-[#020817] space-y-32">
      {/* 1. Unified Dashboard */}
      <ShowcaseSection 
        title="Unified Dashboard"
        headline="Complete Control Over Your Marketing."
        description="Stop tab-switching. See all your campaigns, spend, and ROI across every channel in one beautifully designed command center."
        features={["Real-time cross-channel analytics", "Unified budget management", "Instant performance alerts"]}
        imageAlign="right"
        gradient="from-blue-500/10"
      />

      {/* 2. AI Recommendations */}
      <ShowcaseSection 
        title="AI Recommendations"
        headline="An Analyst That Never Sleep."
        description="Our AI monitors your ads 24/7, identifying wasted spend and spotting scaling opportunities before you do."
        features={["Automated budget allocation", "Audience targeting suggestions", "Creative fatigue warnings"]}
        imageAlign="left"
        gradient="from-orange-500/10"
      />

      {/* 3. Content Studio */}
      <ShowcaseSection 
        title="Content Studio"
        headline="Infinite Creative Ideas."
        description="Never run out of ad concepts. Generate high-converting copy, headlines, and visuals tailored to your brand voice."
        features={["AI image generation", "Copywriting assistant", "Brand voice training"]}
        imageAlign="right"
        gradient="from-purple-500/10"
      />
    </section>
  )
}

function ShowcaseSection({ title, headline, description, features, imageAlign, gradient }: {
  title: string;
  headline: string;
  description: string;
  features: string[];
  imageAlign: 'left' | 'right';
  gradient: string;
}) {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div className={`space-y-8 ${imageAlign === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
        <div>
          <span className="text-[#fa9e14] font-medium tracking-wider text-sm uppercase mb-2 block">{title}</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist mb-6 leading-tight">
            {headline}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            {description}
          </p>
        </div>
        
        <ul className="space-y-4">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-center gap-3 text-gray-300">
              <div className="w-6 h-6 rounded-full bg-[#fa9e14]/10 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[#fa9e14]" />
              </div>
              {feature}
            </li>
          ))}
        </ul>

        <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold h-12 px-8 rounded-full">
          Learn more
        </Button>
      </div>

      {/* Visual Placeholder */}
      <div className={`relative ${imageAlign === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent blur-[100px] -z-10`}></div>
        <div className="relative aspect-[4/3] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl group">
             {/* Abstract UI Mockup Placeholder */}
             <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-urbanist text-2xl font-bold opacity-30">
                {title} Interface Preview
             </div>
             {/* Grid overlay */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>
      </div>
    </div>
  )
}
