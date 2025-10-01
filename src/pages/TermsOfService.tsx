import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
        </Link>

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
                <span className="font-medium text-primary"> suporte@tcasa.ao</span>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
