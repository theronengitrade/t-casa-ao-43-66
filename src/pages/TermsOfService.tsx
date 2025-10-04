import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";

const TermsOfService = () => {
  return <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img src={tcasaLogo} alt="T-Casa by Theron Engitrade" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain flex-shrink-0" />
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <Card className="shadow-lg">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-brand-secondary/5">
            <CardTitle className="text-3xl font-bold text-primary">
              Termos de Uso
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Última atualização: Janeiro de 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao aceder e utilizar o sistema T-Casa, você concorda em cumprir e estar vinculado aos 
                presentes Termos de Uso. Se não concordar com qualquer parte destes termos, não deverá 
                utilizar o nosso sistema.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                O T-Casa é uma plataforma de gestão de condomínios que oferece ferramentas para coordenadores, 
                residentes e administradores gerirem de forma eficiente todos os aspetos relacionados com a 
                administração condominial, incluindo gestão financeira, comunicações, reservas, visitantes e relatórios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">3. Registo e Conta de Utilizador</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Para utilizar o T-Casa, você deve:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                <li>Manter a confidencialidade das suas credenciais de acesso</li>
                <li>Ser responsável por todas as atividades realizadas na sua conta</li>
                <li>Notificar imediatamente sobre qualquer uso não autorizado da sua conta</li>
                <li>Ter pelo menos 18 anos de idade</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">4. Uso Aceitável</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Ao utilizar o T-Casa, você concorda em NÃO:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Violar qualquer lei ou regulamento aplicável</li>
                <li>Infringir direitos de propriedade intelectual</li>
                <li>Transmitir conteúdo ilegal, ofensivo ou prejudicial</li>
                <li>Tentar aceder a áreas restritas do sistema sem autorização</li>
                <li>Interferir com o funcionamento normal do sistema</li>
                <li>Usar o sistema para fins comerciais não autorizados</li>
                <li>Fazer engenharia reversa ou tentar extrair código-fonte</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">5. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo, funcionalidades e recursos do T-Casa são propriedade exclusiva da empresa 
                e estão protegidos por leis de direitos autorais, marcas registadas e outras leis de propriedade 
                intelectual. Não é permitida a reprodução, distribuição ou criação de trabalhos derivados sem 
                autorização expressa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">6. Disponibilidade do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                Embora nos esforcemos para manter o T-Casa sempre disponível, não garantimos que o serviço 
                será ininterrupto ou livre de erros. Reservamo-nos o direito de suspender temporariamente 
                o serviço para manutenção, atualizações ou por razões técnicas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">7. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                O T-Casa é fornecido "como está". Na máxima extensão permitida por lei, não nos responsabilizamos 
                por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou 
                incapacidade de usar o sistema.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">8. Rescisão</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos suspender ou encerrar a sua conta imediatamente, sem aviso prévio, se violar estes 
                Termos de Uso. Você pode encerrar a sua conta a qualquer momento, contactando o suporte.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">9. Modificações dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As alterações 
                entrarão em vigor imediatamente após a publicação. O uso continuado do sistema após as 
                alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">10. Lei Aplicável</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos de Uso são regidos pelas leis da República de Angola. Qualquer disputa será 
                resolvida nos tribunais competentes de Angola.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">11. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre estes Termos de Uso, contacte-nos através do email: 
                <span className="font-medium text-primary">info@t-casa.pt</span>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-8 sm:py-12 border-t border-border mt-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src={tcasaLogo} alt="T-Casa" className="h-10 w-10" />
                <div>
                  <div className="font-bold text-foreground">T-Casa</div>
                  <div className="text-xs text-muted-foreground">Sistema de Gestão de Condomínios</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Desenvolvido pela Theron Engitrade, Lda
              </p>
            </div>

            {/* Legal Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Informações Legais</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="/cookie-policy" className="text-muted-foreground hover:text-primary transition-colors">
                    Política de Cookies
                  </a>
                </li>
                <li>
                  <a href="/lgpd-policy" className="text-muted-foreground hover:text-primary transition-colors">
                    LGPD & Proteção de Dados
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Contacto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Email: info@tcasa.ao</li>
                <li>Suporte: suporte@tcasa.ao</li>
                <li>Telefone: +244 933 696 567</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                © 2024 Theron Engitrade. Todos os direitos reservados.
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Seus dados estão protegidos</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default TermsOfService;