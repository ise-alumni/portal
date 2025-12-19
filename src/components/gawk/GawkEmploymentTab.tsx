import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Loader2, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getCohortBadgeClass } from '@/lib/utils/ui';

interface EmploymentBreakdownItem {
  segment: string;
  employed: number;
  entrepreneur: number;
  open: number;
  unknown: number;
}

interface FieldChangeFrequencyItem {
  field: string;
  count: number;
}

interface TopJobTitle {
  title: string;
  count: number;
}

interface CohortBreakdownItem {
  cohort: string;
  total: number;
  employedRate: number;
  entrepreneurRate: number;
  openRate: number;
}

interface CohortProgramBreakdownItem {
  cohort: string;
  total: number;
  bscCount: number;
  mscCount: number;
  bscRate: number;
  mscRate: number;
}

interface GawkEmploymentTabProps {
  dataLoading: boolean;
  analyticsLoading: boolean;
  employmentBreakdown: EmploymentBreakdownItem[];
  fieldChangeFrequency: FieldChangeFrequencyItem[];
  topJobTitles: TopJobTitle[];
  cohortBreakdown: CohortBreakdownItem[];
  cohortProgramBreakdown: CohortProgramBreakdownItem[];
}

export const GawkEmploymentTab = memo(function GawkEmploymentTab({
  dataLoading,
  analyticsLoading,
  employmentBreakdown,
  fieldChangeFrequency,
  topJobTitles,
  cohortBreakdown,
  cohortProgramBreakdown,
}: GawkEmploymentTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Employment & entrepreneurship rate</CardTitle>
            <CardDescription>Overall vs BSc vs MSc</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ChartContainer
                config={{
                  employed: { label: 'Employed', color: 'hsl(var(--chart-1))' },
                  entrepreneur: { label: 'Entrepreneur', color: 'hsl(var(--chart-2))' },
                  open: { label: 'Open to work', color: 'hsl(var(--chart-3))' },
                  unknown: { label: 'Unknown', color: 'hsl(var(--chart-4))' },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employmentBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="employed" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="entrepreneur" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="open" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="unknown" stackId="a" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Field change frequency</CardTitle>
            <CardDescription>Which profile fields are being updated the most</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : fieldChangeFrequency.length > 0 ? (
              <ChartContainer
                config={{
                  count: { label: 'Changes', color: 'hsl(var(--chart-1))' },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fieldChangeFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="field" />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No change data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top job titles</CardTitle>
            <CardDescription>Most common current titles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : topJobTitles.length > 0 ? (
              topJobTitles.map((item) => (
                <div key={item.title} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{item.title}</p>
                  </div>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No job title data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cohort Employment</CardTitle>
            <CardDescription>Employment + entrepreneurship share by cohort</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cohortBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cohort data yet</p>
            ) : (
              cohortBreakdown.map((row) => (
                <div key={row.cohort} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={getCohortBadgeClass(Number(row.cohort)) + ' text-xs'}
                    >
                      Cohort {row.cohort}
                    </Badge>
                    <Badge variant="outline">{row.total} ppl</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Employed</span>
                      <span className="font-medium">{row.employedRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entrepreneur</span>
                      <span className="font-medium">{row.entrepreneurRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Open to work</span>
                      <span className="font-medium">{row.openRate}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cohort Program Mix</CardTitle>
            <CardDescription>BSc vs MSc share within each cohort</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cohortProgramBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cohort data yet</p>
            ) : (
              cohortProgramBreakdown.map((row) => (
                <div key={row.cohort} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={getCohortBadgeClass(Number(row.cohort)) + ' text-xs'}
                    >
                      Cohort {row.cohort}
                    </Badge>
                    <Badge variant="outline">{row.total} ppl</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>BSc</span>
                      <span className="font-medium">
                        {row.bscCount} ({row.bscRate}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>MSc</span>
                      <span className="font-medium">
                        {row.mscCount} ({row.mscRate}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}););

