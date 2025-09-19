// src/controllers/lot.controller.js
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
const { qtyToKg } = require("../utils/units");
const { finalizeLotClosure } = require("../services/lot.service");

// ===============================
// Create Lot (FPO pools listings)
// ===============================
const createLot = async (req, res) => {
  try {
    const { name, listings: listingIds = [], basePrice, endTime } = req.body;

    if (!name) return res.status(400).json({ message: "Lot name is required" });
    if (!Array.isArray(listingIds) || listingIds.length === 0)
      return res.status(400).json({ message: "Select at least one listing" });

    if (endTime) {
      const parsed = new Date(endTime);
      if (isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return res
          .status(400)
          .json({ message: "endTime must be a valid future date" });
      }
    }

    if (basePrice !== undefined && basePrice !== null) {
      if (Number(basePrice) < 0 || Number.isNaN(Number(basePrice))) {
        return res
          .status(400)
          .json({ message: "basePrice must be a valid non-negative number" });
      }
    }

    const listings = await Listing.find({
      _id: { $in: listingIds },
      status: "open",
      lot: null,
    });

    if (listings.length !== listingIds.length) {
      return res
        .status(400)
        .json({ message: "Some listings are invalid or already pooled" });
    }

    let totalValue = 0;
    let totalQty = 0;

    listings.forEach((l) => {
      const qty =
        typeof l.quantity === "number" && l.unit
          ? qtyToKg(l.quantity, l.unit)
          : l.quantityKg
          ? l.quantityKg
          : 0;

      const pricePerKg = l.expectedPricePerKg || l.mandiPriceAtEntry || 0;

      totalValue += pricePerKg * qty;
      totalQty += qty;
    });

    const calculatedBasePrice =
      totalQty > 0 ? Math.round(totalValue / totalQty) : 0;

    const finalBasePrice =
      basePrice !== undefined && basePrice !== null
        ? Number(basePrice)
        : calculatedBasePrice;

    const totalQuantity = listings.reduce((sum, l) => {
      const qty =
        typeof l.quantity === "number" && l.unit
          ? qtyToKg(l.quantity, l.unit)
          : l.quantityKg
          ? l.quantityKg
          : 0;
      return sum + qty;
    }, 0);

    const lotPayload = {
      name,
      listings: listings.map((l) => l._id),
      fpo: req.user.sub,
      totalQuantity,
      basePrice: finalBasePrice,
      status: "open",
      winningBid: null,
    };
    if (endTime) lotPayload.endTime = new Date(endTime);

    const lot = await Lot.create(lotPayload);

    await Listing.updateMany(
      { _id: { $in: listings.map((l) => l._id) } },
      { $set: { status: "pooled", lot: lot._id } }
    );

    const io = getIO();

    // 🔔 Global broadcast: a new lot is available
    io.emit("lot:new", {
      _id: lot._id,
      name: lot.name,
      basePrice: lot.basePrice,
      totalQuantity: lot.totalQuantity,
      status: lot.status,
      fpo: lot.fpo,
      createdAt: lot.createdAt,
      endTime: lot.endTime,
    });

    // 🔔 Room-specific: initialize empty details
    io.to(`lot:${lot._id}`).emit("lot:details:init", {
      _id: lot._id,
      name: lot.name,
      basePrice: lot.basePrice,
      totalQuantity: lot.totalQuantity,
      status: lot.status,
      listings: lot.listings,
    });

    if (typeof scheduleLotClosure === "function" && lot.endTime) {
      scheduleLotClosure(lot);
    }

    res.status(201).json({
      message: "Lot created successfully",
      lot,
      calculatedBasePrice,
    });
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
    const {
      status = "open",
      crop,
      minPrice,
      maxPrice,
      sort = "-createdAt",
    } = req.query;
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
          "listings.crop": {
            $regex: `^${escapeRegex(crop)}`,
            $options: "i",
          },
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

    pipeline.push({
      $addFields: { highestBid: { $arrayElemAt: ["$highestBid", 0] } },
    });

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
        endTime: 1,
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
// Get My Lots (FPO)
// ===============================
const getMyLots = async (req, res) => {
  try {
    const fpoId = mongoose.Types.ObjectId(req.user.sub);

    const pipeline = [
      { $match: { fpo: fpoId } },
      {
        $lookup: {
          from: "listings",
          localField: "listings",
          foreignField: "_id",
          as: "listings",
        },
      },
      {
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
      },
      { $addFields: { highestBid: { $arrayElemAt: ["$highestBid", 0] } } },
      {
        $lookup: {
          from: "users",
          localField: "highestBid.bidder",
          foreignField: "_id",
          as: "highestBid.bidderInfo",
        },
      },
      {
        $addFields: {
          "highestBid.bidder": { $arrayElemAt: ["$highestBid.bidderInfo", 0] },
        },
      },
      { $project: { "highestBid.bidderInfo": 0 } },
    ];

    const lots = await Lot.aggregate(pipeline).allowDiskUse(true).exec();
    return res.json(lots);
  } catch (err) {
    console.error("Error fetching FPO lots:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Close Lot (manual by FPO)
// ===============================
const closeLot = async (req, res) => {
  try {
    const { lotId } = req.params;

    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (String(lot.fpo) !== String(req.user.sub)) {
      return res
        .status(403)
        .json({ message: "Not authorized to close this lot" });
    }

    const result = await finalizeLotClosure(lotId, req.user.sub);
    if (!result)
      return res
        .status(400)
        .json({ message: "Lot already closed or cannot be closed" });

    const io = getIO();
    // 🔔 Notify all users in the lot room
    io.to(`lot:${lotId}`).emit("lot:closed", {
      lotId,
      winner: result.winningBid,
    });

    res.json({
      message: "Lot closed successfully",
      lot: result.lot,
      winner: result.winningBid,
    });
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
      .populate("listings")
      .populate({
        path: "winningBid",
        populate: { path: "bidder", select: "username email" },
      });

    if (!lot) return res.status(404).json({ message: "Lot not found" });

    const bids = await Bid.find({ lot: id })
      .sort({ amount: -1 })
      .populate("bidder", "username email");

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
    const result = await finalizeLotClosure(lotId, "system");
    if (result) {
      const io = getIO();
      io.to(`lot:${lotId}`).emit("lot:closed", {
        lotId,
        winner: result.winningBid,
      });
      console.log(`Lot ${lotId} auto-closed`);
    }
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
    if (!lot)
      return res.status(404).json({ message: "Lot not found or unauthorized" });

    const listings = await Listing.find({
      _id: { $in: listingIds },
      status: "open",
      lot: null,
    });
    if (listings.length !== listingIds.length) {
      return res
        .status(400)
        .json({ message: "Some listings are invalid or already pooled" });
    }

    const existingIds = new Set(lot.listings.map((id) => String(id)));
    const toAdd = listings
      .map((l) => String(l._id))
      .filter((id) => !existingIds.has(id));
    lot.listings.push(...toAdd);

    const allListings = await Listing.find({ _id: { $in: lot.listings } });
    const totalQty = allListings.reduce((sum, l) => {
      const qty =
        typeof l.quantity === "number" && l.unit
          ? qtyToKg(l.quantity, l.unit)
          : l.quantityKg
          ? l.quantityKg
          : 0;
      return sum + qty;
    }, 0);

    lot.totalQuantity = totalQty;
    await lot.save();

    await Listing.updateMany(
      { _id: { $in: listingIds } },
      { $set: { status: "pooled", lot: lot._id } }
    );

    const io = getIO();
    // 🔔 Notify all users inside this lot room
    io.to(`lot:${lot._id}`).emit("lot:updated", {
      _id: lot._id,
      name: lot.name,
      totalQuantity: lot.totalQuantity,
      basePrice: lot.basePrice,
      status: lot.status,
      listings: lot.listings,
    });

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
