import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LGPDPolicy = () => {
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
              Política LGPD & Proteção de Dados
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Lei Geral de Proteção de Dados Pessoais - Última atualização: Janeiro de 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">1. Compromisso com a Proteção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                O T-Casa está comprometido em proteger a privacidade e os dados pessoais de todos os seus 
                utilizadores, em conformidade com os princípios da Lei Geral de Proteção de Dados Pessoais (LGPD) 
                e demais legislações aplicáveis em Angola e internacionalmente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">2. Definições Importantes</h2>
              <div className="space-y-3">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Dados Pessoais:</span> Qualquer informação 
                    relacionada a uma pessoa natural identificada ou identificável.
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Titular dos Dados:</span> Pessoa natural 
                    a quem se referem os dados pessoais objeto de tratamento.
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Tratamento:</span> Toda operação realizada 
                    com dados pessoais (coleta, armazenamento, uso, partilha, eliminação).
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">3. Princípios Orientadores</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                O tratamento de dados pessoais no T-Casa segue os seguintes princípios:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><span className="font-medium">Finalidade:</span> Objetivos legítimos, específicos e informados</li>
                <li><span className="font-medium">Adequação:</span> Compatibilidade com as finalidades informadas</li>
                <li><span className="font-medium">Necessidade:</span> Apenas dados essenciais para os objetivos</li>
                <li><span className="font-medium">Livre Acesso:</span> Consulta facilitada sobre seus dados</li>
                <li><span className="font-medium">Qualidade:</span> Exatidão, clareza e atualização dos dados</li>
                <li><span className="font-medium">Transparência:</span> Informações claras e acessíveis</li>
                <li><span className="font-medium">Segurança:</span> Medidas técnicas e administrativas</li>
                <li><span className="font-medium">Prevenção:</span> Medidas para prevenir danos</li>
                <li><span className="font-medium">Não Discriminação:</span> Sem fins discriminatórios</li>
                <li><span className="font-medium">Responsabilização:</span> Demonstração de conformidade</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">4. Base Legal para Tratamento</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                O tratamento de dados pessoais no T-Casa baseia-se em:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Consentimento do titular para finalidades específicas</li>
                <li>Cumprimento de obrigação legal ou regulatória</li>
                <li>Execução de contrato (gestão condominial)</li>
                <li>Exercício regular de direitos em processo judicial</li>
                <li>Proteção da vida e segurança dos residentes</li>
                <li>Interesse legítimo do condomínio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">5. Direitos dos Titulares</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Como titular de dados pessoais, você tem os seguintes direitos:
              </p>
              <div className="grid gap-3">
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-foreground mb-1">Confirmação e Acesso</h4>
                  <p className="text-sm text-muted-foreground">
                    Confirmar se há tratamento dos seus dados e aceder a eles
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-foreground mb-1">Correção</h4>
                  <p className="text-sm text-muted-foreground">
                    Solicitar correção de dados incompletos, inexatos ou desatualizados
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-foreground mb-1">Anonimização, Bloqueio ou Eliminação</h4>
                  <p className="text-sm text-muted-foreground">
                    Dados desnecessários, excessivos ou tratados em desconformidade
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-foreground mb-1">Portabilidade</h4>
                  <p className="text-sm text-muted-foreground">
                    Receber seus dados em formato estruturado e interoperável
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-foreground mb-1">Informação sobre Compartilhamento</h4>
                  <p className="text-sm text-muted-foreground">
                    Saber com quais entidades públicas ou privadas os dados foram partilhados
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-4 py-2">
                  <h4 className="font-semibold text-foreground mb-1">Revogação do Consentimento</h4>
                  <p className="text-sm text-muted-foreground">
                    Retirar o consentimento a qualquer momento
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">6. Medidas de Segurança</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Implementamos medidas técnicas e organizacionais rigorosas:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Encriptação de dados em trânsito e em repouso</li>
                <li>Controlo de acesso baseado em funções (RBAC)</li>
                <li>Autenticação multifator para acessos sensíveis</li>
                <li>Auditorias de segurança regulares</li>
                <li>Monitorização contínua de ameaças</li>
                <li>Backups regulares e plano de recuperação de desastres</li>
                <li>Formação contínua da equipa em segurança da informação</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">7. Incidentes de Segurança</h2>
              <p className="text-muted-foreground leading-relaxed">
                Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, 
                comunicaremos a autoridade competente e os afetados em prazo adequado, conforme exigido pela 
                legislação aplicável.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">8. Encarregado de Proteção de Dados (DPO)</h2>
              <p className="text-muted-foreground leading-relaxed">
                O T-Casa designou um Encarregado de Proteção de Dados (Data Protection Officer - DPO) responsável 
                por aceitar reclamações e comunicações dos titulares, prestar esclarecimentos e adotar providências.
              </p>
              <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Contacto DPO:</span>
                  <br />
                  Email: <span className="text-primary font-medium">dpo@tcasa.ao</span>
                  <br />
                  Telefone: <span className="text-primary font-medium">+244 XXX XXX XXX</span>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">9. Como Exercer Seus Direitos</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Para exercer qualquer um dos seus direitos, você pode:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Contactar o DPO através dos canais indicados acima</li>
                <li>Aceder às configurações de privacidade no seu perfil</li>
                <li>Enviar solicitação formal por email</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Responderemos às suas solicitações em até 15 dias úteis, podendo ser prorrogado por mais 
                15 dias se necessário, mediante justificação.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">10. Alterações a Esta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações significativas 
                através do sistema ou por email. A versão atualizada será sempre disponibilizada nesta página 
                com a data da última atualização.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LGPDPolicy;
