import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import { databaseService, SubjectPerformance, StudentVsClassAverage } from '../services/DatabaseService';
import { ArrowLeft } from 'lucide-react';

export default function Analytics() {
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [studentVsClass, setStudentVsClass] = useState<StudentVsClassAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subjects, vsClass] = await Promise.all([
        databaseService.getSubjectPerformance(),
        databaseService.getStudentVsClassAverage()
      ]);
      setSubjectPerformance(subjects);
      setStudentVsClass(vsClass);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-white text-center">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="text-red-500 text-center">
          <p>Error: {error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const subjectChartOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false },
      background: 'transparent'
    },
    theme: { mode: 'dark' as const },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: true
    },
    xaxis: {
      categories: subjectPerformance.map(s => s.subject),
      title: { text: 'Average Grade (%)' }
    },
    yaxis: {
      title: { text: 'Subject' }
    },
    colors: ['#3b82f6']
  };

  const subjectChartSeries = [{
    name: 'Average Grade',
    data: subjectPerformance.map(s => s.averageGrade)
  }];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-gray-400">Detailed Performance Analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Subject Performance</h2>
            {subjectPerformance.length > 0 ? (
              <Chart
                options={subjectChartOptions}
                series={subjectChartSeries}
                type="bar"
                height={400}
              />
            ) : (
              <div className="text-gray-400 text-center py-8">No data available</div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Student vs Class Average</h2>
            {studentVsClass.length > 0 ? (
              <div className="space-y-4">
                {studentVsClass.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="bg-gray-700 rounded p-4">
                    <h3 className="text-white font-semibold mb-2">
                      {item.subject} - {item.grade}
                    </h3>
                    <div className="text-sm text-gray-400">
                      Class Average: {item.students[0]?.classAverage || 0}%
                    </div>
                    <div className="mt-2 text-sm text-gray-300">
                      Students: {item.students.length}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

