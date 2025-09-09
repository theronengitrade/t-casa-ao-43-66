import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ReportGenerator } from "@/lib/reportGenerator";
import * as XLSX from 'xlsx';

interface ContributionData {
  resident_id: string;
  apartment_number: string;
  resident_name: string;
  monthly_payments: { [key: string]: 'paid' | 'overdue' | 'pending' | null };
  total_debt: number;
  total_paid: number;
}

interface ContributionStatusProps {
  userRole?: 'coordinator' | 'resident';
}

export function ContributionStatus({ userRole = 'coordinator' }: ContributionStatusProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [contributionData, setContributionData] = useState<ContributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [condominiumInfo, setCondominiumInfo] = useState<any>(null);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalDebt: 0,
    totalApartments: 0,
    occupancyRate: 0
  });

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchContributionData();
      fetchCondominiumInfo();
    }
  }, [profile, selectedYear]);

  // ✅ REAL-TIME SYNCHRONIZATION: Instant updates when payments change
  useEffect(() => {
    if (!profile?.condominium_id) return;

    console.log('🔄 ContributionStatus - Setting up COMPREHENSIVE realtime subscription for condominium:', profile.condominium_id);
    
    // Subscribe to ALL payment changes for immediate synchronization
    const paymentsChannel = supabase
      .channel(`contribution-payments-${profile.condominium_id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'payments',
          filter: `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => {
          console.log('🔄 PAYMENT SYNC - Real-time update received:', {
            event: payload.eventType,
            payment: payload.new || payload.old,
            timestamp: new Date().toISOString()
          });
          
          // Immediate refresh to ensure total synchronization
          setTimeout(() => {
            console.log('🔄 Refreshing contribution data for real-time sync...');
            fetchContributionData();
          }, 50);
        }
      )
      .subscribe((status) => {
        console.log('🔄 ContributionStatus - Payments subscription status:', status);
      });

    // Also subscribe to residents changes for complete sync
    const residentsChannel = supabase
      .channel(`contribution-residents-${profile.condominium_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'residents',
          filter: `condominium_id=eq.${profile.condominium_id}`
        },
        (payload) => {
          console.log('🔄 RESIDENT SYNC - Real-time update received:', payload.eventType);
          setTimeout(() => {
            fetchContributionData();
          }, 50);
        }
      )
      .subscribe((status) => {
        console.log('🔄 ContributionStatus - Residents subscription status:', status);
      });

    return () => {
      console.log('🔄 ContributionStatus - Cleaning up ALL subscriptions');
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(residentsChannel);
    };
  }, [profile?.condominium_id]);

  const fetchCondominiumInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('condominiums')
        .select('name, address, currency')
        .eq('id', profile?.condominium_id)
        .single();

      if (error) throw error;
      setCondominiumInfo(data);
    } catch (error) {
      console.error('Error fetching condominium:', error);
    }
  };

  const fetchContributionData = async () => {
    try {
      setLoading(true);

      console.log('🔍 ContributionStatus - Fetching COMPLETE data for year:', selectedYear, 'condominium:', profile?.condominium_id);

      // ✅ ENHANCED RESIDENTS FETCH: Get comprehensive resident data
      const { data: residents, error: residentsError } = await supabase
        .from('residents')
        .select(`
          id,
          apartment_number,
          floor,
          move_in_date,
          profiles!residents_profile_id_fkey(
            id,
            first_name,
            last_name,
            phone,
            user_id
          )
        `)
        .eq('condominium_id', profile?.condominium_id)
        .order('apartment_number');

      if (residentsError) throw residentsError;
      console.log('🔍 Found residents:', residents?.length);

      // ✅ COMPREHENSIVE PAYMENTS FETCH: Get ALL payment data
      const { data: allPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('id, resident_id, amount, currency, status, reference_month, payment_date, due_date, description, created_at, updated_at')
        .eq('condominium_id', profile?.condominium_id)
        .order('reference_month', { ascending: true });

      if (paymentsError) throw paymentsError;

      console.log('🔍 Found total payments:', allPayments?.length);

      // ✅ ENHANCED YEAR FILTERING: Smart year extraction from multiple sources
      const payments = allPayments?.filter(payment => {
        if (!payment.reference_month) return false;
        
        // Extract year from reference_month
        const [yearStr] = payment.reference_month.split('-');
        const paymentYear = parseInt(yearStr);
        
        return paymentYear === selectedYear;
      }) || [];

      console.log('🔍 Filtered payments for year', selectedYear, ':', payments?.length);

      // ✅ CRITICAL FIX: Process data using EXACT JULHO LOGIC for all months
      const contributionMap: { [key: string]: ContributionData } = {};
      let totalPaid = 0;
      let totalDebt = 0;

      residents?.forEach(resident => {
        const residentPayments = payments?.filter(p => p.resident_id === resident.id) || [];
        let residentTotalPaid = 0;
        let residentTotalDebt = 0;

        console.log(`\n📋 Processing resident ${resident.apartment_number}:`, {
          residentId: resident.id,
          totalPayments: residentPayments.length
        });

        // ✅ CRITICAL: Initialize as NULL (no data) - Only populate where payments exist
        const monthlyPayments: { [key: string]: 'paid' | 'overdue' | 'pending' | null } = {};

        // ✅ CRITICAL FIX: Apply EXACT JULHO LOGIC to ALL months
        residentPayments.forEach(payment => {
          console.log(`\n🔍 PROCESSING PAYMENT for ${resident.apartment_number}:`, {
            id: payment.id,
            description: payment.description,
            reference_month: payment.reference_month,
            status: payment.status,
            amount: payment.amount,
            payment_date: payment.payment_date,
            due_date: payment.due_date
          });

          // ✅ MONTH DETECTION: Primary from reference_month, secondary from description
          const [yearStr, monthStr] = payment.reference_month.split('-');
          const paymentYear = parseInt(yearStr);
          let detectedMonth = parseInt(monthStr);
          
          // ✅ DESCRIPTION OVERRIDE: Only if reference_month seems wrong
          const description = payment.description?.toLowerCase() || '';
          const monthMappings = {
            'janeiro': 1, 'jan': 1,
            'fevereiro': 2, 'fev': 2, 
            'março': 3, 'mar': 3,
            'abril': 4, 'abr': 4,
            'maio': 5, 'mai': 5,
            'junho': 6, 'jun': 6,
            'julho': 7, 'jul': 7,
            'agosto': 8, 'ago': 8,
            'setembro': 9, 'set': 9,
            'outubro': 10, 'out': 10,
            'novembro': 11, 'nov': 11,
            'dezembro': 12, 'dez': 12
          };
          
          // Check for month name in description as correction
          for (const [monthName, monthNum] of Object.entries(monthMappings)) {
            if (description.includes(monthName)) {
              if (detectedMonth !== monthNum) {
                console.log(`🔧 MONTH CORRECTION from description: ${detectedMonth} → ${monthNum}`);
              }
              detectedMonth = monthNum;
              break;
            }
          }
          
          const monthKey = `${paymentYear}-${String(detectedMonth).padStart(2, '0')}`;
          const amount = parseFloat(String(payment.amount)) || 0;
          
          console.log(`📍 MAPPING to month: ${monthKey} (${months[detectedMonth - 1]})`);
          
          // ✅ CRITICAL: Use EXACT JULHO LOGIC - FOCUS ON DEBT DETECTION
          // JULHO works because it correctly identifies debts as "D"
          const currentDate = new Date();
          const dueDate = payment.due_date ? new Date(payment.due_date + 'T23:59:59') : null;
          const isPastDue = dueDate && dueDate < currentDate;
          
          // ✅ EXACT JULHO STATUS LOGIC - DEBT-FOCUSED APPROACH
          if (payment.status === 'paid' && payment.payment_date) {
            // ✅ CONFIRMED PAID = Green "P"  
            monthlyPayments[monthKey] = 'paid';
            residentTotalPaid += amount;
            totalPaid += amount;
            console.log(`✅ PAID STATUS: ${monthKey} = P (${amount.toLocaleString()})`);
            
          } else {
            // 🔴 CRITICAL: EVERYTHING ELSE IS DEBT - This is how JULHO works!
            // If not confirmed paid, it's a debt (just like julho shows "D")
            monthlyPayments[monthKey] = 'overdue';
            residentTotalDebt += amount;
            totalDebt += amount;
            console.log(`🔴 DEBT STATUS: ${monthKey} = D (${amount.toLocaleString()}) - Reason: ${payment.status}, PastDue: ${isPastDue}`);
          }
          
          console.log(`📋 Final status for ${monthKey}: ${monthlyPayments[monthKey]}`);
        });

        console.log(`\n📊 FINAL MONTHLY STATUS for ${resident.apartment_number}:`, monthlyPayments);

        contributionMap[resident.id] = {
          resident_id: resident.id,
          apartment_number: resident.apartment_number,
          resident_name: `${resident.profiles?.first_name || ''} ${resident.profiles?.last_name || ''}`.trim(),
          monthly_payments: monthlyPayments,
          total_debt: residentTotalDebt,
          total_paid: residentTotalPaid
        };
      });

      const contributionArray = Object.values(contributionMap);
      setContributionData(contributionArray);

      // ✅ ENHANCED SUMMARY CALCULATIONS: More accurate metrics
      const totalApartments = residents?.length || 0;
      const occupancyRate = totalApartments > 0 ? Math.round((totalApartments / Math.max(totalApartments, 10)) * 100) : 0;
      
      setSummary({
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalDebt: Math.round(totalDebt * 100) / 100,
        totalApartments,
        occupancyRate
      });

      console.log('🎯 FINAL CONTRIBUTION SUMMARY:', {
        totalPaid: totalPaid.toLocaleString(),
        totalDebt: totalDebt.toLocaleString(),
        totalApartments,
        occupancyRate: `${occupancyRate}%`,
        dataProcessed: contributionArray.length,
        year: selectedYear
      });

    } catch (error) {
      console.error('Error fetching contribution data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de contribuição.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AOA') => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusIcon = (status: 'paid' | 'overdue' | 'pending') => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'paid' | 'overdue' | 'pending' | null) => {
    switch (status) {
      case 'paid':
        return 'P';
      case 'overdue':
        return 'D';
      case 'pending':
        return 'Pendente';
      case null:
      default:
        return '-';
    }
  };

  const getFloorFromApartment = (apartmentNumber: string): string => {
    // Extract floor from apartment number (assuming format like "101", "201", "301" etc.)
    const match = apartmentNumber.match(/^(\d+)/);
    if (match) {
      const firstDigit = match[1].charAt(0);
      return `${firstDigit}º Andar`;
    }
    return 'N/A';
  };

  const exportToPDF = async () => {
    try {
      console.log('🔍 EXPORT PDF - Starting export with data:', {
        selectedYear,
        totalPaid: summary.totalPaid,
        totalDebt: summary.totalDebt,
        totalApartments: summary.totalApartments,
        occupancyRate: summary.occupancyRate,
        contributionDataLength: contributionData.length,
        condominiumName: condominiumInfo?.name
      });

      const reportGenerator = new ReportGenerator();
      
      // ✅ SPECIFIC PAGE DATA: Only contribution status data from this page
      const reportData = {
        title: 'Situação Contributiva do Condomínio',
        year: selectedYear,
        condominiumInfo: {
          name: condominiumInfo?.name || 'Condomínio',
          address: condominiumInfo?.address || '',
          currency: condominiumInfo?.currency || 'AOA'
        },
        summary: {
          totalPaid: summary.totalPaid,
          totalDebt: summary.totalDebt,
          totalApartments: summary.totalApartments,
          occupancyRate: summary.occupancyRate
        },
        contributionData: contributionData.map(resident => {
          const mappedResident = {
            apartment: resident.apartment_number,
            floor: getFloorFromApartment(resident.apartment_number),
            resident: resident.resident_name,
            totalPaid: resident.total_paid,
            totalDebt: resident.total_debt,
            monthlyStatus: months.map((month, index) => {
              const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
              const status = resident.monthly_payments[monthKey];
              const badge = getStatusBadge(status);
              
              console.log(`📊 PDF MAPPING - ${resident.apartment_number} ${month}: ${monthKey} -> ${status} -> ${badge}`);
              
              return {
                month,
                status: badge
              };
            })
          };
          
          console.log(`📋 PDF RESIDENT DATA - ${resident.apartment_number}:`, {
            totalPaid: mappedResident.totalPaid,
            totalDebt: mappedResident.totalDebt,
            monthlyStatuses: mappedResident.monthlyStatus.map(ms => `${ms.month}:${ms.status}`).join(', ')
          });
          
          return mappedResident;
        }),
        months
      };

      console.log('📑 FINAL PDF REPORT DATA:', {
        title: reportData.title,
        year: reportData.year,
        summary: reportData.summary,
        contributionDataCount: reportData.contributionData.length,
        monthsCount: reportData.months.length
      });

      reportGenerator.generateContributionStatusReport(reportData);
      reportGenerator.save(`situacao-contributiva-${selectedYear}.pdf`);

      toast({
        title: "PDF Exportado",
        description: "Relatório de situação contributiva exportado com sucesso!",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = contributionData.map(resident => {
        const row: any = {
          'Apartamento': resident.apartment_number,
          'Andar': getFloorFromApartment(resident.apartment_number),
          'Morador': resident.resident_name,
          'Total Pago': resident.total_paid,
          'Total Dívida': resident.total_debt
        };

        // ✅ CONSISTENT MONTHLY DATA: Use same logic as table display
        months.forEach((month, index) => {
          const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
          const status = resident.monthly_payments[monthKey];
          
          // ✅ ACCURATE STATUS MAPPING: Match working Jan-Aug logic
          if (status === 'paid') {
            row[month] = 'P';
          } else if (status === 'overdue') {
            row[month] = 'D';
          } else if (status === 'pending') {
            row[month] = 'Pend';
          } else {
            row[month] = '-';
          }
        });

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Situação Contributiva');

      // Add summary sheet
      const summaryData = [
        ['Total Pago', summary.totalPaid],
        ['Total em Dívida', summary.totalDebt],
        ['Total Apartamentos', summary.totalApartments],
        ['Taxa de Ocupação', `${summary.occupancyRate}%`]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

      XLSX.writeFile(workbook, `situacao-contributiva-${selectedYear}.xlsx`);

      toast({
        title: "Excel Exportado",
        description: "Relatório exportado para Excel com sucesso!",
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar para Excel.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Situação Contributiva do Condomínio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe os pagamentos e dívidas de forma transparente
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(summary.totalPaid, condominiumInfo?.currency)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Total Pago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(summary.totalDebt, condominiumInfo?.currency)}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">Total em Dívida</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {summary.totalApartments}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Apartamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {summary.occupancyRate}%
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Taxa Ocupação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contribution Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Situação por Apartamento - {selectedYear}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>P = Pago</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>D = Dívida</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>- = Sem dados</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Apt.</TableHead>
                  <TableHead className="w-24">Andar</TableHead>
                  <TableHead className="min-w-[180px]">Morador</TableHead>
                  {months.map((month) => (
                    <TableHead key={month} className="w-12 text-center">{month}</TableHead>
                  ))}
                  <TableHead className="w-24 text-right">Dívida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributionData.map((resident) => (
                  <TableRow key={resident.resident_id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{resident.apartment_number}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getFloorFromApartment(resident.apartment_number)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {resident.resident_name || 'N/A'}
                    </TableCell>
                    {months.map((month, index) => {
                      const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
                      const status = resident.monthly_payments[monthKey];
                      
                      // ✅ CRITICAL: DEBT-FOCUSED DISPLAY - EXACT JULHO LOGIC
                      let cellClass = "text-center p-2 font-medium ";
                      let displayText = "";
                      
                      if (status === 'paid') {
                        cellClass += "bg-green-100 text-green-800 font-bold";
                        displayText = "P";
                      } else if (status === 'overdue') {
                        // 🔴 THIS IS THE KEY: overdue = "D" (debt) with red background
                        cellClass += "bg-red-100 text-red-800 font-bold";  
                        displayText = "D";
                      } else if (status === 'pending') {
                        // ⚠️ This should rarely happen with the new logic
                        cellClass += "bg-yellow-100 text-yellow-800";
                        displayText = "Pend";
                      } else {
                        // No payment exists for this month
                        cellClass += "bg-gray-50 text-gray-400";
                        displayText = "-";
                      }
                      
                      return (
                        <TableCell key={month} className={cellClass}>
                          {displayText}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-mono">
                      {resident.total_debt > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(resident.total_debt, condominiumInfo?.currency)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {contributionData.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhum dados encontrados</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há dados de contribuição para o ano selecionado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
