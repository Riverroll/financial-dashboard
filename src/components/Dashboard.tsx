// src/components/Dashboard.tsx
"use client";

import { useState, useMemo } from 'react';
import { Transaction, Project, CategoryBreakdown, MonthlyData } from '@/types';
import { Tab } from '@headlessui/react';
import classNames from 'classnames';
import { format } from 'date-fns';
import ProjectCard from './ProjectCard';
import TransactionList from './TransactionList';
import OverviewCharts from './OverviewChart';
import ProjectBreakdown from './ProjectBreakdown';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Calculate summary data
  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expenses;
    
    return {
      income,
      expenses,
      balance,
      transactionCount: transactions.length,
    };
  }, [transactions]);
  
  // Calculate project data
  const projects = useMemo(() => {
    const projectMap = new Map<string, Project>();
    
    // Group transactions by project
    transactions.forEach(transaction => {
      const projectName = transaction.project || 'Uncategorized';
      
      if (!projectMap.has(projectName)) {
        projectMap.set(projectName, {
          id: projectName,
          name: projectName,
          income: 0,
          expenses: 0,
          profit: 0,
          profitMargin: 0,
          capex: 0,
          opex: 0,
          transactions: [],
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
        } else if (transaction.expenditureType === 'OPEX') {
          project.opex += Math.abs(transaction.amount);
        }
      }
    });
    
    // Calculate profit and profit margin
    projectMap.forEach(project => {
      project.profit = project.income - project.expenses;
      project.profitMargin = project.income > 0 
        ? (project.profit / project.income) * 100 
        : 0;
    });
    
    return Array.from(projectMap.values());
  }, [transactions]);
  
  // Calculate monthly data for charts
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, MonthlyData>();
    
    transactions.forEach(transaction => {
      const monthKey = format(transaction.date, 'MMM yyyy');
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          name: monthKey,
          income: 0,
          expenses: 0,
          balance: 0,
        });
      }
      
      const monthData = monthMap.get(monthKey)!;
      
      if (transaction.amount > 0) {
        monthData.income += transaction.amount;
      } else {
        monthData.expenses += Math.abs(transaction.amount);
      }
      
      monthData.balance = monthData.income - monthData.expenses;
    });
    
    return Array.from(monthMap.values())
      .sort((a, b) => {
        const [aMonth, aYear] = a.name.split(' ');
        const [bMonth, bYear] = b.name.split(' ');
        return parseInt(aYear) - parseInt(bYear) || 
               new Date(Date.parse(`${aMonth} 1, 2000`)).getMonth() - 
               new Date(Date.parse(`${bMonth} 1, 2000`)).getMonth();
      });
  }, [transactions]);
  
  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(summary.income)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(summary.expenses)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Balance</h3>
          <p className={classNames("mt-2 text-3xl font-semibold", {
            "text-green-600 dark:text-green-400": summary.balance >= 0,
            "text-red-600 dark:text-red-400": summary.balance < 0,
          })}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transactions</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
            {summary.transactionCount}
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <Tab.Group onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab className={({ selected }) =>
            classNames(
              'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
              selected
                ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
                : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.12] hover:text-blue-600'
            )
          }>
            Overview
          </Tab>
          <Tab className={({ selected }) =>
            classNames(
              'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
              selected
                ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
                : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.12] hover:text-blue-600'
            )
          }>
            Projects
          </Tab>
          <Tab className={({ selected }) =>
            classNames(
              'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
              selected
                ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
                : 'text-gray-700 dark:text-gray-400 hover:bg-white/[0.12] hover:text-blue-600'
            )
          }>
            Transactions
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-2">
          {/* Overview Panel */}
          <Tab.Panel className={classNames('rounded-xl bg-white dark:bg-gray-800 p-6')}>
            <h2 className="text-xl font-semibold mb-6">Financial Overview</h2>
            <OverviewCharts monthlyData={monthlyData} projects={projects} />
          </Tab.Panel>
          
          {/* Projects Panel */}
          <Tab.Panel className={classNames('rounded-xl bg-white dark:bg-gray-800 p-6')}>
            <h2 className="text-xl font-semibold mb-6">Project Analysis</h2>
            <ProjectBreakdown projects={projects} formatCurrency={formatCurrency} />
            
            <h3 className="text-lg font-medium mt-8 mb-4">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  formatCurrency={formatCurrency} 
                />
              ))}
            </div>
          </Tab.Panel>
          
          {/* Transactions Panel */}
          <Tab.Panel className={classNames('rounded-xl bg-white dark:bg-gray-800 p-6')}>
            <h2 className="text-xl font-semibold mb-6">Transaction History</h2>
            <TransactionList 
              transactions={transactions} 
              formatCurrency={formatCurrency} 
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Dashboard;