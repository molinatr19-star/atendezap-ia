type ChartDataTableProps = {
  caption: string;
  columns: [string, string];
  rows: [string, string][];
};

/** Visualização em tabela: todo valor do gráfico fica acessível sem mouse e sem depender de cor. */
export function ChartDataTable({ caption, columns, rows }: ChartDataTableProps) {
  return (
    <details className="group mt-3 text-sm">
      <summary className="cursor-pointer rounded text-xs font-medium text-muted-foreground hover:text-foreground">
        Ver dados em tabela
      </summary>
      <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                {columns[0]}
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                {columns[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-t">
                <td className="px-3 py-1.5">{label}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
