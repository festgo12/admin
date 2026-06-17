import { OrdersTable } from '@/components/admin/orders-table';

export default function OrdersPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">
          Monitor all P2P trades, review order details, and flag suspicious activities.
        </p>
      </div>

      <OrdersTable />
    </div>
  );
}
