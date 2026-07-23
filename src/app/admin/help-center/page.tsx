import { HelpCenterManager } from '@/components/admin/help-center-manager';

export default function HelpCenterPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold tracking-tight">Help Center</h1>
        <p className="text-muted-foreground">
          Manage FAQ articles and contact information shown to users in the app.
        </p>
      </div>

      <HelpCenterManager />
    </div>
  );
}
