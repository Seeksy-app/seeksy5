import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

const events = [
  { id: 1, name: "Smith Wedding", date: "2025-12-15", space: "Grand Ballroom", color: "#2C6BED" },
  { id: 2, name: "TechCorp Meeting", date: "2025-12-18", space: "Conference Hall A", color: "#10B981" },
  { id: 3, name: "Johnson Anniversary", date: "2025-12-20", space: "Garden Terrace", color: "#8B5CF6" },
  { id: 4, name: "New Year Gala", date: "2025-12-31", space: "Grand Ballroom", color: "#F59E0B" },
  { id: 5, name: "Corporate Retreat", date: "2025-12-22", space: "Main Hall", color: "#EF4444" },
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function VenueCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // December 2025
  const [view, setView] = useState<"month" | "week" | "day">("month");

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentDate);

  return (
    <VenueLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600">View and manage your venue schedule</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Calendar Controls */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                  {monthName}
                </h2>
                <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={view === "month" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setView("month")}
                >
                  Month
                </Button>
                <Button 
                  variant={view === "week" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setView("week")}
                >
                  Week
                </Button>
                <Button 
                  variant={view === "day" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setView("day")}
                >
                  Day
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isToday = day === 11 && currentDate.getMonth() === 11 && currentDate.getFullYear() === 2025;
                
                return (
                  <div 
                    key={index}
                    className={`min-h-[100px] p-2 rounded-lg border ${
                      day ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div 
                              key={event.id}
                              className="text-xs p-1 rounded truncate text-white"
                              style={{ backgroundColor: event.color }}
                            >
                              {event.name}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.name}</p>
                  <p className="text-sm text-gray-600">{event.space}</p>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </VenueLayout>
  );
}
