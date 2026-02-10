import { useState, useEffect } from 'react';
import { authService, Node } from '../services/AuthService';
import { apiClient } from '../services/apiClient';
import { School, Building2, Plus, Trash2, Search } from 'lucide-react';

interface SchoolAssignment {
  schoolId: string;
  nodeId: string;
  schoolSource: string;
}

interface AvailableSchool {
  id: string;
  name: string;
  source: 'nex' | 'mb';
}

export default function SchoolAssignment() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [assignments, setAssignments] = useState<SchoolAssignment[]>([]);
  const [availableSchools, setAvailableSchools] = useState<AvailableSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadNodes();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      loadAssignments();
    } else {
      setAssignments([]);
    }
  }, [selectedNode]);

  const loadNodes = async () => {
    try {
      setLoading(true);
      const data = await authService.getNodes(false); // Flat list
      setNodes(data);
    } catch (err: any) {
      console.error('Failed to load nodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!selectedNode) return;
    try {
      const data = await authService.getSchoolsInNode(selectedNode);
      setAssignments(data);
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    }
  };

  const loadAvailableSchools = async () => {
    try {
      // Load schools from admin endpoint
      const schools = await apiClient.get<AvailableSchool[]>('/api/admin/schools');
      setAvailableSchools(schools);
    } catch (err: any) {
      console.error('Failed to load available schools:', err);
      // Fallback: show empty list with message
      setAvailableSchools([]);
    }
  };

  const handleAssignSchool = async (schoolId: string, schoolSource: 'nex' | 'mb') => {
    if (!selectedNode) {
      alert('Please select a node first');
      return;
    }

    try {
      await authService.assignSchoolToNode(selectedNode, schoolId, schoolSource);
      setShowAssignModal(false);
      loadAssignments();
      alert('School assigned successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign school');
    }
  };

  const handleUnassignSchool = async (schoolId: string, schoolSource: string) => {
    if (!selectedNode) return;
    
    if (!confirm(`Unassign ${schoolId} (${schoolSource}) from this node?`)) {
      return;
    }

    try {
      await authService.unassignSchoolFromNode(selectedNode, schoolId, schoolSource as 'nex' | 'mb');
      loadAssignments();
      alert('School unassigned successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unassign school');
    }
  };

  const filteredSchools = availableSchools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-white text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <School className="w-8 h-8" />
              School Assignment
            </h1>
            <p className="text-gray-400">Assign schools to organizational nodes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Node Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Select Node
            </h2>
            <select
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a node --</option>
              {nodes.map((node) => (
                <option key={node.nodeId} value={node.nodeId}>
                  {node.nodeDescription} ({node.nodeId})
                  {node.isHeadOffice && ' - HQ'}
                </option>
              ))}
            </select>
          </div>

          {/* Current Assignments */}
          {selectedNode && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <School className="w-5 h-5" />
                  Assigned Schools
                </h2>
                <button
                  onClick={() => {
                    loadAvailableSchools();
                    setShowAssignModal(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Assign School
                </button>
              </div>
              {assignments.length === 0 ? (
                <p className="text-gray-400">No schools assigned to this node</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={`${assignment.schoolId}-${assignment.schoolSource}`}
                      className="p-3 bg-gray-700 rounded flex items-center justify-between"
                    >
                      <div>
                        <span className="text-white font-medium">{assignment.schoolId}</span>
                        <span className="text-gray-400 ml-2">({assignment.schoolSource})</span>
                      </div>
                      <button
                        onClick={() => handleUnassignSchool(assignment.schoolId, assignment.schoolSource)}
                        className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                        title="Unassign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assign School Modal */}
        {showAssignModal && selectedNode && (
          <AssignSchoolModal
            schools={filteredSchools}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClose={() => {
              setShowAssignModal(false);
              setSearchTerm('');
            }}
            onAssign={handleAssignSchool}
          />
        )}
      </div>
    </div>
  );
}

function AssignSchoolModal({
  schools,
  searchTerm,
  onSearchChange,
  onClose,
  onAssign,
}: {
  schools: AvailableSchool[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClose: () => void;
  onAssign: (schoolId: string, source: 'nex' | 'mb') => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <h2 className="text-2xl font-bold text-white mb-4">Assign School to Node</h2>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search schools..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* School List */}
        <div className="flex-1 overflow-y-auto mb-4">
          {schools.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              {searchTerm ? 'No schools found' : 'Loading schools...'}
              <br />
              <span className="text-sm mt-2 block">
                Note: You may need to configure school data sources first
              </span>
            </p>
          ) : (
            <div className="space-y-2">
              {schools.map((school) => (
                <button
                  key={`${school.source}-${school.id}`}
                  onClick={() => {
                    onAssign(school.id, school.source);
                  }}
                  className="w-full p-3 bg-gray-700 rounded hover:bg-gray-600 text-left flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-medium">{school.name}</div>
                    <div className="text-gray-400 text-sm">
                      ID: {school.id} • Source: {school.source.toUpperCase()}
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-blue-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
