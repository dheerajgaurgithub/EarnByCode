import { useEffect, useState } from 'react';
import { getJobs } from '../services/jobService';

export const TestJobsConnection = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await getJobs();
        setJobs(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setError('Failed to fetch jobs. Check console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Jobs Connection Test</h2>
      {jobs.length > 0 ? (
        <div>
          <p className="text-green-600">Successfully connected to the jobs API!</p>
          <div className="mt-4">
            <h3 className="font-semibold">Available Jobs:</h3>
            <ul className="list-disc pl-5 mt-2">
              {jobs.map((job) => (
                <li key={job._id} className="py-1">
                  {job.title} - {job.department}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p>No jobs found.</p>
      )}
    </div>
  );
};
