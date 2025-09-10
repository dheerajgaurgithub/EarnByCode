import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  constraints: string[];
  sampleTestCases: TestCase[];
  timeLimit: number;
  memoryLimit: number;
}

interface ContestProblemProps {
  problem: Problem;
}

const ContestProblem = ({ problem }: ContestProblemProps) => {
  if (!problem) return <div>Loading problem...</div>;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{problem.title}</CardTitle>
            <div className={`inline-block px-2 py-1 mt-2 rounded-full text-sm font-medium ${
              problem.difficulty === 'Easy' 
                ? 'bg-green-100 text-green-800' 
                : problem.difficulty === 'Medium' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {problem.difficulty}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Time Limit: {problem.timeLimit}s | Memory: {problem.memoryLimit}MB
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-none">
          <div 
            className="mb-6"
            dangerouslySetInnerHTML={{ __html: problem.description }} 
          />
          
          <div className="space-y-6">
            {problem.constraints && problem.constraints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Constraints</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {problem.constraints.map((constraint, idx) => (
                    <li key={idx} className="text-sm text-gray-700">{constraint}</li>
                  ))}
                </ul>
              </div>
            )}

            {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Examples</h3>
                <div className="space-y-6">
                  {problem.sampleTestCases.map((testCase, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-md">
                          Input {idx + 1}
                        </button>
                        <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                          Output {idx + 1}
                        </button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <pre className="whitespace-pre-wrap text-sm">
                          <span className="font-medium text-gray-700">Input:</span> {testCase.input}
                        </pre>
                        <pre className="whitespace-pre-wrap text-sm mt-2">
                          <span className="font-medium text-gray-700">Output:</span> {testCase.output}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { ContestProblem };
