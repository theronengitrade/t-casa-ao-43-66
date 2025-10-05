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

  constructor() {
    this.doc = new jsPDF();
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

  private async generateTCasaHTMLTemplate(
    reportTitle: string,
    condominiumInfo: any,
    documentId: string,
    content: string
  ): Promise<{ html: string; footer: { docId: string; hash: string; verificationUrl: string; version: string; qr: string; issuedAt: string } }> {
    const currentDateTime = new Date().toISOString();
    const systemVersion = '2.5.1';
    
    // Generate content for hash
    const contentForHash = `${documentId}-${currentDateTime}-${systemVersion}-${content}`;
    const documentHash = this.generateDocumentHash(contentForHash);
    
    // Verification URL
    const verificationUrl = `https://tcasa.ao/verify?doc=${documentId}`;
    
    // Generate QR Code
    const qrCodeBase64 = await this.generateQRCode(verificationUrl);

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Relatório - T-Casa</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; font-size: 12px; }
        header { text-align: center; margin-bottom: 20px; }
        header h1 { margin: 0; font-size: 20px; }
        .meta { text-align: center; font-size: 11px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: center; font-size: 11px; }
        th { background: #f4f4f4; }
        footer { font-size: 10px; text-align: center; margin-top: 40px; }
        .stats { margin-bottom: 20px; font-size: 12px; }
        .stats p { margin: 2px 0; }
        .qr img { margin-top: 10px; width: 100px; height: 100px; }
        .section-title { font-size: 14px; font-weight: bold; color: #2980b9; margin: 20px 0 10px 0; }
    </style>
</head>
<body>
    <header>
        <h1>T-CASA — Relatório</h1>
        <p>Condomínio: ${condominiumInfo?.name || 'N/A'} · ID: ${documentId}</p>
        <h2 style="color: #dc3545; margin: 10px 0;">${reportTitle}</h2>
    </header>
    <div class="meta">
        Emitido em: ${currentDateTime} · Documento ID: ${documentId} · Versão do Sistema: ${systemVersion}
    </div>

    ${content}

    <footer>
        Documento gerado automaticamente por T-Casa ${systemVersion} · Documento ID: ${documentId}<br>
        Hash SHA256: ${documentHash} · Verifique autenticidade em: ${verificationUrl}
        <div class="qr">
            <img src="${qrCodeBase64}" alt="QR Code de Verificação">
        </div>
    </footer>
</body>
</html>`;

    return {
      html,
      footer: {
        docId: documentId,
        hash: documentHash,
        verificationUrl,
        version: systemVersion,
        qr: qrCodeBase64,
        issuedAt: currentDateTime,
      }
    };
  }

  private htmlToJsPDF(html: string, footer: { docId: string; hash: string; verificationUrl: string; version: string; qr: string; issuedAt: string }): void {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Reset PDF
    this.doc = new jsPDF();
    
    let yPosition = 20;
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    const margin = 20;
    
    // Header
    const headerH1 = doc.querySelector('header h1')?.textContent || '';
    const headerP = doc.querySelector('header p')?.textContent || '';
    const headerH2 = doc.querySelector('header h2')?.textContent || '';
    const metaDiv = doc.querySelector('.meta')?.textContent || '';
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(headerH1, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(headerP, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    if (headerH2) {
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(220, 53, 69);
      this.doc.text(headerH2, pageWidth / 2, yPosition, { align: 'center' });
      this.doc.setTextColor(0, 0, 0);
      yPosition += 12;
    }
    
    this.doc.setFontSize(11);
    this.doc.setTextColor(108, 117, 125);
    this.doc.text(metaDiv, pageWidth / 2, yPosition, { align: 'center' });
    this.doc.setTextColor(0,0,0);
    yPosition += 20;
    
    // Sections: in document order
    const sections = doc.querySelectorAll('.section-title, .stats, table');
    sections.forEach((section) => {
      // Leave space for footer
      if (yPosition > pageHeight - 80) {
        this.doc.addPage();
        yPosition = 20;
      }
      
      if (section.classList.contains('section-title')) {
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(41, 128, 185);
        this.doc.text(section.textContent || '', margin, yPosition);
        this.doc.setTextColor(0,0,0);
        yPosition += 10;
      } else if (section.classList.contains('stats')) {
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'normal');
        const stats = Array.from(section.querySelectorAll('p')).map(p => p.textContent?.trim() || '').filter(Boolean);
        stats.forEach((stat) => {
          if (yPosition > pageHeight - 80) {
            this.doc.addPage();
            yPosition = 20;
          }
          this.doc.text(stat, margin, yPosition);
          yPosition += 7;
        });
        yPosition += 6;
      } else if (section.tagName.toLowerCase() === 'table') {
        // Build head and body for autoTable
        const headRow = Array.from(section.querySelectorAll('thead th')).map(th => th.textContent || '');
        const bodyRows = Array.from(section.querySelectorAll('tbody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent || ''));
        
        autoTable(this.doc, {
          startY: yPosition,
          head: headRow.length ? [headRow] : undefined,
          body: bodyRows,
          theme: 'grid',
          headStyles: { 
            fillColor: [244,244,244], 
            textColor: [0,0,0], 
            fontSize: 10, 
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            cellPadding: 3,
            minCellHeight: 8
          },
          bodyStyles: { 
            fontSize: 9, 
            textColor: [0,0,0],
            halign: 'center',
            valign: 'middle',
            cellPadding: 3,
            minCellHeight: 8,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 'auto' }
          },
          margin: { left: margin, right: margin, top: 20, bottom: 80 },
          pageBreak: 'auto',
          tableWidth: 'auto',
          styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            minCellWidth: 15,
            fontSize: 9
          }
        });
        // Update yPosition
        // @ts-ignore
        yPosition = (this.doc as any).lastAutoTable?.finalY ? (this.doc as any).lastAutoTable.finalY + 10 : yPosition + 60;
      }
    });
    
    // Footer on last page with QR image
    const footerBoxTop = pageHeight - 60;
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(0, footerBoxTop, pageWidth, 60, 'F');
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.5);
    this.doc.line(0, footerBoxTop, pageWidth, footerBoxTop);

    this.doc.setFontSize(8);
    this.doc.setTextColor(108, 117, 125);
    const line1 = `Documento gerado automaticamente por T-Casa ${footer.version} · Documento ID: ${footer.docId}`;
    const line2 = `Hash SHA256: ${footer.hash}`;
    const line3 = `Verifique autenticidade em: ${footer.verificationUrl}`;
    this.doc.text(line1, pageWidth / 2, footerBoxTop + 10, { align: 'center' });
    this.doc.text(line2, pageWidth / 2, footerBoxTop + 18, { align: 'center' });
    this.doc.text(line3, pageWidth / 2, footerBoxTop + 26, { align: 'center' });

    try {
      const qrSize = 22;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = footerBoxTop + 30;
      this.doc.addImage(footer.qr, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (e) {
      console.error('Erro ao adicionar QR no rodapé:', e);
    }
  }

  async generateResidentsReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    
    let statsContent = '';
    if (data.detailedResidents) {
      statsContent = `
        <div class="stats">
          <p>Total de moradores cadastrados: ${data.detailedResidents.length}</p>
          <p>Taxa de ocupação estimada: ${data.occupancy || 0}%</p>
          <p>Período do relatório: ${data.period || 'Atual'}</p>
        </div>
      `;
    }

    let tableContent = '';
    if (data.detailedResidents && data.detailedResidents.length > 0) {
      tableContent = `
        <div class="section-title">Lista Completa de Moradores</div>
        <table>
          <thead>
            <tr>
              <th>Residente</th>
              <th>Apartamento</th>
              <th>Agregados/Estacionamento</th>
              <th>Contacto</th>
              <th>Tipo</th>
              <th>Data de Entrada</th>
            </tr>
          </thead>
          <tbody>
            ${data.detailedResidents.map(resident => {
              const fullName = `${resident.profiles.first_name} ${resident.profiles.last_name}`;
              const type = resident.is_owner ? 'Proprietário' : 'Inquilino';
              const phone = resident.profiles.phone || 'N/A';
              
              const familyMembers = Array.isArray(resident.family_members) ? resident.family_members : [];
              const parkingSpaces = Array.isArray(resident.parking_spaces) ? resident.parking_spaces : [];
              
              let agregadoInfo = '';
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

              return `
                <tr>
                  <td>${fullName}</td>
                  <td>${resident.apartment_number}</td>
                  <td>${agregadoInfo}</td>
                  <td>${phone}</td>
                  <td>${type}</td>
                  <td>${moveInDate}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    const content = `
      <div class="section-title">Resumo Estatístico</div>
      ${statsContent}
      ${tableContent}
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'Relatório de Moradores',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  async generateFinancialReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    
    let statsContent = `
      <div class="stats">
        <p>Período: ${data.period || 'Atual'}</p>
        <p>Moeda: ${data.condominiumInfo?.currency || 'AOA'}</p>
      </div>
    `;

    let tableContent = '';
    if (data.remanescente) {
      tableContent = `
        <div class="section-title">Gestão do Remanescente</div>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Receita do Ano</td><td>${data.remanescente.receita_atual.toFixed(2)}</td></tr>
            <tr><td>Despesas do Ano</td><td>${data.remanescente.despesas_atual.toFixed(2)}</td></tr>
            <tr><td>Remanescente Total</td><td>${data.remanescente.remanescente_total.toFixed(2)}</td></tr>
            <tr><td>Saldo Disponível</td><td>${data.remanescente.saldo_disponivel.toFixed(2)}</td></tr>
          </tbody>
        </table>
      `;
    }

    const content = `
      <div class="section-title">Resumo Financeiro</div>
      ${statsContent}
      ${tableContent}
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'Relatório Financeiro',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  async generateVisitorsReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    
    let statsContent = `
      <div class="stats">
        <p>Total de visitantes: ${data.visitors || 0}</p>
        <p>Período: ${data.period || 'Atual'}</p>
      </div>
    `;

    let tableContent = '';
    if (data.detailedVisitors && data.detailedVisitors.length > 0) {
      tableContent = `
        <div class="section-title">Lista de Visitantes</div>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Apartamento</th>
              <th>Data/Hora</th>
              <th>Finalidade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.detailedVisitors.map(visitor => {
              const residentApt = visitor.residents.apartment_number;
              const visitDateTime = `${format(new Date(visitor.visit_date), 'dd/MM/yyyy')} ${visitor.visit_time || ''}`;
              const status = visitor.approved ? 'Aprovado' : 'Pendente';
              
              return `
                <tr>
                  <td>${visitor.name}</td>
                  <td>${residentApt}</td>
                  <td>${visitDateTime}</td>
                  <td>${visitor.purpose || 'N/A'}</td>
                  <td>${status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    const content = `
      <div class="section-title">Controle de Acesso</div>
      ${statsContent}
      ${tableContent}
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'Relatório de Visitantes',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  async generateAnnouncementsReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    
    let statsContent = `
      <div class="stats">
        <p>Total de anúncios: ${data.announcements || 0}</p>
        <p>Período: ${data.period || 'Atual'}</p>
      </div>
    `;

    let tableContent = '';
    if (data.detailedAnnouncements && data.detailedAnnouncements.length > 0) {
      tableContent = `
        <div class="section-title">Lista de Anúncios</div>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Data</th>
              <th>Status</th>
              <th>Urgente</th>
              <th>Autor</th>
            </tr>
          </thead>
          <tbody>
            ${data.detailedAnnouncements.map(announcement => {
              const author = `${announcement.profiles.first_name} ${announcement.profiles.last_name}`;
              const createdDate = format(new Date(announcement.created_at), 'dd/MM/yyyy');
              const status = announcement.published ? 'Publicado' : 'Rascunho';
              const urgent = announcement.is_urgent ? 'Sim' : 'Não';
              
              return `
                <tr>
                  <td>${announcement.title}</td>
                  <td>${createdDate}</td>
                  <td>${status}</td>
                  <td>${urgent}</td>
                  <td>${author}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    const content = `
      <div class="section-title">Comunicações</div>
      ${statsContent}
      ${tableContent}
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'Relatório de Anúncios',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  async generateReservationsReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    
    let statsContent = `
      <div class="stats">
        <p>Total de reservas: ${data.detailedReservations?.length || 0}</p>
        <p>Período: ${data.period || 'Atual'}</p>
      </div>
    `;

    let tableContent = '';
    if (data.detailedReservations && data.detailedReservations.length > 0) {
      tableContent = `
        <div class="section-title">Lista de Reservas</div>
        <table>
          <thead>
            <tr>
              <th>Espaço</th>
              <th>Apartamento</th>
              <th>Data</th>
              <th>Horário</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.detailedReservations.map(reservation => {
              const residentApt = reservation.residents.apartment_number;
              const reservationDate = format(new Date(reservation.reservation_date), 'dd/MM/yyyy');
              const timeSlot = `${reservation.start_time} - ${reservation.end_time}`;
              const status = reservation.approved ? 'Aprovado' : 'Pendente';
              
              return `
                <tr>
                  <td>${reservation.space_name}</td>
                  <td>${residentApt}</td>
                  <td>${reservationDate}</td>
                  <td>${timeSlot}</td>
                  <td>${status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    const content = `
      <div class="section-title">Reservas de Espaços</div>
      ${statsContent}
      ${tableContent}
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'Relatório de Reservas',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  async generateComprehensiveReport(data: ReportData): Promise<void> {
    const documentId = this.generateDocumentId();
    
    let statsContent = `
      <div class="stats">
        <p>Período: ${data.period || 'Atual'}</p>
        <p>Endereço: ${data.condominiumInfo?.address || 'N/A'}</p>
      </div>
    `;

    let paymentsContent = '';
    if (data.payments) {
      paymentsContent = `
        <div class="section-title">Estatísticas de Pagamentos</div>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Quantidade</th>
              <th>Percentual</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total</td><td>${data.payments.total}</td><td>100%</td></tr>
            <tr><td>Pagos</td><td>${data.payments.paid}</td><td>${Math.round((data.payments.paid / data.payments.total) * 100)}%</td></tr>
            <tr><td>Pendentes</td><td>${data.payments.pending}</td><td>${Math.round((data.payments.pending / data.payments.total) * 100)}%</td></tr>
            <tr><td>Em Atraso</td><td>${data.payments.overdue}</td><td>${Math.round((data.payments.overdue / data.payments.total) * 100)}%</td></tr>
          </tbody>
        </table>
      `;
    }

    const content = `
      <div class="section-title">Visão Geral</div>
      ${statsContent}
      ${paymentsContent}
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'RELATÓRIO COMPLETO',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  async generateServiceProviderReceipt(data: ReceiptData): Promise<void> {
    const documentId = this.generateDocumentId();
    
    const content = `
      <div class="section-title">DADOS DO PRESTADOR DE SERVIÇOS</div>
      <table>
        <tbody>
          <tr><td><strong>Nome/Razão Social:</strong></td><td>${data.recipient.name}</td></tr>
          <tr><td><strong>NIF:</strong></td><td>${data.recipient.nif || 'N/A'}</td></tr>
          <tr><td><strong>Endereço:</strong></td><td>${data.recipient.address || 'N/A'}</td></tr>
          <tr><td><strong>Valor Total:</strong></td><td>${data.amount.toFixed(2)} ${data.currency}</td></tr>
        </tbody>
      </table>
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'RECIBO DE PAGAMENTO - PRESTADOR DE SERVIÇOS',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  async generateResidentReceipt(data: ReceiptData): Promise<void> {
    const documentId = this.generateDocumentId();
    
    const content = `
      <div class="section-title">DETALHES DO PAGAMENTO</div>
      <table>
        <tbody>
          <tr><td><strong>Residente:</strong></td><td>${data.recipient.name}</td></tr>
          <tr><td><strong>Apartamento:</strong></td><td>${data.recipient.apartment || 'N/A'}</td></tr>
          <tr><td><strong>Descrição:</strong></td><td>${data.description}</td></tr>
          <tr><td><strong>Valor Pago:</strong></td><td>${data.amount.toFixed(2)} ${data.currency}</td></tr>
          <tr><td><strong>Data de Pagamento:</strong></td><td>${data.paymentDate || data.date}</td></tr>
        </tbody>
      </table>
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'COMPROVATIVO DE PAGAMENTO - RESIDENTE',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  async generateServiceAcceptanceReport(data: ReceiptData & { 
    startDate?: string; 
    completionDate?: string; 
    observations?: string 
  }): Promise<void> {
    const documentId = this.generateDocumentId();
    
    const content = `
      <div class="section-title">DADOS DO SERVIÇO</div>
      <table>
        <tbody>
          <tr><td><strong>Prestador:</strong></td><td>${data.recipient.name}</td></tr>
          <tr><td><strong>Descrição:</strong></td><td>${data.description}</td></tr>
          <tr><td><strong>Data de Início:</strong></td><td>${data.startDate || 'N/A'}</td></tr>
          <tr><td><strong>Data de Conclusão:</strong></td><td>${data.completionDate || 'N/A'}</td></tr>
          <tr><td><strong>Valor Total:</strong></td><td>${data.amount.toFixed(2)} ${data.currency}</td></tr>
          <tr><td><strong>Observações:</strong></td><td>${data.observations || 'Serviço aceito e aprovado'}</td></tr>
        </tbody>
      </table>
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      'TERMO DE ACEITAÇÃO DE SERVIÇO CONCLUÍDO',
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
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
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: data.condominiumInfo.currency,
      }).format(amount);
    };

    let summaryContent = `
      <div class="stats">
        <p>Total Pago: ${formatCurrency(data.summary.totalPaid)}</p>
        <p>Total em Dívida: ${formatCurrency(data.summary.totalDebt)}</p>
        <p>Total Apartamentos: ${data.summary.totalApartments}</p>
        <p>Taxa Ocupação: ${data.summary.occupancyRate}%</p>
      </div>
    `;

    let tableContent = '';
    if (data.contributionData && data.contributionData.length > 0) {
      tableContent = `
        <div class="section-title">Detalhes por Apartamento</div>
        <table>
          <thead>
            <tr>
              <th>Apto</th>
              <th>Residente</th>
              <th>Total Pago</th>
              <th>Total Dívida</th>
              ${data.months.map(month => `<th>${month}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.contributionData.map(contribution => `
              <tr>
                <td>${contribution.apartment}</td>
                <td>${contribution.resident}</td>
                <td>${formatCurrency(contribution.totalPaid)}</td>
                <td>${formatCurrency(contribution.totalDebt)}</td>
                ${data.months.map(month => {
                  const monthStatus = contribution.monthlyStatus.find(status => status.month === month);
                  return `<td>${monthStatus?.status || 'N/A'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const content = `
      <div class="section-title">Resumo do Ano ${data.year}</div>
      ${summaryContent}
      ${tableContent}
    `;

    const { html, footer } = await this.generateTCasaHTMLTemplate(
      `${data.title} - ${data.year}`,
      data.condominiumInfo,
      documentId,
      content
    );

    this.htmlToJsPDF(html, footer);
  }

  save(filename: string) {
    this.doc.save(filename);
  }
}