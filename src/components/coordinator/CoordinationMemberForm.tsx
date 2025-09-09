import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { coordinationMemberSchema, CoordinationMemberFormData, roleLabels } from "@/lib/validations/coordinationMember";
import { useToast } from "@/hooks/use-toast";

interface CoordinationMemberFormProps {
  onSubmit: (data: CoordinationMemberFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: CoordinationMemberFormData;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CoordinationMemberForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isLoading = false,
  submitLabel = "Adicionar"
}: CoordinationMemberFormProps) {
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CoordinationMemberFormData>({
    resolver: zodResolver(coordinationMemberSchema),
    defaultValues: initialData || {
      name: '',
      position: '',
      phone: '',
      role: 'administration',
      has_system_access: false
    }
  });

  const watchedRole = watch('role');
  const watchedSystemAccess = watch('has_system_access');

  const handleFormSubmit = async (data: CoordinationMemberFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o formulário",
        variant: "destructive"
      });
    }
  };

  const isProcessing = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nome *
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Nome completo do membro"
          disabled={isProcessing}
          className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Cargo */}
      <div className="space-y-2">
        <Label htmlFor="position" className="text-sm font-medium">
          Cargo *
        </Label>
        <Input
          id="position"
          {...register("position")}
          placeholder="Ex: Responsável Financeiro"
          disabled={isProcessing}
          className={errors.position ? "border-destructive focus-visible:ring-destructive" : ""}
          aria-invalid={!!errors.position}
          aria-describedby={errors.position ? "position-error" : undefined}
        />
        {errors.position && (
          <p id="position-error" className="text-sm text-destructive" role="alert">
            {errors.position.message}
          </p>
        )}
      </div>

      {/* Telefone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium">
          Telefone
        </Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="+244 XXX XXX XXX"
          disabled={isProcessing}
          type="tel"
          className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-destructive" role="alert">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Função */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Função *
        </Label>
        <Select 
          value={watchedRole} 
          onValueChange={(value) => setValue('role', value as CoordinationMemberFormData['role'])}
          disabled={isProcessing}
        >
          <SelectTrigger 
            className={errors.role ? "border-destructive focus-visible:ring-destructive" : ""}
            aria-invalid={!!errors.role}
            aria-describedby={errors.role ? "role-error" : undefined}
          >
            <SelectValue placeholder="Selecione a função" />
          </SelectTrigger>
          <SelectContent className="z-[9999] bg-background border shadow-lg max-h-[200px] overflow-y-auto">
            {Object.entries(roleLabels).map(([key, label]) => (
              <SelectItem 
                key={key} 
                value={key}
                className="cursor-pointer hover:bg-accent focus:bg-accent"
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p id="role-error" className="text-sm text-destructive" role="alert">
            {errors.role.message}
          </p>
        )}
      </div>

      {/* Acesso ao Sistema */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
        <div className="space-y-1">
          <Label htmlFor="system-access" className="text-sm font-medium cursor-pointer">
            Acesso ao sistema
          </Label>
          <p className="text-xs text-muted-foreground">
            Permitir que este membro acesse o sistema
          </p>
        </div>
        <Switch
          id="system-access"
          checked={watchedSystemAccess}
          onCheckedChange={(checked) => setValue('has_system_access', checked)}
          disabled={isProcessing}
          aria-describedby="system-access-description"
        />
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isProcessing}
          className="min-w-[100px]"
        >
          {isProcessing ? "Processando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}