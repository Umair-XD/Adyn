import { Quote } from "lucide-react"

export function SocialProof() {
  return (
    <section className="py-24 px-4 bg-[#020817] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist mb-6">
            Trusted by the world&apos;s<br />
            fastest growing brands.
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors relative">
              <Quote className="absolute top-8 right-8 w-8 h-8 text-white/5" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-gray-700 to-gray-900 border border-white/10"></div>
                <div>
                    <div className="text-white font-bold">{testimonial.author}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed italic">
                &quot;{testimonial.quote}&quot;
              </p>
            </div>
          ))}
        </div>

        {/* Personas / Use Cases section */}
        <div className="border-t border-white/10 pt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white font-urbanist">Built for every kind of marketer</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {personas.map((persona, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#0B1221] border border-white/5 text-center group hover:bg-[#0F1629] transition-colors">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#fa9e14]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">{persona.emoji}</span>
                        {/* Alternatively use icons */}
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{persona.title}</h4>
                    <p className="text-gray-400 text-sm">{persona.description}</p>
                </div>
             ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const testimonials = [
  {
    author: "Ayesha M.",
    role: "Marketing Director @ TechFlow",
    quote: "Adyn cut our campaign launch time by 90%. The AI suggestions are actually usable—it feels like having a senior media buyer on the team 24/7."
  },
  {
    author: "Salman K.",
    role: "Founder @ DropScale",
    quote: "Finally, a tool that doesn&apos;t just show me data but tells me what to do with it. Our ROAS increased by 40% in the first month alone."
  },
  {
    author: "Elena R.",
    role: "Head of Growth @ SaaSy",
    quote: "The unified dashboard is a game changer. I no longer have to log into 5 different platforms to see how we&apos;re pacing against our monthly budget."
  }
]

const personas = [
  {
    title: "SMB Owners",
    description: "Run professional-grade ads without an agency price tag.",
    emoji: "🚀"
  },
  {
    title: "Agencies",
    description: "Manage 10x more clients with the same team size.",
    emoji: "🏢"
  },
  {
    title: "Media Buyers",
    description: "Automate the boring stuff and focus on high-level strategy.",
    emoji: "📈"
  }
]
