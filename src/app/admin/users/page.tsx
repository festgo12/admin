import { UsersTable } from '@/components/admin/users-table';

export default function UsersPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage system users, adjust roles, and review KYC submissions.
        </p>
      </div>

      <UsersTable />
    </div>
  );
}
