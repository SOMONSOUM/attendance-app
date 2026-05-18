import { UserPlus } from "lucide-react";
import {
  AdminShell,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

export default function PeoplePage() {
  return (
    <AdminShell
      active="People"
      title="People"
      description="Manage users, attendees, departments, positions, and admin accounts."
      action={
        <Button>
          <UserPlus size={16} />
          Add person
        </Button>
      }
    >
      <TableShell>
        <SectionToolbar title="People directory" />
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-fg">
            <tr>
              <th className="px-4 py-3 font-medium">Full name</th>
              <th className="px-4 py-3 font-medium">Khmer name</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Livia Torff",
                "លីវីយ៉ា",
                "Event Manager",
                "Operations",
                "Admin",
              ],
              ["Arthur Taylor", "អាធ័រ", "Coordinator", "People", "Staff"],
              ["Mattew Andre", "ម៉ាធ្យូ", "Engineer", "Product", "User"],
            ].map((row) => (
              <tr key={row[0]} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{row[0]}</td>
                <td className="px-4 py-3 text-muted-fg">{row[1]}</td>
                <td className="px-4 py-3 text-muted-fg">{row[2]}</td>
                <td className="px-4 py-3 text-muted-fg">{row[3]}</td>
                <td className="px-4 py-3">
                  <StatusPill
                    tone={
                      row[4] === "Admin"
                        ? "purple"
                        : row[4] === "Staff"
                          ? "blue"
                          : "green"
                    }
                  >
                    {row[4]}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </AdminShell>
  );
}
