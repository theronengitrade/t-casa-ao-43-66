
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ResidentRegistrationWizard from './ResidentRegistrationWizard';

interface ResidentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResidentRegistrationModal({ isOpen, onClose }: ResidentRegistrationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg sm:text-xl">🏢 Registro de Novo Morador</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Complete os seus dados para criar a conta no T-Casa
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 sm:mt-4">
          <ResidentRegistrationWizard />
        </div>
      </DialogContent>
    </Dialog>
  );
}
