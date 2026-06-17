'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2 } from 'lucide-react';

export type TrendData = {
  date: string;
  student_count: number;
  instructor_count: number;
  admin_count: number;
};

export type TopOrg = {
  organization_name: string;
  domain: string;
  student_count: number;
  status: string;
};

type Props = {
  trendData: TrendData[];
  topOrgs: TopOrg[];
};

export default function OverviewCharts({ trendData, topOrgs }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Kayıt Trendi Grafiği */}
      <Card className="bg-card/50 border-border backdrop-blur-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Son 30 Günlük Kayıt Trendi</CardTitle>
          <CardDescription>Platforma yeni katılan öğrenci ve hoca sayıları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] min-h-[300px] w-full mt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888" 
                  fontSize={12} 
                  tickFormatter={(val) => {
                    const parts = val.split(' ');
                    return `${parts[0]} ${parts[1]}`; // Sadece "03 May" göster
                  }}
                />
                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="student_count" name="Öğrenci" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="instructor_count" name="Hoca" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Üniversite */}
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Top 5 Üniversite</CardTitle>
          <CardDescription>En çok aktif öğrenciye sahip kurumlar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden bg-background/40">
            <Table>
              <TableHeader className="bg-muted/30 border-b border-border/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Üniversite</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Öğrenci</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOrgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4 text-sm">
                      Veri bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  topOrgs.map((org, i) => (
                    <TableRow key={i} className="border-border/40 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-muted-foreground/70" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-foreground/90 truncate max-w-[150px]">
                              {org.organization_name}
                            </div>
                            <div className="text-xs text-muted-foreground">@{org.domain}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono bg-background border-border/60 text-muted-foreground">
                          {org.student_count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
