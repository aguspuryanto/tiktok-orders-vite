// src/pages/dashboard/DashboardPage.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox"
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
import { useFetchOrders, Order } from './fetchOrder';

export default function DashboardPage() {
  const { orders, loading, stats, refetch } = useFetchOrders();
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Define columns inside component to access refetch
  const columns = useMemo<ColumnDef<Order>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
          <span className={`px-2 py-1 text-xs rounded-full ${status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
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
        <div className="flex items-center space-x-2">
          <span>{row.getValue("order_sync") ? '✅' : '❌'}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const orderId = row.getValue("order_id");
                const response = await fetch(`/api/rindex.php?r=tiktok/sync-order-id&order_id=${orderId}`);
                const result = await response.json();

                if (result.success) {
                  refetch();
                }
              } catch (error) {
                console.error('Error syncing order:', error);
              }
            }}
            disabled={row.getValue("order_sync")}
          >
            {row.getValue("order_sync") ? 'Synced' : 'Sync Now'}
          </Button>
        </div>
      ),
    },
  ], [refetch]);

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
          <select
            value={(table.getColumn('order_status')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('order_status')?.setFilterValue(event.target.value || undefined)
            }
            className="max-w-sm border rounded-md p-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="AWAITING_COLLECTION">Awaiting Collection</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="IN TRANSIT">In Transit</option>
          </select>
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
                table.getRowModel().rows.map((row, rowIndex) => (
                  <TableRow
                    key={`${row.id}_${rowIndex}`}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={`${cell.id}_${rowIndex}`}>
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