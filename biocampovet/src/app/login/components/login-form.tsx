"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "../services/auth-service";
import { LoginSelectBranch } from "./login-select-branch";
import PublicPortalService from "@/app/landing/service/public-portal-service";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { getAaxiosErrorMessage } from "@/helpers/error";
import { PawPrint } from "lucide-react";

function makeLCG(seed: number) {
  let s = seed >>> 0;
  return function next() {
    // LCG clásico usado por muchos runtimes: a, c, m constantes
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0x100000000; // [0,1)
  };
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const router = useRouter();

  // Crea posiciones DETERMINISTAS para las “estrellas” del header (sin Math.random() en render)
  const stars = useMemo(() => {
    const rand = makeLCG(42); // semilla fija
    return Array.from({ length: 25 }, (_, i) => ({
      cx: Math.floor(rand() * 800),
      cy: Math.floor(rand() * 140),
      r: 1.6,
      key: i,
    }));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await PublicPortalService.getCompanyInfo();
        setCompanyName(data.name);
      } catch {
        setCompanyName("Veterinaria Coryvet");
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(user, password);
      if (remember) {
        // opcional: guarda el usuario para autocompletar
        localStorage.setItem("lastUser", user);
      }
      if (data.branches && data.branches.length > 0) {
        setBranches(data.branches as BranchResponse[]);
      } else {
        router.push("/dashboard/pos/sales/new");
      }
    } catch (err) {
      setError(getAaxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-0 shadow-xl shadow-teal-200/40">
        {/* Encabezado ilustrado estable (sin random en render) */}
        <div className="relative h-40 w-full bg-gradient-to-b from-teal-500 to-teal-600">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 300" aria-hidden="true">
            <defs>
              <linearGradient id="hdr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <rect width="800" height="300" fill="url(#hdr)" />
            <circle cx="640" cy="80" r="22" fill="#fff" opacity="0.95" />
            {stars.map((s) => (
              <circle key={s.key} cx={s.cx} cy={s.cy} r={s.r} fill="#fff" opacity="0.8" />
            ))}
            <path d="M0,180 C160,130 260,150 360,140 C470,128 560,152 800,120 V300 H0 Z" fill="#2dd4bf" opacity="0.9" />
            <path d="M0,210 C140,180 260,195 420,185 C560,176 640,198 800,185 V300 H0 Z" fill="#99f6e4" opacity="0.95" />
          </svg>

          {/* Título */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 text-white">
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <PawPrint className="h-4 w-4" />
              <span>Veterinaria</span>
            </div>
            <h1 className="text-lg font-semibold drop-shadow">
              Bienvenido a {companyName || "la clínica"}
            </h1>
            <p className="text-white/80 text-xs">Inicia sesión para continuar</p>
          </div>
        </div>

        {/* Cuerpo “card” */}
        <CardContent className="p-6 md:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="user" className="text-teal-900">Usuario</Label>
              <Input
                id="user"
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                className="h-11 rounded-full bg-teal-50/70 placeholder:text-teal-400 focus-visible:ring-teal-400"
                placeholder="Correo o usuario"
                autoComplete="username"
                inputMode="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-teal-900">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-full bg-teal-50/70 placeholder:text-teal-400 focus-visible:ring-teal-400"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-teal-800/80">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-400"
                />
                Recordarme
              </label>
              <a href="#" className="text-sm text-teal-700 hover:underline">¿Olvidaste tu contraseña?</a>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full cursor-pointer rounded-full bg-teal-600 text-white hover:bg-teal-700"
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </Button>

            <div className="text-center text-xs text-teal-800/60">
              © {new Date().getFullYear()} {companyName || "Veterinaria Coryvet"} — Cuidamos lo que más quieres
            </div>
          </form>
        </CardContent>
      </Card>

      {branches.length > 0 && <LoginSelectBranch branches={branches} />}
    </div>
  );
}
