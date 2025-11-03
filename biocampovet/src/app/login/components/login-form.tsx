"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginSelectBranch } from "./login-select-branch";
import { login } from "../services/auth-service";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { getAaxiosErrorMessage } from "@/helpers/error";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(user, password);

      if (data.branches && data.branches.length > 0) {
        setBranches(data.branches as BranchResponse[]);
      } else {
        router.push("/dashboard/pos/sales/new");
      }
    } catch (error: unknown) {
      setError(getAaxiosErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Bienvenido</h1>
                <p className="text-muted-foreground text-balance">
                  Inicie sesión para acceder a ViocampoVet
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="user">Usuario</Label>
                <Input
                  id="user"
                  type="text"
                  required
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                {loading ? "Logging in..." : "Iniciar sesión"}
              </Button>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      {branches.length > 0 && <LoginSelectBranch branches={branches} />}
    </div>
  );
}
