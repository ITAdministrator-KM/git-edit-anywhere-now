import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { PublicUser } from '@/services/apiService';

export class IDCardPrinter {
  static async printSingleCard(user: PublicUser, autoPrint: boolean, toast: any) {
    const cards = [user];
    await this.printMultipleCards(cards, autoPrint, toast);
  }

  static async printMultipleCards(users: PublicUser[], autoPrint: boolean, toast: any) {
    try {
      // Generate QR codes for all users
      const usersWithQR = await Promise.all(
        users.map(async (user) => {
          const userPublicId = (user as any).public_user_id || user.public_id || `PUB-${user.id}`;
          
          try {
            let qrDataUrl = '';
            
            if (user.qr_code && user.qr_code.trim() !== '') {
              if (user.qr_code.startsWith('data:image/')) {
                qrDataUrl = user.qr_code;
              } else {
                const qrData = {
                  id: userPublicId,
                  name: user.name,
                  nic: user.nic,
                  mobile: user.mobile || '',
                  issued: new Date().toISOString().split('T')[0],
                  authority: 'Divisional Secretariat Kalmunai'
                };
                
                qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
                  width: 300,
                  margin: 2,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                  },
                  errorCorrectionLevel: 'H'
                });
              }
            } else {
              const qrData = {
                id: userPublicId,
                name: user.name,
                nic: user.nic,
                mobile: user.mobile || '',
                issued: new Date().toISOString().split('T')[0],
                authority: 'Divisional Secretariat Kalmunai'
              };
              
              qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
                width: 300,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H'
              });
            }
            return { ...user, qr_data_url: qrDataUrl, public_user_id: userPublicId };
          } catch (error) {
            console.error('QR generation error for user:', userPublicId, error);
            return { ...user, qr_data_url: '', public_user_id: userPublicId };
          }
        })
      );

      const htmlContent = this.generateIDCardHTML(usersWithQR);
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup settings.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          if (autoPrint) {
            printWindow.print();
            printWindow.onafterprint = () => {
              setTimeout(() => printWindow.close(), 1000);
            };
          } else {
            const userConfirmed = confirm('ID cards are ready. Do you want to print now?');
            if (userConfirmed) {
              printWindow.print();
              printWindow.onafterprint = () => {
                setTimeout(() => printWindow.close(), 1000);
              };
            }
          }
        }, 1000);
      };

      toast({
        title: "✅ ID Cards Generated Successfully",
        description: `${users.length} government ID card(s) prepared for printing`,
      });

    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: error instanceof Error ? error.message : "Failed to prepare ID cards",
        variant: "destructive",
      });
    }
  }

  private static generateIDCardHTML(users: any[]): string {
    const cardsPerRow = 2;
    const cardsPerPage = 8;
    let cardRows = '';
    
    for (let i = 0; i < users.length; i += cardsPerRow) {
      const rowUsers = users.slice(i, i + cardsPerRow);
      cardRows += `
        <div class="card-row">
          ${rowUsers.map(user => this.generateSingleCardHTML(user)).join('')}
          ${rowUsers.length === 1 ? '<div class="id-card empty-card"></div>' : ''}
        </div>
      `;
      
      if ((i + cardsPerRow) % cardsPerPage === 0 && i + cardsPerRow < users.length) {
        cardRows += '<div class="page-break"></div>';
      }
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Government ID Cards - Professional Print</title>
        <style>
          ${this.getIDCardStyles()}
        </style>
      </head>
      <body>
        <div class="print-container">
          ${cardRows}
        </div>
      </body>
      </html>
    `;
  }

  private static generateSingleCardHTML(user: any): string {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const displayId = user.public_user_id || user.public_id || 'N/A';
    
    return `
      <div class="id-card">
        <div class="card-front">
          <div class="card-header">
            <div class="logo-left">
              <img src="/emblem.svg" alt="Government Emblem" class="logo" />
            </div>
            <div class="org-info">
              <div class="org-name">DIVISIONAL SECRETARIAT</div>
              <div class="org-location">KALMUNAI</div>
            </div>
            <div class="logo-right">
              <img src="/logo.svg" alt="DS Logo" class="logo" />
            </div>
          </div>
          
          <div class="card-body">
            <div class="user-info">
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${user.name}</span>
              </div>
              <div class="info-row">
                <span class="label">NIC:</span>
                <span class="value">${user.nic}</span>
              </div>
              ${user.dateOfBirth ? `
              <div class="info-row">
                <span class="label">Date of Birth:</span>
                <span class="value">${user.dateOfBirth}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Mobile:</span>
                <span class="value">${user.mobile || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Address:</span>
                <span class="value">${user.address.length > 40 ? user.address.substring(0, 40) + '...' : user.address}</span>
              </div>
              <div class="info-row">
                <span class="label">Public ID:</span>
                <span class="value">${displayId}</span>
              </div>
            </div>
            
            <div class="qr-section">
              ${user.qr_data_url ? 
                `<img src="${user.qr_data_url}" alt="QR Code" class="qr-code" crossorigin="anonymous" />` : 
                '<div class="qr-error">QR Code Unavailable</div>'
              }
              <div class="qr-label">SCAN TO VERIFY</div>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="footer-left">Issued: ${currentDate}</div>
            <div class="footer-right">OFFICIAL DOCUMENT</div>
          </div>
        </div>
      </div>
    `;
  }

  private static getIDCardStyles(): string {
    return `
      @page {
        size: A4;
        margin: 8mm;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        background: white;
        color: black;
        line-height: 1.2;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .print-container {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
      }
      
      .card-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4mm;
        width: 100%;
      }
      
      .id-card {
        width: 85mm;
        height: 54mm;
        border: 2px solid #000000;
        border-radius: 0;
        background: white;
        overflow: hidden;
        position: relative;
        page-break-inside: avoid;
      }
      
      .empty-card {
        visibility: hidden;
      }
      
      .card-front {
        width: 100%;
        height: 100%;
        padding: 2mm;
        display: flex;
        flex-direction: column;
      }
      
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2mm;
        border-bottom: 2px solid #000000;
        padding-bottom: 1.5mm;
      }
      
      .logo-left, .logo-right {
        flex-shrink: 0;
      }
      
      .logo {
        width: 10mm;
        height: 10mm;
        object-fit: contain;
        border: 1px solid #000000;
      }
      
      .org-info {
        flex: 1;
        text-align: center;
        margin: 0 2mm;
      }
      
      .org-name {
        font-size: 7pt;
        font-weight: bold;
        color: #000000;
        line-height: 1.1;
        letter-spacing: 0.5px;
      }
      
      .org-location {
        font-size: 7pt;
        color: #000000;
        font-weight: bold;
        letter-spacing: 0.5px;
      }
      
      .card-body {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        gap: 2mm;
      }
      
      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }
      
      .info-row {
        margin-bottom: 1mm;
      }
      
      .label {
        font-size: 6pt;
        font-weight: bold;
        color: #000000;
        display: block;
        text-transform: uppercase;
      }
      
      .value {
        font-size: 7pt;
        color: #000000;
        font-weight: 600;
        word-break: break-word;
        line-height: 1.1;
        display: block;
      }
      
      .qr-section {
        width: 18mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-left: 2px solid #000000;
        padding-left: 2mm;
        flex-shrink: 0;
      }
      
      .qr-code {
        width: 16mm;
        height: 16mm;
        object-fit: contain;
        border: 1px solid #000000;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
      
      .qr-label {
        font-size: 5pt;
        color: #000000;
        text-align: center;
        font-weight: bold;
        margin-top: 1mm;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      
      .qr-error {
        font-size: 5pt;
        color: #000000;
        text-align: center;
        font-weight: bold;
      }
      
      .card-footer {
        margin-top: 1.5mm;
        padding-top: 1mm;
        border-top: 1px solid #000000;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .footer-left, .footer-right {
        font-size: 5pt;
        color: #000000;
        font-weight: bold;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .id-card {
          box-shadow: none !important;
        }
        
        .qr-code {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        
        .print-container {
          max-width: none;
        }
      }
    `;
  }
}
