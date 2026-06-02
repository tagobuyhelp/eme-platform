import PropTypes from "prop-types";

function CertificateCard({ certificate }) {
  const previewUrl = certificate.certificateUrl || `/api/certificates/download/${certificate.certificateId}`;

  return (
    <article className="rounded-2xl md:rounded-3xl bg-white p-5 md:p-6 border border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 hover:border-indigo-200 group">
      <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 md:gap-5">
          <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
            <span className="material-icons text-2xl md:text-3xl">workspace_premium</span>
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Official Document</p>
            <h3 className="mt-0.5 font-heading text-lg md:text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{certificate.certificateId}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500 flex items-center gap-1">
              <span className="material-icons text-[14px]">event</span>
              Issued: {new Date(certificate.issuedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
          >
            <span className="material-icons text-lg text-slate-400">visibility</span>
            View
          </a>
          <a
            href={previewUrl}
            download
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98]"
          >
            <span className="material-icons text-lg">download</span>
            Download
          </a>
        </div>
      </div>
    </article>
  );
}

CertificateCard.propTypes = {
  certificate: PropTypes.shape({
    certificateId: PropTypes.string.isRequired,
    certificateUrl: PropTypes.string,
    issuedAt: PropTypes.string.isRequired,
  }).isRequired,
};

export default CertificateCard;
