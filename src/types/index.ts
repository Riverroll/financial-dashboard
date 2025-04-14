// src/types/index.ts

export interface Transaction {
    id: string;
    date: Date;
    amount: number;
    description: string;
    source: string;
    destination: string;
    notes: string;
    balance: number;
    type: 'income' | 'expense' | 'transfer' | 'interest' | 'tax';
    category?: string;
    project?: string;
    expenditureType?: 'CAPEX' | 'OPEX';
  }
  
  export interface Project {
    id: string;
    name: string;
    income: number;
    expenses: number;
    profit: number;
    profitMargin: number;
    capex: number;
    opex: number;
    transactions: Transaction[];
  }
  
  export interface CategoryBreakdown {
    name: string;
    value: number;
    count: number;
  }
  
  export interface MonthlyData {
    name: string;
    income: number;
    expenses: number;
    balance: number;
  }