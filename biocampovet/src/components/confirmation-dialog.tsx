import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  tooltipMessage?: string;
  onConfirm: () => void;
  confirmText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | null;
  showTooltip?: boolean;
  icon?: React.ReactNode;
}


export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  title,
  description,
  tooltipMessage = "Esta acción no será posible si existen condiciones pendientes.",
  onConfirm,
  confirmText = "Confirmar",
  confirmVariant = "default",
  showTooltip = true,
  icon = <AlertTriangle size={20} />,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className={`flex items-center mt-4 ${showTooltip ? "justify-between" : "justify-end"}`}>
          {showTooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-yellow-600 cursor-pointer ml-1">
                    {icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <p>{tooltipMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} variant={confirmVariant ?? "default"}>
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
