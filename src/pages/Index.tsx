
import { useState } from "react";
import { Upload, FileCheck, Users, FileText, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DocumentUpload from "@/components/DocumentUpload";
import ValidationStatus from "@/components/ValidationStatus";
import DataForm from "@/components/DataForm";
import ResultsPanel from "@/components/ResultsPanel";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [additionalData, setAdditionalData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    { id: 1, name: "Upload de Documentos", icon: Upload },
    { id: 2, name: "Validação", icon: FileCheck },
    { id: 3, name: "Dados Adicionais", icon: Users },
    { id: 4, name: "Resultados", icon: FileText }
  ];

  const handleDocumentUpload = (docs: any[]) => {
    setUploadedDocs(docs);
    setCurrentStep(2);
    // Simular validação
    setTimeout(() => {
      setValidationResults({
        status: "success",
        missingDocs: [],
        extractedData: {
          cliente: {
            nome: "JOÃO DA SILVA SANTOS",
            rg: "12.345.678-9",
            cpf: "123.456.789-00",
            dataNascimento: "15/03/1985"
          }
        }
      });
    }, 2000);
  };

  const handleValidationComplete = () => {
    setCurrentStep(3);
  };

  const handleDataSubmit = (data: any) => {
    setAdditionalData(data);
    setIsProcessing(true);
    setCurrentStep(4);
    
    // Simular processamento
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">DocuFlow Automato</h1>
              <p className="text-slate-600">Sistema de Automatização de Documentos</p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              v1.0 Beta
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-blue-500 text-white' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : 'text-slate-600'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Info Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Status do Processo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Documentos Carregados</p>
                    <p className="text-2xl font-bold text-blue-600">{uploadedDocs.length}</p>
                  </div>
                  
                  {validationResults && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Status da Validação</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Aprovado</span>
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Processamento</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-blue-600">Gerando documentos...</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {currentStep === 1 && (
              <DocumentUpload onUploadComplete={handleDocumentUpload} />
            )}

            {currentStep === 2 && validationResults && (
              <ValidationStatus 
                results={validationResults}
                onValidationComplete={handleValidationComplete}
              />
            )}

            {currentStep === 3 && (
              <DataForm onSubmit={handleDataSubmit} />
            )}

            {currentStep === 4 && (
              <ResultsPanel 
                isProcessing={isProcessing}
                additionalData={additionalData}
                extractedData={validationResults?.extractedData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
