// src/components/TransactionUploader.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseTransactionsFromPDF } from "@/utils/pdfParser";
import { Transaction } from "@/types";

interface TransactionUploaderProps {
  onTransactionsLoaded: (transactions: Transaction[]) => void;
  setIsLoading: (isLoading: boolean) => void;
}

const TransactionUploader: React.FC<TransactionUploaderProps> = ({
  onTransactionsLoaded,
  setIsLoading,
}) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      try {
        setError(null);
        setIsLoading(true);
        
        const file = acceptedFiles[0];
        const transactions = await parseTransactionsFromPDF(file);
        
        onTransactionsLoaded(transactions);
      } catch (err) {
        console.error("Error processing PDF:", err);
        setError("Failed to process the PDF. Please make sure it's a valid Jago Codenito statement.");
      } finally {
        setIsLoading(false);
      }
    },
    [onTransactionsLoaded, setIsLoading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  return (
    <div className="max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the PDF here...</p>
            ) : (
              <>
                <p className="text-lg font-medium">
                  Drag & drop your Jago Codenito statement
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Or click to select a PDF file
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Instructions:</h3>
        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
          <li>Upload your Jago Codenito bank statement PDF</li>
          <li>The system will automatically extract transactions</li>
          <li>Transactions will be categorized by project based on descriptions</li>
          <li>Financial analysis including CAPEX/OPEX and profit margins will be generated</li>
        </ul>
      </div>
    </div>
  );
};

export default TransactionUploader;