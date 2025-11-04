"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import ReminderService from "../../service/reminder-service";

type Props = {
  open: boolean;
  reminderId: number | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function DeleteReminderDialog({
  open,
  reminderId,
  onOpenChange,
  onDeleted,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!reminderId) {
      onOpenChange(false);
      return;
    }
    try {
      setLoading(true);
      await ReminderService.delete(reminderId);
      toast({ title: "Recordatorio eliminado" });
      onDeleted();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "No se pudo eliminar",
        description: "Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar recordatorio?</DialogTitle>
          <DialogDescription>
            Esta acción no puede deshacerse y solo aplica para recordatorios
            manuales.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}