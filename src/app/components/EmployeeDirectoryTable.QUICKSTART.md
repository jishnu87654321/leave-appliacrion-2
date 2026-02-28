# EmployeeDirectoryTable - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Import the Component
```tsx
import { EmployeeDirectoryTable, EmployeeData } from "@/app/components/EmployeeDirectoryTable";
```

### Step 2: Prepare Your Data
```tsx
const employees: EmployeeData[] = [
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
    ],
  },
];
```

### Step 3: Render the Component
```tsx
<EmployeeDirectoryTable
  employees={employees}
  onEdit={(employee) => console.log("Edit:", employee)}
  showLeaveBalances={true}
/>
```

---

## 📋 Props Cheat Sheet

| Prop | Type | Required | Example |
|------|------|----------|---------|
| `employees` | `EmployeeData[]` | ✅ | `[{id: "1", name: "John"...}]` |
| `onEdit` | `function` | ❌ | `(emp) => handleEdit(emp)` |
| `showLeaveBalances` | `boolean` | ❌ | `true` or `false` |
| `className` | `string` | ❌ | `"shadow-lg"` |

---

## 🎨 Visual Elements

### Column Structure
1. **Employee** - Avatar + Name + Email
2. **Department** - Department + Job Title
3. **Role** - Color-coded badge (Green/Blue/Purple)
4. **Join Date** - MM/DD/YYYY format
5. **Status** - Active/Inactive + Probation badge
6. **Leave Balances** - Color-coded badges (CL/SL/EL/WFH)
7. **Actions** - Edit button with icon

### Color Codes
- **EMPLOYEE** → Green (`bg-green-100 text-green-700`)
- **MANAGER** → Blue (`bg-blue-100 text-blue-700`)
- **HR_ADMIN** → Purple (`bg-purple-100 text-purple-700`)

---

## 💡 Common Use Cases

### Hide Leave Balances
```tsx
<EmployeeDirectoryTable
  employees={employees}
  showLeaveBalances={false}
/>
```

### No Edit Button
```tsx
<EmployeeDirectoryTable
  employees={employees}
  // Don't pass onEdit prop
/>
```

### Custom Styling
```tsx
<EmployeeDirectoryTable
  employees={employees}
  className="shadow-2xl border-2"
/>
```

---

## 🔄 Data Transformation

### From API Response
```tsx
const transformedEmployees = apiData.users.map(user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  department: user.department,
  designation: user.designation,
  role: user.role,
  joinDate: user.joinDate,
  isActive: user.isActive,
  probationStatus: user.probationStatus,
  leaveBalances: user.leaveBalances?.map(bal => ({
    code: bal.leaveType.code,
    name: bal.leaveType.name,
    balance: bal.balance,
    color: bal.leaveType.color,
  })),
}));
```

---

## ⚠️ Common Mistakes

### ❌ Wrong
```tsx
// Missing required fields
const employees = [{ name: "John" }];
```

### ✅ Correct
```tsx
// All required fields present
const employees = [{
  id: "1",
  name: "John",
  email: "john@company.com",
  department: "Engineering",
  designation: "Developer",
  role: "EMPLOYEE",
  joinDate: "2023-01-15",
  isActive: true,
}];
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Leave balances not showing | Set `showLeaveBalances={true}` |
| Edit button not working | Pass `onEdit` prop |
| Dates showing "N/A" | Use ISO date format: "2023-01-15" |
| TypeScript errors | Ensure data matches `EmployeeData` interface |

---

## 📚 Full Documentation

For complete documentation, see:
- `EmployeeDirectoryTable.README.md` - Full API reference
- `EmployeeDirectoryTable.example.tsx` - Code examples
- `COMPONENT_REFACTOR_SUMMARY.md` - Implementation details

---

## ✨ That's It!

You're ready to use the EmployeeDirectoryTable component. Happy coding! 🎉
