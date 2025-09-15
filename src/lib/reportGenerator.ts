import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

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
    this.footerHeight = 80; // Increased for QR code footer
  }

  private generateDocumentId(): string {
    return 'TCASA-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  private generateDocumentHash(content: string): string {
    return CryptoJS.SHA256(content).toString().substring(0, 16).toUpperCase();
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  private checkPageSpace(requiredHeight: number): void {
    const availableHeight = this.pageHeight - this.footerHeight - this.currentY;
    if (availableHeight < requiredHeight) {
      this.addNewPage();
    }
  }

  private async addNewPage(): Promise<void> {
    await this.addTCasaFooter();
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private async updateCurrentY(additionalSpace: number = 0): Promise<void> {
    this.currentY += additionalSpace;
    if (this.currentY > this.pageHeight - this.footerHeight - 20) {
      await this.addNewPage();
    }
  }

  private addTCasaHeader(condominiumInfo: any, reportTitle: string, documentId: string) {
    // Header background
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // Main title
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('T-CASA — Relatório', this.pageWidth / 2, 20, { align: 'center' });
    
    // Condominium info
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const condominiumText = `Condomínio: ${condominiumInfo?.name || 'N/A'} · ID: ${documentId}`;
    this.doc.text(condominiumText, this.pageWidth / 2, 35, { align: 'center' });

    // Meta information
    const currentDateTime = new Date().toISOString();
    const systemVersion = '2.5.1';
    this.doc.setFontSize(11);
    this.doc.setTextColor(108, 117, 125);
    const metaText = `Emitido em: ${currentDateTime} · Documento ID: ${documentId} · Versão do Sistema: ${systemVersion}`;
    this.doc.text(metaText, this.pageWidth / 2, 55, { align: 'center' });

    // Report title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(220, 53, 69);
    this.doc.text(reportTitle, this.pageWidth / 2, 75, { align: 'center' });

    this.currentY = 85;
  }

  private async addTCasaFooter(documentId?: string): Promise<void> {
    const footerY = this.pageHeight - 70;
    const docId = documentId || this.generateDocumentId();
    const currentDateTime = new Date().toISOString();
    const systemVersion = '2.5.1';
    
    // Generate content for hash
    const contentForHash = `${docId}-${currentDateTime}-${systemVersion}`;
    const documentHash = this.generateDocumentHash(contentForHash);
    
    // Verification URL
    const verificationUrl = `https://tcasa.ao/verify?doc=${docId}`;
    
    // Generate QR Code
    const qrCodeDataUrl = await this.generateQRCode(verificationUrl);

    // Footer text
    this.doc.setFontSize(10);
    this.doc.setTextColor(108, 117, 125);
    this.doc.setFont('helvetica', 'normal');
    
    const footerLine1 = `Documento gerado automaticamente por T-Casa ${systemVersion} · Documento ID: ${docId}`;
    const footerLine2 = `Hash SHA256: ${documentHash} · Verifique autenticidade em: ${verificationUrl}`;
    
    this.doc.text(footerLine1, this.pageWidth / 2, footerY + 10, { align: 'center' });
    this.doc.text(footerLine2, this.pageWidth / 2, footerY + 20, { align: 'center' });

    // Add QR Code if generated successfully
    if (qrCodeDataUrl) {
      try {
        const qrX = (this.pageWidth - 25) / 2;
        const qrY = footerY + 25;
        this.doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, 25, 25);
      } catch (error) {
        console.error('Error adding QR code to PDF:', error);
      }
    }
  }

  private addSectionTitle(title: string) {
    this.checkPageSpace(30);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185);
    this.doc.text(title, this.margin, this.currentY);
    this.updateCurrentY(15);
  }

  private addStatisticsCards(data: ReportData) {
    this.checkPageSpace(60);
    
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
      
      this.doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 3, 3, 'F');
      
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

  async generateResidentsReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'Relatório de Moradores', documentId);

    // Statistics section
    this.addSectionTitle('Resumo Estatístico');
    this.checkPageSpace(50);
    this.doc.setFontSize(12);
    this.doc.setTextColor(33, 37, 41);
    this.doc.setFont('helvetica', 'normal');
    
    const stats = [
      `Total de moradores cadastrados: ${data.detailedResidents?.length || 0}`,
      `Taxa de ocupação estimada: ${data.occupancy || 0}%`,
      `Período do relatório: ${data.period || 'Atual'}`
    ];

    stats.forEach((stat, index) => {
      this.doc.text(stat, this.margin, this.currentY + (index * 8));
    });
    this.updateCurrentY(30);

    // Statistics cards
    this.addStatisticsCards(data);

    // Lista Completa de Moradores
    if (data.detailedResidents && data.detailedResidents.length > 0) {
      this.addSectionTitle('Lista Completa de Moradores');
      this.checkPageSpace(100);
      
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

        tableData.push([
          fullName,
          resident.apartment_number,
          agregadoInfo,
          phone,
          type,
          moveInDate
        ]);
      });

      try {
        autoTable(this.doc, {
          startY: this.currentY,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'striped',
          headStyles: {
            fillColor: [244, 244, 244],
            textColor: [0, 0, 0],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 11,
            textColor: [0, 0, 0]
          },
          columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 }
          },
          margin: { 
            left: this.margin, 
            right: this.margin,
            top: this.margin,
            bottom: this.footerHeight 
          },
          pageBreak: 'auto'
        });

        this.currentY = (this.doc as any).lastAutoTable?.finalY + 15 || this.currentY + 100;
      } catch (error) {
        console.error('Error creating table:', error);
        this.updateCurrentY(100);
      }
    }

    await this.addTCasaFooter(documentId);
  }

  async generateFinancialReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'Relatório Financeiro', documentId);

    this.addSectionTitle('Resumo Financeiro');
    this.checkPageSpace(30);
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    const financialStats = [
      `Período: ${data.period || 'Atual'}`,
      `Moeda: ${data.condominiumInfo?.currency || 'AOA'}`
    ];

    financialStats.forEach((stat, index) => {
      this.doc.text(stat, this.margin, this.currentY + (index * 10));
    });
    this.updateCurrentY(30);

    this.addStatisticsCards(data);

    if (data.remanescente) {
      this.addSectionTitle('Gestão do Remanescente');
      this.checkPageSpace(80);

      const tableData = [
        ['Descrição', 'Valor'],
        ['Receita do Ano', data.remanescente.receita_atual.toFixed(2)],
        ['Despesas do Ano', data.remanescente.despesas_atual.toFixed(2)],
        ['Remanescente Total', data.remanescente.remanescente_total.toFixed(2)],
        ['Saldo Disponível', data.remanescente.saldo_disponivel.toFixed(2)]
      ];

      try {
        autoTable(this.doc, {
          startY: this.currentY,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'grid',
          headStyles: {
            fillColor: [244, 244, 244],
            textColor: [0, 0, 0],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 11,
            textColor: [0, 0, 0]
          },
          margin: { left: this.margin, right: this.margin },
          pageBreak: 'auto'
        });

        this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 80;
      } catch (error) {
        console.error('Error creating financial table:', error);
        this.updateCurrentY(80);
      }
    }

    await this.addTCasaFooter(documentId);
  }

  async generateVisitorsReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'Relatório de Visitantes', documentId);

    this.addSectionTitle('Controle de Acesso');
    this.checkPageSpace(30);
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    const visitorStats = [
      `Total de visitantes: ${data.visitors || 0}`,
      `Período: ${data.period || 'Atual'}`
    ];

    visitorStats.forEach((stat, index) => {
      this.doc.text(stat, this.margin, this.currentY + (index * 10));
    });
    this.updateCurrentY(30);

    this.addStatisticsCards(data);

    if (data.detailedVisitors && data.detailedVisitors.length > 0) {
      this.addSectionTitle('Lista de Visitantes');
      this.checkPageSpace(100);
      
      const tableData = [
        ['Nome', 'Apartamento', 'Data/Hora', 'Finalidade', 'Status']
      ];
      
      data.detailedVisitors.forEach((visitor) => {
        const residentApt = visitor.residents.apartment_number;
        const visitDateTime = `${format(new Date(visitor.visit_date), 'dd/MM/yyyy')} ${visitor.visit_time || ''}`;
        const status = visitor.approved ? 'Aprovado' : 'Pendente';
        
        tableData.push([
          visitor.name,
          residentApt,
          visitDateTime,
          visitor.purpose || 'N/A',
          status
        ]);
      });

      try {
        autoTable(this.doc, {
          startY: this.currentY,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'striped',
          headStyles: {
            fillColor: [244, 244, 244],
            textColor: [0, 0, 0],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 11,
            textColor: [0, 0, 0]
          },
          margin: { left: this.margin, right: this.margin },
          pageBreak: 'auto'
        });

        this.currentY = (this.doc as any).lastAutoTable?.finalY + 15 || this.currentY + 100;
      } catch (error) {
        console.error('Error creating visitors table:', error);
        this.updateCurrentY(100);
      }
    }

    await this.addTCasaFooter(documentId);
  }

  async generateAnnouncementsReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'Relatório de Anúncios', documentId);

    this.addSectionTitle('Comunicações');
    this.checkPageSpace(30);
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    const announcementStats = [
      `Total de anúncios: ${data.announcements || 0}`,
      `Período: ${data.period || 'Atual'}`
    ];

    announcementStats.forEach((stat, index) => {
      this.doc.text(stat, this.margin, this.currentY + (index * 10));
    });
    this.updateCurrentY(30);

    this.addStatisticsCards(data);

    if (data.detailedAnnouncements && data.detailedAnnouncements.length > 0) {
      this.addSectionTitle('Lista de Anúncios');
      this.checkPageSpace(100);
      
      const tableData = [
        ['Título', 'Data', 'Status', 'Urgente', 'Autor']
      ];
      
      data.detailedAnnouncements.forEach((announcement) => {
        const author = `${announcement.profiles.first_name} ${announcement.profiles.last_name}`;
        const createdDate = format(new Date(announcement.created_at), 'dd/MM/yyyy');
        const status = announcement.published ? 'Publicado' : 'Rascunho';
        const urgent = announcement.is_urgent ? 'Sim' : 'Não';
        
        tableData.push([
          announcement.title,
          createdDate,
          status,
          urgent,
          author
        ]);
      });

      try {
        autoTable(this.doc, {
          startY: this.currentY,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'striped',
          headStyles: {
            fillColor: [244, 244, 244],
            textColor: [0, 0, 0],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 11,
            textColor: [0, 0, 0]
          },
          margin: { left: this.margin, right: this.margin },
          pageBreak: 'auto'
        });

        this.currentY = (this.doc as any).lastAutoTable?.finalY + 15 || this.currentY + 100;
      } catch (error) {
        console.error('Error creating announcements table:', error);
        this.updateCurrentY(100);
      }
    }

    await this.addTCasaFooter(documentId);
  }

  async generateReservationsReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'Relatório de Reservas', documentId);

    this.addSectionTitle('Reservas de Espaços');
    this.checkPageSpace(30);
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    const reservationStats = [
      `Total de reservas: ${data.detailedReservations?.length || 0}`,
      `Período: ${data.period || 'Atual'}`
    ];

    reservationStats.forEach((stat, index) => {
      this.doc.text(stat, this.margin, this.currentY + (index * 10));
    });
    this.updateCurrentY(30);

    this.addStatisticsCards(data);

    if (data.detailedReservations && data.detailedReservations.length > 0) {
      this.addSectionTitle('Lista de Reservas');
      this.checkPageSpace(100);
      
      const tableData = [
        ['Espaço', 'Apartamento', 'Data', 'Horário', 'Status']
      ];
      
      data.detailedReservations.forEach((reservation) => {
        const residentApt = reservation.residents.apartment_number;
        const reservationDate = format(new Date(reservation.reservation_date), 'dd/MM/yyyy');
        const timeSlot = `${reservation.start_time} - ${reservation.end_time}`;
        const status = reservation.approved ? 'Aprovado' : 'Pendente';
        
        tableData.push([
          reservation.space_name,
          residentApt,
          reservationDate,
          timeSlot,
          status
        ]);
      });

      try {
        autoTable(this.doc, {
          startY: this.currentY,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'striped',
          headStyles: {
            fillColor: [244, 244, 244],
            textColor: [0, 0, 0],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 11,
            textColor: [0, 0, 0]
          },
          margin: { left: this.margin, right: this.margin },
          pageBreak: 'auto'
        });

        this.currentY = (this.doc as any).lastAutoTable?.finalY + 15 || this.currentY + 100;
      } catch (error) {
        console.error('Error creating reservations table:', error);
        this.updateCurrentY(100);
      }
    }

    await this.addTCasaFooter(documentId);
  }

  async generateComprehensiveReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'RELATÓRIO COMPLETO', documentId);

    this.addSectionTitle('Visão Geral');
    this.checkPageSpace(30);
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    const comprehensiveStats = [
      `Período: ${data.period || 'Atual'}`,
      `Endereço: ${data.condominiumInfo?.address || 'N/A'}`
    ];

    comprehensiveStats.forEach((stat, index) => {
      this.doc.text(stat, this.margin, this.currentY + (index * 10));
    });
    this.updateCurrentY(30);

    this.addStatisticsCards(data);

    // Add all sections for comprehensive report
    if (data.payments) {
      this.addSectionTitle('Estatísticas de Pagamentos');
      this.checkPageSpace(80);

      const paymentTableData = [
        ['Status', 'Quantidade', 'Percentual'],
        ['Total', data.payments.total.toString(), '100%'],
        ['Pagos', data.payments.paid.toString(), `${Math.round((data.payments.paid / data.payments.total) * 100)}%`],
        ['Pendentes', data.payments.pending.toString(), `${Math.round((data.payments.pending / data.payments.total) * 100)}%`],
        ['Em Atraso', data.payments.overdue.toString(), `${Math.round((data.payments.overdue / data.payments.total) * 100)}%`]
      ];

      try {
        autoTable(this.doc, {
          startY: this.currentY,
          head: [paymentTableData[0]],
          body: paymentTableData.slice(1),
          theme: 'grid',
          headStyles: {
            fillColor: [244, 244, 244],
            textColor: [0, 0, 0],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 11,
            textColor: [0, 0, 0]
          },
          margin: { left: this.margin, right: this.margin },
          pageBreak: 'auto'
        });

        this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 80;
      } catch (error) {
        console.error('Error creating payment statistics table:', error);
        this.updateCurrentY(80);
      }
    }

    await this.addTCasaFooter(documentId);
  }

  async generateServiceProviderReceipt(data: ReceiptData): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'RECIBO DE PAGAMENTO - PRESTADOR DE SERVIÇOS', documentId);

    // Receipt details in table format
    this.addSectionTitle('DADOS DO PRESTADOR DE SERVIÇOS');
    this.checkPageSpace(80);
    
    const prestadorInfo = [
      ['Nome/Razão Social:', data.recipient.name],
      ['NIF:', data.recipient.nif || 'N/A'],
      ['Endereço:', data.recipient.address || 'N/A'],
      ['Valor Total:', `${data.amount.toFixed(2)} ${data.currency}`]
    ];

    try {
      autoTable(this.doc, {
        startY: this.currentY,
        body: prestadorInfo,
        theme: 'grid',
        styles: {
          fontSize: 12,
          cellPadding: { top: 6, bottom: 6, left: 10, right: 10 }
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [244, 244, 244], 
            cellWidth: 50
          },
          1: { 
            cellWidth: 120
          }
        },
        margin: { left: this.margin, right: this.margin },
        pageBreak: 'auto'
      });

      this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 60;
    } catch (error) {
      console.error('Error creating service provider table:', error);
      this.updateCurrentY(60);
    }

    await this.addTCasaFooter(documentId);
  }

  async generateResidentReceipt(data: ReceiptData): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'COMPROVATIVO DE PAGAMENTO - RESIDENTE', documentId);

    // Receipt details
    this.addSectionTitle('DETALHES DO PAGAMENTO');
    this.checkPageSpace(80);
    
    const residentInfo = [
      ['Residente:', data.recipient.name],
      ['Apartamento:', data.recipient.apartment || 'N/A'],
      ['Descrição:', data.description],
      ['Valor Pago:', `${data.amount.toFixed(2)} ${data.currency}`],
      ['Data de Pagamento:', data.paymentDate || data.date]
    ];

    try {
      autoTable(this.doc, {
        startY: this.currentY,
        body: residentInfo,
        theme: 'grid',
        styles: {
          fontSize: 12,
          cellPadding: { top: 6, bottom: 6, left: 10, right: 10 }
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [244, 244, 244], 
            cellWidth: 50
          },
          1: { 
            cellWidth: 120
          }
        },
        margin: { left: this.margin, right: this.margin },
        pageBreak: 'auto'
      });

      this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 80;
    } catch (error) {
      console.error('Error creating resident receipt table:', error);
      this.updateCurrentY(80);
    }

    await this.addTCasaFooter(documentId);
  }

  async generateServiceAcceptanceReport(data: ReceiptData & { 
    startDate?: string; 
    completionDate?: string; 
    observations?: string 
  }): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, 'TERMO DE ACEITAÇÃO DE SERVIÇO CONCLUÍDO', documentId);

    // Service acceptance details
    this.addSectionTitle('DADOS DO SERVIÇO');
    this.checkPageSpace(80);
    
    const serviceInfo = [
      ['Prestador:', data.recipient.name],
      ['Descrição:', data.description],
      ['Data de Início:', data.startDate || 'N/A'],
      ['Data de Conclusão:', data.completionDate || 'N/A'],
      ['Valor Total:', `${data.amount.toFixed(2)} ${data.currency}`],
      ['Observações:', data.observations || 'Serviço aceito e aprovado']
    ];

    try {
      autoTable(this.doc, {
        startY: this.currentY,
        body: serviceInfo,
        theme: 'grid',
        styles: {
          fontSize: 12,
          cellPadding: { top: 6, bottom: 6, left: 10, right: 10 }
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [244, 244, 244], 
            cellWidth: 50
          },
          1: { 
            cellWidth: 120
          }
        },
        margin: { left: this.margin, right: this.margin },
        pageBreak: 'auto'
      });

      this.currentY = (this.doc as any).lastAutoTable?.finalY + 20 || this.currentY + 80;
    } catch (error) {
      console.error('Error creating service acceptance table:', error);
      this.updateCurrentY(80);
    }

    await this.addTCasaFooter(documentId);
  }

  async generateContributionStatusReport(data: {
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
  }): Promise<void> {
    const documentId = this.generateDocumentId();
    this.addTCasaHeader(data.condominiumInfo, `${data.title} - ${data.year}`, documentId);

    // Summary statistics
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
      
      this.doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.doc.roundedRect(x, this.currentY, cardWidth, cardHeight, 3, 3, 'F');
      
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(card.title, x + cardWidth/2, this.currentY + 12, { align: 'center' });
      this.doc.text(card.value, x + cardWidth/2, this.currentY + 22, { align: 'center' });
    });

    this.updateCurrentY(cardHeight + 30);

    // Detailed contribution table
    if (data.contributionData && data.contributionData.length > 0) {
      this.addSectionTitle('Detalhamento por Apartamento');
      this.checkPageSpace(100);
      
      const headers = ['Apt.', 'Residente', 'Total Pago', 'Em Dívida', ...data.months];
      const tableData = [headers];
      
      data.contributionData.forEach((item) => {
        const row = [
          item.apartment,
          item.resident,
          formatCurrency(item.totalPaid),
          formatCurrency(item.totalDebt),
          ...item.monthlyStatus.map(m => {
            switch(m.status) {
              case 'paid': return 'P';
              case 'pending': return 'Pe';
              case 'overdue': return 'A';
              default: return '-';
            }
          })
        ];
        tableData.push(row);
      });

      try {
        autoTable(this.doc, {
          startY: this.currentY,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'grid',
          headStyles: {
            fillColor: [244, 244, 244],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0]
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 }
          },
          margin: { left: this.margin, right: this.margin },
          pageBreak: 'auto'
        });

        this.currentY = (this.doc as any).lastAutoTable?.finalY + 15 || this.currentY + 100;
      } catch (error) {
        console.error('Error creating contribution table:', error);
        this.updateCurrentY(100);
      }
    }

    await this.addTCasaFooter(documentId);
  }

  save(filename: string): void {
    this.doc.save(filename);
  }
}