import Tesseract from 'tesseract.js';

export interface ExtractedPersonalData {
  nomeCompleto: string;
  rg: string;
  cpf: string;
  dataNascimento: string;
  naturalidade: string;
  estadoCivil: string;
  orgaoEmissor: string;
}

export interface ExtractedProfessionalData {
  empresa: string;
  endereco?: string;
  cargo: string;
  salarioBruto: string;
  dataAdmissao: string;
}

export interface ExtractedAddressData {
  logradouro: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface ExtractedParentsData {
  nomePai?: string;
  nomeMae?: string;
}

class OCRService {
  private async extractTextFromFile(file: File): Promise<string> {
    try {
      console.log('=== INICIANDO OCR ===');
      console.log('Arquivo:', file.name, 'Tamanho:', file.size, 'bytes');
      
      const result = await Tesseract.recognize(file, 'por', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      console.log('=== TEXTO EXTRAÍDO VIA OCR ===');
      console.log(result.data.text);
      console.log('=== FIM DO TEXTO ===');
      
      return result.data.text;
    } catch (error) {
      console.error('Erro no OCR:', error);
      throw new Error('Falha na extração de texto do documento');
    }
  }

  private isValidExtractedData(data: any): boolean {
    // Verificar se pelo menos um campo importante foi extraído e não é vazio
    const hasValidName = data.nomeCompleto && data.nomeCompleto.length > 3 && !data.nomeCompleto.includes('EXEMPLO');
    const hasValidDoc = (data.rg && data.rg.length > 5) || (data.cpf && data.cpf.length > 8);
    const hasValidCompany = data.empresa && data.empresa.length > 3 && !data.empresa.includes('EXEMPLO');
    const hasValidAddress = data.logradouro && data.logradouro.length > 5;
    
    return hasValidName || hasValidDoc || hasValidCompany || hasValidAddress;
  }

  async extractFromRG(file: File): Promise<Partial<ExtractedPersonalData>> {
    const text = await this.extractTextFromFile(file);
    console.log('=== PROCESSANDO RG ===');
    
    // Patterns mais flexíveis para capturar diferentes formatos
    const patterns = {
      nome: [
        /(?:NOME|Nome|TITULAR)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{5,})/i,
        /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{10,})$/m,
        /NOME[\s\S]*?([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{10,})/i
      ],
      rg: [
        /(?:RG|R\.G\.|REGISTRO|Registro)[\s:]*(\d{1,2}\.?\d{3}\.?\d{3}[-\s]?\d)/i,
        /(\d{1,2}\.?\d{3}\.?\d{3}[-\s]?\d)/,
        /(\d{8,9})/
      ],
      cpf: [
        /(?:CPF|C\.P\.F\.)[\s:]*(\d{3}\.?\d{3}\.?\d{3}[-\s]?\d{2})/i,
        /(\d{3}\.?\d{3}\.?\d{3}[-\s]?\d{2})/,
        /(\d{11})/
      ],
      nascimento: [
        /(?:NASCIMENTO|Data.*nascimento|Nasc\.|BORN)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
      ],
      naturalidade: [
        /(?:NATURALIDADE|Natural|LUGAR)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\-]{3,})/i,
        /(?:NATURAL DE|NASCEU EM)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\-]{3,})/i
      ],
      orgao: [
        /(SSP[-\s]?[A-Z]{2}|IFP[-\s]?[A-Z]{2}|PC[-\s]?[A-Z]{2}|DETRAN[-\s]?[A-Z]{2})/i,
        /ÓRGÃO[\s:]*([A-Z]{2,})/i
      ]
    };

    // Tentar extrair cada campo com múltiplos patterns
    const extractField = (fieldPatterns: RegExp[]) => {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return '';
    };

    const nomeCompleto = extractField(patterns.nome);
    const rg = extractField(patterns.rg);
    const cpf = extractField(patterns.cpf);
    const dataNascimento = extractField(patterns.nascimento);
    const naturalidade = extractField(patterns.naturalidade);
    const orgaoEmissor = extractField(patterns.orgao);
    
    // Detectar estado civil
    let estadoCivil = 'SOLTEIRO';
    const textUpper = text.toUpperCase();
    if (textUpper.includes('CASAD') || textUpper.includes('CASAMENT')) {
      estadoCivil = 'CASADO';
    } else if (textUpper.includes('DIVORC')) {
      estadoCivil = 'DIVORCIADO';
    } else if (textUpper.includes('VIUV')) {
      estadoCivil = 'VIÚVO';
    }

    const extracted = {
      nomeCompleto: nomeCompleto.toUpperCase(),
      rg: rg ? rg.replace(/[\s\-\.]/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4') : '',
      cpf: cpf ? cpf.replace(/[\s\-\.]/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '',
      dataNascimento: dataNascimento.replace(/[-]/g, '/'),
      naturalidade: naturalidade.toUpperCase(),
      estadoCivil,
      orgaoEmissor: orgaoEmissor.toUpperCase()
    };

    console.log('=== DADOS EXTRAÍDOS DO RG ===');
    console.log(extracted);
    console.log('=== VALIDAÇÃO ===');
    console.log('É válido:', this.isValidExtractedData(extracted));

    return extracted;
  }

  async extractFromPaySlip(file: File): Promise<Partial<ExtractedProfessionalData>> {
    const text = await this.extractTextFromFile(file);
    console.log('=== PROCESSANDO HOLERITE ===');
    
    const patterns = {
      empresa: [
        /(?:EMPRESA|EMPREGADOR|RAZÃO SOCIAL|CNPJ)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\.\&\-]{5,})/i,
        /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\.\&\-]{10,})$/m
      ],
      cargo: [
        /(?:CARGO|FUNÇÃO|OCUPAÇÃO|ATIVIDADE)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i,
        /CBO[\s:]*\d+[\s\-]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i
      ],
      salario: [
        /(?:SALÁRIO|BRUTO|VENCIMENTO|TOTAL)[\s:]*R?\$?\s*(\d{1,3}(?:[.\s]\d{3})*,\d{2})/i,
        /R\$?\s*(\d{1,3}(?:[.\s]\d{3})*,\d{2})/,
        /(\d{1,3}(?:[.\s]\d{3})*,\d{2})/
      ],
      admissao: [
        /(?:ADMISSÃO|ADMITIDO|CONTRATAÇÃO|ENTRADA)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
        /DATA ADMISS[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i
      ]
    };

    const extractField = (fieldPatterns: RegExp[]) => {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return '';
    };

    const empresa = extractField(patterns.empresa);
    const cargo = extractField(patterns.cargo);
    const salario = extractField(patterns.salario);
    const admissao = extractField(patterns.admissao);

    const extracted = {
      empresa: empresa.toUpperCase(),
      cargo: cargo.toUpperCase(),
      salarioBruto: salario ? `R$ ${salario}` : '',
      dataAdmissao: admissao.replace(/[-]/g, '/')
    };

    console.log('=== DADOS EXTRAÍDOS DO HOLERITE ===');
    console.log(extracted);
    console.log('=== VALIDAÇÃO ===');
    console.log('É válido:', this.isValidExtractedData(extracted));

    return extracted;
  }

  async extractFromAddressProof(file: File): Promise<Partial<ExtractedAddressData>> {
    const text = await this.extractTextFromFile(file);
    console.log('=== PROCESSANDO COMPROVANTE DE ENDEREÇO ===');
    
    const patterns = {
      cep: [/(\d{5}[-\s]?\d{3})/],
      endereco: [
        /(?:RUA|AV|AVENIDA|PRAÇA|ALAMEDA|ESTRADA|R\.|AV\.)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\d\,\.\-]{5,})/i,
        /ENDEREÇO[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\d\,\.\-]{10,})/i
      ],
      bairro: [
        /(?:BAIRRO|B\.)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i
      ],
      cidade: [
        /([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)\s*-\s*([A-Z]{2})/,
        /CIDADE[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i
      ]
    };

    const extractField = (fieldPatterns: RegExp[]) => {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return '';
    };

    const cep = extractField(patterns.cep);
    const logradouro = extractField(patterns.endereco);
    const bairro = extractField(patterns.bairro);
    
    // Para cidade/estado, tentar o pattern especial
    const cidadeEstadoMatch = text.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)\s*-\s*([A-Z]{2})/);
    const cidade = cidadeEstadoMatch ? cidadeEstadoMatch[1].trim() : '';
    const estado = cidadeEstadoMatch ? cidadeEstadoMatch[2] : '';

    const extracted = {
      logradouro: logradouro.toUpperCase(),
      bairro: bairro.toUpperCase(),
      cidade: cidade.toUpperCase(),
      estado: estado.toUpperCase(),
      cep: cep ? cep.replace(/[-\s]/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') : ''
    };

    console.log('=== DADOS EXTRAÍDOS DO COMPROVANTE DE ENDEREÇO ===');
    console.log(extracted);
    console.log('=== VALIDAÇÃO ===');
    console.log('É válido:', this.isValidExtractedData(extracted));

    return extracted;
  }

  async extractFromCertificate(file: File): Promise<Partial<ExtractedParentsData>> {
    const text = await this.extractTextFromFile(file);
    console.log('Processando certidão, texto:', text);
    
    const paiMatch = text.match(/(?:PAI|PATER)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i);
    const maeMatch = text.match(/(?:MÃE|MATER)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i);

    const extracted = {
      nomePai: paiMatch?.[1]?.trim().toUpperCase(),
      nomeMae: maeMatch?.[1]?.trim().toUpperCase()
    };

    console.log('Dados extraídos da certidão:', extracted);
    return extracted;
  }

  async hasIncomeTaxDeduction(file: File): Promise<boolean> {
    try {
      const text = await this.extractTextFromFile(file);
      const irKeywords = ['Base Calculo IRRF', 'Base I.R.R.F', 'IMPOSTO RENDA', 'I.R.R.F', 'IRRF'];
      
      const hasIR = irKeywords.some(keyword => 
        text.toUpperCase().includes(keyword.toUpperCase())
      );
      console.log('Desconto de IR detectado:', hasIR);
      return hasIR;
    } catch (error) {
      console.error('Erro ao verificar desconto de IR:', error);
      return false;
    }
  }

  async isCompletePayment(file: File): Promise<boolean> {
    try {
      const text = await this.extractTextFromFile(file);
      const partialPaymentKeywords = ['ADIANTAMENTO', 'VALE', 'PARCIAL'];
      
      const isPartial = partialPaymentKeywords.some(keyword => 
        text.toUpperCase().includes(keyword.toUpperCase())
      );
      console.log('É pagamento completo:', !isPartial);
      return !isPartial;
    } catch (error) {
      console.error('Erro ao verificar tipo de pagamento:', error);
      return true;
    }
  }

  async extractReferenceMonth(file: File): Promise<string> {
    try {
      const text = await this.extractTextFromFile(file);
      const monthMatch = text.match(/(?:REFERÊNCIA|REF|COMPETÊNCIA)[\s:]*(\w+\/\d{4}|\d{2}\/\d{4})/i) || 
                        text.match(/(\w+\/\d{4}|\d{2}\/\d{4})/);
      
      const result = monthMatch?.[1] || '';
      console.log('Mês de referência:', result);
      return result;
    } catch (error) {
      console.error('Erro ao extrair mês de referência:', error);
      return '';
    }
  }

  async fallbackExtraction(file: File): Promise<any> {
    console.log('=== ATENÇÃO: USANDO DADOS FALLBACK ===');
    console.log('Arquivo que falhou:', file.name);
    console.log('Isso significa que o OCR não conseguiu extrair dados válidos');
    
    const fallbackData = {
      dadosPessoais: {
        nomeCompleto: 'DADOS NÃO EXTRAÍDOS - VERIFICAR MANUALMENTE',
        rg: '',
        cpf: '',
        dataNascimento: '',
        naturalidade: '',
        estadoCivil: 'SOLTEIRO',
        orgaoEmissor: ''
      },
      dadosProfissionais: {
        empresa: 'DADOS NÃO EXTRAÍDOS - VERIFICAR MANUALMENTE',
        cargo: '',
        salarioBruto: '',
        dataAdmissao: ''
      },
      endereco: {
        logradouro: 'DADOS NÃO EXTRAÍDOS - VERIFICAR MANUALMENTE',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      }
    };
    
    console.log('=== DADOS FALLBACK ===');
    console.log(fallbackData);
    
    return fallbackData;
  }
}

export default new OCRService();
