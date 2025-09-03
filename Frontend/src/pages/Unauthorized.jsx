// src/pages/Unauthorized.jsx
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <h1 className="text-6xl font-extrabold text-red-600 mb-4 animate-bounce">
        403
      </h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        Access Denied
      </h2>
      <p className="text-gray-600 max-w-md mb-6">
        Sorry, you don’t have permission to view this page.  
        If you think this is a mistake, please contact support.
      </p>

      <Link
        to="/"
        className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition"
      >
        ⬅ Back to Home
      </Link>
    </div>
  );
}
