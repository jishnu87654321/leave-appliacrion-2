/**
 * EmployeeDirectoryTable - Usage Examples
 * 
 * This file demonstrates how to use the EmployeeDirectoryTable component
 * with various configurations and data sources.
 */

import React, { useState } from "react";
import { EmployeeDirectoryTable, EmployeeData } from "./EmployeeDirectoryTable";

// ============================================================================
// EXAMPLE 1: Basic Usage with Sample Data
// ============================================================================

export const BasicExample = () => {
  const sampleEmployees: EmployeeData[] = [
    {
      id: "emp-001",
      name: "John Doe",
      email: "john.doe@company.com",
      department: "Engineering",
      designation: "Senior Software Engineer",
      role: "EMPLOYEE",
      joinDate: "2023-01-15",
      isActive: true,
      leaveBalances: [
        { code: "CL", name: "Casual Leave", balance: 12, color: "#3B82F6" },
        { code: "SL", name: "Sick Leave", balance: 8, color: "#EF4444" },
        { code: "EL", name: "Earned Leave", balance: 15, color: "#10B981" },
      ],
    },
    {
      id: "emp-002",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      department: "Marketing",
      designation: "Marketing Manager",
      role: "MANAGER",
      joinDate: "2022-06-20",
      isActive: true,
      probationStatus: false,
      leaveBalances: [
        { code: "CL", name: "Casual Leave", balance: 10, color: "#3B82F6" },
        { code: "SL", name: "Sick Leave", balance: 6, color: "#EF4444" },
        { code: "WFH", name: "Work From Home", balance: 20, color: "#8B5CF6" },
      ],
    },
    {
      id: "emp-003",
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      department: "Design",
      designation: "UI/UX Designer",
      role: "EMPLOYEE",
      joinDate: "2024-01-10",
      isActive: true,
      probationStatus: true,
      leaveBalances: [
        { code: "CL", name: "Casual Leave", balance: 5, color: "#3B82F6" },
        { code: "SL", name: "Sick Leave", balance: 3, color: "#EF4444" },
      ],
    },
  ];

  const handleEdit = (employee: EmployeeData) => {
    console.log("Editing employee:", employee);
    // Your edit logic here
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Employee Directory</h2>
      <EmployeeDirectoryTable
        employees={sampleEmployees}
        onEdit={handleEdit}
        showLeaveBalances={true}
      />
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: With API Data Integration
// ============================================================================

export const ApiIntegrationExample = () => {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated API call
  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch("/api/users");
        const data = await response.json();
        
        // Transform API data to match EmployeeData interface
        const transformedData: EmployeeData[] = data.users.map((user: any) => ({
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          designation: user.designation,
          role: user.role,
          joinDate: user.joinDate || user.createdAt,
          isActive: user.isActive,
          probationStatus: user.probationStatus,
          leaveBalances: user.leaveBalances?.map((bal: any) => ({
            code: bal.leaveType?.code || bal.code,
            name: bal.leaveType?.name || bal.name,
            balance: bal.balance,
            color: bal.leaveType?.color || bal.color,
          })),
        }));
        
        setEmployees(transformedData);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleEdit = (employee: EmployeeData) => {
    // Open edit modal or navigate to edit page
    console.log("Edit employee:", employee);
  };

  if (loading) {
    return <div className="p-6">Loading employees...</div>;
  }

  return (
    <EmployeeDirectoryTable
      employees={employees}
      onEdit={handleEdit}
      showLeaveBalances={true}
    />
  );
};

// ============================================================================
// EXAMPLE 3: Without Leave Balances
// ============================================================================

export const WithoutLeaveBalancesExample = () => {
  const employees: EmployeeData[] = [
    {
      id: "emp-001",
      name: "Alice Brown",
      email: "alice.brown@company.com",
      department: "Human Resources",
      designation: "HR Manager",
      role: "HR_ADMIN",
      joinDate: "2021-03-15",
      isActive: true,
    },
  ];

  return (
    <EmployeeDirectoryTable
      employees={employees}
      showLeaveBalances={false}
    />
  );
};

// ============================================================================
// EXAMPLE 4: With Filtering and Search
// ============================================================================

export const WithFilteringExample = () => {
  const allEmployees: EmployeeData[] = [
    // ... your employee data
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const filteredEmployees = allEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole =
      roleFilter === "ALL" || emp.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2"
        >
          <option value="ALL">All Roles</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="HR_ADMIN">HR Admin</option>
        </select>
      </div>

      {/* Table */}
      <EmployeeDirectoryTable
        employees={filteredEmployees}
        onEdit={(emp) => console.log("Edit:", emp)}
      />
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: Custom Styling
// ============================================================================

export const CustomStylingExample = () => {
  const employees: EmployeeData[] = [
    // ... your employee data
  ];

  return (
    <EmployeeDirectoryTable
      employees={employees}
      onEdit={(emp) => console.log("Edit:", emp)}
      showLeaveBalances={true}
      className="shadow-lg border-2 border-blue-100"
    />
  );
};

// ============================================================================
// EXAMPLE 6: Empty State
// ============================================================================

export const EmptyStateExample = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">No Employees Found</h2>
      <EmployeeDirectoryTable
        employees={[]}
        showLeaveBalances={true}
      />
    </div>
  );
};

// ============================================================================
// DATA TRANSFORMATION HELPER
// ============================================================================

/**
 * Helper function to transform API response to EmployeeData format
 */
export const transformApiDataToEmployeeData = (apiData: any[]): EmployeeData[] => {
  return apiData.map((user) => ({
    id: user._id || user.id,
    name: user.name || "[Name Not Provided]",
    email: user.email || "[Email Not Provided]",
    department: user.department || "Unassigned",
    designation: user.designation || "Not Specified",
    role: user.role || "EMPLOYEE",
    joinDate: user.joinDate || user.createdAt || new Date().toISOString(),
    isActive: user.isActive ?? true,
    probationStatus: user.probationStatus ?? false,
    leaveBalances: user.leaveBalances?.map((balance: any) => ({
      code: balance.leaveType?.code || balance.code || "N/A",
      name: balance.leaveType?.name || balance.name || "Unknown",
      balance: balance.balance || 0,
      color: balance.leaveType?.color || balance.color || "#6B7280",
    })) || [],
  }));
};
