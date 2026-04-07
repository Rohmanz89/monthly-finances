import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-48 bg-gray-800 text-white h-screen p-4">
      <Link to="/">Dashboard</Link><br />
      <Link to="/transactions">Transactions</Link><br />
      <Link to="/categories">Categories</Link><br />
      <Link to="/settings">Settings</Link>
    </div>
  );
}
