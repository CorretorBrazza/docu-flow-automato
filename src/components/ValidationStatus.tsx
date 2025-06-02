
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Loader2, Eye, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ValidationStatusProps {
  results: any;
  onValidationComplete: () => void;
}

const ValidationStatus = ({ results, onValidationComplete }: ValidationStatusProps) => {
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Simular tempo de validação
    const timer = setTimeout(() => {
      setIsValidating(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const validationChecks = [
    { name: "RG (frente e verso)", status: "success", details: "Documento válido, estado civil identificado" },
    { name: "CPF", status: "success", details: "Número válido" },
    { name: "Comprovantes de Pagamento", status: "success", details: "2 últimos meses completos" },
    { name: "Comprovante de Residência", status: "success", details: "Válido (60 dias), mesmo titular" },
    { name: "Carteira de Trabalho", status: "success", details: "Empresa confere com comprovante" },
    { name: "Extrato FGTS", status: "success", details: "Mesmo titular" },
    { name: "Certidão de Nascimento", status: "warning", details: "Recomendado para validação cruzada" }
  ];

  const extractedData = {
    dadosPessoais: {
      nomeCompleto: "JOÃO DA SILVA SANTOS",
      rg: "12.345.678-9 SSP-SP",
      cpf: "123.456.789-00",
      dataNascimento: "15/03/1985",
      naturalidade: "SÃO PAULO - SP",
      estadoCivil: "SOLTEIRO"
    },
    dadosProfissionais: {
      empresa: "EMPRESA EXEMPLO LTDA",
      cargo: "ANALISTA FINANCEIRO",
      salarioBruto: "R$ 5.500,00",
      dataAdmissao: "10/01/2020"
    },
    endereco: {
      logradouro: "RUA DAS FLORES, 123",
      bairro: "CENTRO",
      cidade: "SÃO PAULO",
      estado: "SP",
      cep: "01234-567"
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
            Analisando documentos e extraindo informações...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validationChecks.map((check, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-slate-700">{check.name}</span>
                <span className="text-xs text-slate-500 ml-auto">Validando...</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Validação Concluída
          </CardTitle>
          <CardDescription>
            Todos os documentos foram validados com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validationChecks.map((check, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {check.status === "success" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{check.name}</p>
                  <p className="text-xs text-slate-500">{check.details}</p>
                </div>
                <Badge variant={check.status === "success" ? "default" : "secondary"}>
                  {check.status === "success" ? "OK" : "Info"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            Dados Extraídos
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
                {Object.entries(extractedData.dadosPessoais).map(([key, value]) => (
                  <div key={key} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="profissionais" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(extractedData.dadosProfissionais).map(([key, value]) => (
                  <div key={key} className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="endereco" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(extractedData.endereco).map(([key, value]) => (
                  <div key={key} className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onValidationComplete} className="bg-green-600 hover:bg-green-700">
          Continuar para Dados Adicionais
          <FileText className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ValidationStatus;
