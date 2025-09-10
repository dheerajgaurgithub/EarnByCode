import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import JobApplicationForm from './JobApplicationForm';
import type { JobApplicationFormProps } from './JobApplicationForm';

export interface ApplicationModalProps {
  jobId: string;
  jobTitle: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  onError: (error: Error) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  jobId,
  jobTitle,
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
  onError,
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSuccess = useCallback(() => {
    setIsSubmitted(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    onClose();
    // Reset the form state when the modal is closed
    setTimeout(() => {
      setIsSubmitted(false);
    }, 300);
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto mx-4 bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl text-gray-900">
            {isSubmitted ? 'Application Submitted!' : `Apply for ${jobTitle}`}
          </DialogTitle>
          {!isSubmitted && (
            <DialogDescription className="text-sm sm:text-base text-gray-600">
              Fill out the form below to submit your application.
            </DialogDescription>
          )}
        </DialogHeader>
        
        {isSubmitted ? (
          <div className="py-6 sm:py-8 text-center bg-white">
            <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-50 border-2 border-blue-100 mb-3 sm:mb-4">
              <svg
                className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
              Thank you for applying!
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">
              We've received your application for <span className="font-medium text-blue-700">{jobTitle}</span>. Our team will review 
              your information and get back to you soon.
            </p>
            <Button 
              onClick={handleCloseModal}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="bg-white">
            <JobApplicationForm
              jobId={jobId}
              jobTitle={jobTitle}
              onSuccess={handleSuccess}
              onError={onError}
              isSubmitting={isSubmitting}
              onCancel={handleCloseModal}
              onSubmitApplication={onSubmit}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};