import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Map = () => {
  return (
    <div>
      <h1 className="text-2xl tracking-tight mb-6 text-[#1BA165]">MAP</h1>

      <Card className="border-2 border-foreground shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="tracking-tight">Alumni Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[16/9] w-full border-2 border-dashed border-foreground grid place-items-center">
            <span className="text-xs">Map placeholder</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Map;


