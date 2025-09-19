import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Shield, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Bell, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  XCircle,
  Zap,
  Star,
  Calendar,
  MessageCircle,
  Download,
  Smartphone,
  Eye
} from "lucide-react";
import heroImage from "/lovable-uploads/3513bb45-0d94-401d-9325-563bbbe89819.png";
import dashboardImage from "@/assets/dashboard-preview.jpg";
import { useAuth } from "@/hooks/useAuth";
import tcasaLogo from "/lovable-uploads/2106fa56-6f57-47da-99f6-4ad2e18592c3.png";
import residentsImage from "@/assets/residents-happy.jpg";
import { ResidentRegistrationModal } from "./ResidentRegistrationModal";

interface LandingPageProps {
  onOpenAuth: () => void;
}

const LandingPage = ({ onOpenAuth }: LandingPageProps) => {
  const { user } = useAuth();
  const [showResidentModal, setShowResidentModal] = useState(false);

  // Redirect to dashboard if user is already logged in
  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  const problems = [
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Cobranças Manuais",
      description: "Horas perdidas com planilhas confusas e lembretes manuais de pagamento"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Falta de Relatórios",
      description: "Ausência de relatórios financeiros claros e dados organizados"
    },
    {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: "Reclamações Constantes",
      description: "Moradores insatisfeitos pela falta de transparência na gestão"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Gestão Confusa",
      description: "Ocorrências, reservas e manutenções desorganizadas e mal controladas"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Tempo Perdido",
      description: "Tarefas repetitivas que consomem tempo precioso do síndico"
    },
    {
      icon: <XCircle className="h-8 w-8" />,
      title: "Inadimplência",
      description: "Moradores em atraso sem controle eficaz de cobrança"
    }
  ];

  const implications = [
    {
      icon: <TrendingDown className="h-8 w-8 text-red-500" />,
      title: "Inadimplência Crescente",
      description: "Sem controle adequado, os atrasos se tornam crônicos"
    },
    {
      icon: <XCircle className="h-8 w-8 text-red-500" />,
      title: "Perda de Credibilidade",
      description: "Moradores perdem confiança na administração"
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      title: "Desorganização Financeira",
      description: "Contas confusas e falta de transparência"
    },
    {
      icon: <Clock className="h-8 w-8 text-red-500" />,
      title: "Sobrecarga de Trabalho",
      description: "Quanto maior o condomínio, mais difícil fica controlar tudo"
    }
  ];

  const solutions = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Automatização de Cobranças",
      description: "Moradores recebem lembretes automáticos via WhatsApp e email"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Controle em Tempo Real",
      description: "Dashboard com pagamentos, receitas e inadimplência instantâneos"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Relatórios Financeiros Claros",
      description: "Relatórios profissionais gerados automaticamente"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Gestão Completa de Manutenções",
      description: "Reservas de espaços e ocorrências organizadas em poucos cliques"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Cadastro Completo",
      description: "Moradores, visitantes e prestadores organizados"
    },
    {
      icon: <Download className="h-8 w-8" />,
      title: "Documentos Digitais",
      description: "Centralização de documentos e anúncios digitais"
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Chat Interno",
      description: "Comunicação direta entre gestão e moradores"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Segurança Total",
      description: "Dados 100% seguros com criptografia AES256"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Carlos Silva",
      role: "Síndico - Edifício Torres do Mar",
      quote: "O T-Casa reduziu minha inadimplência em 40% nos primeiros 3 meses. Os moradores agora têm transparência total."
    },
    {
      name: "Ana Beatriz",
      role: "Administradora - Residencial Atlântida",
      quote: "Gerencio 8 condomínios com o T-Casa. O que antes levava horas, agora faço em minutos. É transformador."
    },
    {
      name: "João Mendes",
      role: "Síndico - Condomínio Vila Real",
      quote: "Acabaram as planilhas confusas. Agora tenho relatórios profissionais e moradores satisfeitos."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src={tcasaLogo} 
              alt="T-Casa by Theron Engitrade" 
              className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain flex-shrink-0" 
            />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">T-Casa</span>
              <span className="hidden sm:block text-xs text-muted-foreground">by Theron Engitrade</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <a href="#problemas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Problemas
            </a>
            <a href="#solucao" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Solução
            </a>
            <a href="#depoimentos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Depoimentos
            </a>
          </nav>

          <div className="flex items-center">
            <Button size="sm" className="brand-glow text-xs sm:text-sm bg-primary hover:bg-primary/90 px-2 sm:px-4" onClick={onOpenAuth}>
              <span className="hidden md:inline">Fazer Login</span>
              <span className="md:hidden">Login</span>
              <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 1. Hero Section - Situação do Público */}
      <section className="relative py-8 sm:py-16 lg:py-24 xl:py-32 overflow-hidden">
        <div className="hero-gradient absolute inset-0 opacity-10"></div>
        <div className="container mx-auto px-3 sm:px-4 relative">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <Badge className="inline-flex items-center space-x-1 sm:space-x-2 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm px-2 sm:px-3 py-1">
                  <span>🏢</span>
                  <span>Sistema Profissional para Condomínios</span>
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                  A gestão do seu condomínio pode ser{" "}
                  <span className="text-primary">muito mais simples</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  Planilhas confusas, cobranças manuais, moradores atrasados e falta de transparência ainda fazem parte da sua rotina? 
                  <strong className="text-foreground block sm:inline mt-1 sm:mt-0"> É hora de mudar isso.</strong>
                </p>
              </div>

              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-3 lg:gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white border-0 brand-glow text-sm sm:text-base w-full sm:w-auto" onClick={onOpenAuth}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Solicite uma Demonstração Gratuita</span>
                  <span className="sm:hidden">Demonstração Grátis</span>
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowResidentModal(true)} className="text-sm sm:text-base border-primary text-primary hover:bg-primary/10 w-full sm:w-auto">
                  <Smartphone className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Experimente o T-Casa Agora</span>
                  <span className="sm:hidden">Experimente Agora</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Demonstração 100% gratuita</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Sem compromisso</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  <span>Suporte especializado incluído</span>
                </div>
              </div>
            </div>

            <div className="relative order-first lg:order-last">
              <div className="absolute -inset-2 sm:-inset-4 hero-gradient rounded-2xl sm:rounded-3xl blur opacity-30"></div>
              <img 
                src={heroImage} 
                alt="Transformação real na gestão condominial - Antes: caos e estresse, Depois: controle total" 
                className="relative rounded-xl sm:rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problemas - Dores Reais */}
      <section id="problemas" className="py-8 sm:py-16 lg:py-20 bg-red-50/30 dark:bg-red-950/10">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
            <Badge className="inline-flex items-center space-x-1 sm:space-x-2 bg-red-100 text-red-700 border-red-200 text-xs sm:text-sm px-2 sm:px-3 py-1">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Problemas Reais da Gestão</span>
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground px-2">
              Estes Problemas Te Parecem Familiares?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
              <strong className="text-red-600">Esses problemas consomem tempo, reduzem a confiança e aumentam o estresse da gestão.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {problems.map((problem, index) => (
              <Card key={index} className="border-red-200 bg-white/50 hover:shadow-lg transition-all">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-red-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-red-600 mb-3 sm:mb-4">
                    {problem.icon}
                  </div>
                  <CardTitle className="text-base sm:text-lg lg:text-xl text-red-700">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-center text-sm sm:text-base">
                    {problem.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Implicações - Impacto de Não Resolver */}
      <section className="py-8 sm:py-16 lg:py-20 bg-orange-50/30 dark:bg-orange-950/10">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
            <Badge className="inline-flex items-center space-x-1 sm:space-x-2 bg-orange-100 text-orange-700 border-orange-200 text-xs sm:text-sm px-2 sm:px-3 py-1">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Consequências Graves</span>
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground px-2">
              O Que Acontece Se Não Resolver Estes Problemas?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-orange-600 max-w-3xl mx-auto font-semibold px-2">
              "Quanto mais o condomínio cresce, mais difícil fica manter tudo sob controle."
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {implications.map((implication, index) => (
              <Card key={index} className="border-orange-200 bg-gradient-to-br from-white to-orange-50/50 hover:shadow-lg transition-all">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-red-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                    {implication.icon}
                  </div>
                  <CardTitle className="text-base sm:text-lg lg:text-xl text-red-700">{implication.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-center text-sm sm:text-base text-red-600">
                    {implication.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Necessidade de Solução - Apresentação T-Casa */}
      <section id="solucao" className="py-8 sm:py-16 lg:py-20 bg-green-50/30 dark:bg-green-950/10">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
            <Badge className="inline-flex items-center space-x-1 sm:space-x-2 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm px-2 sm:px-3 py-1">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Solução Definitiva</span>
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground px-2">
              T-Casa: A Solução Que Você Precisa
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-primary max-w-3xl mx-auto font-semibold px-2">
              "O T-Casa foi criado para devolver tempo, transparência e eficiência à gestão condominial."
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {solutions.map((solution, index) => (
              <Card key={index} className="border-green-200 bg-gradient-to-br from-white to-green-50/50 hover:shadow-lg transition-all hover:scale-105">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-green-600 mb-3 sm:mb-4">
                    {solution.icon}
                  </div>
                  <CardTitle className="text-base sm:text-lg lg:text-xl text-green-700">{solution.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-center text-sm sm:text-base">
                    {solution.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
              <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
                Dashboard Profissional e Intuitivo
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground">
                Interface moderna que permite gerir todas as operações do seu condomínio 
                de forma eficiente, organizada e profissional.
              </p>
              <ul className="space-y-2 sm:space-y-3">
                {[
                  "Visão geral completa em tempo real",
                  "Relatórios visuais e interativos", 
                  "Acesso móvel 24/7",
                  "Notificações automáticas inteligentes"
                ].map((item, index) => (
                  <li key={index} className="flex items-center space-x-2 sm:space-x-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative order-1 lg:order-2">
              <img 
                src={dashboardImage} 
                alt="Dashboard T-Casa - Interface profissional e intuitiva" 
                className="rounded-xl sm:rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Prova Social e Autoridade */}
      <section id="depoimentos" className="py-8 sm:py-16 lg:py-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
            <Badge className="inline-flex items-center space-x-1 sm:space-x-2 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm px-2 sm:px-3 py-1">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Resultados Comprovados</span>
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground px-2">
              Mais de 600 Condomínios Já Utilizam o T-Casa
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-primary max-w-3xl mx-auto font-semibold px-2">
              "E comprovam a eficiência da plataforma diariamente"
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">600+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Condomínios Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">15k+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Residentes Satisfeitos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">99.9%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Disponibilidade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">24/7</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Suporte Especializado</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/50 border-primary/20 hover:shadow-lg transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex mb-3 sm:mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-sm sm:text-base text-muted-foreground italic mb-3 sm:mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-sm sm:text-base text-foreground">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Authority Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12 lg:mt-16">
            <div className="text-center">
              <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h4 className="font-semibold text-sm sm:text-base text-foreground">Desenvolvido pela Theron Engitrade</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">Empresa especializada em soluções tecnológicas</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-3 sm:mb-4" />
              <h4 className="font-semibold text-sm sm:text-base text-foreground">Segurança Garantida</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">Dados protegidos com criptografia AES256</p>
            </div>
            <div className="text-center">
              <Star className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-3 sm:mb-4" />
              <h4 className="font-semibold text-sm sm:text-base text-foreground">Inovação Reconhecida</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">Líder em gestão condominial digital</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Final - Conversão */}
      <section className="py-8 sm:py-16 lg:py-20 hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 opacity-20"></div>
        <div className="container mx-auto px-3 sm:px-4 text-center space-y-4 sm:space-y-6 lg:space-y-8 relative">
          <Badge className="inline-flex items-center space-x-1 sm:space-x-2 bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 sm:px-3 py-1">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Momento da Decisão</span>
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight px-2">
            Chegou a Hora de Transformar a Gestão do Seu Condomínio
          </h2>
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90 max-w-4xl mx-auto leading-relaxed px-2">
            Pare de perder tempo com planilhas confusas e processos manuais. 
            <strong className="block sm:inline mt-1 sm:mt-0"> Descubra como centenas de síndicos já transformaram suas rotinas com o T-Casa.</strong>
          </p>
          
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 lg:gap-6 justify-center items-center pt-4 sm:pt-6 lg:pt-8">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 font-semibold text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 h-auto w-full sm:w-auto" 
              onClick={onOpenAuth}
            >
              <Eye className="mr-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <span className="hidden sm:inline">Solicite uma Demonstração Gratuita</span>
              <span className="sm:hidden">Demonstração Gratuita</span>
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 h-auto w-full sm:w-auto"
              onClick={() => setShowResidentModal(true)}
            >
              <Smartphone className="mr-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <span className="hidden sm:inline">Clique e Descubra o T-Casa Hoje Mesmo</span>
              <span className="sm:hidden">Descubra o T-Casa</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 text-xs sm:text-sm opacity-80 pt-4 sm:pt-6 lg:pt-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              <span>Demonstração personalizada gratuita</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              <span>Sem compromisso ou taxa de instalação</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              <span>Suporte especializado incluído</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-6 sm:py-8">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <img src={tcasaLogo} alt="T-Casa" className="h-6 w-6 sm:h-8 sm:w-8" />
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                <div className="font-semibold">Sistema de Gestão de Condomínios</div>
                <div className="text-xs">Desenvolvido pela Theron Engitrade</div>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground text-center">
              © 2024 Theron Engitrade. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ResidentRegistrationModal 
        isOpen={showResidentModal} 
        onClose={() => setShowResidentModal(false)} 
      />
    </div>
  );
};

export default LandingPage;