import { useState } from "react";
import { Layers, Mail, Lock, Eye, EyeOff, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function AuthPage() {
  const [mode, setMode]         = useState<"signin" | "signup">("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "✅ Account created! You're now logged in.", duration: 4000 });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "👋 Welcome back!", duration: 3000 });
      }
    } catch (err: any) {
      toast({ title: "❌ " + (err.message ?? "Auth error"), duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-sm space-y-6 animate-fade-in">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.3)" }}
            >
              <Layers size={24} style={{ color: "hsl(var(--primary))" }} />
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
            🧠 DS <span style={{ color: "hsl(var(--primary))" }}>Deck</span>
          </h1>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            {mode === "signin"
              ? "Sign in to sync your flashcards across devices"
              : "Create an account to start learning"}
          </p>
        </div>

        {/* Card */}
        <div className="ds-card p-6 space-y-5">
          {/* Tab toggle */}
          <div
            className="flex rounded-lg p-1"
            style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}
          >
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200"
                style={{
                  background: mode === m ? "hsl(var(--primary))" : "transparent",
                  color: mode === m ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                  style={{
                    background: "hsl(var(--surface-2))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                  style={{
                    background: "hsl(var(--surface-2))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Minimum 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Your cards are synced securely with end-to-end Row Level Security.
        </p>
      </div>
    </div>
  );
}
