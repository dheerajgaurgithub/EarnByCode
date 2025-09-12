import React from 'react';

interface ContestFeedbackProps {
  contestId: string;
  isContestCompleted: boolean;
  onFeedbackSubmit: () => void;
  feedback?: string;
  testResults?: {
    passed: number;
    total: number;
    executionTime: number;
    error?: string;
  };
  isSubmitting?: boolean;
}

export const ContestFeedback: React.FC<ContestFeedbackProps> = ({
  feedback,
  testResults,
  isSubmitting = false,
}) => {
  if (isSubmitting) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">Submitting your solution...</p>
      </div>
    );
  }

  if (!feedback && !testResults) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {feedback && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800">Feedback</h3>
          <p className="text-blue-700">{feedback}</p>
        </div>
      )}

      {testResults && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="font-medium text-gray-800">Test Results</h3>
          {testResults.error ? (
            <p className="text-red-600">Error: {testResults.error}</p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-700">
                Passed: {testResults.passed}/{testResults.total} test cases
              </p>
              <p className="text-sm text-gray-700">
                Execution time: {testResults.executionTime.toFixed(2)}ms
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${(testResults.passed / testResults.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContestFeedback;
