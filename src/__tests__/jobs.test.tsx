import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Careers } from '../pages/Careers';
import { jobService } from '../services/jobService';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '../context/AuthContext';

// Mock the jobService
jest.mock('../services/jobService');

const mockJobs = [
  {
    _id: '1',
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'We are looking for a skilled Frontend Developer.',
    requirements: ['React', 'TypeScript', 'CSS'],
    responsibilities: ['Build user interfaces', 'Write clean code'],
    salary: { min: 80000, max: 120000, currency: 'USD', period: 'year' },
    isActive: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
];

describe('Careers Page', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the getJobs function
    (jobService.getJobs as jest.Mock).mockResolvedValue(mockJobs);
  });

  test('displays loading state initially', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Careers />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading job listings/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/loading job listings/i)).not.toBeInTheDocument();
    });
  });

  test('displays job listings after loading', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Careers />
          <ToastContainer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/frontend developer/i)).toBeInTheDocument();
      expect(screen.getByText(/engineering/i)).toBeInTheDocument();
      expect(screen.getByText(/remote/i)).toBeInTheDocument();
    });
  });

  test('shows application form when apply button is clicked', async () => {
    // Mock user being logged in
    jest.spyOn(require('../context/AuthContext'), 'useAuth').mockReturnValue({
      user: { id: '123', email: 'test@example.com', name: 'Test User' },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Careers />
          <ToastContainer />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for jobs to load
    const applyButton = await screen.findByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    // Check if application form is shown
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
  });

  test('handles application submission', async () => {
    // Mock successful application submission
    (jobService.applyForJob as jest.Mock).mockResolvedValue({
      message: 'Application submitted successfully',
    });

    // Mock user being logged in
    jest.spyOn(require('../context/AuthContext'), 'useAuth').mockReturnValue({
      user: { id: '123', email: 'test@example.com', name: 'Test User' },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Careers />
          <ToastContainer />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for jobs to load and click apply
    const applyButton = await screen.findByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    // Fill out the form
    const fullName = screen.getByLabelText(/full name/i);
    const phone = screen.getByLabelText(/phone/i);
    const address = screen.getByLabelText(/address/i);
    const city = screen.getByLabelText(/city/i);
    const country = screen.getByLabelText(/country/i);
    const submitButton = screen.getByRole('button', { name: /submit application/i });

    // Simulate file upload
    const file = new File(['test'], 'resume.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/resume/i) as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    // Fill other required fields
    fireEvent.change(fullName, { target: { value: 'Test User' } });
    fireEvent.change(phone, { target: { value: '1234567890' } });
    fireEvent.change(address, { target: { value: '123 Test St' } });
    fireEvent.change(city, { target: { value: 'Test City' } });
    fireEvent.change(country, { target: { value: 'Test Country' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Check if the API was called correctly
    await waitFor(() => {
      expect(jobService.applyForJob).toHaveBeenCalledWith(
        '1',
        expect.any(FormData)
      );
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/application submitted/i)).toBeInTheDocument();
    });
  });
});
