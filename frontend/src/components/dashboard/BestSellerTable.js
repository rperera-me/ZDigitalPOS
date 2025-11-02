export default function BestSellerTable({ products = [] }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">Best Sellers</h3>
      {products.length === 0 ? (
        <p>No best sellers.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b p-1">Name</th>
              <th className="border-b p-1">Supplier</th>
              <th className="border-b p-1">Quantity Sold</th>
            </tr>
          </thead>
          <tbody>
            {products.map(({ name, supplier, qty }) => (
              <tr key={name}>
                <td className="border-b p-1">{name}</td>
                <td className="border-b p-1">{supplier}</td>
                <td className="border-b p-1">{qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}