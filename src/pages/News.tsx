import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const mockNews = [
  { id: 1, title: "Alumni Spotlight: Building at Scale", date: "2025-09-01" },
  { id: 2, title: "ISE Meetup — Berlin Recap", date: "2025-08-24" },
  { id: 3, title: "Open Roles at Partner Companies", date: "2025-08-10" },
];

const News = () => {
  return (
    <div>
      <h1 className="text-2xl tracking-tight mb-6 text-[#126E56]">NEWS</h1>

      <Card className="border-2 border-foreground shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="tracking-tight">Latest</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {mockNews.map((item, idx) => (
              <li key={item.id} className="py-4">
                <div className="flex justify-between">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs">{item.date}</span>
                </div>
                {idx < mockNews.length - 1 && <Separator className="my-4" />}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default News;


