import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";

const PrivacyPolicy = () => {
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
              Política de Privacidade
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Última atualização: Janeiro de 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A T-Casa está comprometida com a proteção da privacidade e dos dados pessoais dos seus utilizadores. 
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos as suas informações 
                ao utilizar o nosso sistema de gestão de condomínios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">2. Dados Coletados</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Coletamos os seguintes tipos de informações:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Dados de identificação pessoal (nome, email, telefone)</li>
                <li>Informações de residência (número de apartamento, condomínio)</li>
                <li>Dados financeiros (pagamentos, quotas, despesas)</li>
                <li>Registos de acesso e utilização do sistema</li>
                <li>Informações de visitantes e reservas de espaços</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">3. Finalidade do Tratamento</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Os seus dados são utilizados para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Gestão eficiente do condomínio</li>
                <li>Processamento de pagamentos e controlo financeiro</li>
                <li>Comunicação entre residentes e coordenação</li>
                <li>Gestão de visitantes e segurança</li>
                <li>Melhoria contínua dos nossos serviços</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">4. Partilha de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os seus dados pessoais não serão partilhados com terceiros, exceto quando necessário para a 
                prestação dos serviços (processamento de pagamentos) ou quando legalmente obrigatório. 
                Todos os fornecedores terceiros são cuidadosamente selecionados e estão vinculados a 
                obrigações de confidencialidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">5. Segurança</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger os seus dados 
                contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui encriptação 
                de dados, controlo de acesso rigoroso e auditorias de segurança regulares.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">6. Direitos dos Utilizadores</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                De acordo com a legislação aplicável, tem direito a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Aceder aos seus dados pessoais</li>
                <li>Solicitar a correção de dados incorretos</li>
                <li>Solicitar a eliminação dos seus dados</li>
                <li>Opor-se ao tratamento dos seus dados</li>
                <li>Solicitar a portabilidade dos dados</li>
                <li>Retirar o consentimento a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">7. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os dados pessoais serão retidos apenas pelo tempo necessário para cumprir as finalidades 
                para as quais foram coletados, ou conforme exigido por lei. Dados financeiros podem ser 
                retidos por períodos mais longos para cumprimento de obrigações legais e fiscais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">8. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer os seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, 
                entre em contacto connosco através do email: <span className="font-medium text-primary">info@t-casa.pt</span>
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
export default PrivacyPolicy;