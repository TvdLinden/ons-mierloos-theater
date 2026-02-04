'use client';
import { useState } from 'react';
import { exportToCSV, exportToXLSX, ExportData } from '@ons-mierloos-theater/shared/utils/export';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '../ui/navigation-menu';

interface ExportDropdownProps {
  getExportData: () => Promise<ExportData>;
  filename: string;
}

export function ExportDropdown({ getExportData, filename }: ExportDropdownProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (type: 'csv' | 'xlsx') => {
    setLoading(true);
    try {
      const exportData = await getExportData();
      if (type === 'csv') {
        exportToCSV(exportData.headers, exportData.rows, filename);
      } else {
        exportToXLSX(exportData.headers, exportData.rows, filename);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger disabled={loading} className="gap-2">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4" />
              <rect
                x="4"
                y="16"
                width="16"
                height="4"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            {loading ? 'Even geduld...' : 'Exporteren'}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-2! w-48">
            <NavigationMenuLink
              asChild
              onClick={(e) => {
                e.preventDefault();
                handleExport('csv');
              }}
            >
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent rounded">
                Exporteren als CSV
              </button>
            </NavigationMenuLink>
            <NavigationMenuLink
              asChild
              onClick={(e) => {
                e.preventDefault();
                handleExport('xlsx');
              }}
            >
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent rounded">
                Exporteren als XLSX
              </button>
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
