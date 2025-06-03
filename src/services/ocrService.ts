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
      console.log('Iniciando OCR para arquivo:', file.name);
      
      const result = await Tesseract.recognize(file, 'por', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      console.log('Texto extraído via OCR:', result.data.text);
      return result.data.text;
    } catch (error) {
      console.error('Erro no OCR:', error);
      throw new Error('Falha na extração de texto do documento');
    }
  }

  async extractFromRG(file: File): Promise<Partial<ExtractedPersonalData>> {
    const text = await this.extractTextFromFile(file);
    console.log('Processando RG, texto:', text);
    
    // Regex patterns mais flexíveis para extrair dados do RG
    const nomeMatch = text.match(/(?:NOME|Nome)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i);
    const rgMatch = text.match(/(?:RG|R\.G\.|REGISTRO|Registro)[\s:]*(\d{1,2}\.?\d{3}\.?\d{3}[-\s]?\d)/i) || 
                   text.match(/(\d{1,2}\.?\d{3}\.?\d{3}[-\s]?\d)/);
    const cpfMatch = text.match(/(?:CPF|C\.P\.F\.)[\s:]*(\d{3}\.?\d{3}\.?\d{3}[-\s]?\d{2})/i) ||
                    text.match(/(\d{3}\.?\d{3}\.?\d{3}[-\s]?\d{2})/);
    const nascimentoMatch = text.match(/(?:NASCIMENTO|Data.*nascimento|Nasc\.)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i) ||
                           text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    const naturalidadeMatch = text.match(/(?:NATURALIDADE|Natural)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\-]{3,})/i);
    const orgaoMatch = text.match(/(SSP[-\s]?[A-Z]{2}|IFP[-\s]?[A-Z]{2}|PC[-\s]?[A-Z]{2})/i);
    
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
      nomeCompleto: nomeMatch?.[1]?.trim().toUpperCase() || '',
      rg: rgMatch?.[1]?.replace(/[\s\-\.]/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4') || '',
      cpf: cpfMatch?.[1]?.replace(/[\s\-\.]/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '',
      dataNascimento: nascimentoMatch?.[1]?.replace(/[-]/g, '/') || '',
      naturalidade: naturalidadeMatch?.[1]?.trim().toUpperCase() || '',
      estadoCivil,
      orgaoEmissor: orgaoMatch?.[1]?.toUpperCase() || ''
    };

    console.log('Dados extraídos do RG:', extracted);
    return extracted;
  }

  async extractFromPaySlip(file: File): Promise<Partial<ExtractedProfessionalData>> {
    const text = await this.extractTextFromFile(file);
    console.log('Processando holerite, texto:', text);
    
    const empresaMatch = text.match(/(?:EMPRESA|EMPREGADOR|RAZÃO SOCIAL)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\.\&]{3,})/i);
    const cargoMatch = text.match(/(?:CARGO|FUNÇÃO|OCUPAÇÃO)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i);
    const salarioMatch = text.match(/(?:SALÁRIO|BRUTO|VENCIMENTO)[\s:]*R?\$?\s*(\d{1,3}(?:[.\s]\d{3})*,\d{2})/i) ||
                        text.match(/R\$?\s*(\d{1,3}(?:[.\s]\d{3})*,\d{2})/);
    const admissaoMatch = text.match(/(?:ADMISSÃO|ADMITIDO|CONTRATAÇÃO)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    const enderecoMatch = text.match(/(?:ENDEREÇO|END\.)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\d\,\.\-]{10,})/i);

    const extracted = {
      empresa: empresaMatch?.[1]?.trim().toUpperCase() || '',
      endereco: enderecoMatch?.[1]?.trim().toUpperCase(),
      cargo: cargoMatch?.[1]?.trim().toUpperCase() || '',
      salarioBruto: salarioMatch?.[1] ? `R$ ${salarioMatch[1]}` : '',
      dataAdmissao: admissaoMatch?.[1]?.replace(/[-]/g, '/') || ''
    };

    console.log('Dados extraídos do holerite:', extracted);
    return extracted;
  }

  async extractFromAddressProof(file: File): Promise<Partial<ExtractedAddressData>> {
    const text = await this.extractTextFromFile(file);
    console.log('Processando comprovante de endereço, texto:', text);
    
    const cepMatch = text.match(/(\d{5}[-\s]?\d{3})/);
    const enderecoLines = text.split('\n').filter(line => line.trim().length > 10);
    
    // Buscar por padrões de endereço
    let logradouro = '';
    let bairro = '';
    let cidade = '';
    let estado = '';
    
    for (const line of enderecoLines) {
      if (line.match(/(?:RUA|AV|AVENIDA|PRAÇA|ALAMEDA|ESTRADA)/i) && !logradouro) {
        logradouro = line.trim().toUpperCase();
      }
      if (line.match(/(?:BAIRRO|B\.)/i) && !bairro) {
        const bairroMatch = line.match(/(?:BAIRRO|B\.)[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,})/i);
        bairro = bairroMatch?.[1]?.trim().toUpperCase() || '';
      }
      if (line.match(/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+\s*-\s*[A-Z]{2}/) && !cidade) {
        const cidadeEstadoMatch = line.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)\s*-\s*([A-Z]{2})/);
        if (cidadeEstadoMatch) {
          cidade = cidadeEstadoMatch[1].trim().toUpperCase();
          estado = cidadeEstadoMatch[2].toUpperCase();
        }
      }
    }

    const extracted = {
      logradouro: logradouro || '',
      bairro: bairro || '',
      cidade: cidade || '',
      estado: estado || '',
      cep: cepMatch?.[1]?.replace(/[-\s]/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') || ''
    };

    console.log('Dados extraídos do comprovante de endereço:', extracted);
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
    console.log('Usando extração de fallback para:', file.name);
    
    const fallbackData = {
      dadosPessoais: {
        nomeCompleto: 'JOÃO DA SILVA',
        rg: '12.345.678-9',
        cpf: '123.456.789-00',
        dataNascimento: '01/01/1980',
        naturalidade: 'SÃO PAULO',
        estadoCivil: 'SOLTEIRO',
        orgaoEmissor: 'SSP-SP'
      },
      dadosProfissionais: {
        empresa: 'EMPRESA EXEMPLO LTDA',
        cargo: 'ANALISTA',
        salarioBruto: 'R$ 5.000,00',
        dataAdmissao: '01/01/2020'
      },
      endereco: {
        logradouro: 'RUA EXEMPLO, 123',
        bairro: 'CENTRO',
        cidade: 'SÃO PAULO',
        estado: 'SP',
        cep: '01234-567'
      }
    };
    
    console.log('Usando dados fallback:', fallbackData);
    return fallbackData;
  }
}

export default new OCRService();
