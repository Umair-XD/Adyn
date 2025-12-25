import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function Navbar() {
  return (
    <div className="pt-6 flex justify-center w-full px-4 fixed top-0 z-50">
      <nav className="flex items-center justify-between px-5 py-3 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] w-full max-w-6xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-lg group-hover:scale-105 transition-transform duration-300"
            style={{ background: 'linear-gradient(80.47deg, #FFB703 -14.05%, #FB8500 54.4%, #FFB703 94.43%)' }}
          >
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
          <span className="text-xl font-bold text-[#111827] tracking-tight">ADYN AI</span>
        </Link>

        {/* Nav Links - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-10">
          <Link href="#" className="flex items-center gap-1.5 text-[15px] font-medium text-[#374151] hover:text-[#111827] transition-colors">
            Features <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
          </Link>
          <Link href="#" className="flex items-center gap-1.5 text-[15px] font-medium text-[#374151] hover:text-[#111827] transition-colors">
            Pricing <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
          </Link>
          <Link href="#" className="text-[15px] font-medium text-[#374151] hover:text-[#111827] transition-colors">
            Resources
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" className="text-[#111827] font-semibold hover:bg-gray-50 h-10 px-6 text-[15px] border-gray-200 rounded-lg">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button 
              className="hover:opacity-90 transition-opacity text-white font-bold h-10 px-6 rounded-lg text-[15px] shadow-none border-none"
              style={{ background: 'linear-gradient(80.47deg, #FFB703 -14.05%, #FB8500 54.4%, #FFB703 94.43%)' }}
            >
              Start Free
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  )
}
