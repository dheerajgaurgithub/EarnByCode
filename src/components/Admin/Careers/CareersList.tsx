import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../../components/ui/use-toast';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Plus, Search, Pencil, Trash2, Eye, Calendar, MapPin, Briefcase, Clock } from 'lucide-react';
import { format } from 'date-fns';
import apiService from '../../../services/api';

interface Career {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  isActive: boolean;
  applicationDeadline?: string;
  metadata: {
    applicationsCount: number;
    views: number;
  };
  createdAt: string;
}

export const CareersList = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const navigate = useNavigate();
  // Using the toast object directly since useToast returns the toast object

  useEffect(() => {
    fetchCareers();
    fetchDepartments();
  }, []);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ data: Career[] }>('/careers');
      setCareers(response.data);
    } catch (error) {
      console.error('Error fetching careers:', error);
      toast.error('Failed to fetch careers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.get<{ data: string[] }>('/careers/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await apiService.delete(`/careers/${id}`);
        toast.success('Job posting deleted successfully');
        fetchCareers();
      } catch (error) {
        console.error('Error deleting career:', error);
        toast.error('Failed to delete job posting');
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiService.patch(`/careers/${id}/status`, { isActive: !currentStatus });
      toast.success(`Job posting ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchCareers();
    } catch (error) {
      console.error('Error toggling career status:', error);
      toast.error('Failed to update job status');
    }
  };

  const filteredCareers = careers.filter((career) => {
    const matchesSearch = career.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      career.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && career.isActive) ||
      (statusFilter === 'inactive' && !career.isActive);
    
    const matchesDepartment = departmentFilter === 'all' || 
      career.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Postings</h1>
          <p className="text-muted-foreground">
            Manage job postings and applications
          </p>
        </div>
        <Button onClick={() => navigate('/admin/careers/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search jobs..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCareers.length > 0 ? (
                filteredCareers.map((career) => (
                  <TableRow key={career._id}>
                    <TableCell className="font-medium">{career.title}</TableCell>
                    <TableCell>{career.department}</TableCell>
                    <TableCell>{career.location}</TableCell>
                    <TableCell>{career.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary">
                        {career.metadata.applicationsCount} applications
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={career.isActive ? 'default' : 'secondary'}>
                        {career.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(career.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/careers/${career._id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/careers/${career._id}/applications`)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Applications</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(career._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No job postings found
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
