"use client";

import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  title: string;
  description?: string;
  triggerLabel: string;
  triggerVariant?: "default" | "destructive" | "outline" | "secondary"| "ghost";
  children: React.ReactNode;
};

export const ActionDialog: React.FC<Props> = ({
  open,
  setOpen,
  title,
  description,
  triggerLabel,
  triggerVariant = "default",
  children,
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer"  variant={triggerVariant} onClick={() => setOpen(true)}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
};
