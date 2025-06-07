
import { GoogleGenerativeAI } from '@google/generative-ai';

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

class GeminiOCRService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI('AIzaSyAtaf1Kqxa9gUihXwTRS1gj0jG4eO4UJFU');
  }

  private async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async extractDataWithGemini(file: File, prompt: string): Promise<any> {
    try {
      console.log('=== INICIANDO GEMINI OCR ===');
      console.log('Arquivo:', file.name, 'Tamanho:', file.size, 'bytes');
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const base64Data = await this.convertFileToBase64(file);
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log('=== RESPOSTA DO GEMINI ===');
      console.log(text);
      
      // Tentar fazer parse do JSON retornado
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('Erro ao fazer parse do JSON, tentando extrair manualmente');
      }
      
      return this.parseTextResponse(text);
    } catch (error) {
      console.error('Erro no Gemini OCR:', error);
      throw new Error('Falha na extração de dados do documento');
    }
  }

  private parseTextResponse(text: string): any {
    // Fallback para extrair dados do texto se não vier em JSON
    const lines = text.split('\n');
    const data: any = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim());
        const normalizedKey = key.toLowerCase()
          .replace(/\s+/g, '')
          .replace('nome', 'nomeCompleto')
          .replace('salário', 'salarioBruto')
          .replace('endereço', 'logradouro');
        
        if (value && value !== '-' && value !== 'N/A') {
          data[normalizedKey] = value;
        }
      }
    });
    
    return data;
  }

  async extractFromRG(file: File): Promise<Partial<ExtractedPersonalData>> {
    const prompt = `
Analise este documento de RG/Identidade e extraia as seguintes informações em formato JSON:

{
  "nomeCompleto": "nome completo da pessoa",
  "rg": "número do RG (formato: XX.XXX.XXX-X)",
  "cpf": "número do CPF se presente (formato: XXX.XXX.XXX-XX)",
  "dataNascimento": "data de nascimento (formato: DD/MM/AAAA)",
  "naturalidade": "cidade/estado de nascimento",
  "estadoCivil": "estado civil (SOLTEIRO, CASADO, DIVORCIADO, VIÚVO)",
  "orgaoEmissor": "órgão emissor (ex: SSP-SP, IFP-RJ)"
}

Se algum campo não estiver visível ou legível, use string vazia "". Retorne apenas o JSON, sem texto adicional.
    `;

    const extracted = await this.extractDataWithGemini(file, prompt);
    
    console.log('=== DADOS EXTRAÍDOS DO RG (GEMINI) ===');
    console.log(extracted);
    
    return extracted;
  }

  async extractFromPaySlip(file: File): Promise<Partial<ExtractedProfessionalData>> {
    const prompt = `
Analise este holerite/comprovante de pagamento e extraia as seguintes informações em formato JSON:

{
  "empresa": "nome da empresa/empregador",
  "cargo": "cargo/função do funcionário",
  "salarioBruto": "salário bruto (formato: R$ X.XXX,XX)",
  "dataAdmissao": "data de admissão (formato: DD/MM/AAAA)"
}

Se algum campo não estiver visível ou legível, use string vazia "". Retorne apenas o JSON, sem texto adicional.
    `;

    const extracted = await this.extractDataWithGemini(file, prompt);
    
    console.log('=== DADOS EXTRAÍDOS DO HOLERITE (GEMINI) ===');
    console.log(extracted);
    
    return extracted;
  }

  async extractFromAddressProof(file: File): Promise<Partial<ExtractedAddressData>> {
    const prompt = `
Analise este comprovante de residência e extraia as seguintes informações em formato JSON:

{
  "logradouro": "endereço completo (rua, número, complemento)",
  "bairro": "bairro",
  "cidade": "cidade",
  "estado": "estado (sigla de 2 letras)",
  "cep": "CEP (formato: XXXXX-XXX)"
}

Se algum campo não estiver visível ou legível, use string vazia "". Retorne apenas o JSON, sem texto adicional.
    `;

    const extracted = await this.extractDataWithGemini(file, prompt);
    
    console.log('=== DADOS EXTRAÍDOS DO COMPROVANTE DE ENDEREÇO (GEMINI) ===');
    console.log(extracted);
    
    return extracted;
  }

  async extractFromCertificate(file: File): Promise<Partial<ExtractedParentsData>> {
    const prompt = `
Analise esta certidão e extraia as seguintes informações em formato JSON:

{
  "nomePai": "nome completo do pai",
  "nomeMae": "nome completo da mãe"
}

Se algum campo não estiver visível ou legível, use string vazia "". Retorne apenas o JSON, sem texto adicional.
    `;

    const extracted = await this.extractDataWithGemini(file, prompt);
    
    console.log('=== DADOS EXTRAÍDOS DA CERTIDÃO (GEMINI) ===');
    console.log(extracted);
    
    return extracted;
  }

  async hasIncomeTaxDeduction(file: File): Promise<boolean> {
    try {
      const prompt = `
Analise este holerite e responda apenas "SIM" ou "NÃO":
Há desconto de Imposto de Renda (IRRF) neste documento?
      `;
      
      const result = await this.extractDataWithGemini(file, prompt);
      const hasIR = typeof result === 'string' ? result.toUpperCase().includes('SIM') : false;
      
      console.log('Desconto de IR detectado (Gemini):', hasIR);
      return hasIR;
    } catch (error) {
      console.error('Erro ao verificar desconto de IR:', error);
      return false;
    }
  }

  async isCompletePayment(file: File): Promise<boolean> {
    try {
      const prompt = `
Analise este holerite e responda apenas "SIM" ou "NÃO":
Este é um pagamento completo (não é vale ou adiantamento)?
      `;
      
      const result = await this.extractDataWithGemini(file, prompt);
      const isComplete = typeof result === 'string' ? result.toUpperCase().includes('SIM') : true;
      
      console.log('É pagamento completo (Gemini):', isComplete);
      return isComplete;
    } catch (error) {
      console.error('Erro ao verificar tipo de pagamento:', error);
      return true;
    }
  }

  async extractReferenceMonth(file: File): Promise<string> {
    try {
      const prompt = `
Analise este holerite e extraia apenas o mês de referência no formato "MM/AAAA" ou "Mês/AAAA".
Se não encontrar, retorne string vazia.
      `;
      
      const result = await this.extractDataWithGemini(file, prompt);
      const month = typeof result === 'string' ? result.trim() : '';
      
      console.log('Mês de referência (Gemini):', month);
      return month;
    } catch (error) {
      console.error('Erro ao extrair mês de referência:', error);
      return '';
    }
  }

  async fallbackExtraction(file: File): Promise<any> {
    console.log('=== ATENÇÃO: USANDO DADOS FALLBACK (GEMINI) ===');
    console.log('Arquivo que falhou:', file.name);
    
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
    
    console.log('=== DADOS FALLBACK (GEMINI) ===');
    console.log(fallbackData);
    
    return fallbackData;
  }
}

export default new GeminiOCRService();
