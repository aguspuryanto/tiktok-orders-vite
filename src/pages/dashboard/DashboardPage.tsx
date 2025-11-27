// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';

interface Order {
  id: number;
  order_id: string;
  order_status: 'AWAITING_COLLECTION' | 'COMPLETED' | 'CANCELLED' | string;
  update_time: string;
  order_sync: boolean;
  created_date: string;
}

// Define columns
const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "order_id",
    header: "ORDER ID",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("order_id")}</div>
    ),
  },
  {
    accessorKey: "order_status",
    header: "STATUS",
    cell: ({ row }) => {
      const status = row.getValue("order_status") as string
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${
          status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status.replace(/_/g, ' ')}
        </span>
      )
    },
  },
  {
    accessorKey: "update_time",
    header: "UPDATED",
    cell: ({ row }) => (
      <div>{new Date(parseInt(row.getValue("update_time")) * 1000).toLocaleString('id-ID')}</div>
    ),
  },
  {
    accessorKey: "order_sync",
    header: "SYNC STATUS",
    cell: ({ row }) => (
      <div>{row.getValue("order_sync") ? '✅' : '❌'}</div>
    ),
  },
]

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Group orders by date (keeping your existing grouping logic)
  const ordersByDate = useMemo(() => {
    return orders.reduce((groups, order) => {
      const date = new Date(parseInt(order.update_time) * 1000).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
      return groups;
    }, {} as Record<string, Order[]>);
  }, [orders]);

  const [stats, setStats] = useState({
    total: 0,
    awaitingCollection: 0,
    completed: 0,
    cancelled: 0,
    synced: 0
  })

  // Initialize the table
  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/rindex.php?r=tiktok/api-order');
        const result = await response.json();
        
        if (result && Array.isArray(result.order_list)) {
          const orders = result.order_list; // Access the order_list array
          setOrders(orders);
          
          // Calculate statistics
          const stats = {
            total: orders.length,
            awaitingCollection: orders.filter(order => order.order_status === 'AWAITING_COLLECTION').length,
            completed: orders.filter(order => order.order_status === 'COMPLETED').length,
            cancelled: orders.filter(order => order.order_status === 'CANCELLED').length,
            synced: orders.filter(order => order.order_sync).length
          };
          setStats(stats);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
        // Handle error state if needed
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">TikTok Orders</h2>
        <p className="text-muted-foreground">
          Overview of your TikTok orders and their status.
        </p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.awaitingCollection}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.synced}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Data Table */}
      <div className="rounded-md border">
        <div className="flex items-center justify-between p-4">
          <Input
            placeholder="Filter orders by ID..."
            value={(table.getColumn('order_id')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('order_id')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between p-4 text-sm text-muted-foreground">
          <div>
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}