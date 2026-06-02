import { useState, useEffect } from "react";

import FormInput from "../../components/FormInput";
import Table from "../../components/Table";
import Button from "../../components/Button";
import api from "../../services/api";

function Certificates() {
  const [certificateId, setCertificateId] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const response = await api.get("/certificates/all");
        setCertificates(response.data.certificates || []);
      } catch (err) {
        setError("Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!certificateId.trim()) {
      // If empty, reset search
      return;
    }

    try {
      setError("");
      // Filter locally first to avoid unnecessary network calls
      const localMatch = certificates.find(c => c.certificateId.toLowerCase() === certificateId.toLowerCase());
      if (localMatch) {
         return; // already handled by filter below
      }
      
      const response = await api.get(`/certificates/verify/${certificateId}`);
      if (response.data.certificate) {
         setCertificates(prev => {
            const exists = prev.find(c => c.certificateId === response.data.certificate.certificateId);
            if (!exists) return [response.data.certificate, ...prev];
            return prev;
         });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify certificate");
    }
  };

  const displayedCertificates = certificateId.trim()
    ? certificates.filter((c) => c.certificateId.toLowerCase().includes(certificateId.toLowerCase()))
    : certificates;

  const rows = displayedCertificates.map((cert) => ({
    id: cert.certificateId,
    certificateId: cert.certificateId,
    student: cert.studentId?.fullName || cert.student?.fullName || "Unknown",
    exam: cert.examId?.title || cert.exam?.title || "Unknown",
    issuedAt: new Date(cert.issuedAt).toLocaleDateString(),
    url: cert.certificateUrl || "",
  }));

  const columns = [
    { key: "certificateId", label: "Certificate ID" },
    { key: "student", label: "Student" },
    { key: "exam", label: "Exam" },
    { key: "issuedAt", label: "Issued" },
    {
      key: "url",
      label: "Action",
      render: (value, row) => (
        <div className="flex gap-2">
          {value ? (
            <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors">
              <span className="material-icons text-[14px]">open_in_new</span>
              URL
            </a>
          ) : null}
          <a href={`${import.meta.env.VITE_API_URL || '/api'}/certificates/download/${row.certificateId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
            <span className="material-icons text-[14px]">download</span>
            PDF
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px,1fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 h-fit">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Verification Desk</p>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-slate-900">Certificates</h1>

          <form onSubmit={handleVerify} className="mt-6 grid gap-4">
            <FormInput 
               label="Certificate ID" 
               value={certificateId} 
               onChange={(event) => setCertificateId(event.target.value)} 
               placeholder="Search or enter certificate ID" 
            />
            <Button type="submit" variant="primary" className="mt-2">
              Verify / Search
            </Button>
          </form>
        </article>

        <article className="space-y-4">
          {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80">
            {loading ? (
               <div className="flex h-32 items-center justify-center text-sm font-bold text-slate-400">Loading certificates...</div>
            ) : (
               <Table columns={columns} rows={rows} emptyMessage="No certificates found" />
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default Certificates;
