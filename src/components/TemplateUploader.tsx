
import { useState } from "react";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import templatePdfService from "@/services/templatePdfService";

const TemplateUploader = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Verificar se já tem template carregado
  useState(() => {
    const checkTemplate = async () => {
      const templateExists = await templatePdfService.hasTemplate();
      setHasTemplate(templateExists);
    };
    checkTemplate();
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar se é PDF
    if (file.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      await templatePdfService.loadTemplate(file);
      setHasTemplate(true);
      setUploadedFileName(file.name);
      console.log(`Template ${file.name} carregado com sucesso!`);
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      setError('Erro ao carregar o template. Verifique se o arquivo é um PDF válido.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Template Abiatar
        </CardTitle>
        <CardDescription>
          Carregue o template TEMPLATE_ABIATAR.pdf para usar na geração das fichas cadastrais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status do Template */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
            {hasTemplate ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Template carregado</p>
                  {uploadedFileName && (
                    <p className="text-sm text-slate-600">{uploadedFileName}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-700">Nenhum template carregado</p>
                  <p className="text-sm text-slate-600">Será usado o template padrão</p>
                </div>
              </>
            )}
          </div>

          {/* Upload Input */}
          <div className="space-y-2">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          {/* Upload Button Alternative */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={isUploading}
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Carregando...' : 'Selecionar Template'}
            </Button>
            
            {hasTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHasTemplate(false);
                  setUploadedFileName("");
                  // Reset do input file
                  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
                  if (input) input.value = "";
                }}
              >
                Remover Template
              </Button>
            )}
          </div>

          {/* Instruções */}
          <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Dica:</p>
            <p>O template deve ser um PDF com campos de formulário nomeados corretamente (NOME, CPF, RG, etc.). Após carregar, todas as fichas cadastrais usarão este template automaticamente.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateUploader;
