import { useEffect, useState } from "react";

import FormInput from "../../components/FormInput";
import Table from "../../components/Table";
import Button from "../../components/Button";
import api from "../../services/api";

const emptyExam = {
  title: "",
  course: "",
  duration: "",
  totalMarks: "",
  passMarks: "",
  questionCount: "",
};

function Exams() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyExam);
  const [editingExamId, setEditingExamId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [examsRes, coursesRes] = await Promise.all([
          api.get("/exams"),
          api.get("/courses")
        ]);
        setExams(examsRes.data.exams || []);
        setCourses(coursesRes.data.courses || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      const payload = {
        title: form.title,
        course: form.course,
        duration: Number(form.duration),
        totalMarks: Number(form.totalMarks),
        passMarks: Number(form.passMarks),
        questionCount: Number(form.questionCount),
      };

      if (editingExamId) {
        const response = await api.put(`/exams/${editingExamId}`, payload);
        setExams((previous) =>
          previous.map((exam) => (exam._id === editingExamId ? response.data.exam : exam))
        );
        setEditingExamId(null);
      } else {
        const response = await api.post("/exams", payload);
        setExams((previous) => [response.data.exam, ...previous]);
      }
      setForm(emptyExam);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingExamId ? "update" : "create"} exam`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (exam) => {
    setEditingExamId(exam._id);
    setForm({
      title: exam.title,
      course: exam.course || "",
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passMarks: exam.passMarks,
      questionCount: exam.questionCount || 0,
    });
  };

  const handleDelete = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam? All associated questions will be deleted as well.")) {
      return;
    }

    try {
      setError("");
      await api.delete(`/exams/${examId}`);
      setExams((previous) => previous.filter((exam) => exam._id !== examId));
      if (editingExamId === examId) {
        setEditingExamId(null);
        setForm(emptyExam);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete exam");
    }
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    setForm(emptyExam);
    setError("");
  };

  const columns = [
    { key: "title", label: "Exam Title" },
    { key: "course", label: "Course" },
    { key: "duration", label: "Duration (mins)" },
    { key: "totalMarks", label: "Total Marks" },
    { key: "passMarks", label: "Pass Marks" },
    { key: "questionCount", label: "Questions" },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleEdit(row)} className="!px-3 !py-1.5 !text-xs">
            Edit
          </Button>
          <Button variant="danger" onClick={() => handleDelete(row._id)} className="!px-3 !py-1.5 !text-xs">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px,1fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Exam Builder</p>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900">{editingExamId ? "Edit Exam" : "Create Exams"}</h1>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <FormInput label="Exam title" value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} required />
            
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Associated Course</label>
              <select
                value={form.course}
                onChange={(e) => setForm((prev) => ({ ...prev, course: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              >
                <option value="" disabled>Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <FormInput label="Duration (minutes)" type="number" value={form.duration} onChange={(event) => setForm((previous) => ({ ...previous, duration: event.target.value }))} required />
            <FormInput label="Total marks" type="number" value={form.totalMarks} onChange={(event) => setForm((previous) => ({ ...previous, totalMarks: event.target.value }))} required />
            <FormInput label="Pass marks" type="number" value={form.passMarks} onChange={(event) => setForm((previous) => ({ ...previous, passMarks: event.target.value }))} required />
            <FormInput label="Number of Questions (0 for all)" type="number" value={form.questionCount} onChange={(event) => setForm((previous) => ({ ...previous, questionCount: event.target.value }))} required />

            <div className="flex flex-col gap-3 mt-2">
              <Button type="submit" loading={submitting} variant="primary">
                {editingExamId ? "Save Changes" : "Create Exam"}
              </Button>
              {editingExamId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </article>

        <article className="space-y-4">
          {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}
          <Table columns={columns} rows={exams} emptyMessage="No exams created yet" />
        </article>
      </section>
    </div>
  );
}

export default Exams;
