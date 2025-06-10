import { useState, useEffect } from "react";
import { Download, FileText, Eye, Copy, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import pdfService from "@/services/pdfService";

interface ResultsPanelProps {
  isProcessing: boolean;
  additionalData: any;
  extractedData: any;
  originalFiles: File[];
  onBackToData: () => void;
}

const ResultsPanel = ({ isProcessing, additionalData, extractedData, originalFiles, onBackToData }: ResultsPanelProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<any>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isProcessing && additionalData && extractedData) {
      generateDocuments();
    }
  }, [isProcessing, additionalData, extractedData]);

  const generateDocuments = async () => {
    setIsGenerating(true);
    
    try {
      console.log('Gerando documentos PDF...');
      
      // Preparar dados para a ficha cadastral
      const fichaData = {
        dadosPessoais: extractedData.dadosPessoais || {},
        dadosProfissionais: extractedData.dadosProfissionais || {},
        endereco: extractedData.endereco || {},
        dadosAdicionais: additionalData || {},
        conjuge: extractedData.dadosPessoais?.estadoCivil === 'CASADO' ? extractedData.conjuge : undefined
      };

      // Preparar dados para a capa
      const capaData = {
        cliente: {
          nome: extractedData.dadosPessoais?.nomeCompleto || 'NÃO INFORMADO',
          cpf: extractedData.dadosPessoais?.cpf || 'NÃO INFORMADO'
        },
        conjuge: fichaData.conjuge ? {
          nome: fichaData.conjuge.nomeCompleto || 'NÃO INFORMADO',
          cpf: fichaData.conjuge.cpf || 'NÃO INFORMADO'
        } : undefined,
        empreendimento: additionalData.empreendimento || 'NÃO INFORMADO',
        midiaOrigem: additionalData.midiaOrigem || 'NÃO INFORMADO',
        observacoes: additionalData.observacoes
      };

      // Gerar ficha cadastral
      const fichaBytes = await pdfService.generateFichaCadastral(fichaData);
      
      // Gerar capa
      const capaBytes = await pdfService.generateCapa(capaData);
      
      // Consolidar todos os documentos
      const consolidatedBytes = await pdfService.consolidateDocuments(
        originalFiles,
        fichaBytes,
        capaBytes
      );

      // Gerar resumo completo
      const resumoCompleto = pdfService.generateResumoCompleto({
        dadosPessoais: extractedData.dadosPessoais,
        dadosProfissionais: extractedData.dadosProfissionais,
        endereco: extractedData.endereco,
        dadosAdicionais: additionalData
      });

      setGeneratedDocuments({
        ficha: fichaBytes,
        capa: capaBytes,
        consolidated: consolidatedBytes,
        resumo: resumoCompleto
      });

      console.log('Documentos gerados com sucesso');
      
    } catch (error) {
      console.error('Erro ao gerar documentos:', error);
      toast({
        title: "Erro na geração",
        description: "Falha ao gerar os documentos PDF.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyResume = () => {
    if (generatedDocuments.resumo) {
      navigator.clipboard.writeText(generatedDocuments.resumo);
      setCopySuccess(true);
      toast({
        title: "Resumo copiado!",
        description: "O resumo completo foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = (type: 'ficha' | 'capa' | 'consolidated') => {
    if (!generatedDocuments[type]) {
      toast({
        title: "Documento não disponível",
        description: "O documento ainda está sendo gerado.",
        variant: "destructive"
      });
      return;
    }

    const filenames = {
      ficha: 'ficha-cadastral.pdf',
      capa: 'capa-resumo.pdf', 
      consolidated: 'documentos-consolidados.pdf'
    };

    pdfService.downloadPDF(generatedDocuments[type], filenames[type]);
    
    toast({
      title: "Download iniciado",
      description: `${filenames[type]} está sendo baixado.`,
    });
  };

  const documentsList = [
    {
      name: "Ficha Cadastral",
      description: "Documento principal com dados do cliente",
      type: "PDF",
      key: "ficha" as const,
      status: generatedDocuments.ficha ? "ready" : "processing"
    },
    {
      name: "Capa/Resumo", 
      description: "Documento de capa do processo",
      type: "PDF",
      key: "capa" as const,
      status: generatedDocuments.capa ? "ready" : "processing"
    },
    {
      name: "Documentos Consolidados",
      description: "Todos os documentos em um único PDF",
      type: "PDF",
      key: "consolidated" as const,
      status: generatedDocuments.consolidated ? "ready" : "processing"
    }
  ];

  if (isProcessing || isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            {isProcessing ? 'Processando Dados' : 'Gerando Documentos'}
          </CardTitle>
          <CardDescription>
            {isProcessing 
              ? 'Preparando dados para geração de documentos...'
              : 'Criando ficha cadastral, capa e consolidando documentos...'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documentsList.map((doc, index) => (
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
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBackToData}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Dados
        </Button>
      </div>

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
            {documentsList.map((doc, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{doc.name}</p>
                  <p className="text-sm text-slate-500">{doc.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{doc.type}</Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={!generatedDocuments[doc.key]}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleDownload(doc.key)}
                    disabled={!generatedDocuments[doc.key]}
                  >
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
      {generatedDocuments.resumo && (
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
              
              <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-300 max-h-96 overflow-y-auto">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {generatedDocuments.resumo}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Finais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleDownload('consolidated')}
              disabled={!generatedDocuments.consolidated}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Todos os Documentos
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Processar Novo Cliente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsPanel;
