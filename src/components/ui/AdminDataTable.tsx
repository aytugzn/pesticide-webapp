type AdminDataTableProps = {
  emptyText: string;
  columns: string[];
  rows: string[][];
};

export const AdminDataTable = ({
  emptyText,
  columns,
  rows,
}: AdminDataTableProps) => {
  if (rows.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-lg p-10 text-center">
        <p className="text-text-muted text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-neutral border-b border-brand-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="text-left px-5 py-3 font-semibold text-text-secondary"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-brand-border last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-3 text-text-primary">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
