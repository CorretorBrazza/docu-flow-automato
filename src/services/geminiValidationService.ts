
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
Analise este documento e identifique o tipo. Responda apenas uma das opções:
- RG
- HOLERITE
- COMPROVANTE_ENDERECO
- CERTIDAO
- CARTEIRA_TRABALHO
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
    const allMissingDocs: string[] = [];
    let extractedData: any = {
      dadosPessoais: {},
      dadosProfissionais: {},
      endereco: {},
      certidoes: {}
    };

    try {
      console.log('=== INICIANDO VALIDAÇÃO GEMINI ===');
      console.log('Total de arquivos:', files.length);
      
      // Categorizar documentos usando Gemini
      const fileCategories: { [key: string]: File[] } = {
        RG: [],
        HOLERITE: [],
        COMPROVANTE_ENDERECO: [],
        CERTIDAO: [],
        OUTROS: []
      };

      // Analisar cada arquivo para determinar o tipo
      for (const file of files) {
        try {
          const documentType = await this.analyzeDocumentWithGemini(file, 'document_type');
          const category = documentType.toUpperCase().trim();
          
          if (fileCategories[category]) {
            fileCategories[category].push(file);
          } else {
            fileCategories.OUTROS.push(file);
          }
          
          console.log(`Arquivo ${file.name} categorizado como: ${category}`);
        } catch (error) {
          console.error(`Erro ao categorizar ${file.name}:`, error);
          fileCategories.OUTROS.push(file);
        }
      }

      console.log('=== CATEGORIZAÇÃO GEMINI ===');
      Object.entries(fileCategories).forEach(([category, files]) => {
        if (files.length > 0) {
          console.log(`${category}:`, files.map(f => f.name));
        }
      });

      // Processar RG
      if (fileCategories.RG.length > 0) {
        console.log('=== PROCESSANDO RG COM GEMINI ===');
        try {
          const rgFile = fileCategories.RG[0];
          
          // Analisar qualidade do documento
          const qualityAnalysis = await this.analyzeDocumentWithGemini(rgFile, 'document_quality');
          
          if (qualityAnalysis.legivel === false) {
            validations['RG'] = {
              isValid: false,
              status: 'error',
              message: 'RG ilegível',
              details: 'Documento com qualidade insuficiente para leitura'
            };
          } else {
            // Extrair dados
            const rgData = await geminiOcrService.extractFromRG(rgFile);
            
            // Validar consistência dos dados
            const consistencyAnalysis = await this.analyzeDocumentWithGemini(rgFile, 'data_consistency');
            
            if (rgData.nomeCompleto && rgData.nomeCompleto.length > 3) {
              extractedData.dadosPessoais = { ...extractedData.dadosPessoais, ...rgData };
              
              validations['RG'] = {
                isValid: true,
                status: consistencyAnalysis.dadosConsistentes ? 'success' : 'warning',
                message: 'RG processado com sucesso',
                details: `Nome: ${rgData.nomeCompleto}. ${consistencyAnalysis.observacoes || ''}`
              };
            } else {
              validations['RG'] = {
                isValid: true,
                status: 'warning',
                message: 'RG com dados limitados',
                details: 'Alguns campos podem precisar verificação manual'
              };
            }
          }
        } catch (error) {
          console.error('Erro ao processar RG:', error);
          validations['RG'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar RG',
            details: 'Falha no processamento via Gemini'
          };
        }
      }

      // Processar Holerites
      if (fileCategories.HOLERITE.length > 0) {
        console.log('=== PROCESSANDO HOLERITES COM GEMINI ===');
        try {
          const holerite = fileCategories.HOLERITE[0];
          
          const qualityAnalysis = await this.analyzeDocumentWithGemini(holerite, 'document_quality');
          
          if (qualityAnalysis.legivel === false) {
            validations['Comprovantes de Pagamento'] = {
              isValid: false,
              status: 'error',
              message: 'Holerite ilegível',
              details: 'Documento com qualidade insuficiente'
            };
          } else {
            const profData = await geminiOcrService.extractFromPaySlip(holerite);
            
            if (profData.empresa && profData.empresa.length > 3) {
              extractedData.dadosProfissionais = { ...extractedData.dadosProfissionais, ...profData };
              
              validations['Comprovantes de Pagamento'] = {
                isValid: true,
                status: 'success',
                message: 'Holerite processado com sucesso',
                details: `Empresa: ${profData.empresa}`
              };
            } else {
              validations['Comprovantes de Pagamento'] = {
                isValid: true,
                status: 'warning',
                message: 'Holerite com dados limitados',
                details: 'Verificação manual recomendada'
              };
            }
          }
        } catch (error) {
          console.error('Erro ao processar holerite:', error);
          validations['Comprovantes de Pagamento'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar holerite',
            details: 'Falha no processamento via Gemini'
          };
        }
      }

      // Processar Comprovante de Endereço
      if (fileCategories.COMPROVANTE_ENDERECO.length > 0) {
        console.log('=== PROCESSANDO COMPROVANTE DE ENDEREÇO COM GEMINI ===');
        try {
          const comprovante = fileCategories.COMPROVANTE_ENDERECO[0];
          
          const qualityAnalysis = await this.analyzeDocumentWithGemini(comprovante, 'document_quality');
          
          if (qualityAnalysis.legivel === false) {
            validations['Comprovante de Residência'] = {
              isValid: false,
              status: 'error',
              message: 'Comprovante ilegível',
              details: 'Documento com qualidade insuficiente'
            };
          } else {
            const addressData = await geminiOcrService.extractFromAddressProof(comprovante);
            
            if (addressData.logradouro && addressData.logradouro.length > 5) {
              extractedData.endereco = { ...extractedData.endereco, ...addressData };
              
              validations['Comprovante de Residência'] = {
                isValid: true,
                status: 'success',
                message: 'Comprovante processado com sucesso',
                details: `Endereço: ${addressData.logradouro}`
              };
            } else {
              validations['Comprovante de Residência'] = {
                isValid: true,
                status: 'warning',
                message: 'Comprovante com dados limitados',
                details: 'Verificação manual recomendada'
              };
            }
          }
        } catch (error) {
          console.error('Erro ao processar comprovante:', error);
          validations['Comprovante de Residência'] = {
            isValid: false,
            status: 'error',
            message: 'Erro ao processar comprovante',
            details: 'Falha no processamento via Gemini'
          };
        }
      }

      // Verificar se conseguimos dados suficientes
      const hasAnyValidData = (
        (extractedData.dadosPessoais.nomeCompleto && !extractedData.dadosPessoais.nomeCompleto.includes('DADOS NÃO EXTRAÍDOS')) ||
        (extractedData.dadosProfissionais.empresa && !extractedData.dadosProfissionais.empresa.includes('DADOS NÃO EXTRAÍDOS')) ||
        (extractedData.endereco.logradouro && !extractedData.endereco.logradouro.includes('DADOS NÃO EXTRAÍDOS'))
      );

      console.log('=== RESULTADO FINAL DA VALIDAÇÃO GEMINI ===');
      console.log('Dados válidos extraídos:', hasAnyValidData);
      console.log('Dados pessoais:', extractedData.dadosPessoais);
      console.log('Dados profissionais:', extractedData.dadosProfissionais);
      console.log('Endereço:', extractedData.endereco);

      if (!hasAnyValidData) {
        console.log('❌ NENHUM DADO VÁLIDO EXTRAÍDO - USANDO FALLBACK');
        const fallbackData = await geminiOcrService.fallbackExtraction(files[0]);
        extractedData = fallbackData;
        
        validations['Processamento Geral'] = {
          isValid: true,
          status: 'warning',
          message: 'Documentos requerem verificação manual',
          details: 'Gemini não conseguiu extrair dados suficientes automaticamente'
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
      console.error('Erro crítico na validação Gemini:', error);
      
      const fallbackData = await geminiOcrService.fallbackExtraction(files[0]);
      
      return {
        isValid: true,
        validations: {
          'Erro de Processamento': {
            isValid: true,
            status: 'warning',
            message: 'Erro no processamento automático via Gemini',
            details: 'Documentos precisam ser verificados manualmente'
          }
        },
        missingDocuments: [],
        extractedData: fallbackData
      };
    }
  }
}

export default new GeminiValidationService();
