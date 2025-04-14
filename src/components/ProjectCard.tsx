// src/components/ProjectCard.tsx
import { Project } from '@/types';
import classNames from 'classnames';

interface ProjectCardProps {
  project: Project;
  formatCurrency: (amount: number) => string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, formatCurrency }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{project.name}</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-base font-medium text-green-600 dark:text-green-400">
              {formatCurrency(project.income)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Expenses</p>
            <p className="text-base font-medium text-red-600 dark:text-red-400">
              {formatCurrency(project.expenses)}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">CAPEX</p>
            <p className="text-base font-medium text-purple-600 dark:text-purple-400">
              {formatCurrency(project.capex)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">OPEX</p>
            <p className="text-base font-medium text-blue-600 dark:text-blue-400">
              {formatCurrency(project.opex)}
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">Profit</p>
            <p className={classNames("text-base font-medium", {
              "text-green-600 dark:text-green-400": project.profit >= 0,
              "text-red-600 dark:text-red-400": project.profit < 0,
            })}>
              {formatCurrency(project.profit)}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Profit Margin</p>
            <p className={classNames("text-base font-medium", {
              "text-green-600 dark:text-green-400": project.profitMargin >= 0,
              "text-red-600 dark:text-red-400": project.profitMargin < 0,
            })}>
              {project.profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {project.transactions.length} transactions
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;