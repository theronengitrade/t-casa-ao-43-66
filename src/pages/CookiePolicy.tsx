import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CookiePolicy = () => {
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
              Política de Cookies
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Última atualização: Janeiro de 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">1. O que são Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo quando você 
                visita um website. Eles são amplamente utilizados para fazer com que os websites funcionem 
                de forma mais eficiente, além de fornecer informações aos proprietários do site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">2. Como Usamos Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                O T-Casa utiliza cookies para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Manter você autenticado durante a sessão</li>
                <li>Lembrar as suas preferências e configurações</li>
                <li>Melhorar a segurança e prevenir fraudes</li>
                <li>Analisar como você utiliza o sistema para melhorias</li>
                <li>Personalizar a sua experiência no sistema</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">3. Tipos de Cookies Utilizados</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Cookies Essenciais</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Necessários para o funcionamento básico do sistema. Incluem cookies de autenticação 
                    e segurança. Estes cookies não podem ser desativados.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Cookies de Funcionalidade</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Permitem que o sistema se lembre das suas escolhas (como idioma, tema) e forneçam 
                    recursos aprimorados e personalizados.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Cookies de Desempenho</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Coletam informações sobre como você utiliza o sistema, permitindo-nos melhorar o 
                    desempenho e a experiência do utilizador.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Cookies de Sessão</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Temporários e são apagados quando você fecha o navegador. Usados para manter a sua 
                    sessão ativa enquanto navega pelo sistema.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Cookies Persistentes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Permanecem no seu dispositivo por um período específico. Usados para lembrar as suas 
                    preferências entre sessões.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">4. Cookies de Terceiros</h2>
              <p className="text-muted-foreground leading-relaxed">
                O T-Casa pode utilizar serviços de terceiros que também colocam cookies no seu dispositivo. 
                Isso pode incluir serviços de análise e autenticação. Estes terceiros têm as suas próprias 
                políticas de privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">5. Gestão de Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Você pode controlar e/ou eliminar cookies como desejar. Pode:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Eliminar todos os cookies já armazenados no seu dispositivo</li>
                <li>Configurar o seu navegador para bloquear cookies</li>
                <li>Configurar o seu navegador para avisar quando cookies forem enviados</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                No entanto, se você bloquear ou eliminar cookies, algumas funcionalidades do T-Casa 
                poderão não funcionar corretamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">6. Como Desativar Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Você pode desativar cookies através das configurações do seu navegador:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><span className="font-medium">Google Chrome:</span> Definições → Privacidade e Segurança → Cookies</li>
                <li><span className="font-medium">Firefox:</span> Opções → Privacidade e Segurança → Cookies</li>
                <li><span className="font-medium">Safari:</span> Preferências → Privacidade → Cookies</li>
                <li><span className="font-medium">Edge:</span> Definições → Privacidade → Cookies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">7. Atualização da Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta Política de Cookies pode ser atualizada periodicamente para refletir mudanças nas 
                nossas práticas ou por razões operacionais, legais ou regulatórias. Recomendamos que 
                reveja esta página regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3 text-foreground">8. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Se tiver questões sobre a nossa utilização de cookies, contacte-nos através do email: 
                <span className="font-medium text-primary"> cookies@tcasa.ao</span>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;
