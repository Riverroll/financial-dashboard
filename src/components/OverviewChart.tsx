// src/components/OverviewCharts.tsx
"use client";

import { MonthlyData, Project } from '@/types';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface OverviewChartsProps {
  monthlyData: MonthlyData[];
  projects: Project[];
}

const OverviewCharts: React.FC<OverviewChartsProps> = ({ monthlyData, projects }) => {
  // Prepare data for monthly income/expense chart
  const monthlyChartData = {
    labels: monthlyData.map(month => month.name),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(month => month.income),
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: monthlyData.map(month => Math.abs(month.expenses)),
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        tension: 0.1,
      },
      {
        label: 'Balance',
        data: monthlyData.map(month => month.balance),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.1,
      },
    ],
  };

  // Prepare data for project income distribution
  const projectIncomeData = {
    labels: projects.map(project => project.name),
    datasets: [
      {
        label: 'Income by Project',
        data: projects.map(project => project.income),
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(99, 102, 241, 0.6)',
          'rgba(236, 72, 153, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for CAPEX vs OPEX distribution
  const totalCapex = projects.reduce((sum, project) => sum + project.capex, 0);
  const totalOpex = projects.reduce((sum, project) => sum + project.opex, 0);
  
  const expenditureData = {
    labels: ['CAPEX', 'OPEX'],
    datasets: [
      {
        label: 'Expenditure Type',
        data: [totalCapex, totalOpex],
        backgroundColor: [
          'rgba(168, 85, 247, 0.6)',
          'rgba(59, 130, 246, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Financial Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Monthly Financial Trend</h3>
        <div className="h-80">
          <Line data={monthlyChartData} options={lineOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Income by Project</h3>
          <div className="h-64">
            <Pie data={projectIncomeData} options={pieOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">CAPEX vs OPEX</h3>
          <div className="h-64">
            <Pie data={expenditureData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewCharts;