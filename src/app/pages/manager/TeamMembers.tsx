import { useState, useEffect } from "react";
import { Users, Mail, Briefcase, Calendar, Wallet } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function TeamMembers() {
  const { currentUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const response = await userService.getAllUsers();
        
        // Filter only team members managed by current user
        const team = response.data.users.filter(
          (u: any) => u.managerId?._id === currentUser._id || u.managerId === currentUser._id
        );
        
        setTeamMembers(team);
      } catch (error: any) {
        console.error("Failed to fetch team members:", error);
        toast.error("Failed to load team members");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamMembers();
  }, [currentUser]);

  if (isLoading) {
    return (
      <DashboardLayout 
        title="My Team" 
        subtitle="View your team members and their leave balances"
        allowedRoles={["MANAGER"]}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <DashboardLayout 
        title="My Team" 
        subtitle="View your team members and their leave balances"
        allowedRoles={["MANAGER"]}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Team Members</h3>
          <p className="text-gray-600">You don't have any team members assigned to you yet.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="My Team" 
      subtitle={`${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''}`}
      allowedRoles={["MANAGER"]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <div 
            key={member._id || member.id} 
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {member.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate">{member.name || 'N/A'}</h3>
                <p className="text-sm text-gray-600">{member.designation || 'No designation'}</p>
                {member.probationStatus && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    On Probation
                  </span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{member.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="w-4 h-4 flex-shrink-0" />
                <span>{member.department || 'N/A'}</span>
              </div>
              {member.joinDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Joined: {new Date(member.joinDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Leave Balances */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-sm text-gray-900">Leave Balances</h4>
              </div>
              
              {member.leaveBalances && member.leaveBalances.length > 0 ? (
                <div className="space-y-2">
                  {member.leaveBalances.map((balance: any, idx: number) => {
                    const leaveTypeName = balance.leaveTypeId?.name || balance.leaveTypeName || 'Unknown';
                    const leaveTypeCode = balance.leaveTypeId?.code || balance.leaveTypeCode || 'N/A';
                    const available = balance.balance || 0;
                    const used = balance.used || 0;
                    const pending = balance.pending || 0;
                    
                    return (
                      <div 
                        key={`${member._id}-balance-${idx}`}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-700">{leaveTypeCode}</span>
                          <span className="text-xs text-gray-500">{leaveTypeName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Available</p>
                            <p className="font-bold text-green-600">{available}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Used</p>
                            <p className="font-bold text-blue-600">{used}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pending</p>
                            <p className="font-bold text-amber-600">{pending}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No leave balances available</p>
              )}
            </div>

            {/* Status */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 rounded-full font-medium ${
                  member.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="font-bold text-blue-900 mb-2">Team Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-blue-700">Total Members</p>
            <p className="text-2xl font-bold text-blue-900">{teamMembers.length}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {teamMembers.filter(m => m.isActive).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">On Probation</p>
            <p className="text-2xl font-bold text-amber-600">
              {teamMembers.filter(m => m.probationStatus).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Departments</p>
            <p className="text-2xl font-bold text-blue-900">
              {new Set(teamMembers.map(m => m.department).filter(Boolean)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Note:</span> This is a read-only view of your team members. 
          To make changes to employee details or leave balances, please contact HR Admin.
        </p>
      </div>
    </DashboardLayout>
  );
}
