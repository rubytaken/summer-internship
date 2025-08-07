"use client";
 
import { SunIcon as Sunburst } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  mode: 'signin' | 'signup';
}
 
export const AuthForm = ({ mode }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();
 
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ['@neu.edu.tr', '@std.neu.edu.tr'];
    
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address.";
    }
    
    if (!allowedDomains.some(domain => value.endsWith(domain))) {
      return "Only @neu.edu.tr and @std.neu.edu.tr email addresses are allowed.";
    }
    
    return "";
  };
 
  const validatePassword = (value: string) => {
    if (value.length < 8) {
      return "Password must be at least 8 characters.";
    }
    return "";
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError("");
    
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    
    if (emailValidation || passwordValidation) {
      setLoading(false);
      return;
    }

    try {
      const result = mode === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (result.error) {
        setGeneralError(result.error);
      } else {
        // Successful auth
        if (mode === 'signup') {
          setGeneralError("Please check your email to confirm your account.");
        } else {
          router.push('/diagram');
        }
      }
    } catch (error) {
      setGeneralError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden p-4">
      <div className="w-full relative max-w-5xl overflow-hidden flex flex-col md:flex-row shadow-xl rounded-3xl">
        {/* Background decorative elements */}
        <div className="w-full h-full z-2 absolute bg-gradient-to-t from-transparent to-black/20 rounded-3xl"></div>
        <div className="flex absolute z-2 overflow-hidden backdrop-blur-2xl rounded-3xl">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="h-[40rem] z-2 w-[4rem] bg-gradient-to-b from-transparent via-black/50 via-[69%] to-white/30 opacity-30 overflow-hidden"
            />
          ))}
        </div>
        <div className="w-[15rem] h-[15rem] bg-orange-500 absolute z-1 rounded-full bottom-0 left-0"></div>
        <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-0 left-0"></div>
 
        {/* Left panel */}
        <div className="bg-black text-white p-8 md:p-12 md:w-1/2 relative rounded-l-3xl overflow-hidden">
          <h1 className="text-2xl md:text-3xl font-medium leading-tight z-10 tracking-tight relative">
            AI Charts - Smart Diagram Creator for NEU Students
          </h1>
          <p className="mt-4 text-gray-300 relative z-10">
            Create professional diagrams, flowcharts, and charts with AI-powered tools.
          </p>
        </div>
 
        {/* Right panel - Form */}
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col bg-secondary z-10 text-secondary-foreground rounded-r-3xl">
          <div className="flex flex-col items-left mb-8">
            <div className="text-orange-500 mb-4">
              <Sunburst className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-medium mb-2 tracking-tight">
              {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-left opacity-80">
              {mode === 'signin' 
                ? 'Sign in to your account to continue' 
                : 'Create your account to get started'}
            </p>
          </div>

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {generalError}
            </div>
          )}
 
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm mb-2">
                Your NEU email
              </label>
              <input
                type="email"
                id="email"
                placeholder="student@neu.edu.tr"
                className={`text-sm w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-1 bg-white text-black focus:ring-orange-500 ${
                  emailError ? "border-red-500" : "border-gray-300"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                aria-describedby="email-error"
                disabled={loading}
              />
              {emailError && (
                <p id="email-error" className="text-red-500 text-xs mt-1">
                  {emailError}
                </p>
              )}
            </div>
 
            <div>
              <label htmlFor="password" className="block text-sm mb-2">
                {mode === 'signin' ? 'Password' : 'Create new password'}
              </label>
              <input
                type="password"
                id="password"
                className={`text-sm w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-1 bg-white text-black focus:ring-orange-500 ${
                  passwordError ? "border-red-500" : "border-gray-300"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passwordError}
                aria-describedby="password-error"
                disabled={loading}
              />
              {passwordError && (
                <p id="password-error" className="text-red-500 text-xs mt-1">
                  {passwordError}
                </p>
              )}
            </div>
 
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? 'Please wait...' 
                : mode === 'signin' 
                  ? 'Sign In' 
                  : 'Create Account'
              }
            </button>
 
            <div className="text-center text-gray-600 text-sm">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{" "}
                  <a href="/signup" className="text-secondary-foreground font-medium underline">
                    Sign up
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <a href="/signin" className="text-secondary-foreground font-medium underline">
                    Sign in
                  </a>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

