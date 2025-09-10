import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { Job } from '@/services/jobService';
import * as jobService from '@/services/jobService';
import { toast as showToast } from '@/components/ui/use-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { JobForm } from './JobForm';

interface JobsListProps {}

export interface JobsListHandles {
  openAddJobDialog: () => void;
}

const JobsList = forwardRef<JobsListHandles, JobsListProps>((_, ref) => {
  // Toast notifications are available via the showToast object
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  

  const fetchJobs = async () => {
    try {
      console.log('Starting to fetch jobs...');
      setLoading(true);
      const data = await jobService.getJobs();
      console.log('Jobs data received:', data);
      const jobsArray = Array.isArray(data) ? data : [];
      console.log('Setting jobs state with:', jobsArray);
      setJobs(jobsArray);
    } catch (error) {
      const errorMsg = 'Error fetching jobs: ' + (error instanceof Error ? error.message : String(error));
      console.error('Error in fetchJobs:', errorMsg, error);
      showToast.error('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debug effect to log jobs state changes
  useEffect(() => {
    console.log('Jobs state updated:', {
      jobsCount: jobs.length,
      jobs: jobs.map(job => ({
        _id: job._id,
        title: job.title,
        isActive: job.isActive,
        department: job.department
      }))
    });
  }, [jobs]);

  useEffect(() => {
    console.log('JobsList mounted, fetching jobs...');
    fetchJobs();
    
    // Add cleanup function
    return () => {
      console.log('JobsList unmounting...');
    };
  }, []);

  // Debug effect to check dialog rendering
  useEffect(() => {
    console.log('isDialogOpen changed to:', isDialogOpen);
    
    if (isDialogOpen) {
      // Check for dialog elements in the DOM
      const dialogs = document.querySelectorAll('[role="dialog"]');
      console.log('Dialogs in DOM:', dialogs.length);
      dialogs.forEach((dialog, i) => {
        console.log(`Dialog ${i}:`, {
          isConnected: dialog.isConnected,
          parentElement: dialog.parentElement,
          style: window.getComputedStyle(dialog),
          rect: dialog.getBoundingClientRect()
        });
      });
      
      // Check for portal containers
      const portals = document.querySelectorAll('body > div');
      console.log('Potential portal containers:', portals.length);
      portals.forEach((el, i) => {
        console.log(`Container ${i}:`, {
          id: el.id,
          class: el.className,
          children: el.children.length
        });
      });
    }
  }, [isDialogOpen]);

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const handleAddNew = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      // Prevent multiple clicks
      const target = e.target as HTMLButtonElement;
      if (target.disabled) return;
      target.disabled = true;
      
      // Re-enable after a delay
      setTimeout(() => {
        target.disabled = false;
      }, 1000);
    }
    
    // Reset any selected job to ensure we're in "add new" mode
    setSelectedJob(null);
    
    // Close and immediately reopen the dialog to force a reset
    setIsDialogOpen(false);
    
    // Use a small timeout to ensure the dialog is fully closed before reopening
    setTimeout(() => {
      setIsDialogOpen(true);
      console.log('Add new job dialog opened');
    }, 50);
  };

  const handleDialogOpenChange = (open: boolean) => {
    console.log('Dialog open state changed to:', open);
    if (!open) {
      // Reset form when dialog is closed
      setSelectedJob(null);
      // Add a small delay to allow the dialog to close before resetting the form
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.reset();
        }
      }, 100);
    }
    setIsDialogOpen(open);
  };

  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    
    try {
      setIsDeleting(true);
      await jobService.deleteJob(jobToDelete);
      await fetchJobs();
      showToast.success('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast.error('Failed to delete job. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const setDeleteDialogOpen = (isOpen: boolean) => {
    setIsDeleteDialogOpen(isOpen);
    if (!isOpen) {
      setJobToDelete(null);
    }
  };

  const handleSuccess = async () => {
    console.log('Job form submission successful, refreshing job list...');
    try {
      await fetchJobs();
      showToast.success(selectedJob ? 'Job updated successfully' : 'Job created successfully');
    } catch (error) {
      console.error('Error refreshing job list:', error);
      showToast.error('Job saved but there was an error refreshing the list');
    } finally {
      setSelectedJob(null);
      setIsDialogOpen(false);
    }
  };

  const getJobTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      'Full-time': 'bg-blue-50 text-blue-700 border border-blue-200',
      'Part-time': 'bg-blue-50 text-blue-600 border border-blue-200',
      'Contract': 'bg-white text-blue-800 border border-blue-300',
      'Internship': 'bg-blue-100 text-blue-800 border border-blue-300',
      'Remote': 'bg-blue-600 text-white border border-blue-600',
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeMap[type] || 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
        {type}
      </span>
    );
  };

  // Expose the openAddJobDialog method to parent components
  useImperativeHandle(ref, () => ({
    openAddJobDialog: handleAddNew
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-600 font-medium">Loading job postings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Job Postings</h1>
              <p className="text-gray-600">Manage and organize your job opportunities</p>
            </div>
            <Button 
              onClick={handleAddNew}
              data-testid="add-job-button"
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 py-3 text-white font-medium"
              type="button"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Job
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-blue-600">{jobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-blue-600">{jobs.filter(job => job.isActive).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-blue-600">{new Set(jobs.map(job => job.department)).size}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remote Jobs</p>
                <p className="text-2xl font-bold text-blue-600">{jobs.filter(job => job.type === 'Remote').length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-indigo-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50 hover:bg-blue-50">
                  <TableHead className="font-semibold text-gray-900 py-4">Title</TableHead>
                  <TableHead className="font-semibold text-gray-900 hidden sm:table-cell">Department</TableHead>
                  <TableHead className="font-semibold text-gray-900 hidden md:table-cell">Location</TableHead>
                  <TableHead className="font-semibold text-gray-900">Type</TableHead>
                  <TableHead className="font-semibold text-gray-900 hidden lg:table-cell">Salary Range</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <Plus className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No job postings found</h3>
                          <p className="text-gray-600 mb-4">Get started by creating your first job posting.</p>
                          <Button 
                            onClick={handleAddNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Job
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job._id} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900 py-4">
                        <div>
                          <div className="font-semibold">{job.title}</div>
                          <div className="sm:hidden text-sm text-gray-500 mt-1">
                            {job.department} • {job.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 hidden sm:table-cell">{job.department}</TableCell>
                      <TableCell className="text-gray-700 hidden md:table-cell">{job.location}</TableCell>
                      <TableCell className="whitespace-nowrap">{getJobTypeBadge(job.type)}</TableCell>
                      <TableCell className="whitespace-nowrap hidden lg:table-cell">
                        <div className="text-gray-900 font-medium">
                          {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                        </div>
                        <div className="text-gray-500 text-sm">per {job.salary.period}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={job.isActive ? 'default' : 'outline'} 
                          className={job.isActive 
                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                          }
                        >
                          {job.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(job)}
                            className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(job._id)}
                            className="h-9 w-9 p-0 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>



      {/* Edit/Add Job Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-in fade-in-0" />
          <Dialog.Content
            className="fixed left-[50%] top-[50%] z-[10000] w-[95vw] max-w-4xl max-h-[95vh] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200"
            onInteractOutside={(e: Event) => {
              console.log('Dialog interact outside', e);
              handleDialogOpenChange(false);
            }}
            onEscapeKeyDown={() => {
              console.log('Escape key pressed');
              handleDialogOpenChange(false);
            }}
            onOpenAutoFocus={(e: Event) => {
              console.log('Dialog open auto focus', e);
              e.preventDefault();
            }}
          >
            <div className="relative p-6 sm:p-8">
              <div className="mb-6">
                <Dialog.Title className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {selectedJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                </Dialog.Title>
                <p className="text-gray-600 mt-2">
                  {selectedJob ? 'Update the job details below' : 'Fill in the details to create a new job posting'}
                </p>
              </div>
              <div className="mt-6">
                <JobForm
                  key={selectedJob ? `edit-${selectedJob._id}` : 'new'}
                  job={selectedJob || undefined}
                  onSuccess={handleSuccess}
                  onCancel={() => {
                    console.log('Form cancelled');
                    setSelectedJob(null);
                    setIsDialogOpen(false);
                  }}
                />
              </div>
              <Dialog.Close asChild>
                <button
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Close"
                  onClick={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.disabled = true;
                    handleDialogOpenChange(false);
                    setTimeout(() => {
                      target.disabled = false;
                    }, 500);
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-in fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[10000] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-6">
              <div className="mb-4">
                <Dialog.Title className="text-xl font-bold text-gray-900">Delete Job Posting</Dialog.Title>
              </div>
              <div className="py-4">
                <p className="text-gray-600">
                  Are you sure you want to delete this job posting? This action cannot be undone and all associated data will be permanently removed.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Job'
                  )}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
});

JobsList.displayName = 'JobsList';

export default JobsList;