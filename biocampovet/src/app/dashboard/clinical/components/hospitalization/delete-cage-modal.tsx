"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CageResponse } from "@/app/dashboard/clinical/types/cage-response";
import { useToast } from "@/hooks/use-toast";
import { getAaxiosErrorMessage } from "@/helpers/error";
import CageService from "@/app/dashboard/clinical/service/cage-service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (deletedCageId: number) => void;
  cageToDelete: CageResponse | null;
}

export function DeleteCageModal({ open, onOpenChange, onSuccess, cageToDelete }: Props) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!cageToDelete) return;

    setIsDeleting(true);
    try {
      await CageService.delete(cageToDelete.id);
      toast({ title: "Éxito", description: `La jaula "${cageToDelete.name}" ha sido eliminada.` });
      onSuccess(cageToDelete.id);
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getAaxiosErrorMessage(error) ?? "No se pudo eliminar la jaula.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás seguro?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la jaula{" "}
            <strong>&quot;{cageToDelete?.name}&quot;</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleDelete} disabled={isDeleting} variant="destructive">
            {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}