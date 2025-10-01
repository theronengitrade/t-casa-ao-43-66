import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCog, Users, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";
import NewResidentRegistration from "./NewResidentRegistration";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clear any existing corrupted session data before login
      localStorage.removeItem('supabase.auth.token');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) {
        let errorMessage = error.message;
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou palavra-passe incorretos.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme o seu email antes de fazer login.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos.';
        }
        
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta!"
        });
        
        // Small delay to ensure session is properly established
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error('Critical login error:', error);
      
      // Force clear any corrupted state
      localStorage.clear();
      
      toast({
        title: "Erro no sistema",
        description: "Sistema reiniciado. Tente fazer login novamente.",
        variant: "destructive"
      });
      
      // Refresh page to reset completely
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mobile-modal border-0 shadow-2xl bg-gradient-to-br from-background via-background to-accent/5">
        <DialogHeader className="space-y-4 pb-4 border-b border-border/50">
          <DialogTitle className="sr-only">Autenticação T-Casa</DialogTitle>
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
              <img src={tcasaLogo} alt="T-Casa" className="h-16 w-auto relative z-10 drop-shadow-lg" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-brand-secondary to-primary bg-clip-text text-transparent">
                Sistema T-Casa
              </h2>
              <p className="text-sm text-muted-foreground">
                Gestão inteligente de condomínios
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 h-12">
            <TabsTrigger value="login" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-md">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="register" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-md">
              Registar
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4 mt-6">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="space-y-2 pb-6">
                <CardTitle className="text-xl text-center font-semibold">Entrar no Sistema</CardTitle>
                <CardDescription className="text-center text-sm">
                  Aceda à sua conta T-Casa com as suas credenciais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Palavra-passe</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={isLoading}
                  >
                    {isLoading ? "A entrar..." : "Entrar"}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                  <div className="text-center text-xs text-muted-foreground font-medium">
                    Tipos de acesso disponíveis:
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/5 border-primary/20">
                      <UserCog className="w-3 h-3 mr-1.5" />
                      Coordenador
                    </Badge>
                    <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/5 border-primary/20">
                      <Users className="w-3 h-3 mr-1.5" />
                      Residente
                    </Badge>
                    <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/5 border-primary/20">
                      <Building2 className="w-3 h-3 mr-1.5" />
                      Super Admin
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <NewResidentRegistration onClose={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;