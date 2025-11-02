using Microsoft.AspNetCore.SignalR;

namespace PosSystem.Hubs
{
    public class PosHub : Hub
    {
        public async Task NotifyStockUpdated(int productId, int newStock)
        {
            await Clients.All.SendAsync("StockUpdated", productId, newStock);
        }

        public async Task NotifySaleAdded(int saleId)
        {
            await Clients.All.SendAsync("SaleAdded", saleId);
        }

        // Add further notifications as needed (e.g., sale held, updated)
    }
}
