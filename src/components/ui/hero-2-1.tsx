"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

const Hero2 = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Gradient background with grain effect */}
      <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0 ">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
      </div>
      <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

      {/* Content container */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto flex items-center justify-between px-4 py-4 mt-6">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
              <span className="font-bold">📊</span>
            </div>
            <span className="ml-2 text-xl font-bold text-white">AI Charts</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push('/signin')}
                className="cursor-pointer h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/10"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/signup')}
                className="cursor-pointer h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation Menu with animation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col p-4 bg-black/95 md:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                    <span className="font-bold">📊</span>
                  </div>
                  <span className="cursor-pointer ml-2 text-xl font-bold text-white">
                    AI Charts
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="mt-8 flex flex-col space-y-6">
                <button 
                  onClick={() => router.push('/signin')}
                  className="cursor-pointer h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/10"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => router.push('/signup')}
                  className="cursor-pointer h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90"
                >
                  Sign Up
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        <div className="mx-auto mt-6 flex max-w-fit items-center justify-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
          <span className="text-sm font-medium text-white">
            The future of diagram creation with AI!
          </span>
          <ArrowRight className="h-4 w-4 text-white" />
        </div>

        {/* Hero section */}
        <div className="container mx-auto mt-12 px-4 text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            Create Smart Diagrams and Charts with AI
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Create professional diagrams, flowcharts, and charts with our AI-powered tools. Intuitive interface and powerful features.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button 
              className="cursor-pointer h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90"
              onClick={() => router.push('/signup')}
            >
              Get Started Now
            </button>
            <button 
              className="cursor-pointer h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/10"
              onClick={() => router.push('/signin')}
            >
              Already have an account?
            </button>
          </div>

          <div className="relative mx-auto my-20 w-full max-w-6xl">
            <div className="absolute inset-0 rounded shadow-lg bg-white blur-[10rem] bg-grainy opacity-20" />

            {/* Hero Image */}
            <img
              src="/landing.webp"
              alt="AI Charts Dashboard"
              className="relative w-full h-auto shadow-md grayscale-100 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Hero2 }; 