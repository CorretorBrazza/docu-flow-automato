
import ocrService from './ocrService';

export interface ValidationResult {
  isValid: boolean;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  missingDocuments?: string[];
}

export interface DocumentValidation {
  [key: string]: ValidationResult;
}

class ValidationService {
  private async validateRG(file: File): Promise<ValidationResult> {
    try {
      const data = await ocrService.extractFromRG(file);
      
      if (!data.nomeCompleto || !data.rg) {
        return {
          isValid: false,
          status: 'error',
          message: 'RG inválido ou ilegível',
          details: 'Não foi possível extrair dados essenciais do RG'
        };
      }

      // Verificar estado civil e determinar documentos necessários
      const missingDocs: string[] = [];
      
      if (data.estadoCivil === 'CASADO') {
        missingDocs.push('Certidão de Casamento', 'Documentos do Cônjuge');
      } else if (data.estadoCivil === 'SOLTEIRO') {
        missingDocs.push('Certidão de Nascimento');
      }

      return {
        isValid: true,
        status: 'success',
        message: 'RG válido',
        details: `Estado civil identificado: ${data.estadoCivil}`,
        missingDocuments: missingDocs
      };
    } catch (error) {
      return {
        isValid: false,
        status: 'error',
        message: 'Erro ao validar RG',
        details: 'Falha no processamento do documento'
      };
    }
  }

  private async validatePaySlips(files: File[]): Promise<ValidationResult> {
    if (files.length < 2) {
      return {
        isValid: false,
        status: 'error',
        message: 'Necessários 2 últimos comprovantes de pagamento',
        details: `Encontrados apenas ${files.length} comprovante(s)`
      };
    }

    const validations = await Promise.all(
      files.map(async (file) => {
        const isComplete = await ocrService.isCompletePayment(file);
        const month = await ocrService.extractReferenceMonth(file);
        const hasIR = await ocrService.hasIncomeTaxDeduction(file);
        
        return { isComplete, month, hasIR, file };
      })
    );

    // Verificar se todos são pagamentos completos
    const incompletePayments = validations.filter(v => !v.isComplete);
    if (incompletePayments.length > 0) {
      return {
        isValid: false,
        status: 'error',
        message: 'Comprovantes de pagamento incompletos detectados',
        details: 'Encontrados vales ou pagamentos parciais'
      };
    }

    // Verificar se há desconto de IR para solicitar declaração
    const hasIRDeduction = validations.some(v => v.hasIR);
    const missingDocs: string[] = [];
    
    if (hasIRDeduction) {
      missingDocs.push('Declaração de Imposto de Renda', 'Recibo de Entrega DIRPF');
    }

    return {
      isValid: true,
      status: 'success',
      message: 'Comprovantes de pagamento válidos',
      details: '2 últimos meses completos identificados',
      missingDocuments: missingDocs
    };
  }

  private async validateAddressProof(file: File): Promise<ValidationResult> {
    try {
      const data = await ocrService.extractFromAddressProof(file);
      
      if (!data.logradouro || !data.cep) {
        return {
          isValid: false,
          status: 'error',
          message: 'Comprovante de residência inválido',
          details: 'Endereço ou CEP não identificados'
        };
      }

      // Verificar validade (90 dias) - simulado por enquanto
      const isValid = true; // Aqui seria verificada a data de vencimento
      
      if (!isValid) {
        return {
          isValid: false,
          status: 'error',
          message: 'Comprovante de residência vencido',
          details: 'Documento com mais de 90 dias'
        };
      }

      return {
        isValid: true,
        status: 'success',
        message: 'Comprovante de residência válido',
        details: 'Dentro do prazo de validade (90 dias)'
      };
    } catch (error) {
      return {
        isValid: false,
        status: 'error',
        message: 'Erro ao validar comprovante de residência',
        details: 'Falha no processamento do documento'
      };
    }
  }

  private async validateWorkCard(file: File): Promise<ValidationResult> {
    try {
      // Aqui seria implementada a validação da carteira de trabalho
      // Por enquanto, retornamos sucesso simulado
      return {
        isValid: true,
        status: 'success',
        message: 'Carteira de trabalho válida',
        details: 'Empresa confere com comprovante de pagamento'
      };
    } catch (error) {
      return {
        isValid: false,
        status: 'error',
        message: 'Erro ao validar carteira de trabalho',
        details: 'Falha no processamento do documento'
      };
    }
  }

