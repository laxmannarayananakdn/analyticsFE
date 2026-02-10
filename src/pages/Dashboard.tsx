import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databaseService, StudentMetrics } from '../services/DatabaseService';
import { Users, TrendingUp, Calendar, Settings, Shield, Building2, Briefcase, School } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getStudentMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-white text-center">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-red-500 text-center">
          <p>Error: {error}</p>
          <button
            onClick={loadMetrics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Data Analytics Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Students"
            value={metrics?.totalStudents || 0}
            icon={<Users className="w-8 h-8" />}
            color="blue"
          />
          <MetricCard
            title="Average Grade"
            value={`${metrics?.averageGrade || 0}%`}
            icon={<TrendingUp className="w-8 h-8" />}
            color="green"
          />
          <MetricCard
            title="Attendance Rate"
            value={`${metrics?.attendanceRate || 0}%`}
            icon={<Calendar className="w-8 h-8" />}
            color="purple"
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/analytics"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Detailed Analytics →
          </Link>
          <Link
            to="/superset"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Superset Dashboards →
          </Link>
          <Link
            to="/aks-dashboard"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
          >
            INT - AKS Dashboard →
          </Link>
          <Link
            to="/admin/ef-upload"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Upload External Files →
          </Link>
          <Link
            to="/admin/nexquare-config"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Nexquare Configuration →
          </Link>
          <Link
            to="/admin/managebac-config"
            className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            ManageBac Configuration →
          </Link>
          <Link
            to="/admin/nexquare-sync"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Nexquare Data Sync →
          </Link>
          <Link
            to="/admin/managebac-sync"
            className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
          >
            ManageBac Data Sync →
          </Link>
          <Link
            to="/admin/rp-config"
            className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            RP Configuration →
          </Link>
          <Link
            to="/admin/users"
            className="inline-block px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            User Management →
          </Link>
          <Link
            to="/admin/access-control"
            className="inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition flex items-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Access Control →
          </Link>
          <Link
            to="/admin/nodes"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            Node Management →
          </Link>
          <Link
            to="/admin/departments"
            className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition flex items-center gap-2"
          >
            <Briefcase className="w-5 h-5" />
            Department Management →
          </Link>
          <Link
            to="/admin/school-assignment"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <School className="w-5 h-5" />
            School Assignment →
          </Link>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple';
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600'
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <div className={`${colorClasses[color]} p-2 rounded`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

