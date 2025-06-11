import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import templatePdfService from './templatePdfService';

interface FichaData {
  dadosPessoais: any;
  dadosProfissionais: any;
  endereco: any;
  dadosAdicionais: any;
  conjuge?: any;
}

interface CapaData {
  cliente: {
    nome: string;
    cpf: string;
  };
  conjuge?: {
    nome: string;
    cpf: string;
  };
  empreendimento: string;
  midiaOrigem: string;
  observacoes?: string;
}

class PdfService {
  async generateFichaCadastral(data: FichaData): Promise<Uint8Array> {
    console.log('Gerando ficha cadastral com dados:', data);
    
    // Verificar se há template carregado
    const hasTemplate = await templatePdfService.hasTemplate();
    
    if (hasTemplate) {
      console.log('Usando template Abiatar para ficha cadastral');
      
      // Converter dados para o formato do template
      const templateData = templatePdfService.convertDataToTemplateFormat(
        {
          dadosPessoais: data.dadosPessoais,
          dadosProfissionais: data.dadosProfissionais,
          endereco: data.endereco,
          conjuge: data.conjuge
        },
        {
          empreendimento: data.dadosAdicionais?.empreendimento || '',
          email: data.dadosAdicionais?.email || '',
          telefone: data.dadosAdicionais?.telefone || ''
        }
      );
      
      // Preencher template
      return await templatePdfService.fillTemplate(templateData);
    } else {
      console.log('Template não encontrado, gerando ficha padrão');
      return await this.generateDefaultFicha(data);
    }
  }

