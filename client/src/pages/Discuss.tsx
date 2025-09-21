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
    <div className="min-h-screen bg-gray-50 dark:bg-black py-3 sm:py-4 lg:py-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-blue-400 mb-1 transition-colors duration-300">
              Discussions
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Share ideas and connect with the community
            </p>
          </div>
          <button
            onClick={handleNewDiscussionClick}
            className="flex items-center justify-center space-x-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md w-full sm:w-auto text-sm"
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-blue-800 rounded-lg shadow-sm mb-4 lg:mb-6 overflow-hidden transition-colors duration-300">
            <div className="bg-blue-50 dark:bg-blue-950/50 border-b border-blue-100 dark:border-blue-800 px-3 sm:px-4 py-3 transition-colors duration-300">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-blue-400 flex items-center transition-colors duration-300">
                <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                Start a New Discussion
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-300">
                Share your thoughts, ask questions, or start a conversation
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                  Discussion Title *
                </label>
                <input 
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-blue-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-blue-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  placeholder="Enter a descriptive title for your discussion"
                  required
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
                  Content *
                </label>
                <textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-blue-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-blue-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 min-h-[100px] sm:min-h-[120px] resize-vertical"
                  placeholder="What would you like to discuss? Share your thoughts, questions, or ideas..."
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
                  Minimum 10 characters required
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-3 border-t border-gray-200 dark:border-blue-800 transition-colors duration-300">
                <button 
                  type="button"
                  onClick={() => {
                    setShowNewDiscussion(false);
                    setFormData({ title: '', content: '' });
                  }}
                  className="w-full sm:w-auto px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-blue-700 rounded-lg transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-400" />
              </div>
            ) : discussions && discussions.length > 0 ? (
              <div className="space-y-3">
                {discussions.map(discussion => (
                  <div key={discussion._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-blue-800 rounded-lg shadow-sm p-4 transition-colors duration-300">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Link to={`/u/${discussion.author?.username || ''}`} className="block">
                          <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm transition-colors duration-300">
                            {discussion.author?.avatarUrl ? (
                              <img src={discussion.author.avatarUrl} alt={discussion.author.username} className="w-full h-full object-cover" />
                            ) : (
                              discussion.author?.username?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                        </Link>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-medium text-gray-900 dark:text-blue-400 transition-colors duration-300">
                            <Link to={`/u/${discussion.author?.username || ''}`}>{discussion.author?.fullName || discussion.author?.username || 'Anonymous'}</Link>
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                            {formatDate(discussion.createdAt)}
                          </span>
                        </div>
                        <h2 className="text-base font-bold mt-1 text-gray-900 dark:text-blue-400 transition-colors duration-300">{discussion.title}</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line transition-colors duration-300">{discussion.content}</p>
                        
                        {/* Like and Comment Actions */}
                        <div className="flex items-center mt-3 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <button 
                            onClick={() => toggleLike(discussion._id)}
                            className={`flex items-center space-x-1 transition-colors ${
                              discussion.isLiked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>{discussion.likes?.length || 0}</span>
                          </button>
                          <button 
                            onClick={() => toggleReplies(discussion._id)}
                            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>{discussion.replies?.length || 0} comments</span>
                          </button>
                        </div>
                        
                        {/* Reply Section */}
                        {discussion.showReplies && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-blue-800 transition-colors duration-300">
                            {discussion.isLoadingReplies ? (
                              <div className="flex justify-center py-3">
                                <Loader2 className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400" />
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
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs text-gray-700 dark:text-blue-400 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                                  />
                                  <button 
                                    onClick={() => handleReplySubmit(discussion._id)}
                                    disabled={!discussion.newReply?.trim()}
                                    className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors"
                                  >
                                    <Send className="h-3 w-3" />
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
                                        <div key={reply._id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded transition-colors duration-300">
                                          <div className="flex items-start space-x-3">
                                            <Link to={`/u/${username}`} className="block">
                                              <div className="h-6 w-6 rounded-full overflow-hidden ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-medium flex-shrink-0 transition-colors duration-300">
                                                {author?.avatarUrl ? (
                                                  <img src={author.avatarUrl} alt={username} className="w-full h-full object-cover" />
                                                ) : (
                                                  userInitial
                                                )}
                                              </div>
                                            </Link>
                                            
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-900 dark:text-blue-400 transition-colors duration-300">
                                                  <Link to={`/u/${username}`}>{author?.fullName || username}</Link>
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2 transition-colors duration-300">
                                                  {formatDate(reply.createdAt)}
                                                </span>
                                              </div>
                                              <p className="mt-1 text-xs text-gray-700 dark:text-gray-300 transition-colors duration-300">{reply.content}</p>
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
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 transition-colors duration-300" />
                <h3 className="mt-2 text-base font-medium text-gray-900 dark:text-blue-400 transition-colors duration-300">No discussions yet</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">Be the first to start a discussion!</p>
                <button
                  onClick={() => setShowNewDiscussion(true)}
                  className="mt-3 inline-flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm"
                >
                  <Plus size={16} />
                  <span>Start First Discussion</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feature Info Cards - Only show when there are no discussions */}
        {!isLoading && discussions.length === 0 && !showNewDiscussion && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 transition-colors duration-300">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2 transition-colors duration-300">
                <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-blue-400 mb-1 text-sm transition-colors duration-300">Share Ideas</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Discuss coding concepts, share solutions, and learn from others.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 transition-colors duration-300">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2 transition-colors duration-300">
                <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-blue-400 mb-1 text-sm transition-colors duration-300">Ask Questions</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Get help with problems, clarify doubts, and grow your knowledge.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1 transition-colors duration-300">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-2 transition-colors duration-300">
                <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-blue-400 mb-1 text-sm transition-colors duration-300">Build Community</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Connect with fellow developers and build lasting relationships.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discuss;