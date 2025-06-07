import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, XCircle, Loader2, Eye, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import geminiValidationService from "@/services/geminiValidationService";

interface ValidationStatusProps {
  files: File[];
  onValidationComplete: (data: any) => void;
}

const ValidationStatus = ({ files, onValidationComplete }: ValidationStatusProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  useEffect(() => {
    const performValidation = async () => {
      setIsValidating(true);
      
      try {
        console.log('Iniciando validação Gemini de', files.length, 'arquivos');
        
        const results = await geminiValidationService.validateDocuments(files);
        
        console.log('Resultados da validação Gemini:', results);
        
        setValidationResults(results);
        setExtractedData(results.extractedData);
        
      } catch (error) {
        console.error('Erro durante validação Gemini:', error);
        setValidationResults({
          isValid: false,
          validations: {
            'Erro Geral': {
              isValid: false,
              status: 'error',
              message: 'Erro durante a validação via Gemini',
              details: 'Falha no processamento dos documentos'
            }
          },
          missingDocuments: [],
          extractedData: {}
        });
      } finally {
        setIsValidating(false);
      }
    };

    if (files.length > 0) {
      performValidation();
    }
  }, [files]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-300">OK</Badge>;
      case 'warning':
        return <Badge variant="secondary">Atenção</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Processando</Badge>;
    }
  };

  if (isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            Validando Documentos
          </CardTitle>
          <CardDescription>
            Analisando documentos e extraindo informações usando OCR...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-slate-700">Processando arquivos com OCR...</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-slate-700">Aplicando regras de validação...</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-slate-700">Extraindo dados estruturados...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validationResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Erro na Validação
          </CardTitle>
          <CardDescription>
            Não foi possível processar os documentos
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationResults.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
            {validationResults.isValid ? 'Validação Concluída' : 'Validação com Ressalvas'}
          </CardTitle>
          <CardDescription>
            {validationResults.isValid 
              ? 'Documentos processados com sucesso'
              : 'Alguns documentos precisam de atenção'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(validationResults.validations).map(([docType, validation]: [string, any]) => (
              <div key={docType} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {getStatusIcon(validation.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{docType}</p>
                  <p className="text-xs text-slate-600">{validation.message}</p>
                  {validation.details && (
                    <p className="text-xs text-slate-500 mt-1">{validation.details}</p>
                  )}
                </div>
                {getStatusBadge(validation.status)}
              </div>
            ))}
          </div>

          {validationResults.missingDocuments && validationResults.missingDocuments.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">Documentos Adicionais Necessários:</p>
              <ul className="text-xs text-amber-700 space-y-1">
                {validationResults.missingDocuments.map((doc: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Dados Extraídos via OCR
            </CardTitle>
            <CardDescription>
              Informações extraídas automaticamente dos documentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pessoais" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="profissionais">Dados Profissionais</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
              </TabsList>

              <TabsContent value="pessoais" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractedData.dadosPessoais && Object.entries(extractedData.dadosPessoais).map(([key, value]: [string, any]) => (
                    value && (
                      <div key={key} className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm font-medium text-slate-800">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="profissionais" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractedData.dadosProfissionais && Object.entries(extractedData.dadosProfissionais).map(([key, value]: [string, any]) => (
                    value && (
                      <div key={key} className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm font-medium text-slate-800">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractedData.endereco && Object.entries(extractedData.endereco).map(([key, value]: [string, any]) => (
                    value && (
                      <div key={key} className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm font-medium text-slate-800">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={() => onValidationComplete({ validationResults, extractedData })}
          className="bg-green-600 hover:bg-green-700"
        >
          Continuar para Dados Adicionais
          <FileText className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ValidationStatus;
