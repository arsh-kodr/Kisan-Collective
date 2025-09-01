import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";

export default function Lots(){
  const [lots, setLots] = useState([]);
  useEffect(()=>{
    const load = async ()=> {
      const res = await api.get("/lots");
      setLots(res.data.lots || res.data);
    }
    load();
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Open Lots</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lots.map(l=>(
          <div key={l._id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">{l.name}</h3>
            <p>FPO: {l.fpo?.username || l.fpo}</p>
            <p>Quantity: {l.totalQuantity}</p>
            <Link to={`/lots/${l._id}`} className="mt-2 inline-block text-sm text-blue-600">View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
