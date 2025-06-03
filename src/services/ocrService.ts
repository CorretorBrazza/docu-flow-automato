
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
      const result = await Tesseract.recognize(file, 'por', {
        logger: m => console.log(m)
      });
      return result.data.text;
    } catch (error) {
      console.error('Erro no OCR:', error);
      return '';
    }
  }

  async extractFromRG(file: File): Promise<Partial<ExtractedPersonalData>> {
    const text = await this.extractTextFromFile(file);
    
    // Regex patterns para extrair dados do RG
    const nomeMatch = text.match(/NOME[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)/i);
    const rgMatch = text.match(/RG[\s:]*(\d{1,2}\.?\d{3}\.?\d{3}-?\d)/i) || 
                   text.match(/(\d{1,2}\.?\d{3}\.?\d{3}-?\d)/);
    const cpfMatch = text.match(/CPF[\s:]*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i);
    const nascimentoMatch = text.match(/NASCIMENTO[\s:]*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                           text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const naturalidadeMatch = text.match(/NATURALIDADE[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\-]+)/i);
    const orgaoMatch = text.match(/(SSP-[A-Z]{2})/i);
    
    // Detectar estado civil pelo verso do RG
    let estadoCivil = 'SOLTEIRO';
    if (text.includes('CC') || text.includes('CASAMENTO')) {
      estadoCivil = 'CASADO';
    } else if (text.includes('CN') || text.includes('NASCIMENTO')) {
      estadoCivil = 'SOLTEIRO';
    }

    return {
      nomeCompleto: nomeMatch?.[1]?.trim().toUpperCase() || '',
      rg: rgMatch?.[1] || '',
      cpf: cpfMatch?.[1] || '',
      dataNascimento: nascimentoMatch?.[1] || '',
      naturalidade: naturalidadeMatch?.[1]?.trim().toUpperCase() || '',
      estadoCivil,
      orgaoEmissor: orgaoMatch?.[1] || ''
    };
  }

  async extractFromPaySlip(file: File): Promise<Partial<ExtractedProfessionalData>> {
    const text = await this.extractTextFromFile(file);
    
    const empresaMatch = text.match(/EMPRESA[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\.]+)/i) ||
                        text.match(/RAZÃO SOCIAL[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\.]+)/i);
    const cargoMatch = text.match(/CARGO[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)/i) ||
                      text.match(/FUNÇÃO[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)/i);
    const salarioMatch = text.match(/SALÁRIO[\s:]*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i) ||
                        text.match(/BRUTO[\s:]*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
    const admissaoMatch = text.match(/ADMISSÃO[\s:]*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    const enderecoMatch = text.match(/ENDEREÇO[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\d\,\.]+)/i);

    return {
      empresa: empresaMatch?.[1]?.trim().toUpperCase() || '',
      endereco: enderecoMatch?.[1]?.trim().toUpperCase(),
      cargo: cargoMatch?.[1]?.trim().toUpperCase() || '',
      salarioBruto: salarioMatch?.[1] ? `R$ ${salarioMatch[1]}` : '',
      dataAdmissao: admissaoMatch?.[1] || ''
    };
  }

  async extractFromAddressProof(file: File): Promise<Partial<ExtractedAddressData>> {
    const text = await this.extractTextFromFile(file);
    
    const cepMatch = text.match(/(\d{5}-?\d{3})/);
    const enderecoMatch = text.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\d\,\.]+)\s*-?\s*\d{5}-?\d{3}/i);
    const bairroMatch = text.match(/BAIRRO[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)/i);
    const cidadeMatch = text.match(/CIDADE[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)/i) ||
                       text.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)\s*-\s*[A-Z]{2}/);
    const estadoMatch = text.match(/([A-Z]{2})$/m) || text.match(/ESTADO[\s:]*([A-Z]{2})/i);

    return {
      logradouro: enderecoMatch?.[1]?.trim().toUpperCase() || '',
      bairro: bairroMatch?.[1]?.trim().toUpperCase() || '',
      cidade: cidadeMatch?.[1]?.trim().toUpperCase() || '',
      estado: estadoMatch?.[1]?.toUpperCase() || '',
      cep: cepMatch?.[1] || ''
    };
  }

  async extractFromCertificate(file: File): Promise<Partial<ExtractedParentsData>> {
    const text = await this.extractTextFromFile(file);
    
    const paiMatch = text.match(/PAI[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)/i);
    const maeMatch = text.match(/MÃE[\s:]*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)/i);

    return {
      nomePai: paiMatch?.[1]?.trim().toUpperCase(),
      nomeMae: maeMatch?.[1]?.trim().toUpperCase()
    };
  }

  // Método para detectar se comprovante de pagamento tem desconto de IR
  async hasIncomeTaxDeduction(file: File): Promise<boolean> {
    const text = await this.extractTextFromFile(file);
    const irKeywords = ['Base Calculo IRRF', 'Base I.R.R.F', 'IMPOSTO RENDA', 'I.R.R.F'];
    
    return irKeywords.some(keyword => 
      text.toUpperCase().includes(keyword.toUpperCase())
    );
  }

  // Método para verificar se é pagamento completo
  async isCompletePayment(file: File): Promise<boolean> {
    const text = await this.extractTextFromFile(file);
    const completePaymentKeywords = ['ADIANTAMENTO', 'VALE'];
    
    return completePaymentKeywords.some(keyword => 
      text.toUpperCase().includes(keyword.toUpperCase())
    );
  }

  // Método para extrair mês de referência
  async extractReferenceMonth(file: File): Promise<string> {
    const text = await this.extractTextFromFile(file);
    const monthMatch = text.match(/(\w+\/\d{4})/i) || text.match(/(\d{2}\/\d{4})/);
    
    return monthMatch?.[1] || '';
  }
}

export default new OCRService();
