// src/components/ProjectBreakdown.tsx
"use client";

import { useState } from 'react';
import { Project } from '@/types';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProjectBreakdownProps {
  projects: Project[];
  formatCurrency: (amount: number) => string;
}

const ProjectBreakdown: React.FC<ProjectBreakdownProps> = ({ projects, formatCurrency }) => {
  const [chartType, setChartType] = useState<'income' | 'profit' | 'margin'>('profit');
  
  // Sort projects by selected chart type
  const sortedProjects = [...projects].sort((a, b) => {
    if (chartType === 'income') return b.income - a.income;
    if (chartType === 'profit') return b.profit - a.profit;
    return b.profitMargin - a.profitMargin;
  });

  // Prepare data for the selected chart
  const chartData = {
    labels: sortedProjects.map(project => project.name),
    datasets: [
      {
        label: chartType === 'income' ? 'Income' : chartType === 'profit' ? 'Profit' : 'Profit Margin (%)',
        data: sortedProjects.map(project => 
          chartType === 'income' ? project.income : 
          chartType === 'profit' ? project.profit : 
          project.profitMargin
        ),
        backgroundColor: sortedProjects.map(project => {
          if (chartType === 'margin' || chartType === 'profit') {
            const value = chartType === 'margin' ? project.profitMargin : project.profit;
            return value >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
          }
          return 'rgba(59, 130, 246, 0.6)';
        }),
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: chartType === 'income' ? 'Project Income' : 
              chartType === 'profit' ? 'Project Profit' : 
              'Project Profit Margin',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Calculate total profit, revenue, and average margin
  const totalRevenue = projects.reduce((sum, project) => sum + project.income, 0);
  const totalProfit = projects.reduce((sum, project) => sum + project.profit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
          <p className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Profit</h3>
          <p className={`mt-2 text-xl font-semibold ${
            totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Margin</h3>
          <p className={`mt-2 text-xl font-semibold ${
            avgMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {avgMargin.toFixed(1)}%
          </p>
        </div>
      </div>
      
      {/* Chart Type Selector */}
      <div className="flex justify-center space-x-4 pb-4">
        <button
          onClick={() => setChartType('income')}
          className={`px-4 py-2 rounded-md ${
            chartType === 'income' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setChartType('profit')}
          className={`px-4 py-2 rounded-md ${
            chartType === 'profit' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Profit
        </button>
        <button
          onClick={() => setChartType('margin')}
          className={`px-4 py-2 rounded-md ${
            chartType === 'margin' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Margin
        </button>
      </div>
      
      {/* Project Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
      
      {/* Project Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Income
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Expenses
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Profit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Margin
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedProjects.map(project => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {project.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                  {formatCurrency(project.income)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                  {formatCurrency(project.expenses)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                  project.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(project.profit)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                  project.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {project.profitMargin.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectBreakdown;