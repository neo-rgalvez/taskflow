"use client";

import Link from "next/link";
import {
  CheckCircle,
  Clock,
  FileText,
  Users,
  BarChart3,
  ArrowRight,
  Star,
  Zap,
  Shield,
  FolderKanban,
} from "lucide-react";

export function LandingPageContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TaskFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-gray-900 transition-colors">Testimonials</a>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
              >
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
                >
                  Start free trial
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
            <Zap size={14} />
            Built for freelancers, by freelancers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight max-w-3xl mx-auto">
            Every client. Every project.{" "}
            <span className="text-primary-500">One clear view.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
            TaskFlow helps freelancers manage clients, track time, organize tasks, and send invoices
            — all from one calm, focused workspace.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors text-base"
              >
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors text-base"
                >
                  Get started free <ArrowRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-base"
                >
                  Log in to your account
                </Link>
              </>
            )}
          </div>
          {!isLoggedIn && (
            <p className="mt-4 text-sm text-gray-400">
              Free for 14 days. No credit card required.
            </p>
          )}

          {/* Hero Screenshot Mockup */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-b from-primary-50 to-white rounded-xl p-1">
              <div className="bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
                <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center gap-2 px-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="p-6 sm:p-8 bg-gray-50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Active Projects", value: "3", trend: "+1" },
                      { label: "Hours This Week", value: "32.5h", trend: "+12%" },
                      { label: "Outstanding", value: "$14.5K", trend: "3 invoices" },
                      { label: "Next Deadline", value: "Mar 20", trend: "6 days" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 font-mono mt-1">{stat.value}</p>
                        <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["To Do", "In Progress", "Done"].map((col) => (
                      <div key={col} className="bg-white rounded-lg border border-gray-200 p-3">
                        <p className="text-sm font-medium text-gray-700 mb-3">{col}</p>
                        <div className="space-y-2">
                          {[1, 2].map((n) => (
                            <div key={n} className="h-12 bg-gray-50 rounded border border-gray-100" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Stop juggling spreadsheets, timers, and invoice apps. TaskFlow brings it all together.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Client Management",
                description: "Keep client details, contact info, notes, and billing preferences organized in one place.",
              },
              {
                icon: FolderKanban,
                title: "Kanban Task Boards",
                description: "Drag-and-drop task management with customizable columns. See exactly where every project stands.",
              },
              {
                icon: Clock,
                title: "Time Tracking",
                description: "One-click timers on any task. Manual entry for past work. Always know where your hours go.",
              },
              {
                icon: FileText,
                title: "Invoicing",
                description: "Generate invoices from tracked time or fixed milestones. Send by email, export PDF, track payments.",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Revenue by client, hours by project, budget burn-down. See your business at a glance.",
              },
              {
                icon: Shield,
                title: "Client Portal",
                description: "Share a read-only project view with clients. They see progress without needing an account.",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-primary-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "Free",
                period: "forever",
                description: "For freelancers just getting started",
                features: ["Up to 3 clients", "5 active projects", "Basic time tracking", "5 invoices/month"],
                cta: "Get started",
                popular: false,
              },
              {
                name: "Professional",
                price: "$12",
                period: "/month",
                description: "For established freelancers",
                features: ["Unlimited clients", "Unlimited projects", "Advanced time tracking", "Unlimited invoices", "Client portal", "Analytics & reports", "Project templates"],
                cta: "Start free trial",
                popular: true,
              },
              {
                name: "Business",
                price: "$29",
                period: "/month",
                description: "For freelancers scaling up",
                features: ["Everything in Professional", "Priority support", "Custom branding", "API access", "Data export", "Advanced integrations"],
                cta: "Start free trial",
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.popular ? "border-primary-500 shadow-lg ring-1 ring-primary-500 relative" : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <Link
                  href={isLoggedIn ? "/dashboard" : "/signup"}
                  className={`mt-6 w-full py-2.5 rounded-md font-medium text-sm transition-colors text-center block ${
                    plan.popular ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {isLoggedIn ? "Go to Dashboard" : plan.cta}
                </Link>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Loved by freelancers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "TaskFlow replaced three different apps for me. I track time, manage projects, and send invoices all in one place. Game changer.",
                name: "Alex Rivera",
                role: "UX Designer",
                initials: "AR",
              },
              {
                quote: "The client portal alone is worth it. My clients love being able to see project progress without me having to write status emails.",
                name: "Michelle Park",
                role: "Web Developer",
                initials: "MP",
              },
              {
                quote: "I went from forgetting to bill half my hours to tracking every minute. My revenue went up 30% in the first month.",
                name: "Jordan Blake",
                role: "Copywriter",
                initials: "JB",
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-700">{testimonial.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Ready to simplify your freelance life?</h2>
          <p className="mt-4 text-lg text-gray-500">Join thousands of freelancers who manage their entire business with TaskFlow.</p>
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors text-base"
          >
            {isLoggedIn ? "Go to Dashboard" : "Start your free trial"} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TF</span>
                </div>
                <span className="text-base font-bold text-gray-900">TaskFlow</span>
              </div>
              <p className="text-sm text-gray-500">Project management built for freelancers.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-gray-700">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-700">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-700">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-700">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-700">Contact</a></li>
                <li><a href="#" className="hover:text-gray-700">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-700">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-700">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
            &copy; 2026 TaskFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
