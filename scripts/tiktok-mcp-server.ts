import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// KONFIGURASI: Ganti URL ini dengan URL backend PHP Anda yang sebenarnya
const API_BASE_URL = "https://eworld.dxn2u.com"; //"http://localhost:8000";

// Membuat instance server MCP
const server = new McpServer({
    name: "tiktok-orders-integration",
    version: "1.0.0",
});

/**
 * Tool 1: Mengambil data pesanan TikTok
 * Ini membungkus endpoint: /api/rindex.php?r=tiktok/api-order
 */
server.tool(
    "get_tiktok_orders",
    "Mengambil daftar pesanan TikTok terbaru beserta statusnya",
    {}, // Tidak ada parameter input
    async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/rindex.php?r=tiktok/api-order`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Format data untuk AI
            // Kita bisa memfilter atau memformat ulang data di sini jika perlu
            const orders = data.order_list || [];

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(orders, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Gagal mengambil data pesanan: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

/**
 * Tool 2: Sinkronisasi Pesanan
 * Ini membungkus endpoint: /api/rindex.php?r=tiktok/sync-order-id&order_id=...
 */
server.tool(
    "sync_tiktok_order",
    "Melakukan sinkronisasi manual untuk satu pesanan TikTok berdasarkan Order ID",
    {
        order_id: z.string().describe("ID Pesanan TikTok yang akan disinkronisasi"),
    },
    async ({ order_id }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/rindex.php?r=tiktok/sync-order-id&order_id=${order_id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Gagal sinkronisasi pesanan ${order_id}: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

// Menjalankan server menggunakan transport stdio (standar input/output)
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("TikTok MCP Server berjalan via stdio...");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
