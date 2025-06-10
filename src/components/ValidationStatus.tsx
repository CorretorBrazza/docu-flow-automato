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
}

const ValidationStatus = ({ files, onValidationComplete, onBackToUpload }: ValidationStatusProps) => {
  const [validationResults, setValidationResults] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: []
  });
  const [extractedData, setExtractedData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (files.length > 0) {
      validateDocuments();
    }
  }, [files]);

  const validateDocuments = async () => {
    setIsProcessing(true);
    setValidationResults({ isValid: true, errors: [] });
    setExtractedData({});

    try {
      const rgFile = files.find(file => file.name.toLowerCase().includes('rg') || file.name.toLowerCase().includes('identidade'));
      const payslipFiles = files.filter(file => file.name.toLowerCase().includes('holerite') || file.name.toLowerCase().includes('folha') || file.name.toLowerCase().includes('pagamento'));
      const addressFile = files.find(file => file.name.toLowerCase().includes('comprovante') || file.name.toLowerCase().includes('residencia') || file.name.toLowerCase().includes('endereco'));
      const certificateFile = files.find(file => file.name.toLowerCase().includes('certidao') || file.name.toLowerCase().includes('nascimento') || file.name.toLowerCase().includes('casamento'));

      let rgData: Partial<ExtractedPersonalData> = {};
      let payslipData: Partial<ExtractedProfessionalData> = {};
      let addressData: Partial<ExtractedAddressData> = {};
      let certificateData: any = {};

      if (rgFile) {
        rgData = await geminiOcrService.extractFromRG(rgFile);
        setExtractedData(prev => ({ ...prev, dadosPessoais: rgData }));
      }

      if (payslipFiles.length > 0) {
        // Extrair dados do holerite mais recente
        const latestPayslip = payslipFiles[0];
        payslipData = await geminiOcrService.extractFromPaySlip(latestPayslip);
        setExtractedData(prev => ({ ...prev, dadosProfissionais: payslipData }));
      }

      if (addressFile) {
        addressData = await geminiOcrService.extractFromAddressProof(addressFile);
        setExtractedData(prev => ({ ...prev, endereco: addressData }));
      }

      if (certificateFile) {
        certificateData = await geminiOcrService.extractFromCertificate(certificateFile);
        setExtractedData(prev => ({ ...prev, conjuge: certificateData }));
      }

      // Validar os dados extraídos
      const errors: string[] = [];
      if (!rgData.nomeCompleto) errors.push("Nome completo não encontrado no RG");
      if (!rgData.cpf) errors.push("CPF não encontrado no RG");
      if (!rgData.dataNascimento) errors.push("Data de nascimento não encontrada no RG");
      if (!addressData.logradouro) errors.push("Endereço não encontrado no comprovante de residência");
      if (!payslipData.salarioBruto) errors.push("Salário não encontrado no holerite");

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
