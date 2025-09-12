import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '../../../components/ui/use-toast';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, Download, Mail, Phone, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import apiService from '../../../services/api';

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
  };
  applicant: {
    _id: string;
    username: string;
    email: string;
  };
  fullName: string;
  email: string;
  phone: string;
  resume: {
    url: string;
    filename: string;
  };
  coverLetter: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export const ApplicationsList = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchApplications();
      fetchJobTitle();
    }
  }, [jobId]);

  const fetchJobTitle = async () => {
    try {
      const response = await apiService.get<{ data: { title: string } }>(`/careers/${jobId}`);
      setJobTitle(response.data.title);
    } catch (error) {
      console.error('Error fetching job title:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ data: Application[] }>(`/careers/${jobId}/applications`);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      await apiService.patch(`/applications/${applicationId}/status`, { status });
      toast.success('Application status updated');
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const downloadResume = (resumeUrl: string, filename: string) => {
    // In a real app, you would typically make a request to get the file
    // and trigger a download. This is a simplified version.
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = filename || 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'applied':
        return 'outline';
      case 'under_review':
      case 'reviewed':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'interviewing':
      case 'offered':
      case 'hired':
        return 'default';
      case 'withdrawn':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const statusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offered', label: 'Offered' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedApplication) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="pl-0"
          onClick={() => setSelectedApplication(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to applications
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{selectedApplication.fullName}</CardTitle>
                <CardDescription className="mt-1">
                  Applied for {selectedApplication.jobId.title}
                </CardDescription>
              </div>
              <div className="mt-4 md:mt-0">
                <Badge variant={getStatusBadgeVariant(selectedApplication.status)} className="text-sm">
                  {statusOptions.find(s => s.value === selectedApplication.status)?.label || selectedApplication.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium">Contact Information</h3>
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${selectedApplication.email}`} className="hover:underline">
                      {selectedApplication.email}
                    </a>
                  </div>
                  {selectedApplication.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedApplication.phone}`} className="hover:underline">
                        {selectedApplication.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Applied on {format(new Date(selectedApplication.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Resume</h3>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => downloadResume(selectedApplication.resume.url, selectedApplication.resume.filename)}
                  >
                    {selectedApplication.resume.filename || 'Download Resume'}
                  </Button>
                </div>
              </div>
            </div>
            
            {selectedApplication.coverLetter && (
              <div className="space-y-2">
                <h3 className="font-medium">Cover Letter</h3>
                <div className="p-4 bg-muted/50 rounded-md whitespace-pre-line">
                  {selectedApplication.coverLetter}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="font-medium">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <Button
                    key={status.value}
                    variant={selectedApplication.status === status.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateApplicationStatus(selectedApplication._id, status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Applications for {jobTitle}
          </h1>
          <p className="text-muted-foreground">
            Manage job applications for this position
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/careers/${jobId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Applications</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length > 0 ? (
                filteredApplications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div>{application.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {application.applicant?.username || 'External Applicant'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={`mailto:${application.email}`} 
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {application.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      {application.phone || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(application.status)}>
                        {statusOptions.find(s => s.value === application.status)?.label || application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(application.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        {application.resume?.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadResume(application.resume.url, application.resume.filename);
                            }}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download Resume</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
