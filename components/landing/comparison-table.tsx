import { Check, X, HelpCircle } from "lucide-react"

export function ComparisonTable() {
  return (
    <section className="py-24 px-4 bg-[#020817] borders-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist mb-6">
            Adyn vs. <span className="text-gray-500">The Rest</span>
          </h2>
          <p className="text-gray-400">
            See why smart marketers are switching to the only platform that combines human strategy with AI execution.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-6 text-gray-400 font-medium w-1/2">Features</th>
                <th className="p-6 text-white font-bold text-center bg-[#fa9e14]/10 w-1/4 border-x border-[#fa9e14]/20 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#fa9e14]"></div>
                    Adyn Ai
                </th>
                <th className="p-6 text-gray-500 font-medium text-center w-1/4">Other AI Tools</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6 text-white font-medium flex items-center gap-2">
                    {row.feature}
                    <HelpCircle className="w-4 h-4 text-gray-600 cursor-help" />
                  </td>
                  <td className="p-6 text-center bg-[#fa9e14]/5 border-x border-[#fa9e14]/10">
                    <div className="flex justify-center">
                        <div className="w-6 h-6 rounded-full bg-[#fa9e14] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    {row.other ? (
                       <div className="flex justify-center">
                            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                       </div>
                    ) : (
                        <div className="flex justify-center">
                            <X className="w-5 h-5 text-gray-600" />
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

const comparisons = [
  { feature: "AI-Generated Ad Copy & Visuals", other: true },
  { feature: "Cross-Channel Analytics", other: true },
  { feature: "Automated Budget Optimization", other: false },
  { feature: "Human-in-the-Loop Collaboration", other: false },
  { feature: "Brand Voice Customization", other: false },
  { feature: "Predictive Performance Scoring", other: false },
]
