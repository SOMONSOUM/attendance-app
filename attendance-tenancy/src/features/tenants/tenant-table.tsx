import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tenant } from "./types";

export function TenantTable({
  tenants,
  onRefresh,
}: {
  tenants: Tenant[];
  onRefresh?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Tenants</CardTitle>
        {onRefresh ? (
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-border">
          <Table className="min-w-220">
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-fg">{tenant.slug}</div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                      {tenant.status}
                    </span>
                  </TableCell>
                  <TableCell>{tenant.ownerUser?.email ?? "-"}</TableCell>
                  <TableCell>{tenant._count?.users ?? 0}</TableCell>
                  <TableCell>{tenant._count?.events ?? 0}</TableCell>
                </TableRow>
              ))}
              {!tenants.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-fg">
                    No tenants loaded.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
