// src/utils/pdfParser.ts
import pdfParse from 'pdf-parse';
import { Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Keywords for project detection
const PROJECT_KEYWORDS: Record<string, string> = {
  'CLA': 'Client CLA',
  'UI UX': 'UI/UX Design',
  'REDESIGN': 'Redesign Project',
  'VPS': 'VPS Infrastructure',
  'CODENITO': 'Codenito Core',
  'GOOGLE WORKSPACE': 'Workspace',
  'WATZAP': 'WatZap Project',
  'HOSTINGER': 'Web Hosting',
};

// Keywords for CAPEX vs OPEX
const CAPEX_KEYWORDS = ['VPS', 'DOMAIN', 'LICENSE', 'HOSTING'];
const OPEX_KEYWORDS = ['WORKSPACE', 'SUBSCRIPTION', 'SALARY', 'JOKI', 'TRANSPORT', 'FOOD'];

export async function parseTransactionsFromPDF(file: File): Promise<Transaction[]> {
  try {
    const buffer = await file.arrayBuffer();
    const data = await pdfParse(buffer);
    
    // Extract raw text
    const text = data.text;
    
    // Split into lines and find the transaction rows
    const lines = text.split('\n');
    const transactions: Transaction[] = [];
    
    let inTransactionSection = false;
    let currentMonth = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect month headers
      if (line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/)) {
        currentMonth = line;
        inTransactionSection = true;
        continue;
      }
      
      // Skip lines until we reach the transaction section
      if (!inTransactionSection && !line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/)) {
        continue;
      }
      
      // Skip header lines
      if (line.includes('Date & Time') || line.includes('Source/Destination') || line.includes('Transaction Details')) {
        continue;
      }
      
      // Parse transaction line
      // Format expected: Date Time | Source/Destination | Transaction Details | Notes | Amount | Balance
      
      // Check if line contains date pattern DD MMM YYYY
      const dateMatch = line.match(/^(\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})/);
      
      if (dateMatch) {
        // This is a date line, the beginning of a transaction
        const datePart = line.substring(0, 10);
        const timePart = lines[i + 1]?.trim();
        const sourcePart = lines[i + 2]?.trim();
        const destinationPart = lines[i + 3]?.trim();
        const detailsPart = lines[i + 4]?.trim();
        const notesPart = lines[i + 5]?.trim();
        const amountPart = lines[i + 6]?.trim().replace(/[.,]/g, '');
        const balancePart = lines[i + 7]?.trim().replace(/[.,]/g, '');
        
        // Skip ahead to next transaction
        i += 7;
        
        // Try to parse the date
        const dateStr = `${datePart} ${currentMonth.split(' ')[1]}`;
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
          // Skip invalid dates
          continue;
        }
        
        // Parse amount
        const amount = parseFloat(amountPart.replace(/[+\-]/g, ''));
        const isIncome = amountPart.startsWith('+');
        
        // Parse balance
        const balance = parseFloat(balancePart);
        
        // Determine transaction type
        let type: Transaction['type'] = 'transfer';
        if (detailsPart.includes('Incoming Transfer')) {
          type = 'income';
        } else if (detailsPart.includes('Outgoing Transfer')) {
          type = 'expense';
        } else if (detailsPart.includes('Interest')) {
          type = 'interest';
        } else if (detailsPart.includes('Tax')) {
          type = 'tax';
        } else if (amountPart.startsWith('+')) {
          type = 'income';
        } else if (amountPart.startsWith('-')) {
          type = 'expense';
        }
        
        // Categorize by project
        let project = '';
        for (const [keyword, projectName] of Object.entries(PROJECT_KEYWORDS)) {
          if (notesPart.toUpperCase().includes(keyword) || 
              detailsPart.toUpperCase().includes(keyword) || 
              sourcePart.toUpperCase().includes(keyword)) {
            project = projectName;
            break;
          }
        }
        
        // Determine if CAPEX or OPEX
        let expenditureType: 'CAPEX' | 'OPEX' | undefined;
        
        if (type === 'expense') {
          // Check for CAPEX keywords
          for (const keyword of CAPEX_KEYWORDS) {
            if (notesPart.toUpperCase().includes(keyword) || 
                detailsPart.toUpperCase().includes(keyword)) {
              expenditureType = 'CAPEX';
              break;
            }
          }
          
          // If not CAPEX, check for OPEX keywords
          if (!expenditureType) {
            for (const keyword of OPEX_KEYWORDS) {
              if (notesPart.toUpperCase().includes(keyword) || 
                  detailsPart.toUpperCase().includes(keyword)) {
                expenditureType = 'OPEX';
                break;
              }
            }
          }
          
          // Default to OPEX if still undefined
          if (!expenditureType) {
            expenditureType = 'OPEX';
          }
        }
        
        // Create transaction object
        const transaction: Transaction = {
          id: uuidv4(),
          date,
          amount: isIncome ? amount : -amount,
          description: detailsPart,
          source: sourcePart,
          destination: destinationPart,
          notes: notesPart,
          balance,
          type,
          project,
          expenditureType,
        };
        
        transactions.push(transaction);
      }
    }
    
    // Sort transactions by date
    return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}