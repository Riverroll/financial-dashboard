// src/utils/pdfParser.ts
import { Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjs from 'pdfjs-dist';

// Make sure the PDF.js API version matches the worker version
const pdfjsVersion = '3.11.174';
const pdfjsWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Keywords for CAPEX vs OPEX
const CAPEX_KEYWORDS = ['VPS', 'DOMAIN', 'LICENSE', 'HOSTING'];
const OPEX_KEYWORDS = ['WORKSPACE', 'SUBSCRIPTION', 'SALARY', 'JOKI', 'TRANSPORT', 'FOOD'];

// Debug function to log the extracted text structure
function logPdfStructure(text: string): void {
  console.log('PDF Structure:');
  console.log('-------------');
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    if (line.trim()) {
      console.log(`Line ${index + 1}: "${line}"`);
    }
  });
  console.log('-------------');
}

export async function parseTransactionsFromPDF(file: File): Promise<Transaction[]> {
  try {
    const buffer = await file.arrayBuffer();
    
    // Load the PDF document using PDF.js
    const loadingTask = pdfjs.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    let text = '';
    
    // Extract text from all pages
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Extract text with position information to better preserve layout
      const items = content.items;
      
      // Sort items by vertical position (y) first, then horizontal (x)
      items.sort((a, b) => {
        if ('transform' in a && 'transform' in b) {
          // Get y position (typical location is at index 5 in transform array)
          const yA = a.transform[5];
          const yB = b.transform[5];
          
          // If y positions are close, sort by x
          if (Math.abs(yA - yB) < 5) {
            return a.transform[4] - b.transform[4];
          }
          
          // Otherwise sort by y in descending order (top to bottom)
          return yB - yA;
        }
        return 0;
      });
      
      // Group items by line (based on y position)
      const lines: any[][] = [];
      let currentLine: any[] = [];
      let lastY = 0;
      
      items.forEach(item => {
        if ('str' in item && item.str.trim()) {
          if ('transform' in item) {
            const y = item.transform[5];
            
            // If this is a new line (y position differs significantly)
            if (currentLine.length > 0 && Math.abs(y - lastY) > 5) {
              lines.push([...currentLine]);
              currentLine = [];
            }
            
            currentLine.push(item);
            lastY = y;
          }
        }
      });
      
      // Add the last line if not empty
      if (currentLine.length > 0) {
        lines.push([...currentLine]);
      }
      
      // Convert grouped items to lines of text
      lines.forEach(lineItems => {
        // Sort items in a line by x position
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
        
        // Extract text from items
        const lineText = lineItems.map(item => 'str' in item ? item.str : '').join(' ');
        text += lineText + '\n';
      });
    }
    
    // Log the extracted text structure for debugging
    logPdfStructure(text);
    
    // Process the extracted text
    const lines = text.split('\n');
    const transactions: Transaction[] = [];
    
    // More flexible pattern matching for transaction detection
    let currentDate: Date | null = null;
    let currentTransaction: Partial<Transaction> | null = null;
    
    // Enhanced month detection to include more formats
    const monthRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)(\s+\d{4})?/i;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      // Check for date patterns
      // Common formats: "DD MMM YYYY", "DD/MM/YYYY", "YYYY-MM-DD"
      const datePatterns = [
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/
      ];
      
      let isDateLine = false;
      let extractedDate: Date | null = null;
      
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          isDateLine = true;
          
          // Parse the date based on the pattern
          if (pattern === datePatterns[0]) {
            // DD MMM YYYY
            const day = match[1];
            const month = match[2];
            const year = match[3];
            extractedDate = new Date(`${day} ${month} ${year}`);
          } else if (pattern === datePatterns[1]) {
            // DD/MM/YYYY
            const day = match[1];
            const month = match[2];
            const year = match[3];
            extractedDate = new Date(`${year}-${month}-${day}`);
          } else if (pattern === datePatterns[2]) {
            // YYYY-MM-DD
            extractedDate = new Date(match[0]);
          }
          
          break;
        }
      }
      
      // If we found a date, start a new transaction
      if (isDateLine && extractedDate && !isNaN(extractedDate.getTime())) {
        // If we have a partially built transaction, save it
        if (currentTransaction && currentTransaction.date && currentTransaction.amount) {
          transactions.push({
            id: uuidv4(),
            date: currentTransaction.date,
            amount: currentTransaction.amount,
            description: currentTransaction.description || '',
            source: currentTransaction.source || '',
            destination: currentTransaction.destination || '',
            notes: currentTransaction.notes || '',
            balance: currentTransaction.balance || 0,
            type: currentTransaction.type || 'transfer',
            project: '',
            expenditureType: currentTransaction.expenditureType,
          } as Transaction);
        }
        
        // Start a new transaction
        currentTransaction = {
          date: extractedDate
        };
        
        currentDate = extractedDate;
        continue;
      }
      
      // Skip if we haven't found a transaction date yet
      if (!currentTransaction || !currentDate) {
        continue;
      }
      
      // Look for amount patterns (+XXX,XXX or -XXX,XXX or just numbers)
      const amountMatch = line.match(/([+\-])?([\d,.]+)/);
      
      if (amountMatch && !currentTransaction.amount) {
        const sign = amountMatch[1] === '-' ? -1 : 1;
        const amountStr = amountMatch[2].replace(/[,.]/g, '');
        const amount = parseFloat(amountStr) * sign;
        
        currentTransaction.amount = amount;
        
        // Determine transaction type based on amount
        currentTransaction.type = amount < 0 ? 'expense' : 'income';
        
        // Check if the next line might contain a balance
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const balanceMatch = nextLine.match(/^[\d,.]+$/);
          
          if (balanceMatch) {
            currentTransaction.balance = parseFloat(nextLine.replace(/[,.]/g, ''));
            i++; // Skip the balance line
          }
        }
        
        continue;
      }
      
      // Try to extract other transaction details
      if (currentTransaction) {
        // If line contains transaction details keywords
        if (line.includes('Transfer') || line.includes('Payment') || line.includes('Deposit')) {
          currentTransaction.description = line;
          
          // Determine transaction type from description
          if (line.includes('Incoming') || line.includes('Deposit')) {
            currentTransaction.type = 'income';
          } else if (line.includes('Outgoing') || line.includes('Payment')) {
            currentTransaction.type = 'expense';
          }
        }
        // If line looks like a source or destination
        else if (!currentTransaction.source && !line.match(/^\d/) && !line.match(/^[+\-]/)) {
          currentTransaction.source = line;
        }
        // If line looks like a note
        else if (!currentTransaction.notes && line.length > 10) {
          currentTransaction.notes = line;
          
          // Determine CAPEX vs OPEX based on notes
          if (currentTransaction.type === 'expense') {
            // Check for CAPEX keywords
            for (const keyword of CAPEX_KEYWORDS) {
              if (line.toUpperCase().includes(keyword)) {
                currentTransaction.expenditureType = 'CAPEX';
                break;
              }
            }
            
            // If not CAPEX, check for OPEX keywords
            if (!currentTransaction.expenditureType) {
              for (const keyword of OPEX_KEYWORDS) {
                if (line.toUpperCase().includes(keyword)) {
                  currentTransaction.expenditureType = 'OPEX';
                  break;
                }
              }
            }
            
            // Default to OPEX if still undefined
            if (!currentTransaction.expenditureType) {
              currentTransaction.expenditureType = 'OPEX';
            }
          }
        }
      }
    }
    
    // Don't forget to add the last transaction if we have one
    if (currentTransaction && currentTransaction.date && currentTransaction.amount) {
      transactions.push({
        id: uuidv4(),
        date: currentTransaction.date,
        amount: currentTransaction.amount,
        description: currentTransaction.description || '',
        source: currentTransaction.source || '',
        destination: currentTransaction.destination || '',
        notes: currentTransaction.notes || '',
        balance: currentTransaction.balance || 0,
        type: currentTransaction.type || 'transfer',
        project: '',
        expenditureType: currentTransaction.expenditureType,
      } as Transaction);
    }
    
    // Log what we found
    console.log(`Found ${transactions.length} transactions`);
    if (transactions.length === 0) {
      console.error('No transactions found in the PDF');
      throw new Error('No valid transactions were found in the PDF. Please ensure this is a Jago Codenito statement.');
    }
    
    // Sort transactions by date
    return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to parse the PDF file');
  }
}