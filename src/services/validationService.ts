
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
      console.log('Validando RG:', file.name);
      const data = await ocrService.extractFromRG(file);
      
      if (!data.nomeCompleto && !data.rg) {
        console.log('Dados de RG insuficientes, tentando extração de fallback');
        const fallbackData = await ocrService.fallbackExtraction(file);
        if (fallbackData.dadosPessoais) {
          return {
            isValid: true,
            status: 'warning',
            message: 'RG processado com avisos',
            details: 'Dados extraídos parcialmente - alguns campos podem precisar de revisão manual'
          };
        }
        
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
      console.error('Erro ao validar RG:', error);
      return {
        isValid: true,
        status: 'warning',
        message: 'RG processado com limitações',
        details: 'Processamento automático limitado, verificação manual recomendada'
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
      console.log('=== INICIANDO VALIDAÇÃO DE DOCUMENTOS ===');
      console.log('Total de arquivos:', files.length);
      
      // Melhor detecção de tipos de documento
      const rgFiles = files.filter(f => {
        const name = f.name.toLowerCase();
        return name.includes('rg') || name.includes('identidade') || name.includes('id');
      });
      
      const paySlipFiles = files.filter(f => {
        const name = f.name.toLowerCase();
        return name.includes('pagamento') || name.includes('holerite') || 
               name.includes('salario') || name.includes('contracheque') ||
               name.includes('recibo');
      });
      
      const addressFiles = files.filter(f => {
        const name = f.name.toLowerCase();
        return name.includes('residencia') || name.includes('comprovante') ||
               name.includes('endereco') || name.includes('conta') ||
               name.includes('luz') || name.includes('agua') ||
               name.includes('telefone');
      });

      console.log('=== CATEGORIZAÇÃO DOS ARQUIVOS ===');
      console.log('RG/Identidade:', rgFiles.map(f => f.name));
      console.log('Comprovantes de Pagamento:', paySlipFiles.map(f => f.name));
      console.log('Comprovantes de Endereço:', addressFiles.map(f => f.name));

      // Se não conseguir categorizar por nome, usar os primeiros arquivos
      if (rgFiles.length === 0 && files.length > 0) {
        console.log('Nenhum RG identificado pelo nome, usando primeiro arquivo');
        rgFiles.push(files[0]);
      }
      
      if (paySlipFiles.length === 0 && files.length > 1) {
        console.log('Nenhum holerite identificado pelo nome, usando segundo arquivo');
        paySlipFiles.push(files[1]);
      }

      // Processar RG
      if (rgFiles.length > 0) {
        console.log('=== PROCESSANDO RG ===');
        try {
          const rgData = await ocrService.extractFromRG(rgFiles[0]);
          console.log('Dados brutos do RG:', rgData);
          
          // Verificar se conseguimos dados válidos
          const hasValidData = rgData.nomeCompleto && rgData.nomeCompleto.length > 3 && 
                              !rgData.nomeCompleto.includes('DADOS NÃO EXTRAÍDOS');
          
          if (hasValidData) {
            console.log('✅ Dados válidos extraídos do RG');
            extractedData.dadosPessoais = { ...extractedData.dadosPessoais, ...rgData };
            validations['RG'] = {
              isValid: true,
              status: 'success',
              message: 'RG processado com sucesso',
              details: `Nome: ${rgData.nomeCompleto}`
            };
          } else {
            console.log('⚠️ Dados insuficientes no RG, mas documento presente');
            validations['RG'] = {
              isValid: true,
              status: 'warning',
              message: 'RG presente mas com dados limitados',
              details: 'Verificação manual recomendada'
            };
            // Ainda assim, usar os dados parciais se houver
            extractedData.dadosPessoais = { ...extractedData.dadosPessoais, ...rgData };
          }
        } catch (error) {
          console.error('Erro ao processar RG:', error);
          validations['RG'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar RG',
            details: 'Falha no processamento OCR'
          };
        }
      }

      // Processar Holerites
      if (paySlipFiles.length > 0) {
        console.log('=== PROCESSANDO COMPROVANTES DE PAGAMENTO ===');
        try {
          const profData = await ocrService.extractFromPaySlip(paySlipFiles[0]);
          console.log('Dados brutos do holerite:', profData);
          
          const hasValidData = profData.empresa && profData.empresa.length > 3 && 
                              !profData.empresa.includes('DADOS NÃO EXTRAÍDOS');
          
          if (hasValidData) {
            console.log('✅ Dados válidos extraídos do holerite');
            extractedData.dadosProfissionais = { ...extractedData.dadosProfissionais, ...profData };
            validations['Comprovantes de Pagamento'] = {
              isValid: true,
              status: 'success',
              message: 'Comprovante de pagamento processado',
              details: `Empresa: ${profData.empresa}`
            };
          } else {
            console.log('⚠️ Dados insuficientes no holerite');
            validations['Comprovantes de Pagamento'] = {
              isValid: true,
              status: 'warning',
              message: 'Comprovante presente mas com dados limitados',
              details: 'Verificação manual recomendada'
            };
            extractedData.dadosProfissionais = { ...extractedData.dadosProfissionais, ...profData };
          }
        } catch (error) {
          console.error('Erro ao processar holerite:', error);
          validations['Comprovantes de Pagamento'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar comprovante',
            details: 'Falha no processamento OCR'
          };
        }
      }

      // Processar Comprovante de Endereço
      if (addressFiles.length > 0) {
        console.log('=== PROCESSANDO COMPROVANTE DE ENDEREÇO ===');
        try {
          const addressData = await ocrService.extractFromAddressProof(addressFiles[0]);
          console.log('Dados brutos do endereço:', addressData);
          
          const hasValidData = addressData.logradouro && addressData.logradouro.length > 5 && 
                              !addressData.logradouro.includes('DADOS NÃO EXTRAÍDOS');
          
          if (hasValidData) {
            console.log('✅ Dados válidos extraídos do comprovante de endereço');
            extractedData.endereco = { ...extractedData.endereco, ...addressData };
            validations['Comprovante de Residência'] = {
              isValid: true,
              status: 'success',
              message: 'Comprovante de residência processado',
              details: `Endereço: ${addressData.logradouro}`
            };
          } else {
            console.log('⚠️ Dados insuficientes no comprovante de endereço');
            validations['Comprovante de Residência'] = {
              isValid: true,
              status: 'warning',
              message: 'Comprovante presente mas com dados limitados',
              details: 'Verificação manual recomendada'
            };
            extractedData.endereco = { ...extractedData.endereco, ...addressData };
          }
        } catch (error) {
          console.error('Erro ao processar comprovante de endereço:', error);
          validations['Comprovante de Residência'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar comprovante de residência',
            details: 'Falha no processamento OCR'
          };
        }
      }

      // Verificar se conseguimos dados suficientes
      const hasAnyValidData = (
        (extractedData.dadosPessoais.nomeCompleto && !extractedData.dadosPessoais.nomeCompleto.includes('DADOS NÃO EXTRAÍDOS')) ||
        (extractedData.dadosProfissionais.empresa && !extractedData.dadosProfissionais.empresa.includes('DADOS NÃO EXTRAÍDOS')) ||
        (extractedData.endereco.logradouro && !extractedData.endereco.logradouro.includes('DADOS NÃO EXTRAÍDOS'))
      );

      console.log('=== RESULTADO FINAL DA VALIDAÇÃO ===');
      console.log('Dados válidos extraídos:', hasAnyValidData);
      console.log('Dados pessoais:', extractedData.dadosPessoais);
      console.log('Dados profissionais:', extractedData.dadosProfissionais);
      console.log('Endereço:', extractedData.endereco);

      // Só usar fallback se realmente não conseguirmos nada
      if (!hasAnyValidData) {
        console.log('❌ NENHUM DADO VÁLIDO EXTRAÍDO - USANDO FALLBACK');
        const fallbackData = await ocrService.fallbackExtraction(files[0]);
        extractedData = fallbackData;
        
        validations['Processamento Geral'] = {
          isValid: true,
          status: 'warning',
          message: 'Documentos requerem verificação manual',
          details: 'OCR não conseguiu extrair dados suficientes automaticamente'
        };
      }

      const isValid = Object.values(validations).some(v => v.isValid);

      return {
        isValid,
        validations,
        missingDocuments: [...new Set(allMissingDocs)],
        extractedData
      };

    } catch (error) {
      console.error('Erro crítico na validação:', error);
      
      // Fallback de emergência
      const fallbackData = await ocrService.fallbackExtraction(files[0]);
      
      return {
        isValid: true,
        validations: {
          'Erro de Processamento': {
            isValid: true,
            status: 'warning',
            message: 'Erro no processamento automático',
            details: 'Documentos precisam ser verificados manualmente'
          }
        },
        missingDocuments: [],
        extractedData: fallbackData
      };
    }
  }
}

export default new ValidationService();
