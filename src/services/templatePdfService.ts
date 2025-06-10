
import { PDFDocument, PDFForm, PDFTextField } from 'pdf-lib';

export interface TemplateData {
  // Campos do Cabeçalho
  DATA: string;
  EMPREENDIMENTO: string;
  
  // 1º Comprador
  NOME: string;
  CPF: string;
  RG: string;
  UF: string;
  NACIONALIDADE: string;
  ESTADOCIVIL: string;
  NATURALIDADE: string;
  DATANASC: string;
  PROFISSAO: string;
  RENDA: string;
  EMAIL: string;
  TELEFONE: string;
  ENDERECO: string;
  COMPLEMENTO: string;
  BAIRRO: string;
  CEP: string;
  CIDADE: string;
  
  // 2º Comprador (opcional)
  NOME2?: string;
  CPF2?: string;
  RG2?: string;
  UF2?: string;
  NACIONALIDADE2?: string;
  ESTADOCIVIL2?: string;
  NATURALIDADE2?: string;
  DATANASC2?: string;
  PROFISSAO2?: string;
  RENDA2?: string;
  EMAIL2?: string;
  TELEFONE2?: string;
  ENDERECO2?: string;
  COMPLEMENTO2?: string;
  BAIRRO2?: string;
  CEP2?: string;
  CIDADE2?: string;
}

class TemplatePdfService {
  private templateFile: ArrayBuffer | null = null;

  async loadTemplate(file: File): Promise<void> {
    this.templateFile = await file.arrayBuffer();
    console.log('Template PDF carregado:', file.name);
  }

