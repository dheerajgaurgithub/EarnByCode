import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';
import ContestLayout from '../components/Contest/ContestLayout';
import ContestGuidelines from '../components/Contest/ContestGuidelines';
import { Contest, ContestResponse } from '../types/contest';

const ContestPage = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [hasAgreedToGuidelines, setHasAgreedToGuidelines] = useState(false);

  const checkRegistrationStatus = useCallback(async (contestId: string) => {
    if (!user) return false;
    
    try {
      const registrationRes = await apiService.get<{ registered: boolean }>(
        `/contests/${contestId}/registration`
      );
      return registrationRes.registered;
    } catch (error: any) {
      // If endpoint doesn't exist, assume registration is not required
      if (error.response?.status === 404) {
        return true; // Auto-register if no registration endpoint exists
      }
      console.error('Error checking registration status:', error);
      return false;
    }
  }, [user]);

  const fetchContestData = useCallback(async () => {
    if (!contestId) return;
    
    try {
      setIsLoading(true);
      let contestData: Contest | null = null;
      
      // Try admin endpoint first (for authenticated users)
      try {
        const adminResponse = await apiService.get<ContestResponse>(`/admin/contests/${contestId}`);
        contestData = 'contest' in adminResponse ? adminResponse.contest : adminResponse;
      } catch (error) {
        // Fall back to public endpoint if admin endpoint fails
        console.log('Admin endpoint failed, trying public endpoint:', error);
        const publicResponse = await apiService.get<ContestResponse>(`/contests/${contestId}`);
        contestData = 'contest' in publicResponse ? publicResponse.contest : publicResponse;
      }
      
      if (!contestData) {
        throw new Error('No contest data received');
      }
      
      // Set contest status if not present
      if (!contestData.status) {
        const now = new Date();
        const startTime = new Date(contestData.startTime);
        const endTime = new Date(contestData.endTime);
        
        if (now < startTime) {
          contestData.status = 'upcoming';
        } else if (now >= startTime && now <= endTime) {
          contestData.status = 'ongoing';
        } else {
          contestData.status = 'completed';
        }
      }
      
      setContest(contestData);
      
      // Check registration status if user is logged in
      if (user) {
        const isRegistered = await checkRegistrationStatus(contestId);
        setIsRegistered(isRegistered);
      }
      
      // Check if user has already agreed to guidelines
      const hasAgreed = localStorage.getItem(`contest_${contestId}_guidelines_agreed`) === 'true';
      setHasAgreedToGuidelines(hasAgreed);
      
    } catch (error) {
      console.error('Error fetching contest data:', error);
      toast.error('Failed to load contest information');
      navigate('/contests');
    } finally {
      setIsLoading(false);
    }
  }, [contestId, user, navigate, checkRegistrationStatus]);

  // Initial data fetch
  useEffect(() => {
    fetchContestData();
  }, [fetchContestData]);

  // Handle registration
  const handleRegister = async () => {
    if (!contestId) return;
    
    try {
      setIsLoading(true);
      
      // Try the register endpoint first
      try {
        await apiService.post(`/contests/${contestId}/register`);
      } catch (registerError: any) {
        // If register endpoint fails with 404, try the alternative endpoint
        if (registerError.response?.status === 404) {
          await apiService.post(`/api/contests/${contestId}/register`);
        } else {
          throw registerError;
        }
      }
      
      setIsRegistered(true);
      setShowGuidelines(true);
      toast.success('Successfully registered for the contest!');
      
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Failed to register for the contest');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle guidelines agreement
  const handleAgreeToGuidelines = () => {
    if (!contestId) return;
    
    setHasAgreedToGuidelines(true);
    localStorage.setItem(`contest_${contestId}_guidelines_agreed`, 'true');
  };

  // Show loading state
  if (isLoading || !contest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show guidelines if not yet agreed
  if (showGuidelines || !hasAgreedToGuidelines) {
    return (
      <ContestGuidelines
        contest={{
          title: contest.title,
          duration: contest.duration,
          rules: contest.rules || [
            'Do not share your code with others',
            'Do not copy code from external sources',
            'Do not attempt to hack or disrupt the contest',
            'Follow all instructions provided in the problem statements'
          ]
        }}
        onAgree={handleAgreeToGuidelines}
      />
    );
  }

  // Show contest interface
  return (
    <ContestLayout 
      contestId={contestId}
      onContestEnd={() => {
        toast.success('Contest has ended!');
        fetchContestData();
      }}
    />
  );
};

export default ContestPage;
