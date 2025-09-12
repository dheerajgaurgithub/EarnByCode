import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/api';
import { toast } from 'react-toastify';
import { Star, StarFill } from 'react-bootstrap-icons';

interface Feedback {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ContestFeedbackProps {
  contestId: string;
  isContestCompleted: boolean;
  onFeedbackSubmit?: () => void;
}

export const ContestFeedback = ({ 
  contestId, 
  isContestCompleted,
  onFeedbackSubmit 
}: ContestFeedbackProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [userFeedback, setUserFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contestId) {
      fetchFeedback();
      fetchUserFeedback();
    }
  }, [contestId]);

  const fetchFeedback = async () => {
    try {
      const response = await apiService.get<{
        feedbacks: Feedback[];
        averageRating: number;
        feedbackCount: number;
      }>(`/contests/${contestId}/feedback`);
      setFeedbacks(response.feedbacks || []);
      setAverageRating(response.averageRating || 0);
      setFeedbackCount(response.feedbackCount || 0);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    }
  };

  const fetchUserFeedback = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.get<{ feedback: Feedback | null }>(`/contests/${contestId}/feedback/me`);
      if (response.feedback) {
        setUserFeedback(response.feedback);
        setRating(response.feedback.rating);
        setComment(response.feedback.comment || '');
      }
    } catch (error) {
      console.error('Error fetching user feedback:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit feedback');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.post(`/contests/${contestId}/feedback`, {
        rating,
        comment
      });
      
      toast.success('Thank you for your feedback!');
      fetchFeedback();
      fetchUserFeedback();
      onFeedbackSubmit?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (value: number, size = 20) => {
    return Array(5).fill(0).map((_, i) => (
      <span 
        key={i} 
        className="star-rating"
        style={{ cursor: 'pointer', fontSize: `${size}px`, color: i < value ? '#ffc107' : '#e4e5e9' }}
        onClick={() => setRating(i + 1)}
      >
        {i < value ? <StarFill /> : <Star />}
      </span>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="contest-feedback mt-5">
      <h3 className="mb-4">
        Contest Feedback
        {feedbackCount > 0 && (
          <span className="ms-2 text-muted">
            {averageRating.toFixed(1)} ({feedbackCount} {feedbackCount === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </h3>

      {isContestCompleted && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">
              {userFeedback ? 'Update Your Feedback' : 'Share Your Experience'}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Rating</label>
                <div className="d-flex align-items-center">
                  {renderStars(rating, 24)}
                  <span className="ms-2">{rating}.0</span>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="comment" className="form-label">
                  {userFeedback ? 'Update your comments' : 'Tell us about your experience'}
                </label>
                <textarea
                  id="comment"
                  className="form-control"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you think of this contest?"
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}

      {feedbacks.length > 0 && (
        <div className="feedback-list">
          <h5 className="mb-3">What others are saying</h5>
          {feedbacks.map((feedback) => (
            <div key={feedback._id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center">
                    <div className="avatar me-2">
                      {feedback.user.avatar ? (
                        <img 
                          src={feedback.user.avatar} 
                          alt={feedback.user.username}
                          className="rounded-circle"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {feedback.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h6 className="mb-0">{feedback.user.username}</h6>
                      <small className="text-muted">{formatDate(feedback.createdAt)}</small>
                    </div>
                  </div>
                  <div className="d-flex">
                    {renderStars(feedback.rating, 16)}
                  </div>
                </div>
                {feedback.comment && (
                  <p className="mt-2 mb-0">{feedback.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContestFeedback;
