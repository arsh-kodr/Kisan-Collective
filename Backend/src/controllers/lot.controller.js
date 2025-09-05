const Lot = require("../models/lot.model");
const Listing = require("../models/listing.model");
const Bid = require("../models/bid.model");
const mongoose = require("mongoose");
const { scheduleLotClosure } = require("../utils/auctionScheduler");
const { getIO } = require("../config/socket");
const {
  getPagination,
  parseSort,
  escapeRegex,
} = require("../utils/pagination");

// ===============================
// Create Lot (FPO pools listings)
// ===============================
const createLot = async (req, res) => {
  try {
    const { name, listings: listingIds = [], basePrice, endTime } = req.body;

    if (!name) return res.status(400).json({ message: "Lot name is required" });
    if (!Array.isArray(listingIds) || listingIds.length === 0)
      return res.status(400).json({ message: "Select at least one listing" });

    const listings = await Listing.find({
      _id: { $in: listingIds },
      status: "open",
      lot: null,
    });

    if (listings.length !== listingIds.length) {
      return res.status(400).json({ message: "Some listings are invalid or already pooled" });
    }

    const totalQuantity = listings.reduce((sum, l) => sum + (l.quantityKg || 0), 0);

    const lot = await Lot.create({
      name,
      listings: listings.map((l) => l._id),
      fpo: req.user.sub,
      totalQuantity,
      basePrice: basePrice || 0,
      endTime: endTime ? new Date(endTime) : undefined,
      status: "open",
    });

    // Mark listings as pooled
    await Listing.updateMany(
      { _id: { $in: listings.map((l) => l._id) } },
      { $set: { status: "pooled", lot: lot._id } }
    );

    // Notify via socket
    const io = getIO();
    io.emit("lot:new", lot);

    // Optional: schedule closure
    if (typeof scheduleLotClosure === "function") {
      scheduleLotClosure(io, lot);
    }

    res.status(201).json({ message: "Lot created successfully", lot });
  } catch (err) {
    console.error("Error in createLot:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get All Lots
// ===============================
const getLots = async (req, res) => {
  try {
    const { status = "open", crop, minPrice, maxPrice, sort = "-createdAt" } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const sortObj = parseSort(sort);

    const match = {};
    if (status) match.status = status;
    if (minPrice || maxPrice) {
      match.basePrice = {};
      if (minPrice) match.basePrice.$gte = Number(minPrice);
      if (maxPrice) match.basePrice.$lte = Number(maxPrice);
    }

    const pipeline = [{ $match: match }];

    pipeline.push({
      $lookup: {
        from: "listings",
        localField: "listings",
        foreignField: "_id",
        as: "listings",
      },
    });

    if (crop) {
      pipeline.push({
        $match: {
          "listings.crop": { $regex: `^${escapeRegex(crop)}`, $options: "i" },
        },
      });
    }

    pipeline.push({
      $lookup: {
        from: "bids",
        let: { lotId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$lot", "$$lotId"] } } },
          { $sort: { amount: -1, createdAt: 1 } },
          { $limit: 1 },
          { $project: { amount: 1, bidder: 1, createdAt: 1 } },
        ],
        as: "highestBid",
      },
    });

    pipeline.push({ $addFields: { highestBid: { $arrayElemAt: ["$highestBid", 0] } } });

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "highestBid.bidder",
        foreignField: "_id",
        as: "highestBid.bidderInfo",
      },
    });

    pipeline.push({
      $addFields: {
        "highestBid.bidder": { $arrayElemAt: ["$highestBid.bidderInfo", 0] },
      },
    });

    pipeline.push({ $project: { "highestBid.bidderInfo": 0 } });

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "fpo",
        foreignField: "_id",
        as: "fpo",
      },
    });

    pipeline.push({ $addFields: { fpo: { $arrayElemAt: ["$fpo", 0] } } });

    pipeline.push({
      $project: {
        name: 1,
        totalQuantity: 1,
        basePrice: 1,
        status: 1,
        listings: 1,
        createdAt: 1,
        "fpo._id": 1,
        "fpo.username": 1,
        "highestBid.amount": 1,
        "highestBid.createdAt": 1,
        "highestBid.bidder._id": 1,
        "highestBid.bidder.username": 1,
      },
    });

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $sort: sortObj }, { $skip: skip }, { $limit: limit }],
      },
    });

    const aggResult = await Lot.aggregate(pipeline).allowDiskUse(true).exec();

    const totalDocs = aggResult[0].metadata[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(totalDocs / limit), 1);
    const lots = aggResult[0].data || [];

    return res.json({
      lots,
      pagination: { page, limit, totalPages, totalDocs },
    });
  } catch (err) {
    console.error("Error fetching lots:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get My Lots
// ===============================
const getMyLots = async (req, res) => {
  try {
    const lots = await Lot.find({ fpo: req.user.sub })
      .populate("fpo", "username email")
      .populate("listings");

    const lotsWithHighestBid = await Promise.all(
      lots.map(async (lot) => {
        const highestBid = await Bid.findOne({ lot: lot._id })
          .sort({ amount: -1 })
          .populate("bidder", "username email");

        return { ...lot.toObject(), highestBid: highestBid || null };
      })
    );

    return res.json(lotsWithHighestBid);
  } catch (err) {
    console.error("Error fetching FPO lots:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Close Lot
// ===============================
const closeLot = async (req, res) => {
  try {
    const { lotId } = req.params;
    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (lot.status !== "open") return res.status(400).json({ message: "Lot already closed" });

    const topBid = await Bid.findOne({ lot: lotId }).sort({ amount: -1 });
    lot.status = "closed";
    lot.winningBid = topBid?._id || null;
    await lot.save();

    const io = getIO();
    io.to(`lot:${lotId}`).emit(`lot:closed:${lotId}`, { winningBid: topBid });
    io.emit("lot:closed", lot._id);

    res.json({ message: "Lot closed successfully", lot, winner: topBid });
  } catch (err) {
    console.error("Error closing lot:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get Lot By ID
// ===============================
const getLotById = async (req, res) => {
  try {
    const { id } = req.params;

    const lot = await Lot.findById(id)
      .populate("fpo", "username email")
      .populate("listings");

    if (!lot) return res.status(404).json({ message: "Lot not found" });

    const bids = await Bid.find({ lot: id }).sort({ amount: -1 }).populate("bidder", "username email");

    res.json({ ...lot.toObject(), bids });
  } catch (err) {
    console.error("Error fetching lot details:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Auto-close Lot
// ===============================
const autoCloseLot = async (lotId) => {
  try {
    const lot = await Lot.findById(lotId);
    if (!lot || lot.status !== "open") return;

    const topBid = await Bid.findOne({ lot: lotId }).sort({ amount: -1 });

    lot.status = "closed";
    lot.winningBid = topBid?._id || null;
    await lot.save();

    const io = getIO();
    io.to(`lot:${lotId}`).emit(`lot:closed:${lotId}`, { winningBid: topBid });
    io.emit("lot:closed", lot._id);

    console.log(`Lot ${lotId} auto-closed`);
  } catch (err) {
    console.error("Error in autoCloseLot:", err);
  }
};

// ===============================
// Pool Listings Into Lot
// ===============================
const poolListingsIntoLot = async (req, res) => {
  try {
    const { lotId, listingIds } = req.body;

    if (!lotId) return res.status(400).json({ message: "lotId is required" });
    if (!Array.isArray(listingIds) || listingIds.length === 0)
      return res.status(400).json({ message: "No listings provided" });

    const lot = await Lot.findOne({ _id: lotId, fpo: req.user.sub });
    if (!lot) return res.status(404).json({ message: "Lot not found or unauthorized" });

    const listings = await Listing.find({ _id: { $in: listingIds }, status: "open", lot: null });
    if (listings.length !== listingIds.length) {
      return res.status(400).json({ message: "Some listings are invalid or already pooled" });
    }

    lot.listings.push(...listings.map((l) => l._id));

    const totalQuantity = await Listing.aggregate([
      { $match: { _id: { $in: lot.listings } } },
      { $group: { _id: null, total: { $sum: "$quantityKg" } } },
    ]);

    lot.totalQuantity = totalQuantity[0]?.total || lot.totalQuantity || 0;
    await lot.save();

    await Listing.updateMany({ _id: { $in: listingIds } }, { $set: { status: "pooled", lot: lot._id } });

    const io = getIO();
    io.emit("lot:updated", lot);

    await lot.populate("listings fpo");

    res.json(lot);
  } catch (err) {
    console.error("Error pooling listings into lot:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createLot,
  getLots,
  getMyLots,
  closeLot,
  getLotById,
  autoCloseLot,
  poolListingsIntoLot,
};
