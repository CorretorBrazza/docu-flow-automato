
import { useState, useEffect } from "react";
import { FileCheck, CheckCircle, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import geminiOcrService, { ExtractedPersonalData, ExtractedProfessionalData, ExtractedAddressData } from "@/services/geminiOcrService";

interface ValidationStatusProps {
  files: File[];
  onValidationComplete: (data: any) => void;
  onBackToUpload?: () => void;
  initialValidationData?: any;
}

const ValidationStatus = ({ files, onValidationComplete, onBackToUpload, initialValidationData }: ValidationStatusProps) => {
  const [validationResults, setValidationResults] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: []
  });
  const [extractedData, setExtractedData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Se já há dados de validação salvos, usar eles
    if (initialValidationData) {
      setValidationResults(initialValidationData.validationResults || { isValid: true, errors: [] });
      setExtractedData(initialValidationData.extractedData || {});
    } else if (files.length > 0) {
      validateDocuments();
    }
  }, [files, initialValidationData]);

  const identifyDocumentType = (filename: string): string => {
    const name = filename.toLowerCase();
    
    // Verificar CNH primeiro (mais específico)
    if (name.includes('cnh') || name.includes('carteira') || name.includes('habilitacao')) {
      return 'cnh';
    }
    
    // RG/Identidade
    if (name.includes('rg') || name.includes('identidade')) {
      return 'rg';
    }
    
    // CPF
    if (name.includes('cpf')) {
      return 'cpf';
    }
    
    // Holerite/Pagamento
    if (name.includes('holerite') || name.includes('folha') || name.includes('pagamento') || name.includes('contracheque')) {
      return 'payslip';
    }
    
    // Comprovante de endereço
    if (name.includes('comprovante') || name.includes('residencia') || name.includes('endereco') || name.includes('conta')) {
      return 'address';
    }
    
    // Certidão
    if (name.includes('certidao') || name.includes('nascimento') || name.includes('casamento')) {
      return 'certificate';
    }
    
    return 'unknown';
  };

  const validateDocuments = async () => {
    setIsProcessing(true);
    setValidationResults({ isValid: true, errors: [] });
    setExtractedData({});

    try {
      const documentTypes = files.map(file => ({
        file,
        type: identifyDocumentType(file.name)
      }));

      console.log('Documentos identificados:', documentTypes);

      let personalData: Partial<ExtractedPersonalData> = {};
      let payslipData: Partial<ExtractedProfessionalData> = {};
      let addressData: Partial<ExtractedAddressData> = {};
      let certificateData: any = {};

      // Procurar por CNH primeiro (prioridade porque já contém RG e CPF)
      const cnhDoc = documentTypes.find(doc => doc.type === 'cnh');
      const rgDoc = documentTypes.find(doc => doc.type === 'rg');
      const cpfDoc = documentTypes.find(doc => doc.type === 'cpf');

      // Extrair dados pessoais
      if (cnhDoc) {
        console.log('Extraindo dados da CNH:', cnhDoc.file.name);
        personalData = await geminiOcrService.extractFromRG(cnhDoc.file); // CNH contém os mesmos dados do RG
        setExtractedData(prev => ({ ...prev, dadosPessoais: personalData }));
      } else if (rgDoc) {
        console.log('Extraindo dados do RG:', rgDoc.file.name);
        personalData = await geminiOcrService.extractFromRG(rgDoc.file);
        setExtractedData(prev => ({ ...prev, dadosPessoais: personalData }));
        
        // Se RG não tem CPF e há documento CPF separado, extrair dele
        if (!personalData.cpf && cpfDoc) {
          console.log('Extraindo CPF do documento separado:', cpfDoc.file.name);
          const cpfData = await geminiOcrService.extractFromRG(cpfDoc.file);
          personalData.cpf = cpfData.cpf;
          setExtractedData(prev => ({ 
            ...prev, 
            dadosPessoais: { ...prev.dadosPessoais, cpf: cpfData.cpf }
          }));
        }
      } else if (cpfDoc) {
        console.log('Extraindo dados do CPF:', cpfDoc.file.name);
        personalData = await geminiOcrService.extractFromRG(cpfDoc.file);
        setExtractedData(prev => ({ ...prev, dadosPessoais: personalData }));
      }

      // Extrair dados profissionais
      const payslipDocs = documentTypes.filter(doc => doc.type === 'payslip');
      if (payslipDocs.length > 0) {
        console.log('Extraindo dados do holerite:', payslipDocs[0].file.name);
        payslipData = await geminiOcrService.extractFromPaySlip(payslipDocs[0].file);
        setExtractedData(prev => ({ ...prev, dadosProfissionais: payslipData }));
      }

      // Extrair dados de endereço
      const addressDoc = documentTypes.find(doc => doc.type === 'address');
      if (addressDoc) {
        console.log('Extraindo dados do comprovante de endereço:', addressDoc.file.name);
        addressData = await geminiOcrService.extractFromAddressProof(addressDoc.file);
        setExtractedData(prev => ({ ...prev, endereco: addressData }));
      }

      // Extrair dados de certidão
      const certificateDoc = documentTypes.find(doc => doc.type === 'certificate');
      if (certificateDoc) {
        console.log('Extraindo dados da certidão:', certificateDoc.file.name);
        certificateData = await geminiOcrService.extractFromCertificate(certificateDoc.file);
        setExtractedData(prev => ({ ...prev, conjuge: certificateData }));
      }

      // Validar os dados extraídos
      const errors: string[] = [];
      
      // Verificar dados pessoais básicos
      if (!personalData.nomeCompleto) {
        errors.push("Nome completo não encontrado nos documentos de identidade");
      }
      
      // Para CPF, aceitar se vier da CNH, RG ou documento CPF
      if (!personalData.cpf) {
        if (cnhDoc) {
          errors.push("CPF não encontrado na CNH");
        } else if (rgDoc && !cpfDoc) {
          errors.push("CPF não encontrado no RG - necessário documento CPF separado");
        } else {
          errors.push("CPF não encontrado nos documentos");
        }
      }
      
      if (!personalData.dataNascimento) {
        errors.push("Data de nascimento não encontrada nos documentos de identidade");
      }
      
      if (!addressData.logradouro) {
        errors.push("Endereço não encontrado no comprovante de residência");
      }
      
      if (!payslipData.salarioBruto) {
        errors.push("Salário não encontrado no holerite");
      }

      setValidationResults({
        isValid: errors.length === 0,
        errors: errors
      });

      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Validação com ressalvas",
          description: "Alguns dados não puderam ser extraídos automaticamente. Verifique os documentos."
        });
      } else {
        toast({
          title: "Validação Concluída",
          description: "Todos os dados foram extraídos com sucesso!",
        });
      }

    } catch (error: any) {
      console.error("Erro na validação:", error);
      setValidationResults({
        isValid: false,
        errors: [error.message || "Erro desconhecido na validação"]
      });
      toast({
        variant: "destructive",
        title: "Erro na Validação",
        description: error.message || "Ocorreu um erro ao validar os documentos."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    onValidationComplete({
      validationResults,
      extractedData,
      originalFiles: files
    });
  };

  return (
    <div className="space-y-6">
      {onBackToUpload && (
        <Button
          variant="ghost"
          onClick={onBackToUpload}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Upload
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-500" />
            Validação de Documentos
          </CardTitle>
          <CardDescription>
            Verificando os documentos enviados e extraindo os dados...
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-slate-700">Validando documentos...</p>
            </div>
          ) : (
            <>
              {validationResults.isValid ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <p>Todos os documentos parecem válidos!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                    <p>Validação com ressalvas. Verifique os seguintes dados:</p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationResults.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-500">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Display Extracted Data */}
              {Object.keys(extractedData).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Dados Extraídos:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dados Pessoais */}
                    {extractedData.dadosPessoais && (
                      <div className="space-y-2">
                        <h4 className="text-md font-medium text-blue-500">Dados Pessoais</h4>
                        <p><strong>Nome:</strong> {extractedData.dadosPessoais.nomeCompleto || "Não encontrado"}</p>
                        <p><strong>CPF:</strong> {extractedData.dadosPessoais.cpf || "Não encontrado"}</p>
                        <p><strong>RG:</strong> {extractedData.dadosPessoais.rg || "Não encontrado"}</p>
                        <p><strong>Data de Nascimento:</strong> {extractedData.dadosPessoais.dataNascimento || "Não encontrado"}</p>
                        <p><strong>Naturalidade:</strong> {extractedData.dadosPessoais.naturalidade || "Não encontrado"}</p>
                        <p><strong>Estado Civil:</strong> {extractedData.dadosPessoais.estadoCivil || "Não encontrado"}</p>
                      </div>
                    )}

                    {/* Dados Profissionais */}
                    {extractedData.dadosProfissionais && (
                      <div className="space-y-2">
                        <h4 className="text-md font-medium text-blue-500">Dados Profissionais</h4>
                        <p><strong>Empresa:</strong> {extractedData.dadosProfissionais.empresa || "Não encontrado"}</p>
                        <p><strong>Cargo:</strong> {extractedData.dadosProfissionais.cargo || "Não encontrado"}</p>
                        <p><strong>Salário:</strong> {extractedData.dadosProfissionais.salarioBruto || "Não encontrado"}</p>
                        <p><strong>Data de Admissão:</strong> {extractedData.dadosProfissionais.dataAdmissao || "Não encontrado"}</p>
                      </div>
                    )}

                    {/* Endereço */}
                    {extractedData.endereco && (
                      <div className="space-y-2">
                        <h4 className="text-md font-medium text-blue-500">Endereço</h4>
                        <p><strong>Logradouro:</strong> {extractedData.endereco.logradouro || "Não encontrado"}</p>
                        <p><strong>Bairro:</strong> {extractedData.endereco.bairro || "Não encontrado"}</p>
                        <p><strong>Cidade:</strong> {extractedData.endereco.cidade || "Não encontrado"}</p>
                        <p><strong>Estado:</strong> {extractedData.endereco.estado || "Não encontrado"}</p>
                        <p><strong>CEP:</strong> {extractedData.endereco.cep || "Não encontrado"}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleContinue}
                disabled={!files.length || isProcessing}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Continuar para Dados Adicionais
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationStatus;
