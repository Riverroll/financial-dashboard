// src/app/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import TransactionUploader from "@/components/TransactionUploader";
import Dashboard from "@/components/Dashboard";
import { Transaction } from "@/types";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTransactionsLoaded = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Codenito Financial Dashboard</h1>
          <div className="flex items-center gap-4">
            {transactions.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {transactions.length} transactions loaded
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-6">Upload Your Bank Statement</h2>
            <TransactionUploader 
              onTransactionsLoaded={handleTransactionsLoaded} 
              setIsLoading={setIsLoading}
            />
          </div>
        ) : (
          <Dashboard transactions={transactions} />
        )}
      </main>
    </div>
  );
}