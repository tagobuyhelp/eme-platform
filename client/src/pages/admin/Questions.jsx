import { useEffect, useState } from "react";

import FormInput from "../../components/FormInput";
import Table from "../../components/Table";
import Button from "../../components/Button";
import api from "../../services/api";

const emptyQuestion = {
  examId: "",
  question: "",
  option0: "",
  option1: "",
  option2: "",
  option3: "",
  correctAnswer: "0",
};

function Questions() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadExams = async () => {
      try {
        const response = await api.get("/exams");
        const examList = response.data.exams || [];
        setExams(examList);
        if (examList[0]) {
          setSelectedExamId(examList[0]._id);
          setForm((previous) => ({ ...previous, examId: examList[0]._id }));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load exams");
      }
    };

    loadExams();
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!selectedExamId) {
        setQuestions([]);
        return;
      }

      try {
        const response = await api.get(`/exams/${selectedExamId}`);
        setQuestions(response.data.questions || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load questions");
      }
    };

    loadQuestions();
  }, [selectedExamId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      const payload = {
        question: form.question,
        options: [form.option0, form.option1, form.option2, form.option3],
        correctAnswer: Number(form.correctAnswer),
      };

      if (editingQuestionId) {
        const response = await api.put(`/exams/${form.examId}/question/${editingQuestionId}`, payload);
        setQuestions((previous) =>
          previous.map((q) => (q._id === editingQuestionId ? response.data.question : q))
        );
        setEditingQuestionId(null);
      } else {
        const response = await api.post(`/exams/${form.examId}/question`, payload);
        setQuestions((previous) => [...previous, response.data.question]);
      }

      setForm((previous) => ({ ...emptyQuestion, examId: previous.examId }));
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingQuestionId ? "update" : "add"} question`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestionId(question._id);
    setForm({
      examId: selectedExamId,
      question: question.question,
      option0: question.options[0],
      option1: question.options[1],
      option2: question.options[2],
      option3: question.options[3],
      correctAnswer: String(question.correctAnswer),
    });
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      setError("");
      await api.delete(`/exams/${selectedExamId}/question/${questionId}`);
      setQuestions((previous) => previous.filter((q) => q._id !== questionId));
      if (editingQuestionId === questionId) {
        setEditingQuestionId(null);
        setForm((previous) => ({ ...emptyQuestion, examId: previous.examId }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question");
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setForm((previous) => ({ ...emptyQuestion, examId: previous.examId }));
    setError("");
  };

  const columns = [
    { key: "question", label: "Question" },
    {
      key: "options",
      label: "Options",
      render: (value, row) => (
        <div className="space-y-1.5 text-xs text-slate-500">
          {value.map((option, index) => {
            const isCorrect = row.correctAnswer === index;
            return (
              <p key={option} className={`flex items-center gap-1 ${isCorrect ? "font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex border border-emerald-100" : ""}`}>
                {option} {isCorrect && <span className="material-icons text-[12px]">check_circle</span>}
              </p>
            );
          })}
        </div>
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
        <article className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 h-fit">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Question Builder</p>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900">{editingQuestionId ? "Edit MCQ" : "Manage MCQs"}</h1>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Exam</span>
              <select
                value={form.examId}
                onChange={(event) => {
                  setSelectedExamId(event.target.value);
                  setForm((previous) => ({ ...previous, examId: event.target.value }));
                }}
                disabled={!!editingQuestionId}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </label>

            <FormInput label="Question" as="textarea" value={form.question} onChange={(event) => setForm((previous) => ({ ...previous, question: event.target.value }))} required />
            <FormInput label="Option 1" value={form.option0} onChange={(event) => setForm((previous) => ({ ...previous, option0: event.target.value }))} required />
            <FormInput label="Option 2" value={form.option1} onChange={(event) => setForm((previous) => ({ ...previous, option1: event.target.value }))} required />
            <FormInput label="Option 3" value={form.option2} onChange={(event) => setForm((previous) => ({ ...previous, option2: event.target.value }))} required />
            <FormInput label="Option 4" value={form.option3} onChange={(event) => setForm((previous) => ({ ...previous, option3: event.target.value }))} required />

            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Correct answer</span>
              <select
                value={form.correctAnswer}
                onChange={(event) => setForm((previous) => ({ ...previous, correctAnswer: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
              </select>
            </label>

            <div className="flex flex-col gap-3 mt-2">
              <Button type="submit" loading={submitting} variant="primary">
                {editingQuestionId ? "Save MCQ" : "Add Question"}
              </Button>
              {editingQuestionId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </article>

        <article className="space-y-4">
          {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}
          <Table columns={columns} rows={questions} emptyMessage="No questions added yet" />
        </article>
      </section>
    </div>
  );
}

export default Questions;
