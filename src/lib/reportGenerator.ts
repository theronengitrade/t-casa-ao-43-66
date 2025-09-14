import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportData {
  residents?: number;
  visitors?: number;
  announcements?: number;
  payments?: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  occupancy?: number;
  condominiumInfo?: {
    name: string;
    address: string;
    currency: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  period?: string;
  remanescente?: {
    ano_atual: number;
    receita_atual: number;
    despesas_atual: number;
    remanescente_total: number;
    saldo_disponivel: number;
    historico?: Array<{
      ano_referencia: number;
      valor_recebido: number;
      valor_despesas: number;
      valor_remanescente: number;
      valor_utilizado: number;
      saldo_atual: number;
    }>;
  };
  expenses?: {
    total: number;
    receita_atual: number;
    remanescente: number;
  };
  // Detailed data arrays
  detailedResidents?: Array<{
    id: string;
    apartment_number: string;
    floor?: string;
    document_number?: string;
    is_owner: boolean;
    move_in_date?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    parking_spaces?: any;
    family_members?: any;
    profiles: {
      first_name: string;
      last_name: string;
      phone?: string;
      user_id: string;
    };
  }>;
  detailedVisitors?: Array<{
    id: string;
    name: string;
    phone?: string;
    document_number?: string;
    visit_date: string;
    visit_time?: string;
    purpose?: string;
    approved: boolean;
    residents: {
      apartment_number: string;
      profiles: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
  detailedAnnouncements?: Array<{
    id: string;
    title: string;
    content: string;
    published: boolean;
    is_urgent: boolean;
    priority: number;
    created_at: string;
    expires_at?: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  }>;
  detailedPayments?: Array<{
    id: string;
    amount: number;
    currency: string;
    due_date: string;
    payment_date?: string;
    status: string;
    description: string;
    reference_month: string;
    residents: {
      apartment_number: string;
      profiles: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
  detailedReservations?: Array<{
    id: string;
    space_name: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    purpose?: string;
    approved: boolean;
    approved_at?: string;
    residents: {
      apartment_number: string;
      profiles: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
  detailedExpenses?: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    expense_date: string;
    fonte_pagamento: string;
    service_providers?: {
      name: string;
      service_type: string;
    };
  }>;
}

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  condominiumInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  recipient: {
    name: string;
    nif?: string;
    address?: string;
    apartment?: string;
  };
  description: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentDate?: string;
  coordinatorName?: string;
  startDate?: string;
  completionDate?: string;
  observations?: string;
}

export class ReportGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;
  private footerHeight: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
    this.footerHeight = 45; // Updated footer height
  }

  private checkPageSpace(requiredHeight: number): void {
    const availableHeight = this.pageHeight - this.footerHeight - this.currentY;
    if (availableHeight < requiredHeight) {
      this.addNewPage();
    }
  }

  private addNewPage(): void {
    this.addProfessionalFooter();
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private updateCurrentY(additionalSpace: number = 0): void {
    // Always ensure minimum spacing and check for page overflow
    this.currentY += additionalSpace;
    if (this.currentY > this.pageHeight - this.footerHeight - 20) {
      this.addNewPage();
    }
  }

  private addProfessionalHeader(condominiumInfo: any, reportTitle: string) {
    // Professional header background
    this.doc.setFillColor(245, 247, 250);
    this.doc.rect(0, 0, this.pageWidth, 70, 'F');
    
    // Reset to fixed header positions to avoid overlap
    const headerStartY = 10;
    
    // Main logo area with gradient effect
    this.doc.setFillColor(41, 128, 185);
    this.doc.roundedRect(this.margin, headerStartY, 50, 20, 3, 3, 'F');
    
    // Logo text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('T-CASA', this.margin + 25, headerStartY + 12, { align: 'center' });

    // Date and time (right side, top)
    this.doc.setFontSize(8);
    this.doc.setTextColor(108, 117, 125);
    this.doc.setFont('helvetica', 'normal');
    const currentDateTime = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt });
    this.doc.text(`Gerado em: ${currentDateTime}`, this.pageWidth - this.margin, headerStartY + 5, { align: 'right' });

    // Condominium name - center, below logo line
    this.doc.setTextColor(33, 37, 41);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(condominiumInfo?.name || 'Condomínio', this.pageWidth / 2, headerStartY + 20, { align: 'center' });

    // Address line - center, below name
    if (condominiumInfo?.address) {
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(108, 117, 125);
      this.doc.text(condominiumInfo.address, this.pageWidth / 2, headerStartY + 30, { align: 'center' });
    }

    // Contact info (right side, below date)
    if (condominiumInfo?.phone || condominiumInfo?.email) {
      const contact = [];
      if (condominiumInfo.phone) contact.push(`Tel: ${condominiumInfo.phone}`);
      if (condominiumInfo.email) contact.push(`Email: ${condominiumInfo.email}`);
      
      this.doc.setFontSize(8);
      this.doc.text(contact.join(' | '), this.pageWidth - this.margin, headerStartY + 15, { align: 'right' });
    }

    // Report title - center, prominently placed
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 53, 69);
    this.doc.text(reportTitle, this.pageWidth / 2, headerStartY + 45, { align: 'center' });

    // Update currentY to after header
    this.currentY = headerStartY + 55;
    
    // Professional separator with subtle shadow effect
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.doc.setDrawColor(245, 245, 245);
    this.doc.line(this.margin, this.currentY + 1, this.pageWidth - this.margin, this.currentY + 1);
    
    this.currentY += 15;
  }

  private addHeader(condominiumName: string, reportTitle: string) {
    this.addProfessionalHeader({ name: condominiumName }, reportTitle);
  }

  private addSectionTitle(title: string) {
    this.checkPageSpace(30); // Ensure space for title and some content
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185);
    this.doc.text(title, this.margin, this.currentY);
    this.updateCurrentY(15);
  }

  private addStatisticsCards(data: ReportData) {
    this.checkPageSpace(60); // Ensure space for cards
    
    const cardWidth = (this.pageWidth - this.margin * 2 - 30) / 4;
    const cardHeight = 30;
    let startX = this.margin;

    const cards = [
      { title: 'Moradores', value: data.residents?.toString() || '0', color: [52, 152, 219] },
      { title: 'Visitantes', value: data.visitors?.toString() || '0', color: [46, 204, 113] },
      { title: 'Anúncios', value: data.announcements?.toString() || '0', color: [155, 89, 182] },
      { title: 'Ocupação', value: `${data.occupancy || 0}%`, color: [230, 126, 34] }
    ];

    cards.forEach((card, index) => {
      const x = startX + (cardWidth + 10) * index;
      
      // Card background
      this.doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 3, 3, 'F');
      
      // Card content
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.value, x + cardWidth/2, this.currentY + 12, { align: 'center' });
      
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(card.title, x + cardWidth/2, this.currentY + 22, { align: 'center' });
    });

    this.updateCurrentY(cardHeight + 20);
  }

  private addPaymentStatistics(payments: any) {
    this.addSectionTitle('Estatísticas de Pagamentos');
    this.checkPageSpace(80); // Ensure space for table

    const tableData = [
      ['Status', 'Quantidade', 'Percentual'],
      ['Total', payments.total.toString(), '100%'],
      ['Pagos', payments.paid.toString(), `${Math.round((payments.paid / payments.total) * 100)}%`],
      ['Pendentes', payments.pending.toString(), `${Math.round((payments.pending / payments.total) * 100)}%`],
      ['Em Atraso', payments.overdue.toString(), `${Math.round((payments.overdue / payments.total) * 100)}%`]
    ];

    try {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: this.margin, right: this.margin },
        pageBreak: 'avoid'
      });

      this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 80;
    } catch (error) {
      console.error('Error creating payment statistics table:', error);
      this.updateCurrentY(80);
    }
  }

  private addRemanescenteStatistics(remanescente: any) {
    this.addSectionTitle('Gestão do Remanescente Anual');
    this.checkPageSpace(80);

    const tableData = [
      ['Descrição', 'Valor', 'Percentual do Total'],
      ['Receita do Ano', remanescente.receita_atual.toFixed(2), '100%'],
      ['Despesas do Ano', remanescente.despesas_atual.toFixed(2), `${Math.round((remanescente.despesas_atual / remanescente.receita_atual) * 100)}%`],
      ['Remanescente Anterior', remanescente.remanescente_total.toFixed(2), '-'],
      ['Saldo Total Disponível', remanescente.saldo_disponivel.toFixed(2), 
       remanescente.saldo_disponivel >= 0 ? 'Positivo' : 'Negativo']
    ];

    try {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [76, 175, 80],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { 
          left: this.margin, 
          right: this.margin,
          top: this.margin,
          bottom: this.footerHeight 
        },
        pageBreak: 'auto'
      });

      this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 80;
    } catch (error) {
      console.error('Error creating remanescente table:', error);
      this.updateCurrentY(80);
    }
  }

  private addExpenseSourceStatistics(expenses: any) {
    this.addSectionTitle('Distribuição de Despesas por Fonte');
    this.checkPageSpace(80);

    const tableData = [
      ['Fonte de Pagamento', 'Valor Gasto', 'Percentual'],
      ['Receita Atual', expenses.receita_atual.toFixed(2), `${Math.round((expenses.receita_atual / expenses.total) * 100)}%`],
      ['Remanescente', expenses.remanescente.toFixed(2), `${Math.round((expenses.remanescente / expenses.total) * 100)}%`],
      ['Total', expenses.total.toFixed(2), '100%']
    ];

    try {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [255, 152, 0],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { 
          left: this.margin, 
          right: this.margin,
          top: this.margin,
          bottom: this.footerHeight 
        },
        pageBreak: 'auto'
      });

      this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 80;
    } catch (error) {
      console.error('Error creating expense source table:', error);
      this.updateCurrentY(80);
    }
  }

  private addProfessionalFooter(condominiumInfo?: any) {
    const footerY = this.pageHeight - 40; // Increased footer height
    
    // Footer background
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(0, footerY - 5, this.pageWidth, 40, 'F');
    
    // Top border
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    this.doc.setFontSize(7);
    this.doc.setTextColor(108, 117, 125);
    this.doc.setFont('helvetica', 'normal');
    
    // Left side - System info (organized in left column)
    this.doc.text('T-Casa - Sistema de Gestão', this.margin, footerY + 2);
    this.doc.text('www.tcasa.ao', this.margin, footerY + 10);
    if (condominiumInfo?.address) {
      this.doc.setFontSize(6);
      this.doc.text(`End: ${condominiumInfo.address}`, this.margin, footerY + 18);
    }
    
    // Center - Document validation (organized in center column)
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.text('DOCUMENTO VÁLIDO E AUTÊNTICO', this.pageWidth / 2, footerY + 2, { align: 'center' });
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(6);
    this.doc.text('Gerado automaticamente pelo sistema', this.pageWidth / 2, footerY + 10, { align: 'center' });
    this.doc.text('Não requer assinatura física para validação', this.pageWidth / 2, footerY + 18, { align: 'center' });
    
    // Right side - Page number and timestamp (organized in right column)
    const pageInfo = `Página ${this.doc.getNumberOfPages()}`;
    this.doc.setFontSize(7);
    this.doc.text(pageInfo, this.pageWidth - this.margin, footerY + 2, { align: 'right' });
    
    const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
    this.doc.setFontSize(6);
    this.doc.text(`Emitido: ${timestamp}`, this.pageWidth - this.margin, footerY + 10, { align: 'right' });
    
    this.doc.text('Luanda, Angola', this.pageWidth - this.margin, footerY + 18, { align: 'right' });
  }

  private addFooter() {
    this.addProfessionalFooter();
  }

  generateResidentsReport(data: ReportData): void {
    console.log('=== NOVO FORMATO DE RELATÓRIO DE MORADORES ===');
    this.addProfessionalHeader(data.condominiumInfo, 'Relatório Detalhado de Moradores');

    // Contact information section if available
    if (data.condominiumInfo?.phone || data.condominiumInfo?.email) {
      this.checkPageSpace(30);
      this.doc.setFillColor(240, 248, 255);
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 3, 3, 'F');
      this.doc.setFontSize(10);
      this.doc.setTextColor(73, 80, 87);
      this.doc.setFont('helvetica', 'normal');
      
      let contactText = 'Contato: ';
      if (data.condominiumInfo?.phone) contactText += `Tel: ${data.condominiumInfo.phone}`;
      if (data.condominiumInfo?.email) {
        if (data.condominiumInfo?.phone) contactText += ' | ';
        contactText += `Email: ${data.condominiumInfo.email}`;
      }
      
      this.doc.text(contactText, this.pageWidth / 2, this.currentY + 12, { align: 'center' });
      this.updateCurrentY(35);
    }

    this.addSectionTitle('Resumo Estatístico');
    this.checkPageSpace(50);
    this.doc.setFontSize(11);
    this.doc.setTextColor(33, 37, 41);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Total de moradores cadastrados: ${data.detailedResidents?.length || 0}`, this.margin, this.currentY);
    this.updateCurrentY(8);
    this.doc.text(`Taxa de ocupação estimada: ${data.occupancy || 0}%`, this.margin, this.currentY);
    this.updateCurrentY(8);
    this.doc.text(`Período do relatório: ${data.period || 'Atual'}`, this.margin, this.currentY);
    this.updateCurrentY(8);
    
    const owners = data.detailedResidents?.filter(r => r.is_owner).length || 0;
    const tenants = (data.detailedResidents?.length || 0) - owners;
    this.doc.text(`Proprietários: ${owners} | Inquilinos: ${tenants}`, this.margin, this.currentY);
    this.updateCurrentY(25);

    this.addStatisticsCards(data);

    // NOVA ESTRUTURA DA TABELA DE MORADORES
    if (data.detailedResidents && data.detailedResidents.length > 0) {
      this.addSectionTitle('Lista Completa de Moradores');
      this.checkPageSpace(100);
      
      // NOVAS COLUNAS: Residente, Apartamento, Agregado/Estacionamento, Contacto, Tipo, Data de Entrada
      const tableData = [
        ['Residente', 'Apartamento', 'Agregado/Estacionamento', 'Contacto', 'Tipo', 'Data de Entrada']
      ];
      
      data.detailedResidents.forEach((resident) => {
        const fullName = `${resident.profiles.first_name} ${resident.profiles.last_name}`;
        const type = resident.is_owner ? 'Proprietário' : 'Inquilino';
        const phone = resident.profiles.phone || 'N/A';
        
        // Format agregados and parking spaces
        let agregadoInfo = '';
        const familyMembers = Array.isArray(resident.family_members) ? resident.family_members : [];
        const parkingSpaces = Array.isArray(resident.parking_spaces) ? resident.parking_spaces : [];
        
        const familyCount = familyMembers.length;
        const parkingCount = parkingSpaces.length;
        
        if (familyCount > 0 || parkingCount > 0) {
          const parts = [];
          if (familyCount > 0) parts.push(`${familyCount} membro(s)`);
          if (parkingCount > 0) parts.push(`${parkingCount} lugar(es)`);
          agregadoInfo = parts.join(' | ');
        } else {
          agregadoInfo = 'N/A';
        }
        
        const moveInDate = resident.move_in_date 
          ? format(new Date(resident.move_in_date), 'dd/MM/yyyy')
          : 'N/A';

        // NOVA ORDEM DAS COLUNAS
        tableData.push([
          fullName,              // Residente
          resident.apartment_number, // Apartamento  
          agregadoInfo,          // Agregado/Estacionamento
          phone,                 // Contacto
          type,                  // Tipo
          moveInDate            // Data de Entrada
        ]);
      });

      try {
        autoTable(this.doc, {
          startY: this.currentY,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'striped',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [33, 37, 41]
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          columnStyles: {
            0: { cellWidth: 45 },  // Residente
            1: { cellWidth: 20 },  // Apartamento
            2: { cellWidth: 35 },  // Agregado/Estacionamento
            3: { cellWidth: 25 },  // Contacto
            4: { cellWidth: 25 },  // Tipo
            5: { cellWidth: 20 }   // Data de Entrada
          },
          margin: { 
            left: this.margin, 
            right: this.margin,
            top: this.margin,
            bottom: this.footerHeight 
          },
          pageBreak: 'auto',
          rowPageBreak: 'avoid'
        });

        this.currentY = (this.doc as any).lastAutoTable?.finalY + 15 || this.currentY + 100;
      } catch (error) {
        console.error('Error creating table:', error);
        this.updateCurrentY(100);
      }
    } else {
      this.checkPageSpace(30);
      this.doc.setFontSize(11);
      this.doc.setTextColor(108, 117, 125);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('Nenhum morador cadastrado no período selecionado.', this.margin, this.currentY);
      this.updateCurrentY(20);
    }

    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateFinancialReport(data: ReportData): void {
    this.addProfessionalHeader(data.condominiumInfo, 'Relatório Financeiro Detalhado');

    this.addSectionTitle('Resumo Financeiro');
    this.checkPageSpace(30);
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Período: ${data.period || 'Atual'}`, this.margin, this.currentY);
    this.updateCurrentY(10);
    this.doc.text(`Moeda: ${data.condominiumInfo?.currency || 'AOA'}`, this.margin, this.currentY);
    this.updateCurrentY(20);

    if (data.remanescente) {
      this.addRemanescenteStatistics(data.remanescente);
    }

    if (data.payments) {
      this.addPaymentStatistics(data.payments);
    }

    if (data.expenses) {
      this.addExpenseSourceStatistics(data.expenses);
    }

    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateVisitorsReport(data: ReportData): void {
    this.addProfessionalHeader(data.condominiumInfo, 'Relatório de Controle de Visitantes');

    this.addSectionTitle('Controle de Acesso');
    this.checkPageSpace(30);
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Total de visitantes: ${data.visitors || 0}`, this.margin, this.currentY);
    this.updateCurrentY(10);
    this.doc.text(`Período: ${data.period || 'Atual'}`, this.margin, this.currentY);
    this.updateCurrentY(20);

    this.addStatisticsCards(data);
    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateAnnouncementsReport(data: ReportData): void {
    this.addProfessionalHeader(data.condominiumInfo, 'Relatório de Comunicações e Anúncios');

    this.addSectionTitle('Comunicações');
    this.checkPageSpace(30);
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Total de anúncios: ${data.announcements || 0}`, this.margin, this.currentY);
    this.updateCurrentY(10);
    this.doc.text(`Período: ${data.period || 'Atual'}`, this.margin, this.currentY);
    this.updateCurrentY(20);

    this.addStatisticsCards(data);
    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateReservationsReport(data: ReportData): void {
    this.addProfessionalHeader(data.condominiumInfo, 'Relatório de Reservas de Espaços');

    this.addSectionTitle('Reservas de Espaços');
    this.checkPageSpace(30);
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Total de reservas: ${data.detailedReservations?.length || 0}`, this.margin, this.currentY);
    this.updateCurrentY(10);
    this.doc.text(`Período: ${data.period || 'Atual'}`, this.margin, this.currentY);
    this.updateCurrentY(20);

    this.addStatisticsCards(data);
    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateComprehensiveReport(data: ReportData): void {
    this.addProfessionalHeader(data.condominiumInfo, 'RELATÓRIO COMPLETO DE GESTÃO PREDIAL');

    this.addSectionTitle('Visão Geral');
    this.checkPageSpace(30);
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    this.doc.text(`Período: ${data.period || 'Atual'}`, this.margin, this.currentY);
    this.updateCurrentY(10);
    this.doc.text(`Endereço: ${data.condominiumInfo?.address || 'N/A'}`, this.margin, this.currentY);
    this.updateCurrentY(20);

    this.addStatisticsCards(data);

    if (data.payments) {
      this.addPaymentStatistics(data.payments);
    }

    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateServiceProviderReceipt(data: ReceiptData): void {
    this.addProfessionalHeader(data.condominiumInfo, 'RECIBO DE PAGAMENTO - PRESTADOR DE SERVIÇOS');

    // Receipt number highlight box
    this.checkPageSpace(60);
    this.doc.setFillColor(220, 53, 69);
    this.doc.roundedRect(this.pageWidth - this.margin - 80, this.currentY, 80, 20, 3, 3, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RECIBO Nº', this.pageWidth - this.margin - 40, this.currentY + 8, { align: 'center' });
    this.doc.setFontSize(12);
    this.doc.text(data.receiptNumber, this.pageWidth - this.margin - 40, this.currentY + 16, { align: 'center' });

    this.updateCurrentY(35);

    // Professional info section
    this.addSectionTitle('DADOS DO PRESTADOR DE SERVIÇOS');
    this.checkPageSpace(80);
    
    const prestadorInfo = [
      ['Nome/Razão Social:', data.recipient.name],
      ['NIF:', data.recipient.nif || 'N/A'],
      ['Endereço:', data.recipient.address || 'N/A']
    ];

    try {
      autoTable(this.doc, {
        startY: this.currentY,
        body: prestadorInfo,
        theme: 'grid',
        styles: {
          fontSize: 11,
          cellPadding: { top: 6, bottom: 6, left: 10, right: 10 },
          lineColor: [220, 220, 220],
          lineWidth: 0.5
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [248, 249, 250], 
            cellWidth: 50,
            textColor: [73, 80, 87]
          },
          1: { 
            cellWidth: 120,
            textColor: [33, 37, 41]
          }
        },
        margin: { 
          left: this.margin, 
          right: this.margin,
          top: this.margin,
          bottom: this.footerHeight 
        },
        pageBreak: 'auto'
      });

      this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 60;
    } catch (error) {
      console.error('Error creating service provider info table:', error);
      this.updateCurrentY(60);
    }

    // Amount highlight
    this.checkPageSpace(40);
    this.doc.setFillColor(40, 167, 69);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 5, 5, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `VALOR TOTAL PAGO: ${data.amount.toFixed(2)} ${data.currency}`,
      this.pageWidth / 2, this.currentY + 16, { align: 'center' }
    );

    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateResidentReceipt(data: ReceiptData): void {
    this.addProfessionalHeader(data.condominiumInfo, 'COMPROVATIVO DE PAGAMENTO - RESIDENTE');

    // Receipt number and status
    this.checkPageSpace(60);
    this.doc.setFillColor(40, 167, 69);
    this.doc.roundedRect(this.pageWidth - this.margin - 90, this.currentY, 90, 25, 3, 3, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('COMPROVATIVO Nº', this.pageWidth - this.margin - 45, this.currentY + 8, { align: 'center' });
    this.doc.setFontSize(11);
    this.doc.text(data.receiptNumber, this.pageWidth - this.margin - 45, this.currentY + 18, { align: 'center' });

    this.updateCurrentY(40);

    // Amount highlight with better design
    this.checkPageSpace(40);
    this.doc.setFillColor(13, 110, 253);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 30, 5, 5, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `VALOR PAGO: ${data.amount.toFixed(2)} ${data.currency}`,
      this.pageWidth / 2, this.currentY + 20, { align: 'center' }
    );

    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateServiceAcceptanceReport(data: ReceiptData & { 
    startDate?: string; 
    completionDate?: string; 
    observations?: string 
  }): void {
    this.addProfessionalHeader(data.condominiumInfo, 'TERMO DE ACEITAÇÃO DE SERVIÇO CONCLUÍDO');

    // Document number and status
    this.checkPageSpace(60);
    this.doc.setFillColor(255, 193, 7);
    this.doc.roundedRect(this.pageWidth - this.margin - 90, this.currentY, 90, 25, 3, 3, 'F');
    this.doc.setTextColor(33, 37, 41);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TERMO Nº', this.pageWidth - this.margin - 45, this.currentY + 8, { align: 'center' });
    this.doc.setFontSize(11);
    this.doc.text(data.receiptNumber, this.pageWidth - this.margin - 45, this.currentY + 18, { align: 'center' });

    this.updateCurrentY(40);

    // Professional acceptance confirmation
    this.checkPageSpace(60);
    this.doc.setFillColor(40, 167, 69);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 50, 8, 8, 'F');
    
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      'SERVIÇO ACEITO E APROVADO',
      this.pageWidth / 2, this.currentY + 25, { align: 'center' }
    );

    this.addProfessionalFooter(data.condominiumInfo);
  }

  generateContributionStatusReport(data: {
    title: string;
    year: number;
    condominiumInfo: {
      name: string;
      address: string;
      currency: string;
    };
    summary: {
      totalPaid: number;
      totalDebt: number;
      totalApartments: number;
      occupancyRate: number;
    };
    contributionData: Array<{
      apartment: string;
      floor: string;
      resident: string;
      totalPaid: number;
      totalDebt: number;
      monthlyStatus: Array<{
        month: string;
        status: string;
      }>;
    }>;
    months: string[];
  }): void {
    this.addProfessionalHeader(data.condominiumInfo, `${data.title} - ${data.year}`);

    // Summary cards
    this.checkPageSpace(80);
    const cardWidth = (this.pageWidth - this.margin * 2 - 30) / 4;
    const cardHeight = 30;
    let startX = this.margin;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: data.condominiumInfo.currency,
      }).format(amount);
    };

    const cards = [
      { title: 'Total Pago', value: formatCurrency(data.summary.totalPaid), color: [40, 167, 69] },
      { title: 'Total em Dívida', value: formatCurrency(data.summary.totalDebt), color: [220, 53, 69] },
      { title: 'Total Apartamentos', value: data.summary.totalApartments.toString(), color: [13, 110, 253] },
      { title: 'Taxa Ocupação', value: `${data.summary.occupancyRate}%`, color: [111, 66, 193] }
    ];

    cards.forEach((card, index) => {
      const x = startX + (cardWidth + 10) * index;
      
      // Card background
      this.doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 3, 3, 'F');
      
      // Card content
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.value, x + cardWidth/2, this.currentY + 12, { align: 'center' });
      
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(card.title, x + cardWidth/2, this.currentY + 22, { align: 'center' });
    });

    this.updateCurrentY(cardHeight + 30);

    // Contribution table
    this.addSectionTitle(`Situação por Apartamento - ${data.year}`);
    this.checkPageSpace(100);

    // Prepare table headers
    const headers = ['Apt.', 'Andar', 'Morador', ...data.months, 'Dívida'];
    
    // Prepare table data
    const tableData = data.contributionData.map(resident => {
      console.log(`📊 PDF TABLE ROW - ${resident.apartment}:`, {
        apartment: resident.apartment,
        floor: resident.floor,
        resident: resident.resident,
        totalDebt: resident.totalDebt,
        monthlyStatuses: resident.monthlyStatus.map(ms => `${ms.month}:${ms.status}`).join(', ')
      });

      const row = [
        resident.apartment,
        resident.floor,
        resident.resident,
        ...resident.monthlyStatus.map(status => status.status),
        formatCurrency(resident.totalDebt)
      ];
      
      console.log(`📋 PDF TABLE ROW DATA - ${resident.apartment}:`, row);
      
      return row;
    });

    console.log('📑 PDF TABLE HEADERS:', headers);
    console.log('📑 PDF TABLE DATA COUNT:', tableData.length);

    try {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [headers],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 15 }, // Apt.
          1: { cellWidth: 20 }, // Andar
          2: { cellWidth: 30 }, // Morador
          // Monthly columns (3-14) will auto-size
          15: { cellWidth: 25 } // Dívida
        },
        margin: { 
          left: this.margin, 
          right: this.margin,
          top: this.margin,
          bottom: this.footerHeight 
        },
        pageBreak: 'auto',
        didDrawCell: (data) => {
          // Color code the monthly status cells
          if (data.column.index >= 3 && data.column.index <= 14) {
            const cellValue = data.cell.text[0];
            if (cellValue === 'P') {
              data.cell.styles.fillColor = [212, 237, 218]; // Light green
              data.cell.styles.textColor = [21, 87, 36];
            } else if (cellValue === 'D') {
              data.cell.styles.fillColor = [248, 215, 218]; // Light red
              data.cell.styles.textColor = [114, 28, 36];
            }
          }
        }
      });

      this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 100;
    } catch (error) {
      console.error('Error creating contribution table:', error);
      this.updateCurrentY(100);
    }

    // Legend
    this.checkPageSpace(40);
    this.addSectionTitle('Legenda');
    this.doc.setFontSize(9);
    this.doc.setTextColor(50, 50, 50);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('P = Pago  |  D = Dívida  |  - = Sem dados', this.margin, this.currentY);

    this.addProfessionalFooter(data.condominiumInfo);
  }

  save(filename: string): void {
    this.doc.save(filename);
  }
}
