import { useState } from "react";

import FormInput from "../../components/FormInput";
import Table from "../../components/Table";
import Button from "../../components/Button";
import api from "../../services/api";

function Certificates() {
  const [certificateId, setCertificateId] = useState("");
  const [verifiedCertificate, setVerifiedCertificate] = useState(null);
  const [error, setError] = useState("");

  const handleVerify = async (event) => {
    event.preventDefault();

    try {
      setError("");
      const response = await api.get(`/certificates/verify/${certificateId}`);
      setVerifiedCertificate(response.data.certificate);
    } catch (err) {
      setVerifiedCertificate(null);
      setError(err.response?.data?.message || "Failed to verify certificate");
    }
  };

  const rows = verifiedCertificate
    ? [
        {
          id: verifiedCertificate.certificateId,
          certificateId: verifiedCertificate.certificateId,
          student: verifiedCertificate.student?.fullName || "Unknown",
          exam: verifiedCertificate.exam?.title || "Unknown",
          issuedAt: new Date(verifiedCertificate.issuedAt).toLocaleDateString(),
          url: verifiedCertificate.certificateUrl || "",
        },
      ]
    : [];

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
            <FormInput label="Certificate ID" value={certificateId} onChange={(event) => setCertificateId(event.target.value)} placeholder="Enter certificate ID" required />
            <Button type="submit" variant="primary" className="mt-2">
              Verify Certificate
            </Button>
          </form>
        </article>

        <article className="space-y-4">
          {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-200">{error}</div> : null}
          <Table columns={columns} rows={rows} emptyMessage="Verify a certificate to inspect details" />
        </article>
      </section>
    </div>
  );
}

export default Certificates;
