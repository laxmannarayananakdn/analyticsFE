import { useState, useEffect } from 'react';
import { authService, User, Department, Node, UserAccess } from '../services/AuthService';
import { apiClient } from '../services/apiClient';
import { Shield, Users, Save, RefreshCw } from 'lucide-react';

interface NodeAccess {
  nodeId: string;
  nodeDescription: string;
  departments: string[]; // Selected departments for this node
}

export default function AccessControl() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [nodeAccesses, setNodeAccesses] = useState<Record<string, NodeAccess>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserAccess();
    } else {
      setUserAccess([]);
      setNodeAccesses({});
    }
  }, [selectedUser]);

  useEffect(() => {
    // Initialize nodeAccesses from userAccess only when userAccess or nodes change
    if (userAccess.length > 0 && nodes.length > 0) {
      const accessObj: Record<string, NodeAccess> = {};
      
      // Group access by node
      userAccess.forEach((access) => {
        if (!accessObj[access.nodeId]) {
          const node = nodes.find(n => n.nodeId === access.nodeId);
          accessObj[access.nodeId] = {
            nodeId: access.nodeId,
            nodeDescription: node?.nodeDescription || access.nodeId,
            departments: [],
          };
        }
        const nodeAccess = accessObj[access.nodeId];
        if (!nodeAccess.departments.includes(access.departmentId)) {
          nodeAccess.departments.push(access.departmentId);
        }
      });
      
      // Also initialize empty access for nodes that don't have any access yet
      nodes.forEach((node) => {
        if (!accessObj[node.nodeId]) {
          accessObj[node.nodeId] = {
            nodeId: node.nodeId,
            nodeDescription: node.nodeDescription,
            departments: [],
          };
        }
      });
      
      setNodeAccesses(accessObj);
    } else if (nodes.length > 0 && selectedUser) {
      // Initialize empty access for all nodes when user is selected but no access exists
      const accessObj: Record<string, NodeAccess> = {};
      nodes.forEach((node) => {
        accessObj[node.nodeId] = {
          nodeId: node.nodeId,
          nodeDescription: node.nodeDescription,
          departments: [],
        };
      });
      setNodeAccesses(accessObj);
    }
  }, [userAccess, nodes, selectedUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, deptsData, nodesData] = await Promise.all([
        authService.getUsers(),
        authService.getDepartments(),
        authService.getNodes(false), // Get flat list, not tree
      ]);
      setUsers(usersData);
      setDepartments(deptsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999)));
      setNodes(nodesData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAccess = async () => {
    if (!selectedUser) return;
    try {
      const access = await authService.getUserAccess(selectedUser);
      setUserAccess(access);
    } catch (err: any) {
      console.error('Failed to load user access:', err);
    }
  };

  const toggleDepartment = (nodeId: string, departmentId: string) => {
    setNodeAccesses((prev) => {
      const existingAccess = prev[nodeId];
      
      // Create a new object to ensure React detects the change
      const nodeAccess = existingAccess ? {
        ...existingAccess,
        departments: existingAccess.departments.includes(departmentId)
          ? existingAccess.departments.filter(d => d !== departmentId)
          : [...existingAccess.departments, departmentId]
      } : {
        nodeId,
        nodeDescription: nodes.find(n => n.nodeId === nodeId)?.nodeDescription || nodeId,
        departments: [departmentId],
      };
      
      // Return a new object to ensure React detects the change
      return {
        ...prev,
        [nodeId]: nodeAccess,
      };
    });
  };

  const handleSave = async () => {
    if (!selectedUser) {
      alert('Please select a user first');
      return;
    }

    setSaving(true);
    try {
      // Get all nodes that have at least one department selected
      const nodesToUpdate = Object.values(nodeAccesses).filter(
        (na) => na.departments.length > 0
      );

      // For each node, update the access
      for (const nodeAccess of nodesToUpdate) {
        await authService.grantAccess(selectedUser, nodeAccess.nodeId, nodeAccess.departments);
      }

      // Remove access for nodes that have no departments selected
      const nodesToRemove = Object.values(nodeAccesses).filter(
        (na) => na.departments.length === 0
      );

      for (const nodeAccess of nodesToRemove) {
        // Check if user currently has access to this node
        const hasAccess = userAccess.some(ua => ua.nodeId === nodeAccess.nodeId);
        if (hasAccess) {
          await authService.revokeNodeAccess(selectedUser, nodeAccess.nodeId);
        }
      }

      // Reload access to show updated state
      await loadUserAccess();
      alert('Access updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save access');
    } finally {
      setSaving(false);
    }
  };

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
              <Shield className="w-8 h-8" />
              Access Control
            </h1>
            <p className="text-gray-400">Manage user access to nodes and departments</p>
          </div>
          {selectedUser && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>

        {/* User Selection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select User
          </h2>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a user --</option>
            {users.map((user) => (
              <option key={user.email} value={user.email}>
                {user.displayName || user.email} {!user.isActive && '(Inactive)'}
              </option>
            ))}
          </select>
        </div>

        {/* Node and Department Access Table */}
        {selectedUser && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Node & Department Access
            </h2>
            
            {nodes.length === 0 ? (
              <p className="text-gray-400">No nodes found. Create nodes first.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Node</th>
                      {departments.map((dept) => (
                        <th
                          key={dept.departmentId}
                          className="px-4 py-3 text-center text-sm font-medium text-gray-300"
                        >
                          {dept.departmentName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {nodes.map((node) => {
                      const nodeAccess = nodeAccesses[node.nodeId] || {
                        nodeId: node.nodeId,
                        nodeDescription: node.nodeDescription,
                        departments: [],
                      };
                      
                      return (
                        <tr key={node.nodeId} className="hover:bg-gray-750">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {node.nodeDescription}
                              </span>
                              <span className="text-gray-400 text-sm">({node.nodeId})</span>
                              {node.isHeadOffice && (
                                <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded">
                                  HQ
                                </span>
                              )}
                            </div>
                          </td>
                          {departments.map((dept) => {
                            const isChecked = nodeAccess.departments.includes(dept.departmentId);
                            return (
                              <td key={dept.departmentId} className="px-4 py-3 text-center">
                                <label className="cursor-pointer flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleDepartment(node.nodeId, dept.departmentId);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedUser && nodes.length > 0 && (
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded text-blue-200 text-sm">
                <p className="font-medium mb-1">💡 How to use:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Select a user from the dropdown above</li>
                  <li>Check the departments for each node you want to grant access to</li>
                  <li>Click "Save Changes" to apply the access</li>
                  <li>Unchecking all departments for a node will remove all access to that node</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
