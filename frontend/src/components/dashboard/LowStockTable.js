export default function LowStockTable({ items = [] }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">Low Stock Items</h3>
      {items.length === 0 ? (
        <p>No low stock items.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b p-1">Barcode</th>
              <th className="border-b p-1">Item</th>
              <th className="border-b p-1">Available</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ barcode, item, available }) => (
              <tr key={barcode}>
                <td className="border-b p-1">{barcode}</td>
                <td className="border-b p-1">{item}</td>
                <td className="border-b p-1">{available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
