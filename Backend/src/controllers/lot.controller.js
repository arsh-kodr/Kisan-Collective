const Lot = require("../models/lot.model");
const Listing = require("../models/listing.model");
const Bid = require("../models/bid.model");
const mongoose = require('mongoose');
const { getPagination, parseSort, escapeRegex } = require('../utils/pagination');

// ===============================
// Create Lot (FPO pools listings)
// ===============================
const createLot = async (req, res) => {
  try {
    const { name, listingId } = req.body;
    if (!name) return res.status(400).json({ message: "Lot name is required" });
    if (!listingId || !listingId.length)
      return res.status(400).json({ message: "Select at least one listing" });

    // Fetch open listings not already pooled
    const listings = await Listing.find({
      _id: { $in: listingId },
      status: "open",
      lot: null,
    });

    if (!listings.length) {
      return res.status(400).json({ message: "No eligible listings to pool" });
    }

    // Compute total quantity
    const totalQuantity = listings.reduce(
      (sum, l) => sum + (l.quantityKg || 0),
      0
    );

    // Create lot
    const lot = await Lot.create({
      name,
      fpo: req.user.sub,
      listings: listings.map((l) => l._id),
      totalQuantity,
      status: "open",
    });

    // Mark listings as pooled and link to lot
    await Listing.updateMany(
      { _id: { $in: listings.map((l) => l._id) } },
      { $set: { status: "pooled", lot: lot._id } }
    );

    res.status(201).json({ message: "Lot created successfully", lot });
  } catch (err) {
    console.error("Error in createLot:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get All Lots (buyers/FPOs)
// ===============================
const getLots = async (req, res) => {
  try {
    const {
      status = 'open',
      crop,
      minPrice,
      maxPrice,
      sort = '-createdAt',
    } = req.query;

    const { page, limit, skip } = getPagination(req.query);
    const sortObj = parseSort(sort);

    // Build match stage
    const match = {};
    if (status) match.status = status;

    if (typeof minPrice !== 'undefined' || typeof maxPrice !== 'undefined') {
      match.basePrice = {};
      if (typeof minPrice !== 'undefined') match.basePrice.$gte = Number(minPrice);
      if (typeof maxPrice !== 'undefined') match.basePrice.$lte = Number(maxPrice);
    }

    if (crop) {
      // listings is an array of ObjectIds referencing Listing; use lookup to filter later.
      // We'll filter by matching listings.crop with regex via $lookup pipeline below.
    }

    /**
     * Aggregation pipeline:
     * - Optional: lookup listings (and optionally filter by crop)
     * - Lookup highest bid via pipeline, populate bidder minimal
     * - Lookup fpo minimal
     * - Project minimal fields
     * - Sort + paginate (via facet)
     */
    const pipeline = [];

    // Match lots by status and basePrice if provided
    pipeline.push({ $match: match });

    // Lookup listings documents
    pipeline.push({
      $lookup: {
        from: 'listings',
        localField: 'listings',
        foreignField: '_id',
        as: 'listings',
      },
    });

    // If crop filter provided, restrict lots that have at least one listing matching crop
    if (crop) {
      pipeline.push({
        $match: {
          'listings.crop': { $regex: `^${escapeRegex(crop)}`, $options: 'i' },
        },
      });
    }

    // Lookup highest bid for each lot
    pipeline.push({
      $lookup: {
        from: 'bids',
        let: { lotId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$lot', '$$lotId'] } } },
          { $sort: { amount: -1, createdAt: 1 } },
          { $limit: 1 },
          { $project: { amount: 1, bidder: 1, createdAt: 1 } }
        ],
        as: 'highestBid'
      }
    });

    // Unwind highestBid array to object (or null)
    pipeline.push({
      $addFields: { highestBid: { $arrayElemAt: ['$highestBid', 0] } }
    });

    // Populate highestBid.bidder minimal info
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'highestBid.bidder',
        foreignField: '_id',
        as: 'highestBid.bidderInfo'
      }
    });
    pipeline.push({
      $addFields: { 'highestBid.bidder': { $arrayElemAt: ['$highestBid.bidderInfo', 0] } }
    });
    pipeline.push({ $project: { 'highestBid.bidderInfo': 0 } });

    // Populate fpo minimal info
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'fpo',
        foreignField: '_id',
        as: 'fpo'
      }
    });
    pipeline.push({ $addFields: { fpo: { $arrayElemAt: ['$fpo', 0] } } });

    // Project only needed fields to keep response compact
    pipeline.push({
      $project: {
        name: 1,
        totalQuantity: 1,
        basePrice: 1,
        status: 1,
        listings: 1,
        createdAt: 1,
        'fpo._id': 1,
        'fpo.username': 1,
        'highestBid.amount': 1,
        'highestBid.createdAt': 1,
        'highestBid.bidder._id': 1,
        'highestBid.bidder.username': 1,
      }
    });

    // Facet: metadata + data (with sort -> skip -> limit)
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: sortObj },
          { $skip: skip },
          { $limit: limit }
        ]
      }
    });

    const aggResult = await Lot.aggregate(pipeline).allowDiskUse(true).exec();

    const totalDocs = (aggResult[0].metadata[0] && aggResult[0].metadata[0].total) ? aggResult[0].metadata[0].total : 0;
    const totalPages = Math.max(Math.ceil(totalDocs / limit), 1);
    const lots = aggResult[0].data || [];

    return res.json({
      lots,
      pagination: { page, limit, totalPages, totalDocs },
    });
  } catch (err) {
    console.error('Error fetching lots:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ===============================
// Get Lots created by this FPO
// ===============================
const getMyLots = async (req, res) => {
  try {
    const lots = await Lot.find({ fpo: req.user._id })
      .populate("fpo", "username email")
      .populate("listings");

    const lotsWithHighestBid = await Promise.all(
      lots.map(async (lot) => {
        const highestBid = await Bid.findOne({ lot: lot._id })
          .sort({ amount: -1 })
          .populate("bidder", "username email");

        return {
          ...lot.toObject(),
          highestBid: highestBid || null,
        };
      })
    );

    res.json(lotsWithHighestBid);
  } catch (err) {
    console.error("Error fetching FPO lots:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Close Auction (FPO action)
// ===============================
const closeLot = async (req, res) => {
  try {
    const { lotId } = req.params;

    const lot = await Lot.findById(lotId).populate("listings");
    if (!lot) return res.status(404).json({ message: "Lot not found" });

    if (lot.status !== "open") {
      return res
        .status(400)
        .json({ message: "Lot already closed or processed" });
    }

    // Find highest bid
    const topBid = await Bid.findOne({ lot: lotId })
      .sort({ amount: -1 })
      .populate("bidder", "username email");

    if (!topBid) {
      // No bids placed
      lot.status = "closed";
      await lot.save();
      return res.json({ message: "Lot closed with no bids", lot });
    }

    // Set winning bid + close lot
    lot.status = "closed";
    lot.winningBid = topBid._id;
    await lot.save();

    res.json({
      message: "Lot closed successfully. Winner declared.",
      lot,
      winner: topBid,
    });
  } catch (err) {
    console.error("Error in closeLot:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get lot by ID
// ===============================
const getLotById = async (req, res) => {
  try {
    const { id } = req.params;

    const lot = await Lot.findById(id)
      .populate("fpo", "username email")
      .populate("listings"); // so you get crop, quantityKg, etc.

    if (!lot) return res.status(404).json({ message: "Lot not found" });

    // fetch bids for this lot
    const bids = await Bid.find({ lot: id })
      .sort({ amount: -1 })
      .populate("bidder", "username email");

    res.json({
      ...lot.toObject(),
      bids, // attach bids array
    });
  } catch (err) {
    console.error("Error fetching lot details:", err);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  createLot,
  getLots,
  getMyLots,
  closeLot,
  getLotById,   
};