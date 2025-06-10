
import { useState } from "react";
import { Plus, User, Building, AlertTriangle, CheckCircle, Clock, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Client {
  id: string;
  name: string;
  empreendimento: string;
  status: 'pendente' | 'finalizado';
  step: number;
  missingDocs: string[];
  createdAt: string;
  files?: File[];
  validationData?: any;
  additionalData?: any;
}

interface ClientDashboardProps {
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
}

const ClientDashboard = ({ onNewClient, onEditClient }: ClientDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dados mockados para demonstração
  const [clients] = useState<Client[]>([
    {
      id: "1",
      name: "João Silva",
      empreendimento: "Residencial Vista Verde",
      status: "pendente",
      step: 2,
      missingDocs: ["Comprovante de Renda", "RG Cônjuge"],
      createdAt: "2025-06-08"
    },
    {
      id: "2", 
      name: "Maria Santos",
      empreendimento: "Condomínio Águas Claras",
      status: "finalizado",
      step: 4,
      missingDocs: [],
      createdAt: "2025-06-07"
    },
    {
      id: "3",
      name: "Carlos Oliveira", 
      empreendimento: "Edifício Central Park",
      status: "pendente",
      step: 1,
      missingDocs: ["RG", "CPF", "Comprovante de Residência", "Holerite"],
      createdAt: "2025-06-09"
    },
    {
      id: "4",
      name: "Ana Costa",
      empreendimento: "Residencial Jardim das Flores", 
      status: "finalizado",
      step: 4,
      missingDocs: [],
      createdAt: "2025-06-06"
    }
  ]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.empreendimento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingClients = filteredClients.filter(client => client.status === 'pendente');
  const finishedClients = filteredClients.filter(client => client.status === 'finalizado');

  const getStatusIcon = (client: Client) => {
    if (client.status === 'finalizado') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (client.missingDocs.length > 0) {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  const getStatusBadge = (client: Client) => {
    if (client.status === 'finalizado') {
      return <Badge className="bg-green-500 hover:bg-green-600">Finalizado</Badge>;
    }
    if (client.missingDocs.length > 0) {
      return <Badge variant="destructive">Documentos Pendentes</Badge>;
    }
    return <Badge variant="secondary">Em Andamento</Badge>;
  };

  const getStepName = (step: number) => {
    const steps = ["Upload", "Validação", "Dados", "Resultados"];
    return steps[step - 1] || "Indefinido";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">BrFlow</h1>
              <p className="text-slate-600">Dashboard de Clientes</p>
            </div>
            <Button onClick={onNewClient} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Buscar por nome do cliente ou empreendimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Clientes</p>
                  <p className="text-2xl font-bold">{clients.length}</p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Processos Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600">{pendingClients.length}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Processos Finalizados</p>
                  <p className="text-2xl font-bold text-green-600">{finishedClients.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Clients */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Clientes Pendentes ({pendingClients.length})
          </h2>
          
          {pendingClients.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-500">Nenhum cliente com pendências</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getStatusIcon(client)}
                        {client.name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClient(client)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {client.empreendimento}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Etapa:</span>
                        <Badge variant="outline">{getStepName(client.step)}</Badge>
                      </div>
                      
                      {getStatusBadge(client)}
                      
                      {client.missingDocs.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">
                            Documentos Faltantes:
                          </p>
                          <div className="text-xs text-slate-600 space-y-1">
                            {client.missingDocs.map((doc, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500">
                        Criado em: {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Finished Clients */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Clientes Finalizados ({finishedClients.length})
          </h2>
          
          {finishedClients.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-500">Nenhum cliente finalizado ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {finishedClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStatusIcon(client)}
                        {client.name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClient(client)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {client.empreendimento}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getStatusBadge(client)}
                      <p className="text-xs text-slate-500">
                        Finalizado em: {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
