import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Discussion from '../models/Discussion.js';
import Problem from '../models/Problem.js';

const router = express.Router();

// Get all discussions (both general and problem-specific)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'newest', problemId, search = '' } = req.query;
    
    const query = {};
    if (problemId) {
      query.problem = problemId;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    if (sortBy === 'newest') {
      sortOptions.createdAt = -1;
    } else if (sortBy === 'popular') {
      sortOptions.likesCount = -1;
    }

    // First get the discussions with basic author info
    let discussions = await Discussion.find(query)
      .populate('author', 'username avatarUrl')
      .populate('problem', 'title')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
      
    // Then populate author info for each reply in each discussion
    discussions = await Promise.all(discussions.map(async (discussion) => {
      if (discussion.replies && discussion.replies.length > 0) {
        const populatedReplies = await Discussion.populate(discussion.replies, {
          path: 'author',
          select: 'username avatarUrl'
        });
        return { ...discussion, replies: populatedReplies };
      }
      return discussion;
    }));

    const count = await Discussion.countDocuments(query);

    res.json({
      success: true,
      data: discussions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussions',
      error: error.message
    });
  }
});

// Get all discussions for a specific problem (kept for backward compatibility)
router.get('/problem/:problemId', async (req, res) => {
  const { problemId } = req.params;
  req.query.problemId = problemId;
  return router.get('/')(req, res);
});

// Create a new discussion
router.post('/', authenticate, async (req, res) => {
  try {
    const { problemId, title, content } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // If problemId is provided, verify the problem exists
    if (problemId) {
      const problem = await Problem.findById(problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }
    }

    const discussion = new Discussion({
      ...(problemId && { problem: problemId }), // Only include problem if problemId exists
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      likes: [],
      replies: []
    });

    await discussion.save();

    // Populate author and problem info for response
    await discussion.populate('author', 'username');
    if (problemId) {
      await discussion.populate('problem', 'title');
    }

    res.status(201).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discussion',
      error: error.message
    });
  }
});

// Get a single discussion with replies
router.get('/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username avatarUrl')
      .populate('replies.author', 'username avatarUrl')
      .lean();

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    res.json({
      success: true,
      data: discussion
    });
  } catch (error) {
    console.error('Error fetching discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussion',
      error: error.message
    });
  }
});

// Add a reply to a discussion
router.post('/:id/replies', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const reply = {
      author: req.user._id,
      content
    };

    // Add the reply
    discussion.replies.push({
      author: req.user._id,
      content: content.trim()
    });
    
    // Save the discussion
    await discussion.save();
    
    // Get the newly added reply (last one in the array)
    const newReply = discussion.replies[discussion.replies.length - 1];
    
    // Populate the author info
    const populatedReply = await Discussion.populate(newReply, { 
      path: 'author', 
      select: 'username avatarUrl' 
    });

    res.status(201).json({
      success: true,
      data: {
        ...populatedReply.toObject(),
        author: {
          _id: req.user._id,
          username: req.user.username
        }
      }
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error.message
    });
  }
});

// Toggle like on a discussion
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const userId = req.user._id;
    const likeIndex = discussion.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      // Add like
      discussion.likes.push(userId);
    } else {
      // Remove like
      discussion.likes.splice(likeIndex, 1);
    }

    await discussion.save();

    res.json({
      success: true,
      data: {
        likesCount: discussion.likes.length,
        isLiked: discussion.likes.includes(userId)
      }
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
});

export default router;
