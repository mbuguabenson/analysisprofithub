import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

interface FooterProps {
  theme: 'light' | 'dark'
}

export function Footer({ theme }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`border-t transition-colors duration-500 ${
      theme === 'dark'
        ? 'bg-black/50 border-white/5 text-gray-300'
        : 'bg-white/50 border-gray-100 text-gray-600'
    }`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-12 mb-8">
          {/* Brand Section */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center font-semibold text-sm ${
                theme === 'dark'
                  ? 'bg-slate-900 border border-white/10 text-white'
                  : 'bg-gray-100 border border-gray-300 text-gray-900'
              }`}>
                A
              </div>
              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                AnalysisProfitHub
              </span>
            </div>
            <p className="text-xs opacity-70 leading-relaxed">
              Professional trading analysis platform with real-time market data and advanced analytics.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Product
            </h3>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Security', 'Roadmap'].map((item) => (
                <li key={item}>
                  <Link href="#" className={`text-xs transition-opacity hover:opacity-100 ${
                    theme === 'dark' ? 'opacity-60' : 'opacity-70'
                  }`}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Company
            </h3>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="#" className={`text-xs transition-opacity hover:opacity-100 ${
                    theme === 'dark' ? 'opacity-60' : 'opacity-70'
                  }`}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Legal
            </h3>
            <ul className="space-y-2">
              {['Privacy', 'Terms', 'Disclaimer', 'Cookies'].map((item) => (
                <li key={item}>
                  <Link href="#" className={`text-xs transition-opacity hover:opacity-100 ${
                    theme === 'dark' ? 'opacity-60' : 'opacity-70'
                  }`}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'} py-6`} />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Copyright */}
          <p className="text-xs opacity-60">
            © {currentYear} AnalysisProfitHub. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {[
              { icon: Github, href: '#', label: 'GitHub' },
              { icon: Twitter, href: '#', label: 'Twitter' },
              { icon: Linkedin, href: '#', label: 'LinkedIn' },
              { icon: Mail, href: '#', label: 'Email' },
            ].map(({ icon: Icon, href, label }) => (
              <Link
                key={label}
                href={href}
                className={`transition-opacity hover:opacity-100 ${
                  theme === 'dark' ? 'opacity-50' : 'opacity-70'
                }`}
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
