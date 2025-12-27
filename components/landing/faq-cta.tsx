import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FaqCta() {
  return (
    <section className="py-24 px-4 bg-[#020817] border-t border-white/5">
      <div className="max-w-4xl mx-auto mb-32">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-white font-urbanist mb-12">
          What people want to know
        </h2>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-white/10 rounded-xl px-2 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
              <AccordionTrigger className="text-white hover:no-underline px-4 text-left font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 px-4 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="max-w-5xl mx-auto relative">
         <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
         
         <div className="bg-gradient-to-b from-white/10 to-black/40 border border-white/10 rounded-3xl p-8 md:p-16 text-center backdrop-blur-sm overflow-hidden relative">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.05]" 
               style={{
                 backgroundImage: 'linear-gradient(90deg, #ffffff 1px, transparent 1px), linear-gradient(#ffffff 1px, transparent 1px)',
                 backgroundSize: '40px 40px'
               }}
            ></div>

            <h2 className="text-4xl md:text-6xl font-bold text-white font-urbanist mb-6 relative z-10">
                Ready to make every<br />
                <span className="text-[#fa9e14]">ad smarter?</span>
            </h2>
            <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto relative z-10">
                Join thousands of marketers who are saving time and boosting ROAS with Adyn.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 max-w-lg mx-auto">
                <Input 
                  placeholder="Enter your email address" 
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 rounded-lg"
                />
                <Button className="h-12 px-8 bg-[#fa9e14] hover:bg-[#e08b0b] text-white font-bold rounded-lg shadow-lg">
                    Get Started for Just $30!
                </Button>
            </div>
            
            <p className="text-gray-500 text-sm mt-6 relative z-10">
                No credit card required for 14-day trial.
            </p>
         </div>
      </div>
    </section>
  )
}

const faqs = [
  {
    question: "Do I need technical skills to use Adyn?",
    answer: "Not at all. Adyn is built for marketers and business owners. Our interface is intuitive, and our AI handles the complex data lifting for you."
  },
  {
    question: "Does Adyn work with my existing ad accounts?",
    answer: "Yes! We integrate directly with Meta Ads Manager, TikTok Ads, and Google Ads. You can connect your accounts in seconds."
  },
  {
    question: "Can I export the data?",
    answer: "Absolutely. You can export reports to PDF, CSV, or share live dashboard links with your clients or team."
  },
  {
    question: "What happens if I need help?",
    answer: "We offer 24/7 chat support for all plans, and dedicated account managers for Agency plans."
  }
]
