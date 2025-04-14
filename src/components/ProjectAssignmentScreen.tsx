// src/components/ProjectAssignmentScreen.tsx
import { useState } from 'react';
import { Transaction, Project } from '@/types';

interface ProjectAssignmentScreenProps {
  transactions: Transaction[];
  onComplete: (transactions: Transaction[]) => void;
  existingProjects?: Project[];
}

const ProjectAssignmentScreen: React.FC<ProjectAssignmentScreenProps> = ({
  transactions,
  onComplete,
  existingProjects = []
}) => {
  const [assignedTransactions, setAssignedTransactions] = useState<Transaction[]>(transactions);
  const [availableProjects, setAvailableProjects] = useState<string[]>(
    existingProjects.map(p => p.name) || ['Unassigned']
  );
  const [newProjectName, setNewProjectName] = useState('');

  const handleProjectChange = (transactionId: string, project: string) => {
    setAssignedTransactions(transactions.map(t => 
      t.id === transactionId ? { ...t, project } : t
    ));
  };

  const addNewProject = () => {
    if (newProjectName && !availableProjects.includes(newProjectName)) {
      setAvailableProjects([...availableProjects, newProjectName]);
      setNewProjectName('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Assign Transactions to Projects</h2>
      
      {/* Add new project section */}
      <div className="flex items-end space-x-2">
        <div className="flex-grow">
          <label className="block text-sm font-medium mb-1">Add New Project</label>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter new project name"
          />
        </div>
        <button
          onClick={addNewProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Project
        </button>
      </div>
      
      {/* Transactions table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="py-2 px-3 text-left">Date</th>
              <th className="py-2 px-3 text-left">Description</th>
              <th className="py-2 px-3 text-right">Amount</th>
              <th className="py-2 px-3 text-left">Notes</th>
              <th className="py-2 px-3 text-left">Project</th>
            </tr>
          </thead>
          <tbody>
            {assignedTransactions.map(transaction => (
              <tr key={transaction.id} className="border-t">
                <td className="py-2 px-3">{transaction.date.toLocaleDateString()}</td>
                <td className="py-2 px-3">{transaction.description}</td>
                <td className="py-2 px-3 text-right">
                  <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                    {new Intl.NumberFormat('id-ID', { 
                      style: 'currency', 
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(transaction.amount)}
                  </span>
                </td>
                <td className="py-2 px-3">{transaction.notes}</td>
                <td className="py-2 px-3">
                  <select
                    value={transaction.project || 'Unassigned'}
                    onChange={(e) => handleProjectChange(transaction.id, e.target.value)}
                    className="w-full p-1 border rounded"
                  >
                    {availableProjects.map(project => (
                      <option key={project} value={project}>{project}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => onComplete(assignedTransactions)}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Complete
        </button>
      </div>
    </div>
  );
};

export default ProjectAssignmentScreen;