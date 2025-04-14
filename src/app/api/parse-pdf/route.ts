import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { Transaction } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert the file to buffer for pdf-parse
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse the PDF
    const pdfData = await pdfParse(buffer);
    
    // Extract transactions from PDF text
    const transactions = extractTransactionsFromText(pdfData.text);
    
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}

// Move your transaction extraction logic here
function extractTransactionsFromText(text: string): Transaction[] {
  // Example implementation - adapt this to your specific PDF format
  const transactions: Transaction[] = [];
  
  // Split by lines and process each line that might contain transaction data
  const lines = text.split('\n');
  
  // Regular expression to match transaction data
  // This pattern needs to be adapted to your specific PDF format
  const transactionPattern = /your-pattern-here/;
  
  let currentBalance = 0;
  
  for (const line of lines) {
    const match = line.match(transactionPattern);
    if (match) {
      // Extract transaction data based on your PDF structure
      // Example extraction (modify according to your actual PDF structure):
      const date = new Date(); // Extract date from match
      const description = "Transaction description"; // Extract from match
      const amount = 0; // Extract from match
      
      currentBalance += amount;
      
      transactions.push({
        id: `tx-${transactions.length + 1}`,
        date,
        description,
        amount,
        balance: currentBalance,
        type: amount > 0 ? 'income' : 'expense',
        notes: "",
        project: determineProject(description),
        expenditureType: amount < 0 ? determineExpenditureType(description) : undefined
      });
    }
  }
  
  return transactions;
}

// Helper functions to categorize transactions
function determineProject(description: string): string {
  // Logic to determine project based on description
  // Example implementation
  if (description.includes("Project A")) return "Project A";
  if (description.includes("Project B")) return "Project B";
  return "Uncategorized";
}

function determineExpenditureType(description: string): "CAPEX" | "OPEX" {
  // Logic to determine if an expense is CAPEX or OPEX
  // Example implementation
  const capexKeywords = ["equipment", "asset", "capital", "purchase"];
  
  if (capexKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
    return "CAPEX";
  }
  
  return "OPEX";
}