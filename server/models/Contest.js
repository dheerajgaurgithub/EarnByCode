import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  solvedProblems: [{
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    solvedAt: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  rank: {
    type: Number,
    default: 0
  },
  prize: {
    type: Number,
    default: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
}, { _id: false });

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  entryFee: {
    type: Number,
    required: true,
    min: 0
  },
  prizePool: {
    type: Number,
    required: true,
    min: 0
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  feedbacks: [feedbackSchema],
  averageRating: {
    type: Number,
    default: 0
  },
  feedbackCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true,
    required: true
  },
  prizeDistribution: {
    first: { type: Number, default: 50 }, // percentage
    second: { type: Number, default: 30 },
    third: { type: Number, default: 20 }
  }
}, {
  timestamps: true
});

// Add a problem to the contest
contestSchema.methods.addProblem = async function(problemId) {
  if (!this.problems.includes(problemId)) {
    this.problems.push(problemId);
    await this.save();
  }
};

// Remove a problem from the contest
contestSchema.methods.removeProblem = async function(problemId) {
  this.problems = this.problems.filter(id => id.toString() !== problemId.toString());
  await this.save();
};

// Check if a problem is part of this contest
contestSchema.methods.hasProblem = function(problemId) {
  return this.problems.some(id => id.toString() === problemId.toString());
};

// Check if contest is currently active
contestSchema.methods.isActive = function() {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
};

// Check if contest has started
contestSchema.methods.hasStarted = function() {
  return new Date() >= this.startTime;
};

// Calculate and update rankings
contestSchema.methods.updateRankings = function() {
  this.participants.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.solvedProblems[a.solvedProblems.length - 1]?.solvedAt || 0) - 
           new Date(b.solvedProblems[b.solvedProblems.length - 1]?.solvedAt || 0);
  });

  this.participants.forEach((participant, index) => {
    participant.rank = index + 1;
    
    // Award points based on rank
    if (index === 0) participant.pointsEarned = 100;
    else if (index === 1) participant.pointsEarned = 75;
    else if (index === 2) participant.pointsEarned = 50;
    else participant.pointsEarned = Math.max(5, 25 - index);
  });
};

// Distribute prizes when contest ends
contestSchema.methods.distributePrizes = function() {
  if (this.participants.length === 0) return;

  const totalPrize = this.prizePool;
  const sortedParticipants = [...this.participants].sort((a, b) => a.rank - b.rank);

  if (sortedParticipants.length >= 1) {
    sortedParticipants[0].prize = Math.floor(totalPrize * this.prizeDistribution.first / 100);
  }
  if (sortedParticipants.length >= 2) {
    sortedParticipants[1].prize = Math.floor(totalPrize * this.prizeDistribution.second / 100);
  }
  if (sortedParticipants.length >= 3) {
    sortedParticipants[2].prize = Math.floor(totalPrize * this.prizeDistribution.third / 100);
  }
};

// Method to add feedback to contest
contestSchema.methods.addFeedback = async function(userId, rating, comment) {
  // Check if user has already given feedback
  const existingFeedbackIndex = this.feedbacks.findIndex(
    f => f.user.toString() === userId.toString()
  );

  const feedback = {
    user: userId,
    rating,
    comment
  };

  if (existingFeedbackIndex >= 0) {
    // Update existing feedback
    this.feedbacks[existingFeedbackIndex] = feedback;
  } else {
    // Add new feedback
    this.feedbacks.push(feedback);
  }

  // Calculate new average rating
  const totalRatings = this.feedbacks.reduce((sum, f) => sum + f.rating, 0);
  this.averageRating = totalRatings / this.feedbacks.length;
  this.feedbackCount = this.feedbacks.length;

  await this.save();
  return this;
};

// Get user's feedback for the contest
contestSchema.methods.getUserFeedback = function(userId) {
  return this.feedbacks.find(f => f.user.toString() === userId.toString());
};

const Contest = mongoose.model('Contest', contestSchema);

export default Contest;