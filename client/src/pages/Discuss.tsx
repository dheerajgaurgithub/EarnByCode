import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageCircle, ThumbsUp, MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

interface UserInfo {
  _id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
}

interface Reply {
  _id: string;
  content: string;
  author: UserInfo;
  createdAt: string;
  updatedAt: string;
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: UserInfo;
  likes: string[];
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  showReplies?: boolean;
  newReply?: string;
  isLoadingReplies?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const Discuss: React.FC = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const toast = useToast();
  const { user } = useAuth();

  // Helper function for error toasts
  const showErrorToast = useCallback((_title: string, description: string) => {
    toast.error(description);
  }, [toast]);

  // Helper function for success toasts
  const showSuccessToast = useCallback((_title: string, description: string) => {
    toast.success(description);
  }, [toast]);

  // Format date helper - shows both relative time and exact date on hover
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      const exactTime = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return (
        <span title={exactTime}>
          {relativeTime}
        </span>
      );
    } catch (e) {
      return '';
    }
  };

  // Fetch discussions
  const fetchDiscussions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ success: boolean; data: Discussion[] }>('/discussions');
      const responseData = (response as any)?.data as { success: boolean; data: Discussion[] };

      if (responseData && responseData.success) {
        const discussionsData = Array.isArray(responseData.data) ? responseData.data : [];
        const processedDiscussions = discussionsData.map((discussion: Discussion) => ({
          ...discussion,
          author: discussion.author || { _id: 'unknown', username: 'User' },
          isLiked: user ? discussion.likes?.includes(user._id) : false,
          showReplies: false,
          newReply: '',
          isLoadingReplies: false,
          replies: (discussion.replies || []).map((r) => ({
            ...r,
            author: r.author || { _id: 'unknown', username: 'User' }
          }))
        }));
        
        setDiscussions(processedDiscussions);
      } else {
        setDiscussions([]);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      showErrorToast('Error', 'Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle new discussion button click
  const handleNewDiscussionClick = () => {
    setShowNewDiscussion(!showNewDiscussion);
    if (showNewDiscussion) {
      setFormData({ title: '', content: '' });
    }
  };

  // Submit new discussion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await api.post<ApiResponse<Discussion>>('/discussions', formData);
      
      if (response?.data?.success && response.data.data) {
        const newDiscussion: Discussion = {
          ...response.data.data,
          likes: response.data.data.likes || [],
          replies: response.data.data.replies || [],
          author: response.data.data.author || { 
            _id: user?._id || '', 
            username: user?.username || 'Anonymous'
          },
          isLiked: false,
          showReplies: false,
          newReply: '',
          isLoadingReplies: false
        };
        
        setDiscussions(prev => [newDiscussion, ...(prev || [])]);
        showSuccessToast('Success', 'Discussion created successfully!');
        setShowNewDiscussion(false);
        setFormData({ title: '', content: '' });
      }
    } catch (error: any) {
      console.error('Error creating discussion:', error);
      showErrorToast('Error', error.response?.data?.message || 'Failed to create discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle like on a discussion
  const toggleLike = useCallback(async (discussionId: string) => {
    if (!user) {
      showErrorToast('Authentication required', 'Please log in to like discussions');
      return;
    }

    // Optimistic update
    setDiscussions(prev => prev.map(discussion => {
      if (discussion._id === discussionId) {
        const isLiked = discussion.likes.includes(user._id);
        return {
          ...discussion,
          likes: isLiked 
            ? discussion.likes.filter(id => id !== user._id)
            : [...discussion.likes, user._id],
          isLiked: !isLiked
        };
      }
      return discussion;
    }));

    try {
      await api.post(`/discussions/${discussionId}/like`);
    } catch (error) {
      console.error('Error toggling like:', error);
      showErrorToast('Error', 'Failed to update like');
      // Revert optimistic update on error
      setDiscussions(prev => prev.map(discussion => {
        if (discussion._id === discussionId) {
          const isLiked = !discussion.likes.includes(user._id);
          return {
            ...discussion,
            likes: isLiked 
              ? discussion.likes.filter(id => id !== user._id)
              : [...discussion.likes, user._id],
            isLiked: !isLiked
          };
        }
        return discussion;
      }));
    }
  }, [user]);

  // Toggle replies visibility and fetch if needed
  const toggleReplies = useCallback(async (discussionId: string) => {
    setDiscussions(prevDiscussions => 
      prevDiscussions.map(discussion => {
        if (discussion._id === discussionId) {
          const showReplies = !discussion.showReplies;
          return {
            ...discussion,
            showReplies,
            isLoadingReplies: showReplies && (!discussion.replies || discussion.replies.length === 0)
          };
        }
        return discussion;
      })
    );

    // Fetch replies if not already loaded
    const discussion = discussions.find(d => d._id === discussionId);
    if (discussion && (!discussion.replies || discussion.replies.length === 0)) {
      try {
        // Server provides GET /discussions/:id with populated replies
        const resp = await api.get<{ success: boolean; data: { replies?: Reply[] } }>(`/discussions/${discussionId}`);
        const payload = (resp as any)?.data as { success: boolean; data?: { replies?: Reply[] } };
        const replies = payload?.data?.replies || [];
        setDiscussions(prevDiscussions =>
          prevDiscussions.map(d =>
            d._id === discussionId
              ? {
                  ...d,
                  replies: Array.isArray(replies) ? replies : [],
                  isLoadingReplies: false,
                }
              : d
          )
        );
      } catch (error) {
        console.error('Error fetching replies:', error);
        showErrorToast('Error', 'Failed to load replies');
        setDiscussions(prevDiscussions => 
          prevDiscussions.map(d => 
            d._id === discussionId 
              ? { ...d, isLoadingReplies: false }
              : d
          )
        );
      }
    }
  }, [discussions]);

  // Handle reply input change
  const handleReplyChange = useCallback((discussionId: string, value: string) => {
    setDiscussions(prevDiscussions => 
      prevDiscussions.map(discussion => 
        discussion._id === discussionId 
          ? { ...discussion, newReply: value }
          : discussion
      )
    );
  }, []);

  // Submit a new reply
  const handleReplySubmit = useCallback(async (discussionId: string) => {
    if (!user) {
      showErrorToast('Authentication required', 'Please log in to post a reply');
      return;
    }

    const discussion = discussions.find(d => d._id === discussionId);
    if (!discussion?.newReply?.trim()) return;

    // Create a temporary ID for optimistic update
    const tempReplyId = `temp-${Date.now()}`;
    const replyContent = discussion.newReply.trim();
    
    // Prepare author data
    const authorData: UserInfo = {
      _id: user._id,
      username: user.username || 'User'
    };

    // Optimistic update
    const newReply: Reply = {
      _id: tempReplyId,
      content: replyContent,
      author: authorData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update UI immediately
    setDiscussions(prev => prev.map(d => 
      d._id === discussionId 
        ? { 
            ...d, 
            replies: [newReply, ...(d.replies || [])],
            newReply: ''
          }
        : d
    ));

    try {
      // Send to server
      const response = await api.post<Reply>(
        `/discussions/${discussionId}/replies`,
        { 
          content: replyContent
        }
      );

      // Create the full reply with proper typing
      const fullReply: Reply = {
        ...response.data,
        _id: response.data._id || tempReplyId,
        author: authorData,
        createdAt: response.data.createdAt || new Date().toISOString(),
        updatedAt: response.data.updatedAt || new Date().toISOString()
      };

      // Replace the temporary reply with the actual one from the server
      setDiscussions(prev =>
        prev.map(d =>
          d._id === discussionId
            ? {
                ...d,
                replies: (d.replies ?? []).map(r =>
                  r._id === tempReplyId ? fullReply : r
                ),
              }
            : d
        )
      );
      
      } catch (error) {
        console.error('Error posting reply:', error);
        showErrorToast('Error', 'Failed to post reply');
      
        // Revert optimistic update on error
        setDiscussions(prev =>
          prev.map(d =>
            d._id === discussionId
              ? {
                  ...d,
                  replies: (d.replies ?? []).filter(r => r._id !== tempReplyId),
                }
              : d
          )
        );
      }
      
    }, [discussions, user]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-black dark:via-gray-900 dark:to-black py-3 sm:py-4 lg:py-5 transition-all duration-300">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-5 space-y-3 sm:space-y-0">
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-sky-600 to-sky-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent mb-1 transition-all duration-300">
                Discussions
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium transition-colors duration-300">
                Share ideas and connect with the community
              </p>
            </div>
            <button
              onClick={handleNewDiscussionClick}
              className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-500 dark:to-green-600 hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-600 dark:hover:to-green-700 text-white px-3 py-1.5 rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full sm:w-auto text-sm"
            >
              {showNewDiscussion ? (
                <>
                  <X size={16} />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>New Discussion</span>
                </>
              )}
            </button>
          </div>
  
          {/* New Discussion Form */}
          {showNewDiscussion && (
            <div className="bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-700 rounded-xl shadow-lg dark:shadow-green-900/20 mb-4 lg:mb-5 overflow-hidden transition-all duration-300">
              <div className="bg-gradient-to-r from-sky-50 to-sky-100 dark:from-gray-800 dark:to-gray-700 border-b border-sky-200 dark:border-green-700 px-4 py-3 transition-all duration-300">
                <h2 className="text-sm sm:text-base font-bold text-sky-800 dark:text-green-400 flex items-center transition-colors duration-300">
                  <MessageCircle className="h-3.5 w-3.5 text-sky-600 dark:text-green-400 mr-1.5" />
                  Start a New Discussion
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 transition-colors duration-300">
                  Share your thoughts, ask questions, or start a conversation
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                    Discussion Title *
                  </label>
                  <input 
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-green-600/30 focus:border-sky-500 dark:focus:border-green-500 transition-all duration-300 shadow-sm"
                    placeholder="Enter a descriptive title for your discussion"
                    required
                  />
                </div>
  
                {/* Content Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                    Content *
                  </label>
                  <textarea 
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-green-600/30 focus:border-sky-500 dark:focus:border-green-500 transition-all duration-300 min-h-[80px] sm:min-h-[90px] resize-vertical shadow-sm"
                    placeholder="What would you like to discuss? Share your thoughts, questions, or ideas..."
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
                    Minimum 10 characters required
                  </p>
                </div>
  
                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-3 border-t border-sky-100 dark:border-green-800 transition-colors duration-300">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowNewDiscussion(false);
                      setFormData({ title: '', content: '' });
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
                    className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-500 dark:to-green-600 text-white rounded-lg hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-600 dark:hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Discussion'}
                  </button>
                </div>
              </form>
            </div>
          )}
  
          {/* Discussions List */}
          {!showNewDiscussion && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-500 dark:text-green-400" />
                </div>
              ) : discussions && discussions.length > 0 ? (
                <div className="space-y-3">
                  {discussions.map(discussion => (
                    <div key={discussion._id} className="bg-white dark:bg-gray-900 border border-sky-100 dark:border-green-800 rounded-xl shadow-md dark:shadow-green-900/10 p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-green-900/20 hover:border-sky-200 dark:hover:border-green-700 transform hover:-translate-y-0.5">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Link to={`/u/${discussion.author?.username || ''}`} className="block">
                            <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-sky-200 dark:ring-green-600 bg-gradient-to-r from-sky-100 to-sky-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-sky-600 dark:text-green-400 font-bold text-sm transition-all duration-300 hover:ring-sky-300 dark:hover:ring-green-500 hover:scale-110">
                              {discussion.author?.avatarUrl ? (
                                <img src={discussion.author.avatarUrl} alt={discussion.author.username} className="w-full h-full object-cover" />
                              ) : (
                                discussion.author?.username?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                          </Link>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-bold text-sky-800 dark:text-green-400 transition-colors duration-300">
                              <Link to={`/u/${discussion.author?.username || ''}`} className="hover:text-sky-600 dark:hover:text-green-300">
                                {discussion.author?.fullName || discussion.author?.username || 'Anonymous'}
                              </Link>
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md transition-colors duration-300">
                              {formatDate(discussion.createdAt)}
                            </span>
                          </div>
                          <h2 className="text-sm font-bold mt-1 text-gray-900 dark:text-green-300 transition-colors duration-300 leading-tight">
                            {discussion.title}
                          </h2>
                          <p className="mt-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line transition-colors duration-300 leading-relaxed">
                            {discussion.content}
                          </p>
                          
                          {/* Like and Comment Actions */}
                          <div className="flex items-center mt-3 space-x-4 text-xs sm:text-sm">
                            <button 
                              onClick={() => toggleLike(discussion._id)}
                              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-300 font-medium ${
                                discussion.isLiked 
                                  ? 'text-sky-600 dark:text-green-400 bg-sky-100 dark:bg-green-900/30' 
                                  : 'text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-green-400 hover:bg-sky-50 dark:hover:bg-green-900/20'
                              }`}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              <span>{discussion.likes?.length || 0}</span>
                            </button>
                            <button 
                              onClick={() => toggleReplies(discussion._id)}
                              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-green-400 hover:bg-sky-50 dark:hover:bg-green-900/20 transition-all duration-300 font-medium"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{discussion.replies?.length || 0} comments</span>
                            </button>
                          </div>
                          
                          {/* Reply Section */}
                          {discussion.showReplies && (
                            <div className="mt-3 pt-3 border-t border-sky-100 dark:border-green-800 transition-colors duration-300">
                              {discussion.isLoadingReplies ? (
                                <div className="flex justify-center py-3">
                                  <Loader2 className="animate-spin h-4 w-4 text-sky-500 dark:text-green-400" />
                                </div>
                              ) : (
                                <>
                                  {/* Reply Form */}
                                  <div className="flex space-x-2 mb-3">
                                    <input
                                      type="text"
                                      value={discussion.newReply || ''}
                                      onChange={(e) => handleReplyChange(discussion._id, e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit(discussion._id)}
                                      placeholder="Write a reply..."
                                      className="flex-1 px-2.5 py-1.5 border border-sky-200 dark:border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-green-600/30 focus:border-sky-500 dark:focus:border-green-500 text-xs sm:text-sm text-gray-700 dark:text-green-400 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 shadow-sm"
                                    />
                                    <button 
                                      onClick={() => handleReplySubmit(discussion._id)}
                                      disabled={!discussion.newReply?.trim()}
                                      className="px-2.5 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-500 dark:to-green-600 text-white rounded-lg hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-600 dark:hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  
                                  {/* Replies List */}
                                  {discussion.replies?.length > 0 && (
                                    <div className="space-y-2">
                                      {discussion.replies.map(reply => {
                                        // Debug the reply data
                                        console.log('Reply data:', {
                                          replyId: reply._id,
                                          author: reply.author,
                                          content: reply.content
                                        });
                                        
                                        // Ensure we have valid author data
                                        const author = reply.author || { _id: 'unknown', username: 'User' };
                                        const username = author?.username || 'User';
                                        const userInitial = username.charAt(0).toUpperCase();
                                        
                                        console.log('Processed author data:', {
                                          username,
                                          userInitial
                                        });
                                        
                                        return (
                                          <div key={reply._id} className="bg-gradient-to-r from-sky-50 to-white dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg border border-sky-100 dark:border-green-700 transition-all duration-300 hover:shadow-sm">
                                            <div className="flex items-start space-x-2.5">
                                              <Link to={`/u/${username}`} className="block">
                                                <div className="h-7 w-7 rounded-full overflow-hidden ring-2 ring-sky-200 dark:ring-green-600 bg-gradient-to-r from-sky-100 to-sky-200 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center text-sky-600 dark:text-green-400 text-xs font-bold flex-shrink-0 transition-all duration-300 hover:ring-sky-300 dark:hover:ring-green-500">
                                                  {author?.avatarUrl ? (
                                                    <img src={author.avatarUrl} alt={username} className="w-full h-full object-cover" />
                                                  ) : (
                                                    userInitial
                                                  )}
                                                </div>
                                              </Link>
                                              
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                  <span className="text-xs font-bold text-sky-800 dark:text-green-400 transition-colors duration-300">
                                                    <Link to={`/u/${username}`} className="hover:text-sky-600 dark:hover:text-green-300">
                                                      {author?.fullName || username}
                                                    </Link>
                                                  </span>
                                                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-md whitespace-nowrap ml-2 transition-colors duration-300">
                                                    {formatDate(reply.createdAt)}
                                                  </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-gray-700 dark:text-gray-300 transition-colors duration-300 leading-relaxed">
                                                  {reply.content}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-sky-100 to-sky-200 dark:from-gray-800 dark:to-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300">
                    <MessageCircle className="h-8 w-8 text-sky-600 dark:text-green-400 transition-colors duration-300" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-green-300 mb-1 transition-colors duration-300">
                    No discussions yet
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 transition-colors duration-300 max-w-md mx-auto">
                    Be the first to start a discussion and help build our community!
                  </p>
                  <button
                    onClick={() => setShowNewDiscussion(true)}
                    className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-500 dark:to-green-600 hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-600 dark:hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                  >
                    <Plus size={18} />
                    <span>Start First Discussion</span>
                  </button>
                </div>
              )}
            </div>
          )}
  
          {/* Feature Info Cards - Only show when there are no discussions */}
          {!isLoading && discussions.length === 0 && !showNewDiscussion && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <div className="bg-white dark:bg-gray-900 border border-sky-100 dark:border-green-800 rounded-xl p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-green-900/20 hover:border-sky-200 dark:hover:border-green-700 transform hover:-translate-y-0.5">
                <div className="w-10 h-10 bg-gradient-to-r from-sky-100 to-sky-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center mb-3 transition-all duration-300">
                  <MessageCircle className="h-5 w-5 text-sky-600 dark:text-green-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-green-300 mb-1.5 text-sm transition-colors duration-300">
                  Share Ideas
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-300 leading-relaxed">
                  Discuss coding concepts, share solutions, and learn from others in the community.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 border border-sky-100 dark:border-green-800 rounded-xl p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-green-900/20 hover:border-sky-200 dark:hover:border-green-700 transform hover:-translate-y-0.5">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center mb-3 transition-all duration-300">
                  <Plus className="h-5 w-5 text-emerald-600 dark:text-green-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-green-300 mb-1.5 text-sm transition-colors duration-300">
                  Ask Questions
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-300 leading-relaxed">
                  Get help with problems, clarify doubts, and accelerate your learning journey.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 border border-sky-100 dark:border-green-800 rounded-xl p-4 sm:col-span-2 lg:col-span-1 transition-all duration-300 hover:shadow-lg dark:hover:shadow-green-900/20 hover:border-sky-200 dark:hover:border-green-700 transform hover:-translate-y-0.5">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-100 to-violet-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center mb-3 transition-all duration-300">
                  <MessageCircle className="h-5 w-5 text-violet-600 dark:text-green-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-green-300 mb-1.5 text-sm transition-colors duration-300">
                  Build Community
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-300 leading-relaxed">
                  Connect with fellow developers and build lasting professional relationships.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
export default Discuss;