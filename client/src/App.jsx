import { useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/AdminLayout";
import StudentLayout from "./components/StudentLayout";
import AdminCertificates from "./pages/admin/Certificates";
import AdminCourses from "./pages/admin/Courses";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminExams from "./pages/admin/Exams";
import AdminProfile from "./pages/admin/Profile";
import AdminQuestions from "./pages/admin/Questions";
import AdminResults from "./pages/admin/Results";
import AdminStudents from "./pages/admin/Students";
import Certificate from "./pages/student/Certificate";
import Dashboard from "./pages/student/Dashboard";
import Exam from "./pages/student/Exam";
import Exams from "./pages/student/Exams";
import Profile from "./pages/student/Profile";
import Result from "./pages/student/Result";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import { getStoredUser } from "./services/api";

function AppRoutes() {
  const user = useMemo(() => getStoredUser(), []);
  const homePath = user?.role === "admin" ? "/admin/dashboard" : "/student/dashboard";

  return (
    <Routes>
      {/* Root points directly to the Auth Portal */}
      <Route path="/" element={user ? <Navigate to={homePath} replace /> : <Login />} />
      <Route path="/login" element={user ? <Navigate to={homePath} replace /> : <Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role="student" />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="exams" element={<Exams />} />
            <Route path="exam/:id" element={<Exam />} />
            <Route path="result/:id" element={<Result />} />
            <Route path="certificates" element={<Certificate />} />
            <Route path="profile" element={<Profile />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
