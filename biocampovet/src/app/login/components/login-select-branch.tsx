"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BranchResponse } from "@/app/dashboard/branche/types/branch-response";
import { selectBranch } from "@/app/dashboard/branche/services/select-branch";
import { getAaxiosErrorMessage } from "@/helpers/error";

interface LoginSelectBranchProps {
  branches: BranchResponse[];
}

export function LoginSelectBranch({ branches }: LoginSelectBranchProps) {
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const handleBranchSelection = async () => {
    if (!selectedBranch) return;

    setLoading(true);
    setError("");

    try {
      const token = await selectBranch(selectedBranch);
      if (token) {
        window.location.href = "/dashboard/sales/new";
      }
    } catch (err: unknown) {
      setError(getAaxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccione una Sucursal</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className={`cursor-pointer transition ${
                selectedBranch === branch.id ? "border-blue-500 ring-2 ring-blue-400" : ""
              }`}
              onClick={() => setSelectedBranch(branch.id)}
            >
              <CardHeader>
                <CardTitle>{branch.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{branch.location}</p>
              </CardContent>
            </Card>
          ))}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button onClick={handleBranchSelection} disabled={!selectedBranch || loading}>
            {loading ? "Seleccionando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