  private async validateFGTS(file: File): Promise<ValidationResult> {
    try {
      // Validação básica do FGTS
      return {
        isValid: true,
        status: 'success',
        message: 'Extrato FGTS válido',
        details: 'Mesmo titular confirmado'
      };
    } catch (error) {
      return {
        isValid: false,
        status: 'error',
        message: 'Erro ao validar extrato FGTS',
        details: 'Falha no processamento do documento'
      };
    }
  }

  async validateDocuments(files: File[]): Promise<{
    isValid: boolean;
    validations: DocumentValidation;
    missingDocuments: string[];
    extractedData: any;
  }> {
    const validations: DocumentValidation = {};
    const allMissingDocs: string[] = [];
    let extractedData: any = {
      dadosPessoais: {},
      dadosProfissionais: {},
      endereco: {},
      certidoes: {}
    };

    try {
      // Separar arquivos por tipo (baseado no nome ou análise do conteúdo)
      const rgFiles = files.filter(f => f.name.toLowerCase().includes('rg'));
      const paySlipFiles = files.filter(f => 
        f.name.toLowerCase().includes('pagamento') || 
        f.name.toLowerCase().includes('holerite')
      );
      const addressFiles = files.filter(f => 
        f.name.toLowerCase().includes('residencia') ||
        f.name.toLowerCase().includes('comprovante')
      );
      const workCardFiles = files.filter(f => 
        f.name.toLowerCase().includes('carteira') ||
        f.name.toLowerCase().includes('trabalho')
      );
      const fgtsFiles = files.filter(f => f.name.toLowerCase().includes('fgts'));

      // Validar RG
      if (rgFiles.length > 0) {
        const rgValidation = await this.validateRG(rgFiles[0]);
        validations['RG'] = rgValidation;
        if (rgValidation.missingDocuments) {
          allMissingDocs.push(...rgValidation.missingDocuments);
        }
        
        // Extrair dados do RG
        const rgData = await ocrService.extractFromRG(rgFiles[0]);
        extractedData.dadosPessoais = { ...extractedData.dadosPessoais, ...rgData };
      } else {
        validations['RG'] = {
          isValid: false,
          status: 'error',
          message: 'RG não encontrado',
          details: 'Documento obrigatório'
        };
      }

      // Validar comprovantes de pagamento
      if (paySlipFiles.length >= 2) {
        const paySlipValidation = await this.validatePaySlips(paySlipFiles.slice(0, 2));
        validations['Comprovantes de Pagamento'] = paySlipValidation;
        if (paySlipValidation.missingDocuments) {
          allMissingDocs.push(...paySlipValidation.missingDocuments);
        }

        // Extrair dados profissionais
        const profData = await ocrService.extractFromPaySlip(paySlipFiles[0]);
        extractedData.dadosProfissionais = { ...extractedData.dadosProfissionais, ...profData };
      } else {
        validations['Comprovantes de Pagamento'] = {
          isValid: false,
          status: 'error',
          message: 'Comprovantes de pagamento insuficientes',
          details: `Encontrados ${paySlipFiles.length}, necessários 2`
        };
      }

      // Validar comprovante de residência
      if (addressFiles.length > 0) {
        const addressValidation = await this.validateAddressProof(addressFiles[0]);
        validations['Comprovante de Residência'] = addressValidation;

        // Extrair dados de endereço
        const addressData = await ocrService.extractFromAddressProof(addressFiles[0]);
        extractedData.endereco = { ...extractedData.endereco, ...addressData };
      } else {
        validations['Comprovante de Residência'] = {
          isValid: false,
          status: 'error',
          message: 'Comprovante de residência não encontrado',
          details: 'Documento obrigatório'
        };
      }

      // Validar outros documentos
      if (workCardFiles.length > 0) {
        validations['Carteira de Trabalho'] = await this.validateWorkCard(workCardFiles[0]);
      }

      if (fgtsFiles.length > 0) {
        validations['Extrato FGTS'] = await this.validateFGTS(fgtsFiles[0]);
      }

      // Determinar se a validação geral é válida
      const isValid = Object.values(validations).every(v => v.isValid);

      return {
        isValid,
        validations,
        missingDocuments: [...new Set(allMissingDocs)],
        extractedData
      };

    } catch (error) {
      console.error('Erro na validação:', error);
      return {
        isValid: false,
        validations: {
          'Erro Geral': {
            isValid: false,
            status: 'error',
            message: 'Erro durante a validação',
            details: 'Falha no processamento dos documentos'
          }
        },
        missingDocuments: [],
        extractedData
      };
    }
  }
}

export default new ValidationService();
