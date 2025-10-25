import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockEvents = [
  { id: 1, name: "Monthly AMA", date: "2025-09-30", location: "Online" },
  { id: 2, name: "Hack Night", date: "2025-10-12", location: "NYC" },
  { id: 3, name: "Career Roundtable", date: "2025-11-05", location: "Remote" },
];

const Events = () => {
  return (
    <div>
      <h1 className="text-2xl tracking-tight mb-6 text-[#0C314C]">EVENTS</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockEvents.map((e) => (
          <Card key={e.id} className="border-2 border-foreground shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="tracking-tight">{e.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-3">{e.date} — {e.location}</div>
              <Button className="w-full">Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Events;


