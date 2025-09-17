import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "../components/ui/skeleton"
import { Calendar, MapPin, User, Scale, DollarSign } from 'lucide-react'
import config from '../config/config'

const {API_BASE} = config

const TotalListing = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/listings`)
      setListings(response.data.listings)
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch listings. Please try again later.")
      setLoading(false)
      console.error(err)
    }
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(price)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Available Listings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchListings}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Available Listings</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {listings.length} {listings.length === 1 ? 'Listing' : 'Listings'}
        </Badge>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">No listings available</h2>
          <p className="text-gray-500">Check back later for new listings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {listing.photos && listing.photos.length > 0 ? (
                <img 
                  src={listing.photos[0]} 
                  alt={listing.crop} 
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{listing.crop}</CardTitle>
                  <Badge 
                    variant={listing.status === "open" ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {listing.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-1" />
                  {listing.createdBy?.username || 'Unknown user'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Scale className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {listing.quantityKg} kg ({listing.unit})
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Harvested on {formatDate(listing.harvestDate)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{listing.location}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="font-semibold text-green-700">
                      {formatPrice(listing.expectedPricePerKg)} / kg
                    </span>
                  </div>
                  
                  {listing.mandiPriceAtEntry && (
                    <div className="text-sm text-gray-600">
                      Mandi price: {formatPrice(listing.mandiPriceAtEntry)} / kg
                    </div>
                  )}
                  
                  {listing.lot && (
                    <div className="text-sm">
                      Lot: <Badge variant="outline">{listing.lot.name}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default TotalListing