import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [myLots, setMyLots] = useState([]);
  const [error, setError] = useState(null);
  const [lotsLoading, setLotsLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // wait for user to load

    const loadLots = async () => {
      if (user.role === "fpo") {
        try {
          setLotsLoading(true);
          const res = await api.get("/lots/me/lots");
          setMyLots(res.data.lots || []);
          setError(null);
        } catch (err) {
          if (err.response?.status === 401) {
            setError("Session expired. Please log in again.");
          } else {
            setError("Failed to load your lots.");
          }
        } finally {
          setLotsLoading(false);
        }
      }
    };

    loadLots();
  }, [user]);

  if (loading) return <div className="p-4">Loading user...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Dashboard</h2>
      <p>Welcome, {user?.username || user?.email}</p>

      {user?.role === "fpo" && (
        <>
          <h3 className="mt-4">Your Lots</h3>
          {lotsLoading ? (
            <p>Loading lots...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <div>
              {myLots.map((l) => (
                <div key={l._id} className="bg-white p-2 my-2 rounded">
                  <div>
                    {l.name} — {l.status}
                  </div>
                  <Link to={`/lots/${l._id}`} className="text-blue-600 text-sm">
                    View
                  </Link>
                </div>
              ))}
              {myLots.length === 0 && <p>No lots created yet.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
