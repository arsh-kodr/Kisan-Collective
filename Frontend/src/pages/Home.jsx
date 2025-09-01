import React from "react";
import { Link } from "react-router-dom";

export default function Home(){
  return (
    <div className="text-center space-y-4">
      <h1 className="text-3xl font-bold">KissanCollective</h1>
      <p>Buy and sell via auctions — connect FPOs to buyers.</p>
      <Link to="/lots" className="inline-block bg-green-600 text-white px-4 py-2 rounded">Browse Lots</Link>
    </div>
  );
}