  private async generateDefaultFicha(data: FichaData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 800;
    const leftMargin = 50;
    const lineHeight = 20;

    // Título
    page.drawText('FICHA CADASTRAL', {
      x: leftMargin,
      y: yPosition,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Dados Pessoais
    const dadosPessoais = data.dadosPessoais || {};
    const campos = [
      ['NOME COMPLETO:', dadosPessoais.nomeCompleto || ''],
      ['CPF:', dadosPessoais.cpf || ''],
      ['RG:', dadosPessoais.rg || ''],
      ['DATA DE NASCIMENTO:', dadosPessoais.dataNascimento || ''],
      ['ESTADO CIVIL:', dadosPessoais.estadoCivil || ''],
      ['NATURALIDADE:', dadosPessoais.naturalidade || ''],
      ['NACIONALIDADE:', 'BRASILEIRO'],
    ];

    campos.forEach(([label, value]) => {
      page.drawText(`${label} ${value}`, {
        x: leftMargin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    });

    return await pdfDoc.save();
  }

  async generateCapa(data: CapaData): Promise<Uint8Array> {
    console.log('Gerando capa com dados:', data);
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 750;
    const leftMargin = 50;
    const lineHeight = 25;

    // Data atual
    const currentDate = new Date().toLocaleDateString('pt-BR');
    page.drawText(`Data: ${currentDate}`, {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Título
    page.drawText('DOCUMENTAÇÃO PARA ANÁLISE DE CRÉDITO', {
      x: leftMargin,
      y: yPosition,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Empreendimento
    page.drawText(`EMPREENDIMENTO: ${data.empreendimento}`, {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;

    // Cliente Principal
    page.drawText('CLIENTE:', {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight;
    page.drawText(`NOME: ${data.cliente.nome}`, {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight;
    page.drawText(`CPF: ${data.cliente.cpf}`, {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Cônjuge (se houver)
    if (data.conjuge) {
      yPosition -= 30;
      page.drawText('CÔNJUGE:', {
        x: leftMargin,
        y: yPosition,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight;
      page.drawText(`NOME: ${data.conjuge.nome}`, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight;
      page.drawText(`CPF: ${data.conjuge.cpf}`, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    yPosition -= 40;

    // Mídia de Origem
    page.drawText(`MÍDIA DE ORIGEM: ${data.midiaOrigem}`, {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;

    // Telefone fixo
    page.drawText('TELEFONE: 11 9 7098 8512', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Observações (se houver)
    if (data.observacoes && data.observacoes.trim()) {
      yPosition -= 40;
      page.drawText('OBSERVAÇÕES:', {
        x: leftMargin,
        y: yPosition,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight;
      // Quebrar texto longo em múltiplas linhas
      const observacoes = data.observacoes;
      const maxCharsPerLine = 70;
      const lines = this.breakTextIntoLines(observacoes, maxCharsPerLine);
      
      lines.forEach(line => {
        page.drawText(line, {
          x: leftMargin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
      });
    }

    return await pdfDoc.save();
  }

  private breakTextIntoLines(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  async consolidateDocuments(originalFiles: File[], fichaBytes: Uint8Array, capaBytes: Uint8Array): Promise<Uint8Array> {
    console.log('Consolidando documentos...');
    
    const consolidatedDoc = await PDFDocument.create();

    try {
      // Adicionar capa primeiro
      const capaDoc = await PDFDocument.load(capaBytes);
      const capaPages = await consolidatedDoc.copyPages(capaDoc, capaDoc.getPageIndices());
      capaPages.forEach(page => consolidatedDoc.addPage(page));

      // Adicionar ficha cadastral
      const fichaDoc = await PDFDocument.load(fichaBytes);
      const fichaPages = await consolidatedDoc.copyPages(fichaDoc, fichaDoc.getPageIndices());
      fichaPages.forEach(page => consolidatedDoc.addPage(page));

      // Adicionar documentos originais
      for (const file of originalFiles) {
        if (file.type === 'application/pdf') {
          try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const pages = await consolidatedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach(page => consolidatedDoc.addPage(page));
          } catch (error) {
            console.error(`Erro ao processar PDF ${file.name}:`, error);
          }
        }
      }

      return await consolidatedDoc.save();
    } catch (error) {
      console.error('Erro na consolidação:', error);
      throw new Error('Falha ao consolidar documentos');
    }
  }

  generateResumoCompleto(data: any): string {
    const { dadosPessoais, dadosProfissionais, endereco, dadosAdicionais } = data;
    
    return `
=== RESUMO COMPLETO DO CLIENTE ===

📋 DADOS PESSOAIS:
Nome: ${dadosPessoais?.nomeCompleto || 'Não informado'}
CPF: ${dadosPessoais?.cpf || 'Não informado'}
RG: ${dadosPessoais?.rg || 'Não informado'}
Data de Nascimento: ${dadosPessoais?.dataNascimento || 'Não informado'}
Estado Civil: ${dadosPessoais?.estadoCivil || 'Não informado'}
Naturalidade: ${dadosPessoais?.naturalidade || 'Não informado'}

💼 DADOS PROFISSIONAIS:
Empresa: ${dadosProfissionais?.empresa || 'Não informado'}
Cargo: ${dadosProfissionais?.cargo || 'Não informado'}
Salário: ${dadosProfissionais?.salarioBruto || 'Não informado'}
Admissão: ${dadosProfissionais?.dataAdmissao || 'Não informado'}

🏠 ENDEREÇO:
${endereco?.logradouro || 'Não informado'}
${endereco?.complemento ? endereco.complemento + ', ' : ''}${endereco?.bairro || 'Não informado'}
${endereco?.cidade || 'Não informado'} - ${endereco?.uf || 'Não informado'}
CEP: ${endereco?.cep || 'Não informado'}

🏢 INFORMAÇÕES ADICIONAIS:
Empreendimento: ${dadosAdicionais?.empreendimento || 'Não informado'}
Email: ${dadosAdicionais?.email || 'Não informado'}
Telefone: ${dadosAdicionais?.telefone || 'Não informado'}
Mídia de Origem: ${dadosAdicionais?.midiaOrigem || 'Não informado'}
${dadosAdicionais?.observacoes ? `Observações: ${dadosAdicionais.observacoes}` : ''}

Data do Resumo: ${new Date().toLocaleDateString('pt-BR')}
    `.trim();
  }

  downloadPDF(pdfBytes: Uint8Array, filename: string): void {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default new PdfService();
