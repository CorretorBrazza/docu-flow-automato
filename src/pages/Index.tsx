import { useState } from "react";
import { Upload, FileCheck, Users, FileText, CheckCircle, AlertCircle, Clock, ArrowLeft, Home } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import DocumentUpload from "@/components/DocumentUpload";
import ValidationStatus from "@/components/ValidationStatus";
import DataForm from "@/components/DataForm";
import ResultsPanel from "@/components/ResultsPanel";
import ClientDashboard from "@/components/ClientDashboard";
import { useClients } from "@/contexts/ClientContext";

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'process'>('dashboard');
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [validationData, setValidationData] = useState<any>(null);
  const [additionalData, setAdditionalData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  
  const { addClient, updateClient, getClient } = useClients();

  const steps = [
    { id: 1, name: "Upload de Documentos", icon: Upload },
    { id: 2, name: "Validação", icon: FileCheck },
    { id: 3, name: "Dados Adicionais", icon: Users },
    { id: 4, name: "Resultados", icon: FileText }
  ];

  const handleNewClient = () => {
    // Criar um novo cliente com dados básicos
    const newClientId = addClient({
      name: "Novo Cliente",
      empreendimento: "A definir",
      status: "pendente",
      step: 1,
      missingDocs: ["Documentos iniciais"],
      files: [],
      validationData: null,
      additionalData: null
    });

    setCurrentClientId(newClientId);
    setCurrentView('process');
    setCurrentStep(1);
    setUploadedFiles([]);
    setValidationData(null);
    setAdditionalData(null);
    setIsProcessing(false);
  };

  const handleEditClient = (client: any) => {
    setCurrentClientId(client.id);
    setCurrentView('process');
    setCurrentStep(client.step || 1);
    setUploadedFiles(client.files || []);
    setValidationData(client.validationData || null);
    setAdditionalData(client.additionalData || null);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentClientId(null);
  };

  const updateCurrentClient = (updates: any) => {
    if (currentClientId) {
      updateClient(currentClientId, updates);
    }
  };

  const handleDocumentUpload = (files: File[]) => {
    console.log('Documentos carregados:', files.length);
    setUploadedFiles(files);
    updateCurrentClient({ 
      files, 
      step: Math.max(2, currentStep),
      missingDocs: files.length > 0 ? [] : ["Documentos obrigatórios"]
    });
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleValidationComplete = (data: any) => {
    console.log('Validação concluída:', data);
    setValidationData(data);
    
    // Extrair nome do cliente dos dados validados se disponível
    const clientName = data.extractedData?.dadosPessoais?.nomeCompleto || "Cliente";
    
    updateCurrentClient({ 
      validationData: data, 
      step: Math.max(3, currentStep),
      name: clientName
    });
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleDataSubmit = (data: any) => {
    console.log('Dados adicionais enviados:', data);
    setAdditionalData(data);
    setIsProcessing(true);
    
    updateCurrentClient({ 
      additionalData: data, 
      step: Math.max(4, currentStep),
      empreendimento: data.empreendimento || "Empreendimento não informado"
    });
    if (currentStep === 3) {
      setCurrentStep(4);
    }
    
    setTimeout(() => {
      setIsProcessing(false);
      // Marcar como finalizado quando o processamento terminar
      updateCurrentClient({ 
        status: "finalizado",
        missingDocs: []
      });
    }, 2000);
  };

  const handleGoToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  if (currentView === 'dashboard') {
    return <ClientDashboard onNewClient={handleNewClient} onEditClient={handleEditClient} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">BrFlow</h1>
                <p className="text-slate-600">Sistema de Automatização de Documentos</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              v2.0 Funcional
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
              const canNavigate = step.id <= currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => canNavigate && handleGoToStep(step.id)}
                    disabled={!canNavigate}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-500 text-white' :
                      canNavigate ? 'bg-slate-200 text-slate-500 hover:bg-slate-300' :
                      'bg-slate-100 text-slate-400'
                    } ${canNavigate ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </button>
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

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {currentStep === 1 && (
            <DocumentUpload 
              onUploadComplete={handleDocumentUpload}
              initialFiles={uploadedFiles}
            />
          )}

          {currentStep === 2 && (
            <ValidationStatus 
              files={uploadedFiles}
              onValidationComplete={handleValidationComplete}
              onBackToUpload={() => setCurrentStep(1)}
              initialValidationData={validationData}
            />
          )}

          {currentStep === 3 && (
            <DataForm 
              onSubmit={handleDataSubmit}
              onBackToValidation={() => setCurrentStep(2)}
              initialData={additionalData}
            />
          )}

          {currentStep === 4 && (
            <ResultsPanel 
              isProcessing={isProcessing}
              additionalData={additionalData}
              extractedData={validationData?.extractedData}
              originalFiles={uploadedFiles}
              onBackToData={() => setCurrentStep(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
