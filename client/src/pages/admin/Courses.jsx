import { useEffect, useState } from "react";

import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import Table from "../../components/Table";
import api from "../../services/api";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleEdit = (course) => {
    setError("");
    setMessage("");
    setIsCreating(false);
    setEditingCourse({
      _id: course._id,
      title: course.title,
      category: course.category,
      duration: course.duration || "",
      description: course.description || "",
      status: course.status,
    });
  };

  const handleCreate = () => {
    setError("");
    setMessage("");
    setEditingCourse(null);
    setIsCreating(true);
    setEditingCourse({
      title: "",
      category: "",
      duration: "",
      description: "",
      status: "active",
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editingCourse) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (isCreating) {
        const response = await api.post("/courses", editingCourse);
        setCourses([...courses, response.data.course]);
        setMessage("Course created successfully!");
      } else {
        const response = await api.put(`/courses/${editingCourse._id}`, editingCourse);
        setCourses(courses.map((c) => (c._id === editingCourse._id ? response.data.course : c)));
        setMessage("Course updated successfully!");
      }

      setEditingCourse(null);
      setIsCreating(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      setDeleting(true);
      setError("");
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter((c) => c._id !== id));
      setMessage("Course deleted successfully!");
      if (editingCourse?._id === id) {
        setEditingCourse(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "title", label: "Course Title" },
    { key: "category", label: "Category" },
    { key: "duration", label: "Duration", render: (val) => val || "N/A" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
         <span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${value === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : value === "draft" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {value}
         </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleEdit(row)} className="!px-3 !py-1.5 !text-xs">
            Edit
          </Button>
          <Button variant="danger" onClick={() => handleDelete(row._id)} disabled={deleting} className="!px-3 !py-1.5 !text-xs">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Curriculum Management</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold text-slate-900">Manage Courses</h1>
        </div>
        <Button onClick={handleCreate} variant="primary" className="flex items-center gap-2">
          <span className="material-icons text-[18px]">add</span> Add New Course
        </Button>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}
      {message ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 border border-emerald-200">{message}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,400px]">
        <div className="order-2 xl:order-1">
           <Table columns={columns} rows={courses} emptyMessage="No courses found. Create one!" />
        </div>

        {(editingCourse || isCreating) && (
          <article className="order-1 xl:order-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
               <h2 className="font-heading text-xl font-extrabold text-slate-900">
                 {isCreating ? "Create Course" : "Edit Course"}
               </h2>
               <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-600">
                 <span className="material-icons">close</span>
               </button>
            </div>
            
            <form onSubmit={handleSave} className="grid gap-5">
              <FormInput
                label="Course Title"
                required
                value={editingCourse.title}
                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                placeholder="e.g. Full Stack Web Development"
              />
              
              <FormInput
                label="Category"
                required
                value={editingCourse.category}
                onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                placeholder="e.g. Information Technology"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Duration"
                  value={editingCourse.duration}
                  onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                  placeholder="e.g. 6 Months"
                />
                
                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Status</span>
                  <select
                    value={editingCourse.status}
                    onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Description</span>
                <textarea
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  rows={4}
                  placeholder="Brief course description..."
                ></textarea>
              </label>

              <div className="mt-4 flex gap-3">
                <Button type="submit" loading={saving} variant="primary" className="w-full">
                  {isCreating ? "Create Course" : "Save Changes"}
                </Button>
              </div>
            </form>
          </article>
        )}
      </div>
    </div>
  );
}

export default Courses;
