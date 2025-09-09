import { useState, useEffect } from 'react';
import { useSpecificContributions } from '@/hooks/useSpecificContributions';
import { CreateCampaignModal } from './CreateCampaignModal';
import { AddContributionModal } from './AddContributionModal';
import { ContributionStatusCell } from './ContributionStatusCell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  AlertCircle, 
  FileDown, 
  CalendarIcon,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface CampaignFilters {
  campaignId?: string;
  startDate?: Date;
  endDate?: Date;
  residentSearch?: string;
  status?: string;
}

export function SpecificContributionsReport() {
  const {
    campaigns,
    selectedCampaign,
    setSelectedCampaign,
    campaignReport,
    residents,
    loading,
    fetchCampaigns,
    fetchCampaignReport,
  } = useSpecificContributions();

  const [filters, setFilters] = useState<CampaignFilters>({});
  const [filteredContributions, setFilteredContributions] = useState<any[]>([]);

  // Apply filters to contributions
  useEffect(() => {
    if (!campaignReport?.contributions) {
      setFilteredContributions([]);
      return;
    }

    let filtered = [...campaignReport.contributions];

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(contribution => 
        new Date(contribution.created_at) >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(contribution => 
        new Date(contribution.created_at) <= filters.endDate!
      );
    }

    // Filter by resident search
    if (filters.residentSearch) {
      const searchTerm = filters.residentSearch.toLowerCase();
      filtered = filtered.filter(contribution => 
        contribution.resident_name.toLowerCase().includes(searchTerm) ||
        contribution.apartment_number.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(contribution => 
        contribution.status === filters.status
      );
    }

    setFilteredContributions(filtered);
  }, [campaignReport, filters]);

  // Handle campaign selection
  const handleCampaignSelect = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.campaign_id === campaignId);
    if (campaign) {
      setSelectedCampaign(campaign);
      await fetchCampaignReport(campaignId);
      setFilters({ campaignId }); // Reset other filters
    }
  };

  // Generate PDF report
  const generatePDFReport = () => {
    if (!selectedCampaign || !campaignReport) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Contribuições Específicas', 20, 20);
    
    doc.setFontSize(16);
    doc.text(selectedCampaign.title, 20, 35);
    
    doc.setFontSize(12);
    const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    doc.text(`Gerado em: ${reportDate}`, 20, 45);
    
    // Campaign summary
    doc.setFontSize(14);
    doc.text('Resumo da Campanha', 20, 65);
    
    const summaryData = [
      ['Meta da Campanha', formatCurrency(selectedCampaign.target_amount, 'AOA')],
      ['Total Arrecadado', formatCurrency(selectedCampaign.total_raised, 'AOA')],
      ['Valor Pendente', formatCurrency(selectedCampaign.total_pending, 'AOA')],
      ['Progresso', `${selectedCampaign.progress_percentage}%`],
      ['Total de Contribuintes', selectedCampaign.total_contributors.toString()],
      ['Contribuições Pagas', selectedCampaign.paid_contributors.toString()],
      ['Contribuições Pendentes', selectedCampaign.pending_contributors.toString()],
    ];

    let finalY = 75;
    doc.autoTable({
      startY: finalY,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      didDrawPage: function (data: any) {
        finalY = data.cursor.y;
      }
    });

    // Contributions table
    if (filteredContributions.length > 0) {
      doc.setFontSize(14);
      doc.text('Detalhes das Contribuições', 20, finalY + 20);

      const contributionsData = filteredContributions.map(contribution => [
        contribution.resident_name,
        contribution.apartment_number,
        formatCurrency(contribution.amount, 'AOA'),
        contribution.status === 'paid' ? 'Pago' : 'Pendente',
        contribution.payment_date ? format(new Date(contribution.payment_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        contribution.notes || '-'
      ]);

      doc.autoTable({
        startY: finalY + 30,
        head: [['Morador', 'Apartamento', 'Valor', 'Status', 'Data Pagamento', 'Observações']],
        body: contributionsData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`relatorio-contribuicoes-${selectedCampaign.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Contribuições Específicas</h1>
          <p className="text-muted-foreground">
            Analise o desempenho financeiro das campanhas de contribuição
          </p>
        </div>
        <div className="flex gap-2">
          <CreateCampaignModal />
          {selectedCampaign && (
            <Button onClick={generatePDFReport}>
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Seleção de Campanha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Campanha</Label>
              <Select value={filters.campaignId} onValueChange={handleCampaignSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCampaign && (
              <div className="flex items-end gap-2">
                <AddContributionModal 
                  campaign={selectedCampaign} 
                />
                <Button
                  variant="outline" 
                  onClick={() => fetchCampaignReport(selectedCampaign.campaign_id)}
                  disabled={loading}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Overview */}
      {selectedCampaign && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Arrecadado</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedCampaign.total_raised, 'AOA')}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Meta da Campanha</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(selectedCampaign.target_amount, 'AOA')}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pendente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(selectedCampaign.total_pending, 'AOA')}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contribuintes</p>
                    <p className="text-2xl font-bold">
                      {selectedCampaign.total_contributors}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Progresso da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progresso: {selectedCampaign.progress_percentage}%</span>
                <span>Restante: {formatCurrency(selectedCampaign.remaining_amount, 'AOA')}</span>
              </div>
              <Progress value={selectedCampaign.progress_percentage} className="h-3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium">Contribuintes Pagos</p>
                  <p className="text-green-600">{selectedCampaign.paid_contributors}</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">Contribuintes Pendentes</p>
                  <p className="text-orange-600">{selectedCampaign.pending_contributors}</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">Contribuição Média</p>
                  <p className="text-primary">{formatCurrency(selectedCampaign.average_contribution, 'AOA')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Contribuições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Buscar Morador</Label>
                  <Input
                    placeholder="Nome ou apartamento"
                    value={filters.residentSearch || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, residentSearch: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select 
                    value={filters.status || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contributions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes das Contribuições</CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredContributions.length} contribuição(ões) encontrada(s)
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredContributions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma contribuição encontrada para os filtros selecionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Morador</TableHead>
                        <TableHead>Apartamento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Pagamento</TableHead>
                        <TableHead>Data Contribuição</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContributions.map((contribution) => (
                        <TableRow key={contribution.id}>
                          <TableCell className="font-medium">
                            {contribution.resident_name}
                          </TableCell>
                          <TableCell>{contribution.apartment_number}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(contribution.amount, 'AOA')}
                          </TableCell>
                          <TableCell>
                            <ContributionStatusCell
                              contributionId={contribution.id}
                              currentStatus={contribution.status}
                              currentPaymentDate={contribution.payment_date}
                              residentName={contribution.resident_name}
                            />
                          </TableCell>
                          <TableCell>
                            {contribution.payment_date ? 
                              format(new Date(contribution.payment_date), 'dd/MM/yyyy', { locale: ptBR }) : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            {format(new Date(contribution.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {contribution.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state when no campaign selected */}
      {!selectedCampaign && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecione uma Campanha</h3>
            <p className="text-muted-foreground text-center">
              Escolha uma campanha de contribuição específica para visualizar o relatório detalhado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}