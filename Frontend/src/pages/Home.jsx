import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Wheat,
  TrendingUp,
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  Star,
  ArrowRight,
  Gavel,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [stats, setStats] = useState({
    farmers: 1250,
    buyers: 890,
    activeLots: 45,
    totalTrade: 25.6,
  });

  // Mock data for active lots
  const activeLots = [
    {
      id: 1,
      crop: "Organic Wheat",
      quantity: "500 tons",
      currentBid: "₹28,500/ton",
      bidsCount: 12,
      timeLeft: "2h 45m",
      location: "Punjab",
      fpo: "Green Valley FPO",
    },
    {
      id: 2,
      crop: "Basmati Rice",
      quantity: "200 tons",
      currentBid: "₹45,200/ton",
      bidsCount: 8,
      timeLeft: "5h 12m",
      location: "Haryana",
      fpo: "Golden Grain FPO",
    },
    {
      id: 3,
      crop: "Fresh Tomatoes",
      quantity: "50 tons",
      currentBid: "₹15,800/ton",
      bidsCount: 15,
      timeLeft: "1h 23m",
      location: "Maharashtra",
      fpo: "Harvest Hub FPO",
    },
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Farmer from Punjab",
      content:
        "Through KissanCollective, I got 25% better prices for my wheat crop. The FPO system made it so easy!",
      rating: 5,
    },
    {
      name: "Priya Enterprises",
      role: "Grain Buyer",
      content:
        "Transparent bidding process and direct connection with quality produce. Highly recommended!",
      rating: 5,
    },
    {
      name: "Sunflower FPO",
      role: "Farmer Producer Organization",
      content:
        "Managing lots and connecting our farmers to buyers has never been this efficient.",
      rating: 5,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animate stats on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        farmers: 1250,
        buyers: 890,
        activeLots: 45,
        totalTrade: 25.6,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-medium">
                🌾 India's Leading Crop Trading Platform
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="block">Welcome to</span>
                <span className="block text-yellow-300">KissanCollective</span>
              </h1>
              <p className="text-xl lg:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed">
                Empowering farmers through FPOs to connect directly with buyers
                via transparent bidding auctions
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/lots")}
                size="lg"
                className="bg-white text-green-700 hover:bg-green-50 px-8 py-4 text-lg font-semibold"
              >
                Browse Active Lots
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => navigate("/register")}
                variant="outline"
                size="lg"
                className="border-white text-black hover:bg-white hover:text-green-700 px-8 py-4 text-lg font-semibold"
              >
                Join as FPO
                <Users className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Floating elements for visual interest */}
        <div className="absolute top-20 left-10 opacity-20">
          <Wheat className="h-16 w-16 text-yellow-300" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-20">
          <TrendingUp className="h-12 w-12 text-green-300" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-green-600 mb-2">
                {stats.farmers.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">Active Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                {stats.buyers}+
              </div>
              <div className="text-gray-600 font-medium">Verified Buyers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-orange-600 mb-2">
                {stats.activeLots}
              </div>
              <div className="text-gray-600 font-medium">Active Lots</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-purple-600 mb-2">
                ₹{stats.totalTrade}Cr+
              </div>
              <div className="text-gray-600 font-medium">Total Trade</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How KissanCollective Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, transparent, and efficient crop trading through our
              three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <Card className="h-full border-2 border-green-100 hover:border-green-300 transition-colors duration-300 hover:shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    1. FPOs Create Lots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">
                    Farmer Producer Organizations aggregate crops from multiple
                    farmers and create bidding lots with quality assurance and
                    proper documentation.
                  </CardDescription>
                </CardContent>
              </Card>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ChevronRight className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="relative">
              <Card className="h-full border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300 hover:shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gavel className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    2. Buyers Place Bids
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">
                    Verified buyers browse available lots and place competitive
                    bids in real-time auctions with full transparency and fair
                    pricing.
                  </CardDescription>
                </CardContent>
              </Card>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ChevronRight className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div>
              <Card className="h-full border-2 border-purple-100 hover:border-purple-300 transition-colors duration-300 hover:shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    3. Secure Transaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">
                    Winning bidders complete secure payments while farmers get
                    guaranteed prices with timely settlements and quality
                    assurance.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Active Lots Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Live Auctions
              </h2>
              <p className="text-xl text-gray-600">
                Browse and bid on active crop lots right now
              </p>
            </div>
            <Button onClick={() => navigate("/lots")} variant="outline" className="hidden sm:flex">
              View All Lots
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeLots.map((lot) => (
              <Card
                key={lot.id}
                className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-green-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {lot.crop}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-1">
                        {lot.quantity} • {lot.fpo}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-200"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {lot.timeLeft}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Current Bid:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {lot.currentBid}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {lot.location}
                      </span>
                      <span className="text-sm text-blue-600 font-medium">
                        {lot.bidsCount} bids
                      </span>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Place Bid
                      <TrendingUp className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Button variant="outline">
              View All Lots
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-green-100">
              Real experiences from farmers, FPOs, and buyers
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map(
                    (_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    )
                  )}
                </div>
                <blockquote className="text-lg lg:text-xl mb-6 text-white leading-relaxed">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="text-green-100">
                  <div className="font-semibold text-white">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-sm">
                    {testimonials[currentTestimonial].role}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? "bg-white" : "bg-white/40"
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Transform Your Crop Trading?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers, FPOs, and buyers who are already
            benefiting from transparent, efficient crop trading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-green-50 px-8 py-4 text-lg font-semibold"
            >
              Start Trading Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-4 text-lg font-semibold"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
