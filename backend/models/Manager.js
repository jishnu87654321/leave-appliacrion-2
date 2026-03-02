const mongoose = require("mongoose");

const managerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  teamSize: { 
    type: Number, 
    default: 0 
  },
  department: { 
    type: String, 
    required: true 
  },
  managementLevel: { 
    type: String, 
    enum: ["TEAM_LEAD", "MANAGER", "SENIOR_MANAGER", "DIRECTOR"],
    default: "MANAGER"
  },
  responsibilities: [{ 
    type: String 
  }],
  teamMembers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  approvalAuthority: {
    maxLeaveDays: { type: Number, default: 30 },
    canApproveSpecialLeave: { type: Boolean, default: false },
    canOverrideRules: { type: Boolean, default: false }
  },
  performance: {
    totalRequestsHandled: { type: Number, default: 0 },
    averageApprovalTime: { type: Number, default: 0 }, // in hours
    approvalRate: { type: Number, default: 0 }, // percentage
    lastReviewDate: { type: Date, default: null }
  },
  preferences: {
    autoApproveShortLeaves: { type: Boolean, default: false },
    maxAutoApproveDays: { type: Number, default: 2 },
    notificationSettings: {
      emailOnNewRequest: { type: Boolean, default: true },
      emailOnUrgentRequest: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: false }
    }
  },
  notes: { 
    type: String, 
    default: "" 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
managerSchema.index({ userId: 1 }, { unique: true });
managerSchema.index({ department: 1 });
managerSchema.index({ isActive: 1 });

// Virtual: Get manager's full user details
managerSchema.virtual("userDetails", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true
});

// Method: Update team size
managerSchema.methods.updateTeamSize = async function() {
  const User = mongoose.model("User");
  const count = await User.countDocuments({ 
    managerId: this.userId, 
    isActive: true 
  });
  this.teamSize = count;
  await this.save();
  return count;
};

// Method: Get team members
managerSchema.methods.getTeamMembers = async function() {
  const User = mongoose.model("User");
  return await User.find({ 
    managerId: this.userId, 
    isActive: true 
  }).select("name email department designation leaveBalances");
};

// Method: Update performance metrics
managerSchema.methods.updatePerformanceMetrics = async function() {
  const LeaveRequest = mongoose.model("LeaveRequest");
  
  const requests = await LeaveRequest.find({
    approvedBy: this.userId
  });
  
  this.performance.totalRequestsHandled = requests.length;
  
  if (requests.length > 0) {
    const approved = requests.filter(r => r.status === "APPROVED").length;
    this.performance.approvalRate = (approved / requests.length) * 100;
    
    // Calculate average approval time
    const approvalTimes = requests
      .filter(r => r.approvedAt && r.createdAt)
      .map(r => (new Date(r.approvedAt) - new Date(r.createdAt)) / (1000 * 60 * 60));
    
    if (approvalTimes.length > 0) {
      this.performance.averageApprovalTime = 
        approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length;
    }
  }
  
  await this.save();
};

// Static: Find active managers
managerSchema.statics.findActiveManagers = function() {
  return this.find({ isActive: true })
    .populate("userId", "name email department designation")
    .sort({ teamSize: -1 });
};

// Static: Find managers by department
managerSchema.statics.findByDepartment = function(dept) {
  return this.find({ department: dept, isActive: true })
    .populate("userId", "name email department designation");
};

module.exports = mongoose.model("Manager", managerSchema);
