import { TestJobsConnection } from '../components/TestJobsConnection';

export const TestConnectionPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <TestJobsConnection />
      </div>
    </div>
  );
};

export default TestConnectionPage;
