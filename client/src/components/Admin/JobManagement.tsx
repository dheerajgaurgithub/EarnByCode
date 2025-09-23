import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { apiService } from '@/lib/api';

interface Job {
  _id?: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  experience: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  isActive: boolean;
  applicationDeadline: string;
}

export default function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<Partial<Job> | null>(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState('');
  const [respInput, setRespInput] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await apiService.get<Job[]>('/jobs/admin');
      setJobs(response);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob) return;

    try {
      if (currentJob._id) {
        // Update existing job
        await apiService.put(`/jobs/${currentJob._id}`, {
          ...currentJob,
          requirements,
          responsibilities,
        });
        toast.success('Job updated successfully');
      } else {
        // Create new job
        await apiService.post('/jobs', {
          ...currentJob,
          requirements,
          responsibilities,
          isActive: true,
        });
        toast.success('Job created successfully');
      }
      setIsDialogOpen(false);
      fetchJobs();
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await apiService.delete(`/jobs/${id}`);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  const addRequirement = () => {
    if (reqInput.trim()) {
      setRequirements([...requirements, reqInput.trim()]);
      setReqInput('');
    }
  };

  const addResponsibility = () => {
    if (respInput.trim()) {
      setResponsibilities([...responsibilities, respInput.trim()]);
      setRespInput('');
    }
  };

  const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  const openEditDialog = (job: Job) => {
    setCurrentJob(job);
    setRequirements(job.requirements || []);
    setResponsibilities(job.responsibilities || []);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setCurrentJob({
      title: '',
      department: '',
      location: '',
      type: 'Full-time',
      description: '',
      requirements: [],
      responsibilities: [],
      experience: '',
      salary: { min: 0, max: 0, currency: 'INR', period: 'year' },
      isActive: true,
      applicationDeadline: '',
    });
    setRequirements([]);
    setResponsibilities([]);
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Management</h1>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add New Job
        </Button>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <p className="text-gray-600">{job.department} • {job.type}</p>
                <p className="text-sm text-gray-500">
                  {job.location} • {job.experience}
                </p>
                <p className="text-sm mt-2">
                  ₹{job.salary?.min.toLocaleString('en-IN')} - ₹{job.salary?.max.toLocaleString('en-IN')} per {job.salary?.period}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(job)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(job._id!)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentJob?._id ? 'Edit Job' : 'Add New Job'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={currentJob?.title || ''}
                  onChange={(e) => setCurrentJob({ ...currentJob!, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={currentJob?.department || ''}
                  onChange={(e) => setCurrentJob({ ...currentJob!, department: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={currentJob?.location || ''}
                  onChange={(e) => setCurrentJob({ ...currentJob!, location: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={currentJob?.type || ''}
                  onChange={(e) => setCurrentJob({ ...currentJob!, type: e.target.value })}
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={currentJob?.description || ''}
                onChange={(e) => setCurrentJob({ ...currentJob!, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              <div className="flex gap-2">
                <Input
                  value={reqInput}
                  onChange={(e) => setReqInput(e.target.value)}
                  placeholder="Add a requirement"
                />
                <Button type="button" onClick={addRequirement}>
                  Add
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{req}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(requirements, setRequirements, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsibilities</Label>
              <div className="flex gap-2">
                <Input
                  value={respInput}
                  onChange={(e) => setRespInput(e.target.value)}
                  placeholder="Add a responsibility"
                />
                <Button type="button" onClick={addResponsibility}>
                  Add
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {responsibilities.map((resp, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{resp}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(responsibilities, setResponsibilities, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience Required</Label>
                <Input
                  id="experience"
                  value={currentJob?.experience || ''}
                  onChange={(e) => setCurrentJob({ ...currentJob!, experience: e.target.value })}
                  placeholder="e.g., 3+ years"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={currentJob?.applicationDeadline || ''}
                  onChange={(e) => setCurrentJob({ ...currentJob!, applicationDeadline: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSalary">Min Salary</Label>
                <Input
                  id="minSalary"
                  type="number"
                  value={currentJob?.salary?.min || ''}
                  onChange={(e) => setCurrentJob({
                    ...currentJob!,
                    salary: {
                      ...currentJob?.salary!,
                      min: Number(e.target.value)
                    }
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSalary">Max Salary</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  value={currentJob?.salary?.max || ''}
                  onChange={(e) => setCurrentJob({
                    ...currentJob!,
                    salary: {
                      ...currentJob?.salary!,
                      max: Number(e.target.value)
                    }
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <div className="h-10 flex items-center px-3 border rounded-md bg-muted/30">INR (₹)</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Salary Period</Label>
              <select
                id="period"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={currentJob?.salary?.period || 'year'}
                onChange={(e) => setCurrentJob({
                  ...currentJob!,
                  salary: {
                    ...currentJob?.salary!,
                    period: e.target.value as 'hour' | 'day' | 'week' | 'month' | 'year'
                  }
                })}
                required
              >
                <option value="hour">Per Hour</option>
                <option value="day">Per Day</option>
                <option value="week">Per Week</option>
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentJob?._id ? 'Update' : 'Create'} Job
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
