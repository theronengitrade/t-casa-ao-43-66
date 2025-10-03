import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
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
  const [showRegister, setShowRegister] = useState(false);
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      localStorage.removeItem('supabase.auth.token');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) {
        let errorMessage = error.message;
        
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
        
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error('Critical login error:', error);
      
      localStorage.clear();
      
      toast({
        title: "Erro no sistema",
        description: "Sistema reiniciado. Tente fazer login novamente.",
        variant: "destructive"
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 border-0 bg-white/95 backdrop-blur-sm shadow-2xl overflow-hidden">
        {showRegister ? (
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            <NewResidentRegistration onClose={() => setShowRegister(false)} />
          </div>
        ) : (
          <div className="p-8 space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-2">
              <img src={tcasaLogo} alt="T-Casa" className="h-10 w-auto" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#4A6FA5] focus:ring-[#4A6FA5]"
                />
              </div>
              
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#4A6FA5] focus:ring-[#4A6FA5] pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-[#4A6FA5] hover:bg-[#3D5A85] text-white font-semibold uppercase tracking-wide shadow-lg" 
                disabled={isLoading}
              >
                {isLoading ? "A ENTRAR..." : "ACESSAR"}
              </Button>
            </form>

            {/* Links */}
            <div className="flex justify-between items-center text-sm">
              <button 
                type="button"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => {
                  toast({
                    title: "Recuperação de senha",
                    description: "Entre em contacto com o administrador do condomínio para recuperar a sua senha.",
                  });
                }}
              >
                Esqueceu a senha?
              </button>
              <button 
                type="button"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                onClick={() => setShowRegister(true)}
              >
                Cadastrar email
              </button>
            </div>

            {/* Separator */}
            <div className="relative">
              <Separator className="bg-gray-200" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
                ou
              </span>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-normal justify-start px-4"
                onClick={() => {
                  toast({
                    title: "Em breve",
                    description: "Login com Google estará disponível em breve.",
                  });
                }}
              >
                <img 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  className="w-5 h-5 mr-3"
                />
                Continuar com o Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-normal justify-start px-4"
                onClick={() => {
                  toast({
                    title: "Em breve",
                    description: "Login com Facebook estará disponível em breve.",
                  });
                }}
              >
                <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continuar com o Facebook
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
