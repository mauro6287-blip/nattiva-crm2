import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Send } from 'lucide-react'
import Link from 'next/link'
import { getCampaigns, processCampaignMock } from '@/app/actions/marketing/campaigns'
import { Badge } from '@/components/ui/badge'
import { ProcessCampaignButton } from './process-button'

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
    const campaigns = await getCampaigns() as any[]

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campañas de Marketing</h1>
                    <p className="text-muted-foreground">Gestiona tus comunicados masivos.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/campanas/crear">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Campaña
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Campañas</CardTitle>
                </CardHeader>
                <CardContent>
                    {!campaigns || campaigns.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No tienes campañas creadas.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns.map((c) => (
                                <div key={c.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-base font-medium">{c.name}</p>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        {/* @ts-ignore */}
                                        <p className="text-sm text-muted-foreground">Asunto: {c.marketing_templates?.subject || 'Sin asunto'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Segmento: {JSON.stringify(c.segment_criteria)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-right text-muted-foreground">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </div>
                                        {c.status === 'draft' && (
                                            <ProcessCampaignButton id={c.id} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-800',
        scheduled: 'bg-blue-100 text-blue-800',
        sent: 'bg-green-100 text-green-800',
        processing: 'bg-yellow-100 text-yellow-800'
    }
    return <Badge className={styles[status] || styles.draft} variant="secondary">{status}</Badge>
}