  async fillTemplate(data: TemplateData): Promise<Uint8Array> {
    if (!this.templateFile) {
      throw new Error('Template PDF não foi carregado. Use loadTemplate() primeiro.');
    }

    try {
      console.log('=== INICIANDO PREENCHIMENTO DO TEMPLATE ===');
      console.log('Dados para preenchimento:', data);

      const pdfDoc = await PDFDocument.load(this.templateFile);
      const form = pdfDoc.getForm();

      // Listar todos os campos disponíveis no formulário
      const fields = form.getFields();
      console.log('Campos disponíveis no template:');
      fields.forEach(field => {
        console.log(`- ${field.getName()} (tipo: ${field.constructor.name})`);
      });

      // Função para preencher campo com segurança
      const fillField = (fieldName: string, value: string | undefined) => {
        if (!value) return;

        try {
          const field = form.getField(fieldName);
          if (field instanceof PDFTextField) {
            field.setText(value.toUpperCase());
            console.log(`✅ Campo preenchido: ${fieldName} = ${value}`);
          } else {
            console.log(`⚠️ Campo ${fieldName} não é um campo de texto`);
          }
        } catch (error) {
          console.log(`❌ Erro ao preencher campo ${fieldName}:`, error);
        }
      };

      // Preencher todos os campos
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          fillField(key, String(value));
        }
      });

      // Tornar o formulário não editável (opcional)
      form.flatten();

      console.log('=== PREENCHIMENTO CONCLUÍDO ===');
      return await pdfDoc.save();

    } catch (error) {
      console.error('Erro ao preencher template:', error);
      throw new Error('Falha ao preencher o template PDF');
    }
  }

  convertDataToTemplateFormat(extractedData: any, additionalData: any): TemplateData {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    const templateData: TemplateData = {
      // Cabeçalho
      DATA: currentDate,
      EMPREENDIMENTO: additionalData?.empreendimento || '',
      
      // 1º Comprador
      NOME: extractedData?.dadosPessoais?.nomeCompleto || '',
      CPF: extractedData?.dadosPessoais?.cpf || '',
      RG: extractedData?.dadosPessoais?.rg || '',
      UF: extractedData?.dadosPessoais?.orgaoEmissor?.includes('-') 
        ? extractedData.dadosPessoais.orgaoEmissor.split('-')[1] || '' 
        : '',
      NACIONALIDADE: 'BRASILEIRO',
      ESTADOCIVIL: extractedData?.dadosPessoais?.estadoCivil || '',
      NATURALIDADE: extractedData?.dadosPessoais?.naturalidade || '',
      DATANASC: extractedData?.dadosPessoais?.dataNascimento || '',
      PROFISSAO: extractedData?.dadosProfissionais?.cargo || '',
      RENDA: extractedData?.dadosProfissionais?.salarioBruto || '',
      EMAIL: additionalData?.email || '',
      TELEFONE: additionalData?.telefone || '',
      ENDERECO: extractedData?.endereco?.logradouro || '',
      COMPLEMENTO: extractedData?.endereco?.complemento || '',
      BAIRRO: extractedData?.endereco?.bairro || '',
      CEP: extractedData?.endereco?.cep || '',
      CIDADE: extractedData?.endereco?.cidade || '',
    };

    // Se houver cônjuge, preencher campos do 2º comprador
    if (extractedData?.conjuge) {
      templateData.NOME2 = extractedData.conjuge.nomeCompleto || '';
      templateData.CPF2 = extractedData.conjuge.cpf || '';
      templateData.RG2 = extractedData.conjuge.rg || '';
      templateData.UF2 = templateData.UF; // Assumir mesmo estado
      templateData.NACIONALIDADE2 = 'BRASILEIRO';
      templateData.ESTADOCIVIL2 = extractedData.dadosPessoais?.estadoCivil || '';
      templateData.NATURALIDADE2 = '';
      templateData.DATANASC2 = extractedData.conjuge.dataNascimento || '';
      templateData.PROFISSAO2 = '';
      templateData.RENDA2 = '';
      templateData.EMAIL2 = '';
      templateData.TELEFONE2 = '';
      templateData.ENDERECO2 = templateData.ENDERECO;
      templateData.COMPLEMENTO2 = templateData.COMPLEMENTO;
      templateData.BAIRRO2 = templateData.BAIRRO;
      templateData.CEP2 = templateData.CEP;
      templateData.CIDADE2 = templateData.CIDADE;
    }

    console.log('Dados convertidos para template:', templateData);
    return templateData;
  }

  downloadFilledTemplate(pdfBytes: Uint8Array, clientName: string, empreendimento: string): void {
    const fileName = `Ficha_${clientName.replace(/\s+/g, '_')}_${empreendimento.replace(/\s+/g, '_')}.pdf`;
    
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`Template preenchido baixado como: ${fileName}`);
  }

  async hasTemplate(): Promise<boolean> {
    return this.templateFile !== null;
  }

  getTemplateInstructions(): string {
    return `
📋 INSTRUÇÕES PARA O TEMPLATE PDF:

1. 📁 ONDE SALVAR O TEMPLATE:
   - Salve o arquivo "TEMPLATE_ABIATAR.pdf" na pasta "public" do projeto
   - Caminho: public/TEMPLATE_ABIATAR.pdf

2. 🔧 COMO USAR:
   - O sistema irá carregar automaticamente o template da pasta public
   - Os campos serão preenchidos automaticamente com os dados extraídos
   - O arquivo final será baixado como "Ficha_[NomeCliente]_[Empreendimento].pdf"

3. ✅ CAMPOS SUPORTADOS:
   - DATA, EMPREENDIMENTO
   - NOME, CPF, RG, UF, NACIONALIDADE, ESTADOCIVIL, NATURALIDADE, DATANASC
   - PROFISSAO, RENDA, EMAIL, TELEFONE
   - ENDERECO, COMPLEMENTO, BAIRRO, CEP, CIDADE
   - Campos do cônjuge (NOME2, CPF2, etc.) quando aplicável

4. 📝 FORMATO DOS DADOS:
   - Todos os textos serão convertidos para MAIÚSCULAS
   - Datas no formato DD/MM/AAAA
   - Valores monetários no formato R$ X.XXX,XX

IMPORTANTE: Certifique-se de que o template PDF possui campos de formulário 
com os nomes exatos listados acima para o preenchimento funcionar corretamente.
    `;
  }
}

export default new TemplatePdfService();
