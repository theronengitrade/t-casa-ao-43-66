import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const PrivacyPolicy = () => {
  return <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
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
                entre em contacto connosco através do email: <span className="font-medium text-primary">info@tcasa.pt</span>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default PrivacyPolicy;