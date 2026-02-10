import { useState, useEffect } from 'react';
import { authService, Department } from '../services/AuthService';
import { Briefcase, Plus, Edit } from 'lucide-react';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await authService.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (deptData: {
    departmentId: string;
    departmentName: string;
    departmentDescription?: string;
    schemaName?: string;
    displayOrder?: number;
  }) => {
    try {
      await authService.createDepartment(deptData);
      setShowCreateModal(false);
      loadDepartments();
      alert('Department created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create department');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-white text-center">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Briefcase className="w-8 h-8" />
              Department Management
            </h1>
            <p className="text-gray-400">Manage departments and roles</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Department
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Schema</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {departments.map((dept) => (
                <tr key={dept.departmentId} className="hover:bg-gray-750">
                  <td className="px-6 py-4 text-white font-mono text-sm">{dept.departmentId}</td>
                  <td className="px-6 py-4 text-white font-medium">{dept.departmentName}</td>
                  <td className="px-6 py-4 text-gray-300">{dept.departmentDescription || '-'}</td>
                  <td className="px-6 py-4 text-gray-300">{dept.schemaName || '-'}</td>
                  <td className="px-6 py-4 text-gray-300">{dept.displayOrder || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {departments.length === 0 && (
          <div className="mt-4 text-center text-gray-400">
            No departments found. Create your first department!
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDepartmentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDepartment}
        />
      )}
    </div>
  );
}

function CreateDepartmentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    departmentId: string;
    departmentName: string;
    departmentDescription?: string;
    schemaName?: string;
    displayOrder?: number;
  }) => void;
}) {
  const [departmentId, setDepartmentId] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [schemaName, setSchemaName] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId || !departmentName) {
      alert('Department ID and Name are required');
      return;
    }

    onCreate({
      departmentId: departmentId.toUpperCase(),
      departmentName,
      departmentDescription: departmentDescription || undefined,
      schemaName: schemaName || undefined,
      displayOrder: displayOrder || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Create New Department</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Department ID *
            </label>
            <input
              type="text"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="e.g., MARKETING, IT"
            />
            <p className="text-xs text-gray-400 mt-1">Uppercase letters and numbers only</p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Department Name *
            </label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Marketing, Information Technology"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={departmentDescription}
              onChange={(e) => setDepartmentDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the department's purpose"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Schema Name (optional)
            </label>
            <input
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="e.g., nex, mb"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Display Order (optional)
            </label>
            <input
              type="number"
              value={displayOrder || ''}
              onChange={(e) => setDisplayOrder(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 5"
            />
            <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Department
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
