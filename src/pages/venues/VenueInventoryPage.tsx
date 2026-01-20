import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

const inventoryItems = [
  { id: 1, name: "Round Tables (60\")", category: "Furniture", quantity: 50, reserved: 12, unit: "each", cost: 150, status: "available" },
  { id: 2, name: "Chiavari Chairs - Gold", category: "Furniture", quantity: 300, reserved: 150, unit: "each", cost: 45, status: "available" },
  { id: 3, name: "White Linens - Round", category: "Linens", quantity: 100, reserved: 30, unit: "each", cost: 25, status: "available" },
  { id: 4, name: "Centerpiece Vases", category: "Decor", quantity: 40, reserved: 38, unit: "each", cost: 35, status: "low" },
  { id: 5, name: "String Lights (100ft)", category: "Lighting", quantity: 20, reserved: 5, unit: "sets", cost: 75, status: "available" },
  { id: 6, name: "Dance Floor Panels", category: "Equipment", quantity: 50, reserved: 50, unit: "panels", cost: 100, status: "unavailable" },
  { id: 7, name: "Portable Bar", category: "Equipment", quantity: 3, reserved: 1, unit: "each", cost: 500, status: "available" },
  { id: 8, name: "Champagne Flutes", category: "Glassware", quantity: 500, reserved: 200, unit: "each", cost: 5, status: "available" },
];

const categories = ["All", "Furniture", "Linens", "Decor", "Lighting", "Equipment", "Glassware"];

const stats = [
  { label: "Total Items", value: "8", icon: Package },
  { label: "Available", value: "6", icon: CheckCircle },
  { label: "Low Stock", value: "1", icon: AlertTriangle },
];

export default function VenueInventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-700">Available</Badge>;
      case "low":
        return <Badge className="bg-yellow-100 text-yellow-700">Low Stock</Badge>;
      case "unavailable":
        return <Badge className="bg-red-100 text-red-700">Unavailable</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <VenueLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600">Track and manage your venue equipment and supplies</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Item</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Total</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Reserved</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Available</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Cost</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </td>
                      <td className="p-4 text-gray-600">{item.category}</td>
                      <td className="p-4 text-gray-600">{item.quantity} {item.unit}</td>
                      <td className="p-4 text-gray-600">{item.reserved}</td>
                      <td className="p-4 font-medium text-gray-900">{item.quantity - item.reserved}</td>
                      <td className="p-4 text-gray-600">${item.cost}</td>
                      <td className="p-4">{getStatusBadge(item.status)}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </VenueLayout>
  );
}
