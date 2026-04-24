"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, configured, signInEmail, signUpEmail, signInGoogle, signInDemo } =
    useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") await signInEmail(email, password);
      else await signUpEmail(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(mapError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInGoogle();
      router.replace("/dashboard");
    } catch (err) {
      setError(mapError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] mx-auto max-w-md px-4 flex items-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-card w-full rounded-2xl p-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[hsl(var(--brand))] blur-lg opacity-60" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--brand))] to-cyan-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Inicia sesión" : "Crea tu cuenta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Accede a tu dashboard y al asistente IA."
              : "Únete en segundos y publica tu primera propiedad."}
          </p>
        </div>

        {!configured && (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <div className="font-medium">Firebase no configurado</div>
            <div className="mt-0.5 text-amber-200/80">
              Define las variables <code>NEXT_PUBLIC_FIREBASE_*</code> en{" "}
              <code>.env.local</code>. Mientras tanto puedes usar el modo demo.
            </div>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!configured}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!configured}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting || !configured} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "signin" ? "Entrando…" : "Creando cuenta…"}
              </>
            ) : mode === "signin" ? (
              "Iniciar sesión"
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[hsl(var(--card))] px-2 text-muted-foreground">o</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogle}
            disabled={!configured || submitting}
            className="w-full gap-2"
          >
            <GoogleIcon />
            Continuar con Google
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              signInDemo();
              router.replace("/dashboard");
            }}
            className="w-full"
          >
            Entrar en modo demo
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                className="text-[hsl(var(--brand))] hover:underline"
                onClick={() => setMode("signup")}
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                className="text-[hsl(var(--brand))] hover:underline"
                onClick={() => setMode("signin")}
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">
            ← Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 110-12.4 5.5 5.5 0 013.9 1.5l2.6-2.5A9.5 9.5 0 0012 2a10 10 0 100 20c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.3-.2-2H12z"
      />
    </svg>
  );
}

function mapError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("auth/invalid-credential"))
    return "Email o contraseña incorrectos.";
  if (msg.includes("auth/email-already-in-use"))
    return "Ese email ya tiene una cuenta.";
  if (msg.includes("auth/weak-password"))
    return "Contraseña muy débil (mín. 6 caracteres).";
  if (msg.includes("auth/popup-closed-by-user")) return "Popup cerrado.";
  return msg;
}
