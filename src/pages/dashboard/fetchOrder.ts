import { useState, useEffect } from 'react';

export interface Order {
    id: number;
    order_id: string;
    order_status: 'AWAITING_COLLECTION' | 'COMPLETED' | 'CANCELLED' | 'IN TRANSIT' | string;
    update_time: string;
    order_sync: boolean;
    created_date: string;
}

export interface OrderStats {
    total: number;
    awaitingCollection: number;
    completed: number;
    cancelled: number;
    synced: number;
}

export const useFetchOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<OrderStats>({
        total: 0,
        awaitingCollection: 0,
        completed: 0,
        cancelled: 0,
        synced: 0
    });

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/rindex.php?r=tiktok/api-order');
            const result = await response.json();

            if (result && Array.isArray(result.order_list)) {
                const ordersData = result.order_list;
                setOrders(ordersData);

                // Calculate statistics
                const newStats = {
                    total: ordersData.length,
                    awaitingCollection: ordersData.filter((order: Order) => order.order_status === 'AWAITING_COLLECTION').length,
                    completed: ordersData.filter((order: Order) => order.order_status === 'COMPLETED').length,
                    cancelled: ordersData.filter((order: Order) => order.order_status === 'CANCELLED').length,
                    intransit: ordersData.filter((order: Order) => order.order_status === 'IN TRANSIT').length,
                    synced: ordersData.filter((order: Order) => order.order_sync).length
                };
                setStats(newStats);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return { orders, loading, stats, setOrders, setStats, refetch: fetchOrders };
};
