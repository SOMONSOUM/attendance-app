import { Button } from "@/components/ui/button";

export function PaginationFooter({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const start = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-fg">
      <span>
        {start}-{end} of {totalItems}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-8"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          className="h-8"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  return items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
}
