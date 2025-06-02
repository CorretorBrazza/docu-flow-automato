
import { useState } from "react";
import { Download, FileText, Eye, Copy, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface ResultsPanelProps {
  isProcessing: boolean;
  additionalData: any;
  extractedData: any;
}

const ResultsPanel = ({ isProcessing, additionalData, extractedData }: ResultsPanelProps) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const resumoCompleto = `
RESUMO COMPLETO - DOCUMENTAÇÃO DO CLIENTE

=== DADOS PESSOAIS ===
Nome Completo: JOÃO DA SILVA SANTOS
RG: 12.345.678-9 SSP-SP
CPF: 123.456.789-00
Data de Nascimento: 15/03/1985
Naturalidade: SÃO PAULO - SP
Estado Civil: SOLTEIRO
Email: ${additionalData?.email || 'NÃO INFORMADO'}
Telefone: ${additionalData?.telefone || 'NÃO INFORMADO'}

=== DADOS PROFISSIONAIS ===
Empresa: EMPRESA EXEMPLO LTDA
Cargo: ANALISTA FINANCEIRO
Salário Bruto: R$ 5.500,00
Data de Admissão: 10/01/2020

=== ENDEREÇO RESIDENCIAL ===
Logradouro: RUA DAS FLORES, 123
Bairro: CENTRO
Cidade: SÃO PAULO
Estado: SP
CEP: 01234-567

=== DADOS DO PROCESSO ===
Empreendimento: ${additionalData?.empreendimento || 'NÃO INFORMADO'}
Mídia de Origem: ${additionalData?.midiaOrigem || 'NÃO INFORMADO'}
Data de Verificação: ${new Date().toLocaleDateString('pt-BR')}
Corretor: GORETI / BRAZZA
Coordenador: LAVILLE

EM ${new Date().toLocaleDateString('pt-BR')} FOI VERIFICADO E APROVADO A DOCUMENTAÇÃO ACIMA DESCRITA, TENDO SIDO PROTOCOLADOS OS DOCUMENTOS NECESSÁRIOS PARA ANÁLISE DE CRÉDITO.

${additionalData?.observacoes ? `\nObservações: ${additionalData.observacoes}` : ''}
  `;

  const handleCopyResume = () => {
    navigator.clipboard.writeText(resumoCompleto.trim());
    setCopySuccess(true);
    toast({
      title: "Resumo copiado!",
      description: "O resumo completo foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const generatedDocuments = [
    {
      name: "Ficha Cadastral",
      description: "Documento principal com dados do cliente",
      type: "PDF",
      size: "156 KB",
      status: isProcessing ? "processing" : "ready"
    },
    {
      name: "Capa/Resumo",
      description: "Documento de capa do processo",
      type: "PDF", 
      size: "89 KB",
      status: isProcessing ? "processing" : "ready"
    },
    {
      name: "Documentos Consolidados",
      description: "Todos os documentos em um único PDF",
      type: "PDF",
      size: "2.3 MB",
      status: isProcessing ? "processing" : "ready"
    }
  ];

  if (isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            Processando Documentos
          </CardTitle>
          <CardDescription>
            Gerando ficha cadastral, capa e consolidando documentos...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generatedDocuments.map((doc, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{doc.name}</p>
                  <p className="text-sm text-slate-500">{doc.description}</p>
                </div>
                <Badge variant="secondary">Gerando...</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Documentos Gerados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Documentos Gerados com Sucesso
          </CardTitle>
          <CardDescription>
            Todos os documentos foram processados e estão prontos para download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generatedDocuments.map((doc, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{doc.name}</p>
                  <p className="text-sm text-slate-500">{doc.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{doc.type}</Badge>
                  <span className="text-xs text-slate-500">{doc.size}</span>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo Completo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Resumo Completo
          </CardTitle>
          <CardDescription>
            Resumo detalhado para cópia e arquivamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">
                Resumo formatado pronto para cópia
              </p>
              <Button
                onClick={handleCopyResume}
                variant="outline"
                className={copySuccess ? "bg-green-50 border-green-300" : ""}
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Resumo
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-300">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                {resumoCompleto.trim()}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Finais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download Todos os Documentos
            </Button>
            <Button variant="outline">
              Processar Novo Cliente
            </Button>
            <Button variant="outline">
              Salvar no Histórico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsPanel;
