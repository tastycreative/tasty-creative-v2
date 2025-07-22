"use client";

import { ArrowRight, Sparkles, Palette, Code, Zap, Users, Award, Star } from "lucide-react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TastyCreativeLanding = ({ session }: { session: any }) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/50">
      {/* Enhanced decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-200/40 to-rose-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-gradient-to-r from-pink-100/50 to-rose-100/50 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-pink-50/30 to-rose-50/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/3 w-64 h-64 bg-gradient-to-r from-rose-200/30 to-pink-200/30 rounded-full blur-2xl" />
      </div>

      {/* Header - Logo only, navigation handled by parent */}
      <header className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Tasty Creative
            </h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-pink-100/80 backdrop-blur-sm rounded-full text-pink-700 text-sm font-medium mb-8">
            <Star className="w-4 h-4 mr-2" />
            Unleash Your Creative Potential
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 bg-clip-text text-transparent">
              Creative
            </span>
            <br />
            <span className="text-gray-800">Excellence</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your ideas into stunning digital experiences with our cutting-edge creative platform. 
            Design, develop, and deploy with unmatched elegance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {session ? (
              <Link href="/dashboard" className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link href="/sign-in" className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center">
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold hover:bg-white transition-all duration-300 border border-pink-200">
              Watch Demo
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-1">10K+</div>
              <div className="text-gray-600">Happy Creators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-600 mb-1">50K+</div>
              <div className="text-gray-600">Projects Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-1">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Why Choose <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Tasty Creative</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools and features designed to elevate your creative workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-pink-100 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Design Tools</h3>
              <p className="text-gray-600">
                Professional-grade design tools with intuitive interfaces for seamless creative expression.
              </p>
            </div>

            <div className="group p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-pink-100 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Development</h3>
              <p className="text-gray-600">
                Advanced development environment with modern frameworks and seamless deployment.
              </p>
            </div>

            <div className="group p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-pink-100 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Lightning Fast</h3>
              <p className="text-gray-600">
                Optimized performance and blazing-fast rendering for the smoothest experience.
              </p>
            </div>

            <div className="group p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-pink-100 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Collaboration</h3>
              <p className="text-gray-600">
                Real-time collaboration tools that bring teams together for better results.
              </p>
            </div>

            <div className="group p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-pink-100 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Award Winning</h3>
              <p className="text-gray-600">
                Recognized by industry leaders for innovation and excellence in creative tools.
              </p>
            </div>

            <div className="group p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-pink-100 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">AI Powered</h3>
              <p className="text-gray-600">
                Harness the power of artificial intelligence to enhance your creative process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-r from-pink-500/10 to-rose-500/10 backdrop-blur-sm rounded-3xl border border-pink-200/50">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Ready to Create Something <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Amazing?</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who trust Tasty Creative for their most important projects.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {session ? (
                <Link href="/dashboard" className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link href="/sign-in" className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <button className="px-8 py-4 text-gray-700 rounded-xl font-semibold hover:text-pink-600 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-pink-100/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Tasty Creative
            </span>
          </div>
          <p className="text-gray-600">
            © 2025 Tasty Creative. All rights reserved. Made with ❤️ for creators.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TastyCreativeLanding;
