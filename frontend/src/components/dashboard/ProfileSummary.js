export default function ProfileSummary({ date, time, store, user, address, phone }) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-col items-center">
      <div className="text-2xl font-bold mb-1">{date}</div>
      <div className="text-4xl font-extrabold tracking-widest mb-2">{time}</div>
      <div className="text-green-700 font-semibold mb-2">{user}</div>
      <div><b>Store:</b> {store}</div>
      <div><b>Address:</b> {address}<br />{phone}</div>
    </div>
  );
}
