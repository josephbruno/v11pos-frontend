import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface ResponsiveTableProps {
  headers: string[];
  rows: (string | number | ReactNode)[][];
  variant?: "default" | "compact";
  className?: string;
  rowClassName?: string;
  hideColumnsOnMobile?: number[];
  cardView?: boolean;
  onRowClick?: (rowIndex: number) => void;
}

export function ResponsiveTable({
  headers,
  rows,
  variant = "default",
  className,
  rowClassName,
  hideColumnsOnMobile = [],
  cardView = true,
  onRowClick,
}: ResponsiveTableProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile && cardView) {
    return (
      <div className="space-y-3">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            onClick={() => onRowClick?.(rowIndex)}
            className={cn(
              "bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow",
              onRowClick && "cursor-pointer"
            )}
          >
            {headers.map((header, colIndex) => {
              if (hideColumnsOnMobile.includes(colIndex)) return null;
              return (
                <div key={colIndex} className="mb-3 last:mb-0">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {header}
                  </div>
                  <div className="text-sm font-medium text-foreground break-words">
                    {row[colIndex]}
                  </div>
                </div>
              );
            })}
            {onRowClick && (
              <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/50">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className={cn(
                  "px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap",
                  hideColumnsOnMobile.includes(idx) && "hidden md:table-cell"
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(rowIndex)}
              className={cn(
                "border-b border-border hover:bg-muted/50 transition-colors",
                onRowClick && "cursor-pointer",
                rowClassName
              )}
            >
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    "px-4 py-3 text-foreground break-words",
                    hideColumnsOnMobile.includes(colIndex) && "hidden md:table-cell"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
