import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface ContestGuidelinesProps {
  contest: {
    title: string;
    duration: number; // in minutes
    rules: string[];
  };
  onAgree: () => void;
}

const ContestGuidelines = ({ contest, onAgree }: ContestGuidelinesProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {contest.title} - Contest Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Duration: {contest.duration} minutes</h3>
            <h3 className="font-semibold">Rules & Guidelines:</h3>
            <ul className="list-disc pl-6 space-y-2">
              {contest.rules.map((rule, index) => (
                <li key={index} className="text-gray-700">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              By clicking "I Agree & Start", you confirm that you understand and will follow all contest rules.
              Any violation may result in disqualification.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={onAgree} className="bg-blue-600 hover:bg-blue-700">
            I Agree & Start Contest
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ContestGuidelines;
