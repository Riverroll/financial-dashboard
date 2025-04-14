// src/app/page.tsx
"use client";

import { useState } from "react";
import TransactionUploader from "@/components/TransactionUploader";
import ProjectAssignmentScreen from "@/components/ProjectAssignmentScreen";
import Dashboard from "@/components/Dashboard";
import { Transaction, Project } from "@/types";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[] | null>(null);
  const [finalTransactions, setFinalTransactions] = useState<Transaction[] | null>(null);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);

  const handleTransactionsLoaded = (transactions: Transaction[]) => {
    setParsedTransactions(transactions);
  };

  const handleProjectAssignmentComplete = (assignedTransactions: Transaction[]) => {
    setFinalTransactions(assignedTransactions);
    
    // Process projects based on assigned transactions
    const projectMap = new Map<string, Project>();
    
    assignedTransactions.forEach(transaction => {
      const projectName = transaction.project || 'Unassigned';
      
      if (!projectMap.has(projectName)) {
        projectMap.set(projectName, {
          id: crypto.randomUUID(),
          name: projectName,
          income: 0,
          expenses: 0,
          profit: 0,
          profitMargin: 0,
          capex: 0,
          opex: 0,
          transactions: []
        });
      }
      
      const project = projectMap.get(projectName)!;
      project.transactions.push(transaction);
      
      if (transaction.amount > 0) {
        project.income += transaction.amount;
      } else {
        project.expenses += Math.abs(transaction.amount);
        
        if (transaction.expenditureType === 'CAPEX') {
          project.capex += Math.abs(transaction.amount);
        } else {
          project.opex += Math.abs(transaction.amount);
        }
      }
    });
    
    // Calculate profit and profit margin for each project
    projectMap.forEach(project => {
      project.profit = project.income - project.expenses;
      project.profitMargin = project.income > 0 ? (project.profit / project.income) * 100 : 0;
    });
    
    setExistingProjects(Array.from(projectMap.values()));
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Codenito Finance Analyzer</h1>
      
      {!parsedTransactions && (
        <TransactionUploader 
          onTransactionsLoaded={handleTransactionsLoaded} 
          setIsLoading={setIsLoading} 
        />
      )}
      
      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {parsedTransactions && !finalTransactions && (
        <ProjectAssignmentScreen 
          transactions={parsedTransactions}
          onComplete={handleProjectAssignmentComplete}
          existingProjects={existingProjects}
        />
      )}
      
      {finalTransactions && existingProjects.length > 0 && (
        <Dashboard 
          transactions={finalTransactions} 
          projects={existingProjects} 
        />
      )}
    </main>
  );
}