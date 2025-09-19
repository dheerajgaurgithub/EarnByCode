import { TestJobsConnection } from '../components/TestJobsConnection';
import { ExecutorDiagnostics } from '../components/ExecutorDiagnostics';

export const TestConnectionPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Diagnostics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Jobs API</h2>
          <TestJobsConnection />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Executor</h2>
          <ExecutorDiagnostics />
        </div>
      </div>
    </div>
  );
};

export default TestConnectionPage;
