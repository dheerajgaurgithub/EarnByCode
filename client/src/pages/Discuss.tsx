import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageCircle, ThumbsUp, MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface UserInfo {
  _id: string;
  username: string;
  avatar?: string;
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
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function for error toasts
  const showErrorToast = useCallback((title: string, description: string) => {
    if (!toast) {
      console.error('Toast is not available:', { title, description });
      return;
    }
    toast.error({
      title,
      description,
      variant: 'destructive',
    });
  }, [toast]);

  // Helper function for success toasts
  const showSuccessToast = useCallback((title: string, description: string) => {
    if (!toast) {
      console.log('Toast success:', { title, description });
      return;
    }
    toast.success({
      title,
      description,
    });
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
      
      // Handle response based on axios interceptor structure
      const responseData = response as unknown as { success: boolean; data: Discussion[] };
      
      if (responseData?.success) {
        const discussionsData = Array.isArray(responseData.data) ? responseData.data : [];
        const processedDiscussions = discussionsData.map((discussion: Discussion) => ({
          ...discussion,
          isLiked: user ? discussion.likes?.includes(user._id) : false,
          showReplies: false,
          newReply: '',
          isLoadingReplies: false,
          replies: discussion.replies || []
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
            username: user?.username || 'Anonymous', 
            avatar: user?.avatar 
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
        const response = await api.get<Reply[]>(`/discussions/${discussionId}/replies`);
        setDiscussions(prevDiscussions => 
          prevDiscussions.map(d => 
            d._id === discussionId 
              ? { 
                  ...d, 
                  replies: Array.isArray(response) ? response : [], 
                  isLoadingReplies: false 
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
      username: user.username || 'User',
      avatar: user.avatar
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
              Discussions
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Share ideas and connect with the community
            </p>
          </div>
          <button
            onClick={handleNewDiscussionClick}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            {showNewDiscussion ? (
              <>
                <X size={18} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>New Discussion</span>
              </>
            )}
          </button>
        </div>

        {/* New Discussion Form */}
        {showNewDiscussion && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 lg:mb-8 overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-4 sm:px-6 py-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
                Start a New Discussion
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Share your thoughts, ask questions, or start a conversation
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discussion Title *
                </label>
                <input 
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter a descriptive title for your discussion"
                  required
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[120px] sm:min-h-[140px] resize-vertical"
                  placeholder="What would you like to discuss? Share your thoughts, questions, or ideas..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 characters required
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button 
                  type="button"
                  onClick={() => {
                    setShowNewDiscussion(false);
                    setFormData({ title: '', content: '' });
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-300 rounded-lg transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  {isSubmitting ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Discussions List */}
        {!showNewDiscussion && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : discussions && discussions.length > 0 ? (
              <div className="space-y-4">
                {discussions.map(discussion => (
                  <div key={discussion._id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {discussion.author?.avatar ? (
                          <img 
                            src={discussion.author.avatar} 
                            alt={discussion.author.username || 'User'}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                            {discussion.author?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {discussion.author?.username || 'Anonymous'}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatDate(discussion.createdAt)}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold mt-1 text-gray-900">{discussion.title}</h2>
                        <p className="mt-2 text-gray-700 whitespace-pre-line">{discussion.content}</p>
                        
                        {/* Like and Comment Actions */}
                        <div className="flex items-center mt-4 space-x-4 text-sm text-gray-500">
                          <button 
                            onClick={() => toggleLike(discussion._id)}
                            className={`flex items-center space-x-1 transition-colors ${
                              discussion.isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{discussion.likes?.length || 0}</span>
                          </button>
                          <button 
                            onClick={() => toggleReplies(discussion._id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>{discussion.replies?.length || 0} comments</span>
                          </button>
                        </div>
                        
                        {/* Reply Section */}
                        {discussion.showReplies && (
                          <div className="mt-4 pt-3 border-t">
                            {discussion.isLoadingReplies ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                              </div>
                            ) : (
                              <>
                                {/* Reply Form */}
                                <div className="flex space-x-2 mb-4">
                                  <input
                                    type="text"
                                    value={discussion.newReply || ''}
                                    onChange={(e) => handleReplyChange(discussion._id, e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit(discussion._id)}
                                    placeholder="Write a reply..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-black-500 text-sm text-cool-black-700"
                                  />
                                  <button 
                                    onClick={() => handleReplySubmit(discussion._id)}
                                    disabled={!discussion.newReply?.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                                  >
                                    <Send className="h-4 w-4" />
                                  </button>
                                </div>
                                
                                {/* Replies List */}
                                {discussion.replies?.length > 0 && (
                                  <div className="space-y-3">
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
                                      const avatar = author?.avatar;
                                      const userInitial = username.charAt(0).toUpperCase();
                                      
                                      console.log('Processed author data:', {
                                        username,
                                        avatar: !!avatar,
                                        userInitial
                                      });
                                      
                                      return (
                                        <div key={reply._id} className="bg-gray-50 p-3 rounded">
                                          <div className="flex items-start space-x-3">
                                            {/* Avatar with fallback */}
                                            <div className="relative">
                                              {avatar ? (
                                                <>
                                                  <img 
                                                    src={avatar} 
                                                    alt={username}
                                                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                                                    onError={(e) => {
                                                      const target = e.target as HTMLImageElement;
                                                      target.style.display = 'none';
                                                      const fallback = target.nextElementSibling;
                                                      if (fallback) {
                                                        fallback.classList.remove('hidden');
                                                      }
                                                    }}
                                                  />
                                                  <div className="hidden h-8 w-8 rounded-full bg-blue-100 items-center justify-center text-blue-600 text-xs font-medium flex-shrink-0">
                                                    {userInitial}
                                                  </div>
                                                </>
                                              ) : (
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium flex-shrink-0">
                                                  {userInitial}
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-900">
                                                  {username}
                                                </span>
                                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                  {formatDate(reply.createdAt)}
                                                </span>
                                              </div>
                                              <p className="mt-1 text-sm text-gray-700">{reply.content}</p>
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
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No discussions yet</h3>
                <p className="mt-1 text-sm text-gray-500">Be the first to start a discussion!</p>
                <button
                  onClick={() => setShowNewDiscussion(true)}
                  className="mt-4 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Share Ideas</h4>
              <p className="text-sm text-gray-600">
                Discuss coding concepts, share solutions, and learn from others.
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Ask Questions</h4>
              <p className="text-sm text-gray-600">
                Get help with problems, clarify doubts, and grow your knowledge.
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Build Community</h4>
              <p className="text-sm text-gray-600">
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