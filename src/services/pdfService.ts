import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface FichaData {
  dadosPessoais: {
    nomeCompleto: string;
    rg: string;
    cpf: string;
    dataNascimento: string;
    naturalidade: string;
    estadoCivil: string;
    orgaoEmissor: string;
  };
  dadosProfissionais: {
    empresa: string;
    cargo: string;
    salarioBruto: string;
    dataAdmissao: string;
  };
  endereco: {
    logradouro: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  dadosAdicionais: {
    email: string;
    telefone: string;
    empreendimento: string;
  };
  conjuge?: {
    nomeCompleto: string;
    rg: string;
    cpf: string;
    dataNascimento: string;
  };
}

export interface CapaData {
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

class PDFService {
  generateFichaCadastral(data: FichaData): Promise<Uint8Array> {
    return new Promise(async (resolve) => {
      try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 size
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = 800;
        const leftMargin = 50;
        const lineHeight = 20;

        // Título
        page.drawText('FICHA CADASTRAL', {
          x: leftMargin,
          y: yPosition,
          size: 18,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        yPosition -= 40;

        // Data atual
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        page.drawText(`DATA: ${dataAtual}`, {
          x: leftMargin,
          y: yPosition,
          size: 12,
          font: boldFont,
        });

        yPosition -= 30;

        // Seção Dados Pessoais
        page.drawText('DADOS PESSOAIS', {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
        });

        yPosition -= lineHeight;

        const pessoalFields = [
          `NOME COMPLETO: ${data.dadosPessoais.nomeCompleto || ''}`,
          `RG: ${data.dadosPessoais.rg || ''} ÓRGÃO EMISSOR: ${data.dadosPessoais.orgaoEmissor || ''}`,
          `CPF: ${data.dadosPessoais.cpf || ''}`,
          `DATA DE NASCIMENTO: ${data.dadosPessoais.dataNascimento || ''}`,
          `NATURALIDADE: ${data.dadosPessoais.naturalidade || ''}`,
          `NACIONALIDADE: BRASILEIRA`,
          `ESTADO CIVIL: ${data.dadosPessoais.estadoCivil || ''}`,
          `EMAIL: ${data.dadosAdicionais.email || ''}`,
          `TELEFONE: ${data.dadosAdicionais.telefone || ''}`,
          `GRAU DE INSTRUÇÃO: ________________`,
          `PIS: ________________`,
        ];

        pessoalFields.forEach(field => {
          page.drawText(field, {
            x: leftMargin,
            y: yPosition,
            size: 10,
            font: font,
          });
          yPosition -= lineHeight;
        });

        yPosition -= 20;

        // Seção Dados Profissionais
        page.drawText('DADOS PROFISSIONAIS', {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
        });

        yPosition -= lineHeight;

        const profissionalFields = [
          `EMPRESA: ${data.dadosProfissionais.empresa || ''}`,
          `CARGO: ${data.dadosProfissionais.cargo || ''}`,
          `SALÁRIO BRUTO: ${data.dadosProfissionais.salarioBruto || ''}`,
          `DATA DE ADMISSÃO: ${data.dadosProfissionais.dataAdmissao || ''}`,
        ];

        profissionalFields.forEach(field => {
          page.drawText(field, {
            x: leftMargin,
            y: yPosition,
            size: 10,
            font: font,
          });
          yPosition -= lineHeight;
        });

        yPosition -= 20;

        // Seção Endereço
        page.drawText('ENDEREÇO RESIDENCIAL', {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
        });

        yPosition -= lineHeight;

        const enderecoFields = [
          `LOGRADOURO: ${data.endereco.logradouro || ''}`,
          `COMPLEMENTO: ${data.endereco.complemento || ''}`,
          `BAIRRO: ${data.endereco.bairro || ''}`,
          `CIDADE: ${data.endereco.cidade || ''} ESTADO: ${data.endereco.estado || ''}`,
          `CEP: ${data.endereco.cep || ''}`,
          `TIPO DE MORADIA: ________________`,
        ];

        enderecoFields.forEach(field => {
          page.drawText(field, {
            x: leftMargin,
            y: yPosition,
            size: 10,
            font: font,
          });
          yPosition -= lineHeight;
        });

        yPosition -= 20;

        // Seção do Processo
        page.drawText('DADOS DO PROCESSO', {
          x: leftMargin,
          y: yPosition,
          size: 14,
          font: boldFont,
        });

        yPosition -= lineHeight;

        const processoFields = [
          `EMPREENDIMENTO: ${data.dadosAdicionais.empreendimento || ''}`,
          `CORRETOR: GORETI / BRAZZA`,
          `COORDENADOR: LAVILLE`,
          `DEPENDENTES: ________________`,
          `IMÓVEL: ________________`,
        ];

        processoFields.forEach(field => {
          page.drawText(field, {
            x: leftMargin,
            y: yPosition,
            size: 10,
            font: font,
          });
          yPosition -= lineHeight;
        });

        // Se houver cônjuge, adicionar seção
        if (data.conjuge) {
          yPosition -= 30;
          page.drawText('DADOS DO CÔNJUGE', {
            x: leftMargin,
            y: yPosition,
            size: 14,
            font: boldFont,
          });

          yPosition -= lineHeight;

          const conjugeFields = [
            `NOME COMPLETO: ${data.conjuge.nomeCompleto || ''}`,
            `RG: ${data.conjuge.rg || ''}`,
            `CPF: ${data.conjuge.cpf || ''}`,
            `DATA DE NASCIMENTO: ${data.conjuge.dataNascimento || ''}`,
          ];

          conjugeFields.forEach(field => {
            page.drawText(field, {
              x: leftMargin,
              y: yPosition,
              size: 10,
              font: font,
            });
            yPosition -= lineHeight;
          });
        }

        const pdfBytes = await pdfDoc.save();
        resolve(pdfBytes);
      } catch (error) {
        console.error('Erro ao gerar ficha cadastral:', error);
        resolve(new Uint8Array());
      }
    });
  }

  generateCapa(data: CapaData): Promise<Uint8Array> {
    return new Promise(async (resolve) => {
      try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 size
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = 800;
        const leftMargin = 50;
        const lineHeight = 25;

        // Título
        page.drawText('RESUMO / CAPA', {
          x: leftMargin,
          y: yPosition,
          size: 20,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        yPosition -= 60;

        // Informações do processo
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        const resumoText = `
RESUMO COMPLETO - DOCUMENTAÇÃO DO CLIENTE

CLIENTE: ${data.cliente.nome}
CPF: ${data.cliente.cpf}

${data.conjuge ? `CÔNJUGE: ${data.conjuge.nome}\nCPF: ${data.conjuge.cpf}\n` : ''}

EMPREENDIMENTO: ${data.empreendimento}
MÍDIA DE ORIGEM: ${data.midiaOrigem}

EM ${dataAtual} FOI VERIFICADO E APROVADO A DOCUMENTAÇÃO ACIMA DESCRITA, 
TENDO SIDO PROTOCOLADOS OS DOCUMENTOS NECESSÁRIOS PARA ANÁLISE DE CRÉDITO.

CORRETOR: GORETI / BRAZZA
COORDENADOR: LAVILLE
TELEFONE: (11) 99999-9999
GERENTE: BRAZZA

${data.observacoes ? `\nOBSERVAÇÕES: ${data.observacoes}` : ''}
        `.trim();

        // Dividir texto em linhas e desenhar
        const lines = resumoText.split('\n');
        lines.forEach(line => {
          if (yPosition > 50) {
            page.drawText(line, {
              x: leftMargin,
              y: yPosition,
              size: 12,
              font: line.includes(':') ? boldFont : font,
            });
            yPosition -= lineHeight;
          }
        });

        const pdfBytes = await pdfDoc.save();
        resolve(pdfBytes);
      } catch (error) {
        console.error('Erro ao gerar capa:', error);
        resolve(new Uint8Array());
      }
    });
  }

  async consolidateDocuments(originalFiles: File[], fichaBytes: Uint8Array, capaBytes: Uint8Array): Promise<Uint8Array> {
    try {
      console.log('=== INICIANDO CONSOLIDAÇÃO DE DOCUMENTOS ===');
      console.log('Ordem esperada: 1) Capa, 2) Ficha Cadastral, 3) Documentos Originais');
      
      const consolidatedPdf = await PDFDocument.create();

      // 1. PRIMEIRA PÁGINA: CAPA/RESUMO
      console.log('Adicionando CAPA como primeira página...');
      const capaPdf = await PDFDocument.load(capaBytes);
      const capaPages = await consolidatedPdf.copyPages(capaPdf, capaPdf.getPageIndices());
      capaPages.forEach((page) => consolidatedPdf.addPage(page));

      // 2. SEGUNDA PÁGINA: FICHA CADASTRAL
      console.log('Adicionando FICHA CADASTRAL como segunda página...');
      const fichaPdf = await PDFDocument.load(fichaBytes);
      const fichaPages = await consolidatedPdf.copyPages(fichaPdf, fichaPdf.getPageIndices());
      fichaPages.forEach((page) => consolidatedPdf.addPage(page));

      // 3. PÁGINAS SEGUINTES: DOCUMENTOS ORIGINAIS EM ORDEM ESPECÍFICA
      console.log('Adicionando documentos originais em ordem...');
      
      // Ordenar arquivos por prioridade: RG, Holerite, Comprovante, Certidões, Outros
      const orderedFiles = this.orderFilesByPriority(originalFiles);
      
      for (const file of orderedFiles) {
        console.log(`Processando arquivo: ${file.name}`);
        
        if (file.type === 'application/pdf') {
          try {
            const fileBytes = await file.arrayBuffer();
            const filePdf = await PDFDocument.load(fileBytes);
            const pages = await consolidatedPdf.copyPages(filePdf, filePdf.getPageIndices());
            pages.forEach((page) => consolidatedPdf.addPage(page));
            console.log(`✅ PDF adicionado: ${file.name}`);
          } catch (error) {
            console.error(`❌ Erro ao processar PDF ${file.name}:`, error);
          }
        } else if (file.type.startsWith('image/')) {
          try {
            // Converter imagem para PDF e adicionar
            const imageBytes = await file.arrayBuffer();
            const page = consolidatedPdf.addPage([595, 842]); // A4
            
            let image;
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
              image = await consolidatedPdf.embedJpg(imageBytes);
            } else if (file.type === 'image/png') {
              image = await consolidatedPdf.embedPng(imageBytes);
            }

            if (image) {
              // Calcular dimensões para caber na página mantendo proporção
              const maxWidth = 495; // largura máxima (A4 - margens)
              const maxHeight = 692; // altura máxima (A4 - margens)
              
              const imgWidth = image.width;
              const imgHeight = image.height;
              
              let finalWidth = imgWidth;
              let finalHeight = imgHeight;
              
              // Redimensionar se necessário
              if (imgWidth > maxWidth) {
                finalWidth = maxWidth;
                finalHeight = (imgHeight * maxWidth) / imgWidth;
              }
              
              if (finalHeight > maxHeight) {
                finalHeight = maxHeight;
                finalWidth = (finalWidth * maxHeight) / finalHeight;
              }
              
              // Centralizar na página
              const x = (595 - finalWidth) / 2;
              const y = (842 - finalHeight) / 2;
              
              page.drawImage(image, {
                x,
                y,
                width: finalWidth,
                height: finalHeight,
              });
              
              console.log(`✅ Imagem adicionada: ${file.name}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao processar imagem ${file.name}:`, error);
          }
        }
      }

      console.log('=== CONSOLIDAÇÃO CONCLUÍDA ===');
      console.log(`Total de páginas no documento final: ${consolidatedPdf.getPageCount()}`);
      
      return await consolidatedPdf.save();
    } catch (error) {
      console.error('Erro ao consolidar documentos:', error);
      return new Uint8Array();
    }
  }

  private orderFilesByPriority(files: File[]): File[] {
    console.log('=== ORDENANDO ARQUIVOS POR PRIORIDADE ===');
    
    const priorityOrder = {
      rg: 1,        // RG/Identidade primeiro
      holerite: 2,  // Holerite segundo  
      comprovante: 3, // Comprovante de residência terceiro
      certidao: 4,  // Certidões quarto
      imposto: 5,   // Declaração IR quinto
      outros: 6     // Outros por último
    };

    const categorizeFile = (filename: string): number => {
      const name = filename.toLowerCase();
      
      if (name.includes('rg') || name.includes('identidade')) {
        console.log(`${filename} -> RG (prioridade 1)`);
        return priorityOrder.rg;
      }
      if (name.includes('holerite') || name.includes('folha') || name.includes('pagamento')) {
        console.log(`${filename} -> HOLERITE (prioridade 2)`);
        return priorityOrder.holerite;
      }
      if (name.includes('comprovante') || name.includes('residencia') || name.includes('endereco') || 
          name.includes('light') || name.includes('enel') || name.includes('agua') || name.includes('conta')) {
        console.log(`${filename} -> COMPROVANTE (prioridade 3)`);
        return priorityOrder.comprovante;
      }
      if (name.includes('certidao') || name.includes('nascimento') || name.includes('casamento')) {
        console.log(`${filename} -> CERTIDÃO (prioridade 4)`);
        return priorityOrder.certidao;
      }
      if (name.includes('imposto') || name.includes('declaracao') || name.includes('irpf')) {
        console.log(`${filename} -> IMPOSTO RENDA (prioridade 5)`);
        return priorityOrder.imposto;
      }
      
      console.log(`${filename} -> OUTROS (prioridade 6)`);
      return priorityOrder.outros;
    };

    const sortedFiles = [...files].sort((a, b) => {
      const priorityA = categorizeFile(a.name);
      const priorityB = categorizeFile(b.name);
      return priorityA - priorityB;
    });

    console.log('Ordem final dos arquivos:');
    sortedFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
    });

    return sortedFiles;
  }

  generateResumoCompleto(data: any): string {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    return `
RESUMO COMPLETO - DOCUMENTAÇÃO DO CLIENTE

=== DADOS PESSOAIS ===
Nome Completo: ${data.dadosPessoais?.nomeCompleto || 'NÃO INFORMADO'}
RG: ${data.dadosPessoais?.rg || 'NÃO INFORMADO'}
CPF: ${data.dadosPessoais?.cpf || 'NÃO INFORMADO'}
Data de Nascimento: ${data.dadosPessoais?.dataNascimento || 'NÃO INFORMADO'}
Naturalidade: ${data.dadosPessoais?.naturalidade || 'NÃO INFORMADO'}
Estado Civil: ${data.dadosPessoais?.estadoCivil || 'NÃO INFORMADO'}
Email: ${data.dadosAdicionais?.email || 'NÃO INFORMADO'}
Telefone: ${data.dadosAdicionais?.telefone || 'NÃO INFORMADO'}

=== DADOS PROFISSIONAIS ===
Empresa: ${data.dadosProfissionais?.empresa || 'NÃO INFORMADO'}
Cargo: ${data.dadosProfissionais?.cargo || 'NÃO INFORMADO'}
Salário Bruto: ${data.dadosProfissionais?.salarioBruto || 'NÃO INFORMADO'}
Data de Admissão: ${data.dadosProfissionais?.dataAdmissao || 'NÃO INFORMADO'}

=== ENDEREÇO RESIDENCIAL ===
Logradouro: ${data.endereco?.logradouro || 'NÃO INFORMADO'}
Bairro: ${data.endereco?.bairro || 'NÃO INFORMADO'}
Cidade: ${data.endereco?.cidade || 'NÃO INFORMADO'}
Estado: ${data.endereco?.estado || 'NÃO INFORMADO'}
CEP: ${data.endereco?.cep || 'NÃO INFORMADO'}

=== DADOS DO PROCESSO ===
Empreendimento: ${data.dadosAdicionais?.empreendimento || 'NÃO INFORMADO'}
Mídia de Origem: ${data.dadosAdicionais?.midiaOrigem || 'NÃO INFORMADO'}
Data de Verificação: ${dataAtual}
Corretor: GORETI / BRAZZA
Coordenador: LAVILLE

EM ${dataAtual} FOI VERIFICADO E APROVADO A DOCUMENTAÇÃO ACIMA DESCRITA, TENDO SIDO PROTOCOLADOS OS DOCUMENTOS NECESSÁRIOS PARA ANÁLISE DE CRÉDITO.

${data.dadosAdicionais?.observacoes ? `\nObservações: ${data.dadosAdicionais.observacoes}` : ''}
    `.trim();
  }

  downloadPDF(bytes: Uint8Array, filename: string): void {
    const blob = new Blob([bytes], { type: 'application/pdf' });
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

export default new PDFService();
