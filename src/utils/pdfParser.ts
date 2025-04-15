// src/utils/pdfParser.ts
import { Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjs from 'pdfjs-dist';

const pdfjsVersion = '3.11.174';
const pdfjsWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const CAPEX_KEYWORDS = ['VPS', 'DOMAIN', 'LICENSE', 'HOSTING'];
const OPEX_KEYWORDS = ['WORKSPACE', 'SUBSCRIPTION', 'SALARY', 'JOKI', 'TRANSPORT', 'FOOD'];

function parseIndonesianAmount(raw: string): number {
    return parseFloat(raw.replace(/\./g, '').replace(',', '.'));
}

export async function parseTransactionsFromPDF(file: File): Promise<Transaction[]> {
    try {
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;

        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const items = content.items;

            items.sort((a, b) => {
                const yA = a.transform[5];
                const yB = b.transform[5];
                if (Math.abs(yA - yB) < 5) return a.transform[4] - b.transform[4];
                return yB - yA;
            });

            const lines: any[][] = [];
            let currentLine: any[] = [];
            let lastY = 0;

            items.forEach(item => {
                if ('str' in item && item.str.trim()) {
                    const y = item.transform[5];
                    if (currentLine.length > 0 && Math.abs(y - lastY) > 5) {
                        lines.push([...currentLine]);
                        currentLine = [];
                    }
                    currentLine.push(item);
                    lastY = y;
                }
            });
            if (currentLine.length > 0) lines.push([...currentLine]);

            lines.forEach(lineItems => {
                lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
                const lineText = lineItems.map(item => item.str).join(' ');
                text += lineText + '\n';
            });
        }

        const lines = text.split('\n');
        const transactions: Transaction[] = [];

        for (let i = 0; i < lines.length - 5; i++) {
            const dateLine = lines[i].trim();
            const sourceLine = lines[i + 1].trim();
            const detailLine = lines[i + 2].trim();
            const notesLine = lines[i + 3].trim();
            const amountLine = lines[i + 4].trim();
            const balanceLine = lines[i + 5].trim();

            const dateMatch = dateLine.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
            if (!dateMatch) continue;

            const [_, day, monthStr, year] = dateMatch;
            const date = new Date(`${day} ${monthStr} ${year}`);

            const amount = parseIndonesianAmount(amountLine);
            const balance = parseIndonesianAmount(balanceLine);

            const expenditureType =
                amount < 0 && CAPEX_KEYWORDS.some(k => notesLine.toUpperCase().includes(k))
                    ? 'CAPEX'
                    : amount < 0
                    ? 'OPEX'
                    : undefined;

            transactions.push({
                id: uuidv4(),
                date,
                amount,
                balance,
                description: detailLine,
                source: sourceLine,
                destination: '',
                notes: notesLine,
                type: amount < 0 ? 'expense' : 'income',
                project: '',
                expenditureType,
            } as Transaction);

            i += 5; // Move to next transaction block
        }

        if (transactions.length === 0) {
            throw new Error('No valid transactions were found in the PDF. Make sure the file is a Jago statement.');
        }

        console.log(`Parsed ${transactions.length} transactions.`);
        return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to parse the PDF file');
    }
}
