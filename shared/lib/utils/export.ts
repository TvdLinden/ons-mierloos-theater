import * as XLSX from 'xlsx';

export interface ExportData {
  headers: string[];
  rows: string[][];
}

/**
 * Extract table data from a DOM table element
 * @param tableElement The table HTML element
 * @returns Object with headers and rows arrays
 */
export function extractTableData(tableElement: HTMLTableElement): ExportData {
  const rows = Array.from(tableElement.querySelectorAll('tr'));

  // Get header row
  const headerRow = rows[0];
  let headers: string[] = [];
  if (headerRow) {
    const headerCells = Array.from(headerRow.querySelectorAll('th'));
    headers = headerCells.map((cell) => cell.textContent?.trim() || '');
  }

  // Get data rows (visible page only)
  const dataRows: string[][] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td'));
    if (cells.length === 0) continue;
    dataRows.push(cells.map((cell) => cell.textContent?.trim() || ''));
  }

  return { headers, rows: dataRows };
}

/**
 * Export table data to CSV format
 * @param headers Column headers
 * @param rows Data rows
 * @param filename Output filename (without extension)
 * @param fullData Optional full dataset to export instead of just visible rows
 */
export function exportToCSV(
  headers: string[],
  rows: string[][],
  filename: string = 'export',
  fullData?: ExportData,
) {
  const dataToExport = fullData || { headers, rows };
  if (!dataToExport.headers.length || !dataToExport.rows.length) return;

  const csv: string[] = [];
  csv.push(dataToExport.headers.map((h) => '"' + h.replace(/"/g, '""') + '"').join(','));
  for (const row of dataToExport.rows) {
    csv.push(row.map((cell) => '"' + cell.replace(/"/g, '""') + '"').join(','));
  }

  const blob = new Blob([csv.join('\r\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export table data to XLSX (Excel) format
 * @param headers Column headers
 * @param rows Data rows
 * @param filename Output filename (without extension)
 * @param fullData Optional full dataset to export instead of just visible rows
 */
export function exportToXLSX(
  headers: string[],
  rows: string[][],
  filename: string = 'export',
  fullData?: ExportData,
) {
  const dataToExport = fullData || { headers, rows };
  if (!dataToExport.headers.length || !dataToExport.rows.length) return;

  const ws = XLSX.utils.aoa_to_sheet([dataToExport.headers, ...dataToExport.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename + '.xlsx');
}
