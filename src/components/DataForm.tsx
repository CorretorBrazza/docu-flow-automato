
import { useState, useEffect } from "react";
import { Users, Mail, Phone, Building, Megaphone, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DataFormProps {
  onSubmit: (data: any) => void;
  onBackToValidation?: () => void;
  initialData?: any;
}

const DataForm = ({ onSubmit, onBackToValidation, initialData }: DataFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    telefone: "",
    empreendimento: "",
    midiaOrigem: "",
    observacoes: ""
  });

  // Carregar dados iniciais se fornecidos
  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || "",
        telefone: initialData.telefone || "",
        empreendimento: initialData.empreendimento || "",
        midiaOrigem: initialData.midiaOrigem || "",
        observacoes: initialData.observacoes || ""
      });
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.email && formData.telefone && formData.empreendimento && formData.midiaOrigem;

  return (
    <div className="space-y-6">
      {onBackToValidation && (
        <Button
          variant="ghost"
          onClick={onBackToValidation}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Validação
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Dados Adicionais
          </CardTitle>
          <CardDescription>
            Preencha as informações complementares necessárias para gerar os documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email do Cliente *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  Telefone do Cliente *
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Empreendimento */}
              <div className="space-y-2">
                <Label htmlFor="empreendimento" className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  Empreendimento *
                </Label>
                <Input
                  id="empreendimento"
                  type="text"
                  placeholder="Digite o nome do empreendimento"
                  value={formData.empreendimento}
                  onChange={(e) => handleInputChange("empreendimento", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Mídia de Origem */}
              <div className="space-y-2">
                <Label htmlFor="midiaOrigem" className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-slate-500" />
                  Mídia de Origem *
                </Label>
                <Input
                  id="midiaOrigem"
                  type="text"
                  placeholder="Digite a mídia de origem"
                  value={formData.midiaOrigem}
                  onChange={(e) => handleInputChange("midiaOrigem", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">
                Observações Adicionais
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione qualquer observação relevante sobre o cliente ou processo..."
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-slate-500">
                * Campos obrigatórios
              </p>
              <Button 
                type="submit" 
                disabled={!isFormValid}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Gerar Documentos
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview dos Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview dos Dados</CardTitle>
          <CardDescription>
            Confirme as informações antes de prosseguir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Email</p>
              <p className="text-slate-800">{formData.email || "Não informado"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Telefone</p>
              <p className="text-slate-800">{formData.telefone || "Não informado"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Empreendimento</p>
              <p className="text-slate-800">{formData.empreendimento || "Não informado"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Mídia de Origem</p>
              <p className="text-slate-800">{formData.midiaOrigem || "Não informado"}</p>
            </div>
          </div>
          {formData.observacoes && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-600">Observações</p>
              <p className="text-slate-800 bg-slate-50 p-3 rounded-lg">{formData.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataForm;
