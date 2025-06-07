
import { GoogleGenerativeAI } from '@google/generative-ai';
import geminiOcrService from './geminiOcrService';

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

class GeminiValidationService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI('AIzaSyDMQuqrJL9CB54pSi7CMco2YL4Pgt6J9Os');
  }

  private async analyzeDocumentWithGemini(file: File, analysisType: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      };

      let prompt = '';
      
      switch (analysisType) {
        case 'document_type':
          prompt = `
Analise este documento e identifique o tipo EXATO. Procure por:

PARA RG/IDENTIDADE:
- Texto "IDENTIDADE", "RG", "CARTEIRA DE IDENTIDADE"
- Campos: Nome, RG, CPF, Data Nascimento, Filiação

PARA HOLERITE/FOLHA DE PAGAMENTO:
- Texto "FOLHA DE PAGAMENTO", "HOLERITE", "DEMONSTRATIVO"
- Campos: Empresa, Cargo, Salário, Descontos

PARA COMPROVANTE DE RESIDÊNCIA:
- Contas: "LIGHT", "ENEL", "CEG", "ÁGUAS", "CEDAE"
- Extratos bancários com endereço
- Texto "COMPROVANTE DE RESIDÊNCIA", "CONTA DE LUZ", "CONTA DE ÁGUA"
- Endereço completo visível

PARA CERTIDÃO:
- Texto "CERTIDÃO DE NASCIMENTO", "CERTIDÃO DE CASAMENTO"
- Cartório, registro civil

PARA DECLARAÇÃO IMPOSTO DE RENDA:
- Texto "DECLARAÇÃO", "IMPOSTO DE RENDA", "RECEITA FEDERAL"
- Ano-calendário, CPF

Responda APENAS uma das opções:
- RG
- HOLERITE  
- COMPROVANTE_ENDERECO
- CERTIDAO
- IMPOSTO_RENDA
- OUTROS
          `;
          break;
        case 'document_quality':
          prompt = `
Analise a qualidade deste documento e responda em formato JSON:
{
  "legivel": true/false,
  "completo": true/false,
  "qualidade": "alta/media/baixa",
  "problemas": ["lista de problemas encontrados"]
}
          `;
          break;
        case 'data_consistency':
          prompt = `
Analise se os dados neste documento são consistentes e válidos. Responda em formato JSON:
{
  "dadosConsistentes": true/false,
  "camposObrigatoriosPresentes": true/false,
  "formatosValidos": true/false,
  "observacoes": "observações sobre a validação"
}
          `;
          break;
      }

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log(`=== ANÁLISE GEMINI (${analysisType.toUpperCase()}) ===`);
      console.log(text);
      
      // Tentar fazer parse do JSON se esperado
      if (analysisType !== 'document_type') {
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.log('Erro ao fazer parse do JSON, usando texto bruto');
        }
      }
      
      return text.trim();
    } catch (error) {
      console.error('Erro na análise Gemini:', error);
      throw error;
    }
  }

  async validateDocuments(files: File[]): Promise<{
    isValid: boolean;
    validations: DocumentValidation;
    missingDocuments: string[];
    extractedData: any;
  }> {
    const validations: DocumentValidation = {};
    let extractedData: any = {
      dadosPessoais: {},
      dadosProfissionais: {},
      endereco: {},
      certidoes: {}
    };

    // DOCUMENTOS OBRIGATÓRIOS CHECKLIST
    const documentosObrigatorios = {
      RG: false,
      HOLERITE: false,
      COMPROVANTE_ENDERECO: false
    };

    try {
      console.log('=== INICIANDO VALIDAÇÃO GEMINI RIGOROSA ===');
      console.log('Total de arquivos:', files.length);
      
      // Categorizar documentos usando Gemini
      const fileCategories: { [key: string]: File[] } = {
        RG: [],
        HOLERITE: [],
        COMPROVANTE_ENDERECO: [],
        CERTIDAO: [],
        IMPOSTO_RENDA: [],
        OUTROS: []
      };

      // Analisar cada arquivo para determinar o tipo
      for (const file of files) {
        try {
          console.log(`Analisando arquivo: ${file.name}`);
          const documentType = await this.analyzeDocumentWithGemini(file, 'document_type');
          let category = documentType.toUpperCase().trim();
          
          // Normalizar categoria
          if (category.includes('COMPROVANTE') || category.includes('ENDERECO') || category.includes('RESIDENCIA')) {
            category = 'COMPROVANTE_ENDERECO';
          }
          
          if (fileCategories[category]) {
            fileCategories[category].push(file);
            // Marcar como encontrado no checklist
            if (documentosObrigatorios.hasOwnProperty(category)) {
              documentosObrigatorios[category as keyof typeof documentosObrigatorios] = true;
            }
          } else {
            fileCategories.OUTROS.push(file);
          }
          
          console.log(`Arquivo ${file.name} categorizado como: ${category}`);
        } catch (error) {
          console.error(`Erro ao categorizar ${file.name}:`, error);
          fileCategories.OUTROS.push(file);
        }
      }

      console.log('=== CATEGORIZAÇÃO FINAL ===');
      Object.entries(fileCategories).forEach(([category, files]) => {
        if (files.length > 0) {
          console.log(`${category}:`, files.map(f => f.name));
        }
      });

      console.log('=== CHECKLIST DOCUMENTOS OBRIGATÓRIOS ===');
      console.log('RG encontrado:', documentosObrigatorios.RG);
      console.log('HOLERITE encontrado:', documentosObrigatorios.HOLERITE);
      console.log('COMPROVANTE_ENDERECO encontrado:', documentosObrigatorios.COMPROVANTE_ENDERECO);

      // Processar RG
      if (fileCategories.RG.length > 0) {
        const rgFile = fileCategories.RG[0];
        try {
          const qualityAnalysis = await this.analyzeDocumentWithGemini(rgFile, 'document_quality');
          
          if (qualityAnalysis.legivel === false) {
            validations['RG'] = {
              isValid: false,
              status: 'error',
              message: 'RG ilegível ou de baixa qualidade',
              details: 'Documento não atende aos critérios de qualidade'
            };
          } else {
            const rgData = await geminiOcrService.extractFromRG(rgFile);
            const consistencyAnalysis = await this.analyzeDocumentWithGemini(rgFile, 'data_consistency');
            
            if (rgData.nomeCompleto && rgData.nomeCompleto.length > 3 && rgData.cpf) {
              extractedData.dadosPessoais = { ...extractedData.dadosPessoais, ...rgData };
              
              validations['RG'] = {
                isValid: true,
                status: 'success',
                message: 'RG validado com sucesso',
                details: `Nome: ${rgData.nomeCompleto} | CPF: ${rgData.cpf}`
              };
            } else {
              validations['RG'] = {
                isValid: false,
                status: 'error',
                message: 'RG com dados insuficientes',
                details: 'Nome completo e CPF são obrigatórios'
              };
            }
          }
        } catch (error) {
          validations['RG'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar RG',
            details: 'Falha no processamento do documento'
          };
        }
      }

      // Processar Holerites
      if (fileCategories.HOLERITE.length > 0) {
        const holerite = fileCategories.HOLERITE[0];
        try {
          const qualityAnalysis = await this.analyzeDocumentWithGemini(holerite, 'document_quality');
          
          if (qualityAnalysis.legivel === false) {
            validations['Comprovante de Renda'] = {
              isValid: false,
              status: 'error',
              message: 'Holerite ilegível',
              details: 'Documento de baixa qualidade'
            };
          } else {
            const profData = await geminiOcrService.extractFromPaySlip(holerite);
            
            if (profData.empresa && profData.empresa.length > 3 && profData.salarioBruto) {
              extractedData.dadosProfissionais = { ...extractedData.dadosProfissionais, ...profData };
              
              validations['Comprovante de Renda'] = {
                isValid: true,
                status: 'success',
                message: 'Comprovante de renda validado',
                details: `Empresa: ${profData.empresa} | Salário: ${profData.salarioBruto}`
              };
            } else {
              validations['Comprovante de Renda'] = {
                isValid: false,
                status: 'error',
                message: 'Holerite com dados insuficientes',
                details: 'Empresa e salário são obrigatórios'
              };
            }
          }
        } catch (error) {
          validations['Comprovante de Renda'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar holerite',
            details: 'Falha no processamento'
          };
        }
      }

      // Processar Comprovante de Endereço (CRÍTICO)
      if (fileCategories.COMPROVANTE_ENDERECO.length > 0) {
        const comprovante = fileCategories.COMPROVANTE_ENDERECO[0];
        try {
          const qualityAnalysis = await this.analyzeDocumentWithGemini(comprovante, 'document_quality');
          
          if (qualityAnalysis.legivel === false) {
            validations['Comprovante de Residência'] = {
              isValid: false,
              status: 'error',
              message: 'Comprovante de residência ilegível',
              details: 'Documento não atende critérios de qualidade'
            };
          } else {
            const addressData = await geminiOcrService.extractFromAddressProof(comprovante);
            
            if (addressData.logradouro && addressData.cidade && addressData.cep) {
              extractedData.endereco = { ...extractedData.endereco, ...addressData };
              
              validations['Comprovante de Residência'] = {
                isValid: true,
                status: 'success',
                message: 'Comprovante de residência validado',
                details: `Endereço: ${addressData.logradouro}, ${addressData.cidade}`
              };
            } else {
              validations['Comprovante de Residência'] = {
                isValid: false,
                status: 'error',
                message: 'Comprovante com dados insuficientes',
                details: 'Endereço completo, cidade e CEP são obrigatórios'
              };
            }
          }
        } catch (error) {
          validations['Comprovante de Residência'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar comprovante',
            details: 'Falha no processamento'
          };
        }
      }

      // Verificar documentos faltantes
      const missingDocuments: string[] = [];
      if (!documentosObrigatorios.RG) {
        missingDocuments.push('RG ou Documento de Identidade');
      }
      if (!documentosObrigatorios.HOLERITE) {
        missingDocuments.push('Comprovante de Renda (Holerite)');
      }
      if (!documentosObrigatorios.COMPROVANTE_ENDERECO) {
        missingDocuments.push('Comprovante de Residência');
      }

      // Determinar se a validação geral é válida
      const hasRequiredDocs = documentosObrigatorios.RG && documentosObrigatorios.HOLERITE && documentosObrigatorios.COMPROVANTE_ENDERECO;
      const allValidationsSuccessful = Object.values(validations).every(v => v.isValid);
      
      const isValid = hasRequiredDocs && allValidationsSuccessful;

      console.log('=== RESULTADO FINAL DA VALIDAÇÃO ===');
      console.log('Documentos obrigatórios completos:', hasRequiredDocs);
      console.log('Todas as validações bem-sucedidas:', allValidationsSuccessful);
      console.log('Validação geral aprovada:', isValid);
      console.log('Documentos faltantes:', missingDocuments);

      // Se não temos dados suficientes, usar fallback
      if (!isValid || missingDocuments.length > 0) {
        console.log('⚠️ VALIDAÇÃO FALHOU - DOCUMENTOS INSUFICIENTES');
        
        if (missingDocuments.length > 0) {
          validations['Documentos Obrigatórios'] = {
            isValid: false,
            status: 'error',
            message: 'Documentos obrigatórios faltantes',
            details: `Faltam: ${missingDocuments.join(', ')}`,
            missingDocuments
          };
        }
      }

      return {
        isValid,
        validations,
        missingDocuments,
        extractedData
      };

    } catch (error) {
      console.error('Erro crítico na validação:', error);
      
      return {
        isValid: false,
        validations: {
          'Erro de Sistema': {
            isValid: false,
            status: 'error',
            message: 'Falha no sistema de validação',
            details: 'Erro técnico durante o processamento'
          }
        },
        missingDocuments: ['RG ou Documento de Identidade', 'Comprovante de Renda', 'Comprovante de Residência'],
        extractedData: {}
      };
    }
  }
}

export default new GeminiValidationService();
