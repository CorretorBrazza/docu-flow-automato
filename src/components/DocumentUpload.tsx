
import { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocumentUploadProps {
  onUploadComplete: (docs: File[]) => void;
}

const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const requiredDocs = [
    "RG (frente e verso)",
    "CPF",
    "CNH", 
    "Comprovante de Pagamento (2 últimos)",
    "Comprovante de Residência",
    "Extrato FGTS",
    "Carteira de Trabalho"
  ];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    
    if (validFiles.length !== files.length) {
      console.warn('Alguns arquivos foram rejeitados. Aceitos apenas PDF e imagens.');
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => 
        file.type === 'application/pdf' || file.type.startsWith('image/')
      );
      
      if (validFiles.length !== files.length) {
        console.warn('Alguns arquivos foram rejeitados. Aceitos apenas PDF e imagens.');
      }
      
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (uploadedFiles.length === 0) {
      console.warn('Nenhum arquivo carregado');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Processar arquivos e iniciar validação
      console.log('Iniciando processamento de', uploadedFiles.length, 'arquivos');
      
      // Simular um pequeno delay para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUploadComplete(uploadedFiles);
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <File className="w-4 h-4 text-red-500" />;
    } else if (file.type.startsWith('image/')) {
      return <File className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Upload de Documentos
          </CardTitle>
          <CardDescription>
            Faça o upload dos documentos necessários. Aceitos: PDF e imagens (JPG, PNG)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 hover:border-blue-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              Arraste os arquivos aqui
            </p>
            <p className="text-slate-500 mb-4">
              ou clique para selecionar
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Selecionar Arquivos
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentos Necessários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentos Necessários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requiredDocs.map((doc, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-slate-700">{doc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Arquivos Carregados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Arquivos Carregados
              <Badge variant="secondary">{uploadedFiles.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                Nenhum arquivo carregado ainda
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file)}
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700 truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleContinue} 
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Continuar para Validação
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
