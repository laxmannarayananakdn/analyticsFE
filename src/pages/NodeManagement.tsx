import { useState, useEffect } from 'react';
import { authService, Node } from '../services/AuthService';
import { Building2, Plus, TreePine, ChevronRight, ChevronDown, Edit2, School, Briefcase } from 'lucide-react';

export default function NodeManagement() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [flatNodes, setFlatNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [headOfficeNodeId, setHeadOfficeNodeId] = useState<string | null>(null);

  useEffect(() => {
    loadNodes();
  }, []);

  useEffect(() => {
    // Find Head Office node
    const hqNode = flatNodes.find(n => n.isHeadOffice);
    setHeadOfficeNodeId(hqNode?.nodeId || null);
  }, [flatNodes]);

  const loadNodes = async () => {
    try {
      setLoading(true);
      const treeData = await authService.getNodes(true); // Get tree structure
      const flatData = await authService.getNodes(false); // Get flat list
      setNodes(Array.isArray(treeData) ? treeData : []);
      setFlatNodes(Array.isArray(flatData) ? flatData : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleCreateNode = async (nodeData: {
    nodeId: string;
    nodeDescription: string;
    isHeadOffice: boolean;
    isSchoolNode: boolean;
    parentNodeId: string | null;
  }) => {
    try {
      await authService.createNode(nodeData);
      setShowCreateModal(false);
      loadNodes();
      alert('Node created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create node');
    }
  };

  const handleUpdateNode = async (nodeId: string, updates: {
    isHeadOffice?: boolean;
    isSchoolNode?: boolean;
  }) => {
    try {
      await authService.updateNode(nodeId, updates);
      loadNodes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update node');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-white text-center">Loading nodes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Building2 className="w-8 h-8" />
              Node Management
            </h1>
            <p className="text-gray-400">Manage organizational hierarchy</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Node
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TreePine className="w-5 h-5" />
            Organizational Hierarchy
          </h2>
          <NodeTree
            nodes={nodes}
            expandedNodes={expandedNodes}
            onToggleExpand={toggleExpand}
            headOfficeNodeId={headOfficeNodeId}
            onUpdateNode={handleUpdateNode}
          />
        </div>
      </div>

      {showCreateModal && (
        <CreateNodeModal
          nodes={flatNodes}
          headOfficeNodeId={headOfficeNodeId}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateNode}
        />
      )}
    </div>
  );
}

function NodeTree({
  nodes,
  expandedNodes,
  onToggleExpand,
  headOfficeNodeId,
  onUpdateNode,
  level = 0,
}: {
  nodes: Node[];
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  headOfficeNodeId: string | null;
  onUpdateNode: (nodeId: string, updates: { isHeadOffice?: boolean; isSchoolNode?: boolean }) => void;
  level?: number;
}) {
  if (nodes.length === 0) {
    return <p className="text-gray-400">No nodes found. Create your first node!</p>;
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <NodeItem
          key={node.nodeId}
          node={node}
          level={level}
          expandedNodes={expandedNodes}
          onToggleExpand={onToggleExpand}
          headOfficeNodeId={headOfficeNodeId}
          onUpdateNode={onUpdateNode}
        />
      ))}
    </div>
  );
}

