# EmployeeDirectoryTable Component

A clean, reusable, and fully dynamic Employee Directory Table component with no hardcoded data. Built with modern design principles and smooth animations.

## Features

✅ **Zero Hardcoded Data** - All content is dynamically driven by props  
✅ **Type-Safe** - Full TypeScript support with comprehensive interfaces  
✅ **Responsive Design** - Works seamlessly across all screen sizes  
✅ **Smooth Animations** - Hover effects and transitions for better UX  
✅ **Accessible** - ARIA labels and semantic HTML  
✅ **Customizable** - Flexible props for different use cases  
✅ **Empty State Handling** - Graceful display when no data is available  

---

## Component Structure

### Visual Hierarchy

The table displays employee information in the following columns:

1. **User Identity**
   - Profile Avatar (circular, with name initials)
   - Full Name (primary text)
   - Email Address (secondary text)

2. **Job Details**
   - Department Name (primary text)
   - Job Title/Designation (secondary text)

3. **Role Classification**
   - Rounded pill badge with role-specific colors:
     - `EMPLOYEE` → Green badge
     - `MANAGER` → Blue badge
     - `HR_ADMIN` → Purple badge

4. **Joining Date**
   - Formatted as MM/DD/YYYY

5. **Availability Status**
   - Active/Inactive badge (green/gray)
   - Optional "Probation" badge (amber)

6. **Leave Entitlements** (optional)
   - Color-coded badges for leave types:
     - CL (Casual Leave) - Blue
     - SL (Sick Leave) - Red
     - EL (Earned Leave) - Green
     - WFH (Work From Home) - Purple
     - Custom colors supported

7. **Actions**
   - Edit button with pencil icon

---

## Installation

The component is already included in your project at:
```
src/app/components/EmployeeDirectoryTable.tsx
```

---

## Usage

### Basic Example

```tsx
import { EmployeeDirectoryTable, EmployeeData } from "@/app/components/EmployeeDirectoryTable";

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

function MyComponent() {
  const handleEdit = (employee: EmployeeData) => {
    console.log("Editing:", employee);
  };

  return (
    <EmployeeDirectoryTable
      employees={employees}
      onEdit={handleEdit}
      showLeaveBalances={true}
    />
  );
}
```

---

## Props API

### `EmployeeDirectoryTableProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `employees` | `EmployeeData[]` | ✅ Yes | - | Array of employee data objects |
| `onEdit` | `(employee: EmployeeData) => void` | ❌ No | `undefined` | Callback when edit button is clicked |
| `showLeaveBalances` | `boolean` | ❌ No | `true` | Whether to display leave balances column |
| `className` | `string` | ❌ No | `""` | Additional CSS classes for the container |

---

## Data Interfaces

### `EmployeeData`

```typescript
interface EmployeeData {
  id: string;                    // Unique identifier
  name: string;                  // Full name
  email: string;                 // Email address
  department: string;            // Department name
  designation: string;           // Job title
  role: "EMPLOYEE" | "MANAGER" | "HR_ADMIN";  // Role classification
  joinDate: string;              // ISO date string
  isActive: boolean;             // Active status
  probationStatus?: boolean;     // Optional probation flag
  leaveBalances?: LeaveBalance[]; // Optional leave balances
}
```

### `LeaveBalance`

```typescript
interface LeaveBalance {
  code: string;      // Short code (e.g., "CL", "SL")
  name: string;      // Full name (e.g., "Casual Leave")
  balance: number;   // Available balance
  color: string;     // Hex color code (e.g., "#3B82F6")
}
```

---

## Styling

### Color Scheme

**Role Badges:**
- Employee: `bg-green-100 text-green-700`
- Manager: `bg-blue-100 text-blue-700`
- HR Admin: `bg-purple-100 text-purple-700`

**Status Badges:**
- Active: `bg-green-100 text-green-700`
- Inactive: `bg-gray-100 text-gray-500`
- Probation: `bg-amber-100 text-amber-700`

**Leave Balance Badges:**
- Custom colors based on leave type configuration

### Animations

- **Hover Effects:** Smooth scale and color transitions
- **Avatar Hover:** 1.1x scale on hover
- **Row Hover:** Background color transition
- **Button Hover:** Scale 1.05x with color change

---

## Advanced Examples

### With API Integration

```tsx
import { useEffect, useState } from "react";
import { EmployeeDirectoryTable, EmployeeData } from "@/app/components/EmployeeDirectoryTable";

function EmployeeList() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        const transformed = data.users.map((user: any) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          designation: user.designation,
          role: user.role,
          joinDate: user.joinDate,
          isActive: user.isActive,
          probationStatus: user.probationStatus,
          leaveBalances: user.leaveBalances?.map((bal: any) => ({
            code: bal.leaveType.code,
            name: bal.leaveType.name,
            balance: bal.balance,
            color: bal.leaveType.color,
          })),
        }));
        setEmployees(transformed);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return <EmployeeDirectoryTable employees={employees} />;
}
```

### With Filtering

```tsx
function FilterableEmployeeList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const filteredEmployees = allEmployees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || emp.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
        <option value="ALL">All Roles</option>
        <option value="EMPLOYEE">Employee</option>
        <option value="MANAGER">Manager</option>
        <option value="HR_ADMIN">HR Admin</option>
      </select>
      <EmployeeDirectoryTable employees={filteredEmployees} />
    </div>
  );
}
```

### Without Leave Balances

```tsx
<EmployeeDirectoryTable
  employees={employees}
  showLeaveBalances={false}
  onEdit={handleEdit}
/>
```

---

## Helper Functions

### Get Initials

Automatically extracts initials from employee names:
- "John Doe" → "JD"
- "Alice" → "A"
- "" → "?"

### Format Date

Converts ISO date strings to MM/DD/YYYY format:
- "2023-01-15T00:00:00.000Z" → "01/15/2023"
- Invalid dates → "N/A"

---

## Empty State

When no employees are provided, the table displays:
```
No employees found
Try adjusting your filters
```

---

## Accessibility

- Semantic HTML table structure
- ARIA labels on action buttons
- Keyboard navigation support
- Screen reader friendly

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Performance

- Optimized for lists up to 1000 employees
- Efficient re-rendering with React keys
- No unnecessary re-renders

---

## Customization

### Custom Styling

```tsx
<EmployeeDirectoryTable
  employees={employees}
  className="shadow-2xl border-4 border-blue-200"
/>
```

### Custom Edit Handler

```tsx
const handleEdit = (employee: EmployeeData) => {
  // Open modal
  setEditModal(employee);
  
  // Or navigate to edit page
  router.push(`/employees/${employee.id}/edit`);
  
  // Or show toast
  toast.info(`Editing ${employee.name}`);
};
```

---

## Migration Guide

If you're migrating from the old table implementation:

1. Import the new component:
   ```tsx
   import { EmployeeDirectoryTable, EmployeeData } from "@/app/components/EmployeeDirectoryTable";
   ```

2. Transform your data to match `EmployeeData` interface

3. Replace your table markup with:
   ```tsx
   <EmployeeDirectoryTable employees={transformedData} onEdit={handleEdit} />
   ```

---

## Troubleshooting

### Issue: Leave balances not showing
**Solution:** Ensure `showLeaveBalances={true}` and `leaveBalances` array is populated

### Issue: Edit button not working
**Solution:** Pass `onEdit` prop with a valid callback function

### Issue: Dates showing as "N/A"
**Solution:** Ensure `joinDate` is a valid ISO date string

---

## License

MIT

---

## Support

For issues or questions, please contact the development team.
