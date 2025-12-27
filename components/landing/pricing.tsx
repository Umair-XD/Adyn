import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Pricing() {
  return (
    <section className="py-24 px-4 bg-[#020817] relative overflow-hidden">
      {/* Background glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#fa9e14]/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-urbanist mb-6">
            Simple, Transparent Pricing.
          </h2>
          <p className="text-gray-400">
            Start for free, scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`p-8 rounded-3xl border relative flex flex-col h-full bg-[#0B1221] transition-transform hover:-translate-y-2 duration-300
                ${plan.popular 
                  ? 'border-[#fa9e14] shadow-[0_0_30px_rgba(250,158,20,0.1)] scale-105 z-10' 
                  : 'border-white/10 hover:border-white/20'}`
              }
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#fa9e14] text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-gray-300">
                      <Check className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-[#fa9e14]' : 'text-gray-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                className={`w-full h-12 rounded-xl font-bold transition-all
                  ${plan.popular 
                    ? 'bg-[#fa9e14] hover:bg-[#e08b0b] text-white shadow-lg' 
                    : 'bg-white/10 hover:bg-white/20 text-white'}`
                }
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const plans = [
  {
    name: "Starter",
    price: "0",
    description: "Perfect for individuals and solopreneurs just getting started with ads.",
    cta: "Start for Free",
    popular: false,
    features: [
      "1 Ad Account",
      "Basic AI suggestions",
      "5 AI-generated visuals/mo",
      "Standard support"
    ]
  },
  {
    name: "Growth",
    price: "149",
    description: "For growing businesses ready to scale their ad spend and ROI.",
    cta: "Get Started",
    popular: true,
    features: [
      "5 Ad Accounts",
      "Advanced AI optimization",
      "Unlimited AI visuals",
      "Competitor analysis",
      "Priority support"
    ]
  },
  {
    name: "Agency",
    price: "350",
    description: "Built for agencies managing multiple client accounts.",
    cta: "Contact Sales",
    popular: false,
    features: [
      "Unlimited Ad Accounts",
      "White-label reporting",
      "API Access",
      "Dedicated account manager",
      "Custom onboarding"
    ]
  }
]
