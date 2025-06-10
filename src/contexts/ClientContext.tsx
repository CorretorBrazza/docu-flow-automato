
import React, { createContext, useContext, useState, ReactNode } from 'react';

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

interface ClientContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => string;
  updateClient: (id: string, updates: Partial<Client>) => void;
  getClient: (id: string) => Client | undefined;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  // Dados mockados iniciais
  const [clients, setClients] = useState<Client[]>([
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

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setClients(prev => [newClient, ...prev]);
    return newClient.id;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => 
      prev.map(client => 
        client.id === id ? { ...client, ...updates } : client
      )
    );
  };

  const getClient = (id: string) => {
    return clients.find(client => client.id === id);
  };

  return (
    <ClientContext.Provider value={{ clients, addClient, updateClient, getClient }}>
      {children}
    </ClientContext.Provider>
  );
};