function NodeItem({
  node,
  level,
  expandedNodes,
  onToggleExpand,
  headOfficeNodeId,
  onUpdateNode,
}: {
  node: Node;
  level: number;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  headOfficeNodeId: string | null;
  onUpdateNode: (nodeId: string, updates: { isHeadOffice?: boolean; isSchoolNode?: boolean }) => void;
}) {
  const indent = level * 24;
  const isExpanded = expandedNodes.has(node.nodeId);
  const hasChildren = node.children && node.children.length > 0;
  const isHeadOffice = node.isHeadOffice;
  const isSchoolNode = node.isSchoolNode || false;
  const canSetHeadOffice = !headOfficeNodeId || headOfficeNodeId === node.nodeId;

  return (
    <div>
      <div
        className="p-3 bg-gray-700 rounded mb-1 flex items-center justify-between hover:bg-gray-600 transition"
        style={{ marginLeft: `${indent}px` }}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node.nodeId)}
              className="p-1 hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-300" />
              )}
            </button>
          ) : (
            <div className="w-6" /> // Spacer for alignment
          )}

          {/* Node Info */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-white font-medium">{node.nodeDescription}</span>
            <span className="text-gray-400 text-sm">({node.nodeId})</span>
            
            {/* Badges */}
            {isHeadOffice && (
              <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                HQ
              </span>
            )}
            {isSchoolNode ? (
              <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded flex items-center gap-1">
                <School className="w-3 h-3" />
                School
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-600/50 text-gray-300 text-xs rounded flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                Office
              </span>
            )}
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="flex items-center gap-4">
          {/* Head Office Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isHeadOffice}
              onChange={(e) => {
                if (e.target.checked && !canSetHeadOffice) {
                  alert(`Another node (${headOfficeNodeId}) is already set as Head Office. Only one Head Office is allowed.`);
                  return;
                }
                onUpdateNode(node.nodeId, { isHeadOffice: e.target.checked });
              }}
              disabled={!canSetHeadOffice && !isHeadOffice}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-gray-300 text-sm">Head Office</span>
          </label>

          {/* School Node Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSchoolNode}
              onChange={(e) => onUpdateNode(node.nodeId, { isSchoolNode: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-300 text-sm">School Node</span>
          </label>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          <NodeTree
            nodes={node.children!}
            expandedNodes={expandedNodes}
            onToggleExpand={onToggleExpand}
            headOfficeNodeId={headOfficeNodeId}
            onUpdateNode={onUpdateNode}
            level={level + 1}
          />
        </div>
      )}
    </div>
  );
}

function CreateNodeModal({
  nodes,
  headOfficeNodeId,
  onClose,
  onCreate,
}: {
  nodes: Node[];
  headOfficeNodeId: string | null;
  onClose: () => void;
  onCreate: (data: {
    nodeId: string;
    nodeDescription: string;
    isHeadOffice: boolean;
    isSchoolNode: boolean;
    parentNodeId: string | null;
  }) => void;
}) {
  const [nodeId, setNodeId] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [isHeadOffice, setIsHeadOffice] = useState(false);
  const [isSchoolNode, setIsSchoolNode] = useState(false);
  const [parentNodeId, setParentNodeId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId || !nodeDescription) {
      alert('Node ID and Description are required');
      return;
    }

    if (isHeadOffice && headOfficeNodeId) {
      alert(`Another node (${headOfficeNodeId}) is already set as Head Office. Only one Head Office is allowed.`);
      return;
    }

    onCreate({
      nodeId,
      nodeDescription,
      isHeadOffice,
      isSchoolNode,
      parentNodeId: parentNodeId || null,
    });
  };

  // Flatten nodes for dropdown
  const flattenNodes = (nodeList: Node[], result: Node[] = []): Node[] => {
    nodeList.forEach((node) => {
      result.push(node);
      if (node.children) {
        flattenNodes(node.children, result);
      }
    });
    return result;
  };

  const allNodes = flattenNodes(nodes);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Create New Node</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Node ID *
            </label>
            <input
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., IN-N, UAE"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description *
            </label>
            <input
              type="text"
              value={nodeDescription}
              onChange={(e) => setNodeDescription(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., India North Region"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHeadOffice}
                onChange={(e) => {
                  if (e.target.checked && headOfficeNodeId) {
                    alert(`Another node (${headOfficeNodeId}) is already set as Head Office. Only one Head Office is allowed.`);
                    return;
                  }
                  setIsHeadOffice(e.target.checked);
                }}
                disabled={!!headOfficeNodeId}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-gray-300">Is Head Office</span>
              {headOfficeNodeId && (
                <span className="text-yellow-400 text-xs">
                  (Currently: {headOfficeNodeId})
                </span>
              )}
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSchoolNode}
                onChange={(e) => setIsSchoolNode(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-300">Is School Node</span>
              <span className="text-gray-500 text-xs">(Node represents a specific school)</span>
            </label>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Parent Node (optional)
            </label>
            <select
              value={parentNodeId}
              onChange={(e) => setParentNodeId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- None (Root Node) --</option>
              {allNodes.map((node) => (
                <option key={node.nodeId} value={node.nodeId}>
                  {node.nodeDescription} ({node.nodeId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Node
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
