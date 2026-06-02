import PropTypes from "prop-types";

function Table({ columns, rows, emptyMessage = "No records found" }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200/80 transition-shadow hover:shadow-md dark:bg-slate-900 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  {columns.map((column) => (
                    <td key={`${row.id || rowIndex}-${column.key}`} className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-300 align-middle">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                      <span className="material-icons text-4xl text-slate-300 dark:text-slate-600">inbox</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func,
    })
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  emptyMessage: PropTypes.string,
};

export default Table;
