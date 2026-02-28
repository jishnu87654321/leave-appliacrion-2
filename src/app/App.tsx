import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { LeaveProvider } from "./context/LeaveContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LeaveProvider>
          <RouterProvider router={router} />
        </LeaveProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
