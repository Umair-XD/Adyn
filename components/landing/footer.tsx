import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-[#020817] text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group w-fit">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#fa9e14] to-[#e08b0b] shadow-lg group-hover:scale-105 transition-transform duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">ADYN AI</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Adyn combines human creativity with intelligent automation — so you can plan, launch, and optimize your ads in one place.
            </p>
            <div className="flex gap-4">
              <SocialIcon>
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </SocialIcon>
              <SocialIcon>
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </SocialIcon>
              <SocialIcon>
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </SocialIcon>
            </div>
          </div>

          {/* Links Columns */}
          <div className="flex flex-col gap-4">
             <h4 className="text-white font-semibold mb-2">Product</h4>
             <FooterLink href="#">Features</FooterLink>
             <FooterLink href="#">Integration</FooterLink>
             <FooterLink href="#">Pricing</FooterLink>
             <FooterLink href="#">Changelog</FooterLink>
          </div>

          <div className="flex flex-col gap-4">
             <h4 className="text-white font-semibold mb-2">Resources</h4>
             <FooterLink href="#">Documentation</FooterLink>
             <FooterLink href="#">API Reference</FooterLink>
             <FooterLink href="#">Community</FooterLink>
             <FooterLink href="#">Blog</FooterLink>
          </div>

          <div className="flex flex-col gap-4">
             <h4 className="text-white font-semibold mb-2">Company</h4>
             <FooterLink href="#">About</FooterLink>
             <FooterLink href="#">Careers</FooterLink>
             <FooterLink href="#">Contact</FooterLink>
             <FooterLink href="#">Privacy Policy</FooterLink>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="text-gray-500 text-sm">© 2024 Adyn AI Inc. All rights reserved.</p>
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                 <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 All systems operational
              </span>
           </div>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ children }: { children: React.ReactNode }) {
  return (
    <Link href="#" className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
      {children}
    </Link>
  )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-400 hover:text-[#fa9e14] transition-colors text-sm">
      {children}
    </Link>
  )
}
